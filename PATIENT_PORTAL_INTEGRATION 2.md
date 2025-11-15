# Patient Portal Integration Guide

## 🚨 Critical Issues Fixed in Admin Portal

### Issue 1: ✅ Amount Not Displaying

**Problem**: Appointments coming from Patient Portal don't show amounts
**Root Cause**: Patient Portal not sending `amount` field when creating appointments
**Solution**: See "Patient Portal Code Changes" section below

### Issue 2: ✅ Payment Status Auto-Changed on Approval

**Problem**: Approving appointment changed `paymentStatus` to "paid" incorrectly
**Status**: **FIXED** ✅
**What Changed**:

- `handleApprove()` now only changes `status` to "confirmed"
- `paymentStatus` remains separate and unchanged until actual payment
- Payment status should only be updated by payment gateway webhook/callback

### Issue 3: ✅ No Notification System

**Problem**: Patients not notified when appointments are approved/declined
**Status**: **FULLY IMPLEMENTED** ✅
**What's New**:

- Complete notification service created (`src/services/NotificationService.ts`)
- Notifications sent to Firestore `notifications` collection
- Patient Portal can listen and display real-time notifications

---

## 📱 Patient Portal Required Changes

### 1. **Appointment Booking - Add `amount` Field**

When creating appointments in your Patient Portal, ensure you include the `amount`:

```typescript
// Patient Portal - Appointment Creation
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const bookAppointment = async (
  user: any,
  selectedService: any,
  selectedDate: Date,
  selectedTime: string
) => {
  try {
    await addDoc(collection(db, "appointments"), {
      // User/Patient Info
      userId: user.uid, // Firebase Auth UID
      userName: user.displayName || `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userPhone: user.phoneNumber || user.phone,

      // Service Info
      serviceName: selectedService.name,
      serviceId: selectedService.id,
      serviceCategory: selectedService.category,

      // Appointment Details
      appointmentDate: selectedDate,
      timeSlot: selectedTime,
      duration: selectedService.duration || 30,
      notes: "", // Patient notes (optional)

      // 🚨 CRITICAL: Include amount
      amount: selectedService.price, // ← MUST INCLUDE THIS

      // Payment Info
      paymentStatus: "pending", // Will be "paid" after payment
      paymentMethod: "",
      paymentTransactionId: "",

      // Status
      status: "pending", // Admin will change to "confirmed"

      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      confirmedAt: null,
      paidAt: null,
      cancelledAt: null,
      cancellationReason: null,
      adminNotes: null,
    });

    console.log("✅ Appointment created with amount:", selectedService.price);
  } catch (error) {
    console.error("❌ Error creating appointment:", error);
    throw error;
  }
};
```

---

### 2. **Payment Integration - Update Payment Status**

When patient completes payment (via PayFast, Stripe, etc.):

```typescript
// Patient Portal - After Successful Payment
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const handlePaymentSuccess = async (
  appointmentId: string,
  paymentDetails: {
    transactionId: string;
    amount: number;
    method: string;
  }
) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);

    await updateDoc(appointmentRef, {
      paymentStatus: "paid", // ← Update ONLY after payment confirmed
      paymentMethod: paymentDetails.method,
      paymentTransactionId: paymentDetails.transactionId,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Payment status updated for appointment:", appointmentId);
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    throw error;
  }
};
```

---

### 3. **Notification Listener - Display Notifications**

Add real-time notification listener in Patient Portal:

```typescript
// Patient Portal - Notification Listener Component
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "./firebase";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  createdAt: any;
  actionUrl?: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Listen to notifications for current user
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, "notifications", notificationId);
      await updateDoc(notifRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b">
            <h3 className="font-bold">Notifications</h3>
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No notifications</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.actionUrl) {
                      window.location.href = notif.actionUrl;
                    }
                  }}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer $&#123;
                    !notif.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {notif.type === "appointment_approved" && "✅"}
                      {notif.type === "appointment_declined" && "❌"}
                      {notif.type === "payment_received" && "💰"}
                      {notif.type === "general_message" && "📩"}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notif.createdAt?.toDate?.()?.toLocaleString?.() ||
                          "Just now"}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t text-center">
            <button
              onClick={() => (window.location.href = "/notifications")}
              className="text-sm text-blue-600 hover:underline"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

---

### 4. **Full Notifications Page (Optional)**

Create a dedicated notifications page:

```typescript
// Patient Portal - Notifications Page
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAsRead = async (notificationId: string) => {
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter((n) => !n.read);
    await Promise.all(
      unreadNotifs.map((n) =>
        updateDoc(doc(db, "notifications", n.id), {
          read: true,
          readAt: serverTimestamp(),
        })
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <button
          onClick={markAllAsRead}
          className="text-blue-600 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-md $&#123;
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-md $&#123;
            filter === "unread"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No notifications to display
          </p>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-6 rounded-lg border cursor-pointer hover:shadow-md transition $&#123;
                !notif.read
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">
                      {notif.type === "appointment_approved" && "✅"}
                      {notif.type === "appointment_declined" && "❌"}
                      {notif.type === "payment_received" && "💰"}
                    </span>
                    <h3 className="text-xl font-semibold">{notif.title}</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line mb-3">
                    {notif.message}
                  </p>
                  <p className="text-sm text-gray-500">
                    {notif.createdAt?.toDate?.()?.toLocaleString?.() ||
                      "Just now"}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
```

---

## 🗄️ Firestore Collection Structure

### `notifications` Collection

```typescript
{
  id: string; // Auto-generated
  userId: string; // Patient's Firebase Auth UID
  userEmail: string; // Patient's email
  userName: string; // Patient's name
  type: "appointment_approved" | "appointment_declined" | "payment_received" | "general_message";
  title: string; // "✅ Appointment Confirmed!"
  message: string; // Full notification text
  priority: "low" | "medium" | "high" | "urgent";
  relatedTo: {
    appointmentId?: string;
    invoiceId?: string;
    chatId?: string;
  };
  read: boolean; // false initially
  readAt: Timestamp | null;
  createdAt: Timestamp;
  actionUrl: string; // Deep link (e.g., "/appointments/abc123")
}
```

---

## 🔒 Firestore Security Rules

Add these rules to protect notifications:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Notifications - users can only read their own
    match /notifications/{notificationId} {
      allow read, update: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null; // Admin can create
    }

    // Appointments - patients can read their own, admin can read/write all
    match /appointments/{appointmentId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## ✅ Testing Checklist

### Admin Portal (Already Working)

- ✅ Approve appointment → Status changes to "confirmed"
- ✅ Approve appointment → Payment status STAYS as "pending"
- ✅ Notification sent to Firestore when approved
- ✅ Notification sent to Firestore when declined
- ✅ Amount displays correctly in appointment list

### Patient Portal (To Test After Implementation)

- [ ] Create appointment with `amount` field
- [ ] Verify amount shows in Admin Portal
- [ ] Complete payment → `paymentStatus` changes to "paid"
- [ ] Receive notification when admin approves appointment
- [ ] Receive notification when admin declines appointment
- [ ] Notification bell shows unread count
- [ ] Click notification → Mark as read
- [ ] Click notification → Navigate to appointment

---

## 🚀 Deployment Steps

1. **Admin Portal** (Already Done ✅)

   - NotificationService created
   - Appointment approval/decline updated
   - Payment status separated from approval

2. **Patient Portal** (Your Action Required)

   - Add `amount` field to appointment creation
   - Implement payment callback to update `paymentStatus`
   - Add `NotificationBell` component to header
   - Create notifications page (optional)
   - Deploy Firestore security rules

3. **Testing**
   - Book appointment from Patient Portal
   - Verify amount shows in Admin Portal
   - Approve from Admin Portal
   - Check notification appears in Patient Portal
   - Test payment flow

---

## 📞 Support

**Admin Portal GitHub**: https://github.com/Vuyiato/dermaglare-admin-webapp

**Questions?**

- Check browser console for detailed logs
- Verify Firestore Console for notification documents
- Ensure both apps use same Firebase project

---

**Last Updated**: November 15, 2025
