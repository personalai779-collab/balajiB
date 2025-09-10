import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderName: String,
  number: String,
  work: String,
  status: String,
  addDate: Date,
  deliveryDate: Date,
  type: String,
  paymentStatus: String,
  url: String,       // file URL from Cloudinary
  publicId: String   // Cloudinary public_id (needed for delete/update)
});

export default mongoose.model("Order", orderSchema);
