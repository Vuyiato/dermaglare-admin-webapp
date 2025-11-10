# Appointment Data Migration - Setup Guide

## What Changed

### 1. **Database Standardization**

All appointments now use standardized fields:

- `userName`: Actual patient name (e.g., "Vuyi", "Thabo")
- `userEmail`: Patient email address
- `userPhone`: Patient phone number

### 2. **Automatic Enrichment**

The `EnhancedAppointmentManagement` component now automatically:

- Looks up users by email when displaying appointments
- Falls back to patientId if email lookup fails
- Enriches missing data from the users collection

### 3. **Data Migration Tool**

New "Data Migration" page in admin dashboard that:

- Updates all existing appointments with correct user data
- Matches appointments to users by email
- Adds phone numbers from user profiles
- Shows detailed progress and results

## How to Use

### Step 1: Ensure Users Have Phone Numbers

Before running the migration, make sure your users in Firestore have phone numbers:

1. Go to **Firebase Console** → **Firestore Database**
2. Open the `users` collection
3. For each user, add a `phoneNumber` field (e.g., "+27123456789")
   - OR add a `phone` field
4. Save each document

Example user document structure:

```json
{
  "id": "abc123",
  "email": "vuyiato1@gmail.com",
  "displayName": "Vuyi Ato",
  "phoneNumber": "+27123456789",
  "role": "patient",
  "isActive": true,
  "createdAt": "..."
}
```

### Step 2: Run the Migration

1. **Login to Admin Dashboard**
2. **Navigate to "Data Migration"** page (in sidebar)
3. **Review the migration description**
4. **Click "Start Migration"** button
5. **Watch the progress bar** - it will process all appointments
6. **Review the results**:
   - **Green (Updated)**: Appointments successfully enriched
   - **Red (Failed)**: Could not find matching user
   - **Gray (Skipped)**: Already had complete data

### Step 3: Check Appointments

1. Go to **"Appointment Management"** page
2. All appointments should now show:
   - ✅ Patient Name (not "Patient")
   - ✅ Email address
   - ✅ Phone number (if user has one)
   - ✅ Service name
   - ✅ Amount (if set)

## Troubleshooting

### Problem: "No matching user found"

**Solution**:

- Check if the appointment's email matches a user's email in Firestore
- Emails are case-insensitive, so "User@mail.com" matches "user@mail.com"
- If patientId doesn't match, the migration uses email lookup instead

### Problem: Phone showing "N/A"

**Solution**:

- Add `phoneNumber` or `phone` field to the user document in Firestore
- Re-run the migration to update appointments

### Problem: Amounts still showing R 0.00

**Solution**:

- This is a separate issue - appointments don't have `amount` field in Firestore
- You need to add amounts manually in Firestore, or
- Update your patient portal app to save amounts when creating appointments

## For Your Patient Portal App

When creating appointments in your patient portal, make sure to save:

```typescript
await addDoc(collection(db, "appointments"), {
  // User Info (use actual values, not "Patient")
  userName: user.displayName || user.firstName,
  userEmail: user.email,
  userPhone: user.phoneNumber || user.phone,

  // Appointment Info
  serviceName: selectedService.name,
  serviceId: selectedService.id,
  appointmentDate: selectedDate,
  timeSlot: selectedTime,
  duration: selectedService.duration,
  amount: selectedService.price, // ← Important!

  // Status
  status: "pending",
  paymentStatus: "pending",

  // Metadata
  createdAt: serverTimestamp(),
  patientId: user.uid, // Firebase Auth UID
});
```

## Database Schema Reference

### appointments Collection

```typescript
{
  id: string; // Auto-generated
  userName: string; // "Vuyi Ato" (not "Patient")
  userEmail: string; // "vuyiato1@gmail.com"
  userPhone: string; // "+27123456789"
  patientId: string; // Firebase Auth UID
  serviceName: string; // "General Consultation"
  serviceId: string; // Service reference
  serviceCategory: string; // "Medical"
  appointmentDate: Timestamp; // Date of appointment
  timeSlot: string; // "09:00 AM"
  duration: number; // 30 (minutes)
  amount: number; // 500 (in Rands)
  status: string; // "pending" | "confirmed" | "completed"
  paymentStatus: string; // "pending" | "paid"
  paymentMethod: string; // "online" | "cash"
  paymentTransactionId: string; // Payment gateway ID
  notes: string; // Patient notes
  createdAt: Timestamp; // Creation timestamp
  updatedAt: Timestamp; // Last update
}
```

### users Collection

```typescript
{
  id: string; // Document ID
  email: string; // "vuyiato1@gmail.com"
  displayName: string; // "Vuyi Ato"
  firstName: string; // "Vuyi"
  lastName: string; // "Ato"
  phoneNumber: string; // "+27123456789"
  role: string; // "patient" | "admin" | "doctor"
  isActive: boolean; // true
  createdAt: Timestamp; // Creation timestamp
}
```

## Next Steps

1. ✅ Add phone numbers to all users in Firestore
2. ✅ Run the Data Migration tool
3. ✅ Verify appointments show correct data
4. 🔄 Update your Patient Portal app to save standardized fields
5. 🔄 Add `amount` field when creating appointments

---

**Questions?** Check the console logs in Developer Tools for detailed debugging information.
