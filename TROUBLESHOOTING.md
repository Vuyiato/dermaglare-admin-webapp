# Troubleshooting Guide - Real-time Updates & Notifications

## Issue 1: Payment Status Not Updating in Real-time

### What Should Happen:

1. Patient pays on Patient Portal
2. Patient Portal updates Firestore: `paymentStatus: "paid"`
3. Admin Portal's `onSnapshot` listener detects change
4. UI updates automatically

### Debug Steps:

#### Step 1: Check Patient Portal Payment Code

Verify Patient Portal has this code after payment success:

```typescript
await updateDoc(doc(db, "appointments", appointmentId), {
  paymentStatus: "paid",
  paymentTransactionId: transactionId,
  paidAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

#### Step 2: Check Firestore Console

1. Go to: https://console.firebase.google.com/project/dermaglareapp/firestore
2. Navigate to `appointments` collection
3. Find the appointment that was paid
4. Verify these fields exist and are correct:
   - `paymentStatus: "paid"`
   - `paidAt: Timestamp`
   - `paymentTransactionId: "xyz123"`

#### Step 3: Check Admin Portal Console

Open browser console (F12) on Admin Portal and look for:

```
🔄 Real-time update detected at: [time]
📅 Appointments snapshot received: X documents
💳 ✅ PAYMENT CONFIRMED for appointment: [appointmentId]
```

#### Step 4: Verify Firestore Rules

Check `firestore.rules` allows updates:

```javascript
match /appointments/{appointmentId} {
  allow read, update: if request.auth != null;
}
```

---

## Issue 2: Notifications Not Appearing on Patient Portal

### What Should Happen:

1. Admin approves appointment
2. Admin Portal creates notification in Firestore
3. Patient Portal listener detects new notification
4. Patient sees notification

### Debug Steps:

#### Step 1: Check Admin Portal Console After Approval

Look for these logs:

```
📤 Attempting to send notification with data: {...}
🔴 Creating notification document in Firestore...
📦 Notification data: {...}
✅ Appointment approval notification sent to [name] ([email])
🎯 Notification document ID: [id]
🔗 Check Firestore Console: [url]
✅ Appointment approved! Notification sent to patient.
```

If you see an error (❌), note the error message.

#### Step 2: Check Firestore Console for Notifications

1. Go to: https://console.firebase.google.com/project/dermaglareapp/firestore
2. Navigate to `notifications` collection
3. Verify a new document was created with:
   ```
   {
     userId: "patient_firebase_uid",
     userEmail: "patient@email.com",
     userName: "Patient Name",
     type: "appointment_approved",
     title: "✅ Appointment Confirmed!",
     message: "Your appointment for...",
     read: false,
     createdAt: [timestamp],
   }
   ```

#### Step 3: Check Patient Portal Has Notification Listener

Patient Portal should have this code:

```typescript
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
```

#### Step 4: Check Firestore Security Rules

Add this to `firestore.rules`:

```javascript
match /notifications/{notificationId} {
  allow read, update: if request.auth != null
    && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null;
}
```

Then redeploy rules:

```bash
firebase deploy --only firestore:rules
```

#### Step 5: Check Patient Portal Console

Patient Portal console should show:

```
📬 New notification received: {id: "...", title: "✅ Appointment Confirmed!", ...}
```

---

## Common Issues & Solutions

### Issue: "userId is undefined or empty"

**Cause**: Appointment doesn't have `userId` field  
**Solution**: Check appointment document has `userId` or `patientId` field matching Firebase Auth UID

### Issue: Notification created but not visible

**Cause**: Patient Portal not listening to notifications collection  
**Solution**: Implement notification listener (see Step 3 above)

### Issue: Permission denied error

**Cause**: Firestore security rules blocking notification creation  
**Solution**: Update security rules (see Step 4 above)

### Issue: Payment updates not appearing

**Cause**: Patient Portal not updating Firestore after payment  
**Solution**: Add payment callback code (see Issue 1, Step 1)

---

## Quick Test Script

Run this in Patient Portal console to manually test notification:

```javascript
// Test creating a notification manually
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

const testNotification = async () => {
  try {
    const notif = {
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      userName: "Test User",
      type: "appointment_approved",
      title: "🧪 Test Notification",
      message: "This is a test notification",
      priority: "high",
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "notifications"), notif);
    console.log("✅ Test notification created:", docRef.id);
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

testNotification();
```

---

## Real-time Update Test

### Admin Portal Test:

1. Open Admin Portal in Browser Tab 1
2. Open Firestore Console in Browser Tab 2
3. In Firestore, manually edit an appointment:
   - Change `paymentStatus` from "pending" to "paid"
4. Watch Admin Portal - should update within 1-2 seconds
5. Check console for: "🔄 Real-time update detected"

### Notification Test:

1. Open Admin Portal
2. Open Firestore Console
3. Click "Approve" on an appointment
4. Check console for all the logs mentioned above
5. Go to Firestore Console → `notifications` collection
6. Verify new document was created

---

## Need More Help?

1. **Export Console Logs**: Right-click in console → Save as → Share the file
2. **Screenshot Firestore**: Share screenshot of appointment and notification documents
3. **Check Network Tab**: Look for failed Firebase requests
4. **Verify Firebase Config**: Ensure both apps use same Firebase project

---

## Expected Console Output (Successful Flow)

### When Admin Approves Appointment:

```
📤 Attempting to send notification with data: {userId: "...", userEmail: "...", ...}
🔴 Creating notification document in Firestore...
📦 Notification data: {...full notification object...}
✅ Appointment approval notification sent to John Doe (john@example.com)
🎯 Notification document ID: abc123xyz
🔗 Check Firestore Console: https://console.firebase.google.com/...
✅ Appointment approved and notification sent to patient.
[Alert popup]: ✅ Appointment approved! Notification sent to patient.
```

### When Payment Status Updates:

```
🔄 Real-time update detected at: 10:30:45 AM
📅 Appointments snapshot received: 15 documents
📋 Appointment: apt_123 {...}
  👤 Patient fields: {...}
  💼 Service fields: {...}
  💰 Amount/Payment fields: {amount: 1500, paymentStatus: "paid", ...}
  💳 ✅ PAYMENT CONFIRMED for appointment: apt_123
```

---

**Last Updated**: November 15, 2025
