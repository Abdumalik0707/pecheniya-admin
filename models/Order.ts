import mongoose, { Schema, Document, models } from "mongoose";

export interface IOrder extends Document {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLat?: number;
  customerLng?: number;
  customerType: "individual" | "shop";
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: "yangi_mijoz" | "tolov_otkazildi" | "yetkazib_berishda" | "yetkazib_berildi";
  paymentMethod?: "cash" | "card" | "online";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerLat: { type: Number },
    customerLng: { type: Number },
    customerType: { type: String, enum: ["individual", "shop"], default: "individual" },
    products: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["yangi_mijoz", "tolov_otkazildi", "yetkazib_berishda", "yetkazib_berildi"],
      default: "yangi_mijoz",
    },
    paymentMethod: { type: String, enum: ["cash", "card", "online"] },
    notes: { type: String },
  },
  { timestamps: true }
);

export default models.Order || mongoose.model<IOrder>("Order", OrderSchema);
