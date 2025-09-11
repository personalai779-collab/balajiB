import express from "express";
import Client from "../models/Client.js";
import Order from "../models/Order.js";

const router = express.Router();

// CREATE CLIENT
router.post("/", async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL CLIENTS
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CLIENT BY ID (with orders)
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const orders = await Order.find({ clientId: client._id });
    res.json({ client, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE CLIENT
router.put("/:id", async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE CLIENT (optional: also delete orders)
router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    await Order.deleteMany({ clientId: client._id }); // ✅ cascade delete orders
    await client.deleteOne();

    res.json({ message: "Client and related orders deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
