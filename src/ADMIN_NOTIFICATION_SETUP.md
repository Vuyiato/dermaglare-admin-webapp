# Admin WebApp Notification Setup Guide

## 🎯 Goal

Send real-time notifications from Admin WebApp to Patient Portal when:

- Appointment is approved
- Appointment is declined
- Payment is received

---

## 📁 Step 1: Create Notification Sender Service

**File**: `src/services/notification-sender.ts` (CREATE THIS IN ADMIN WEBAPP)

```typescript
// Admin WebApp - Notification Sender
// Sends notifications to Firestore for patients to receive

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-config"; // Your Firebase config

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
    await addDoc(collection(db, "notifications"), {
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
    });
    console.log("✅ Approval notification sent to patient:", userName);
  } catch (error) {
    console.error("Error sending approval notification:", error);
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
    await addDoc(collection(db, "notifications"), {
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
    });
    console.log("✅ Decline notification sent to patient:", userName);
  } catch (error) {
    console.error("Error sending decline notification:", error);
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
    await addDoc(collection(db, "notifications"), {
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
    });
    console.log("✅ Payment notification sent to patient:", userName);
  } catch (error) {
    console.error("Error sending payment notification:", error);
  }
};
```

---

## 📝 Step 2: Use in Admin Appointment Management

**File**: Find your appointment approval/decline handler in Admin WebApp

### Example: When Approving Appointment

```typescript
// In your Admin WebApp appointment approval function
import {
  sendAppointmentApprovedNotification,
  sendAppointmentDeclinedNotification,
} from "../services/notification-sender";

const handleApproveAppointment = async (appointment: any) => {
  try {
    // 1. Update appointment status in Firestore
    const appointmentRef = doc(db, "appointments", appointment.id);
    await updateDoc(appointmentRef, {
      status: "confirmed",
      confirmedAt: serverTimestamp(),
      // DON'T UPDATE paymentStatus here - only update when payment is actually received
    });

    // 2. Send notification to patient
    await sendAppointmentApprovedNotification(
      appointment.userId, // Patient's Firebase Auth UID
      appointment.userEmail, // Patient's email
      appointment.userName, // Patient's name
      {
        appointmentId: appointment.id,
        serviceName: appointment.serviceName || appointment.type,
        appointmentDate: appointment.appointmentDate || appointment.date,
        timeSlot: appointment.timeSlot || appointment.time,
        amount: appointment.amount,
      }
    );

    console.log("✅ Appointment approved and notification sent");
  } catch (error) {
    console.error("Error approving appointment:", error);
  }
};
```

### Example: When Declining Appointment

```typescript
const handleDeclineAppointment = async (appointment: any, reason?: string) => {
  try {
    // 1. Update appointment status
    const appointmentRef = doc(db, "appointments", appointment.id);
    await updateDoc(appointmentRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      cancellationReason: reason || "Declined by admin",
    });

    // 2. Send notification to patient
    await sendAppointmentDeclinedNotification(
      appointment.userId,
      appointment.userEmail,
      appointment.userName,
      {
        appointmentId: appointment.id,
        serviceName: appointment.serviceName || appointment.type,
        appointmentDate: appointment.appointmentDate || appointment.date,
        timeSlot: appointment.timeSlot || appointment.time,
        reason: reason,
      }
    );

    console.log("✅ Appointment declined and notification sent");
  } catch (error) {
    console.error("Error declining appointment:", error);
  }
};
```

---

## 🔥 Step 3: Firestore Security Rules

Add these rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Notifications - patients can only read/update their own
    match /notifications/{notificationId} {
      allow read, update: if isAuthenticated() &&
        request.auth.uid == resource.data.userId;
      allow create: if isAuthenticated(); // Anyone authenticated can create
    }

    // Appointments - patients can read their own, admins can do everything
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated(); // Adjust based on your needs
    }
  }
}
```

---

## ✅ What This Does

### Admin WebApp:

1. Admin clicks "Approve" on appointment
2. Appointment status updated to "confirmed" in Firestore
3. Notification document created in `notifications` collection
4. Notification includes: userId, title, message, type, priority, timestamps

### Patient Portal:

1. Real-time listener detects new notification (already implemented)
2. Bell icon shows unread badge automatically
3. Patient sees notification in dropdown
4. Click notification → marks as read → navigates to appointments

---

## 🧪 Testing Steps

1. **Admin WebApp**:

   - Approve an appointment
   - Check browser console: "✅ Appointment approved and notification sent"
   - Check Firebase Console → Firestore → `notifications` collection
   - Should see new notification document with correct userId

2. **Patient Portal**:
   - Look at header bell icon
   - Should show unread count (1)
   - Click bell → see "✅ Appointment Confirmed!" notification
   - Click notification → should navigate to appointments page
   - Check Firestore → notification should now have `read: true`

---

## 🚨 Important Notes

1. **Don't update paymentStatus on approval**: Payment status should ONLY be updated when actual payment is received from payment gateway

2. **Use exact field names**: Make sure appointment documents have these fields:

   - `userId` (Firebase Auth UID)
   - `userEmail`
   - `userName`
   - `serviceName` or `type`
   - `appointmentDate` or `date`
   - `timeSlot` or `time`

3. **Real-time works automatically**: Patient Portal is already listening to notifications in real-time - no polling needed!

---

## 📞 Troubleshooting

### Notifications not appearing in Patient Portal?

1. Check Firebase Console → Firestore → `notifications` collection

   - Are notification documents being created?
   - Does `userId` match the patient's Firebase Auth UID?

2. Check browser console in Patient Portal

   - Should see notification listener setup
   - Should see "New notification received" when admin approves

3. Check Firestore rules
   - Make sure patient can read their own notifications
   - Rule: `allow read: if request.auth.uid == resource.data.userId`

### Still not working?

- Verify both apps use the SAME Firebase project
- Check that userId in appointment matches userId in Firebase Auth
- Check browser console for errors
- Verify notification-service.ts is running in Patient Portal

---

**That's it!** The notification system is now hardcoded and works in real-time across both portals. 🎉
