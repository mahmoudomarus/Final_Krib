"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const stripe_1 = __importDefault(require("stripe"));
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
router.get('/methods', auth_1.authMiddleware, async (req, res) => {
    try {
        const { data: paymentMethods, error } = await supabase_1.supabaseAdmin
            .from('payment_methods')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching payment methods:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch payment methods'
            });
        }
        res.json({
            success: true,
            data: paymentMethods || [],
        });
    }
    catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/methods', auth_1.authMiddleware, async (req, res) => {
    try {
        const { type, card_number, exp_month, exp_year, cvv, cardholder_name, bank_name, account_number, is_default = false } = req.body;
        if (!type || !['card', 'bank_transfer'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method type',
            });
        }
        if (is_default) {
            await supabase_1.supabaseAdmin
                .from('payment_methods')
                .update({ is_default: false })
                .eq('user_id', req.user.id);
        }
        let paymentMethodData = {
            user_id: req.user.id,
            type,
            is_default,
            created_at: new Date().toISOString(),
        };
        if (type === 'card') {
            paymentMethodData = {
                ...paymentMethodData,
                last_four: card_number?.slice(-4),
                brand: 'Visa',
                exp_month,
                exp_year,
                cardholder_name,
            };
        }
        else if (type === 'bank_transfer') {
            paymentMethodData = {
                ...paymentMethodData,
                bank_name,
                account_number: account_number?.slice(-4),
            };
        }
        const { data: newPaymentMethod, error } = await supabase_1.supabaseAdmin
            .from('payment_methods')
            .insert(paymentMethodData)
            .select()
            .single();
        if (error) {
            console.error('Error adding payment method:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to add payment method',
            });
        }
        res.json({
            success: true,
            data: newPaymentMethod,
            message: 'Payment method added successfully',
        });
    }
    catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.delete('/methods/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.supabaseAdmin
            .from('payment_methods')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);
        if (error) {
            console.error('Error deleting payment method:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete payment method',
            });
        }
        res.json({
            success: true,
            message: 'Payment method deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.put('/methods/:id/default', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await supabase_1.supabaseAdmin
            .from('payment_methods')
            .update({ is_default: false })
            .eq('user_id', req.user.id);
        const { data: updatedMethod, error } = await supabase_1.supabaseAdmin
            .from('payment_methods')
            .update({ is_default: true })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error) {
            console.error('Error setting default payment method:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to set default payment method',
            });
        }
        res.json({
            success: true,
            data: updatedMethod,
            message: 'Default payment method updated',
        });
    }
    catch (error) {
        console.error('Error setting default payment method:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { status, type, method, page = 1, limit = 10 } = req.query;
        const userId = req.user.id;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        let query = supabase_1.supabaseAdmin
            .from('payments')
            .select(`
        *,
        bookings!payments_booking_id_fkey (
          id,
          check_in,
          check_out,
          properties!bookings_property_id_fkey (
            id,
            title,
            images,
            address,
            city,
            emirate
          )
        ),
        users!payments_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
            .eq('user_id', userId);
        if (status)
            query = query.eq('status', status);
        if (type)
            query = query.eq('type', type);
        if (method)
            query = query.eq('method', method);
        const { data: payments, error: paymentsError, count } = await query
            .range(skip, skip + take - 1)
            .order('created_at', { ascending: false });
        if (paymentsError) {
            console.error('Error fetching payments:', paymentsError);
            return res.status(500).json({ success: false, error: 'Failed to fetch payments' });
        }
        const { data: summaryData, error: summaryError } = await supabase_1.supabaseAdmin
            .from('payments')
            .select('amount, status, due_date')
            .eq('user_id', userId);
        if (summaryError) {
            console.error('Error fetching payment summary:', summaryError);
        }
        const totalAmount = summaryData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const paidAmount = summaryData?.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const pendingAmount = summaryData?.filter(p => ['PENDING', 'PROCESSING'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const overdueAmount = summaryData?.filter(p => p.status === 'PENDING' && new Date(p.due_date) < new Date()).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        res.json({
            success: true,
            data: {
                payments: payments || [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count || 0,
                    pages: Math.ceil((count || 0) / Number(limit)),
                },
                summary: {
                    totalAmount,
                    paidAmount,
                    pendingAmount,
                    overdueAmount,
                    totalPayments: summaryData?.length || 0,
                },
            },
        });
    }
    catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { data: payment, error } = await supabase_1.supabaseAdmin
            .from('payments')
            .select(`
        *,
        bookings!payments_booking_id_fkey (
          id,
          check_in,
          check_out,
          properties!bookings_property_id_fkey (
            id,
            title,
            images,
            address,
            city,
            emirate,
            users!properties_host_id_fkey (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          )
        ),
        users!payments_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error || !payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }
        res.json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/:id/stripe-payment', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { data: payment, error } = await supabase_1.supabaseAdmin
            .from('payments')
            .select(`
        *,
        bookings!payments_booking_id_fkey (
          id,
          properties!bookings_property_id_fkey (
            id,
            title
          )
        )
      `)
            .eq('id', id)
            .eq('user_id', userId)
            .eq('status', 'PENDING')
            .single();
        if (error || !payment) {
            return res.status(404).json({ success: false, error: 'Payment not found or not pending' });
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'aed',
                        product_data: {
                            name: `${payment.type.replace('_', ' ')} - ${payment.bookings?.properties?.title || 'Property Booking'}`,
                            description: payment.description || '',
                        },
                        unit_amount: Math.round(payment.amount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/payments/${payment.id}?status=success`,
            cancel_url: `${process.env.CLIENT_URL}/payments/${payment.id}?status=cancelled`,
            metadata: {
                paymentId: payment.id,
                bookingId: payment.booking_id || '',
                userId: payment.user_id,
            },
        });
        const { error: updateError } = await supabase_1.supabaseAdmin
            .from('payments')
            .update({
            stripe_payment_id: session.id,
            stripe_payment_url: session.url,
            status: 'PROCESSING',
            updated_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (updateError) {
            console.error('Error updating payment with Stripe info:', updateError);
        }
        res.json({
            success: true,
            data: {
                paymentUrl: session.url,
                paymentId: session.id,
            },
        });
    }
    catch (error) {
        console.error('Error creating Stripe payment:', error);
        res.status(500).json({ success: false, error: 'Failed to create payment link' });
    }
});
router.post('/:id/check-payment', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { checkNumber, bankName, notes } = req.body;
        const userId = req.user.id;
        const { data: payment, error } = await supabase_1.supabaseAdmin
            .from('payments')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .eq('status', 'PENDING')
            .single();
        if (error || !payment) {
            return res.status(404).json({ success: false, error: 'Payment not found or not pending' });
        }
        const { error: updateError } = await supabase_1.supabaseAdmin
            .from('payments')
            .update({
            method: 'CHECK',
            check_number: checkNumber,
            check_bank: bankName,
            check_date: new Date().toISOString(),
            check_status: 'RECEIVED',
            admin_notes: notes,
            status: 'PROCESSING',
            updated_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (updateError) {
            console.error('Error updating payment with check details:', updateError);
            return res.status(500).json({ success: false, error: 'Failed to update payment' });
        }
        res.json({
            success: true,
            message: 'Check payment submitted successfully',
        });
    }
    catch (error) {
        console.error('Error submitting check payment:', error);
        res.status(500).json({ success: false, error: 'Failed to submit check payment' });
    }
});
router.post('/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const { error } = await supabase_1.supabaseAdmin
                .from('payments')
                .update({
                status: 'COMPLETED',
                stripe_payment_intent: session.payment_intent,
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
                .eq('stripe_payment_id', session.id);
            if (error) {
                console.error('Error updating payment status:', error);
            }
            else {
                console.log('Payment completed:', session.metadata?.paymentId);
                if (session.metadata?.userId) {
                }
            }
            break;
        case 'checkout.session.expired':
            const expiredSession = event.data.object;
            await supabase_1.supabaseAdmin
                .from('payments')
                .update({
                status: 'PENDING',
                updated_at: new Date().toISOString(),
            })
                .eq('stripe_payment_id', expiredSession.id);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
});
exports.default = router;
//# sourceMappingURL=payments.js.map