# Messaging System Troubleshooting Guide

## Issue: Not Seeing Messages in Admin Portal

### Step 1: Check Browser Console

1. Open the Admin Portal in your browser
2. Press **F12** to open Developer Tools
3. Click on the **Console** tab
4. Look for these messages:

**✅ Good signs:**

```
🔄 Setting up chats listener...
📡 Connecting to Firebase Firestore...
🗄️ Database instance: ✅ Connected
📥 Chats snapshot received: X chats
```

**❌ Problem signs:**

```
❌ Error fetching chats: ...
Missing or insufficient permissions
Failed to get document
```

### Step 2: Verify Firebase Connection

Run this in the browser console while on the Admin Portal page:

```javascript
// Check if Firebase is connected
console.log("Firebase app:", window.firebase ? "✅ Loaded" : "❌ Not loaded");
console.log("Firestore:", window.db ? "✅ Connected" : "❌ Not connected");
```

### Step 3: Check Firestore Data

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project: **dermaglareapp**
3. Go to **Firestore Database**
4. Look for the `chats` collection

**If `chats` collection exists:**

- Click on a chat document
- Check if it has these fields:
  - `patientId`
  - `patientName`
  - `lastMessageText`
  - `lastMessageTimestamp`
  - `unreadByAdmin`
- Click on the `messages` subcollection
- Verify messages have:
  - `senderId`
  - `senderRole`
  - `senderName`
  - `text`
  - `timestamp`

**If `chats` collection does NOT exist:**

- This is normal! No patient has sent a message yet.
- See "Step 4: Create Test Data" below

### Step 4: Create Test Data

#### Option A: Use Patient Portal

1. Open Patient Portal: `http://localhost:XXXX` (your patient portal URL)
2. Login or create a patient account:
   - Email: test@test.com
   - Password: test123
3. Find the Chat/Messages section
4. Send a test message: "Hello, this is a test message"
5. Go back to Admin Portal
6. Refresh the page (F5)
7. Check Chat Management section

#### Option B: Manually Create in Firebase Console

1. Go to Firebase Console → Firestore
2. Click **Start collection**
3. Collection ID: `chats`
4. Add first document:
   - Document ID: (auto-generate)
   - Fields:
     ```
     patientId: "test-patient-123"
     patientName: "Test Patient"
     lastMessageText: "Hello from test"
     lastMessageTimestamp: (Click clock icon → Now)
     unreadByPatient: 0
     unreadByAdmin: true
     ```
5. Click the document you just created
6. Click **Start collection** (subcollection)
7. Collection ID: `messages`
8. Add first message:
   - Document ID: (auto-generate)
   - Fields:
     ```
     senderId: "test-patient-123"
     senderRole: "patient"
     senderName: "Test Patient"
     text: "Hello, this is a test message!"
     timestamp: (Click clock icon → Now)
     read: false
     ```
9. Go back to Admin Portal
10. Refresh page
11. Check Chat Management section

### Step 5: Check Firestore Rules

1. Go to Firebase Console → Firestore Database
2. Click **Rules** tab
3. Verify you have these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chats/{chatId} {
      allow read, write: if request.auth != null;

      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

4. Click **Publish** if you made changes
5. Wait 1-2 minutes for rules to propagate

### Step 6: Check Firestore Indexes

If you see an error about "index" in the console:

1. Look for a link in the error message (usually starts with `https://console.firebase.google.com/...`)
2. Click the link to create the index automatically
3. Wait 5-10 minutes for the index to build
4. Refresh Admin Portal

**Manual index creation:**

1. Go to Firebase Console → Firestore Database
2. Click **Indexes** tab
3. Click **Create Index**
4. Configure:
   - Collection: `chats`
   - Field: `lastMessageTimestamp`
   - Order: Descending
5. Click **Create**
6. Wait for status to change from "Building" to "Enabled"

### Step 7: Check Authentication

1. Make sure you're **logged in** to the Admin Portal
2. Check if you have admin role:
   - Open browser console (F12)
   - Type: `localStorage.getItem('user')`
   - Verify you see user data with `role: "admin"`

### Step 8: Network Issues

1. Open Browser Developer Tools (F12)
2. Go to **Network** tab
3. Filter by: **WS** (WebSocket)
4. Look for Firestore WebSocket connections
5. Check if status is **101** (success)

### Step 9: Clear Cache

Sometimes cached data causes issues:

1. Press **Ctrl + Shift + Delete** (Windows) or **Cmd + Shift + Delete** (Mac)
2. Select "Cached images and files"
3. Click **Clear data**
4. Close all browser tabs
5. Reopen Admin Portal
6. Login again

### Step 10: Check Correct Firebase Project

Verify both Patient Portal and Admin Portal use the **same Firebase project**:

1. Open `src/firebase.ts` in Admin Portal
2. Check the `firebaseConfig` object
3. Note the `projectId`
4. Open Patient Portal's Firebase config
5. Verify `projectId` matches exactly

**Admin Portal** should have:

```javascript
const firebaseConfig = {
  projectId: "dermaglareapp", // Must match Patient Portal
  // ... other config
};
```

## Common Error Messages

### "Missing or insufficient permissions"

**Cause:** Firestore rules not allowing access
**Fix:** Update Firestore rules (see Step 5)

### "Failed to get document because the client is offline"

**Cause:** No internet connection or Firebase not initialized
**Fix:**

- Check internet connection
- Verify Firebase config in `firebase.ts`
- Restart dev server: `npm run dev`

### "The query requires an index"

**Cause:** Firestore composite index not created
**Fix:** Follow the link in the error message or manually create index (see Step 6)

### "No chats found in Firestore"

**Cause:** No patient has sent a message yet (this is normal!)
**Fix:** Create test data (see Step 4)

## Quick Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Logged into Admin Portal
- [ ] User has admin role
- [ ] Firebase project is correct (dermaglareapp)
- [ ] Firestore rules allow access
- [ ] `chats` collection exists in Firestore
- [ ] Test chat has messages subcollection
- [ ] Browser console shows no errors
- [ ] Internet connection active
- [ ] No browser extensions blocking Firebase

## Still Not Working?

1. **Check browser console** (F12) for error messages
2. **Take a screenshot** of:
   - Browser console errors
   - Firebase Console → Firestore → chats collection
   - Admin Portal Chat Management page
3. **Verify** both portals use same Firebase project
4. **Test** with a fresh patient account in Patient Portal

## Debug Commands

Run these in browser console (F12) while on Admin Portal:

```javascript
// 1. Check Firebase connection
console.log("Firebase:", typeof firebase !== "undefined" ? "✅" : "❌");

// 2. Check auth status
firebase.auth().currentUser?.email;

// 3. Test Firestore query
firebase
  .firestore()
  .collection("chats")
  .get()
  .then((snap) => console.log("Chats found:", snap.size))
  .catch((err) => console.error("Error:", err));

// 4. Check if data listener is working
firebase
  .firestore()
  .collection("chats")
  .onSnapshot(
    (snap) => console.log("Real-time update:", snap.size, "chats"),
    (err) => console.error("Listener error:", err)
  );
```

## Success Indicators

When everything is working, you should see:

1. ✅ **Chat Management** page loads without errors
2. ✅ **Stats cards** show correct numbers
3. ✅ **Chat list** displays patient conversations
4. ✅ **Messages** appear when you click a chat
5. ✅ **Real-time updates** work (send message from Patient Portal → instantly appears)
6. ✅ **Send message** button works
7. ✅ **Unread badges** show on new messages

## Contact Support

If you've tried all steps and it still doesn't work:

1. Share browser console errors
2. Confirm Firebase project ID
3. Verify Firestore rules
4. Check if Patient Portal can send messages successfully
