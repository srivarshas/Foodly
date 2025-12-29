const express = require("express");
const db = require("./firebase"); // 🔗 linked to firebase.js

// import express from "express";
// import {db} from "./firebase"
const app = express();
app.use(express.json());

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
  if (body.pickedby !== null && typeof body.pickedby !== "number" && typeof body.pickedby !== "string") return "pickedby must be null or a number or string";
  return null;
}

// Test route
app.get("/", (req, res) => {
  res.send("Backend running with Firestore 🚀");
  console.log(db.collection("order").get());
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


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
