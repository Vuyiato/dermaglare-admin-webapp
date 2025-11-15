/**
 * Message Notification Service
 *
 * Automatically sends notifications when new messages are received
 * Works for both Patient Portal and Admin WebApp
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export interface MessageNotificationData {
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: "patient" | "admin" | "doctor";
  messageText: string;
  recipientId: string;
  recipientRole: "patient" | "admin" | "doctor";
}

/**
 * Send a notification when a new message is received
 *
 * @param data - Message notification data
 * @returns The notification document ID
 */
export const sendMessageNotification = async (
  data: MessageNotificationData
): Promise<string> => {
  try {
    console.log("💬 Preparing message notification:", {
      from: data.senderName,
      to: data.recipientId,
      role: data.recipientRole,
    });

    // Create notification based on recipient role
    const notificationData = {
      userId: data.recipientId,
      type: "new_message",
      title: `New message from ${data.senderName}`,
      message:
        data.messageText.length > 100
          ? data.messageText.substring(0, 100) + "..."
          : data.messageText,
      priority: "medium" as const,
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
      relatedTo: {
        chatId: data.chatId,
        senderId: data.senderId,
        senderRole: data.senderRole,
      },
      actionUrl: data.recipientRole === "patient" ? "/chat" : "/chat",
    };

    // Add notification to Firestore
    const notificationRef = await addDoc(
      collection(db, "notifications"),
      notificationData
    );

    console.log("✅ Message notification sent successfully");
    console.log("🎯 Notification ID:", notificationRef.id);
    console.log(
      "📍 Firestore URL:",
      `https://console.firebase.google.com/project/dermaglareapp/firestore/data/notifications/${notificationRef.id}`
    );

    return notificationRef.id;
  } catch (error) {
    console.error("❌ Error sending message notification:", error);
    throw error;
  }
};

/**
 * Get chat participant information
 * Helper function to determine who should receive the notification
 *
 * @param chatId - The chat document ID
 * @param senderId - The ID of the message sender
 * @returns Recipient information
 */
export const getChatRecipient = async (
  chatId: string,
  senderId: string
): Promise<{
  recipientId: string;
  recipientRole: "patient" | "admin" | "doctor";
} | null> => {
  try {
    console.log("🔍 Getting recipient for chat:", { chatId, senderId });
    const chatDoc = await getDoc(doc(db, "chats", chatId));

    if (!chatDoc.exists()) {
      console.error("❌ Chat document not found:", chatId);
      return null;
    }

    const chatData = chatDoc.data();
    console.log("📋 Chat data:", {
      patientId: chatData.patientId,
      userId: chatData.userId,
      senderId,
    });

    // If sender is patient, recipient is admin
    if (senderId === chatData.patientId || senderId === chatData.userId) {
      console.log("✅ Sender is patient, recipient is admin");
      return {
        recipientId: "admin", // Admin will see all patient messages
        recipientRole: "admin",
      };
    }

    // If sender is admin/doctor, recipient is patient
    if (senderId === "admin" || senderId === "doctor") {
      const recipientId = chatData.patientId || chatData.userId;
      console.log(
        "✅ Sender is admin/doctor, recipient is patient:",
        recipientId
      );
      return {
        recipientId,
        recipientRole: "patient",
      };
    }

    console.warn(
      "⚠️ Could not determine recipient for chat:",
      chatId,
      "senderId:",
      senderId
    );
    return null;
  } catch (error) {
    console.error("❌ Error getting chat recipient:", error);
    return null;
  }
};

/**
 * Send notification automatically after a message is sent
 * Call this function after successfully adding a message to Firestore
 *
 * @param chatId - The chat ID
 * @param senderId - The sender's user ID
 * @param senderName - The sender's display name
 * @param senderRole - The sender's role (patient, admin, doctor)
 * @param messageText - The message content
 */
export const notifyMessageRecipient = async (
  chatId: string,
  senderId: string,
  senderName: string,
  senderRole: "patient" | "admin" | "doctor",
  messageText: string
): Promise<void> => {
  try {
    // Get the recipient information
    const recipient = await getChatRecipient(chatId, senderId);

    if (!recipient) {
      console.warn("⚠️ No recipient found, skipping notification");
      return;
    }

    // Send the notification
    await sendMessageNotification({
      chatId,
      senderId,
      senderName,
      senderRole,
      messageText,
      recipientId: recipient.recipientId,
      recipientRole: recipient.recipientRole,
    });
  } catch (error) {
    console.error("❌ Error notifying message recipient:", error);
    // Don't throw - notification failure shouldn't break message sending
  }
};

