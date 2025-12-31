require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin"); // NEEDED FOR INCREMENT
const db = require("./firebase"); 
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // or your service account
    });
}

// Basic CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// --- HELPERS ---

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map();

function checkRateLimit(key, maxRequests = 3, windowMs = 15 * 60 * 1000) { // 3 requests per 15 minutes
  const now = Date.now();
  const userRequests = rateLimitMap.get(key) || [];

  // Filter out old requests outside the window
  const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  return true;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP email with retry mechanism
async function sendOTPEmail(email, otp, maxRetries = 3) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Invalid email format:', email);
    return false;
  }

  // Validate OTP format
  if (!otp || !/^\d{6}$/.test(otp)) {
    console.error('Invalid OTP format:', otp);
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || 'foodly-delivery@foodly.com',
    to: email,
    subject: '🔐 Your Foodly Order Pickup OTP - Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Foodly OTP</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ff4545 0%, #ff9c73 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🍕 Foodly</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Order Pickup Verification</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px;">Your Delivery Agent is Here! 🚴‍♂️</h2>
            <p style="color: #6b7280; margin: 0 0 20px 0; line-height: 1.6;">
              Great news! Your delivery agent has arrived at the pickup location and is ready to collect your order.
            </p>

            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 30px 20px; text-align: center; margin: 20px 0;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                Your Verification Code
              </div>
              <div style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 4px; margin: 10px 0;">${otp}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                ⚡ Valid for 10 minutes
              </div>
            </div>

            <!-- Instructions -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
                📞 <strong>Important:</strong> Please share this 6-digit code with your delivery agent to confirm pickup.
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center; line-height: 1.5;">
                This is an automated message from Foodly.<br>
                If you didn't request this pickup, please ignore this email.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${email} (attempt ${attempt})`);
      return true;
    } catch (error) {
      console.error(`❌ Email sending failed (attempt ${attempt}/${maxRetries}):`, error.message);

      if (attempt === maxRetries) {
        console.error('❌ All email retry attempts failed');
        return false;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
}


// --- ROUTES ---

// 1. GET Wallet Balance
app.get("/wallet/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Use doc(String(userId)) to ensure the ID is a string
    const doc = await db.collection("wallets").doc(String(userId)).get();
    
    if (!doc.exists) {
      // Create a default wallet if it doesn't exist
      const initialWallet = { balance: 500, history: [] }; 
      await db.collection("wallets").doc(String(userId)).set(initialWallet);
      return res.json(initialWallet);
    }
    res.json(doc.data());
  } catch (e) { 
    console.error("Wallet Fetch Error:", e); // Check your terminal for this log
    res.status(500).json({ error: e.message }); 
  }
});

// 2. Place Order (Generates OTP immediately)
app.post("/orders", async (req, res) => {
  try {
    const { totalAmount, placedby } = req.body; // Ensure these are sent from frontend

    // Validate required fields
    if (!totalAmount || !placedby) {
      return res.status(400).json({ error: "Missing required fields: totalAmount and placedby" });
    }

    // Validate amount is positive
    if (totalAmount <= 0) {
      return res.status(400).json({ error: "Total amount must be positive" });
    }

    const otp = generateOTP();
    const now = new Date().toISOString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    // Create the Order Document (wallet deduction happens only after OTP verification)
    const orderRef = db.collection("order").doc();
    const orderDoc = {
      ...req.body,
      otp: otp,
      otpExpiry: otpExpiry,
      status: "PLACED",
      createdAt: now,
      updatedAt: now
    };

    await orderRef.set(orderDoc);
    res.status(201).json({ id: orderRef.id, ...orderDoc });
  } catch (error) {
    console.error("Order Placement Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Accept order (set pickedby and buddyPhone)
app.patch("/orders/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { pickedby, buddyPhone } = req.body; // Extract buddyPhone from request

    const now = new Date().toISOString();
    
    // Create the update object
    const updateData = {
      pickedby: pickedby,
      buddyPhone: buddyPhone || "", // Store the phone number
      updatedAt: now
    };

    await db.collection("order").doc(id).update(updateData);

    const updatedDoc = await db.collection("order").doc(id).get();
    res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Update Status (Sends email if moving to OUT_FOR_DELIVERY)
app.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orderRef = db.collection("order").doc(id);
    const doc = await orderRef.get();

    if (!doc.exists) return res.status(404).json({ error: "Order not found" });
    const orderData = doc.data();

    // Note: OTP email is now sent when delivery buddy clicks "Mark as Delivered"

    await orderRef.update({ status, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) {
    console.error("Status Update Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 3.1. Resend OTP
app.post("/orders/:id/resend-otp", async (req, res) => {
  try {
    const { id } = req.params;
    const orderRef = db.collection("order").doc(id);
    const doc = await orderRef.get();

    if (!doc.exists) return res.status(404).json({ error: "Order not found" });

    const orderData = doc.data();

    // Check if order has been picked up by a delivery buddy
    if (!orderData.pickedby) {
      return res.status(400).json({ error: "Order must be assigned to a delivery buddy" });
    }

    if (!orderData.customerEmail) {
      return res.status(400).json({ error: "Customer email not found for this order" });
    }

    // Rate limit OTP resend (max 3 per 15 minutes per order)
    const rateLimitKey = `otp_resend_${id}`;
    if (!checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: "Too many resend requests. Please wait before requesting again."
      });
    }

    // Generate new OTP and update expiry
    const newOtp = generateOTP();
    const newOtpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    // Update order with new OTP
    await orderRef.update({
      otp: newOtp,
      otpExpiry: newOtpExpiry,
      updatedAt: new Date().toISOString()
    });

    const emailSent = await sendOTPEmail(orderData.customerEmail, newOtp);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email. Please try again." });
    }

    res.json({
      success: true,
      message: "OTP resent successfully",
      otpExpiry: newOtpExpiry
    });
  } catch (e) {
    console.error("OTP Resend Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 4. VERIFY OTP & TRANSFER MONEY (THE MAIN WALLET LOGIC)
app.post("/orders/:id/verify-otp", async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, buddyId } = req.body;

    // Validate input
    if (!otp || !buddyId) {
      return res.status(400).json({ error: "OTP and buddyId are required" });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: "Invalid OTP format" });
    }

    const orderRef = db.collection("order").doc(id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderSnap.data();

    // Check OTP expiry
    if (order.otpExpiry && new Date() > new Date(order.otpExpiry)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (order.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const batch = db.batch();

    // Deduct from Student
    const studentRef = db.collection("wallets").doc(String(order.placedby));
    batch.set(studentRef, {
      balance: admin.firestore.FieldValue.increment(-order.totalAmount),
      history: admin.firestore.FieldValue.arrayUnion({
        type: 'order', amount: order.totalAmount, date: new Date().toISOString()
      })
    }, { merge: true });

    // Pay the Buddy
    const buddyRef = db.collection("deliveryUsers").doc(String(buddyId));
    batch.set(buddyRef, {
      totalEarnings: admin.firestore.FieldValue.increment(order.deliveryFee),
      deliveryCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Finalize Order
    batch.update(orderRef, { status: 'DELIVERED', updatedAt: new Date().toISOString() });

    await batch.commit();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Standard Get Routes
app.get("/orders", async (req, res) => {
  const snapshot = await db.collection("order").get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.get("/delivery-users/:userId", async (req, res) => {
  const doc = await db.collection("deliveryUsers").doc(req.params.userId).get();
  res.json(doc.exists ? doc.data() : { totalEarnings: 0, deliveryCount: 0 });
});

// GET /orders/batches
app.get("/orders/batches", async (req, res) => {
  try {
    const snapshot = await db.collection("order")
      .where("status", "==", "PLACED")
      .where("pickedby", "==", null)
      .get();

    if (snapshot.empty) return res.json([]);

    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // AI Logic: Group orders by Canteen and Drop Location
    const batches = orders.reduce((acc, order) => {
      const key = `${order.canteenName}-${order.dropLocation}`;
      if (!acc[key]) {
        acc[key] = {
          batchId: key,
          canteenName: order.canteenName,
          dropLocation: order.dropLocation,
          orders: [],
          totalDeliveryFee: 0,
        };
      }
      acc[key].orders.push(order);
      return acc;
    }, {});

    // Filter to show only locations that have more than 1 order (Actual Batches)
    const activeBatches = Object.values(batches).filter(b => b.orders.length > 1);

    // Calculate AI Batch Pricing: (Total combined fees * 0.8) 
    // This makes it cheaper for users but more profitable for the Buddy
    activeBatches.forEach(batch => {
      const combinedFee = batch.orders.reduce((sum, o) => sum + o.deliveryFee, 0);
      batch.suggestedBuddyEarning = combinedFee * 0.85; // Buddy gets 85% of total
    });

    res.json(activeBatches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
