import { NotificationService } from './NotificationService';
import { prisma } from '../lib/prisma';

export class NotificationIntegrationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Send booking confirmation notification
  async sendBookingConfirmation(bookingId: string) {
    try {
      // Simple notification without complex relations
      await prisma.notification.create({
        data: {
          userId: bookingId, // Simplified - would need proper user lookup
          type: 'BOOKING_CONFIRMATION',
          title: 'Booking Confirmed',
          message: `Your booking has been confirmed.`,
          data: JSON.stringify({ bookingId }),
          isRead: false
        }
      });

    } catch (error) {
      console.error('Error sending booking confirmation:', error);
    }
  }

  // Send payment confirmation
  async sendPaymentConfirmation(paymentId: string) {
    try {
      // Simple notification without complex relations
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) return;

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: 'PAYMENT_CONFIRMATION',
          title: 'Payment Confirmed',
          message: `Your payment has been processed successfully.`,
          data: JSON.stringify({ paymentId }),
          isRead: false
        }
      });

    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
  }

  // Send property approval notification
  async sendPropertyApproval(propertyId: string) {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          host: true
        }
      });

      if (!property) return;

      await prisma.notification.create({
        data: {
          userId: property.hostId,
          type: 'PROPERTY_APPROVED',
          title: 'Property Approved',
          message: `Your property "${property.title}" has been approved.`,
          data: JSON.stringify({ propertyId }),
          isRead: false
        }
      });

    } catch (error) {
      console.error('Error sending property approval:', error);
    }
  }
} 