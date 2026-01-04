import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SaleItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    batchNo: { type: String, default: "", trim: true },
    expiryDate: { type: Date, default: null },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    lineRevenue: { type: Number, required: true, min: 0 },
    lineCost: { type: Number, required: true, min: 0 },
    lineProfit: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    customerName: { type: String, default: "", trim: true },
    paymentMethod: { type: String, default: "cash", trim: true },
    items: { type: [SaleItemSchema], required: true },
    totalRevenue: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    soldAt: { type: Date, default: () => new Date() },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

SaleSchema.index({ soldAt: -1 });

export type SaleDoc = InferSchemaType<typeof SaleSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Sale = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);


