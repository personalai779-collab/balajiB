import express from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary.js";
import Order from "../models/Order.js";
import { Readable } from "stream";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: Upload buffer to Cloudinary with image optimization
const uploadToCloudinary = (fileBuffer, isImage = true) => {
  return new Promise((resolve, reject) => {
    const options = {
      resource_type: "auto",
    };

    // Apply optimization for images only
    if (isImage) {
      options.quality = "auto"; // Automatically adjust quality to reduce size
      options.fetch_format = "auto"; // Automatically choose optimal format (e.g., WebP)
      options.flags = "lossy"; // Enable lossy compression for further size reduction
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    Readable.from(fileBuffer).pipe(stream);
  });
};

// CREATE ORDER with file upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let fileData = null;

    if (req.file) {
      // Check if the file is an image based on mimetype
      const isImage = req.file.mimetype.startsWith("image/");
      fileData = await uploadToCloudinary(req.file.buffer, isImage);
    }

    const order = new Order({
      ...req.body,
      url: fileData?.secure_url || null,
      publicId: fileData?.public_id || null,
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
      // Delete old file
      if (order.publicId) {
        await cloudinary.uploader.destroy(order.publicId);
      }
      // Upload new file with optimization
      const isImage = req.file.mimetype.startsWith("image/");
      fileData = await uploadToCloudinary(req.file.buffer, isImage);
    }

    order.set({
      ...req.body,
      url: fileData.secure_url || order.url,
      publicId: fileData.public_id || order.publicId,
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
