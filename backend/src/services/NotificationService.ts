import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { supabase } from '../lib/supabase';

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

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class NotificationService {
  private twilioClient: any;
  private emailEnabled: boolean;
  private smsEnabled: boolean;

  constructor() {
    // Initialize SendGrid
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.emailEnabled = true;
      console.log('✅ SendGrid email service initialized successfully');
    } else {
      this.emailEnabled = false;
      console.warn('SendGrid API key not found. Email notifications disabled.');
    }

    // Initialize Twilio with proper API Key handling
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        // Check if using API Key (starts with SK) - this is valid for Twilio
        if (process.env.TWILIO_ACCOUNT_SID.startsWith('SK')) {
          // API Key format - this is actually correct for many Twilio setups
          this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID, // This is the API Key SID
            process.env.TWILIO_AUTH_TOKEN   // This is the API Key Secret
          );
          this.smsEnabled = true;
          console.log('✅ Twilio SMS service initialized with API Key successfully');
        } else if (process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
          // Standard Account SID format
          this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
          );
          this.smsEnabled = true;
          console.log('✅ Twilio SMS service initialized with Account SID successfully');
        } else {
          console.warn('Invalid Twilio Account SID format. SMS notifications disabled.');
          this.smsEnabled = false;
        }
      } catch (error) {
        console.error('Twilio initialization error:', error.message);
        this.smsEnabled = false;
      }
    } else {
      this.smsEnabled = false;
      console.warn('Twilio credentials incomplete. SMS notifications disabled.');
      console.warn('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    }
  }

  async createNotification(data: NotificationData): Promise<any> {
    try {
      // Create notification in database
      const { data: notification, error: notificationError } = await supabase
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

      if (notificationError) throw notificationError;

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, phone, first_name, last_name, language')
        .eq('id', data.userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Send email notification
      if (data.sendEmail && this.emailEnabled && user.email) {
        await this.sendEmailNotification(user, notification, data);
      }

      // Send SMS notification
      if (data.sendSMS && this.smsEnabled && user.phone) {
        await this.sendSMSNotification(user, notification, data);
      }

      // TODO: Send push notification
      if (data.sendPush) {
        await this.sendPushNotification(user, notification, data);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  private async sendEmailNotification(user: any, notification: any, data: NotificationData): Promise<void> {
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

      await sgMail.send(msg);
      
      // Update notification status
      await supabase
        .from('notifications')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      console.log(`Email sent to ${user.email} for notification ${notification.id}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  private async sendSMSNotification(user: any, notification: any, data: NotificationData): Promise<void> {
    try {
      const message = this.getSMSMessage(data.type, data, user);
      
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone,
      });

      // Update notification status
      await supabase
        .from('notifications')
        .update({
          sms_sent: true,
          sms_sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      console.log(`SMS sent to ${user.phone} for notification ${notification.id}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }

  private async sendPushNotification(user: any, notification: any, data: NotificationData): Promise<void> {
    // TODO: Implement push notification using FCM or similar
    console.log('Push notification would be sent here');
    
    await supabase
      .from('notifications')
      .update({
        push_sent: true,
        push_sent_at: new Date().toISOString(),
      })
      .eq('id', notification.id);
  }

  private getEmailTemplate(type: string, data: NotificationData, user: any): EmailTemplate {
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

  private getSMSMessage(type: string, data: NotificationData, user: any): string {
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

  // Convenience methods for common notifications
  async sendBookingConfirmation(userId: string, bookingId: string): Promise<any> {
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

  // Guest Notifications
  async sendBookingRequest(hostId: string, guestName: string, propertyTitle: string, bookingId: string): Promise<any> {
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

  async sendBookingApproved(userId: string, propertyTitle: string, bookingId: string): Promise<any> {
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

  async sendBookingDeclined(userId: string, propertyTitle: string, bookingId: string, reason?: string): Promise<any> {
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

  async sendCheckInReminder(userId: string, propertyTitle: string, checkInDate: string, bookingId: string): Promise<any> {
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

  async sendCheckOutReminder(userId: string, propertyTitle: string, checkOutDate: string, bookingId: string): Promise<any> {
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

  // Host Notifications
  async sendNewMessage(userId: string, senderName: string, propertyTitle: string, conversationId: string): Promise<any> {
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

  async sendPropertyApproved(userId: string, propertyTitle: string, propertyId: string): Promise<any> {
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

  async sendPropertyRejected(userId: string, propertyTitle: string, propertyId: string, reason: string): Promise<any> {
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

  async sendPaymentSuccess(userId: string, paymentId: string, amount: number): Promise<any> {
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

  async sendPaymentFailed(userId: string, paymentId: string, amount: number): Promise<any> {
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

  async sendPaymentReceived(hostId: string, amount: number, guestName: string, propertyTitle: string): Promise<any> {
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

  async sendNewReview(userId: string, reviewId: string, rating: number): Promise<any> {
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

  async sendReviewResponse(userId: string, propertyTitle: string, reviewId: string): Promise<any> {
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

  // KYC Notifications
  async sendKYCApproved(userId: string): Promise<any> {
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

  async sendKYCRejected(userId: string, reason: string): Promise<any> {
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

  // Admin Notifications
  async sendNewUserRegistration(adminId: string, userName: string, userEmail: string, userId: string): Promise<any> {
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

  async sendPropertySubmitted(adminId: string, propertyTitle: string, hostName: string, propertyId: string): Promise<any> {
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

  async sendSystemAlert(adminId: string, alertType: string, message: string, data?: any): Promise<any> {
    return this.createNotification({
      userId: adminId,
      title: `System Alert: ${alertType}`,
      message,
      type: 'SYSTEM',
      data: { alertType, ...data },
      sendEmail: true,
    });
  }

  async sendPromotionalOffer(userId: string, title: string, message: string, offerData: any): Promise<any> {
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

  async sendWelcomeBonus(userId: string, bonusAmount: number): Promise<any> {
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

  // Viewing Request Notifications
  async sendViewingRequest(agentId: string, guestName: string, propertyTitle: string, requestedDate: string, requestedTime: string, requestId: string): Promise<any> {
    return this.createNotification({
      userId: agentId,
      title: 'New Viewing Request',
      message: `${guestName} has requested to view "${propertyTitle}" on ${requestedDate} at ${requestedTime}.`,
      type: 'PROPERTY',
      data: { guestName, propertyTitle, requestedDate, requestedTime, requestId },
      actionUrl: `${process.env.CLIENT_URL}/agent/dashboard?tab=viewing-requests`,
      actionText: 'View Request',
      sendEmail: true,
      sendSMS: true,
    });
  }

  async sendViewingConfirmed(guestEmail: string, guestName: string, propertyTitle: string, confirmedDate: string, confirmedTime: string): Promise<void> {
    try {
      const msg = {
        to: guestEmail,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@uae-rental.com',
          name: process.env.SENDGRID_FROM_NAME || 'UAE Rental Platform',
        },
        subject: 'Viewing Request Confirmed - UAE Rental Platform',
        html: `
          <h2>Viewing Request Confirmed!</h2>
          <p>Hello ${guestName},</p>
          <p>Great news! Your viewing request for <strong>"${propertyTitle}"</strong> has been confirmed.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Viewing Details:</h3>
            <p><strong>Property:</strong> ${propertyTitle}</p>
            <p><strong>Date:</strong> ${confirmedDate}</p>
            <p><strong>Time:</strong> ${confirmedTime}</p>
          </div>
          <p>Please arrive on time and bring a valid ID for verification.</p>
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          <br>
          <p>Best regards,<br>UAE Rental Platform Team</p>
        `,
        text: `Viewing Request Confirmed!\n\nHello ${guestName},\n\nGreat news! Your viewing request for "${propertyTitle}" has been confirmed.\n\nViewing Details:\nProperty: ${propertyTitle}\nDate: ${confirmedDate}\nTime: ${confirmedTime}\n\nPlease arrive on time and bring a valid ID for verification.\n\nIf you need to reschedule or cancel, please contact us as soon as possible.\n\nBest regards,\nUAE Rental Platform Team`,
      };

      if (this.emailEnabled) {
        await sgMail.send(msg);
        console.log(`Viewing confirmation email sent to ${guestEmail}`);
      }
    } catch (error) {
      console.error('Error sending viewing confirmation email:', error);
      throw error;
    }
  }

  async sendViewingRejected(guestEmail: string, guestName: string, propertyTitle: string): Promise<void> {
    try {
      const msg = {
        to: guestEmail,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@uae-rental.com',
          name: process.env.SENDGRID_FROM_NAME || 'UAE Rental Platform',
        },
        subject: 'Viewing Request Update - UAE Rental Platform',
        html: `
          <h2>Viewing Request Update</h2>
          <p>Hello ${guestName},</p>
          <p>Thank you for your interest in <strong>"${propertyTitle}"</strong>.</p>
          <p>Unfortunately, we're unable to accommodate your viewing request at the requested time. This could be due to scheduling conflicts or the property no longer being available.</p>
          <p>We encourage you to:</p>
          <ul>
            <li>Browse other similar properties on our platform</li>
            <li>Contact us to discuss alternative viewing times</li>
            <li>Set up alerts for similar properties in your preferred area</li>
          </ul>
          <p>We appreciate your understanding and look forward to helping you find your perfect home.</p>
          <br>
          <p>Best regards,<br>UAE Rental Platform Team</p>
        `,
        text: `Viewing Request Update\n\nHello ${guestName},\n\nThank you for your interest in "${propertyTitle}".\n\nUnfortunately, we're unable to accommodate your viewing request at the requested time. This could be due to scheduling conflicts or the property no longer being available.\n\nWe encourage you to:\n- Browse other similar properties on our platform\n- Contact us to discuss alternative viewing times\n- Set up alerts for similar properties in your preferred area\n\nWe appreciate your understanding and look forward to helping you find your perfect home.\n\nBest regards,\nUAE Rental Platform Team`,
      };

      if (this.emailEnabled) {
        await sgMail.send(msg);
        console.log(`Viewing rejection email sent to ${guestEmail}`);
      }
    } catch (error) {
      console.error('Error sending viewing rejection email:', error);
      throw error;
    }
  }

  async sendBulkNotification(userIds: string[], notificationData: Omit<NotificationData, 'userId'>): Promise<any[]> {
    const notifications = await Promise.all(
      userIds.map(userId => this.createNotification({ ...notificationData, userId }))
    );
    return notifications;
  }

  async sendHostReminder(hostId: string, reminderType: string, data: any): Promise<any> {
    const messages = {
      'CALENDAR_UPDATE': 'Please update your property calendar to ensure accurate availability.',
      'PENDING_BOOKINGS': `You have ${data.count} pending booking requests that need your attention.`,
      'PROFILE_INCOMPLETE': 'Complete your host profile to increase your booking potential.',
      'PRICING_REVIEW': 'Consider reviewing your pricing to stay competitive in the market.',
    };

    return this.createNotification({
      userId: hostId,
      title: 'Host Reminder',
      message: messages[reminderType as keyof typeof messages] || data.message,
      type: 'SYSTEM',
      data: { reminderType, ...data },
      actionUrl: data.actionUrl || `${process.env.CLIENT_URL}/host/dashboard`,
      actionText: data.actionText || 'View Dashboard',
      sendEmail: true,
    });
  }

  async sendEmailVerification(email: string, firstName: string, verificationToken: string): Promise<void> {
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

      await sgMail.send(msg);
      console.log(`Email verification sent to ${email}`);
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error;
    }
  }

  async sendPasswordReset(email: string, firstName: string, resetToken: string): Promise<void> {
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

      await sgMail.send(msg);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
} 