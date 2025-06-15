import { NotificationService } from './NotificationService';
import { supabase } from '../lib/supabase';

export class NotificationIntegrationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Send booking confirmation notification
  async sendBookingConfirmation(bookingId: string) {
    try {
      // Get booking details to find the user
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('guest_id, property_id, properties(title)')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        console.error('Booking not found:', bookingError);
        return;
      }

      // Use the NotificationService to send proper notification
      await this.notificationService.sendBookingConfirmation(booking.guest_id, bookingId);

    } catch (error) {
      console.error('Error sending booking confirmation:', error);
    }
  }

  // Send payment confirmation
  async sendPaymentConfirmation(paymentId: string) {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('user_id, amount, booking_id')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        console.error('Payment not found:', paymentError);
        return;
      }

      // Use the NotificationService to send proper notification
      await this.notificationService.sendPaymentSuccess(payment.user_id, paymentId, payment.amount);

    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
  }

  // Send property approval notification
  async sendPropertyApproval(propertyId: string) {
    try {
      // Get property details
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('host_id, title')
        .eq('id', propertyId)
        .single();

      if (propertyError || !property) {
        console.error('Property not found:', propertyError);
        return;
      }

      // Use the NotificationService to send proper notification
      await this.notificationService.sendPropertyApproved(property.host_id, property.title, propertyId);

    } catch (error) {
      console.error('Error sending property approval:', error);
    }
  }
} 