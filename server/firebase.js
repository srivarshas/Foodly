const admin = require("firebase-admin");

if (!admin.apps.length) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // RENDER CASE: Parse the string from your Environment Variables
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // LOCAL CASE: Use your local file if it exists
    try {
      serviceAccount = require("./serviceAccountKey.json");
    } catch (e) {
      console.error("Missing FIREBASE_SERVICE_ACCOUNT env or serviceAccountKey.json file");
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

// Just do this once
const db = admin.firestore();
module.exports = db;