interface NotificationData {
    userId: string;
    title: string;
    message: string;
    type: 'BOOKING' | 'PAYMENT' | 'REVIEW' | 'SYSTEM' | 'PROMOTION' | 'MESSAGE' | 'PROPERTY' | 'KYC' | 'ADMIN';
    data?: any;
    actionUrl?: string;
    actionText?: string;
    sendEmail?: boolean;
    sendSMS?: boolean;
    sendPush?: boolean;
}
export declare class NotificationService {
    private twilioClient;
    private emailEnabled;
    private smsEnabled;
    constructor();
    createNotification(data: NotificationData): Promise<any>;
    private sendEmailNotification;
    private sendSMSNotification;
    private sendPushNotification;
    private getEmailTemplate;
    private getSMSMessage;
    sendBookingConfirmation(userId: string, bookingId: string): Promise<any>;
    sendBookingRequest(hostId: string, guestName: string, propertyTitle: string, bookingId: string): Promise<any>;
    sendBookingApproved(userId: string, propertyTitle: string, bookingId: string): Promise<any>;
    sendBookingDeclined(userId: string, propertyTitle: string, bookingId: string, reason?: string): Promise<any>;
    sendCheckInReminder(userId: string, propertyTitle: string, checkInDate: string, bookingId: string): Promise<any>;
    sendCheckOutReminder(userId: string, propertyTitle: string, checkOutDate: string, bookingId: string): Promise<any>;
    sendNewMessage(userId: string, senderName: string, propertyTitle: string, conversationId: string): Promise<any>;
    sendPropertyApproved(userId: string, propertyTitle: string, propertyId: string): Promise<any>;
    sendPropertyRejected(userId: string, propertyTitle: string, propertyId: string, reason: string): Promise<any>;
    sendPaymentSuccess(userId: string, paymentId: string, amount: number): Promise<any>;
    sendPaymentFailed(userId: string, paymentId: string, amount: number): Promise<any>;
    sendPaymentReceived(hostId: string, amount: number, guestName: string, propertyTitle: string): Promise<any>;
    sendNewReview(userId: string, reviewId: string, rating: number): Promise<any>;
    sendReviewResponse(userId: string, propertyTitle: string, reviewId: string): Promise<any>;
    sendKYCApproved(userId: string): Promise<any>;
    sendKYCRejected(userId: string, reason: string): Promise<any>;
    sendNewUserRegistration(adminId: string, userName: string, userEmail: string, userId: string): Promise<any>;
    sendPropertySubmitted(adminId: string, propertyTitle: string, hostName: string, propertyId: string): Promise<any>;
    sendSystemAlert(adminId: string, alertType: string, message: string, data?: any): Promise<any>;
    sendPromotionalOffer(userId: string, title: string, message: string, offerData: any): Promise<any>;
    sendWelcomeBonus(userId: string, bonusAmount: number): Promise<any>;
    sendViewingRequest(agentId: string, guestName: string, propertyTitle: string, requestedDate: string, requestedTime: string, requestId: string): Promise<any>;
    sendViewingConfirmed(guestEmail: string, guestName: string, propertyTitle: string, confirmedDate: string, confirmedTime: string): Promise<void>;
    sendViewingRejected(guestEmail: string, guestName: string, propertyTitle: string): Promise<void>;
    sendBulkNotification(userIds: string[], notificationData: Omit<NotificationData, 'userId'>): Promise<any[]>;
    sendHostReminder(hostId: string, reminderType: string, data: any): Promise<any>;
    sendEmailVerification(email: string, firstName: string, verificationToken: string): Promise<void>;
    sendPasswordReset(email: string, firstName: string, resetToken: string): Promise<void>;
}
export {};
//# sourceMappingURL=NotificationService.d.ts.map