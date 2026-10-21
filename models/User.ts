import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  phone: string;
  username?: string;
  password: string;
  type: "individual" | "shop" | "admin";
  shopName?: string;
  address?: string;
  isAdmin: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true },
    type: { type: String, enum: ["individual", "shop", "admin"], default: "individual" },
    shopName: { type: String, trim: true },
    address: { type: String },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
