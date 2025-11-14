// src/AdminDashboard.tsx

// =================================================================================================
// --- 1. IMPORTS & SETUP ---
// This section contains all necessary imports from React, Firebase, and other libraries,
// as well as the initial registration for Chart.js.
// =================================================================================================

import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Layout } from "./Layout";
import EnhancedAppointmentManagement from "./components/EnhancedAppointmentManagement";
import EnhancedChatManagement from "./components/chat/EnhancedChatManagement";
import InvoicesManagement from "./components/InvoicesManagement";
import AppointmentDataMigration from "./components/AppointmentDataMigration";
import dermaglareLogo from "./assets/dermaglare-logo.png";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// =================================================================================================
// --- 2. TYPE DEFINITIONS & UTILITY FUNCTIONS ---
// Updated to match your Firebase structure
// =================================================================================================

type Theme = "light" | "dark";

interface Page {
  name:
    | "Dashboard"
    | "User Management"
    | "Appointment Management"
    | "Invoices"
    | "Chat Management"
    | "Schedule Management"
    | "Services"
    | "Chatbot Knowledge"
    | "User Sync"
    | "Data Migration"
    | "Settings";
  icon: string;
}

// Updated to match your Firebase 'users' collection
interface AppUser {
  id: string;
  displayName?: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: any;
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
}

// Updated to match your Firebase 'appointments' collection
interface Appointment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  date: string;
  time: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  serviceType?: string;
  notes?: string;
  createdAt?: any;
}

const getStatusClasses = (status: string, theme: Theme) => {
  const isDark = theme === "dark";
  switch (status) {
    case "Confirmed":
    case "Completed":
      return isDark
        ? "bg-green-500/20 text-green-400 ring-1 ring-inset ring-green-500/30"
        : "bg-green-100 text-green-800 ring-1 ring-inset ring-green-200";
    case "Pending":
      return isDark
        ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-inset ring-yellow-500/30"
        : "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200";
    case "Cancelled":
      return isDark
        ? "bg-red-500/20 text-red-400 ring-1 ring-inset ring-red-500/30"
        : "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200";
    default:
      return isDark
        ? "bg-gray-500/20 text-gray-400 ring-1 ring-inset ring-gray-500/30"
        : "bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200";
  }
};

// =================================================================================================
// --- 3. STANDALONE UI COMPONENTS (PRELOADER & LOGIN) ---
// =================================================================================================

const CreativePreloader: React.FC = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5, rotate: -180 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 1,
      },
    },
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.5 },
    },
  };

  const spinnerVariants: Variants = {
    animate: {
      rotate: 360,
      transition: { duration: 2, repeat: Infinity, ease: "linear" },
    },
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-brand-teal via-brand-teal-dark to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-brand-yellow rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-brand-yellow-light rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center flex flex-col items-center relative z-10"
      >
        {/* Logo */}
        <motion.div variants={logoVariants} className="mb-8 relative">
          <motion.div
            variants={spinnerVariants}
            animate="animate"
            className="absolute inset-0 rounded-full border-4 border-brand-yellow border-t-transparent"
            style={{ padding: "20px", margin: "-20px" }}
          />
          <div className="relative p-8 bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl">
            <img
              src={dermaglareLogo}
              alt="Dermaglare Logo"
              className="w-32 h-32 object-contain drop-shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div variants={textVariants} className="space-y-4">
          <h1 className="text-5xl font-bold text-brand-yellow drop-shadow-lg tracking-wide">
            Dermaglare
          </h1>
          <p className="text-2xl text-white font-light tracking-wider">
            Admin Portal
          </p>
          <motion.div
            className="flex items-center justify-center gap-2 mt-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-2 h-2 bg-brand-yellow rounded-full" />
            <div
              className="w-2 h-2 bg-brand-yellow rounded-full"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-2 h-2 bg-brand-yellow rounded-full"
              style={{ animationDelay: "0.4s" }}
            />
          </motion.div>
          <p className="text-white/60 text-sm mt-4">Initializing Services...</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

const LoginPage: React.FC<{
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  loginError: string;
}> = ({ handleLogin, setEmail, setPassword, loginError }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-teal via-brand-teal-dark to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute top-40 left-20 w-96 h-96 bg-brand-yellow rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 right-20 w-96 h-96 bg-brand-yellow-light rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex w-full max-w-5xl overflow-hidden bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10"
        style={{ minHeight: "600px" }}
      >
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-teal to-brand-teal-dark p-12 flex-col justify-center items-center text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-brand-yellow/20 rounded-full blur-2xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-brand-yellow/10 rounded-full blur-3xl" />

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative z-10"
          >
            <div className="mb-8 p-8 bg-white/10 backdrop-blur-sm rounded-3xl inline-block shadow-2xl">
              <img
                src={dermaglareLogo}
                alt="Dermaglare Logo"
                className="h-32 w-auto object-contain drop-shadow-2xl"
              />
            </div>
            <h2 className="text-5xl font-bold text-brand-yellow mb-4 drop-shadow-lg">
              Dermaglare
            </h2>
            <p className="text-2xl text-white font-light mb-6">Admin Portal</p>
            <p className="text-white/80 max-w-sm leading-relaxed">
              Manage appointments, patients, and clinic operations with ease.
              Your comprehensive dermatology practice management solution.
            </p>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-12 space-y-4 relative z-10"
          >
            <div className="flex items-center gap-3 text-white/90">
              <svg
                className="w-5 h-5 text-brand-yellow"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Real-time Appointment Management</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <svg
                className="w-5 h-5 text-brand-yellow"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Patient Communication Hub</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <svg
                className="w-5 h-5 text-brand-yellow"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Advanced Analytics Dashboard</span>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white/5 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-300">
                Please sign in to your account to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="admin@dermaglare.com"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all group-hover:border-white/30"
                    required
                  />
                  <svg
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all group-hover:border-white/30"
                    required
                  />
                  <svg
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>

              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
                  >
                    <svg
                      className="w-5 h-5 text-red-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-red-200 text-sm">{loginError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="w-full py-4 font-bold text-gray-900 bg-gradient-to-r from-brand-yellow to-brand-yellow-dark rounded-xl shadow-glow-yellow hover:shadow-glow-yellow focus:outline-none focus:ring-4 focus:ring-brand-yellow/50 transition-all transform hover:scale-105 btn-premium relative overflow-hidden"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Sign In
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </motion.button>

              <div className="text-center mt-6">
                <p className="text-gray-400 text-sm">
                  Contact technical support to assist with resetting password
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// =================================================================================================
// --- 4. VIEW COMPONENTS (DASHBOARD & USER MANAGEMENT) ---
// =================================================================================================

// --- 4.1 DASHBOARD VIEW ---
const DashboardView = ({
  appointments,
  users,
  theme,
}: {
  appointments: Appointment[];
  users: AppUser[];
  theme: Theme;
}) => {
  const [chartView, setChartView] = useState<"upcoming" | "past">("upcoming");
  const isDark = theme === "dark";

  // Helper function to get user's display name from multiple possible fields
  const getUserDisplayName = (user: AppUser): string => {
    if (user.displayName && user.displayName.trim()) return user.displayName;
    if (user.fullName && user.fullName.trim()) return user.fullName;
    if (user.name && user.name.trim()) return user.name;
    if (user.firstName || user.lastName) {
      const firstName = user.firstName?.trim() || "";
      const lastName = user.lastName?.trim() || "";
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    if (user.email) {
      const emailName = user.email.split("@")[0];
      return emailName
        .split(/[._-]/)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }
    return "User";
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: isDark ? "#e5e7eb" : "#374151" } } },
    scales: {
      y: {
        ticks: { color: isDark ? "#d1d5db" : "#4b5563", beginAtZero: true },
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: { color: isDark ? "#d1d5db" : "#4b5563" },
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.0)" : "rgba(0, 0, 0, 0.0)",
        },
      },
    },
  };

  const appointmentChartData = {
    labels:
      chartView === "upcoming"
        ? [...Array(7)].map((_, i) =>
            new Date(Date.now() + i * 864e5).toLocaleDateString("en-US", {
              weekday: "short",
            })
          )
        : [...Array(7)].map((_, i) =>
            new Date(Date.now() - (6 - i) * 864e5).toLocaleDateString("en-US", {
              weekday: "short",
            })
          ),
    datasets: [
      {
        label: "Appointments",
        data:
          chartView === "upcoming"
            ? [...Array(7)].map(
                (_, i) =>
                  appointments.filter(
                    (a) =>
                      a.date ===
                      new Date(Date.now() + i * 864e5)
                        .toISOString()
                        .split("T")[0]
                  ).length
              )
            : [...Array(7)].map(
                (_, i) =>
                  appointments.filter(
                    (a) =>
                      a.date ===
                      new Date(Date.now() - (6 - i) * 864e5)
                        .toISOString()
                        .split("T")[0]
                  ).length
              ),
        backgroundColor: isDark
          ? "rgba(244, 228, 142, 0.6)"
          : "rgba(164, 137, 82, 0.6)",
        borderColor: isDark ? "#F4E48E" : "#A48952",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const statusCounts = {
    Confirmed: appointments.filter((a) => a.status === "Confirmed").length,
    Pending: appointments.filter((a) => a.status === "Pending").length,
    Completed: appointments.filter((a) => a.status === "Completed").length,
    Cancelled: appointments.filter((a) => a.status === "Cancelled").length,
  };

  const statusChartData = {
    labels: ["Confirmed", "Pending", "Completed", "Cancelled"],
    datasets: [
      {
        data: [
          statusCounts.Confirmed,
          statusCounts.Pending,
          statusCounts.Completed,
          statusCounts.Cancelled,
        ],
        backgroundColor: ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444"],
        borderColor: isDark ? "#1f2937" : "#fff",
      },
    ],
  };

  const todayAppointments = appointments.filter(
    (a) => a.date === new Date().toISOString().split("T")[0]
  );

  const cardClasses = isDark
    ? "bg-white/5 border-white/10"
    : "bg-white shadow-md border border-gray-200";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const textHeader = isDark ? "text-white" : "text-gray-800";
  const scheduleRow = isDark
    ? "bg-gray-700/50"
    : "bg-gray-50 border border-gray-200";

  return (
    <div className="space-y-8">
      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Appointments Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl ${cardClasses} relative overflow-hidden group hover:shadow-premium-hover transition-all duration-300 cursor-pointer`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-teal/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-sm font-semibold uppercase tracking-wide ${textMuted}`}
              >
                Appointments Today
              </h3>
              <div
                className={`p-3 rounded-xl ${
                  isDark ? "bg-brand-teal/20" : "bg-brand-teal/10"
                } group-hover:scale-110 transition-transform`}
              >
                <svg
                  className="w-6 h-6 text-brand-teal"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className={`text-4xl font-bold ${textHeader} mb-2`}>
              {todayAppointments.length}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-brand-teal">
                {todayAppointments.length > 0 ? "Active" : "No appointments"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-2xl ${cardClasses} relative overflow-hidden group hover:shadow-premium-hover transition-all duration-300 cursor-pointer`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-sm font-semibold uppercase tracking-wide ${textMuted}`}
              >
                Total Users
              </h3>
              <div
                className={`p-3 rounded-xl ${
                  isDark ? "bg-blue-500/20" : "bg-blue-500/10"
                } group-hover:scale-110 transition-transform`}
              >
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <p className={`text-4xl font-bold ${textHeader} mb-2`}>
              {users.length}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-500">
                Registered patients
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Pending Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-2xl ${cardClasses} relative overflow-hidden group hover:shadow-premium-hover transition-all duration-300 cursor-pointer`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-yellow/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-sm font-semibold uppercase tracking-wide ${textMuted}`}
              >
                Pending Appointments
              </h3>
              <div
                className={`p-3 rounded-xl ${
                  isDark ? "bg-brand-yellow/20" : "bg-brand-yellow/30"
                } group-hover:scale-110 transition-transform`}
              >
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-yellow-500 mb-2">
              {statusCounts.Pending}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-yellow-500">
                Awaiting confirmation
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Active Patients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-2xl ${cardClasses} relative overflow-hidden group hover:shadow-premium-hover transition-all duration-300 cursor-pointer`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-sm font-semibold uppercase tracking-wide ${textMuted}`}
              >
                Active Patients
              </h3>
              <div
                className={`p-3 rounded-xl ${
                  isDark ? "bg-green-500/20" : "bg-green-500/10"
                } group-hover:scale-110 transition-transform`}
              >
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-green-500 mb-2">
              {users.filter((u) => u.isActive).length}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-500">
                Currently active
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-6 rounded-xl ${cardClasses}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${textHeader}`}>
              Appointments
            </h3>
            <div
              className={`flex space-x-1 p-1 rounded-lg ${
                isDark ? "bg-gray-900/50" : "bg-gray-100"
              }`}
            >
              <button
                onClick={() => setChartView("past")}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  chartView === "past"
                    ? isDark
                      ? "bg-brand-yellow text-gray-900 font-semibold"
                      : "bg-brand-gold text-white shadow"
                    : `${textMuted} hover:bg-gray-700`
                }`}
              >
                Past 7 Days
              </button>
              <button
                onClick={() => setChartView("upcoming")}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  chartView === "upcoming"
                    ? isDark
                      ? "bg-brand-yellow text-gray-900 font-semibold"
                      : "bg-brand-gold text-white shadow"
                    : `${textMuted} hover:bg-gray-700`
                }`}
              >
                Upcoming
              </button>
            </div>
          </div>
          <div className="h-[300px]">
            <Bar data={appointmentChartData} options={chartOptions} />
          </div>
        </div>
        <div
          className={`p-6 rounded-xl flex flex-col items-center ${cardClasses}`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${textHeader}`}>
            Appointment Status
          </h3>
          <div className="h-[300px] w-full">
            <Doughnut
              data={statusChartData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: isDark ? "#e5e7eb" : "#374151" } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Today's Schedule and Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl ${cardClasses}`}>
          <h3
            className={`text-xl font-bold mb-4 ${textHeader} flex items-center gap-2`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Today's Schedule
          </h3>
          {todayAppointments.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {todayAppointments.map((app, idx) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex justify-between items-center p-4 rounded-lg ${scheduleRow} hover:shadow-lg transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDark
                          ? "bg-brand-yellow/20 text-brand-yellow"
                          : "bg-brand-teal/20 text-brand-teal"
                      }`}
                    >
                      {app.time?.split(":")[0] || "00"}
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {app.time} - {app.userName || "Patient"}
                      </p>
                      <p className={`text-sm ${textMuted}`}>
                        {app.serviceType || "Consultation"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(
                      app.status,
                      theme
                    )}`}
                  >
                    {app.status}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className={`w-16 h-16 mx-auto mb-2 ${textMuted}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className={`${textMuted} italic`}>
                No appointments for today.
              </p>
            </div>
          )}
        </div>

        <div className={`p-6 rounded-xl ${cardClasses}`}>
          <h3
            className={`text-xl font-bold mb-4 ${textHeader} flex items-center gap-2`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Recent Patients
          </h3>
          {users.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {users.slice(0, 8).map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex justify-between items-center p-4 rounded-lg ${scheduleRow} hover:shadow-lg transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        isDark
                          ? "bg-brand-yellow/20 text-brand-yellow"
                          : "bg-brand-teal/20 text-brand-teal"
                      }`}
                    >
                      {getUserDisplayName(user).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {getUserDisplayName(user)}
                      </p>
                      <p
                        className={`text-sm ${textMuted} truncate max-w-[200px]`}
                      >
                        {user.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                        user.isActive
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className={`text-xs ${textMuted}`}>
                      {user.role || "patient"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className={`w-16 h-16 mx-auto mb-2 ${textMuted}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p className={`${textMuted} italic`}>
                No patients registered yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 4.2 USER MANAGEMENT VIEW ---
const UserManagementView = ({
  users,
  theme,
}: {
  users: AppUser[];
  theme: Theme;
}) => {
  const isDark = theme === "dark";
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("All");
  const [editingUser, setEditingUser] = React.useState<string | null>(null);
  const [newRole, setNewRole] = React.useState<string>("");
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleRoleUpdate = async (userId: string, currentRole: string) => {
    if (newRole === currentRole) {
      setEditingUser(null);
      return;
    }

    setIsUpdating(true);
    try {
      // Update role in Firestore
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
      });

      alert(`✅ User role updated to "${newRole}" successfully!`);
      setEditingUser(null);

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error("❌ Error updating role:", error);
      alert(`Error updating role: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone and will permanently remove the user from the system.`
    );

    if (!confirmDelete) return;

    setIsUpdating(true);
    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", userId));

      alert(`✅ User "${userName}" deleted successfully!`);
      setEditingUser(null);

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error("❌ Error deleting user:", error);
      alert(`Error deleting user: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to get user's display name from multiple possible fields
  const getUserDisplayName = (user: AppUser): string => {
    // Try different name fields in order of preference
    if (user.displayName && user.displayName.trim()) return user.displayName;
    if (user.fullName && user.fullName.trim()) return user.fullName;
    if (user.name && user.name.trim()) return user.name;
    if (user.firstName || user.lastName) {
      const firstName = user.firstName?.trim() || "";
      const lastName = user.lastName?.trim() || "";
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    // If no name fields exist, extract name from email
    if (user.email) {
      const emailName = user.email.split("@")[0];
      // Convert email username to a readable format (e.g., john.doe -> John Doe)
      return emailName
        .split(/[._-]/)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }
    return "User";
  };

  const filteredUsers = users.filter((user) => {
    const displayName = getUserDisplayName(user);
    const matchesSearch =
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "All" || user.role === filterRole;
    const passes = matchesSearch && matchesRole;

    if (!passes) {
      console.log("❌ User filtered out:", {
        id: user.id,
        email: user.email,
        displayName,
        searchTerm,
        filterRole,
        matchesSearch,
        matchesRole,
        userRole: user.role,
      });
    }

    return passes;
  });

  console.log("🔍 Filter results:", {
    totalUsers: users.length,
    filteredUsers: filteredUsers.length,
    searchTerm,
    filterRole,
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    patients: users.filter((u) => u.role === "patient").length,
    staff: users.filter((u) => u.role === "staff" || u.role === "admin").length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <h1
            className={`text-4xl font-bold mb-2 bg-gradient-to-r ${
              isDark
                ? "from-brand-yellow via-brand-yellow-light to-brand-yellow-dark"
                : "from-brand-teal via-brand-teal-light to-brand-teal-dark"
            } bg-clip-text text-transparent`}
          >
            User Management
          </h1>
          <p
            className={`text-lg ${isDark ? "text-white/60" : "text-gray-600"}`}
          >
            Manage all patients and staff members
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              label: "Total Users",
              value: stats.total,
              iconPath:
                "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
              color: "blue",
            },
            {
              label: "Active",
              value: stats.active,
              iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              color: "green",
            },
            {
              label: "Inactive",
              value: stats.inactive,
              iconPath:
                "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
              color: "gray",
            },
            {
              label: "Patients",
              value: stats.patients,
              iconPath:
                "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
              color: "teal",
            },
            {
              label: "Staff",
              value: stats.staff,
              iconPath:
                "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
              color: "yellow",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-xl border backdrop-blur-sm ${
                isDark
                  ? "bg-gray-800/50 border-white/10 hover:bg-gray-800/70"
                  : "bg-white/80 border-gray-200 hover:bg-white"
              } shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm ${
                      isDark ? "text-white/60" : "text-gray-600"
                    } mb-1`}
                  >
                    {stat.label}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${
                    isDark ? "text-brand-yellow" : "text-brand-teal"
                  }`}
                >
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={stat.iconPath}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter */}
        <div
          className={`p-4 rounded-xl backdrop-blur-md border ${
            isDark
              ? "bg-gray-800/50 border-white/10"
              : "bg-white border-gray-200"
          } shadow-lg`}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 px-4 py-3 rounded-lg border ${
                isDark
                  ? "bg-gray-900/50 border-white/10 text-white placeholder-white/40"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-brand-yellow/50`}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={`px-4 py-3 rounded-lg border ${
                isDark
                  ? "bg-gray-900/50 border-white/10 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-brand-yellow/50`}
            >
              <option value="All">All Roles</option>
              <option value="patient">Patients</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p
            className={`text-xl ${isDark ? "text-white/60" : "text-gray-600"}`}
          >
            No users found. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-6 rounded-xl border backdrop-blur-sm ${
                isDark
                  ? "bg-gray-800/50 border-white/10 hover:bg-gray-800/70"
                  : "bg-white border-gray-200 hover:shadow-xl"
              } transition-all duration-300 hover:-translate-y-1 shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                      isDark
                        ? "bg-brand-yellow/20 text-brand-yellow"
                        : "bg-brand-teal/20 text-brand-teal"
                    }`}
                  >
                    {getUserDisplayName(user).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {getUserDisplayName(user)}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-500/20 text-purple-300"
                          : user.role === "staff"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      {user.role || "patient"}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    user.isActive
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 ${
                      isDark ? "text-white/60" : "text-gray-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p
                    className={`text-sm ${
                      isDark ? "text-white/70" : "text-gray-600"
                    } truncate`}
                  >
                    {user.email || "No email"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 ${
                      isDark ? "text-white/60" : "text-gray-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p
                    className={`text-sm ${
                      isDark ? "text-white/70" : "text-gray-600"
                    }`}
                  >
                    Joined:{" "}
                    {user.createdAt?.toDate
                      ? user.createdAt.toDate().toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Role Editor */}
              <div className="mt-4 pt-4 border-t border-white/10">
                {editingUser === user.id ? (
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Change Role:
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      disabled={isUpdating}
                    >
                      <option value="patient">Patient</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleRoleUpdate(user.id, user.role || "patient")
                        }
                        disabled={isUpdating}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {isUpdating ? "Updating..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        disabled={isUpdating}
                        className={`flex-1 px-3 py-2 rounded-lg font-semibold transition ${
                          isDark
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        handleDeleteUser(user.id, getUserDisplayName(user))
                      }
                      disabled={isUpdating}
                      className="w-full mt-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      {isUpdating ? "Deleting..." : "🗑️ Delete User"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingUser(user.id);
                      setNewRole(user.role || "patient");
                    }}
                    className={`w-full px-3 py-2 rounded-lg font-semibold transition ${
                      isDark
                        ? "bg-brand-yellow/20 hover:bg-brand-yellow/30 text-brand-yellow"
                        : "bg-brand-teal/20 hover:bg-brand-teal/30 text-brand-teal"
                    }`}
                  >
                    Edit Role
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 4.3 USER SYNC VIEW ---
const UserSyncView = ({
  theme,
  onSyncComplete,
}: {
  theme: Theme;
  onSyncComplete: () => void;
}) => {
  const isDark = theme === "dark";
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("patient");
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }

    setIsSyncing(true);
    setMessage(null);

    try {
      // Create user document in Firestore
      const userRef = doc(db, "users", email.replace(/[@.]/g, "_"));
      await setDoc(userRef, {
        email: email,
        displayName: displayName || email.split("@")[0],
        role: role,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      setMessage({
        type: "success",
        text: `User ${email} added to Firestore successfully!`,
      });

      // Clear form
      setEmail("");
      setDisplayName("");
      setRole("patient");

      // Refresh user list
      setTimeout(() => {
        onSyncComplete();
      }, 1000);
    } catch (error: any) {
      console.error("Error adding user:", error);
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <h1
            className={`text-4xl font-bold mb-2 bg-gradient-to-r ${
              isDark
                ? "from-brand-yellow via-brand-yellow-light to-brand-yellow-dark"
                : "from-brand-teal via-brand-teal-light to-brand-teal-dark"
            } bg-clip-text text-transparent`}
          >
            User Sync
          </h1>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Sync Firebase Authentication users to Firestore database
          </p>
        </div>

        {/* Auto-Sync from Appointments */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className={`p-6 rounded-xl ${
            isDark
              ? "bg-green-500/10 border-green-500/30"
              : "bg-green-50 border-green-200"
          } border`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3
                className={`font-semibold mb-2 flex items-center gap-2 ${
                  isDark ? "text-green-300" : "text-green-900"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Auto-Sync Users from Appointments
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-green-400" : "text-green-700"
                }`}
              >
                Automatically creates/updates Firestore user records using
                Firebase Auth UIDs from appointments. This ensures chat messages
                and appointments are properly linked to users.
              </p>
            </div>
            <button
              onClick={async () => {
                setIsSyncing(true);
                setMessage(null);
                try {
                  // Fetch all appointments
                  const appointmentsSnapshot = await getDocs(
                    collection(db, "appointments")
                  );
                  const appointments = appointmentsSnapshot.docs.map((doc) =>
                    doc.data()
                  );

                  // Fetch existing users
                  const usersSnapshot = await getDocs(collection(db, "users"));
                  const existingUsers = new Map<string, any>();
                  usersSnapshot.docs.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.email) {
                      existingUsers.set(userData.email, {
                        docId: doc.id,
                        ...userData,
                      });
                    }
                  });

                  // Find users to create or update
                  const usersToSync = new Map<string, any>();
                  const usersToUpdate = new Map<string, any>();

                  appointments.forEach((apt: any) => {
                    if (apt.userEmail && apt.userId) {
                      // Use the Firebase Auth UID from the appointment
                      const userId = apt.userId;
                      const userData = {
                        id: userId,
                        email: apt.userEmail,
                        displayName:
                          apt.userName || apt.userEmail.split("@")[0],
                        role: "patient",
                        isActive: true,
                      };

                      // Check if user exists by email OR by userId
                      const existingUserByEmail = existingUsers.get(
                        apt.userEmail
                      );
                      let shouldUpdate = false;

                      if (existingUserByEmail) {
                        // Update if missing id field or if id doesn't match userId
                        if (
                          !existingUserByEmail.id ||
                          existingUserByEmail.docId !== userId
                        ) {
                          usersToUpdate.set(userId, userData);
                          shouldUpdate = true;
                        }
                      }

                      if (!existingUserByEmail || !shouldUpdate) {
                        // New user to create (use Firebase Auth UID as document ID)
                        usersToSync.set(userId, {
                          ...userData,
                          createdAt: serverTimestamp(),
                        });
                      }
                    }
                  });

                  // Create new users and update existing ones
                  let syncedCount = 0;
                  let updatedCount = 0;

                  // Create new users
                  for (const [, userData] of usersToSync) {
                    const userRef = doc(db, "users", userData.id);
                    await setDoc(userRef, userData);
                    syncedCount++;
                  }

                  // Update existing users missing id field
                  for (const [, userData] of usersToUpdate) {
                    const userRef = doc(db, "users", userData.id);
                    await setDoc(userRef, userData, { merge: true });
                    updatedCount++;
                  }

                  const totalCount = syncedCount + updatedCount;
                  setMessage({
                    type: "success",
                    text: `✅ Successfully synced ${totalCount} users (${syncedCount} new, ${updatedCount} updated)!`,
                  });

                  // Refresh
                  setTimeout(() => {
                    onSyncComplete();
                  }, 1500);
                } catch (error: any) {
                  console.error("Error syncing users:", error);
                  setMessage({
                    type: "error",
                    text: `❌ Error: ${error.message}`,
                  });
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className={`ml-4 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                isDark
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {isSyncing ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Syncing...
                </span>
              ) : (
                "🔄 Auto-Sync Now"
              )}
            </button>
          </div>
        </motion.div>

        {/* Info Banner */}
        <div
          className={`p-4 rounded-lg ${
            isDark
              ? "bg-blue-500/20 border border-blue-500/30"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="flex items-start">
            <svg
              className={`w-5 h-5 mt-0.5 mr-3 ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3
                className={`font-semibold mb-1 ${
                  isDark ? "text-blue-300" : "text-blue-900"
                }`}
              >
                Manual User Sync
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-blue-400" : "text-blue-700"
                }`}
              >
                Add Firebase Authentication users to Firestore manually. Check
                your Firebase Console Authentication tab for user emails, then
                add them here.
              </p>
            </div>
          </div>
        </div>

        {/* Add User Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-xl ${
            isDark ? "bg-gray-800/50" : "bg-white"
          } shadow-lg border ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Add User to Firestore
          </h2>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-900 border-gray-600 text-white focus:border-brand-yellow"
                    : "bg-white border-gray-300 text-gray-900 focus:border-brand-teal"
                } focus:outline-none focus:ring-2 ${
                  isDark
                    ? "focus:ring-brand-yellow/50"
                    : "focus:ring-brand-teal/50"
                }`}
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-900 border-gray-600 text-white focus:border-brand-yellow"
                    : "bg-white border-gray-300 text-gray-900 focus:border-brand-teal"
                } focus:outline-none focus:ring-2 ${
                  isDark
                    ? "focus:ring-brand-yellow/50"
                    : "focus:ring-brand-teal/50"
                }`}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-900 border-gray-600 text-white focus:border-brand-yellow"
                    : "bg-white border-gray-300 text-gray-900 focus:border-brand-teal"
                } focus:outline-none focus:ring-2 ${
                  isDark
                    ? "focus:ring-brand-yellow/50"
                    : "focus:ring-brand-teal/50"
                }`}
              >
                <option value="patient">Patient</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg ${
                  message.type === "success"
                    ? isDark
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-green-50 text-green-800 border border-green-200"
                    : message.type === "error"
                    ? isDark
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-red-50 text-red-800 border border-red-200"
                    : isDark
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSyncing}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                isSyncing
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02] active:scale-[0.98]"
              } ${
                isDark
                  ? "bg-gradient-to-r from-brand-yellow to-brand-yellow-light text-gray-900"
                  : "bg-gradient-to-r from-brand-teal to-brand-teal-light text-white"
              } shadow-lg`}
            >
              {isSyncing ? "Adding User..." : "Add User to Firestore"}
            </button>
          </form>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-xl ${
            isDark ? "bg-gray-800/50" : "bg-white"
          } shadow-lg border ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            How to Sync Users
          </h2>
          <ol
            className={`space-y-3 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <li className="flex items-start">
              <span
                className={`font-bold mr-3 ${
                  isDark ? "text-brand-yellow" : "text-brand-teal"
                }`}
              >
                1.
              </span>
              <span>
                Open{" "}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Firebase Console
                </a>
              </span>
            </li>
            <li className="flex items-start">
              <span
                className={`font-bold mr-3 ${
                  isDark ? "text-brand-yellow" : "text-brand-teal"
                }`}
              >
                2.
              </span>
              <span>
                Navigate to <strong>Authentication → Users</strong> tab
              </span>
            </li>
            <li className="flex items-start">
              <span
                className={`font-bold mr-3 ${
                  isDark ? "text-brand-yellow" : "text-brand-teal"
                }`}
              >
                3.
              </span>
              <span>Copy the email address of each user you want to sync</span>
            </li>
            <li className="flex items-start">
              <span
                className={`font-bold mr-3 ${
                  isDark ? "text-brand-yellow" : "text-brand-teal"
                }`}
              >
                4.
              </span>
              <span>
                Paste it into the form above and click "Add User to Firestore"
              </span>
            </li>
            <li className="flex items-start">
              <span
                className={`font-bold mr-3 ${
                  isDark ? "text-brand-yellow" : "text-brand-teal"
                }`}
              >
                5.
              </span>
              <span>
                Check the <strong>User Management</strong> page to verify the
                user appears
              </span>
            </li>
          </ol>
        </motion.div>
      </motion.div>
    </div>
  );
};

// --- 4.4 SETTINGS VIEW ---
const SettingsView = ({
  user,
  theme,
  setTheme,
}: {
  user: User | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) => {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const [systemStatus, setSystemStatus] = useState({
    db: "checking",
    api: "checking",
  });

  useEffect(() => {
    setIsDirty(displayName !== (user?.displayName || ""));
  }, [displayName, user]);

  useEffect(() => {
    const timer1 = setTimeout(
      () => setSystemStatus((s) => ({ ...s, db: "operational" })),
      1000
    );
    const timer2 = setTimeout(
      () => setSystemStatus((s) => ({ ...s, api: "operational" })),
      1500
    );
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDirty && auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName });
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsDirty(false);
      } catch (error: any) {
        setMessage({ type: "error", text: `Error: ${error.message}` });
      }
    }
  };

  const handlePasswordReset = async () => {
    if (user?.email) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        setMessage({ type: "success", text: "Password reset email sent." });
      } catch (error: any) {
        setMessage({ type: "error", text: `Error: ${error.message}` });
      }
    }
  };

  const handleExportData = () => {
    const userData = {
      uid: user?.uid,
      email: user?.email,
      displayName: user?.displayName,
      emailVerified: user?.emailVerified,
      metadata: user?.metadata,
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(userData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "user_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setMessage({ type: "success", text: "User data export started." });
  };

  const handleDeleteAccount = () => {
    console.log("Account deletion initiated for:", user?.email);
    setIsDeleteModalOpen(false);
    alert("In a real application, your account would now be deleted.");
  };

  const handleCopyToClipboard = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setMessage({ type: "info", text: "Email copied to clipboard!" });
    }
  };

  const isDark = theme === "dark";
  const cardClasses = isDark
    ? "bg-white/5 border-white/10 text-white"
    : "bg-white shadow-md border border-gray-200 text-gray-800";
  const inputClasses = isDark
    ? "bg-gray-700 border-gray-600 text-gray-200"
    : "bg-gray-100 border-gray-300 text-gray-800";
  const labelClasses = isDark ? "text-gray-300" : "text-gray-600";
  const buttonClasses = isDark
    ? "bg-brand-yellow text-gray-900 font-semibold"
    : "bg-brand-gold text-white";
  const headingClasses = isDark ? "text-brand-yellow" : "text-brand-gold";

  return (
    <>
      <div
        className={`p-6 rounded-xl max-w-4xl mx-auto space-y-8 ${cardClasses}`}
      >
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-md text-center font-semibold ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-300"
                  : message.type === "error"
                  ? "bg-red-500/20 text-red-300"
                  : "bg-blue-500/20 text-blue-300"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <h3 className={`text-xl font-bold ${headingClasses}`}>Profile</h3>

              <div>
                <label className={`block text-sm font-medium ${labelClasses}`}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`mt-1 block w-full rounded-md py-2 px-3 ${inputClasses}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${labelClasses}`}>
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ""}
                    className={`mt-1 block w-full rounded-md py-2 px-3 opacity-60 cursor-not-allowed ${inputClasses}`}
                  />
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-brand-yellow"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isDirty}
                className={`w-full py-2 px-4 rounded-md ${buttonClasses} disabled:bg-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed`}
              >
                Save Changes
              </button>
            </form>

            <div className="space-y-2 p-4 bg-red-900/50 border border-red-500/50 rounded-lg">
              <h3 className="text-xl font-bold text-red-400">Danger Zone</h3>
              <p className="text-sm text-red-300/80">
                Manage your account data or permanently delete it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleExportData}
                  className="w-full py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500"
                >
                  Export My Data
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className={`text-xl font-bold ${headingClasses}`}>
                Appearance
              </h3>
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? "bg-gray-700/50" : "bg-gray-100"
                }`}
              >
                <label className="font-semibold">Theme</label>
                <div className="flex items-center gap-4">
                  <span
                    className={
                      !isDark ? `font-bold ${headingClasses}` : "text-gray-400"
                    }
                  >
                    Light
                  </span>
                  <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDark ? "bg-brand-yellow" : "bg-brand-gold"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDark ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span
                    className={
                      isDark ? `font-bold ${headingClasses}` : "text-gray-400"
                    }
                  >
                    Dark
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={`text-xl font-bold ${headingClasses}`}>
                System Status
              </h3>
              <div
                className={`p-3 space-y-3 rounded-lg ${
                  isDark ? "bg-gray-700/50" : "bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p>Database Connection</p>
                  {systemStatus.db === "checking" ? (
                    <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p>API Services</p>
                  {systemStatus.api === "checking" ? (
                    <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={`text-xl font-bold ${headingClasses}`}>
                Security
              </h3>
              <button
                onClick={handlePasswordReset}
                className="w-full py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500"
              >
                Send Password Reset Email
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/10"
            >
              <h2 className="text-2xl font-bold text-red-400">
                Are you absolutely sure?
              </h2>
              <p className="text-gray-300 mt-2">
                To confirm, please type{" "}
                <strong className="text-red-400">DELETE</strong> in the box
                below.
              </p>

              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full bg-gray-900 border-gray-600 text-white p-2 rounded-md mt-4 focus:ring-2 focus:ring-red-500"
              />

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-2 rounded-md bg-gray-600 hover:bg-gray-500"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmationText !== "DELETE"}
                  className="w-full py-2 rounded-md bg-red-600 text-white font-semibold disabled:bg-red-800/50 disabled:cursor-not-allowed"
                >
                  Delete My Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// =================================================================================================
// --- 5. CORE ADMIN DASHBOARD COMPONENT ---
// =================================================================================================

const AdminDashboard: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "dark"
  );
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page["name"]>("Dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [authIsReady, setAuthIsReady] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [users, setUsers] = useState<AppUser[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthIsReady(true);

      if (currentUser) {
        // Check user role from Firestore
        setIsCheckingRole(true);
        try {
          const userDoc = await getDocs(
            query(
              collection(db, "users"),
              where("email", "==", currentUser.email)
            )
          );

          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            const role = userData.role || "patient";
            setUserRole(role);
            console.log("👤 User role:", role);

            if (role !== "admin") {
              console.warn(
                "⚠️ Non-admin user attempted to access admin dashboard"
              );
              setLoginError("Access denied. Admin privileges required.");
              await signOut(auth);
            }
          } else {
            console.warn("⚠️ User not found in Firestore");
            setLoginError("User account not properly configured.");
            await signOut(auth);
          }
        } catch (error) {
          console.error("❌ Error checking user role:", error);
          setLoginError("Error verifying user permissions.");
        } finally {
          setIsCheckingRole(false);
        }
      } else {
        setUserRole(null);
        setIsCheckingRole(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      console.log("🔄 Fetching data from Firestore...");
      console.log("📊 Database reference:", db);
      console.log("📊 Project ID:", db.app.options.projectId);
      console.log("📊 Auth Domain:", db.app.options.authDomain);

      const usersSnapshot = await getDocs(collection(db, "users"));
      console.log("📦 Raw snapshot size:", usersSnapshot.size);
      console.log("📦 Documents in snapshot:", usersSnapshot.docs.length);

      const usersData = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("👤 User doc:", doc.id, data);
        return { id: doc.id, ...data } as AppUser;
      });
      console.log("✅ Users fetched:", usersData.length, "users");
      console.log("✅ Full users array:", usersData);

      const appointmentsSnapshot = await getDocs(
        collection(db, "appointments")
      );
      const appointmentsData = appointmentsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Appointment)
      );
      console.log(
        "✅ Appointments fetched:",
        appointmentsData.length,
        "appointments",
        appointmentsData
      );
      setAppointments(appointmentsData);

      // Extract unique users from appointments that might not be in users collection
      const appointmentUsers = new Map<string, AppUser>();
      appointmentsData.forEach((apt) => {
        if (
          apt.userEmail &&
          !usersData.find((u) => u.email === apt.userEmail)
        ) {
          appointmentUsers.set(apt.userEmail, {
            id: apt.userEmail.replace(/[@.]/g, "_"),
            email: apt.userEmail,
            displayName: apt.userName || apt.userEmail.split("@")[0],
            role: "patient",
            isActive: true,
          } as AppUser);
        }
      });

      // Merge Firestore users with users from appointments
      const allUsers = [...usersData, ...Array.from(appointmentUsers.values())];
      console.log(
        "✅ Total users (including from appointments):",
        allUsers.length,
        "users"
      );
      setUsers(allUsers);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  // Listen to unread chats for notification count
  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("unreadByAdmin", "==", true)
    );
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.error("Error listening to chats:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = () => {
    setCurrentPage("Chat Management");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoginError(
        error.code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : "Login failed."
      );
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const pages: Page[] = [
    { name: "Dashboard", icon: "M3 10h18M3 6h18M3 14h18M3 18h18" },
    {
      name: "User Management",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      name: "Appointment Management",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Invoices",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      name: "Chat Management",
      icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    },
    {
      name: "User Sync",
      icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    },
    {
      name: "Data Migration",
      icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
    },
    {
      name: "Settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
  ];

  const renderPage = () => {
    if (isLoadingData) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-yellow mx-auto mb-4"></div>
            <p className="text-gray-400 text-xl animate-pulse">
              Loading Clinic Data...
            </p>
          </div>
        </div>
      );
    }
    switch (currentPage) {
      case "Dashboard":
        return (
          <DashboardView
            appointments={appointments}
            users={users}
            theme={theme}
          />
        );
      case "User Management":
        return <UserManagementView users={users} theme={theme} />;
      case "Appointment Management":
        return <EnhancedAppointmentManagement theme={theme} />;
      case "Invoices":
        return <InvoicesManagement theme={theme} users={users} />;
      case "Chat Management":
        return <EnhancedChatManagement theme={theme} />;
      case "User Sync":
        return (
          <UserSyncView theme={theme} onSyncComplete={() => fetchData()} />
        );
      case "Data Migration":
        return <AppointmentDataMigration theme={theme} />;
      case "Settings":
        return <SettingsView user={user} theme={theme} setTheme={setTheme} />;
      default:
        return (
          <div className="text-center text-red-500">Error: Page not found.</div>
        );
    }
  };

  if (!isAppReady) return <CreativePreloader />;

  if (!authIsReady || isCheckingRole)
    return (
      <div className="bg-gray-900 h-screen flex items-center justify-center text-white text-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-yellow mx-auto mb-4"></div>
          <p className="animate-pulse">
            {!authIsReady ? "Initializing..." : "Verifying access..."}
          </p>
        </div>
      </div>
    );

  if (!user)
    return (
      <LoginPage
        handleLogin={handleLogin}
        setEmail={setEmail}
        setPassword={setPassword}
        loginError={loginError}
      />
    );

  // Block non-admin users
  if (userRole !== "admin")
    return (
      <div className="bg-gray-900 h-screen flex items-center justify-center text-white">
        <div className="text-center max-w-md p-8 bg-gray-800 rounded-xl shadow-2xl">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-red-400 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-300 mb-6">
            You do not have administrator privileges to access this dashboard.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Role:{" "}
            <span className="text-yellow-400">{userRole || "Unknown"}</span>
          </p>
          <button
            onClick={async () => {
              await signOut(auth);
              setLoginError("");
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );

  return (
    <Layout
      pages={pages}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      handleLogout={handleLogout}
      userEmail={user?.displayName || user?.email}
      theme={theme}
      unreadNotifications={unreadCount}
      onNotificationClick={handleNotificationClick}
    >
      {renderPage()}
    </Layout>
  );
};

export default AdminDashboard;
