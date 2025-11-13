// src/Layout.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dermaglareLogo from "./assets/dermaglare-logo.png";

// Define the types for the props
interface Page {
  name: string;
  icon: string;
}

interface LayoutProps {
  pages: Page[];
  currentPage: string;
  setCurrentPage: (page: any) => void;
  handleLogout: () => void;
  userEmail: string | null | undefined;
  children: React.ReactNode;
  theme: "light" | "dark";
  unreadNotifications?: number;
  onNotificationClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  pages,
  currentPage,
  setCurrentPage,
  handleLogout,
  userEmail,
  children,
  theme,
  unreadNotifications = 0,
  onNotificationClick,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isDark = theme === "dark";

  // Premium gradient backgrounds
  const layoutClasses = isDark
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
    : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800";

  // Stunning sidebar with brand colors
  const sidebarClasses = isDark
    ? "bg-gradient-to-b from-brand-teal via-brand-teal-dark to-gray-900 shadow-2xl"
    : "bg-white shadow-premium border-r-2 border-brand-yellow/20";

  const navButtonClasses = (isActive: boolean) => {
    if (isActive) {
      return isDark
        ? "bg-gradient-to-r from-brand-yellow to-brand-yellow-dark text-gray-900 font-bold shadow-glow-yellow transform scale-105"
        : "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-glow-teal";
    }
    return isDark
      ? "text-white/80 hover:bg-white/10 hover:text-brand-yellow hover:shadow-lg"
      : "text-gray-600 hover:bg-brand-yellow/10 hover:text-brand-teal hover:shadow-md";
  };

  const mainContentClasses = isDark
    ? "bg-gray-900/50"
    : "bg-gradient-to-br from-gray-50/50 to-white";

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${layoutClasses}`}>
      {/* --- PREMIUM SIDEBAR --- */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className={`flex-shrink-0 flex flex-col relative ${sidebarClasses} custom-scrollbar`}
        style={{ transition: "width 0.3s ease-in-out" }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-brand-yellow rounded-full blur-3xl animate-pulse-slow"></div>
          <div
            className="absolute bottom-20 right-10 w-40 h-40 bg-brand-yellow-light rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        {/* Logo Section - Improved Spacing */}
        <div
          className={`${
            isSidebarCollapsed ? "h-24" : "h-28"
          } flex items-center justify-center px-4 relative ${
            isDark
              ? "border-b border-white/10"
              : "border-b border-brand-teal/10"
          }`}
        >
          <AnimatePresence mode="wait">
            {isSidebarCollapsed ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <img
                  src={dermaglareLogo}
                  alt="Dermaglare"
                  className="h-12 w-auto object-contain drop-shadow-lg"
                />
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center w-full px-2 space-y-2"
              >
                <img
                  src={dermaglareLogo}
                  alt="Dermaglare"
                  className="h-14 w-auto object-contain drop-shadow-2xl"
                />
                <div className="text-center space-y-0.5 w-full">
                  <h1
                    className={`text-base font-bold tracking-wide leading-tight ${
                      isDark ? "text-brand-yellow" : "text-brand-teal"
                    }`}
                  >
                    Admin Portal
                  </h1>
                  <p
                    className={`text-[10px] font-medium uppercase tracking-wider ${
                      isDark ? "text-white/70" : "text-gray-600"
                    }`}
                  >
                    Management System
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`absolute -right-3 top-28 w-6 h-6 rounded-full ${
            isDark
              ? "bg-brand-yellow text-gray-900"
              : "bg-brand-teal text-white"
          } shadow-lg flex items-center justify-center hover:scale-110 transform transition-all z-10`}
        >
          <svg
            className={`w-4 h-4 transform ${
              isSidebarCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar relative">
          {pages.map((page, index) => (
            <motion.button
              key={page.name}
              onClick={() => setCurrentPage(page.name)}
              className={`flex items-center w-full px-4 py-3.5 text-left rounded-xl transition-all duration-300 ${navButtonClasses(
                currentPage === page.name
              )} btn-premium group relative overflow-hidden`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.svg
                className={`${
                  isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3"
                } flex-shrink-0 ${
                  currentPage === page.name ? "animate-pulse" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={page.icon}
                />
              </motion.svg>
              {!isSidebarCollapsed && (
                <span className="font-medium truncate">{page.name}</span>
              )}

              {/* Active indicator */}
              {currentPage === page.name && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute right-0 top-0 bottom-0 w-1 ${
                    isDark ? "bg-gray-900" : "bg-white"
                  } rounded-l-full`}
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* User Profile Section */}
        <div
          className={`px-4 py-4 relative ${
            isDark
              ? "border-t border-white/10"
              : "border-t border-brand-teal/10"
          }`}
        >
          {!isSidebarCollapsed ? (
            <>
              <motion.div
                className={`mb-4 p-4 rounded-xl ${
                  isDark ? "bg-white/5" : "bg-brand-yellow/10"
                } backdrop-blur-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-full ${
                      isDark ? "bg-brand-yellow" : "bg-brand-teal"
                    } flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                  >
                    {userEmail?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs ${
                        isDark ? "text-white/60" : "text-gray-500"
                      } mb-1`}
                    >
                      Signed in as
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.button
                onClick={handleLogout}
                className={`w-full flex items-center justify-center ${
                  isDark
                    ? "bg-gradient-to-r from-red-600 to-red-700"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                } text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all btn-premium group`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg
                  className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center ${
                isDark ? "bg-red-600" : "bg-red-500"
              } text-white font-bold p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              title="Logout"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </motion.button>
          )}
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className={`flex-1 flex flex-col overflow-hidden`}>
        {/* Top Header Bar */}
        <motion.header
          className={`h-16 px-8 flex items-center justify-between ${
            isDark
              ? "bg-gray-900/80 border-b border-white/10"
              : "bg-white/80 border-b border-gray-200"
          } backdrop-blur-md shadow-md z-10`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-4">
            <motion.h1
              className={`text-2xl font-bold bg-gradient-to-r ${
                isDark
                  ? "from-brand-yellow via-brand-yellow-light to-brand-yellow"
                  : "from-brand-teal via-brand-teal-light to-brand-teal"
              } bg-clip-text text-transparent`}
              animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              {currentPage}
            </motion.h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Actions */}
            <motion.div
              className="flex items-center gap-2 relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.button
                onClick={
                  onNotificationClick ||
                  (() => setShowNotifications(!showNotifications))
                }
                className={`p-2 rounded-lg ${
                  isDark ? "hover:bg-white/10" : "hover:bg-brand-yellow/10"
                } transition-colors relative`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Notifications"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute top-full right-0 mt-2 w-80 rounded-xl shadow-2xl overflow-hidden z-50 ${
                      isDark
                        ? "bg-gray-800 border border-white/10"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div
                      className={`p-4 ${
                        isDark ? "bg-gray-900/50" : "bg-brand-yellow/10"
                      } border-b ${
                        isDark ? "border-white/10" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Notifications</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isDark
                              ? "bg-brand-yellow/20 text-brand-yellow"
                              : "bg-brand-teal/20 text-brand-teal"
                          }`}
                        >
                          {unreadNotifications} new
                        </span>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {unreadNotifications > 0 ? (
                        <>
                          <button
                            onClick={() => setCurrentPage("Chat Management")}
                            className={`w-full p-4 text-left ${
                              isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                            } border-b ${
                              isDark ? "border-white/5" : "border-gray-100"
                            } transition-colors`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-5 h-5 text-blue-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm">
                                  New Messages
                                </p>
                                <p
                                  className={`text-xs ${
                                    isDark ? "text-gray-400" : "text-gray-500"
                                  } mt-1`}
                                >
                                  You have unread messages from patients
                                </p>
                                <p className="text-xs text-blue-500 mt-1">
                                  Click to view →
                                </p>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() =>
                              setCurrentPage("Appointment Management")
                            }
                            className={`w-full p-4 text-left ${
                              isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                            } transition-colors`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-5 h-5 text-yellow-500"
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
                              <div className="flex-1">
                                <p className="font-semibold text-sm">
                                  Pending Appointments
                                </p>
                                <p
                                  className={`text-xs ${
                                    isDark ? "text-gray-400" : "text-gray-500"
                                  } mt-1`}
                                >
                                  New appointments waiting for approval
                                </p>
                                <p className="text-xs text-yellow-500 mt-1">
                                  Click to review →
                                </p>
                              </div>
                            </div>
                          </button>
                        </>
                      ) : (
                        <div className="p-8 text-center">
                          <svg
                            className={`w-12 h-12 mx-auto mb-3 ${
                              isDark ? "text-gray-600" : "text-gray-400"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p
                            className={`text-sm font-semibold ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            All caught up!
                          </p>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-400"
                            } mt-1`}
                          >
                            No new notifications
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.header>

        {/* Scrollable Content Area */}
        <div
          className={`flex-1 overflow-y-auto p-8 ${mainContentClasses} custom-scrollbar`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
