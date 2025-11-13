// Quick Firestore Connection Test
// Add this button temporarily to your Chat Management page to test connection

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Test Function 1: Check if Firestore is connected
export async function testFirestoreConnection() {
  console.log("🧪 Testing Firestore connection...");

  try {
    const testRef = collection(db, "chats");
    console.log("✅ Firestore reference created successfully");
    return true;
  } catch (error) {
    console.error("❌ Firestore connection failed:", error);
    return false;
  }
}

// Test Function 2: Try to read chats
export async function testReadChats() {
  console.log("🧪 Testing read access to chats collection...");

  try {
    const chatsRef = collection(db, "chats");
    const snapshot = await getDocs(chatsRef);

    console.log(`✅ Successfully read chats collection`);
    console.log(`📊 Found ${snapshot.size} chats`);

    if (snapshot.empty) {
      console.log("⚠️ Collection is empty - no chats exist yet");
      console.log("💡 Create test data using createTestChat() function");
    } else {
      snapshot.forEach((doc) => {
        console.log(`📄 Chat ${doc.id}:`, doc.data());
      });
    }

    return snapshot.size;
  } catch (error: any) {
    console.error("❌ Failed to read chats:", error);

    if (error.code === "permission-denied") {
      console.log("🔒 Permission denied - check Firestore rules");
    } else if (error.code === "failed-precondition") {
      console.log("📇 Index required - check console for link");
    }

    return 0;
  }
}

// Test Function 3: Create test chat
export async function createTestChat() {
  console.log("🧪 Creating test chat...");

  try {
    // Create a test chat document
    const chatRef = collection(db, "chats");
    const testChat = {
      patientId: "test-patient-" + Date.now(),
      patientName: "Test Patient",
      lastMessageText:
        "This is a test message created at " + new Date().toLocaleTimeString(),
      lastMessageTimestamp: serverTimestamp(),
      unreadByPatient: 0,
      unreadByAdmin: true,
    };

    const docRef = await addDoc(chatRef, testChat);
    console.log("✅ Test chat created with ID:", docRef.id);

    // Create a test message in the subcollection
    const messagesRef = collection(db, "chats", docRef.id, "messages");
    const testMessage = {
      senderId: "test-patient-" + Date.now(),
      senderRole: "patient",
      senderName: "Test Patient",
      text:
        "Hello! This is an automated test message created at " +
        new Date().toLocaleString(),
      timestamp: serverTimestamp(),
      read: false,
    };

    const msgRef = await addDoc(messagesRef, testMessage);
    console.log("✅ Test message created with ID:", msgRef.id);

    console.log("🎉 Test data created successfully!");
    console.log("🔄 Refresh the page to see the new chat");

    return docRef.id;
  } catch (error: any) {
    console.error("❌ Failed to create test chat:", error);

    if (error.code === "permission-denied") {
      console.log("🔒 Permission denied - check Firestore rules");
      console.log(
        "Rules should allow: allow read, write: if request.auth != null;"
      );
    }

    return null;
  }
}

// Run all tests
export async function runAllTests() {
  console.log("🚀 Running all Firestore tests...\n");

  // Test 1: Connection
  const connected = await testFirestoreConnection();
  if (!connected) {
    console.log("❌ Cannot proceed - Firestore not connected");
    return;
  }

  // Test 2: Read chats
  const chatCount = await testReadChats();

  // Test 3: Create test data if no chats exist
  if (chatCount === 0) {
    console.log("\n💡 No chats found. Creating test data...");
    await createTestChat();
  }

  console.log("\n✅ All tests complete!");
  console.log("📝 Check the results above for any errors");
}

// Usage: Open browser console and run:
// import { runAllTests } from './testFirestore';
// runAllTests();
