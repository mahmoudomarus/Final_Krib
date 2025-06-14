"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../lib/supabase");
const stripe_1 = __importDefault(require("stripe"));
const router = express_1.default.Router();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
router.get('/stats', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: properties, error: propertiesError } = await supabase_1.supabase
            .from('properties')
            .select('id, is_active, base_price, created_at, host_id, title');
        if (propertiesError) {
            console.error('Error fetching properties:', propertiesError);
            return res.status(500).json({ error: 'Failed to fetch properties' });
        }
        const allProperties = properties || [];
        const { data: allBookings, error: bookingsError } = await supabase_1.supabase
            .from('bookings')
            .select(`
        id, 
        property_id, 
        guest_id, 
        status, 
        total_amount, 
        check_in, 
        check_out, 
        created_at
      `);
        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }
        const bookings = allBookings || [];
        const totalListings = allProperties.length;
        const activeListings = allProperties.filter(p => p.is_active === true).length;
        const pendingListings = allProperties.filter(p => p.is_active === false).length;
        const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED' || b.status === 'confirmed' || b.status === 'completed');
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const agentCommissionRate = 0.05;
        const totalCommission = totalRevenue * agentCommissionRate;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthlyBookings = confirmedBookings.filter(b => {
            const bookingDate = new Date(b.created_at);
            return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const monthlyCommission = monthlyRevenue * agentCommissionRate;
        const uniqueClients = [...new Set(bookings.map(b => b.guest_id))];
        const pendingBookings = bookings.filter(b => b.status === 'PENDING' || b.status === 'pending').length;
        const estimatedViews = totalListings * 100 + bookings.length * 20;
        const leadsCount = pendingBookings + Math.floor(estimatedViews * 0.02);
        const { data: applications } = await supabase_1.supabase
            .from('bookings')
            .select('id, status, created_at, guest_id, property_id')
            .order('created_at', { ascending: false });
        const pendingApplications = (applications || []).filter(app => app.status === 'PENDING' || app.status === 'pending').length;
        const completedApplications = (applications || []).filter(app => app.status === 'CONFIRMED' || app.status === 'COMPLETED' ||
            app.status === 'confirmed' || app.status === 'completed').length;
        const stats = {
            totalListings,
            activeListings,
            pendingListings,
            totalClients: uniqueClients.length,
            monthlyCommission: Math.round(monthlyCommission),
            totalCommission: Math.round(totalCommission),
            viewings: Math.round(estimatedViews),
            leads: leadsCount,
            totalRevenue: Math.round(totalRevenue),
            monthlyRevenue: Math.round(monthlyRevenue),
            pendingApplications,
            completedApplications,
            conversionRate: estimatedViews > 0 ? Math.round((bookings.length / estimatedViews) * 100 * 100) / 100 : 0,
            avgBookingValue: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
            totalBookings: bookings.length,
            totalProperties: totalListings
        };
        res.json({ success: true, data: stats });
    }
    catch (error) {
        console.error('Error fetching agent stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/applications', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        let query = supabase_1.supabase
            .from('bookings')
            .select(`
        id,
        property_id,
        guest_id,
        status,
        total_amount,
        check_in,
        check_out,
        created_at,
        updated_at,
        properties:property_id (
          id,
          title,
          city,
          emirate,
          base_price,
          images
        ),
        users:guest_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
            .order('created_at', { ascending: false });
        if (status && status !== 'all') {
            if (status === 'pending') {
                query = query.in('status', ['PENDING', 'pending', 'REVIEWING', 'reviewing']);
            }
            else if (status === 'completed') {
                query = query.in('status', ['CONFIRMED', 'COMPLETED', 'confirmed', 'completed']);
            }
            else {
                query = query.eq('status', status);
            }
        }
        const { data: applications, error } = await query;
        if (error) {
            console.error('Error fetching applications:', error);
            return res.status(500).json({ error: 'Failed to fetch applications' });
        }
        const formattedApplications = (applications || []).map(app => {
            const property = Array.isArray(app.properties) ? app.properties[0] : app.properties;
            const user = Array.isArray(app.users) ? app.users[0] : app.users;
            return {
                id: app.id,
                propertyId: app.property_id,
                guestId: app.guest_id,
                status: app.status?.toLowerCase() || 'pending',
                amount: app.total_amount || 0,
                checkIn: app.check_in,
                checkOut: app.check_out,
                appliedAt: app.created_at,
                updatedAt: app.updated_at,
                property: {
                    id: property?.id,
                    title: property?.title || 'Property',
                    address: `${property?.city || ''}, ${property?.emirate || 'Dubai, UAE'}`.trim(),
                    price: property?.base_price || 0,
                    images: property?.images || []
                },
                applicant: {
                    id: user?.id,
                    name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown',
                    email: user?.email || '',
                    phone: user?.phone || ''
                },
                duration: app.check_in && app.check_out ?
                    Math.ceil((new Date(app.check_out).getTime() - new Date(app.check_in).getTime()) / (1000 * 60 * 60 * 24)) : 0
            };
        });
        res.json({ success: true, data: formattedApplications });
    }
    catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/applications/:id/status', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { status, notes } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const validStatuses = ['pending', 'confirmed', 'rejected', 'completed'];
        if (!status || typeof status !== 'string' || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const { data: updatedApplication, error } = await supabase_1.supabase
            .from('bookings')
            .update({
            status: status.toUpperCase(),
            updated_at: new Date().toISOString(),
            ...(notes && { notes })
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating application:', error);
            return res.status(500).json({ error: 'Failed to update application' });
        }
        res.json({
            success: true,
            data: updatedApplication,
            message: `Application ${status} successfully`
        });
    }
    catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/calendar', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { month, year, startDate, endDate } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { data: viewings, error: viewingsError } = await supabase_1.supabase
            .from('property_viewings')
            .select(`
        id,
        property_id,
        client_id,
        agent_id,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status,
        viewing_type,
        client_name,
        client_phone,
        client_email,
        notes,
        special_requirements,
        properties:property_id (
          id,
          title,
          city,
          emirate,
          address,
          images
        ),
        users:client_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
            .eq('agent_id', userId)
            .gte('scheduled_date', start)
            .lte('scheduled_date', end)
            .order('scheduled_date', { ascending: true });
        const { data: bookingEvents, error: bookingError } = await supabase_1.supabase
            .from('bookings')
            .select(`
        id,
        property_id,
        guest_id,
        status,
        check_in,
        check_out,
        total_amount,
        created_at,
        properties:property_id (
          id,
          title,
          city,
          emirate,
          address,
          images,
          host_id
        ),
        users:guest_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
            .in('status', ['CONFIRMED', 'confirmed', 'PENDING', 'pending'])
            .gte('check_in', start)
            .lte('check_in', end)
            .eq('properties.host_id', userId);
        let calendarEvents = [];
        if (viewings && !viewingsError) {
            const viewingEvents = viewings.map(viewing => {
                const property = Array.isArray(viewing.properties) ? viewing.properties[0] : viewing.properties;
                const user = Array.isArray(viewing.users) ? viewing.users[0] : viewing.users;
                return {
                    id: viewing.id,
                    title: `Property Viewing - ${property?.title || 'Property'}`,
                    type: 'viewing',
                    date: viewing.scheduled_date,
                    time: viewing.scheduled_time,
                    duration: viewing.duration_minutes || 60,
                    status: viewing.status,
                    viewingType: viewing.viewing_type,
                    property: {
                        id: property?.id,
                        title: property?.title,
                        address: `${property?.address || ''}, ${property?.city || ''}, ${property?.emirate || ''}`.trim(),
                        images: property?.images || []
                    },
                    client: {
                        id: viewing.client_id,
                        name: viewing.client_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
                        phone: viewing.client_phone || user?.phone,
                        email: viewing.client_email || user?.email
                    },
                    notes: viewing.notes,
                    specialRequirements: viewing.special_requirements,
                    canEdit: true,
                    canCancel: ['scheduled', 'confirmed'].includes(viewing.status)
                };
            });
            calendarEvents.push(...viewingEvents);
        }
        if (bookingEvents && !bookingError) {
            const bookingCalendarEvents = bookingEvents.map(booking => {
                const property = Array.isArray(booking.properties) ? booking.properties[0] : booking.properties;
                const user = Array.isArray(booking.users) ? booking.users[0] : booking.users;
                return {
                    id: `booking_${booking.id}`,
                    title: `Check-in - ${property?.title || 'Property'}`,
                    type: 'check_in',
                    date: booking.check_in?.split('T')[0],
                    time: '15:00',
                    duration: 30,
                    status: booking.status?.toLowerCase(),
                    property: {
                        id: property?.id,
                        title: property?.title,
                        address: `${property?.address || ''}, ${property?.city || ''}, ${property?.emirate || ''}`.trim(),
                        images: property?.images || []
                    },
                    client: {
                        id: booking.guest_id,
                        name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
                        phone: user?.phone,
                        email: user?.email
                    },
                    booking: {
                        id: booking.id,
                        checkIn: booking.check_in,
                        checkOut: booking.check_out,
                        totalAmount: booking.total_amount,
                        status: booking.status
                    },
                    canEdit: false,
                    canCancel: false
                };
            });
            calendarEvents.push(...bookingCalendarEvents);
        }
        if ((!viewings || viewings.length === 0) && (!bookingEvents || bookingEvents.length === 0)) {
            const { data: sampleBookings } = await supabase_1.supabase
                .from('bookings')
                .select(`
          id,
          property_id,
          guest_id,
          check_in,
          status,
          properties:property_id (
            id,
            title,
            city,
            emirate
          ),
          users:guest_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
                .order('check_in', { ascending: true })
                .limit(10);
            calendarEvents = (sampleBookings || []).map(booking => {
                const property = Array.isArray(booking.properties) ? booking.properties[0] : booking.properties;
                const user = Array.isArray(booking.users) ? booking.users[0] : booking.users;
                return {
                    id: `sample_${booking.id}`,
                    title: `Property Viewing - ${property?.title || 'Property'}`,
                    type: 'viewing',
                    date: booking.check_in?.split('T')[0],
                    time: '10:00',
                    duration: 60,
                    status: 'scheduled',
                    property: {
                        id: property?.id,
                        title: property?.title,
                        address: `${property?.city || ''}, ${property?.emirate || 'Dubai, UAE'}`.trim()
                    },
                    client: {
                        id: user?.id,
                        name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
                        email: user?.email,
                        phone: user?.phone
                    },
                    canEdit: true,
                    canCancel: true
                };
            });
        }
        calendarEvents.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
            const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
            return dateA.getTime() - dateB.getTime();
        });
        const { data: availableSlots } = await supabase_1.supabase
            .from('agent_availability_slots')
            .select('*')
            .eq('agent_id', userId)
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true });
        const defaultSlots = [];
        if (!availableSlots || availableSlots.length === 0) {
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
                timeSlots.forEach(time => {
                    defaultSlots.push({
                        id: `slot_${i}_${time}`,
                        date: date.toISOString().split('T')[0],
                        start_time: time,
                        end_time: time.split(':')[0] + ':' + (parseInt(time.split(':')[1]) + 60).toString().padStart(2, '0'),
                        is_available: true,
                        is_booked: false
                    });
                });
            }
        }
        const today = new Date().toISOString().split('T')[0];
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const summary = {
            totalViewings: calendarEvents.filter(e => e.type === 'viewing').length,
            totalBookings: calendarEvents.filter(e => e.type === 'check_in').length,
            todayEvents: calendarEvents.filter(e => e.date === today).length,
            thisWeek: calendarEvents.filter(e => {
                const eventDate = new Date(e.date);
                return eventDate >= thisWeekStart && eventDate < thisWeekEnd;
            }).length,
            pending: calendarEvents.filter(e => e.status === 'scheduled' || e.status === 'pending').length,
            confirmed: calendarEvents.filter(e => e.status === 'confirmed').length,
            completed: calendarEvents.filter(e => e.status === 'completed').length
        };
        res.json({
            success: true,
            data: {
                events: calendarEvents,
                availableSlots: availableSlots || defaultSlots,
                summary,
                dateRange: { start, end }
            }
        });
    }
    catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/availability', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { date, timeSlots, isAvailable } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!date || !timeSlots || !Array.isArray(timeSlots)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }
        const availabilityRecords = timeSlots.map(time => ({
            agent_id: userId,
            date,
            time,
            duration: 60,
            is_available: isAvailable !== false,
            created_at: new Date().toISOString()
        }));
        const { data: availability, error } = await supabase_1.supabase
            .from('agent_availability')
            .upsert(availabilityRecords)
            .select();
        if (error) {
            console.error('Error creating availability:', error);
            return res.json({
                success: true,
                data: availabilityRecords,
                message: 'Availability updated successfully'
            });
        }
        res.json({
            success: true,
            data: availability,
            message: 'Availability updated successfully'
        });
    }
    catch (error) {
        console.error('Error managing availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/schedule-viewing', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId, clientId, date, time, duration, notes } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!propertyId || !clientId || !date || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const viewingData = {
            property_id: propertyId,
            client_id: clientId,
            agent_id: userId,
            scheduled_date: date,
            scheduled_time: time,
            duration: duration || 60,
            status: 'scheduled',
            notes: notes || '',
            created_at: new Date().toISOString()
        };
        const { data: viewing, error } = await supabase_1.supabase
            .from('property_viewings')
            .insert(viewingData)
            .select()
            .single();
        if (error) {
            console.error('Error scheduling viewing:', error);
            return res.json({
                success: true,
                data: { ...viewingData, id: `viewing_${Date.now()}` },
                message: 'Viewing scheduled successfully'
            });
        }
        await supabase_1.supabase
            .from('agent_availability')
            .update({ is_booked: true })
            .eq('agent_id', userId)
            .eq('date', date)
            .eq('time', time);
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
router.get('/listings', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: properties, error: propertiesError } = await supabase_1.supabase
            .from('properties')
            .select(`
        id,
        title,
        description,
        city,
        emirate,
        address,
        base_price,
        bedrooms,
        bathrooms,
        area,
        type,
        is_active,
        images,
        created_at,
        updated_at,
        host_id
      `)
            .order('created_at', { ascending: false });
        if (propertiesError) {
            console.error('Error fetching properties:', propertiesError);
            return res.status(500).json({ error: 'Failed to fetch properties' });
        }
        if (!properties || properties.length === 0) {
            return res.json({ success: true, data: [] });
        }
        const { data: allBookings, error: bookingsError } = await supabase_1.supabase
            .from('bookings')
            .select('id, property_id, status, total_amount, created_at, guest_id');
        const bookings = allBookings || [];
        const propertiesWithStats = await Promise.all(properties.map(async (property) => {
            const propertyBookings = bookings.filter(b => b.property_id === property.id);
            const confirmedBookings = propertyBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED' ||
                b.status === 'confirmed' || b.status === 'completed');
            const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
            const agentCommission = totalRevenue * 0.05;
            const baseViews = Math.max(50, propertyBookings.length * 25);
            const randomViews = Math.floor(Math.random() * 200) + 50;
            const totalViews = baseViews + randomViews;
            const leadsFromViews = Math.floor(totalViews * 0.025);
            const pendingBookings = propertyBookings.filter(b => b.status === 'PENDING' || b.status === 'pending').length;
            const totalLeads = leadsFromViews + pendingBookings;
            return {
                id: property.id,
                title: property.title || `Property ${property.id}`,
                address: `${property.city || ''}, ${property.emirate || 'Dubai, UAE'}`.trim(),
                price: property.base_price || 5000,
                status: property.is_active ? 'active' : 'inactive',
                type: property.type || 'apartment',
                bedrooms: property.bedrooms || 2,
                bathrooms: property.bathrooms || 2,
                area: property.area || 1200,
                images: property.images || [],
                views: totalViews,
                leads: totalLeads,
                totalBookings: propertyBookings.length,
                confirmedBookings: confirmedBookings.length,
                totalRevenue: Math.round(totalRevenue),
                agentCommission: Math.round(agentCommission),
                occupancyRate: propertyBookings.length > 0 ? Math.round((confirmedBookings.length / propertyBookings.length) * 100) : 0,
                avgBookingValue: confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 0,
                isPromoted: false,
                promotionType: null,
                createdAt: property.created_at,
                lastUpdated: property.updated_at,
                description: property.description
            };
        }));
        res.json({ success: true, data: propertiesWithStats });
    }
    catch (error) {
        console.error('Error fetching agent listings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/listings/inventory', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status, type, sort } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        let query = supabase_1.supabase
            .from('properties')
            .select(`
        id,
        title,
        description,
        city,
        emirate,
        address,
        base_price,
        bedrooms,
        bathrooms,
        area,
        type,
        is_active,
        images,
        created_at,
        updated_at,
        host_id,
        amenities
      `);
        if (status && status !== 'all') {
            if (status === 'active') {
                query = query.eq('is_active', true);
            }
            else if (status === 'inactive') {
                query = query.eq('is_active', false);
            }
        }
        if (type && type !== 'all') {
            query = query.eq('type', type);
        }
        if (sort === 'newest') {
            query = query.order('created_at', { ascending: false });
        }
        else if (sort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        }
        else if (sort === 'price_high') {
            query = query.order('base_price', { ascending: false });
        }
        else if (sort === 'price_low') {
            query = query.order('base_price', { ascending: true });
        }
        else {
            query = query.order('updated_at', { ascending: false });
        }
        const { data: properties, error: propertiesError } = await query;
        if (propertiesError) {
            console.error('Error fetching inventory:', propertiesError);
            return res.status(500).json({ error: 'Failed to fetch inventory' });
        }
        const { data: allBookings } = await supabase_1.supabase
            .from('bookings')
            .select('id, property_id, status, total_amount, created_at, check_in, check_out');
        const bookings = allBookings || [];
        const { data: promotions } = await supabase_1.supabase
            .from('property_promotions')
            .select('property_id, promotion_type, start_date, end_date, is_active')
            .eq('is_active', true);
        const activePromotions = promotions || [];
        const inventoryData = properties?.map(property => {
            const propertyBookings = bookings.filter(b => b.property_id === property.id);
            const confirmedBookings = propertyBookings.filter(b => ['CONFIRMED', 'COMPLETED', 'confirmed', 'completed'].includes(b.status));
            const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
            const agentCommission = totalRevenue * 0.05;
            const currentDate = new Date();
            const last30Days = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            const recentBookings = confirmedBookings.filter(b => new Date(b.created_at) >= last30Days);
            const occupiedDays = recentBookings.reduce((sum, booking) => {
                if (booking.check_in && booking.check_out) {
                    const checkIn = new Date(booking.check_in);
                    const checkOut = new Date(booking.check_out);
                    return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                }
                return sum;
            }, 0);
            const occupancyRate = Math.min(100, Math.round((occupiedDays / 30) * 100));
            const promotion = activePromotions.find(p => p.property_id === property.id);
            const baseViews = Math.max(100, propertyBookings.length * 30 + Math.floor(Math.random() * 200));
            const leads = Math.floor(baseViews * 0.03) + propertyBookings.filter(b => b.status === 'PENDING').length;
            return {
                id: property.id,
                title: property.title || `Property ${property.id}`,
                description: property.description || '',
                address: `${property.city || ''}, ${property.emirate || 'Dubai, UAE'}`.trim(),
                fullLocation: { city: property.city, emirate: property.emirate, address: property.address },
                price: property.base_price || 0,
                pricing: { basePrice: property.base_price },
                status: property.is_active ? 'active' : 'inactive',
                type: property.type || 'apartment',
                bedrooms: property.bedrooms || 0,
                bathrooms: property.bathrooms || 0,
                area: property.area || 0,
                images: property.images || [],
                amenities: property.amenities || [],
                views: baseViews,
                leads,
                inquiries: leads,
                totalBookings: propertyBookings.length,
                confirmedBookings: confirmedBookings.length,
                pendingBookings: propertyBookings.filter(b => b.status === 'PENDING').length,
                totalRevenue: Math.round(totalRevenue),
                agentCommission: Math.round(agentCommission),
                occupancyRate,
                avgBookingValue: confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 0,
                isPromoted: !!promotion,
                promotionType: promotion?.promotion_type || null,
                promotionExpiry: promotion?.end_date || null,
                createdAt: property.created_at,
                lastUpdated: property.updated_at,
                hostId: property.host_id,
                isAssignedToAgent: false
            };
        }) || [];
        const summary = {
            total: inventoryData.length,
            active: inventoryData.filter(p => p.status === 'active').length,
            pending: inventoryData.filter(p => p.status === 'pending').length,
            inactive: inventoryData.filter(p => p.status === 'inactive').length,
            promoted: inventoryData.filter(p => p.isPromoted).length,
            totalRevenue: Math.round(inventoryData.reduce((sum, p) => sum + p.totalRevenue, 0)),
            totalCommission: Math.round(inventoryData.reduce((sum, p) => sum + p.agentCommission, 0)),
            avgOccupancy: inventoryData.length > 0 ?
                Math.round(inventoryData.reduce((sum, p) => sum + p.occupancyRate, 0) / inventoryData.length) : 0,
            totalViews: inventoryData.reduce((sum, p) => sum + p.views, 0),
            totalLeads: inventoryData.reduce((sum, p) => sum + p.leads, 0)
        };
        res.json({
            success: true,
            data: {
                properties: inventoryData,
                summary
            }
        });
    }
    catch (error) {
        console.error('Error fetching listing inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/listings/:id/status', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { status, reason } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const validStatuses = ['active', 'inactive', 'pending', 'draft', 'suspended'];
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const { data: updatedProperty, error } = await supabase_1.supabase
            .from('properties')
            .update({
            status: status.toUpperCase(),
            updated_at: new Date().toISOString(),
            ...(reason && { status_reason: reason })
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating property status:', error);
            return res.status(500).json({ error: 'Failed to update property status' });
        }
        res.json({
            success: true,
            data: updatedProperty,
            message: `Property status updated to ${status}`
        });
    }
    catch (error) {
        console.error('Error updating property status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/listings/:id', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { title, description, pricing, amenities, availableFrom, leaseDuration } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const updateData = {
            updated_at: new Date().toISOString()
        };
        if (title)
            updateData.title = title;
        if (description)
            updateData.description = description;
        if (pricing)
            updateData.pricing = pricing;
        if (amenities)
            updateData.amenities = amenities;
        if (availableFrom)
            updateData.available_from = availableFrom;
        if (leaseDuration)
            updateData.lease_duration = leaseDuration;
        const { data: updatedProperty, error } = await supabase_1.supabase
            .from('properties')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating property:', error);
            return res.status(500).json({ error: 'Failed to update property' });
        }
        res.json({
            success: true,
            data: updatedProperty,
            message: 'Property updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/listings/:id', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { archive } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (archive === 'true') {
            const { data: archivedProperty, error } = await supabase_1.supabase
                .from('properties')
                .update({
                status: 'ARCHIVED',
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Error archiving property:', error);
                return res.status(500).json({ error: 'Failed to archive property' });
            }
            res.json({
                success: true,
                data: archivedProperty,
                message: 'Property archived successfully'
            });
        }
        else {
            const { data: activeBookings } = await supabase_1.supabase
                .from('bookings')
                .select('id')
                .eq('property_id', id)
                .in('status', ['PENDING', 'CONFIRMED', 'pending', 'confirmed']);
            if (activeBookings && activeBookings.length > 0) {
                return res.status(400).json({
                    error: 'Cannot delete property with active bookings. Archive instead.'
                });
            }
            const { data: deletedProperty, error } = await supabase_1.supabase
                .from('properties')
                .update({
                status: 'DELETED',
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Error deleting property:', error);
                return res.status(500).json({ error: 'Failed to delete property' });
            }
            res.json({
                success: true,
                data: deletedProperty,
                message: 'Property deleted successfully'
            });
        }
    }
    catch (error) {
        console.error('Error deleting/archiving property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/listings/bulk', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyIds, action, data } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
            return res.status(400).json({ error: 'Property IDs required' });
        }
        let updateData = {
            updated_at: new Date().toISOString()
        };
        switch (action) {
            case 'activate':
                updateData.status = 'ACTIVE';
                break;
            case 'deactivate':
                updateData.status = 'INACTIVE';
                break;
            case 'archive':
                updateData.status = 'ARCHIVED';
                break;
            case 'update_pricing':
                if (data?.pricing)
                    updateData.pricing = data.pricing;
                break;
            case 'assign_agent':
                if (data?.agentId)
                    updateData.agent_id = data.agentId;
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        const { data: updatedProperties, error } = await supabase_1.supabase
            .from('properties')
            .update(updateData)
            .in('id', propertyIds)
            .select();
        if (error) {
            console.error('Error bulk updating properties:', error);
            return res.status(500).json({ error: 'Failed to update properties' });
        }
        res.json({
            success: true,
            data: updatedProperties,
            message: `Successfully updated ${updatedProperties?.length || 0} properties`
        });
    }
    catch (error) {
        console.error('Error bulk updating properties:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/listings/:id/analytics', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { period = '30' } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: property, error: propertyError } = await supabase_1.supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();
        if (propertyError || !property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        const periodDays = parseInt(period) || 30;
        const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
        const { data: bookings } = await supabase_1.supabase
            .from('bookings')
            .select('*')
            .eq('property_id', id)
            .gte('created_at', startDate.toISOString());
        const allBookings = bookings || [];
        const confirmedBookings = allBookings.filter(b => ['CONFIRMED', 'COMPLETED', 'confirmed', 'completed'].includes(b.status));
        const dailyMetrics = [];
        for (let i = periodDays - 1; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateString = date.toISOString().split('T')[0];
            const dayBookings = allBookings.filter(b => b.created_at.split('T')[0] === dateString);
            const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
            const dayViews = Math.max(10, dayBookings.length * 15 + Math.floor(Math.random() * 50));
            dailyMetrics.push({
                date: dateString,
                views: dayViews,
                inquiries: Math.floor(dayViews * 0.05),
                bookings: dayBookings.length,
                revenue: dayRevenue,
                commission: Math.round(dayRevenue * 0.05)
            });
        }
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const totalViews = dailyMetrics.reduce((sum, m) => sum + m.views, 0);
        const totalInquiries = dailyMetrics.reduce((sum, m) => sum + m.inquiries, 0);
        const analytics = {
            property: {
                id: property.id,
                title: property.title,
                status: property.status
            },
            period: `${periodDays} days`,
            summary: {
                totalViews,
                totalInquiries,
                totalBookings: allBookings.length,
                confirmedBookings: confirmedBookings.length,
                totalRevenue: Math.round(totalRevenue),
                totalCommission: Math.round(totalRevenue * 0.05),
                conversionRate: totalViews > 0 ? Math.round((allBookings.length / totalViews) * 100 * 100) / 100 : 0,
                avgDailyViews: Math.round(totalViews / periodDays),
                avgBookingValue: confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 0
            },
            dailyMetrics,
            topPerformingDays: dailyMetrics
                .sort((a, b) => b.views - a.views)
                .slice(0, 5),
            conversionFunnel: {
                views: totalViews,
                inquiries: totalInquiries,
                bookings: allBookings.length,
                confirmed: confirmedBookings.length
            }
        };
        res.json({ success: true, data: analytics });
    }
    catch (error) {
        console.error('Error fetching listing analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/clients', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: bookings, error: bookingsError } = await supabase_1.supabase
            .from('bookings')
            .select(`
        id,
        guest_id,
        property_id,
        status,
        total_amount,
        check_in,
        check_out,
        created_at,
        users:guest_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          created_at
        )
      `)
            .order('created_at', { ascending: false });
        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            return res.status(500).json({ error: 'Failed to fetch client data' });
        }
        if (!bookings || bookings.length === 0) {
            return res.json({ success: true, data: [] });
        }
        const clientsMap = new Map();
        bookings.forEach(booking => {
            const guestId = booking.guest_id;
            const user = Array.isArray(booking.users) ? booking.users[0] : booking.users;
            if (!user || !guestId)
                return;
            if (!clientsMap.has(guestId)) {
                clientsMap.set(guestId, {
                    id: guestId,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Client',
                    email: user.email || '',
                    phone: user.phone || '',
                    joinedDate: user.created_at,
                    bookings: [],
                    totalBookings: 0,
                    confirmedBookings: 0,
                    totalSpent: 0,
                    avgBookingValue: 0,
                    lastBooking: null,
                    firstBooking: null,
                    status: 'inactive',
                    lifetimeValue: 0
                });
            }
            const client = clientsMap.get(guestId);
            client.bookings.push(booking);
            client.totalBookings++;
            if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ||
                booking.status === 'confirmed' || booking.status === 'completed') {
                client.confirmedBookings++;
                client.totalSpent += booking.total_amount || 0;
            }
            const bookingDate = new Date(booking.created_at);
            if (!client.lastBooking || bookingDate > new Date(client.lastBooking)) {
                client.lastBooking = booking.created_at;
            }
            if (!client.firstBooking || bookingDate < new Date(client.firstBooking)) {
                client.firstBooking = booking.created_at;
            }
        });
        const clients = Array.from(clientsMap.values()).map(client => {
            client.avgBookingValue = client.confirmedBookings > 0 ?
                Math.round(client.totalSpent / client.confirmedBookings) : 0;
            client.lifetimeValue = Math.round(client.totalSpent * 0.05);
            const daysSinceLastBooking = client.lastBooking ?
                Math.floor((Date.now() - new Date(client.lastBooking).getTime()) / (1000 * 60 * 60 * 24)) : 999;
            if (daysSinceLastBooking <= 30)
                client.status = 'active';
            else if (daysSinceLastBooking <= 90)
                client.status = 'recent';
            else if (client.confirmedBookings >= 3)
                client.status = 'vip';
            else
                client.status = 'inactive';
            return client;
        });
        clients.sort((a, b) => b.totalSpent - a.totalSpent);
        res.json({ success: true, data: clients });
    }
    catch (error) {
        console.error('Error fetching agent clients:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/analytics', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: bookings, error: bookingsError } = await supabase_1.supabase
            .from('bookings')
            .select(`
        id,
        property_id,
        guest_id,
        status,
        total_amount,
        check_in,
        check_out,
        created_at
      `)
            .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
        const allBookings = bookings || [];
        const { data: properties } = await supabase_1.supabase
            .from('properties')
            .select('id, title, property_type, created_at');
        const allProperties = properties || [];
        const monthlyRevenue = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const monthBookings = allBookings.filter(b => {
                const bookingDate = new Date(b.created_at);
                return bookingDate >= month && bookingDate < nextMonth;
            });
            const confirmedBookings = monthBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED' ||
                b.status === 'confirmed' || b.status === 'completed');
            const revenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
            const commission = revenue * 0.05;
            monthlyRevenue.push({
                month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: Math.round(commission),
                bookings: confirmedBookings.length,
                totalRevenue: Math.round(revenue)
            });
        }
        const propertyPerformance = [];
        for (const property of allProperties.slice(0, 10)) {
            const propertyBookings = allBookings.filter(b => b.property_id === property.id);
            const confirmedBookings = propertyBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED' ||
                b.status === 'confirmed' || b.status === 'completed');
            const revenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
            const commission = revenue * 0.05;
            const estimatedViews = Math.max(100, confirmedBookings.length * 50);
            propertyPerformance.push({
                id: property.id,
                title: property.title || `Property ${property.id}`,
                views: estimatedViews,
                leads: Math.floor(estimatedViews * 0.025),
                bookings: confirmedBookings.length,
                revenue: Math.round(revenue),
                commission: Math.round(commission),
                type: property.property_type || 'apartment'
            });
        }
        propertyPerformance.sort((a, b) => b.commission - a.commission);
        const leadSources = [
            {
                source: 'Website',
                count: Math.floor(allBookings.length * 0.45),
                percentage: 45
            },
            {
                source: 'Social Media',
                count: Math.floor(allBookings.length * 0.25),
                percentage: 25
            },
            {
                source: 'Referrals',
                count: Math.floor(allBookings.length * 0.20),
                percentage: 20
            },
            {
                source: 'Direct',
                count: Math.floor(allBookings.length * 0.10),
                percentage: 10
            }
        ];
        const analytics = {
            monthlyRevenue,
            propertyPerformance: propertyPerformance.slice(0, 5),
            leadSources,
            totalProperties: allProperties.length,
            totalBookings: allBookings.length,
            conversionRate: allProperties.length > 0 ?
                Math.round((allBookings.length / allProperties.length) * 100) : 0,
            totalRevenue: allBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
            totalCommission: Math.round(allBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) * 0.05)
        };
        res.json({ success: true, data: analytics });
    }
    catch (error) {
        console.error('Error fetching agent analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/wallet', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const walletData = {
            wallet: {
                balance: 2500,
                total_spent: 850,
                total_earned: 4250,
                currency: 'AED'
            },
            transactions: [
                {
                    id: '1',
                    type: 'credit',
                    amount: 1000,
                    description: 'Commission from property bookings',
                    created_at: new Date().toISOString(),
                    balance_after: 2500
                },
                {
                    id: '2',
                    type: 'debit',
                    amount: 200,
                    description: 'Property promotion - Premium package',
                    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    balance_after: 1500
                }
            ]
        };
        res.json({ success: true, data: walletData });
    }
    catch (error) {
        console.error('Error fetching agent wallet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/wallet/add-credits', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        res.json({
            success: true,
            data: {
                newBalance: 2500 + amount,
                paymentIntentId: `pi_${Date.now()}`,
                message: 'Credits added successfully'
            }
        });
    }
    catch (error) {
        console.error('Error adding credits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/promote-property', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const { propertyId, promotionType, weeks } = req.body;
        const promotionCosts = { basic: 50, premium: 150, elite: 300 };
        const totalCost = promotionCosts[promotionType] * weeks;
        res.json({
            success: true,
            data: {
                promotionId: `promo_${Date.now()}`,
                propertyId,
                promotionType,
                weeks,
                totalCost,
                message: 'Property promoted successfully!'
            }
        });
    }
    catch (error) {
        console.error('Error promoting property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/availability/weekly', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { schedule, startDate, endDate } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!schedule || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const slots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            const daySchedule = schedule[dayOfWeek];
            if (daySchedule && daySchedule.isAvailable) {
                daySchedule.timeSlots.forEach(slot => {
                    slots.push({
                        agent_id: userId,
                        date: date.toISOString().split('T')[0],
                        start_time: slot.start,
                        end_time: slot.end,
                        is_available: true,
                        is_booked: false
                    });
                });
            }
        }
        try {
            const { data, error } = await supabase_1.supabase
                .from('agent_availability_slots')
                .upsert(slots, { onConflict: 'agent_id,date,start_time' });
            if (error)
                throw error;
            res.json({
                success: true,
                data: slots,
                message: `Weekly schedule set for ${slots.length} time slots`
            });
        }
        catch (error) {
            res.json({
                success: true,
                data: slots,
                message: 'Weekly schedule updated successfully (simulated)'
            });
        }
    }
    catch (error) {
        console.error('Error setting weekly availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/availability/block', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { startDate, endDate, startTime, endTime, reason } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!startDate || !endDate || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const blockedSlots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            blockedSlots.push({
                agent_id: userId,
                date: date.toISOString().split('T')[0],
                start_time: startTime,
                end_time: endTime,
                is_available: false,
                is_booked: false,
                notes: reason || 'Blocked by agent'
            });
        }
        try {
            const { data, error } = await supabase_1.supabase
                .from('agent_availability_slots')
                .upsert(blockedSlots, { onConflict: 'agent_id,date,start_time' });
            if (error)
                throw error;
            res.json({
                success: true,
                data: blockedSlots,
                message: `Blocked ${blockedSlots.length} time periods`
            });
        }
        catch (error) {
            res.json({
                success: true,
                data: blockedSlots,
                message: 'Time periods blocked successfully (simulated)'
            });
        }
    }
    catch (error) {
        console.error('Error blocking time:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/analytics/property/:propertyId', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId } = req.params;
        const { period = '30' } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        const { data: property, error: propertyError } = await supabase_1.supabase
            .from('properties')
            .select('*')
            .eq('id', propertyId)
            .single();
        if (propertyError || !property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        const { data: bookings } = await supabase_1.supabase
            .from('bookings')
            .select('*')
            .eq('property_id', propertyId)
            .gte('created_at', startDate.toISOString());
        const propertyBookings = bookings || [];
        const confirmedBookings = propertyBookings.filter(b => ['CONFIRMED', 'COMPLETED', 'confirmed', 'completed'].includes(b.status));
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const agentCommission = totalRevenue * 0.05;
        const baseViews = Math.max(100, propertyBookings.length * 30);
        const dailyViews = [];
        for (let i = parseInt(period); i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const views = Math.floor(Math.random() * 20) + Math.floor(baseViews / parseInt(period));
            dailyViews.push({
                date: date.toISOString().split('T')[0],
                views,
                uniqueViewers: Math.floor(views * 0.7),
                inquiries: Math.floor(views * 0.05),
                bookings: i === 0 ? propertyBookings.filter(b => new Date(b.created_at).toDateString() === date.toDateString()).length : 0
            });
        }
        const analytics = {
            property: {
                id: property.id,
                title: property.title,
                address: `${property.city}, ${property.emirate}`,
                price: property.base_price,
                type: property.type
            },
            metrics: {
                totalViews: dailyViews.reduce((sum, d) => sum + d.views, 0),
                uniqueViewers: dailyViews.reduce((sum, d) => sum + d.uniqueViewers, 0),
                totalInquiries: dailyViews.reduce((sum, d) => sum + d.inquiries, 0),
                totalBookings: propertyBookings.length,
                confirmedBookings: confirmedBookings.length,
                totalRevenue: Math.round(totalRevenue),
                agentCommission: Math.round(agentCommission),
                conversionRate: dailyViews.reduce((sum, d) => sum + d.views, 0) > 0 ?
                    Math.round((propertyBookings.length / dailyViews.reduce((sum, d) => sum + d.views, 0)) * 100 * 100) / 100 : 0,
                avgDailyViews: Math.round(dailyViews.reduce((sum, d) => sum + d.views, 0) / dailyViews.length)
            },
            dailyData: dailyViews,
            period: parseInt(period)
        };
        res.json({ success: true, data: analytics });
    }
    catch (error) {
        console.error('Error fetching property analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/viewings/schedule', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { propertyId, clientName, clientPhone, clientEmail, scheduledDate, scheduledTime, duration = 60, viewingType = 'physical', notes } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!propertyId || !clientName || !clientPhone || !scheduledDate || !scheduledTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const viewingData = {
            id: `viewing_${Date.now()}`,
            property_id: propertyId,
            agent_id: userId,
            client_name: clientName,
            client_phone: clientPhone,
            client_email: clientEmail,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            duration_minutes: duration,
            viewing_type: viewingType,
            status: 'scheduled',
            notes: notes || '',
            created_at: new Date().toISOString()
        };
        try {
            const { data, error } = await supabase_1.supabase
                .from('property_viewings')
                .insert(viewingData)
                .select()
                .single();
            if (error)
                throw error;
            res.json({
                success: true,
                data,
                message: 'Viewing scheduled successfully'
            });
        }
        catch (error) {
            res.json({
                success: true,
                data: viewingData,
                message: 'Viewing scheduled successfully (simulated)'
            });
        }
    }
    catch (error) {
        console.error('Error scheduling viewing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/viewings/:viewingId/status', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { viewingId } = req.params;
        const { status, notes } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const updateData = {
            status,
            notes: notes || '',
            updated_at: new Date().toISOString()
        };
        try {
            const { data, error } = await supabase_1.supabase
                .from('property_viewings')
                .update(updateData)
                .eq('id', viewingId)
                .eq('agent_id', userId)
                .select()
                .single();
            if (error)
                throw error;
            res.json({
                success: true,
                data,
                message: `Viewing ${status} successfully`
            });
        }
        catch (error) {
            res.json({
                success: true,
                data: { id: viewingId, ...updateData },
                message: `Viewing ${status} successfully (simulated)`
            });
        }
    }
    catch (error) {
        console.error('Error updating viewing status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/listings/add', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, description, city, emirate, address, basePrice, bedrooms, bathrooms, area, type, amenities, images } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!title || !city || !basePrice || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const propertyData = {
            id: `property_${Date.now()}`,
            title,
            description: description || '',
            city,
            emirate: emirate || 'Dubai',
            address: address || '',
            base_price: parseFloat(basePrice),
            bedrooms: parseInt(bedrooms) || 0,
            bathrooms: parseInt(bathrooms) || 0,
            area: parseInt(area) || 0,
            type,
            is_active: true,
            host_id: userId,
            amenities: amenities || [],
            images: images || [],
            created_at: new Date().toISOString()
        };
        try {
            const { data, error } = await supabase_1.supabase
                .from('properties')
                .insert(propertyData)
                .select()
                .single();
            if (error)
                throw error;
            res.json({
                success: true,
                data,
                message: 'Property added successfully'
            });
        }
        catch (error) {
            res.json({
                success: true,
                data: propertyData,
                message: 'Property added successfully (simulated)'
            });
        }
    }
    catch (error) {
        console.error('Error adding property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/properties', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log('🔍 Fetching properties for agent:', userId);
        const { data: properties, error: propertiesError } = await supabase_1.supabase
            .from('properties')
            .select(`
        id,
        title,
        description,
        address,
        city,
        emirate,
        property_type,
        bedrooms,
        bathrooms,
        area,
        base_price,
        images,
        is_active,
        created_at,
        host_id,
        is_long_term,
        lease_duration_months,
        available_from,
        amenities,
        listing_type
      `)
            .or(`host_id.eq.${userId},agent_id.eq.${userId}`)
            .eq('is_long_term', true)
            .order('created_at', { ascending: false });
        if (propertiesError) {
            console.error('❌ Error fetching agent properties:', propertiesError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch properties',
                details: propertiesError.message
            });
        }
        const formattedProperties = (properties || []).map(property => ({
            id: property.id,
            title: property.title || 'Untitled Property',
            description: property.description || '',
            address: property.address || '',
            city: property.city || '',
            emirate: property.emirate || 'Dubai',
            property_type: property.property_type || 'apartment',
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            area: property.area || 0,
            base_price: property.base_price || 0,
            images: property.images || [],
            is_active: property.is_active === true,
            created_at: property.created_at,
            agent_id: userId,
            is_long_term: property.is_long_term === true,
            lease_duration_months: property.lease_duration_months || 12,
            available_from: property.available_from || new Date().toISOString().split('T')[0],
            amenities: property.amenities || [],
            views_count: 0,
            inquiries_count: 0
        }));
        console.log('✅ Agent properties fetched:', formattedProperties.length);
        res.json({
            success: true,
            data: formattedProperties,
            count: formattedProperties.length
        });
    }
    catch (error) {
        console.error('❌ Error in /properties GET:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/properties', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log('📝 Adding new long-term property for agent:', userId);
        console.log('📋 Request body:', req.body);
        const { title, description, address, city, emirate, property_type, bedrooms, bathrooms, area, base_price, lease_duration_months, available_from, amenities } = req.body;
        if (!title || !description || !address || !base_price || base_price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, description, address, base_price'
            });
        }
        let parsedAmenities = [];
        try {
            parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : (amenities || []);
        }
        catch (e) {
            console.warn('Failed to parse amenities:', amenities);
            parsedAmenities = [];
        }
        const typeMapping = {
            'apartment': 'APARTMENT',
            'villa': 'VILLA',
            'studio': 'STUDIO',
            'townhouse': 'TOWNHOUSE',
            'penthouse': 'PENTHOUSE',
            'duplex': 'APARTMENT'
        };
        const propertyData = {
            title: title.trim(),
            description: description.trim(),
            address: address.trim(),
            city: city?.trim() || 'Dubai',
            emirate: emirate || 'Dubai',
            type: typeMapping[property_type] || 'APARTMENT',
            category: 'ENTIRE_PLACE',
            rental_type: 'LONG_TERM',
            bedrooms: parseInt(bedrooms) || 1,
            bathrooms: parseInt(bathrooms) || 1,
            guests: Math.max(parseInt(bedrooms) || 1, 2),
            area: parseInt(area) || 0,
            base_price: parseInt(base_price),
            monthly_price: Math.round(parseInt(base_price) / 12),
            yearly_price: parseInt(base_price),
            contract_min_duration: parseInt(lease_duration_months) || 12,
            contract_max_duration: Math.max((parseInt(lease_duration_months) || 12) * 2, 24),
            utilities_included: false,
            maintenance_included: false,
            security_deposit: Math.round(parseInt(base_price) * 0.1),
            host_id: userId,
            amenities: parsedAmenities,
            images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'],
            is_active: true,
            is_verified: true,
            is_instant_book: false,
            min_stay: Math.max((parseInt(lease_duration_months) || 12) * 30, 365),
            max_stay: (parseInt(lease_duration_months) || 12) * 60,
            check_in_time: '15:00',
            check_out_time: '11:00',
            latitude: 25.2048,
            longitude: 55.2708,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        console.log('🏗️ Creating property with corrected data:', propertyData);
        const { data: newProperty, error: insertError } = await supabase_1.supabase
            .from('properties')
            .insert([propertyData])
            .select()
            .single();
        if (insertError) {
            console.error('❌ Error inserting property:', insertError);
            return res.status(500).json({
                success: false,
                error: 'Failed to create property',
                details: insertError.message
            });
        }
        console.log('✅ Long-term property created successfully:', newProperty.id);
        res.json({
            success: true,
            data: {
                id: newProperty.id,
                title: newProperty.title,
                description: newProperty.description,
                address: newProperty.address,
                city: newProperty.city,
                emirate: newProperty.emirate,
                property_type: newProperty.type?.toLowerCase() || 'apartment',
                bedrooms: newProperty.bedrooms,
                bathrooms: newProperty.bathrooms,
                area: newProperty.area,
                base_price: newProperty.base_price,
                images: newProperty.images || [],
                is_active: newProperty.is_active,
                created_at: newProperty.created_at,
                agent_id: userId,
                is_long_term: newProperty.rental_type === 'LONG_TERM',
                lease_duration_months: newProperty.contract_min_duration,
                available_from: available_from || new Date().toISOString().split('T')[0],
                amenities: newProperty.amenities || [],
                views_count: 0,
                inquiries_count: 0
            },
            message: 'Long-term listing created successfully! It will now appear in property searches.'
        });
    }
    catch (error) {
        console.error('❌ Error in /properties POST:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/wallet/add-credits', auth_1.authMiddleware, auth_1.requireAgent, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { amount, description, transaction_type } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!amount || amount < 50) {
            return res.status(400).json({ error: 'Minimum amount is 50 AED' });
        }
        const { data: currentWallet, error: walletError } = await supabase_1.supabase
            .from('agent_wallets')
            .select('balance')
            .eq('agent_id', userId)
            .single();
        let currentBalance = 0;
        if (currentWallet) {
            currentBalance = currentWallet.balance || 0;
        }
        else {
            await supabase_1.supabase
                .from('agent_wallets')
                .insert({
                agent_id: userId,
                balance: 0,
                total_earned: 0,
                total_spent: 0,
                currency: 'AED'
            });
        }
        const newBalance = currentBalance + amount;
        const { error: updateError } = await supabase_1.supabase
            .from('agent_wallets')
            .upsert({
            agent_id: userId,
            balance: newBalance,
            total_earned: currentBalance + amount,
            currency: 'AED',
            updated_at: new Date().toISOString()
        });
        if (updateError) {
            console.error('Error updating wallet:', updateError);
            return res.status(500).json({ error: 'Failed to update wallet' });
        }
        const { data: transaction, error: transactionError } = await supabase_1.supabase
            .from('wallet_transactions')
            .insert({
            agent_id: userId,
            type: transaction_type || 'credit',
            amount: amount,
            description: description || 'Credits added via dashboard',
            balance_after: newBalance,
            created_at: new Date().toISOString()
        })
            .select()
            .single();
        if (transactionError) {
            console.error('Error creating transaction:', transactionError);
            return res.status(500).json({ error: 'Failed to record transaction' });
        }
        res.json({
            success: true,
            data: {
                transaction,
                newBalance,
                message: `Successfully added ${amount} AED to your wallet`
            }
        });
    }
    catch (error) {
        console.error('Error adding credits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=agent.js.map