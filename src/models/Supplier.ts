import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SupplierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    gstin: { type: String, default: "" },
  },
  { timestamps: true }
);

export type SupplierDoc = InferSchemaType<typeof SupplierSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Supplier =
  mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);




