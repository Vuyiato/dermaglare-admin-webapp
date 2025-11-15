// src/services/NotificationService.ts

import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

/**
 * Notification Types
 */
export type NotificationType =
  | "appointment_approved"
  | "appointment_declined"
  | "appointment_cancelled"
  | "appointment_completed"
  | "payment_received"
  | "payment_reminder"
  | "general_message";

/**
 * Notification Priority Levels
 */
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

/**
 * Notification Document Interface
 */
export interface Notification {
  id?: string;
  userId: string; // Patient's Firebase Auth UID
  userEmail: string; // Patient's email
  userName?: string; // Patient's name for display
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  relatedTo?: {
    appointmentId?: string;
    invoiceId?: string;
    chatId?: string;
  };
  read: boolean;
  readAt?: Timestamp | null;
  createdAt: Timestamp;
  expiresAt?: Timestamp | null; // Optional expiry for time-sensitive notifications
  actionUrl?: string; // Deep link or URL for the patient to take action
}

/**
 * Notification Service
 * Handles creating and sending notifications to patients
 */
class NotificationService {
  private notificationsCollection = collection(db, "notifications");

  /**
   * Create a notification for appointment approval
   */
  async sendAppointmentApprovalNotification(
    userId: string,
    userEmail: string,
    userName: string,
    appointmentDetails: {
      appointmentId: string;
      serviceName: string;
      appointmentDate: string;
      timeSlot: string;
      amount: number;
      adminNotes?: string;
    }
  ): Promise<string> {
    const notification: Omit<Notification, "id"> = {
      userId,
      userEmail,
      userName,
      type: "appointment_approved",
      title: "✅ Appointment Confirmed!",
      message: `Your appointment for ${appointmentDetails.serviceName} on ${
        appointmentDetails.appointmentDate
      } at ${appointmentDetails.timeSlot} has been confirmed. ${
        appointmentDetails.adminNotes
          ? `\n\nAdmin Note: ${appointmentDetails.adminNotes}`
          : ""
      }`,
      priority: "high",
      relatedTo: {
        appointmentId: appointmentDetails.appointmentId,
      },
      read: false,
      readAt: null,
      createdAt: serverTimestamp() as Timestamp,
      actionUrl: `/appointments/${appointmentDetails.appointmentId}`,
    };

    try {
      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log(
        `✅ Appointment approval notification sent to ${userName} (${userEmail})`
      );
      return docRef.id;
    } catch (error) {
      console.error("❌ Error sending approval notification:", error);
      throw error;
    }
  }

  /**
   * Create a notification for appointment decline
   */
  async sendAppointmentDeclineNotification(
    userId: string,
    userEmail: string,
    userName: string,
    appointmentDetails: {
      appointmentId: string;
      serviceName: string;
      appointmentDate: string;
      timeSlot: string;
      reason: string;
    }
  ): Promise<string> {
    const notification: Omit<Notification, "id"> = {
      userId,
      userEmail,
      userName,
      type: "appointment_declined",
      title: "❌ Appointment Declined",
      message: `We're sorry, but your appointment for ${appointmentDetails.serviceName} on ${appointmentDetails.appointmentDate} at ${appointmentDetails.timeSlot} has been declined.\n\nReason: ${appointmentDetails.reason}\n\nPlease contact us to reschedule or for more information.`,
      priority: "high",
      relatedTo: {
        appointmentId: appointmentDetails.appointmentId,
      },
      read: false,
      readAt: null,
      createdAt: serverTimestamp() as Timestamp,
      actionUrl: `/appointments`,
    };

    try {
      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log(
        `✅ Appointment decline notification sent to ${userName} (${userEmail})`
      );
      return docRef.id;
    } catch (error) {
      console.error("❌ Error sending decline notification:", error);
      throw error;
    }
  }

  /**
   * Create a notification for appointment cancellation
   */
  async sendAppointmentCancellationNotification(
    userId: string,
    userEmail: string,
    userName: string,
    appointmentDetails: {
      appointmentId: string;
      serviceName: string;
      appointmentDate: string;
      timeSlot: string;
      reason?: string;
    }
  ): Promise<string> {
    const notification: Omit<Notification, "id"> = {
      userId,
      userEmail,
      userName,
      type: "appointment_cancelled",
      title: "🗓️ Appointment Cancelled",
      message: `Your appointment for ${appointmentDetails.serviceName} on ${
        appointmentDetails.appointmentDate
      } at ${appointmentDetails.timeSlot} has been cancelled.${
        appointmentDetails.reason
          ? `\n\nReason: ${appointmentDetails.reason}`
          : ""
      }`,
      priority: "medium",
      relatedTo: {
        appointmentId: appointmentDetails.appointmentId,
      },
      read: false,
      readAt: null,
      createdAt: serverTimestamp() as Timestamp,
      actionUrl: `/appointments`,
    };

    try {
      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log(
        `✅ Cancellation notification sent to ${userName} (${userEmail})`
      );
      return docRef.id;
    } catch (error) {
      console.error("❌ Error sending cancellation notification:", error);
      throw error;
    }
  }

  /**
   * Create a notification for payment received
   */
  async sendPaymentReceivedNotification(
    userId: string,
    userEmail: string,
    userName: string,
    paymentDetails: {
      appointmentId?: string;
      invoiceId?: string;
      amount: number;
      transactionId: string;
      serviceName: string;
    }
  ): Promise<string> {
    const notification: Omit<Notification, "id"> = {
      userId,
      userEmail,
      userName,
      type: "payment_received",
      title: "💰 Payment Received",
      message: `We've received your payment of R${paymentDetails.amount.toFixed(
        2
      )} for ${paymentDetails.serviceName}. Transaction ID: ${
        paymentDetails.transactionId
      }`,
      priority: "medium",
      relatedTo: {
        appointmentId: paymentDetails.appointmentId,
        invoiceId: paymentDetails.invoiceId,
      },
      read: false,
      readAt: null,
      createdAt: serverTimestamp() as Timestamp,
      actionUrl: paymentDetails.invoiceId
        ? `/invoices/${paymentDetails.invoiceId}`
        : `/appointments/${paymentDetails.appointmentId}`,
    };

    try {
      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log(
        `✅ Payment received notification sent to ${userName} (${userEmail})`
      );
      return docRef.id;
    } catch (error) {
      console.error("❌ Error sending payment notification:", error);
      throw error;
    }
  }

  /**
   * Create a general notification
   */
  async sendGeneralNotification(
    userId: string,
    userEmail: string,
    userName: string,
    title: string,
    message: string,
    priority: NotificationPriority = "medium",
    actionUrl?: string
  ): Promise<string> {
    const notification: Omit<Notification, "id"> = {
      userId,
      userEmail,
      userName,
      type: "general_message",
      title,
      message,
      priority,
      read: false,
      readAt: null,
      createdAt: serverTimestamp() as Timestamp,
      actionUrl,
    };

    try {
      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log(`✅ General notification sent to ${userName} (${userEmail})`);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error sending general notification:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
