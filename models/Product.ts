import mongoose, { Schema, models } from "mongoose";

export interface IProduct {
  _id: string;
  name: string;
  brand: string;
  category: string;
  categoryLabel: string;
  price: number;
  weight: string;
  netWeight: string;
  unit: string;
  image: string;
  images: string[];
  description: string;
  descriptionFull: string;
  tags: string[];
  isNew: boolean;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schemaFields: any = {
  name: { type: String, required: true, trim: true },
  brand: { type: String, default: "SmaG", trim: true },
  category: { type: String, default: "pechenye" },
  categoryLabel: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  weight: { type: String, required: true },
  netWeight: { type: String, default: "" },
  unit: { type: String, default: "quti" },
  image: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String, default: "" },
  descriptionFull: { type: String, default: "" },
  tags: [{ type: String }],
  isNew: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
};

const ProductSchema = new Schema(schemaFields, {
  timestamps: true,
  suppressReservedKeysWarning: true,
});

export default models.Product || mongoose.model("Product", ProductSchema);
