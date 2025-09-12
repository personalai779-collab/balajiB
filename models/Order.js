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
  totalAmount: Number,        // ✅ new
  receivedPayment: Number,    // ✅ new
  url: String,
  publicId: String,
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  address: String,
  city: String
  clientId: {                 // ✅ link to client
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
