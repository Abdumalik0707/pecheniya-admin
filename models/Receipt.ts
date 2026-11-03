import mongoose, { Schema, Model } from "mongoose";

// Payment receipts (card transfer screenshots) uploaded by customers on the site.
// Kept in their own collection, NOT in the public "Image" collection,
// because receipts are private: only the admin panel serves them.

export interface IReceipt {
  _id: string;
  data: string; // data URI
  contentType: string;
  size: number;
  userId?: string;
  orderId?: string;
  createdAt: Date;
}

const ReceiptSchema = new Schema(
  {
    data: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    userId: { type: String },
    orderId: { type: String },
  },
  { timestamps: true }
);

const Receipt: Model<IReceipt & mongoose.Document> =
  mongoose.models.Receipt || mongoose.model("Receipt", ReceiptSchema);

export default Receipt;
