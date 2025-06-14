"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationIntegrationService = void 0;
const NotificationService_1 = require("./NotificationService");
const prisma_1 = require("../lib/prisma");
class NotificationIntegrationService {
    constructor() {
        this.notificationService = new NotificationService_1.NotificationService();
    }
    async sendBookingConfirmation(bookingId) {
        try {
            await prisma_1.prisma.notification.create({
                data: {
                    userId: bookingId,
                    type: 'BOOKING_CONFIRMATION',
                    title: 'Booking Confirmed',
                    message: `Your booking has been confirmed.`,
                    data: JSON.stringify({ bookingId }),
                    isRead: false
                }
            });
        }
        catch (error) {
            console.error('Error sending booking confirmation:', error);
        }
    }
    async sendPaymentConfirmation(paymentId) {
        try {
            const payment = await prisma_1.prisma.payment.findUnique({
                where: { id: paymentId }
            });
            if (!payment)
                return;
            await prisma_1.prisma.notification.create({
                data: {
                    userId: payment.userId,
                    type: 'PAYMENT_CONFIRMATION',
                    title: 'Payment Confirmed',
                    message: `Your payment has been processed successfully.`,
                    data: JSON.stringify({ paymentId }),
                    isRead: false
                }
            });
        }
        catch (error) {
            console.error('Error sending payment confirmation:', error);
        }
    }
    async sendPropertyApproval(propertyId) {
        try {
            const property = await prisma_1.prisma.property.findUnique({
                where: { id: propertyId },
                include: {
                    host: true
                }
            });
            if (!property)
                return;
            await prisma_1.prisma.notification.create({
                data: {
                    userId: property.hostId,
                    type: 'PROPERTY_APPROVED',
                    title: 'Property Approved',
                    message: `Your property "${property.title}" has been approved.`,
                    data: JSON.stringify({ propertyId }),
                    isRead: false
                }
            });
        }
        catch (error) {
            console.error('Error sending property approval:', error);
        }
    }
}
exports.NotificationIntegrationService = NotificationIntegrationService;
//# sourceMappingURL=NotificationIntegrationService.js.map