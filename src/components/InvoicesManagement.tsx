// src/components/InvoicesManagement.tsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Invoice, AppUser } from "../types";

interface InvoicesManagementProps {
  theme: "light" | "dark";
  users: AppUser[];
}

export const InvoicesManagement: React.FC<InvoicesManagementProps> = ({
  theme,
  users,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const isDark = theme === "dark";

  // Fetch invoices from Firestore
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const invoicesSnapshot = await getDocs(collection(db, "invoices"));
      console.log(
        "📦 Raw invoices from Firestore:",
        invoicesSnapshot.docs.length
      );

      const invoicesData = invoicesSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("📋 Raw invoice data:", doc.id, data);
        console.log("  📊 Status field:", data.status);
        console.log(
          "  📅 Date fields - date:",
          data.date,
          "dueDate:",
          data.dueDate,
          "paidAt:",
          data.paidAt
        );
        console.log(
          "  💳 Stored amounts - subtotal:",
          data.subtotal,
          "tax:",
          data.tax,
          "total:",
          data.total,
          "amount:",
          data.amount
        );

        const items = data.items || [];
        console.log("  📝 Items:", items, "- Length:", items.length);

        // Check if invoice has an "amount" field (your database structure)
        const storedAmount = data.amount || 0;
        console.log("  💵 Stored amount field:", storedAmount);

        // Calculate totals from items if not present
        let calculatedSubtotal = 0;
        if (items.length > 0) {
          calculatedSubtotal = items.reduce((sum: number, item: any) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            console.log(
              `    ✏️ Item: ${item.description}, qty: ${item.quantity}, price: ${item.unitPrice}, total: ${itemTotal}`
            );
            return sum + itemTotal;
          }, 0);
        }
        console.log("  💰 Calculated subtotal:", calculatedSubtotal);

        // Use amount field if available, otherwise calculate from items or stored values
        let total, subtotal, tax;

        if (storedAmount > 0) {
          // If amount field exists, use it as total
          total = storedAmount;
          // Calculate backwards: assuming 15% tax
          subtotal = total / 1.15;
          tax = total - subtotal;
        } else {
          // Otherwise use standard calculation
          subtotal = data.subtotal || calculatedSubtotal;
          tax = data.tax || subtotal * 0.15;
          total = data.total || subtotal + tax;
        }

        console.log(
          "  💵 Final amounts - Subtotal:",
          subtotal,
          "Tax:",
          tax,
          "Total:",
          total
        );

        // Determine status if not present, and normalize to proper case
        let status: Invoice["status"] = data.status;

        // Normalize status - convert lowercase to proper case
        if (status) {
          const statusLower = status.toLowerCase();
          if (statusLower === "paid") {
            status = "Paid";
          } else if (statusLower === "pending") {
            status = "Sent"; // Map "Pending" to "Sent" or keep as is
          } else if (statusLower === "overdue") {
            status = "Overdue";
          } else if (statusLower === "draft") {
            status = "Draft";
          } else if (statusLower === "cancelled") {
            status = "Cancelled";
          }
        }

        if (!status) {
          // If paidAt exists, it's Paid
          if (data.paidAt) {
            status = "Paid";
          } else if (data.dueDate) {
            // Check if overdue
            const dueDate = new Date(data.dueDate);
            const today = new Date();
            if (dueDate < today) {
              status = "Overdue";
            } else {
              status = "Sent";
            }
          } else {
            status = "Draft";
          }
        }

        console.log("  🏷️ Determined status:", status);

        return {
          id: doc.id,
          ...data,
          items,
          subtotal,
          tax,
          total,
          status,
        } as Invoice;
      });

      console.log("✅ Invoices loaded:", invoicesData.length);
      console.log("✅ Processed invoices:", invoicesData);

      setInvoices(invoicesData);
    } catch (error) {
      console.error("❌ Error fetching invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `INV-${year}${month}-${random}`;
  };

  const handleCreateInvoice = async () => {
    setIsCreating(true);
    try {
      const newInvoice: Omit<Invoice, "id"> = {
        invoiceNumber: generateInvoiceNumber(),
        patientId: users[0]?.id || "",
        patientName: users[0]?.displayName || "Unknown Patient",
        patientEmail: users[0]?.email || "",
        items: [
          {
            id: "1",
            description: "Consultation Fee",
            quantity: 1,
            unitPrice: 500,
            total: 500,
          },
        ],
        subtotal: 500,
        tax: 75,
        total: 575,
        status: "Draft",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        createdAt: Timestamp.now(),
      };

      console.log("Creating invoice:", newInvoice);
      const docRef = await addDoc(collection(db, "invoices"), newInvoice);
      console.log("Invoice created with ID:", docRef.id);

      setInvoices([...invoices, { id: docRef.id, ...newInvoice }]);
      setShowModal(false);
      alert("✅ Invoice created successfully!");
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      alert(`❌ Error creating invoice: ${error.message || "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };
  const handleUpdateInvoiceStatus = async (
    invoiceId: string,
    newStatus: Invoice["status"]
  ) => {
    try {
      const invoiceRef = doc(db, "invoices", invoiceId);
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };
      if (newStatus === "Paid") {
        updateData.paidDate = new Date().toISOString().split("T")[0];
      }
      await updateDoc(invoiceRef, updateData);
      setInvoices(
        invoices.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, status: newStatus, paidDate: updateData.paidDate }
            : inv
        )
      );
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?"))
      return;
    try {
      await deleteDoc(doc(db, "invoices", invoiceId));
      setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "Draft":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      case "Sent":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Paid":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Overdue":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "Cancelled":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const stats = {
    total: invoices.length,
    draft: invoices.filter((inv) => inv.status === "Draft").length,
    sent: invoices.filter((inv) => inv.status === "Sent").length,
    paid: invoices.filter((inv) => inv.status === "Paid").length,
    overdue: invoices.filter((inv) => inv.status === "Overdue").length,
    totalRevenue: invoices
      .filter((inv) => inv.status === "Paid")
      .reduce((sum, inv) => sum + (inv.total || 0), 0),
  };

  console.log("📊 Stats calculation:", {
    totalInvoices: invoices.length,
    invoiceStatuses: invoices.map((inv) => ({
      id: inv.id,
      status: inv.status,
      total: inv.total,
    })),
    stats,
  });

  return (
    <div
      className={`min-h-screen p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1
          className={`text-4xl font-bold mb-2 bg-gradient-to-r ${
            isDark
              ? "from-brand-yellow via-brand-yellow-light to-brand-yellow-dark"
              : "from-brand-teal via-brand-teal-light to-brand-teal-dark"
          } bg-clip-text text-transparent`}
        >
          Invoice Management
        </h1>
        <p className={`text-lg ${isDark ? "text-white/60" : "text-gray-600"}`}>
          Create, manage, and track all patient invoices
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {[
          {
            label: "Total Invoices",
            value: stats.total,
            iconPath:
              "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            color: "blue",
          },
          {
            label: "Draft",
            value: stats.draft,
            iconPath:
              "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
            color: "gray",
          },
          {
            label: "Sent",
            value: stats.sent,
            iconPath: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
            color: "blue",
          },
          {
            label: "Paid",
            value: stats.paid,
            iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "green",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            iconPath:
              "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
            color: "red",
          },
          {
            label: "Total Revenue",
            value: `R${stats.totalRevenue.toFixed(2)}`,
            iconPath:
              "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
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

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl mb-6 backdrop-blur-md border ${
          isDark ? "bg-gray-800/50 border-white/10" : "bg-white border-gray-200"
        } shadow-lg`}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by invoice number, patient name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                isDark
                  ? "bg-gray-900/50 border-white/10 text-white placeholder-white/40"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-brand-yellow/50`}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-3 rounded-lg border ${
                isDark
                  ? "bg-gray-900/50 border-white/10 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-brand-yellow/50`}
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className={`px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                isDark
                  ? "bg-gradient-to-r from-brand-yellow to-brand-yellow-dark text-gray-900"
                  : "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white"
              }`}
            >
              + Create Invoice
            </button>
          </div>
        </div>
      </motion.div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl border backdrop-blur-md overflow-hidden shadow-2xl ${
          isDark ? "bg-gray-800/50 border-white/10" : "bg-white border-gray-200"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center p-12">
            <p
              className={`text-xl ${
                isDark ? "text-white/60" : "text-gray-600"
              }`}
            >
              No invoices found. Create your first invoice to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? "bg-gray-900/50" : "bg-gray-100"}`}>
                <tr>
                  <th
                    className={`px-6 py-4 text-left text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Invoice #
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Patient
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Issue Date
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Due Date
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Amount
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, idx) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`border-t ${
                      isDark
                        ? "border-white/10 hover:bg-gray-700/30"
                        : "border-gray-200 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td
                      className={`px-6 py-4 ${
                        isDark ? "text-white" : "text-gray-900"
                      } font-mono text-sm`}
                    >
                      {invoice.invoiceNumber}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{invoice.patientName}</div>
                        <div
                          className={`text-sm ${
                            isDark ? "text-white/60" : "text-gray-600"
                          }`}
                        >
                          {invoice.patientEmail}
                        </div>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        isDark ? "text-white/80" : "text-gray-700"
                      } text-sm`}
                    >
                      {invoice.issueDate}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        isDark ? "text-white/80" : "text-gray-700"
                      } text-sm`}
                    >
                      {invoice.dueDate}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        isDark ? "text-white" : "text-gray-900"
                      } font-semibold`}
                    >
                      R{(invoice.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {invoice.status === "Draft" && (
                          <button
                            onClick={() =>
                              handleUpdateInvoiceStatus(invoice.id, "Sent")
                            }
                            className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                          >
                            Send
                          </button>
                        )}
                        {invoice.status === "Sent" && (
                          <button
                            onClick={() =>
                              handleUpdateInvoiceStatus(invoice.id, "Paid")
                            }
                            className="px-3 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="px-3 py-1 text-xs rounded bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-md w-full rounded-2xl p-8 shadow-2xl ${
                isDark ? "bg-gray-800 border border-white/10" : "bg-white"
              }`}
            >
              <h2
                className={`text-2xl font-bold mb-6 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Create New Invoice
              </h2>
              <p
                className={`mb-6 ${isDark ? "text-white/70" : "text-gray-600"}`}
              >
                A new invoice will be created as a draft. You can edit the
                details and send it to the patient later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateInvoice}
                  disabled={isCreating}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-brand-yellow to-brand-yellow-dark text-gray-900 hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isCreating ? "Creating..." : "Create Invoice"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isCreating}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold ${
                    isDark
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoicesManagement;
