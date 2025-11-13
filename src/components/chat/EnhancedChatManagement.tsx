// src/components/chat/EnhancedChatManagement.tsx
// Fully compatible with Patient Portal messaging system

import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// =================================================================================================
// TYPES - Matching DATABASE_STRUCTURE.md
// =================================================================================================

type Theme = "light" | "dark";

interface Chat {
  id: string; // Chat document ID
  patientId: string; // Firebase Auth UID
  patientName: string;
  lastMessageText: string;
  lastMessageTimestamp: Timestamp;
  unreadByPatient: number;
  unreadByAdmin: boolean;
}

interface Message {
  id: string;
  senderId: string; // "patient UID", "admin", or "doctor"
  senderRole: "patient" | "admin" | "doctor";
  senderName: string; // e.g., "Dr. Jabu Nkehli", "Support Team"
  text: string;
  timestamp: Timestamp;
  read: boolean;
}

// =================================================================================================
// MAIN COMPONENT
// =================================================================================================

interface EnhancedChatManagementProps {
  theme: Theme;
}

export const EnhancedChatManagement: React.FC<EnhancedChatManagementProps> = ({
  theme,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [senderRole, setSenderRole] = useState<"admin" | "doctor">("admin");
  const [senderName, setSenderName] = useState("Support Team");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";
  const cardClasses = isDark
    ? "bg-white/5 border-white/10 shadow-premium"
    : "bg-white shadow-premium border border-brand-teal/10";
  const headingClasses = isDark
    ? "text-brand-yellow bg-gradient-to-r from-brand-yellow to-brand-yellow-light bg-clip-text text-transparent"
    : "text-brand-teal bg-gradient-to-r from-brand-teal to-brand-teal-light bg-clip-text text-transparent";
  const inputClasses = isDark
    ? "bg-gray-900 border-gray-700 text-white focus:border-brand-yellow focus:ring-brand-yellow/50"
    : "bg-gray-50 border-brand-teal/20 text-gray-800 focus:border-brand-teal focus:ring-brand-teal/50";
  const textMuted = isDark ? "text-gray-400" : "text-gray-600";
  const textPrimary = isDark ? "text-white" : "text-gray-900";

  // =================================================================================================
  // FETCH CHATS (Real-time listener)
  // =================================================================================================

  useEffect(() => {
    console.log("🔄 Setting up chats listener...");
    console.log("📡 Connecting to Firebase Firestore...");
    console.log(
      "🗄️ Database instance:",
      db ? "✅ Connected" : "❌ Not connected"
    );

    // Try with orderBy first, fall back to simple query if index doesn't exist
    const chatsRef = collection(db, "chats");

    // First, try with orderBy (requires Firestore index)
    let chatsQuery;
    try {
      chatsQuery = query(chatsRef, orderBy("lastMessageTimestamp", "desc"));
      console.log("✅ Using ordered query (with index)");
    } catch (error) {
      console.warn("⚠️ OrderBy index may not exist, using simple query");
      chatsQuery = chatsRef;
    }

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        console.log("📥 Chats snapshot received:", snapshot.size, "chats");

        if (snapshot.empty) {
          console.log("⚠️ No chats found in Firestore");
          console.log("💡 To see messages:");
          console.log("  1. Open Patient Portal");
          console.log("  2. Login as a patient");
          console.log("  3. Send a test message");
          console.log("  4. Refresh this page");
        }

        const chatsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("💬 Chat:", doc.id, data);
          return {
            id: doc.id,
            patientId: data.patientId || "",
            patientName: data.patientName || "Unknown Patient",
            lastMessageText: data.lastMessageText || "",
            lastMessageTimestamp: data.lastMessageTimestamp || Timestamp.now(),
            unreadByPatient: data.unreadByPatient || 0,
            unreadByAdmin: data.unreadByAdmin || false,
          } as Chat;
        });

        // Sort manually if we couldn't use orderBy
        chatsData.sort((a, b) => {
          const timeA = a.lastMessageTimestamp?.toMillis() || 0;
          const timeB = b.lastMessageTimestamp?.toMillis() || 0;
          return timeB - timeA;
        });

        console.log("✅ Chats loaded:", chatsData.length);
        setChats(chatsData);
        setIsLoadingChats(false);
      },
      (error) => {
        console.error("❌ Error fetching chats:", error);
        console.error("Error details:", error.message);

        if (error.message.includes("index")) {
          console.log("🔧 Fix: Create Firestore index");
          console.log("1. Go to Firebase Console");
          console.log("2. Firestore Database → Indexes");
          console.log("3. Create index for 'chats' collection:");
          console.log("   - Field: lastMessageTimestamp");
          console.log("   - Order: Descending");
          console.log(
            "\nOr use this link:",
            error.message.match(/https:\/\/[^\s]+/)?.[0]
          );
        }

        setIsLoadingChats(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =================================================================================================
  // FETCH MESSAGES FOR SELECTED CHAT (Real-time listener)
  // =================================================================================================

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    console.log("🔄 Setting up messages listener for chat:", selectedChatId);
    console.log("📂 Messages path:", `chats/${selectedChatId}/messages`);
    setIsLoadingMessages(true);

    const messagesQuery = query(
      collection(db, "chats", selectedChatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        console.log(
          "📥 Messages snapshot received:",
          snapshot.size,
          "messages for chat:",
          selectedChatId
        );

        if (snapshot.empty) {
          console.log("⚠️ No messages found in this chat");
        }

        const messagesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("💬 Message:", doc.id, data);
          return {
            id: doc.id,
            senderId: data.senderId || "",
            senderRole: data.senderRole || "patient",
            senderName: data.senderName || "Patient",
            text: data.text || "",
            timestamp: data.timestamp || Timestamp.now(),
            read: data.read || false,
          } as Message;
        });

        console.log("✅ Messages loaded:", messagesData.length);
        setMessages(messagesData);
        setIsLoadingMessages(false);

        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
      (error) => {
        console.error("❌ Error fetching messages:", error);
        console.error("Error details:", error.message);

        if (error.message.includes("index")) {
          console.log("🔧 Fix: Create Firestore index for messages");
          console.log("Collection group: messages");
          console.log("Field: timestamp, Order: Ascending");
        }

        setIsLoadingMessages(false);
      }
    );

    // Mark chat as read by admin
    markChatAsRead(selectedChatId);

    return () => unsubscribe();
  }, [selectedChatId]);

  // =================================================================================================
  // MARK CHAT AS READ BY ADMIN
  // =================================================================================================

  const markChatAsRead = async (chatId: string) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        unreadByAdmin: false,
      });
      console.log("✅ Chat marked as read by admin:", chatId);
    } catch (error) {
      console.error("❌ Error marking chat as read:", error);
    }
  };

  // =================================================================================================
  // SEND MESSAGE
  // =================================================================================================

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newMessage.trim() === "" || !selectedChatId) return;

    const messageData: Partial<Message> = {
      senderId: senderRole, // "admin" or "doctor"
      senderRole: senderRole,
      senderName: senderName,
      text: newMessage.trim(),
      timestamp: serverTimestamp() as any,
      read: false,
    };

    try {
      console.log("📤 Sending message:", messageData);

      // Add message to subcollection
      const messagesRef = collection(db, "chats", selectedChatId, "messages");
      await addDoc(messagesRef, messageData);

      // Update chat document with last message info
      const chatRef = doc(db, "chats", selectedChatId);
      await updateDoc(chatRef, {
        lastMessageText: newMessage.trim(),
        lastMessageTimestamp: serverTimestamp(),
        unreadByPatient:
          (chats.find((c) => c.id === selectedChatId)?.unreadByPatient || 0) +
          1,
        unreadByAdmin: false, // Admin sent the message, so they've read it
      });

      console.log("✅ Message sent successfully");
      setNewMessage("");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  // =================================================================================================
  // FILTERED CHATS
  // =================================================================================================

  const filteredChats = chats.filter(
    (chat) =>
      chat.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.lastMessageText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count unread chats
  const unreadChatsCount = chats.filter((c) => c.unreadByAdmin).length;

  // =================================================================================================
  // SELECTED CHAT INFO
  // =================================================================================================

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // =================================================================================================
  // FORMAT TIME
  // =================================================================================================

  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? "Just now" : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatMessageTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =================================================================================================
  // RENDER
  // =================================================================================================

  if (isLoadingChats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-yellow mx-auto mb-4"></div>
          <p className={`text-xl ${textMuted}`}>Loading conversations...</p>
          <p className={`text-sm ${textMuted} mt-2`}>
            Connecting to Firebase Firestore...
          </p>
          <p className={`text-xs ${textMuted} mt-1`}>
            Check browser console (F12) for details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl ${cardClasses}`}>
          <h3 className={`text-xs font-medium ${textMuted}`}>
            Total Conversations
          </h3>
          <p className={`mt-1 text-2xl font-bold ${textPrimary}`}>
            {chats.length}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${cardClasses}`}>
          <h3 className={`text-xs font-medium ${textMuted}`}>
            Unread Messages
          </h3>
          <p className={`mt-1 text-2xl font-bold text-brand-yellow`}>
            {unreadChatsCount}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${cardClasses}`}>
          <h3 className={`text-xs font-medium ${textMuted}`}>Active Sender</h3>
          <p className={`mt-1 text-lg font-bold ${textPrimary}`}>
            {senderName}
          </p>
        </div>
      </div>

      {/* MAIN CHAT INTERFACE */}
      <div
        className={`rounded-xl flex h-[70vh] ${cardClasses} overflow-hidden`}
      >
        {/* LEFT SIDEBAR - CHAT LIST */}
        <div
          className={`w-full md:w-1/3 border-r ${
            isDark ? "border-white/10" : "border-gray-200"
          } flex flex-col ${selectedChatId ? "hidden md:flex" : "flex"}`}
        >
          {/* Header */}
          <div
            className={`p-4 border-b ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}
          >
            <h2 className={`text-xl font-bold ${headingClasses} mb-3`}>
              Messages
            </h2>

            {/* Search */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg ${inputClasses} focus:outline-none focus:ring-2`}
              />
              <svg
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${textMuted}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Sender Role Selector */}
            <div className="space-y-2">
              <label className={`text-xs font-medium ${textMuted}`}>
                Reply as:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSenderRole("admin");
                    setSenderName("Support Team");
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    senderRole === "admin"
                      ? isDark
                        ? "bg-brand-yellow text-gray-900"
                        : "bg-brand-gold text-white"
                      : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    setSenderRole("doctor");
                    setSenderName("Dr. Jabu Nkehli");
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    senderRole === "doctor"
                      ? isDark
                        ? "bg-brand-yellow text-gray-900"
                        : "bg-brand-gold text-white"
                      : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Doctor
                </button>
              </div>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className={`p-8 ${textMuted}`}>
                <div className="text-center mb-6">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {searchTerm ? (
                    <>
                      <p className="text-lg font-semibold">No chats found</p>
                      <p className="text-sm mt-2">
                        Try a different search term
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold mb-2">
                        No conversations yet
                      </p>
                      <p className="text-sm">
                        Chats will appear here when patients send messages from
                        the Patient Portal
                      </p>
                    </>
                  )}
                </div>

                {!searchTerm && chats.length === 0 && (
                  <div
                    className={`mt-6 p-4 rounded-lg ${
                      isDark ? "bg-blue-500/10" : "bg-blue-50"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-2 text-blue-400">
                      💡 How to test messaging:
                    </p>
                    <ol className="text-xs space-y-1 list-decimal list-inside">
                      <li>Open the Patient Portal in another browser/tab</li>
                      <li>Login or sign up as a patient</li>
                      <li>Navigate to the Messages/Chat section</li>
                      <li>Send a test message</li>
                      <li>Return here and see it appear instantly!</li>
                    </ol>
                    <p className="text-xs mt-3 text-blue-300">
                      ℹ️ Check browser console (F12) for connection details
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {filteredChats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-4 cursor-pointer border-b transition-colors ${
                      isDark ? "border-white/10" : "border-gray-200"
                    } ${
                      selectedChatId === chat.id
                        ? isDark
                          ? "bg-brand-yellow/10"
                          : "bg-brand-gold/10"
                        : isDark
                        ? "hover:bg-white/5"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                          isDark ? "bg-brand-yellow/20" : "bg-brand-gold"
                        }`}
                      >
                        {chat.patientName.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p
                            className={`font-semibold truncate ${
                              chat.unreadByAdmin
                                ? "font-bold text-brand-yellow"
                                : textPrimary
                            }`}
                          >
                            {chat.patientName}
                          </p>
                          <span
                            className={`text-xs ${textMuted} ml-2 flex-shrink-0`}
                          >
                            {formatTime(chat.lastMessageTimestamp)}
                          </span>
                        </div>

                        <p
                          className={`text-sm ${textMuted} truncate ${
                            chat.unreadByAdmin ? "font-semibold" : ""
                          }`}
                        >
                          {chat.lastMessageText || "No messages yet"}
                        </p>

                        {chat.unreadByAdmin && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse"></div>
                            <span className="text-xs font-semibold text-brand-yellow">
                              New message
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - MESSAGES */}
        <div
          className={`flex-1 flex flex-col ${
            selectedChatId ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedChatId && selectedChat ? (
            <>
              {/* Chat Header */}
              <div
                className={`p-4 border-b ${
                  isDark ? "border-white/10" : "border-gray-200"
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setSelectedChatId(null)}
                    className={`md:hidden mr-2 ${textPrimary}`}
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      isDark ? "bg-brand-yellow/20" : "bg-brand-gold"
                    }`}
                  >
                    {selectedChat.patientName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <p className={`font-bold ${textPrimary}`}>
                      {selectedChat.patientName}
                    </p>
                    <p className={`text-sm ${textMuted}`}>
                      Patient ID: {selectedChat.patientId.substring(0, 8)}...
                    </p>
                  </div>
                </div>

                {/* Replying as badge */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    senderRole === "doctor"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  Replying as {senderName}
                </div>
              </div>

              {/* Messages Area */}
              <div
                className={`flex-1 p-4 overflow-y-auto ${
                  isDark ? "bg-gray-900/20" : "bg-gray-50/50"
                }`}
              >
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg
                        className={`mx-auto h-16 w-16 ${textMuted} mb-4`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className={textMuted}>
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isFromStaff =
                        msg.senderRole === "admin" ||
                        msg.senderRole === "doctor";
                      const isFromDoctor = msg.senderRole === "doctor";

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            isFromStaff ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md ${
                              isFromStaff ? "text-right" : "text-left"
                            }`}
                          >
                            {/* Sender name */}
                            <p
                              className={`text-xs font-semibold mb-1 ${
                                isFromDoctor
                                  ? "text-blue-400"
                                  : isFromStaff
                                  ? "text-green-400"
                                  : textMuted
                              }`}
                            >
                              {msg.senderName}
                            </p>

                            {/* Message bubble */}
                            <div
                              className={`px-4 py-3 rounded-2xl ${
                                isFromStaff
                                  ? isFromDoctor
                                    ? "bg-blue-600 text-white"
                                    : isDark
                                    ? "bg-brand-yellow text-gray-900"
                                    : "bg-brand-gold text-white"
                                  : isDark
                                  ? "bg-gray-700 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              <p className="break-words whitespace-pre-wrap">
                                {msg.text}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  isFromStaff
                                    ? isFromDoctor
                                      ? "text-blue-200"
                                      : "text-gray-700"
                                    : isDark
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatMessageTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className={`p-4 border-t ${
                  isDark ? "border-white/10" : "border-gray-200"
                }`}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Type a message as ${senderName}...`}
                    className={`flex-1 px-4 py-3 rounded-lg ${inputClasses} focus:outline-none focus:ring-2`}
                  />
                  <button
                    type="submit"
                    disabled={newMessage.trim() === ""}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      isDark
                        ? "bg-brand-yellow text-gray-900 hover:bg-brand-yellow/90"
                        : "bg-brand-gold text-white hover:bg-brand-gold/90"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className={`mx-auto h-24 w-24 ${textMuted}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className={`mt-4 text-lg font-semibold ${textPrimary}`}>
                  Select a conversation
                </p>
                <p className={`mt-2 text-sm ${textMuted}`}>
                  Choose a patient from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatManagement;
