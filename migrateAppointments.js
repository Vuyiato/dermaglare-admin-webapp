// Migration Script: Update appointments with user data
// Run with: node migrateAppointments.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateAppointments() {
  console.log("🚀 Starting appointment migration...\n");

  try {
    // Step 1: Fetch all users
    console.log("📥 Fetching users...");
    const usersSnapshot = await db.collection("users").get();
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    console.log(`✅ Loaded ${users.length} users\n`);

    // Step 2: Fetch all appointments
    console.log("📥 Fetching appointments...");
    const appointmentsSnapshot = await db.collection("appointments").get();
    console.log(`✅ Loaded ${appointmentsSnapshot.size} appointments\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Step 3: Process each appointment
    for (const appointmentDoc of appointmentsSnapshot.docs) {
      const appointmentData = appointmentDoc.data();
      const appointmentId = appointmentDoc.id;

      // Check if already has complete data
      if (
        appointmentData.userName &&
        appointmentData.userName !== "Patient" &&
        appointmentData.userName !== "Unknown Patient" &&
        appointmentData.userEmail &&
        appointmentData.userPhone &&
        appointmentData.userPhone !== "N/A"
      ) {
        console.log(
          `⏭️  Skipped ${appointmentId.substring(0, 8)}... (already complete)`
        );
        skipped++;
        continue;
      }

      // Find matching user by email
      const email =
        appointmentData.userEmail ||
        appointmentData.patientEmail ||
        appointmentData.email;
      let user = users.find(
        (u) => u.email?.toLowerCase() === email?.toLowerCase()
      );

      // Fallback: try by patientId
      if (!user && appointmentData.patientId) {
        user = users.find((u) => u.id === appointmentData.patientId);
      }

      if (user) {
        const updates = {};
        let hasChanges = false;

        // Update userName
        if (
          !appointmentData.userName ||
          appointmentData.userName === "Patient" ||
          appointmentData.userName === "Unknown Patient"
        ) {
          updates.userName =
            user.displayName ||
            user.firstName ||
            user.email?.split("@")[0] ||
            "Unknown Patient";
          hasChanges = true;
        }

        // Update userEmail
        if (!appointmentData.userEmail && user.email) {
          updates.userEmail = user.email;
          hasChanges = true;
        }

        // Update userPhone
        if (
          (!appointmentData.userPhone || appointmentData.userPhone === "N/A") &&
          (user.phoneNumber || user.phone)
        ) {
          updates.userPhone = user.phoneNumber || user.phone;
          hasChanges = true;
        }

        if (hasChanges) {
          await db
            .collection("appointments")
            .doc(appointmentId)
            .update(updates);
          console.log(
            `✅ Updated ${appointmentId.substring(0, 8)}... → ${
              updates.userName || appointmentData.userName
            }`
          );
          updated++;
        } else {
          console.log(
            `⏭️  Skipped ${appointmentId.substring(
              0,
              8
            )}... (no changes needed)`
          );
          skipped++;
        }
      } else {
        console.log(
          `❌ Failed ${appointmentId.substring(
            0,
            8
          )}... (no user found for ${email})`
        );
        failed++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Complete!");
    console.log("=".repeat(50));
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrateAppointments();
