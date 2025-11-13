// src/components/EnhancedAppointmentManagement.tsx

import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// =================================================================================================
// TYPE DEFINITIONS
// =================================================================================================

type Theme = "light" | "dark";

interface Appointment {
  id: string;
  adminNotes: string | null;
  amount: number;
  appointmentDate: any; // Firestore Timestamp
  cancellationReason: string | null;
  cancelledAt: any | null;
  confirmedAt: any | null;
  createdAt: any;
  duration: number;
  notes: string | null;
  paidAt: any | null;
  paymentMethod: string;
  paymentStatus: "paid" | "pending" | "refunded";
  paymentTransactionId: string;
  serviceCategory: string;
  serviceId: string;
  serviceName: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "paid";
  timeSlot: string;
  updatedAt: any;
  userEmail?: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  // Legacy fields that might exist in old appointments
  patientEmail?: string;
  patientId?: string;
  phone?: string;
}

interface AppUser {
  id: string;
  displayName: string;
  email: string;
  firstName?: string;
  phoneNumber?: string;
}

// =================================================================================================
// UTILITY FUNCTIONS
// =================================================================================================

const getStatusClasses = (status: string, theme: Theme) => {
  const isDark = theme === "dark";
  switch (status) {
    case "confirmed":
    case "completed":
    case "paid":
      return isDark
        ? "bg-green-500/20 text-green-400 ring-1 ring-inset ring-green-500/30"
        : "bg-green-100 text-green-800 ring-1 ring-inset ring-green-200";
    case "pending":
      return isDark
        ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-inset ring-yellow-500/30"
        : "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200";
    case "cancelled":
      return isDark
        ? "bg-red-500/20 text-red-400 ring-1 ring-inset ring-red-500/30"
        : "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200";
    default:
      return isDark
        ? "bg-gray-500/20 text-gray-400 ring-1 ring-inset ring-gray-500/30"
        : "bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200";
  }
};

const getPaymentStatusClasses = (status: string, theme: Theme) => {
  const isDark = theme === "dark";
  switch (status) {
    case "paid":
      return isDark
        ? "bg-green-500/20 text-green-400 ring-1 ring-inset ring-green-500/30"
        : "bg-green-100 text-green-800 ring-1 ring-inset ring-green-200";
    case "pending":
      return isDark
        ? "bg-orange-500/20 text-orange-400 ring-1 ring-inset ring-orange-500/30"
        : "bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200";
    case "refunded":
      return isDark
        ? "bg-purple-500/20 text-purple-400 ring-1 ring-inset ring-purple-500/30"
        : "bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200";
    default:
      return isDark
        ? "bg-gray-500/20 text-gray-400 ring-1 ring-inset ring-gray-500/30"
        : "bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200";
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (timestamp: any) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "R 0.00";
  }
  return `R ${amount.toFixed(2)}`;
};

// =================================================================================================
// MAIN COMPONENT
// =================================================================================================

const EnhancedAppointmentManagement: React.FC<{ theme: Theme }> = ({
  theme,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<
    "pending" | "confirmed" | "all" | "calendar"
  >("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const isDark = theme === "dark";
  const cardClasses = isDark
    ? "bg-white/5 border-white/10"
    : "bg-white shadow-md border border-gray-200";
  const textHeader = isDark ? "text-white" : "text-gray-800";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const headingClasses = isDark ? "text-brand-yellow" : "text-brand-gold";
  const buttonClasses = isDark
    ? "bg-gray-700/50 hover:bg-gray-600/50"
    : "bg-gray-200 hover:bg-gray-300";
  const inputClasses = isDark
    ? "bg-gray-700 border-gray-600 text-gray-200"
    : "bg-gray-100 border-gray-300 text-gray-800";

  // =================================================================================================
  // FETCH DATA
  // =================================================================================================

  useEffect(() => {
    console.log("🔄 Setting up appointments listener...");
    // Removed orderBy to avoid index requirement - we'll sort in memory
    const appointmentsQuery = collection(db, "appointments");

    const unsubscribeAppointments = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        console.log(
          "📅 Appointments snapshot received:",
          snapshot.size,
          "documents"
        );
        const appointmentsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("📋 Appointment:", doc.id, data);
          console.log("  👤 Patient fields:", {
            userName: data.userName,
            patientName: data.patientName,
            userEmail: data.userEmail,
            patientEmail: data.patientEmail,
          });
          console.log("  💼 Service fields:", {
            serviceName: data.serviceName,
            type: data.type,
            serviceCategory: data.serviceCategory,
          });
          console.log("  💰 Amount/Payment fields:", {
            amount: data.amount,
            paymentStatus: data.paymentStatus,
            status: data.status,
          });

          // Map different field names for consistency
          const appointment = {
            id: doc.id,
            ...data,
            appointmentDate: data.appointmentDate || data.date, // Use 'date' if 'appointmentDate' doesn't exist
            timeSlot: data.timeSlot || data.time, // Use 'time' if 'timeSlot' doesn't exist
            userName: data.userName || data.patientName || "Unknown Patient", // Map patientName to userName
            userEmail: data.userEmail || data.patientEmail || "", // Map patientEmail to userEmail
            userPhone: data.userPhone || data.patientPhone || "", // Map patientPhone to userPhone
            serviceName: data.serviceName || data.type || "No Service", // Map type to serviceName
            amount: data.amount || 0, // Ensure amount has a default
            paymentStatus:
              data.paymentStatus ||
              (data.status?.toLowerCase() === "paid" ? "paid" : "pending"), // Map status if needed
          } as Appointment;

          console.log("  ✅ Mapped appointment:", {
            userName: appointment.userName,
            userEmail: appointment.userEmail,
            serviceName: appointment.serviceName,
            amount: appointment.amount,
            paymentStatus: appointment.paymentStatus,
          });

          return appointment;
        });

        // Sort by appointment date in descending order (newest first)
        appointmentsData.sort((a, b) => {
          try {
            let dateA: Date;
            let dateB: Date;

            // Handle appointmentDate field (might be Firestore Timestamp or string)
            if (a.appointmentDate?.toDate) {
              dateA = a.appointmentDate.toDate();
            } else if (a.appointmentDate) {
              dateA = new Date(a.appointmentDate);
            } else {
              dateA = new Date(0);
            }

            if (b.appointmentDate?.toDate) {
              dateB = b.appointmentDate.toDate();
            } else if (b.appointmentDate) {
              dateB = new Date(b.appointmentDate);
            } else {
              dateB = new Date(0);
            }

            return dateB.getTime() - dateA.getTime();
          } catch (error) {
            console.error("Error sorting appointments:", error);
            return 0;
          }
        });

        console.log(
          "✅ Appointments loaded:",
          appointmentsData.length,
          appointmentsData
        );
        setAppointments(appointmentsData);
        setIsLoading(false);
      },
      (error) => {
        console.error("❌ Error fetching appointments:", error);
        setIsLoading(false);
      }
    );

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as AppUser)
      );
      setUsers(usersData);
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeUsers();
    };
  }, []);

  // =================================================================================================
  // ENRICH APPOINTMENTS WITH USER DATA
  // =================================================================================================

  const enrichedAppointments = useMemo(() => {
    console.log("🔄 Enriching appointments with user data...");
    console.log("  📊 Total appointments:", appointments.length);
    console.log("  👥 Total users:", users.length);

    return appointments.map((appointment) => {
      // Try to find user by email (userEmail or patientEmail)
      const email = appointment.userEmail || appointment.patientEmail;
      let user = null;

      if (email) {
        user = users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
      }

      // Fallback: try by patientId if email lookup failed
      if (!user && appointment.patientId) {
        user = users.find((u) => u.id === appointment.patientId);
      }

      // Enrich appointment with user data if found
      if (user) {
        const enrichedName =
          user.displayName ||
          user.firstName ||
          user.email?.split("@")[0] ||
          appointment.userEmail?.split("@")[0] ||
          "Unknown Patient";

        return {
          ...appointment,
          userName: enrichedName,
          userEmail:
            user.email || appointment.userEmail || appointment.patientEmail,
          userPhone:
            user.phoneNumber ||
            appointment.userPhone ||
            appointment.phone ||
            "N/A",
        };
      } else {
        // If no user found in collection, use email as fallback name
        const fallbackName =
          (appointment.userEmail || appointment.patientEmail)?.split("@")[0] ||
          "Unknown Patient";

        return {
          ...appointment,
          userName: fallbackName,
          userEmail: appointment.userEmail || appointment.patientEmail || "N/A",
          userPhone: appointment.userPhone || appointment.phone || "N/A",
        };
      }
    });
  }, [appointments, users]);

  // =================================================================================================
  // FILTERED APPOINTMENTS
  // =================================================================================================

  const filteredAppointments = useMemo(() => {
    let filtered = enrichedAppointments;

    console.log(
      "🔍 Starting filter with enrichedAppointments:",
      enrichedAppointments.length
    );
    console.log(
      "📊 All appointment statuses:",
      enrichedAppointments.map((a) => ({
        id: a.id.substring(0, 8),
        status: a.status,
        statusLower: a.status?.toLowerCase(),
      }))
    );

    // Filter by view mode (case-insensitive)
    if (viewMode === "pending") {
      filtered = filtered.filter(
        (app) =>
          app.status?.toLowerCase() === "pending" || app.confirmedAt === null
      );
      console.log(`✅ After pending filter: ${filtered.length} appointments`);
    } else if (viewMode === "confirmed") {
      filtered = filtered.filter(
        (app) =>
          app.status?.toLowerCase() === "confirmed" ||
          app.status?.toLowerCase() === "paid"
      );
      console.log(`✅ After confirmed filter: ${filtered.length} appointments`);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log("🔍 Final filtered appointments:", {
      totalAppointments: enrichedAppointments.length,
      viewMode,
      searchTerm,
      filteredCount: filtered.length,
    });

    return filtered;
  }, [appointments, viewMode, searchTerm]);

  // =================================================================================================
  // APPOINTMENT STATS
  // =================================================================================================

  const stats = useMemo(() => {
    const pending = appointments.filter(
      (app) =>
        app.status?.toLowerCase() === "pending" || app.confirmedAt === null
    ).length;
    const confirmed = appointments.filter(
      (app) =>
        app.status?.toLowerCase() === "confirmed" ||
        app.status?.toLowerCase() === "paid"
    ).length;
    const completed = appointments.filter(
      (app) => app.status?.toLowerCase() === "completed"
    ).length;
    const totalRevenue = appointments
      .filter((app) => app.paymentStatus?.toLowerCase() === "paid")
      .reduce((sum, app) => sum + app.amount, 0);
    const pendingPayments = appointments
      .filter((app) => app.paymentStatus?.toLowerCase() === "pending")
      .reduce((sum, app) => sum + app.amount, 0);

    return {
      pending,
      confirmed,
      completed,
      totalRevenue,
      pendingPayments,
    };
  }, [appointments]);

  // =================================================================================================
  // CALENDAR LOGIC
  // =================================================================================================

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((app) => {
      try {
        // Handle different date formats
        let date: Date;
        if (app.appointmentDate?.toDate) {
          // Firestore Timestamp
          date = app.appointmentDate.toDate();
        } else if (app.appointmentDate) {
          // String or number
          date = new Date(app.appointmentDate);
        } else {
          // No date, skip
          console.warn("Appointment has no date:", app.id);
          return;
        }

        // Validate the date
        if (isNaN(date.getTime())) {
          console.warn(
            "Invalid date for appointment:",
            app.id,
            app.appointmentDate
          );
          return;
        }

        const dateKey = date.toISOString().split("T")[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)?.push(app);
      } catch (error) {
        console.error("Error processing appointment date:", app.id, error);
      }
    });
    return map;
  }, [appointments]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const daysInMonth: Date[] = [];

  for (let i = firstDayOfMonth.getDay(); i > 0; i--) {
    const prevDate = new Date(firstDayOfMonth);
    prevDate.setDate(prevDate.getDate() - i);
    daysInMonth.push(prevDate);
  }
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    daysInMonth.push(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
    );
  }
  while (daysInMonth.length % 7 !== 0) {
    const nextDate = new Date(daysInMonth[daysInMonth.length - 1].getTime());
    nextDate.setDate(nextDate.getDate() + 1);
    daysInMonth.push(nextDate);
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
  };

  // =================================================================================================
  // APPOINTMENT ACTIONS
  // =================================================================================================

  const handleApprove = async () => {
    if (!selectedAppointment) return;
    setActionLoading(true);

    try {
      const appointmentRef = doc(db, "appointments", selectedAppointment.id);
      await updateDoc(appointmentRef, {
        status: "confirmed",
        paymentStatus: "paid", // Mark payment as paid to update revenue
        confirmedAt: serverTimestamp(),
        adminNotes: adminNotes || null,
        updatedAt: serverTimestamp(),
      });

      // TODO: Send notification to patient via FCM
      console.log("✅ Appointment approved, notification should be sent");

      setShowApprovalModal(false);
      setAdminNotes("");
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error approving appointment:", error);
      alert("Failed to approve appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedAppointment) return;
    const reason = prompt("Please provide a reason for declining:");
    if (!reason) return;

    setActionLoading(true);

    try {
      const appointmentRef = doc(db, "appointments", selectedAppointment.id);
      await updateDoc(appointmentRef, {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        cancellationReason: reason,
        adminNotes: adminNotes || null,
        updatedAt: serverTimestamp(),
      });

      // TODO: Send notification to patient
      console.log("❌ Appointment declined, notification should be sent");

      setShowApprovalModal(false);
      setAdminNotes("");
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error declining appointment:", error);
      alert("Failed to decline appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async (appointmentId: string) => {
    if (!confirm("Mark this appointment as completed?")) return;

    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, {
        status: "completed",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error marking appointment as completed:", error);
      alert("Failed to mark as completed");
    }
  };

  const handleRefund = async (appointment: Appointment) => {
    const confirmRefund = confirm(
      `Refund R${appointment.amount}?\n\nNote: A 10% cancellation fee (R${(
        appointment.amount * 0.1
      ).toFixed(2)}) will be deducted.\nRefund amount: R${(
        appointment.amount * 0.9
      ).toFixed(2)}`
    );

    if (!confirmRefund) return;

    try {
      const appointmentRef = doc(db, "appointments", appointment.id);
      await updateDoc(appointmentRef, {
        paymentStatus: "refunded",
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        cancellationReason: "Refund requested by patient",
        updatedAt: serverTimestamp(),
      });

      // TODO: Process refund via PayFast
      console.log("💰 Refund initiated for:", appointment.id);
      alert(
        `Refund processed: R${(appointment.amount * 0.9).toFixed(
          2
        )} (after 10% fee)`
      );
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Failed to process refund");
    }
  };

  // =================================================================================================
  // RENDER
  // =================================================================================================

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 text-2xl animate-pulse">
        Loading appointments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`p-4 rounded-xl ${cardClasses}`}>
          <h3 className={`text-xs font-medium ${textMuted}`}>
            Pending Approval
          </h3>
          <p className={`mt-1 text-2xl font-bold text-yellow-400`}>
            {stats.pending}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${cardClasses}`}>
          <h3 className={`text-xs font-medium ${textMuted}`}>Confirmed</h3>
          <p className={`mt-1 text-2xl font-bold text-green-400`}>
            {stats.confirmed}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${cardClasses}`}>
          <h3 className={`text-xs font-medium ${textMuted}`}>Completed</h3>
          <p className={`mt-1 text-2xl font-bold text-blue-400`}>
            {stats.completed}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${cardClasses}`}>
          <h3 className={`text-xs font-medium ${textMuted}`}>Total Revenue</h3>
          <p className={`mt-1 text-2xl font-bold text-green-500`}>
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${cardClasses}`}>
          <h3 className={`text-xs font-medium ${textMuted}`}>
            Pending Payments
          </h3>
          <p className={`mt-1 text-2xl font-bold text-orange-400`}>
            {formatCurrency(stats.pendingPayments)}
          </p>
        </div>
      </div>

      {/* HEADER WITH TABS AND SEARCH */}
      <div className={`p-4 rounded-xl ${cardClasses}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div
            className={`flex space-x-1 p-1 rounded-lg ${
              isDark ? "bg-gray-900/50" : "bg-gray-100"
            }`}
          >
            <button
              onClick={() => setViewMode("pending")}
              className={`px-4 py-2 text-sm rounded-md transition font-semibold ${
                viewMode === "pending"
                  ? isDark
                    ? "bg-brand-yellow text-gray-900"
                    : "bg-brand-gold text-white shadow"
                  : isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setViewMode("confirmed")}
              className={`px-4 py-2 text-sm rounded-md transition font-semibold ${
                viewMode === "confirmed"
                  ? isDark
                    ? "bg-brand-yellow text-gray-900"
                    : "bg-brand-gold text-white shadow"
                  : isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Confirmed ({stats.confirmed})
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 text-sm rounded-md transition font-semibold ${
                viewMode === "all"
                  ? isDark
                    ? "bg-brand-yellow text-gray-900"
                    : "bg-brand-gold text-white shadow"
                  : isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Appointments
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 text-sm rounded-md transition font-semibold ${
                viewMode === "calendar"
                  ? isDark
                    ? "bg-brand-yellow text-gray-900"
                    : "bg-brand-gold text-white shadow"
                  : isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Calendar
            </button>
          </div>

          <input
            type="text"
            placeholder="Search by name, email, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 max-w-md px-4 py-2 rounded-lg ${inputClasses}`}
          />
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 p-6 rounded-xl ${cardClasses}`}>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className={`px-4 py-2 rounded-md ${buttonClasses}`}
              >
                &larr; Prev
              </button>
              <h3 className={`text-xl font-bold ${textHeader}`}>
                {currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={() => changeMonth(1)}
                className={`px-4 py-2 rounded-md ${buttonClasses}`}
              >
                Next &rarr;
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm text-gray-400 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, index) => {
                const dateKey = day.toISOString().split("T")[0];
                const appointmentsForDay =
                  appointmentsByDate.get(dateKey) || [];
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();
                const isToday = day.getTime() === today.getTime();
                const isSelected =
                  selectedDate && day.getTime() === selectedDate.getTime();
                return (
                  <div
                    key={index}
                    onClick={() => {
                      isCurrentMonth && setSelectedDate(day);
                    }}
                    className={`h-24 p-2 rounded-md flex flex-col justify-between transition-colors ${
                      isCurrentMonth
                        ? isSelected
                          ? isDark
                            ? "bg-brand-yellow text-gray-900"
                            : "bg-brand-gold text-white"
                          : isDark
                          ? "bg-gray-700/50 hover:bg-gray-600/50"
                          : "bg-gray-100 hover:bg-gray-200"
                        : isDark
                        ? "bg-gray-800/20 text-gray-600"
                        : "bg-gray-50 text-gray-400"
                    } ${isCurrentMonth ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span
                      className={`font-bold text-sm ${
                        isToday && !isSelected
                          ? isDark
                            ? "text-brand-yellow"
                            : "text-brand-gold"
                          : ""
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {appointmentsForDay.length > 0 && (
                      <div className="flex justify-center space-x-1">
                        {appointmentsForDay.slice(0, 3).map((app, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              app.status === "pending"
                                ? "bg-yellow-400"
                                : app.status === "confirmed" ||
                                  app.status === "paid"
                                ? "bg-green-400"
                                : "bg-gray-400"
                            }`}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className={`p-6 rounded-xl ${cardClasses}`}>
            <h3 className={`text-xl font-bold mb-4 ${textHeader}`}>
              {selectedDate
                ? selectedDate.toLocaleDateString("default", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : "Select a day"}
            </h3>
            <AnimatePresence>
              {selectedDate &&
              (
                appointmentsByDate.get(
                  selectedDate.toISOString().split("T")[0]
                ) || []
              ).length > 0 ? (
                (
                  appointmentsByDate.get(
                    selectedDate.toISOString().split("T")[0]
                  ) || []
                ).map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 my-2 rounded-lg cursor-pointer ${
                      isDark
                        ? "bg-gray-700/50 hover:bg-gray-700"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      setSelectedAppointment(app);
                      setShowDetailModal(true);
                    }}
                  >
                    <p className="font-semibold">
                      {app.timeSlot} - {app.userName}
                    </p>
                    <p className={`text-sm ${textMuted}`}>{app.serviceName}</p>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusClasses(
                          app.status,
                          theme
                        )}`}
                      >
                        {app.status}
                      </span>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${getPaymentStatusClasses(
                          app.paymentStatus,
                          theme
                        )}`}
                      >
                        {app.paymentStatus}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className={isDark ? "text-gray-500" : "text-gray-400"}>
                  No appointments for this day.
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode !== "calendar" && (
        <div className={`p-6 rounded-xl overflow-x-auto ${cardClasses}`}>
          <table className="min-w-full">
            <thead className={`${isDark ? "bg-gray-700/50" : "bg-gray-100"}`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? "divide-gray-800" : "divide-gray-200"
              }`}
            >
              {filteredAppointments.map((app) => (
                <tr
                  key={app.id}
                  className={`${
                    isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      {formatDate(app.appointmentDate)}
                    </div>
                    <div className={`text-xs ${textMuted}`}>{app.timeSlot}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium">{app.userName}</div>
                    <div className={`text-xs ${textMuted}`}>
                      {app.userEmail}
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      {app.userPhone}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium">{app.serviceName}</div>
                    <div className={`text-xs ${textMuted}`}>
                      {app.serviceCategory}
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      {app.duration} min
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-semibold">
                    {formatCurrency(app.amount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusClasses(
                        app.status,
                        theme
                      )}`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusClasses(
                        app.paymentStatus,
                        theme
                      )}`}
                    >
                      {app.paymentStatus}
                    </span>
                    {app.paymentTransactionId && (
                      <div className={`text-xs ${textMuted} mt-1`}>
                        {app.paymentTransactionId}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAppointment(app);
                          setShowDetailModal(true);
                        }}
                        className={`px-3 py-1 text-xs rounded-md ${
                          isDark
                            ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        View
                      </button>
                      {(app.status === "pending" || !app.confirmedAt) && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(app);
                            setShowApprovalModal(true);
                          }}
                          className={`px-3 py-1 text-xs rounded-md ${
                            isDark
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          Approve
                        </button>
                      )}
                      {app.status === "confirmed" && (
                        <button
                          onClick={() => handleMarkCompleted(app.id)}
                          className={`px-3 py-1 text-xs rounded-md ${
                            isDark
                              ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          }`}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {showDetailModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className={`${cardClasses} p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className={`text-2xl font-bold ${headingClasses}`}>
                  Appointment Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`${textMuted} hover:text-red-500`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm ${textMuted}`}>
                      Patient Name
                    </label>
                    <p className={`font-semibold ${textHeader}`}>
                      {selectedAppointment.userName}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Email</label>
                    <p className={`font-semibold ${textHeader}`}>
                      {selectedAppointment.userEmail}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Phone</label>
                    <p className={`font-semibold ${textHeader}`}>
                      {selectedAppointment.userPhone}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Service</label>
                    <p className={`font-semibold ${textHeader}`}>
                      {selectedAppointment.serviceName}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Date</label>
                    <p className={`font-semibold ${textHeader}`}>
                      {formatDate(selectedAppointment.appointmentDate)}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Time</label>
                    <p className={`font-semibold ${textHeader}`}>
                      {selectedAppointment.timeSlot}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Duration</label>
                    <p className={`font-semibold ${textHeader}`}>
                      {selectedAppointment.duration} minutes
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Amount</label>
                    <p className={`font-semibold text-green-500`}>
                      {formatCurrency(selectedAppointment.amount)}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Status</label>
                    <div>
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusClasses(
                          selectedAppointment.status,
                          theme
                        )}`}
                      >
                        {selectedAppointment.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>
                      Payment Status
                    </label>
                    <div>
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full ${getPaymentStatusClasses(
                          selectedAppointment.paymentStatus,
                          theme
                        )}`}
                      >
                        {selectedAppointment.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedAppointment.paymentTransactionId && (
                  <div>
                    <label className={`text-sm ${textMuted}`}>
                      Transaction ID
                    </label>
                    <p className={`font-mono text-sm ${textHeader}`}>
                      {selectedAppointment.paymentTransactionId}
                    </p>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div>
                    <label className={`text-sm ${textMuted}`}>
                      Patient Notes
                    </label>
                    <p className={`${textHeader}`}>
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}

                {selectedAppointment.adminNotes && (
                  <div>
                    <label className={`text-sm ${textMuted}`}>
                      Admin Notes
                    </label>
                    <p className={`${textHeader}`}>
                      {selectedAppointment.adminNotes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  <div>
                    <label className={`text-sm ${textMuted}`}>Created</label>
                    <p className={`text-sm ${textHeader}`}>
                      {formatDateTime(selectedAppointment.createdAt)}
                    </p>
                  </div>
                  {selectedAppointment.confirmedAt && (
                    <div>
                      <label className={`text-sm ${textMuted}`}>
                        Confirmed
                      </label>
                      <p className={`text-sm ${textHeader}`}>
                        {formatDateTime(selectedAppointment.confirmedAt)}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.paidAt && (
                    <div>
                      <label className={`text-sm ${textMuted}`}>Paid</label>
                      <p className={`text-sm ${textHeader}`}>
                        {formatDateTime(selectedAppointment.paidAt)}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.cancelledAt && (
                    <div>
                      <label className={`text-sm ${textMuted}`}>
                        Cancelled
                      </label>
                      <p className={`text-sm ${textHeader}`}>
                        {formatDateTime(selectedAppointment.cancelledAt)}
                      </p>
                    </div>
                  )}
                </div>

                {selectedAppointment.cancellationReason && (
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <label className={`text-sm text-red-400`}>
                      Cancellation Reason
                    </label>
                    <p className={`${textHeader}`}>
                      {selectedAppointment.cancellationReason}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                {selectedAppointment.status === "pending" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowApprovalModal(true);
                    }}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold ${
                      isDark
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    Approve Appointment
                  </button>
                )}
                {selectedAppointment.paymentStatus === "paid" &&
                  selectedAppointment.status !== "cancelled" && (
                    <button
                      onClick={() => handleRefund(selectedAppointment)}
                      className={`flex-1 py-2 px-4 rounded-md font-semibold ${
                        isDark
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      Process Refund
                    </button>
                  )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`px-6 py-2 rounded-md ${buttonClasses}`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APPROVAL MODAL */}
      <AnimatePresence>
        {showApprovalModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowApprovalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className={`${cardClasses} p-8 rounded-2xl w-full max-w-lg`}
            >
              <h2 className={`text-2xl font-bold mb-4 ${headingClasses}`}>
                Approve Appointment
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className={`text-sm ${textMuted}`}>Patient</p>
                  <p className={`font-semibold ${textHeader}`}>
                    {selectedAppointment.userName}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${textMuted}`}>Service</p>
                  <p className={`font-semibold ${textHeader}`}>
                    {selectedAppointment.serviceName}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${textMuted}`}>Date & Time</p>
                  <p className={`font-semibold ${textHeader}`}>
                    {formatDate(selectedAppointment.appointmentDate)} at{" "}
                    {selectedAppointment.timeSlot}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${textMuted}`}>Amount</p>
                  <p className={`font-semibold text-green-500`}>
                    {formatCurrency(selectedAppointment.amount)}
                  </p>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${textMuted}`}
                  >
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes for this appointment..."
                    className={`w-full p-3 rounded-lg ${inputClasses}`}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {/* Only show Approve button if not already cancelled/declined */}
                {selectedAppointment.status?.toLowerCase() !== "cancelled" && (
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className={`flex-1 py-3 rounded-md font-semibold ${
                      isDark
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    } disabled:opacity-50`}
                  >
                    {actionLoading ? "Approving..." : "✓ Approve"}
                  </button>
                )}
                {/* Only show Decline button if not already cancelled/declined */}
                {selectedAppointment.status?.toLowerCase() !== "cancelled" && (
                  <button
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className={`flex-1 py-3 rounded-md font-semibold ${
                      isDark
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    } disabled:opacity-50`}
                  >
                    {actionLoading ? "Declining..." : "✕ Decline"}
                  </button>
                )}
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={actionLoading}
                  className={`px-6 py-3 rounded-md ${buttonClasses} disabled:opacity-50`}
                >
                  {selectedAppointment.status?.toLowerCase() === "cancelled"
                    ? "Close"
                    : "Cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedAppointmentManagement;
