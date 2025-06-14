"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const twilio_1 = __importDefault(require("twilio"));
const supabase_1 = require("../lib/supabase");
class NotificationService {
    constructor() {
        if (process.env.SENDGRID_API_KEY) {
            mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
            this.emailEnabled = true;
        }
        else {
            this.emailEnabled = false;
            console.warn('SendGrid API key not found. Email notifications disabled.');
        }
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            this.smsEnabled = true;
        }
        else {
            this.smsEnabled = false;
            console.warn('Twilio credentials not found. SMS notifications disabled.');
        }
    }
    async createNotification(data) {
        try {
            const { data: notification, error: notificationError } = await supabase_1.supabase
                .from('notifications')
                .insert({
                user_id: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                data: data.data || {},
                action_url: data.actionUrl,
                action_text: data.actionText,
                created_at: new Date().toISOString(),
            })
                .select()
                .single();
            if (notificationError)
                throw notificationError;
            const { data: user, error: userError } = await supabase_1.supabase
                .from('users')
                .select('email, phone, first_name, last_name, language')
                .eq('id', data.userId)
                .single();
            if (userError || !user) {
                throw new Error('User not found');
            }
            if (data.sendEmail && this.emailEnabled && user.email) {
                await this.sendEmailNotification(user, notification, data);
            }
            if (data.sendSMS && this.smsEnabled && user.phone) {
                await this.sendSMSNotification(user, notification, data);
            }
            if (data.sendPush) {
                await this.sendPushNotification(user, notification, data);
            }
            return notification;
        }
        catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }
    async sendEmailNotification(user, notification, data) {
        try {
            const template = this.getEmailTemplate(data.type, data, user);
            const msg = {
                to: user.email,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@uae-rental.com',
                    name: process.env.SENDGRID_FROM_NAME || 'UAE Rental Platform',
                },
                subject: template.subject,
                text: template.text,
                html: template.html,
            };
            await mail_1.default.send(msg);
            await supabase_1.supabase
                .from('notifications')
                .update({
                email_sent: true,
                email_sent_at: new Date().toISOString(),
            })
                .eq('id', notification.id);
            console.log(`Email sent to ${user.email} for notification ${notification.id}`);
        }
        catch (error) {
            console.error('Error sending email:', error);
        }
    }
    async sendSMSNotification(user, notification, data) {
        try {
            const message = this.getSMSMessage(data.type, data, user);
            await this.twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: user.phone,
            });
            await supabase_1.supabase
                .from('notifications')
                .update({
                sms_sent: true,
                sms_sent_at: new Date().toISOString(),
            })
                .eq('id', notification.id);
            console.log(`SMS sent to ${user.phone} for notification ${notification.id}`);
        }
        catch (error) {
            console.error('Error sending SMS:', error);
        }
    }
    async sendPushNotification(user, notification, data) {
        console.log('Push notification would be sent here');
        await supabase_1.supabase
            .from('notifications')
            .update({
            push_sent: true,
            push_sent_at: new Date().toISOString(),
        })
            .eq('id', notification.id);
    }
    getEmailTemplate(type, data, user) {
        const userName = `${user.first_name} ${user.last_name}`;
        switch (type) {
            case 'BOOKING':
                return {
                    subject: 'Booking Update - UAE Rental Platform',
                    html: `
            <h2>Hello ${userName},</h2>
            <p>${data.message}</p>
            ${data.actionUrl ? `<a href="${data.actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${data.actionText || 'View Details'}</a>` : ''}
            <br><br>
            <p>Best regards,<br>UAE Rental Platform Team</p>
          `,
                    text: `Hello ${userName},\n\n${data.message}\n\n${data.actionUrl ? `View details: ${data.actionUrl}` : ''}\n\nBest regards,\nUAE Rental Platform Team`,
                };
            case 'PAYMENT':
                return {
                    subject: 'Payment Notification - UAE Rental Platform',
                    html: `
            <h2>Hello ${userName},</h2>
            <p>${data.message}</p>
            ${data.data?.amount ? `<p><strong>Amount: ${data.data.amount} AED</strong></p>` : ''}
            ${data.actionUrl ? `<a href="${data.actionUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${data.actionText || 'View Payment'}</a>` : ''}
            <br><br>
            <p>Best regards,<br>UAE Rental Platform Team</p>
          `,
                    text: `Hello ${userName},\n\n${data.message}\n\n${data.data?.amount ? `Amount: ${data.data.amount} AED` : ''}\n\n${data.actionUrl ? `View payment: ${data.actionUrl}` : ''}\n\nBest regards,\nUAE Rental Platform Team`,
                };
            case 'REVIEW':
                return {
                    subject: 'New Review - UAE Rental Platform',
                    html: `
            <h2>Hello ${userName},</h2>
            <p>${data.message}</p>
            ${data.actionUrl ? `<a href="${data.actionUrl}" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${data.actionText || 'View Review'}</a>` : ''}
            <br><br>
            <p>Best regards,<br>UAE Rental Platform Team</p>
          `,
                    text: `Hello ${userName},\n\n${data.message}\n\n${data.actionUrl ? `View review: ${data.actionUrl}` : ''}\n\nBest regards,\nUAE Rental Platform Team`,
                };
            default:
                return {
                    subject: 'Notification - UAE Rental Platform',
                    html: `
            <h2>Hello ${userName},</h2>
            <p>${data.message}</p>
            ${data.actionUrl ? `<a href="${data.actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${data.actionText || 'View Details'}</a>` : ''}
            <br><br>
            <p>Best regards,<br>UAE Rental Platform Team</p>
          `,
                    text: `Hello ${userName},\n\n${data.message}\n\n${data.actionUrl ? `View details: ${data.actionUrl}` : ''}\n\nBest regards,\nUAE Rental Platform Team`,
                };
        }
    }
    getSMSMessage(type, data, user) {
        const userName = user.first_name;
        switch (type) {
            case 'BOOKING':
                return `Hi ${userName}, ${data.message} - UAE Rental Platform`;
            case 'PAYMENT':
                return `Hi ${userName}, ${data.message}${data.data?.amount ? ` Amount: ${data.data.amount} AED` : ''} - UAE Rental Platform`;
            default:
                return `Hi ${userName}, ${data.message} - UAE Rental Platform`;
        }
    }
    async sendBookingConfirmation(userId, bookingId) {
        return this.createNotification({
            userId,
            title: 'Booking Confirmed',
            message: 'Your booking has been confirmed. We look forward to hosting you!',
            type: 'BOOKING',
            data: { bookingId },
            actionUrl: `${process.env.CLIENT_URL}/bookings/${bookingId}`,
            actionText: 'View Booking',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendBookingRequest(hostId, guestName, propertyTitle, bookingId) {
        return this.createNotification({
            userId: hostId,
            title: 'New Booking Request',
            message: `${guestName} wants to book your property "${propertyTitle}".`,
            type: 'BOOKING',
            data: { bookingId, guestName, propertyTitle },
            actionUrl: `${process.env.CLIENT_URL}/host/bookings/${bookingId}`,
            actionText: 'Review Request',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendBookingApproved(userId, propertyTitle, bookingId) {
        return this.createNotification({
            userId,
            title: 'Booking Approved!',
            message: `Your booking for "${propertyTitle}" has been approved by the host.`,
            type: 'BOOKING',
            data: { bookingId, propertyTitle },
            actionUrl: `${process.env.CLIENT_URL}/bookings/${bookingId}`,
            actionText: 'View Booking',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendBookingDeclined(userId, propertyTitle, bookingId, reason) {
        return this.createNotification({
            userId,
            title: 'Booking Declined',
            message: `Your booking request for "${propertyTitle}" has been declined.${reason ? ` Reason: ${reason}` : ''}`,
            type: 'BOOKING',
            data: { bookingId, propertyTitle, reason },
            actionUrl: `${process.env.CLIENT_URL}/search`,
            actionText: 'Find Another Property',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendCheckInReminder(userId, propertyTitle, checkInDate, bookingId) {
        return this.createNotification({
            userId,
            title: 'Check-in Reminder',
            message: `Your check-in for "${propertyTitle}" is tomorrow (${checkInDate}). Don't forget to bring your ID!`,
            type: 'BOOKING',
            data: { bookingId, propertyTitle, checkInDate },
            actionUrl: `${process.env.CLIENT_URL}/bookings/${bookingId}`,
            actionText: 'View Details',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendCheckOutReminder(userId, propertyTitle, checkOutDate, bookingId) {
        return this.createNotification({
            userId,
            title: 'Check-out Reminder',
            message: `Your check-out from "${propertyTitle}" is today (${checkOutDate}). Please ensure the property is in good condition.`,
            type: 'BOOKING',
            data: { bookingId, propertyTitle, checkOutDate },
            actionUrl: `${process.env.CLIENT_URL}/bookings/${bookingId}`,
            actionText: 'View Details',
            sendEmail: true,
        });
    }
    async sendNewMessage(userId, senderName, propertyTitle, conversationId) {
        return this.createNotification({
            userId,
            title: 'New Message',
            message: `You have a new message from ${senderName} regarding "${propertyTitle}".`,
            type: 'MESSAGE',
            data: { senderName, propertyTitle, conversationId },
            actionUrl: `${process.env.CLIENT_URL}/messages?conversation=${conversationId}`,
            actionText: 'Reply',
            sendEmail: true,
            sendSMS: false,
        });
    }
    async sendPropertyApproved(userId, propertyTitle, propertyId) {
        return this.createNotification({
            userId,
            title: 'Property Approved',
            message: `Congratulations! Your property "${propertyTitle}" has been approved and is now live on the platform.`,
            type: 'PROPERTY',
            data: { propertyTitle, propertyId },
            actionUrl: `${process.env.CLIENT_URL}/properties/${propertyId}`,
            actionText: 'View Property',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendPropertyRejected(userId, propertyTitle, propertyId, reason) {
        return this.createNotification({
            userId,
            title: 'Property Requires Updates',
            message: `Your property "${propertyTitle}" needs some updates before it can be approved. Reason: ${reason}`,
            type: 'PROPERTY',
            data: { propertyTitle, propertyId, reason },
            actionUrl: `${process.env.CLIENT_URL}/host/properties/${propertyId}/edit`,
            actionText: 'Update Property',
            sendEmail: true,
            sendSMS: false,
        });
    }
    async sendPaymentSuccess(userId, paymentId, amount) {
        return this.createNotification({
            userId,
            title: 'Payment Successful',
            message: 'Your payment has been processed successfully.',
            type: 'PAYMENT',
            data: { paymentId, amount },
            actionUrl: `${process.env.CLIENT_URL}/payments/${paymentId}`,
            actionText: 'View Receipt',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendPaymentFailed(userId, paymentId, amount) {
        return this.createNotification({
            userId,
            title: 'Payment Failed',
            message: 'Your payment could not be processed. Please try again or contact support.',
            type: 'PAYMENT',
            data: { paymentId, amount },
            actionUrl: `${process.env.CLIENT_URL}/payments/${paymentId}`,
            actionText: 'Retry Payment',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendPaymentReceived(hostId, amount, guestName, propertyTitle) {
        return this.createNotification({
            userId: hostId,
            title: 'Payment Received',
            message: `You've received a payment of AED ${amount} from ${guestName} for "${propertyTitle}".`,
            type: 'PAYMENT',
            data: { amount, guestName, propertyTitle },
            actionUrl: `${process.env.CLIENT_URL}/host/earnings`,
            actionText: 'View Earnings',
            sendEmail: true,
            sendSMS: false,
        });
    }
    async sendNewReview(userId, reviewId, rating) {
        return this.createNotification({
            userId,
            title: 'New Review Received',
            message: `You received a new ${rating}-star review for your property.`,
            type: 'REVIEW',
            data: { reviewId, rating },
            actionUrl: `/reviews/${reviewId}`,
            actionText: 'View Review',
            sendEmail: true,
        });
    }
    async sendReviewResponse(userId, propertyTitle, reviewId) {
        return this.createNotification({
            userId,
            title: 'Host Responded to Your Review',
            message: `The host of "${propertyTitle}" has responded to your review.`,
            type: 'REVIEW',
            data: { propertyTitle, reviewId },
            actionUrl: `/reviews/${reviewId}`,
            actionText: 'View Response',
            sendEmail: true,
        });
    }
    async sendKYCApproved(userId) {
        return this.createNotification({
            userId,
            title: 'Identity Verification Approved',
            message: 'Your identity has been successfully verified. You now have full access to all platform features.',
            type: 'KYC',
            data: { status: 'APPROVED' },
            actionUrl: `${process.env.CLIENT_URL}/profile`,
            actionText: 'View Profile',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendKYCRejected(userId, reason) {
        return this.createNotification({
            userId,
            title: 'Identity Verification Requires Updates',
            message: `Your identity verification needs attention. Reason: ${reason}`,
            type: 'KYC',
            data: { status: 'REJECTED', reason },
            actionUrl: `${process.env.CLIENT_URL}/profile/verification`,
            actionText: 'Update Documents',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendNewUserRegistration(adminId, userName, userEmail, userId) {
        return this.createNotification({
            userId: adminId,
            title: 'New User Registration',
            message: `${userName} (${userEmail}) has registered on the platform.`,
            type: 'ADMIN',
            data: { userName, userEmail, userId },
            actionUrl: `${process.env.CLIENT_URL}/admin/users/${userId}`,
            actionText: 'View User',
            sendEmail: false,
        });
    }
    async sendPropertySubmitted(adminId, propertyTitle, hostName, propertyId) {
        return this.createNotification({
            userId: adminId,
            title: 'New Property Listing',
            message: `${hostName} has submitted "${propertyTitle}" for approval.`,
            type: 'ADMIN',
            data: { propertyTitle, hostName, propertyId },
            actionUrl: `${process.env.CLIENT_URL}/admin/properties/${propertyId}`,
            actionText: 'Review Property',
            sendEmail: false,
        });
    }
    async sendSystemAlert(adminId, alertType, message, data) {
        return this.createNotification({
            userId: adminId,
            title: `System Alert: ${alertType}`,
            message,
            type: 'SYSTEM',
            data: { alertType, ...data },
            sendEmail: true,
        });
    }
    async sendPromotionalOffer(userId, title, message, offerData) {
        return this.createNotification({
            userId,
            title,
            message,
            type: 'PROMOTION',
            data: offerData,
            actionUrl: offerData.actionUrl,
            actionText: offerData.actionText,
            sendEmail: true,
        });
    }
    async sendWelcomeBonus(userId, bonusAmount) {
        return this.createNotification({
            userId,
            title: 'Welcome Bonus!',
            message: `Welcome to UAE Rental Platform! You've received a bonus of AED ${bonusAmount} to get started.`,
            type: 'PROMOTION',
            data: { bonusAmount },
            actionUrl: `${process.env.CLIENT_URL}/wallet`,
            actionText: 'View Wallet',
            sendEmail: true,
            sendSMS: true,
        });
    }
    async sendBulkNotification(userIds, notificationData) {
        const notifications = await Promise.all(userIds.map(userId => this.createNotification({ ...notificationData, userId })));
        return notifications;
    }
    async sendHostReminder(hostId, reminderType, data) {
        const messages = {
            'CALENDAR_UPDATE': 'Please update your property calendar to ensure accurate availability.',
            'PENDING_BOOKINGS': `You have ${data.count} pending booking requests that need your attention.`,
            'PROFILE_INCOMPLETE': 'Complete your host profile to increase your booking potential.',
            'PRICING_REVIEW': 'Consider reviewing your pricing to stay competitive in the market.',
        };
        return this.createNotification({
            userId: hostId,
            title: 'Host Reminder',
            message: messages[reminderType] || data.message,
            type: 'SYSTEM',
            data: { reminderType, ...data },
            actionUrl: data.actionUrl || `${process.env.CLIENT_URL}/host/dashboard`,
            actionText: data.actionText || 'View Dashboard',
            sendEmail: true,
        });
    }
    async sendEmailVerification(email, firstName, verificationToken) {
        try {
            const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
            const msg = {
                to: email,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@uae-rental.com',
                    name: process.env.SENDGRID_FROM_NAME || 'UAE Rental Platform',
                },
                subject: 'Verify Your Email - UAE Rental Platform',
                html: `
          <h2>Welcome to UAE Rental Platform, ${firstName}!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <br>
          <p>Best regards,<br>UAE Rental Platform Team</p>
        `,
                text: `Welcome to UAE Rental Platform, ${firstName}!\n\nPlease verify your email address by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nUAE Rental Platform Team`,
            };
            await mail_1.default.send(msg);
            console.log(`Email verification sent to ${email}`);
        }
        catch (error) {
            console.error('Error sending email verification:', error);
            throw error;
        }
    }
    async sendPasswordReset(email, firstName, resetToken) {
        try {
            const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
            const msg = {
                to: email,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@uae-rental.com',
                    name: process.env.SENDGRID_FROM_NAME || 'UAE Rental Platform',
                },
                subject: 'Password Reset - UAE Rental Platform',
                html: `
          <h2>Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>You requested a password reset for your UAE Rental Platform account. Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <br>
          <p>Best regards,<br>UAE Rental Platform Team</p>
        `,
                text: `Password Reset Request\n\nHello ${firstName},\n\nYou requested a password reset for your UAE Rental Platform account. Visit this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nUAE Rental Platform Team`,
            };
            await mail_1.default.send(msg);
            console.log(`Password reset email sent to ${email}`);
        }
        catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map