// Admin WebApp - Notification Sender
// Sends notifications to Firestore for patients to receive

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Send notification when appointment is APPROVED
 */
export const sendAppointmentApprovedNotification = async (
  userId: string,
  userEmail: string,
  userName: string,
  appointmentDetails: {
    appointmentId: string;
    serviceName: string;
    appointmentDate: string;
    timeSlot: string;
    amount?: number;
  }
) => {
  try {
    // VALIDATION: Check required fields
    if (!userId || userId.trim() === "") {
      throw new Error(
        "❌ CRITICAL: userId is missing or empty. Cannot send notification without userId!"
      );
    }
    if (!userEmail || userEmail.trim() === "") {
      throw new Error("❌ CRITICAL: userEmail is missing or empty.");
    }

    console.log("📤 Sending approval notification to:", userName);
    console.log("📝 Validation passed - userId:", userId);
    console.log("📝 Validation passed - userEmail:", userEmail);
    console.log("📋 Appointment details:", appointmentDetails);

    const notificationData = {
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      type: "appointment_approved",
      title: "✅ Appointment Confirmed!",
      message: `Your appointment for ${appointmentDetails.serviceName} on ${
        appointmentDetails.appointmentDate
      } at ${appointmentDetails.timeSlot} has been confirmed.${
        appointmentDetails.amount
          ? ` Amount: R${appointmentDetails.amount}`
          : ""
      }`,
      priority: "high",
      relatedTo: {
        appointmentId: appointmentDetails.appointmentId,
      },
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
      actionUrl: `/appointments`,
    };

    console.log("📦 Notification data:", notificationData);

    const docRef = await addDoc(
      collection(db, "notifications"),
      notificationData
    );

    console.log("✅ Approval notification sent to patient:", userName);
    console.log("🎯 Notification ID:", docRef.id);
    console.log(
      "🔗 Firestore: https://console.firebase.google.com/project/dermaglareapp/firestore/data/notifications/" +
        docRef.id
    );

    return docRef.id;
  } catch (error) {
    console.error("❌ Error sending approval notification:", error);
    throw error;
  }
};

/**
 * Send notification when appointment is DECLINED
 */
export const sendAppointmentDeclinedNotification = async (
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
) => {
  try {
    // VALIDATION: Check required fields
    if (!userId || userId.trim() === "") {
      throw new Error(
        "❌ CRITICAL: userId is missing or empty. Cannot send notification without userId!"
      );
    }
    if (!userEmail || userEmail.trim() === "") {
      throw new Error("❌ CRITICAL: userEmail is missing or empty.");
    }

    console.log("📤 Sending decline notification to:", userName);
    console.log("📝 Validation passed - userId:", userId);
    console.log("📝 Validation passed - userEmail:", userEmail);

    const notificationData = {
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      type: "appointment_declined",
      title: "❌ Appointment Not Approved",
      message: `Unfortunately, your appointment for ${
        appointmentDetails.serviceName
      } on ${appointmentDetails.appointmentDate} at ${
        appointmentDetails.timeSlot
      } could not be confirmed.${
        appointmentDetails.reason ? ` Reason: ${appointmentDetails.reason}` : ""
      } Please contact us for alternative dates.`,
      priority: "high",
      relatedTo: {
        appointmentId: appointmentDetails.appointmentId,
      },
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
      actionUrl: `/appointments`,
    };

    console.log("📦 Notification data:", notificationData);

    const docRef = await addDoc(
      collection(db, "notifications"),
      notificationData
    );

    console.log("✅ Decline notification sent to patient:", userName);
    console.log("🎯 Notification ID:", docRef.id);
    console.log(
      "🔗 Firestore: https://console.firebase.google.com/project/dermaglareapp/firestore/data/notifications/" +
        docRef.id
    );

    return docRef.id;
  } catch (error) {
    console.error("❌ Error sending decline notification:", error);
    throw error;
  }
};

/**
 * Send notification when payment is RECEIVED
 */
export const sendPaymentReceivedNotification = async (
  userId: string,
  userEmail: string,
  userName: string,
  paymentDetails: {
    appointmentId?: string;
    amount: number;
    transactionId: string;
    serviceName: string;
  }
) => {
  try {
    console.log("📤 Sending payment notification to:", userName);

    const notificationData = {
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      type: "payment_received",
      title: "💰 Payment Confirmed",
      message: `Your payment of R${paymentDetails.amount.toFixed(2)} for ${
        paymentDetails.serviceName
      } has been received. Transaction ID: ${paymentDetails.transactionId}`,
      priority: "medium",
      relatedTo: {
        appointmentId: paymentDetails.appointmentId,
      },
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
      actionUrl: `/billing`,
    };

    console.log("📦 Notification data:", notificationData);

    const docRef = await addDoc(
      collection(db, "notifications"),
      notificationData
    );

    console.log("✅ Payment notification sent to patient:", userName);
    console.log("🎯 Notification ID:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("❌ Error sending payment notification:", error);
    throw error;
  }
};
