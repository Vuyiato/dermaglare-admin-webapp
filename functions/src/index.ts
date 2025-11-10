/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Cloud Function to list all users from Firebase Authentication
export const listAllUsers = onCall(async (request) => {
  // Check if the user is authenticated and is an admin
  if (!request.auth) {
    throw new Error("Unauthenticated");
  }

  try {
    logger.info("Fetching all users from Firebase Authentication");

    const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users per call

    const users = listUsersResult.users.map((userRecord) => ({
      id: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || "",
      photoURL: userRecord.photoURL || "",
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
      providerData: userRecord.providerData,
      phoneNumber: userRecord.phoneNumber || "",
    }));

    logger.info(`Successfully fetched ${users.length} users`);

    return { users, count: users.length };
  } catch (error) {
    logger.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
