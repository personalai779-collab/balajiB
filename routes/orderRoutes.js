import express from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary.js";
import Order from "../models/Order.js";
import { Readable } from "stream";  // ✅ replace require("stream")

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// helper: upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(stream);
  });
};

// CREATE ORDER with file upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let fileData = null;

    if (req.file) {
      fileData = await uploadToCloudinary(req.file.buffer);
    }

    const order = new Order({
      ...req.body,
      url: fileData?.secure_url || null,
      publicId: fileData?.public_id || null
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ORDER (replace file if new uploaded)
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let fileData = {};

    if (req.file) {
      // delete old file
      if (order.publicId) {
        await cloudinary.uploader.destroy(order.publicId);
      }
      // upload new file
      fileData = await uploadToCloudinary(req.file.buffer);
    }

    order.set({
      ...req.body,
      url: fileData.secure_url || order.url,
      publicId: fileData.public_id || order.publicId
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ORDER (delete file too)
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.publicId) {
      await cloudinary.uploader.destroy(order.publicId);
    }

    await order.deleteOne();
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEARCH API (by name, number, date)
router.get("/search", async (req, res) => {
  try {
    const { name, number, fromDate, toDate } = req.query;
    const query = {};

    if (name) query.orderName = new RegExp(name, "i");
    if (number) query.number = number;
    if (fromDate && toDate) {
      query.addDate = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    }

    const orders = await Order.find(query);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
