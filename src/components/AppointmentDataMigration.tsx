import React, { useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

interface AppUser {
  id: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
}

interface MigrationResult {
  appointmentId: string;
  status: "success" | "failed" | "skipped";
  message: string;
  before: any;
  after: any;
}

interface Props {
  theme: "light" | "dark";
}

const AppointmentDataMigration: React.FC<Props> = ({ theme }) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);

  const isDark = theme === "dark";
  const bgCard = isDark ? "bg-gray-800" : "bg-white";
  const textHeader = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";

  const migrateAppointments = async () => {
    setIsMigrating(true);
    setResults([]);
    setShowResults(true);

    try {
      // Step 1: Fetch all users
      console.log("📥 Fetching users...");
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users: AppUser[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        displayName: doc.data().displayName,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        phoneNumber: doc.data().phoneNumber || doc.data().phone,
        phone: doc.data().phone,
      }));
      console.log(`✅ Loaded ${users.length} users`);

      // Step 2: Fetch all appointments
      console.log("📥 Fetching appointments...");
      const appointmentsSnapshot = await getDocs(
        collection(db, "appointments")
      );
      const appointments = appointmentsSnapshot.docs;
      console.log(`✅ Loaded ${appointments.length} appointments`);

      setProgress({ current: 0, total: appointments.length });
      const migrationResults: MigrationResult[] = [];

      // Step 3: Process each appointment
      for (let i = 0; i < appointments.length; i++) {
        const appointmentDoc = appointments[i];
        const appointmentData = appointmentDoc.data();
        const appointmentId = appointmentDoc.id;

        setProgress({ current: i + 1, total: appointments.length });

        // Check if already has proper data
        if (
          appointmentData.userName &&
          appointmentData.userName !== "Patient" &&
          appointmentData.userName !== "Unknown Patient" &&
          appointmentData.userEmail &&
          appointmentData.userPhone &&
          appointmentData.userPhone !== "N/A"
        ) {
          migrationResults.push({
            appointmentId,
            status: "skipped",
            message: "Already has complete user data",
            before: appointmentData,
            after: appointmentData,
          });
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
          // Prepare updated data
          const updatedData: any = {};
          let hasChanges = false;

          // Update userName if needed
          if (
            !appointmentData.userName ||
            appointmentData.userName === "Patient" ||
            appointmentData.userName === "Unknown Patient"
          ) {
            updatedData.userName =
              user.displayName ||
              user.firstName ||
              user.email?.split("@")[0] ||
              "Unknown Patient";
            hasChanges = true;
          }

          // Update userEmail if needed
          if (!appointmentData.userEmail && user.email) {
            updatedData.userEmail = user.email;
            hasChanges = true;
          }

          // Update userPhone if needed
          if (
            (!appointmentData.userPhone ||
              appointmentData.userPhone === "N/A") &&
            user.phoneNumber
          ) {
            updatedData.userPhone = user.phoneNumber;
            hasChanges = true;
          }

          if (hasChanges) {
            try {
              await updateDoc(
                doc(db, "appointments", appointmentId),
                updatedData
              );
              migrationResults.push({
                appointmentId,
                status: "success",
                message: `Updated with data from user ${user.email}`,
                before: appointmentData,
                after: { ...appointmentData, ...updatedData },
              });
            } catch (error: any) {
              migrationResults.push({
                appointmentId,
                status: "failed",
                message: `Error: ${error.message}`,
                before: appointmentData,
                after: appointmentData,
              });
            }
          } else {
            migrationResults.push({
              appointmentId,
              status: "skipped",
              message: "No changes needed",
              before: appointmentData,
              after: appointmentData,
            });
          }
        } else {
          // No matching user found - use email-based fallback
          const updatedData: any = {};
          let hasChanges = false;

          // At least set userName from email if we have it
          if (
            (!appointmentData.userName ||
              appointmentData.userName === "Patient" ||
              appointmentData.userName === "Unknown Patient") &&
            email
          ) {
            updatedData.userName = email.split("@")[0];
            hasChanges = true;
          }

          // Ensure userEmail is set
          if (!appointmentData.userEmail && email) {
            updatedData.userEmail = email;
            hasChanges = true;
          }

          if (hasChanges) {
            try {
              await updateDoc(
                doc(db, "appointments", appointmentId),
                updatedData
              );
              migrationResults.push({
                appointmentId,
                status: "success",
                message: `Updated with email-based fallback (no user found in collection)`,
                before: appointmentData,
                after: { ...appointmentData, ...updatedData },
              });
            } catch (error: any) {
              migrationResults.push({
                appointmentId,
                status: "failed",
                message: `Error updating: ${error.message}`,
                before: appointmentData,
                after: appointmentData,
              });
            }
          } else {
            migrationResults.push({
              appointmentId,
              status: "failed",
              message: `No matching user found for email: ${email || "N/A"}`,
              before: appointmentData,
              after: appointmentData,
            });
          }
        }
      }

      setResults(migrationResults);
      console.log("✅ Migration complete!", migrationResults);
    } catch (error: any) {
      console.error("❌ Migration error:", error);
      alert(`Migration failed: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const migrateAmountsAndServices = async () => {
    setIsMigrating(true);
    setResults([]);
    setShowResults(true);

    try {
      console.log("🚀 Starting amount & service migration...\n");

      // Service pricing map - YOUR ACTUAL PRICES from Patient Portal
      const servicePricing: {
        [key: string]: { amount: number; category: string };
      } = {
        "PRP Therapy": { amount: 3200, category: "Cosmetic" },
        "Standard Consultation": { amount: 1300, category: "Medical" },
        "Medical Dermatology": { amount: 1500, category: "Medical" },
        "Cosmetic Dermatology": { amount: 1600, category: "Cosmetic" },
        "Laser Treatment": { amount: 3500, category: "Cosmetic" },
        "Chemical Peel": { amount: 1800, category: "Cosmetic" },
        Microneedling: { amount: 1900, category: "Cosmetic" },
        "Botox Injections": { amount: 4500, category: "Cosmetic" },
        "Skin Tightening": { amount: 2200, category: "Cosmetic" },
        "Mole Removal": { amount: 1800, category: "Medical" },
        "Skin Cancer Screening": { amount: 1750, category: "Medical" },
        "Acne Treatment": { amount: 1650, category: "Medical" },
        "Paediatric Dermatology": { amount: 1450, category: "Medical" },
        "General Consultation": { amount: 1300, category: "Medical" },
      };

      const appointmentsSnapshot = await getDocs(
        collection(db, "appointments")
      );
      console.log(`✅ Loaded ${appointmentsSnapshot.size} appointments\n`);

      setProgress({ current: 0, total: appointmentsSnapshot.size });
      const migrationResults: MigrationResult[] = [];

      for (let i = 0; i < appointmentsSnapshot.docs.length; i++) {
        const appointmentDoc = appointmentsSnapshot.docs[i];
        const appointmentData = appointmentDoc.data();
        const appointmentId = appointmentDoc.id;

        setProgress({ current: i + 1, total: appointmentsSnapshot.size });

        const updates: any = {};
        let hasChanges = false;

        // Add amount if missing
        if (!appointmentData.amount || appointmentData.amount === 0) {
          const serviceName =
            appointmentData.serviceName || appointmentData.type;
          const pricing = servicePricing[serviceName as string];

          if (pricing) {
            updates.amount = pricing.amount;
            hasChanges = true;
          } else {
            // Default amount for unknown services
            updates.amount = 500;
            hasChanges = true;
          }
        }

        // Add serviceCategory if missing
        if (!appointmentData.serviceCategory) {
          const serviceName =
            appointmentData.serviceName || appointmentData.type;
          const pricing = servicePricing[serviceName as string];

          if (pricing) {
            updates.serviceCategory = pricing.category;
            hasChanges = true;
          } else {
            updates.serviceCategory = "Medical";
            hasChanges = true;
          }
        }

        if (hasChanges) {
          try {
            await updateDoc(doc(db, "appointments", appointmentId), updates);
            migrationResults.push({
              appointmentId,
              status: "success",
              message: `Added amount: R${
                updates.amount || appointmentData.amount
              } | category: ${
                updates.serviceCategory || appointmentData.serviceCategory
              }`,
              before: appointmentData,
              after: { ...appointmentData, ...updates },
            });
          } catch (error: any) {
            migrationResults.push({
              appointmentId,
              status: "failed",
              message: `Error: ${error.message}`,
              before: appointmentData,
              after: appointmentData,
            });
          }
        } else {
          migrationResults.push({
            appointmentId,
            status: "skipped",
            message: "Already has amount and category",
            before: appointmentData,
            after: appointmentData,
          });
        }
      }

      setResults(migrationResults);
      console.log("✅ Amount migration complete!", migrationResults);
    } catch (error: any) {
      console.error("❌ Migration error:", error);
      alert(`Migration failed: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${textHeader}`}>
          Appointment Data Migration
        </h1>
        <p className={`${textMuted} mt-2`}>
          Migrate existing appointments to use standardized userName, userEmail,
          and userPhone fields
        </p>
      </div>

      {/* Migration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgCard} rounded-lg shadow-lg p-6 border ${borderColor}`}
      >
        <div className="space-y-4">
          <div>
            <h2 className={`text-xl font-semibold ${textHeader}`}>
              What does this migration do?
            </h2>
            <ul className={`${textMuted} mt-2 space-y-2 list-disc pl-5`}>
              <li>
                Looks up each appointment's patient email in the users
                collection
              </li>
              <li>
                Updates{" "}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  userName
                </code>{" "}
                from "Patient" to actual user name (e.g., "Vuyi")
              </li>
              <li>
                Ensures{" "}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  userEmail
                </code>{" "}
                is populated
              </li>
              <li>
                Adds{" "}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  userPhone
                </code>{" "}
                from user profile if available
              </li>
              <li>Skips appointments that already have complete data</li>
            </ul>
          </div>

          <div
            className={`p-4 rounded-lg ${
              isDark
                ? "bg-yellow-900/20 border border-yellow-800"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <p
              className={`text-sm ${
                isDark ? "text-yellow-300" : "text-yellow-800"
              } font-semibold`}
            >
              ⚠️ Important
            </p>
            <p
              className={`text-sm ${
                isDark ? "text-yellow-200" : "text-yellow-700"
              } mt-1`}
            >
              This will update appointments in your Firestore database. Make
              sure you have a backup or are comfortable with the changes.
            </p>
          </div>

          {!isMigrating && !showResults && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={migrateAppointments}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  isDark
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Migrate User Data
              </button>
              <button
                onClick={migrateAmountsAndServices}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  isDark
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                Add Amounts & Categories
              </button>
            </div>
          )}

          {isMigrating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={textMuted}>
                  Processing {progress.current} of {progress.total}...
                </span>
                <span className={textHeader + " font-semibold"}>
                  {progress.total > 0
                    ? Math.round((progress.current / progress.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      progress.total > 0
                        ? (progress.current / progress.total) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Results */}
      {showResults && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${bgCard} rounded-lg shadow-lg p-6 border ${borderColor}`}
        >
          <h2 className={`text-xl font-semibold ${textHeader} mb-4`}>
            Migration Results
          </h2>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${
                isDark
                  ? "bg-green-900/20 border border-green-800"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-green-400" : "text-green-600"
                }`}
              >
                {successCount}
              </p>
              <p className={`text-sm ${textMuted}`}>Updated</p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                isDark
                  ? "bg-red-900/20 border border-red-800"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-red-400" : "text-red-600"
                }`}
              >
                {failedCount}
              </p>
              <p className={`text-sm ${textMuted}`}>Failed</p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                isDark
                  ? "bg-gray-700 border border-gray-600"
                  : "bg-gray-50 border border-gray-300"
              }`}
            >
              <p className={`text-2xl font-bold ${textHeader}`}>
                {skippedCount}
              </p>
              <p className={`text-sm ${textMuted}`}>Skipped</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === "success"
                    ? isDark
                      ? "bg-green-900/10 border-green-800"
                      : "bg-green-50 border-green-200"
                    : result.status === "failed"
                    ? isDark
                      ? "bg-red-900/10 border-red-800"
                      : "bg-red-50 border-red-200"
                    : isDark
                    ? "bg-gray-700/30 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${textHeader}`}>
                      {result.status === "success"
                        ? "✅"
                        : result.status === "failed"
                        ? "❌"
                        : "⏭️"}{" "}
                      Appointment {result.appointmentId.substring(0, 8)}...
                    </p>
                    <p className={`text-xs ${textMuted} mt-1`}>
                      {result.message}
                    </p>
                    {result.status === "success" && (
                      <div className={`text-xs ${textMuted} mt-2 space-y-1`}>
                        <p>
                          <strong>Before:</strong>{" "}
                          {result.before.userName ||
                            result.before.patientName ||
                            "N/A"}{" "}
                          |{" "}
                          {result.before.userEmail ||
                            result.before.patientEmail ||
                            "N/A"}
                        </p>
                        <p>
                          <strong>After:</strong> {result.after.userName} |{" "}
                          {result.after.userEmail} | {result.after.userPhone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setShowResults(false);
              setResults([]);
            }}
            className={`mt-4 w-full py-2 px-4 rounded-lg font-semibold transition-all ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Close Results
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AppointmentDataMigration;
