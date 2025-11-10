// src/AdminDashboard.REFACTORED.tsx
// This is a refactored version showing the new structure
// TODO: Replace the old AdminDashboard.tsx with this file

import React, { useState } from "react";
import { Layout } from "./Layout";
import { useAuth } from "./hooks/useAuth";
// import { useFirestoreData } from "./hooks/useFirestoreData";
import { NAVIGATION_PAGES } from "./constants/navigation";
import Preloader from "./components/common/Preloader";
import LoginPage from "./components/auth/LoginPage";
import EnhancedAppointmentManagement from "./components/EnhancedAppointmentManagement";
import { ChatManagement } from "./components/chat/ChatManagement";
import type { Theme, Page } from "./types";

// Import view components (these need to be created)
// import DashboardView from "./pages/DashboardPage";
// import UserManagementView from "./pages/UserManagementPage";
// import SettingsView from "./pages/SettingsPage";

// Chart.js registration
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page["name"]>("Dashboard");
  const [theme] = useState<Theme>("dark");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Use custom hooks for auth and data
  const {
    user,
    loading: authLoading,
    loginError,
    handleLogin,
    handleLogout,
  } = useAuth();
  // Uncomment when needed for dashboard views
  // const { users, appointments, loading: dataLoading } = useFirestoreData();

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await handleLogin(email, password);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Show preloader while checking auth
  if (authLoading) {
    return <Preloader />;
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <LoginPage
        handleLogin={handleLoginSubmit}
        setEmail={setEmail}
        setPassword={setPassword}
        loginError={loginError}
      />
    );
  }

  // Main dashboard content
  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        // return <DashboardView users={users} appointments={appointments} theme={theme} />;
        return <div>Dashboard View (To be created)</div>;

      case "User Management":
        // return <UserManagementView users={users} theme={theme} />;
        return <div>User Management View (To be created)</div>;

      case "Appointment Management":
        return <EnhancedAppointmentManagement theme={theme} />;

      case "Chat Management":
        return <ChatManagement theme={theme} user={user} />;

      case "Settings":
        // return <SettingsView user={user} theme={theme} />;
        return <div>Settings View (To be created)</div>;

      default:
        return <div>Select a page from the sidebar</div>;
    }
  };

  return (
    <Layout
      pages={NAVIGATION_PAGES}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      handleLogout={handleLogout}
      userEmail={user?.email}
      theme={theme}
    >
      {renderPage()}
    </Layout>
  );
};

export default AdminDashboard;
