require("dotenv").config();
const express = require("express");
const db = require("./firebase"); // 🔗 linked to firebase.js
const nodemailer = require("nodemailer");

// import express from "express";
// import {db} from "./firebase"
const app = express();
app.use(express.json());

// OTP will be stored in Firestore order documents for persistence

// Email transporter (configure with your email service)
// For development/demo purposes, we'll use a mock email system
// In production, configure with real email service like Gmail, SendGrid, etc.
/*
const transporter = {
  sendMail: async (mailOptions) => {
    try {
      // Extract OTP from HTML content for logging (new format: letter-spacing: 4px)
      const otpMatch = mailOptions.html.match(/letter-spacing: 4px[^>]*>(\d{6})</);
      const otp = otpMatch ? otpMatch[1] : 'OTP not found';

      console.log('📧 MOCK EMAIL SENT SUCCESSFULLY:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        otp: otp,
        timestamp: new Date().toISOString()
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate successful sending (95% success rate for testing)
      if (Math.random() > 0.05) {
        return { messageId: 'mock-' + Date.now() };
      } else {
        throw new Error('Simulated email sending failure - network timeout');
      }
    } catch (error) {
      console.error('📧 MOCK EMAIL FAILED:', error.message);
      throw error;
    }
  }
};
*/

// Uncomment below for real email sending (configure with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate OTP format
    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new Error('Invalid OTP format');
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
}

// Basic CORS for local dev (Vite runs on 5173)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/**
 * Firestore Collections
 * - canteens: store canteen profile + operatingHours + menu[]
 * - order: store confirmed orders
 * - deliveryUsers: store delivery earnings and stats for each delivery user
 */

// Helper to validate canteen payload
function validateCanteenPayload(body) {
  if (!body || typeof body !== "object") return "Body is required";
  if (!body.name) return "name is required";
  if (!body.location) return "location is required";
  if (!body.contactNumber) return "contactNumber is required";
  if (!body.operatingHours || typeof body.operatingHours !== "object") return "operatingHours is required";
  if (!Array.isArray(body.menu)) return "menu must be an array";
  for (const [i, item] of body.menu.entries()) {
    if (!item.itemName) return `menu[${i}].itemName is required`;
    if (typeof item.price !== "number") return `menu[${i}].price must be a number`;
    if (!item.category) return `menu[${i}].category is required`;
  }
  return null;
}

// Helper to validate order payload
function validateOrderPayload(body) {
  if (!body || typeof body !== "object") return "Body is required";
  if (!body.canteenName) return "canteenName is required";
  if (!body.pickupPoint) return "pickupPoint is required";
  if (!body.dropLocation) return "dropLocation is required";
  if (!Array.isArray(body.items) || body.items.length === 0) return "items must be a non-empty array";
  if (typeof body.subtotal !== "number") return "subtotal must be a number";
  if (typeof body.deliveryFee !== "number") return "deliveryFee must be a number";
  if (typeof body.totalAmount !== "number") return "totalAmount must be a number";
  if (typeof body.placedby !== "number" && typeof body.placedby !== "string") return "placedby must be a number or string";
  if (body.customerEmail !== null && typeof body.customerEmail !== "string") return "customerEmail must be null or a string";
  if (body.customerPhone !== null && typeof body.customerPhone !== "string") return "customerPhone must be null or a string";
  if (body.pickedby !== null && typeof body.pickedby !== "number" && typeof body.pickedby !== "string") return "pickedby must be null or a number or string";
  return null;
}

// Test route
app.get("/", (req, res) => {
  res.send("Backend running with Firestore 🚀");
  console.log(db.collection("order").get());
});

// Test OTP email sending
app.post("/test-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Use provided OTP or generate random one
    const testOtp = otp || generateOTP();

    console.log(`🧪 Testing OTP email to: ${email} with OTP: ${testOtp}`);

    const emailSent = await sendOTPEmail(email, testOtp);

    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send test OTP email" });
    }

    res.status(200).json({
      success: true,
      message: "Test OTP email sent successfully",
      email: email,
      otp: testOtp
    });

  } catch (error) {
    console.error('Test OTP failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create/Upsert a canteen model in Firestore
app.post("/canteens", async (req, res) => {
  try {
    const err = validateCanteenPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const now = new Date().toISOString();
    const canteenDoc = {
      name: req.body.name,
      location: req.body.location,
      contactNumber: req.body.contactNumber,
      operatingHours: {
        mondayToFriday: req.body.operatingHours.mondayToFriday || "",
        saturday: req.body.operatingHours.saturday || "",
        sunday: req.body.operatingHours.sunday || "",
      },
      menu: req.body.menu.map((m) => ({
        itemName: m.itemName,
        price: m.price,
        category: m.category,
      })),
      createdAt: req.body.createdAt || now,
      updatedAt: now,
    };

    // Use provided id if present, else auto-id
    if (req.body.id) {
      await db.collection("canteens").doc(String(req.body.id)).set(canteenDoc, { merge: true });
      return res.status(200).json({ id: String(req.body.id), ...canteenDoc });
    }

    const ref = await db.collection("canteens").add(canteenDoc);
    return res.status(201).json({ id: ref.id, ...canteenDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// List canteens
app.get("/canteens", async (req, res) => {
  try {
    const snapshot = await db.collection("canteens").get();
    if (snapshot.empty) return res.status(200).json([]);

    const canteens = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(canteens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm an order (write to Firestore)
app.post("/orders", async (req, res) => {
  try {
    const err = validateOrderPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const now = new Date().toISOString();
    const orderDoc = {
      canteenName: req.body.canteenName,
      pickupPoint: req.body.pickupPoint,
      dropLocation: req.body.dropLocation,
      items: req.body.items,
      subtotal: req.body.subtotal,
      deliveryFee: req.body.deliveryFee,
      totalAmount: req.body.totalAmount,
      placedby: parseInt(req.body.placedby) || req.body.placedby,
      customerEmail: req.body.customerEmail || null,
      customerPhone: req.body.customerPhone || null,
      pickedby: req.body.pickedby === null ? null : (parseInt(req.body.pickedby) || req.body.pickedby),
      status: req.body.status || "PLACED",
      createdAt: req.body.createdAt || now,
      updatedAt: now,
    };

    const ref = await db.collection("order").add(orderDoc);
    res.status(201).json({ id: ref.id, ...orderDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/orders", async (req, res) => {
  try {
    const snapshot = await db.collection("order").get();

    // If collection is empty
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,       // document ID
      ...doc.data(),    // document fields
    }));

    res.status(200).json(orders);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
app.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const now = new Date().toISOString();
    await db.collection("order").doc(id).update({
      status: status.toUpperCase(),
      updatedAt: now
    });

    // Get updated order
    const updatedDoc = await db.collection("order").doc(id).get();
    if (!updatedDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Accept order (set pickedby)
app.patch("/orders/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { pickedby } = req.body;

    const now = new Date().toISOString();
    await db.collection("order").doc(id).update({
      pickedby: parseInt(pickedby) || pickedby,
      updatedAt: now
    });

    // Get updated order
    const updatedDoc = await db.collection("order").doc(id).get();
    if (!updatedDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get delivery user stats
app.get("/delivery-users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const doc = await db.collection("deliveryUsers").doc(userId).get();
    if (!doc.exists) {
      // Return default stats if user doesn't exist yet
      return res.status(200).json({
        userId,
        totalEarnings: 0,
        deliveryCount: 0,
        deliveries: [],
        rating: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    res.status(200).json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Update delivery earnings when order is completed
app.post("/delivery-users/:userId/earn", async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, orderId } = req.body;

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const now = new Date().toISOString();
    const docRef = db.collection("deliveryUsers").doc(userId);

    // Get current data or create new
    const doc = await docRef.get();
    let currentData;

    if (!doc.exists) {
      currentData = {
        userId,
        totalEarnings: 0,
        deliveryCount: 0,
        deliveries: [],
        rating: 4.9, // Default rating
        createdAt: now,
        updatedAt: now
      };
    } else {
      currentData = doc.data();
    }

    // Update earnings and delivery count
    const newDelivery = {
      amount,
      orderId,
      timestamp: now,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    };

    const updatedData = {
      ...currentData,
      totalEarnings: currentData.totalEarnings + amount,
      deliveryCount: currentData.deliveryCount + 1,
      deliveries: [...(currentData.deliveries || []), newDelivery],
      updatedAt: now
    };

    await docRef.set(updatedData);

    res.status(200).json(updatedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// Start pickup - generate and send OTP
app.post("/orders/:id/start-pickup", async (req, res) => {
  try {
    const { id } = req.params;

    // Get order details
    const orderDoc = await db.collection("order").doc(id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderDoc.data();

    // Check if order has customer email
    if (!orderData.customerEmail) {
      return res.status(400).json({ error: "Customer email not found for this order" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + (10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in Firestore order document
    const now = new Date().toISOString();
    await db.collection("order").doc(id).update({
      otp: otp,
      otpExpiry: expiryTime,
      updatedAt: now
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(orderData.customerEmail, otp);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    res.status(200).json({
      message: "OTP sent to customer email",
      orderId: id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Resend OTP for pickup verification
app.post("/orders/:id/resend-otp", async (req, res) => {
  try {
    const { id } = req.params;

    // Get order details
    const orderDoc = await db.collection("order").doc(id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderDoc.data();

    // Check if order has customer email
    if (!orderData.customerEmail) {
      return res.status(400).json({ error: "Customer email not found for this order" });
    }

    // Check if there's already an active OTP
    if (orderData.otp && orderData.otpExpiry && Date.now() < orderData.otpExpiry) {
      return res.status(400).json({ error: "OTP already sent. Please wait before requesting a new one." });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + (10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in Firestore order document
    const now = new Date().toISOString();
    await db.collection("order").doc(id).update({
      otp: otp,
      otpExpiry: expiryTime,
      updatedAt: now
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(orderData.customerEmail, otp);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    res.status(200).json({
      message: "OTP resent successfully",
      orderId: id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP and update order status to PICKED_UP
app.post("/orders/:id/verify-otp", async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    // Get order details to check OTP
    const orderDoc = await db.collection("order").doc(id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderDoc.data();

    // Check if OTP exists for this order
    if (!orderData.otp) {
      return res.status(400).json({ error: "No OTP found for this order. Please start pickup first." });
    }

    // Check if OTP has expired
    if (Date.now() > orderData.otpExpiry) {
      // Clean up expired OTP
      const now = new Date().toISOString();
      await db.collection("order").doc(id).update({
        otp: null,
        otpExpiry: null,
        updatedAt: now
      });
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (orderData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // OTP is valid, update order status to PICKED_UP and clean up OTP
    const now = new Date().toISOString();
    await db.collection("order").doc(id).update({
      status: "PICKED_UP",
      otp: null,
      otpExpiry: null,
      updatedAt: now
    });

    // Get updated order
    const updatedDoc = await db.collection("order").doc(id).get();
    if (!updatedDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({
      message: "OTP verified successfully. Order status updated to PICKED_UP.",
      order: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
