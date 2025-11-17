// src/components/auth/LoginPage.tsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import dermaglareLogo from "../../assets/dermaglare-logo.png";

interface LoginPageProps {
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  loginError: string;
}

const LoginPage: React.FC<LoginPageProps> = ({
  handleLogin,
  setEmail,
  setPassword,
  loginError,
}) => {
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
            {[
              "Real-time Appointment Management",
              "Patient Communication Hub",
              "Advanced Analytics Dashboard",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-white/90"
              >
                <svg
                  className="w-5 h-5 text-brand-yellow flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
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
                <span className="text-brand-yellow text-sm font-medium">
                  Contact tech support
                </span>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
