import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  address: String,
  city: String
}, { timestamps: true });

export default mongoose.model("Client", clientSchema);
