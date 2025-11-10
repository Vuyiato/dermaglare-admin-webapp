// src/types/index.ts

export type Theme = "light" | "dark";

export interface Page {
  name:
    | "Dashboard"
    | "User Management"
    | "Appointment Management"
    | "Invoices"
    | "Chat Management"
    | "Schedule Management"
    | "Services"
    | "Chatbot Knowledge"
    | "Settings";
  icon: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  appointmentId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AppUser {
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
  phoneNumber?: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  date: string;
  time: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  serviceType?: string;
  notes?: string;
  createdAt?: any;
}

export interface ChatThread {
  id: string;
  userName: string;
  userEmail: string;
  userId: string;
  lastMessageAt: any;
  createdAt: any;
  status: "active" | "archived";
  unreadCountStaff: number;
  unreadCountPatient: number;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderType: "patient" | "staff";
  timestamp: any;
  read: boolean;
}
