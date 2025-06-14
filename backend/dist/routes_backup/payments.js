"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const NotificationService_1 = require("../services/NotificationService");
const stripe_1 = __importDefault(require("stripe"));
const router = (0, express_1.Router)();
const notificationService = new NotificationService_1.NotificationService();
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
router.get('/', async (req, res) => {
    try {
        const { status, type, method, page = 1, limit = 10 } = req.query;
        const userId = req.user.id;
        const whereClause = {
            userId,
        };
        if (status)
            whereClause.status = status;
        if (type)
            whereClause.type = type;
        if (method)
            whereClause.method = method;
        const payments = await prisma_1.prisma.payment.findMany({
            where: whereClause,
            include: {
                booking: {
                    include: {
                        property: {
                            select: {
                                id: true,
                                title: true,
                                images: true,
                                address: true,
                                city: true,
                                emirate: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
        });
        const totalCount = await prisma_1.prisma.payment.count({
            where: whereClause,
        });
        const summary = await prisma_1.prisma.payment.aggregate({
            where: { userId },
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
        });
        const paidAmount = await prisma_1.prisma.payment.aggregate({
            where: { userId, status: 'COMPLETED' },
            _sum: {
                amount: true,
            },
        });
        const pendingAmount = await prisma_1.prisma.payment.aggregate({
            where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
            _sum: {
                amount: true,
            },
        });
        const overdueAmount = await prisma_1.prisma.payment.aggregate({
            where: {
                userId,
                status: 'PENDING',
                dueDate: {
                    lt: new Date(),
                },
            },
            _sum: {
                amount: true,
            },
        });
        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / Number(limit)),
                },
                summary: {
                    totalAmount: summary._sum.amount || 0,
                    paidAmount: paidAmount._sum.amount || 0,
                    pendingAmount: pendingAmount._sum.amount || 0,
                    overdueAmount: overdueAmount._sum.amount || 0,
                    totalPayments: summary._count.id || 0,
                },
            },
        });
    }
    catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const payment = await prisma_1.prisma.payment.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                booking: {
                    include: {
                        property: {
                            include: {
                                host: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        phone: true,
                                    },
                                },
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        if (!payment) {
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
router.post('/:id/stripe-payment', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const payment = await prisma_1.prisma.payment.findFirst({
            where: {
                id,
                userId,
                status: 'PENDING',
            },
            include: {
                booking: {
                    include: {
                        property: true,
                    },
                },
            },
        });
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found or not pending' });
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'aed',
                        product_data: {
                            name: `${payment.type.replace('_', ' ')} - ${payment.booking?.property.title}`,
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
                bookingId: payment.bookingId || '',
                userId: payment.userId,
            },
        });
        await prisma_1.prisma.payment.update({
            where: { id },
            data: {
                stripePaymentId: session.id,
                stripePaymentUrl: session.url,
                status: 'PROCESSING',
            },
        });
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
router.post('/:id/check-payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { checkNumber, bankName, notes } = req.body;
        const userId = req.user.id;
        const payment = await prisma_1.prisma.payment.findFirst({
            where: {
                id,
                userId,
                status: 'PENDING',
            },
        });
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found or not pending' });
        }
        await prisma_1.prisma.payment.update({
            where: { id },
            data: {
                method: 'CHECK',
                checkNumber,
                checkBank: bankName,
                checkDate: new Date(),
                checkStatus: 'RECEIVED',
                adminNotes: notes,
                status: 'PROCESSING',
            },
        });
        await notificationService.createNotification({
            userId,
            title: 'Check Payment Submitted',
            message: 'Your check payment has been submitted and is pending verification.',
            type: 'PAYMENT',
            data: { paymentId: id, checkNumber },
            actionUrl: `${process.env.CLIENT_URL}/payments/${id}`,
            actionText: 'View Payment',
            sendEmail: true,
        });
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
    try {
        switch (event.type) {
            case 'checkout.session.completed':
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const payment = await prisma_1.prisma.payment.findFirst({
                    where: {
                        stripePaymentId: paymentIntent.id,
                    },
                });
                if (payment) {
                    await prisma_1.prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'COMPLETED',
                            paidAt: new Date(),
                        },
                    });
                    await notificationService.sendPaymentSuccess(payment.userId, payment.id, payment.amount);
                    if (payment.bookingId) {
                        await prisma_1.prisma.booking.update({
                            where: { id: payment.bookingId },
                            data: {
                                paymentStatus: 'PAID',
                                paidAmount: {
                                    increment: payment.amount,
                                },
                            },
                        });
                    }
                }
                break;
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                const failedPaymentRecord = await prisma_1.prisma.payment.findFirst({
                    where: {
                        stripePaymentId: failedPayment.id,
                    },
                });
                if (failedPaymentRecord) {
                    await prisma_1.prisma.payment.update({
                        where: { id: failedPaymentRecord.id },
                        data: {
                            status: 'FAILED',
                            failureReason: failedPayment.last_payment_error?.message,
                        },
                    });
                    await notificationService.sendPaymentFailed(failedPaymentRecord.userId, failedPaymentRecord.id, failedPaymentRecord.amount);
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map