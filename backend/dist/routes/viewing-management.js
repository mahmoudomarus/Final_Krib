"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../lib/supabase");
const NotificationService_1 = require("../services/NotificationService");
const router = express_1.default.Router();
const notificationService = new NotificationService_1.NotificationService();
router.post('/track-view', auth_1.authMiddleware, async (req, res) => {
    try {
        const { propertyId, viewType = 'online', durationSeconds = 0, deviceInfo = {}, referrerSource, pageViews = 1, imagesViewed = 0, contactFormOpened = false, phoneNumberRevealed = false } = req.body;
        const viewerId = req.user?.id;
        const ipAddress = req.ip;
        const { data: property } = await supabase_1.supabase
            .from('properties')
            .select('host_id')
            .eq('id', propertyId)
            .single();
        const viewData = {
            property_id: propertyId,
            viewer_id: viewerId,
            agent_id: property?.host_id,
            view_type: viewType,
            duration_seconds: durationSeconds,
            device_info: deviceInfo,
            referrer_source: referrerSource,
            ip_address: ipAddress,
            page_views: pageViews,
            images_viewed: imagesViewed,
            contact_form_opened: contactFormOpened,
            phone_number_revealed: phoneNumberRevealed
        };
        const { data: view, error } = await supabase_1.supabase
            .from('property_views')
            .insert(viewData)
            .select()
            .single();
        if (error) {
            console.error('Error tracking property view:', error);
            return res.status(500).json({ error: 'Failed to track view' });
        }
        res.json({ success: true, data: view });
    }
    catch (error) {
        console.error('Error in track-view:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/analytics/:propertyId', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { period = '30' } = req.query;
        const userId = req.user?.id;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        const { data: analytics, error } = await supabase_1.supabase
            .from('property_views')
            .select(`
        *,
        properties!inner(title, host_id)
      `)
            .eq('property_id', propertyId)
            .gte('view_date', startDate.toISOString())
            .order('view_date', { ascending: false });
        if (error) {
            console.error('Error fetching analytics:', error);
            return res.status(500).json({ error: 'Failed to fetch analytics' });
        }
        const totalViews = analytics?.length || 0;
        const uniqueViewers = new Set(analytics?.map(v => v.viewer_id).filter(Boolean)).size;
        const avgDuration = analytics?.length ?
            Math.round(analytics.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) / analytics.length) : 0;
        const contactFormOpens = analytics?.filter(v => v.contact_form_opened).length || 0;
        const phoneReveals = analytics?.filter(v => v.phone_number_revealed).length || 0;
        const dailyViews = analytics?.reduce((acc, view) => {
            const date = new Date(view.view_date).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {}) || {};
        const { data: viewings } = await supabase_1.supabase
            .from('property_viewings')
            .select('*')
            .eq('property_id', propertyId)
            .gte('scheduled_date', startDate.toISOString().split('T')[0]);
        const scheduledViewings = viewings?.length || 0;
        const completedViewings = viewings?.filter(v => v.status === 'completed').length || 0;
        const metrics = {
            totalViews,
            uniqueViewers,
            avgDuration,
            contactFormOpens,
            phoneReveals,
            scheduledViewings,
            completedViewings,
            conversionRate: totalViews > 0 ? Math.round((scheduledViewings / totalViews) * 100 * 100) / 100 : 0,
            dailyViews,
            period: parseInt(period)
        };
        res.json({ success: true, data: metrics });
    }
    catch (error) {
        console.error('Error fetching property analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/schedule-viewing', auth_1.authMiddleware, async (req, res) => {
    try {
        const { propertyId, agentId, clientId, scheduledDate, scheduledTime, durationMinutes = 60, viewingType = 'physical', clientName, clientPhone, clientEmail, notes, specialRequirements } = req.body;
        const viewingData = {
            property_id: propertyId,
            agent_id: agentId,
            client_id: clientId,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            duration_minutes: durationMinutes,
            viewing_type: viewingType,
            client_name: clientName,
            client_phone: clientPhone,
            client_email: clientEmail,
            notes,
            special_requirements: specialRequirements,
            status: 'scheduled'
        };
        const { data: viewing, error } = await supabase_1.supabase
            .from('property_viewings')
            .insert(viewingData)
            .select(`
        *,
        properties(title, address, city, emirate),
        users!property_viewings_client_id_fkey(first_name, last_name, email, phone)
      `)
            .single();
        if (error) {
            console.error('Error scheduling viewing:', error);
            return res.status(500).json({ error: 'Failed to schedule viewing' });
        }
        await supabase_1.supabase
            .from('agent_availability_slots')
            .update({
            is_booked: true,
            booking_id: viewing.id
        })
            .eq('agent_id', agentId)
            .eq('date', scheduledDate)
            .eq('start_time', scheduledTime);
        res.json({
            success: true,
            data: viewing,
            message: 'Viewing scheduled successfully'
        });
    }
    catch (error) {
        console.error('Error scheduling viewing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/calendar/:agentId', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { agentId } = req.params;
        const { startDate, endDate } = req.query;
        const userId = req.user?.id;
        if (agentId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { data: viewings, error: viewingsError } = await supabase_1.supabase
            .from('property_viewings')
            .select(`
        *,
        properties(id, title, address, city, emirate, images),
        users!property_viewings_client_id_fkey(first_name, last_name, email, phone)
      `)
            .eq('agent_id', agentId)
            .gte('scheduled_date', start)
            .lte('scheduled_date', end)
            .order('scheduled_date', { ascending: true });
        const { data: bookingEvents, error: bookingsError } = await supabase_1.supabase
            .from('booking_calendar_events')
            .select(`
        *,
        properties(id, title, address, city, emirate, images),
        users!booking_calendar_events_guest_id_fkey(first_name, last_name, email, phone),
        bookings(check_in, check_out, total_amount, status)
      `)
            .eq('agent_id', agentId)
            .gte('event_date', start)
            .lte('event_date', end)
            .order('event_date', { ascending: true });
        const calendarEvents = [
            ...(viewings || []).map(viewing => ({
                id: viewing.id,
                title: `Property Viewing - ${viewing.properties?.title || 'Property'}`,
                type: 'viewing',
                date: viewing.scheduled_date,
                time: viewing.scheduled_time,
                duration: viewing.duration_minutes,
                status: viewing.status,
                property: {
                    id: viewing.properties?.id,
                    title: viewing.properties?.title,
                    address: `${viewing.properties?.address || ''}, ${viewing.properties?.city || ''}, ${viewing.properties?.emirate || ''}`.trim(),
                    images: viewing.properties?.images || []
                },
                client: {
                    id: viewing.client_id,
                    name: viewing.client_name || `${viewing.users?.first_name || ''} ${viewing.users?.last_name || ''}`.trim(),
                    phone: viewing.client_phone || viewing.users?.phone,
                    email: viewing.client_email || viewing.users?.email
                },
                notes: viewing.notes,
                specialRequirements: viewing.special_requirements,
                viewingType: viewing.viewing_type
            })),
            ...(bookingEvents || []).map(event => ({
                id: event.id,
                title: event.title || `${event.event_type} - ${event.properties?.title || 'Property'}`,
                type: event.event_type,
                date: event.event_date,
                time: event.event_time,
                duration: 60,
                status: event.status,
                property: {
                    id: event.properties?.id,
                    title: event.properties?.title,
                    address: `${event.properties?.address || ''}, ${event.properties?.city || ''}, ${event.properties?.emirate || ''}`.trim(),
                    images: event.properties?.images || []
                },
                client: {
                    id: event.guest_id,
                    name: `${event.users?.first_name || ''} ${event.users?.last_name || ''}`.trim(),
                    phone: event.users?.phone,
                    email: event.users?.email
                },
                booking: event.bookings,
                description: event.description
            }))
        ].sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
            const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
            return dateA.getTime() - dateB.getTime();
        });
        res.json({ success: true, data: calendarEvents });
    }
    catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/availability/:agentId', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { agentId } = req.params;
        const { date } = req.query;
        const userId = req.user?.id;
        if (agentId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const targetDate = date || new Date().toISOString().split('T')[0];
        const { data: availability, error } = await supabase_1.supabase
            .from('agent_availability_slots')
            .select('*')
            .eq('agent_id', agentId)
            .eq('date', targetDate)
            .order('start_time', { ascending: true });
        if (error) {
            console.error('Error fetching availability:', error);
            return res.status(500).json({ error: 'Failed to fetch availability' });
        }
        res.json({ success: true, data: availability || [] });
    }
    catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/availability/:agentId', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { agentId } = req.params;
        const { date, timeSlots } = req.body;
        const userId = req.user?.id;
        if (agentId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!date || !timeSlots || !Array.isArray(timeSlots)) {
            return res.status(400).json({ error: 'Date and time slots are required' });
        }
        await supabase_1.supabase
            .from('agent_availability_slots')
            .delete()
            .eq('agent_id', agentId)
            .eq('date', date);
        const availabilityData = timeSlots.map((slot) => ({
            agent_id: agentId,
            date,
            start_time: slot.startTime,
            end_time: slot.endTime,
            is_available: slot.isAvailable !== false,
            notes: slot.notes || null
        }));
        const { data: availability, error } = await supabase_1.supabase
            .from('agent_availability_slots')
            .insert(availabilityData)
            .select();
        if (error) {
            console.error('Error setting availability:', error);
            return res.status(500).json({ error: 'Failed to set availability' });
        }
        res.json({
            success: true,
            data: availability,
            message: 'Availability updated successfully'
        });
    }
    catch (error) {
        console.error('Error setting availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/viewing/:viewingId/status', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { viewingId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user?.id;
        const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const updateData = {
            status,
            updated_at: new Date().toISOString()
        };
        if (notes)
            updateData.notes = notes;
        const { data: viewing, error } = await supabase_1.supabase
            .from('property_viewings')
            .update(updateData)
            .eq('id', viewingId)
            .eq('agent_id', userId)
            .select()
            .single();
        if (error) {
            console.error('Error updating viewing status:', error);
            return res.status(500).json({ error: 'Failed to update viewing status' });
        }
        if (status === 'cancelled' || status === 'completed') {
            await supabase_1.supabase
                .from('agent_availability_slots')
                .update({ is_booked: false, booking_id: null })
                .eq('booking_id', viewingId);
        }
        res.json({
            success: true,
            data: viewing,
            message: `Viewing ${status} successfully`
        });
    }
    catch (error) {
        console.error('Error updating viewing status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/viewing/:viewingId/feedback', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { viewingId } = req.params;
        const { clientRating, clientFeedback, clientInterestLevel, agentNotes, propertyConditionNotes, followUpRequired, followUpDate, nextAction, bookingLikelihood } = req.body;
        const feedbackData = {
            viewing_id: viewingId,
            client_rating: clientRating,
            client_feedback: clientFeedback,
            client_interest_level: clientInterestLevel,
            agent_notes: agentNotes,
            property_condition_notes: propertyConditionNotes,
            follow_up_required: followUpRequired,
            follow_up_date: followUpDate,
            next_action: nextAction,
            booking_likelihood: bookingLikelihood
        };
        const { data: feedback, error } = await supabase_1.supabase
            .from('viewing_feedback')
            .insert(feedbackData)
            .select()
            .single();
        if (error) {
            console.error('Error adding viewing feedback:', error);
            return res.status(500).json({ error: 'Failed to add feedback' });
        }
        res.json({
            success: true,
            data: feedback,
            message: 'Feedback added successfully'
        });
    }
    catch (error) {
        console.error('Error adding viewing feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/analytics/summary/:agentId', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { agentId } = req.params;
        const { period = '30' } = req.query;
        const userId = req.user?.id;
        if (agentId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        const { data: viewings } = await supabase_1.supabase
            .from('property_viewings')
            .select('*')
            .eq('agent_id', agentId)
            .gte('scheduled_date', startDate.toISOString().split('T')[0]);
        const { data: propertyViews } = await supabase_1.supabase
            .from('property_views')
            .select('*')
            .eq('agent_id', agentId)
            .gte('view_date', startDate.toISOString());
        const totalViewings = viewings?.length || 0;
        const completedViewings = viewings?.filter(v => v.status === 'completed').length || 0;
        const cancelledViewings = viewings?.filter(v => v.status === 'cancelled' || v.status === 'no_show').length || 0;
        const totalPropertyViews = propertyViews?.length || 0;
        const uniqueViewers = new Set(propertyViews?.map(v => v.viewer_id).filter(Boolean)).size;
        const summary = {
            totalViewings,
            completedViewings,
            cancelledViewings,
            completionRate: totalViewings > 0 ? Math.round((completedViewings / totalViewings) * 100) : 0,
            totalPropertyViews,
            uniqueViewers,
            conversionRate: totalPropertyViews > 0 ? Math.round((totalViewings / totalPropertyViews) * 100 * 100) / 100 : 0,
            period: parseInt(period)
        };
        res.json({ success: true, data: summary });
    }
    catch (error) {
        console.error('Error fetching analytics summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/viewing-requests', async (req, res) => {
    try {
        const { propertyId, propertyTitle, guestName, guestEmail, guestPhone, requestedDate, requestedTime, message, agentId } = req.body;
        if (!propertyId || !guestName || !guestEmail || !guestPhone || !requestedDate || !requestedTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const viewingRequestData = {
            property_id: propertyId,
            property_title: propertyTitle,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone,
            requested_date: requestedDate,
            requested_time: requestedTime,
            message: message || '',
            agent_id: agentId,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        console.log('📝 Attempting to insert viewing request:', viewingRequestData);
        const { data: viewingRequest, error } = await supabase_1.supabaseAdmin
            .from('viewing_requests')
            .insert(viewingRequestData)
            .select()
            .single();
        if (error) {
            console.error('❌ Error creating viewing request:', error);
            console.error('❌ Full error details:', JSON.stringify(error, null, 2));
            return res.status(500).json({ error: 'Failed to create viewing request' });
        }
        console.log('✅ Viewing request created successfully:', viewingRequest.id);
        if (agentId) {
            try {
                await notificationService.sendViewingRequest(agentId, guestName, propertyTitle, requestedDate, requestedTime, viewingRequest.id);
                console.log(`Viewing request notification sent to agent ${agentId}`);
            }
            catch (notificationError) {
                console.error('Error sending viewing request notification:', notificationError);
            }
        }
        res.json({
            success: true,
            data: viewingRequest,
            message: 'Viewing request submitted successfully'
        });
    }
    catch (error) {
        console.error('Error creating viewing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/viewing-requests/:agentId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { agentId } = req.params;
        const userId = req.user?.id;
        if (agentId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { data: viewingRequests, error } = await supabase_1.supabaseAdmin
            .from('viewing_requests')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching viewing requests:', error);
            return res.status(500).json({ error: 'Failed to fetch viewing requests' });
        }
        const transformedRequests = (viewingRequests || []).map(request => ({
            id: request.id,
            propertyId: request.property_id,
            propertyTitle: request.property_title,
            guestName: request.guest_name,
            guestEmail: request.guest_email,
            guestPhone: request.guest_phone,
            requestedDate: request.requested_date,
            requestedTime: request.requested_time,
            status: request.status,
            message: request.message,
            createdAt: request.created_at
        }));
        res.json({
            success: true,
            data: transformedRequests
        });
    }
    catch (error) {
        console.error('Error fetching viewing requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/viewing-requests/:requestId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const userId = req.user?.id;
        if (!['confirmed', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const { data: viewingRequest, error } = await supabase_1.supabaseAdmin
            .from('viewing_requests')
            .update({
            status,
            updated_at: new Date().toISOString()
        })
            .eq('id', requestId)
            .eq('agent_id', userId)
            .select()
            .single();
        if (error) {
            console.error('Error updating viewing request:', error);
            return res.status(500).json({ error: 'Failed to update viewing request' });
        }
        try {
            if (status === 'confirmed') {
                await notificationService.sendViewingConfirmed(viewingRequest.guest_email, viewingRequest.guest_name, viewingRequest.property_title, viewingRequest.requested_date, viewingRequest.requested_time);
            }
            else if (status === 'rejected') {
                await notificationService.sendViewingRejected(viewingRequest.guest_email, viewingRequest.guest_name, viewingRequest.property_title);
            }
            console.log(`Viewing ${status} notification sent to guest`);
        }
        catch (notificationError) {
            console.error('Error sending viewing response notification:', notificationError);
        }
        res.json({
            success: true,
            data: viewingRequest,
            message: `Viewing request ${status} successfully`
        });
    }
    catch (error) {
        console.error('Error updating viewing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=viewing-management.js.map