# Database Structure & Integration Guide

## Overview

This document outlines the Firebase Firestore database structure used by both the **Patient Portal** and **Admin Web App** to ensure seamless communication and data synchronization.

## Critical Requirements for Both Apps

### 1. Firebase Configuration

Both apps MUST use the **same Firebase project** with identical configuration:

- Same Project ID
- Same API Key
- Same Authentication domain
- Same Database URL

### 2. Firestore Collections

## Collection: `appointments`

**Purpose**: Store all patient appointments

**Document Structure**:

```javascript
{
  id: string (auto-generated),
  patientId: string (Firebase Auth UID),
  patientName: string,
  patientEmail: string,
  date: string (ISO format: "YYYY-MM-DD"),
  time: string (e.g., "10:00 AM"),
  type: string (e.g., "Consultation", "Follow-up"),
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled",
  doctorId: string (optional),
  doctorName: string (optional),
  notes: string (optional),
  createdAt: Firebase Timestamp
}
```

**Key Points**:

- Patient Portal CREATES appointments with `status: "Pending"`
- Admin App should LISTEN to `appointments` collection for real-time updates
- Admin App UPDATES `status` field to "Confirmed", "Completed", or "Cancelled"
- Both apps should query by `patientId` or filter by `status`

**Indexes Required**:

- `patientId` + `date` (descending)
- `status` + `date` (ascending)

---

## Collection: `chats`

**Purpose**: Store chat conversations between patients and admin/doctor

**Document Structure**:

```javascript
{
  id: string (auto-generated),
  patientId: string (Firebase Auth UID),
  patientName: string,
  lastMessageText: string,
  lastMessageTimestamp: Firebase Timestamp,
  unreadByPatient: number,
  unreadByAdmin: boolean
}
```

**Subcollection**: `chats/{chatId}/messages`

**Message Structure**:

```javascript
{
  id: string (auto-generated),
  senderId: string ("patient UID", "admin", or "doctor"),
  senderRole: string ("patient", "admin", or "doctor"),
  senderName: string (e.g., "Dr. Jabu Nkehli", "Support Team"),
  text: string,
  timestamp: Firebase Timestamp,
  read: boolean
}
```

**Key Points**:

- Patient Portal:
  - Uses `getOrCreateChat()` to get/create chat
  - Sends messages with `senderId = patientId`
  - Sets `senderRole = "patient"`
  - Listens to `chats/{chatId}/messages` for real-time updates
- Admin App:
  - Should LISTEN to ALL chats in `chats` collection
  - Sends messages with `senderId = "admin"` or `senderId = "doctor"`
  - Sets `senderRole = "admin"` or `senderRole = "doctor"`
  - Sets `senderName = "Support Team"` or `senderName = "Dr. Jabu Nkehli"`
  - Updates `unreadByAdmin = false` when viewing
  - Updates `lastMessageText` and `lastMessageTimestamp` on each message

**Chat Display Logic**:

- Patient Portal detects doctor messages by:
  ```javascript
  msg.senderRole === "doctor" ||
    msg.senderId === "doctor" ||
    msg.senderName?.toLowerCase().includes("dr");
  ```

---

## Collection: `patients`

**Purpose**: Store patient profile information

**Document Structure**:

```javascript
{
  id: string (Firebase Auth UID),
  name: string,
  email: string,
  phone: string (optional),
  dateOfBirth: string (optional),
  bloodType: string (optional),
  allergies: string[] (optional),
  emergencyContact: {
    name: string,
    relationship: string,
    phone: string
  } (optional),
  photoURL: string (optional),
  createdAt: Firebase Timestamp,
  lastVisit: Firebase Timestamp,
  role: "patient",
  status: "active" | "inactive",
  emailVerified: boolean,
  appearance: {
    theme: "light" | "dark" | "auto",
    fontSize: "small" | "medium" | "large"
  } (optional),
  notifications: object (optional),
  privacy: object (optional)
}
```

**Key Points**:

- Patient Portal CREATES and UPDATES patient documents
- Admin App should READ patient documents for display
- Both apps use `patientId` (Firebase Auth UID) as document ID

---

## Collection: `invoices`

**Purpose**: Store billing invoices

**Document Structure**:

```javascript
{
  id: string (auto-generated),
  patientId: string (Firebase Auth UID),
  patientName: string,
  patientEmail: string,
  appointmentId: string (optional),
  amount: number,
  description: string,
  service: string,
  status: "Pending" | "Paid" | "Overdue" | "Cancelled",
  date: string (ISO format),
  dueDate: string (ISO format),
  invoiceNumber: string (unique),
  paymentMethod: string (optional, e.g., "Card", "EFT", "Cash"),
  createdAt: Firebase Timestamp,
  paidAt: Firebase Timestamp (optional)
}
```

**Key Points**:

- Patient Portal:
  - Auto-creates invoice when booking appointment
  - Processes payments and updates `status` to "Paid"
  - Sets `paidAt` timestamp
- Admin App:
  - Should LISTEN to invoices for real-time updates
  - Can manually create/update invoices
  - Should display payment status

---

## Collection: `email_notifications`

**Purpose**: Log all email notifications sent

**Document Structure**:

```javascript
{
  id: string (auto-generated),
  to: string (email address),
  subject: string,
  body: string (email content),
  type: "payment_success" | "payment_failed" | "invoice_created" |
        "cancellation_fee" | "welcome" | "password_reset",
  patientId: string,
  relatedId: string (optional, invoice/appointment ID),
  sentAt: Firebase Timestamp,
  status: "sent" | "failed"
}
```

**Key Points**:

- Patient Portal writes to this collection for tracking
- Admin App can READ for monitoring email delivery
- Both apps log emails for audit trail

---

## Collection: `documents`

**Purpose**: Store patient medical documents

**Document Structure**:

```javascript
{
  id: string (auto-generated),
  patientId: string (Firebase Auth UID),
  name: string,
  type: string (e.g., "Lab Report", "Prescription"),
  url: string (Firebase Storage URL),
  uploadedAt: Firebase Timestamp,
  size: number (bytes),
  category: string (optional)
}
```

**Key Points**:

- Patient Portal READS documents
- Admin App UPLOADS documents
- Files stored in Firebase Storage: `documents/{patientId}/{filename}`

---

## Firestore Security Rules

**Recommended rules for both apps**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Appointments
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Patients
    match /patients/{patientId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == patientId;
    }

    // Chats
    match /chats/{chatId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;

      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }

    // Invoices
    match /invoices/{invoiceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }

    // Documents
    match /documents/{documentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Email Notifications
    match /email_notifications/{notificationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

---

## Real-Time Listeners

### Admin App Should Implement:

1. **Appointments Listener**:

```javascript
onSnapshot(collection(db, "appointments"), (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      // New appointment notification
      showNotification("New appointment booked!");
    }
  });
});
```

2. **Chats Listener**:

```javascript
onSnapshot(collection(db, "chats"), (snapshot) => {
  // Update chat list in real-time
});
```

3. **Messages Listener** (for specific chat):

```javascript
onSnapshot(
  collection(db, `chats/${chatId}/messages`),
  orderBy("timestamp", "asc"),
  (snapshot) => {
    // Display messages in real-time
  }
);
```

---

## Common Issues & Solutions

### Issue 1: Appointments not showing in Admin

**Solution**:

- Verify both apps use the SAME Firebase project
- Check Firestore collection name is exactly `"appointments"` (case-sensitive)
- Ensure Admin app has real-time listener implemented
- Check Firebase console to verify data is being written

### Issue 2: Chat messages not displaying

**Solution**:

- Verify chat collection path: `chats/{chatId}/messages`
- Check that `senderRole` field is set correctly
- Ensure Admin app sends messages with proper structure
- Implement `onSnapshot` listener in Admin app for real-time updates

### Issue 3: Different field names

**Solution**:

- Use the EXACT field names specified in this document
- Don't use camelCase vs snake_case inconsistencies
- Example: Use `patientId`, NOT `patient_id` or `PatientId`

---

## Testing Checklist

### Patient Portal ✓

- [ ] Book appointment → Check Firebase console
- [ ] Send chat message → Verify in `chats/{chatId}/messages`
- [ ] Pay invoice → Status updates to "Paid"
- [ ] Sign up → Welcome email logged in `email_notifications`

### Admin App ✓

- [ ] View all appointments in real-time
- [ ] Receive new appointment notifications
- [ ] View all chats and messages
- [ ] Send message as "admin" or "doctor"
- [ ] Update appointment status
- [ ] View patient profiles

---

## Contact for Support

If you encounter issues with database synchronization:

1. Check Firebase console for data
2. Verify field names match exactly
3. Check browser console for errors
4. Ensure both apps use same Firebase config

**Firebase Project Settings**: Check that both apps have identical:

- `projectId`
- `apiKey`
- `authDomain`
- `databaseURL`
- `storageBucket`
