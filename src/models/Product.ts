import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ProductBatchSchema = new Schema(
  {
    batchNo: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    qty: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, default: "", trim: true },
    brand: { type: String, default: "", trim: true },
    unit: { type: String, default: "strip", trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    defaultSupplierId: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
    purchasePriceDefault: { type: Number, default: 0, min: 0 },
    salePriceDefault: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    batches: { type: [ProductBatchSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 1 });

export type ProductDoc = InferSchemaType<typeof ProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);




