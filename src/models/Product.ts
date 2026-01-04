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
    // When unit is "strip", this defines how many pieces are in 1 strip.
    // Stock is tracked in base unit "piece" internally (batches.qty), so conversions use this.
    piecesPerStrip: { type: Number, default: 1, min: 1 },
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

// In Next.js dev with HMR, the model may already be compiled with an older schema.
// Ensure newly added fields exist on the existing model schema too.
const existingModel = mongoose.models.Product as mongoose.Model<ProductDoc> | undefined;
if (existingModel && !existingModel.schema.path("piecesPerStrip")) {
  existingModel.schema.add({
    piecesPerStrip: { type: Number, default: 1, min: 1 },
  });
}

export const Product = existingModel || mongoose.model<ProductDoc>("Product", ProductSchema);




