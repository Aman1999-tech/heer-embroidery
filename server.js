const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const admin = require("firebase-admin");
require("dotenv").config();
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// -------------------- RAZORPAY SETUP --------------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// -------------------- FIREBASE SETUP --------------------
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const productsRef = db.collection("products");
const ordersRef = db.collection("orders");

// -------------------- ADMIN TOKEN --------------------
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "mysecrettoken";

// -------------------- RAZORPAY ROUTES --------------------
// Create Razorpay order
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    });
    res.json({ ...order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify Razorpay payment
app.post("/verify-order", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
    const h = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    h.update(razorpay_order_id + "|" + razorpay_payment_id);
    const valid = h.digest("hex") === razorpay_signature;
    if (valid) {
      const newOrder = { orderId: razorpay_order_id, paymentId: razorpay_payment_id, customer: orderData, date: new Date().toISOString() };
      await ordersRef.add(newOrder);
      res.json({ success: true });
    } else { res.json({ success: false }); }
  } catch (e) { console.error(e); res.json({ success: false }); }
});

// -------------------- PRODUCTS ROUTES --------------------
// Get all products
app.get("/products", async (req, res) => {
  try {
    const snapshot = await productsRef.get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (err) { res.status(500).json({ error: "Failed to load products" }); }
});

// Add new product
app.post("/products", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== ADMIN_TOKEN) return res.status(403).send("Unauthorized");
  try {
    const newProduct = req.body;
    const docRef = await productsRef.add(newProduct);
    res.status(201).json({ id: docRef.id, ...newProduct });
  } catch (err) { res.status(500).json({ error: "Failed to add product" }); }
});

// Update product
app.put("/products/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== ADMIN_TOKEN) return res.status(403).send("Unauthorized");
  try {
    await productsRef.doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to update product" }); }
});

// Delete product
app.delete("/products/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== ADMIN_TOKEN) return res.status(403).send("Unauthorized");
  try {
    await productsRef.doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete product" }); }
});

// -------------------- ORDERS ROUTES --------------------
// Get all orders
app.get("/orders", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== ADMIN_TOKEN) return res.status(403).send("Unauthorized");
  try {
    const snapshot = await ordersRef.get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (err) { res.status(500).json({ error: "Failed to load orders" }); }
});

// Add order separately
app.post("/orders", async (req, res) => {
  try {
    const newOrder = { ...req.body, date: new Date() };
    const docRef = await ordersRef.add(newOrder);
    res.json({ id: docRef.id, ...newOrder });
  } catch (err) { res.status(500).json({ error: "Failed to add order" }); }
});

// -------------------- START SERVER --------------------
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
