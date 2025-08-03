const Notification = require('../models/Notification');
const User = require('../models/User');
const Ride = require('../models/Ride');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Initialize email transporter
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Initialize Twilio client for SMS
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class NotificationService {
  // Create and send notification
  static async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      
      // Send immediately if scheduled for now or past
      if (!notification.scheduledFor || notification.scheduledFor <= new Date()) {
        await this.sendNotification(notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send notification through all configured channels
  static async sendNotification(notification) {
    try {
      const promises = [];
      
      if (notification.channels.email) {
        promises.push(this.sendEmail(notification));
      }
      
      if (notification.channels.sms) {
        promises.push(this.sendSMS(notification));
      }
      
      if (notification.channels.push) {
        promises.push(this.sendPushNotification(notification));
      }
      
      if (notification.channels.inApp) {
        promises.push(this.sendInAppNotification(notification));
      }
      
      await Promise.allSettled(promises);
      
      // Update notification status
      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();
      
    } catch (error) {
      console.error('Error sending notification:', error);
      notification.status = 'failed';
      await notification.save();
      throw error;
    }
  }

  // Send email notification
  static async sendEmail(notification) {
    try {
      const emailTemplate = await this.getEmailTemplate(notification.type);
      const emailContent = this.replaceTemplateVariables(emailTemplate, notification);
      
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: notification.recipient.email,
        subject: notification.title,
        html: emailContent
      };
      
      const result = await emailTransporter.sendMail(mailOptions);
      
      notification.delivery.email.sent = true;
      notification.delivery.email.sentAt = new Date();
      notification.delivery.email.delivered = true;
      notification.delivery.email.deliveredAt = new Date();
      
      await notification.save();
      
      return result;
    } catch (error) {
      notification.delivery.email.error = error.message;
      await notification.save();
      throw error;
    }
  }

  // Send SMS notification
  static async sendSMS(notification) {
    try {
      const smsTemplate = await this.getSMSTemplate(notification.type);
      const smsContent = this.replaceTemplateVariables(smsTemplate, notification);
      
      const result = await twilioClient.messages.create({
        body: smsContent,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.recipient.phone
      });
      
      notification.delivery.sms.sent = true;
      notification.delivery.sms.sentAt = new Date();
      notification.delivery.sms.delivered = true;
      notification.delivery.sms.deliveredAt = new Date();
      
      await notification.save();
      
      return result;
    } catch (error) {
      notification.delivery.sms.error = error.message;
      await notification.save();
      throw error;
    }
  }

  // Send push notification
  static async sendPushNotification(notification) {
    try {
      // This would integrate with Firebase Cloud Messaging or similar
      // For now, we'll just mark it as sent
      notification.delivery.push.sent = true;
      notification.delivery.push.sentAt = new Date();
      notification.delivery.push.delivered = true;
      notification.delivery.push.deliveredAt = new Date();
      
      await notification.save();
      
      return { success: true };
    } catch (error) {
      notification.delivery.push.error = error.message;
      await notification.save();
      throw error;
    }
  }

  // Send in-app notification
  static async sendInAppNotification(notification) {
    try {
      notification.delivery.inApp.sent = true;
      notification.delivery.inApp.sentAt = new Date();
      
      await notification.save();
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Get email template
  static async getEmailTemplate(type) {
    const templates = {
      'ride-booked': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b35;">🚗 Ride Booked Successfully!</h2>
          <p>Hello {{recipientName}},</p>
          <p>Your ride has been booked successfully. Here are the details:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Pickup:</strong> {{pickupLocation}}</p>
            <p><strong>Drop:</strong> {{dropLocation}}</p>
            <p><strong>Date:</strong> {{rideDate}}</p>
            <p><strong>Status:</strong> {{rideStatus}}</p>
          </div>
          <p>We'll notify you once a driver is assigned.</p>
          <p>Thank you for choosing our service!</p>
        </div>
      `,
      'ride-approved': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">✅ Ride Approved!</h2>
          <p>Hello {{recipientName}},</p>
          <p>Great news! Your ride request has been approved.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Pickup:</strong> {{pickupLocation}}</p>
            <p><strong>Drop:</strong> {{dropLocation}}</p>
            <p><strong>Date:</strong> {{rideDate}}</p>
          </div>
          <p>We'll assign a driver soon and notify you with the details.</p>
        </div>
      `,
      'driver-assigned': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">👨‍💼 Driver Assigned!</h2>
          <p>Hello {{recipientName}},</p>
          <p>A driver has been assigned to your ride:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Driver:</strong> {{driverName}}</p>
            <p><strong>Vehicle:</strong> {{vehicleDetails}}</p>
            <p><strong>Phone:</strong> {{driverPhone}}</p>
            <p><strong>Estimated Arrival:</strong> {{estimatedArrival}}</p>
          </div>
          <p>Please be ready at the pickup location.</p>
        </div>
      `,
      'pickup-reminder': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f39c12;">⏰ Pickup Reminder</h2>
          <p>Hello {{recipientName}},</p>
          <p>This is a reminder that your ride is scheduled in {{timeUntilPickup}}.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Pickup:</strong> {{pickupLocation}}</p>
            <p><strong>Drop:</strong> {{dropLocation}}</p>
            <p><strong>Pickup Time:</strong> {{pickupTime}}</p>
          </div>
          <p>Please be ready at the pickup location.</p>
        </div>
      `
    };
    
    return templates[type] || templates['ride-booked'];
  }

  // Get SMS template
  static async getSMSTemplate(type) {
    const templates = {
      'ride-booked': '🚗 Ride booked! Pickup: {{pickupLocation}}, Drop: {{dropLocation}}, Date: {{rideDate}}. Status: {{rideStatus}}',
      'ride-approved': '✅ Ride approved! Pickup: {{pickupLocation}}, Drop: {{dropLocation}}, Date: {{rideDate}}',
      'driver-assigned': '👨‍💼 Driver assigned: {{driverName}}, Vehicle: {{vehicleDetails}}, Phone: {{driverPhone}}, ETA: {{estimatedArrival}}',
      'pickup-reminder': '⏰ Pickup reminder: Your ride is in {{timeUntilPickup}}. Pickup: {{pickupLocation}} at {{pickupTime}}'
    };
    
    return templates[type] || 'Notification: {{message}}';
  }

  // Replace template variables
  static replaceTemplateVariables(template, notification) {
    let content = template;
    
    // Replace basic variables
    content = content.replace(/{{recipientName}}/g, notification.recipient.name || 'User');
    content = content.replace(/{{message}}/g, notification.message);
    
    // Replace ride-specific variables if available
    if (notification.data) {
      Object.keys(notification.data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, notification.data[key]);
      });
    }
    
    return content;
  }

  // Schedule notification
  static async scheduleNotification(notificationData, scheduledFor) {
    try {
      const notification = new Notification({
        ...notificationData,
        scheduledFor,
        status: 'scheduled'
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Send ride-related notifications
  static async sendRideNotification(ride, type, additionalData = {}) {
    try {
      const user = await User.findById(ride.user);
      if (!user) throw new Error('User not found');
      
      const notificationData = {
        recipient: {
          type: 'user',
          id: user._id,
          email: user.email,
          phone: user.profile?.phone,
          name: user.name
        },
        type,
        relatedRide: ride._id,
        data: {
          pickupLocation: ride.pickup,
          dropLocation: ride.drop,
          rideDate: new Date(ride.date).toLocaleString(),
          rideStatus: ride.status,
          ...additionalData
        }
      };
      
      // Set channels based on user preferences
      if (user.preferences?.notifications) {
        notificationData.channels = {
          email: user.preferences.notifications.email,
          sms: user.preferences.notifications.sms,
          push: user.preferences.notifications.push,
          inApp: true
        };
      }
      
      return await this.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending ride notification:', error);
      throw error;
    }
  }

  // Send pickup reminder
  static async sendPickupReminder(ride) {
    try {
      const pickupTime = new Date(ride.timing.scheduledPickup);
      const now = new Date();
      const timeUntilPickup = Math.round((pickupTime - now) / (1000 * 60)); // minutes
      
      if (timeUntilPickup <= 30 && timeUntilPickup > 0) {
        await this.sendRideNotification(ride, 'pickup-reminder', {
          timeUntilPickup: `${timeUntilPickup} minutes`,
          pickupTime: pickupTime.toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('Error sending pickup reminder:', error);
    }
  }

  // Process scheduled notifications
  static async processScheduledNotifications() {
    try {
      const pendingNotifications = await Notification.findPending();
      
      for (const notification of pendingNotifications) {
        await this.sendNotification(notification);
      }
      
      return pendingNotifications.length;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      throw error;
    }
  }

  // Retry failed notifications
  static async retryFailedNotifications() {
    try {
      const failedNotifications = await Notification.findFailedForRetry();
      
      for (const notification of failedNotifications) {
        notification.retryCount += 1;
        notification.nextRetryAt = new Date(Date.now() + Math.pow(2, notification.retryCount) * 60 * 1000); // exponential backoff
        await notification.save();
        
        await this.sendNotification(notification);
      }
      
      return failedNotifications.length;
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const notifications = await Notification.find({
        'recipient.id': userId,
        'recipient.type': 'user'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
      const total = await Notification.countDocuments({
        'recipient.id': userId,
        'recipient.type': 'user'
      });
      
      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      return await Notification.markAsRead(notificationId, userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    try {
      return await Notification.markAllAsRead(userId, 'user');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 