import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

export type CustomerDoc = InferSchemaType<typeof CustomerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Customer =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);




