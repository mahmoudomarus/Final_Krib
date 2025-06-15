import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import Stripe from 'stripe';

const router: Router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// GET /api/payments/methods - Get user's payment methods
router.get('/methods', authMiddleware, async (req: any, res) => {
  try {
    const { data: paymentMethods, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/payments/methods - Add new payment method
router.post('/methods', authMiddleware, async (req: any, res) => {
  try {
    const { 
      type, 
      card_number, 
      exp_month, 
      exp_year, 
      cvv, 
      cardholder_name,
      bank_name,
      account_number,
      is_default = false 
    } = req.body;

    if (!type || !['card', 'bank_transfer'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method type',
      });
    }

    // If setting as default, unset current default
    if (is_default) {
      await supabaseAdmin
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    let paymentMethodData: any = {
      user_id: req.user.id,
      type,
      is_default,
      created_at: new Date().toISOString(),
    };

    if (type === 'card') {
      // In production, you'd tokenize the card with Stripe and not store raw numbers
      paymentMethodData = {
        ...paymentMethodData,
        last_four: card_number?.slice(-4),
        brand: 'Visa', // You'd determine this from the card number
        exp_month,
        exp_year,
        cardholder_name,
      };
    } else if (type === 'bank_transfer') {
      paymentMethodData = {
        ...paymentMethodData,
        bank_name,
        account_number: account_number?.slice(-4), // Store only last 4 digits
      };
    }

    const { data: newPaymentMethod, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/payments/methods/:id - Delete payment method
router.delete('/methods/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/payments/methods/:id/default - Set payment method as default
router.put('/methods/:id/default', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Unset current default
    await supabaseAdmin
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', req.user.id);

    // Set new default
    const { data: updatedMethod, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get all payments for a user
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const { status, type, method, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build Supabase query
    let query = supabaseAdmin
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

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (method) query = query.eq('method', method);

    const { data: payments, error: paymentsError, count } = await query
      .range(skip, skip + take - 1)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }

    // Calculate summary
    const { data: summaryData, error: summaryError } = await supabaseAdmin
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
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get specific payment details
router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: payment, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create Stripe checkout session
router.post('/:id/stripe-payment', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: payment, error } = await supabaseAdmin
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

    // Create Stripe checkout session
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
            unit_amount: Math.round(payment.amount * 100), // Convert to fils
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

    // Update payment with Stripe info
    const { error: updateError } = await supabaseAdmin
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
  } catch (error) {
    console.error('Error creating Stripe payment:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment link' });
  }
});

// Handle check payment submission
router.post('/:id/check-payment', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { checkNumber, bankName, notes } = req.body;
    const userId = req.user.id;

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .single();

    if (error || !payment) {
      return res.status(404).json({ success: false, error: 'Payment not found or not pending' });
    }

    // Update payment with check details
    const { error: updateError } = await supabaseAdmin
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

    // Send notification

    res.json({
      success: true,
      message: 'Check payment submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting check payment:', error);
    res.status(500).json({ success: false, error: 'Failed to submit check payment' });
  }
});

// Stripe webhook endpoint
router.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Update payment status
      const { error } = await supabaseAdmin
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
      } else {
        console.log('Payment completed:', session.metadata?.paymentId);
        
        // Send notification
        if (session.metadata?.userId) {
        }
      }
      break;

    case 'checkout.session.expired':
      const expiredSession = event.data.object;
      
      // Update payment status back to pending
      await supabaseAdmin
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

export default router; 