"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationIntegrationService = void 0;
const NotificationService_1 = require("./NotificationService");
const supabase_1 = require("../lib/supabase");
class NotificationIntegrationService {
    constructor() {
        this.notificationService = new NotificationService_1.NotificationService();
    }
    async sendBookingConfirmation(bookingId) {
        try {
            const { data: booking, error: bookingError } = await supabase_1.supabase
                .from('bookings')
                .select('guest_id, property_id, properties(title)')
                .eq('id', bookingId)
                .single();
            if (bookingError || !booking) {
                console.error('Booking not found:', bookingError);
                return;
            }
            await this.notificationService.sendBookingConfirmation(booking.guest_id, bookingId);
        }
        catch (error) {
            console.error('Error sending booking confirmation:', error);
        }
    }
    async sendPaymentConfirmation(paymentId) {
        try {
            const { data: payment, error: paymentError } = await supabase_1.supabase
                .from('payments')
                .select('user_id, amount, booking_id')
                .eq('id', paymentId)
                .single();
            if (paymentError || !payment) {
                console.error('Payment not found:', paymentError);
                return;
            }
            await this.notificationService.sendPaymentSuccess(payment.user_id, paymentId, payment.amount);
        }
        catch (error) {
            console.error('Error sending payment confirmation:', error);
        }
    }
    async sendPropertyApproval(propertyId) {
        try {
            const { data: property, error: propertyError } = await supabase_1.supabase
                .from('properties')
                .select('host_id, title')
                .eq('id', propertyId)
                .single();
            if (propertyError || !property) {
                console.error('Property not found:', propertyError);
                return;
            }
            await this.notificationService.sendPropertyApproved(property.host_id, property.title, propertyId);
        }
        catch (error) {
            console.error('Error sending property approval:', error);
        }
    }
}
exports.NotificationIntegrationService = NotificationIntegrationService;
//# sourceMappingURL=NotificationIntegrationService.js.map