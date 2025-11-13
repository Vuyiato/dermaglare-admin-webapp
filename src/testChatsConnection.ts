// Test script to check Firestore chats collection
// Run this in browser console or create a test page

import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

async function testChatsConnection() {
  console.log("🔍 Testing Firestore connection...");

  try {
    // Test 1: Check if we can connect to Firestore
    console.log("📡 Checking Firestore connection...");
    const chatsRef = collection(db, "chats");

    // Test 2: Get all chats
    console.log("📥 Fetching chats collection...");
    const chatsSnapshot = await getDocs(chatsRef);

    console.log("✅ Chats found:", chatsSnapshot.size);

    if (chatsSnapshot.size === 0) {
      console.log(
        "⚠️ No chats in the database. This is normal if no patients have sent messages yet."
      );
      console.log("📝 To create test data:");
      console.log("1. Open Patient Portal");
      console.log("2. Login as a patient");
      console.log("3. Send a test message");
      console.log("4. Check Admin Portal again");
    } else {
      console.log("📋 Chat documents:");
      chatsSnapshot.forEach((doc) => {
        console.log(`  Chat ID: ${doc.id}`);
        console.log(`  Data:`, doc.data());
      });
    }

    // Test 3: Check messages in first chat (if any)
    if (chatsSnapshot.size > 0) {
      const firstChatId = chatsSnapshot.docs[0].id;
      console.log(`\n🔍 Checking messages in chat: ${firstChatId}`);

      const messagesRef = collection(db, "chats", firstChatId, "messages");
      const messagesSnapshot = await getDocs(messagesRef);

      console.log(`✅ Messages found: ${messagesSnapshot.size}`);
      messagesSnapshot.forEach((doc) => {
        console.log(`  Message ID: ${doc.id}`);
        console.log(`  Data:`, doc.data());
      });
    }
  } catch (error) {
    console.error("❌ Error testing Firestore:", error);
    console.log("🔧 Possible issues:");
    console.log("1. Check Firebase config in firebase.ts");
    console.log("2. Check Firestore rules");
    console.log("3. Make sure you're logged in to Firebase");
  }
}

// Run the test
testChatsConnection();

export default testChatsConnection;
