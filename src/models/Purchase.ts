import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PurchaseItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    batchNo: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    // qty is entered qty (strip or piece depending on qtyUnit)
    qty: { type: Number, required: true, min: 1 },
    qtyUnit: { type: String, default: "strip", trim: true },
    // qtyBase is stored in pieces (base unit for stock)
    // qtyBase is stored in product stock unit (strip for strip-products; can be fractional when purchasing pieces)
    qtyBase: { type: Number, required: true, min: 0 },
    // unitCost/unitPrice are entered prices (per qtyUnit)
    unitCost: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    // Stored snapshot in case product.piecesPerStrip changes later
    piecesPerStrip: { type: Number, default: 1, min: 1 },
    unitCostPerPiece: { type: Number, required: true, min: 0 },
    unitPricePerPiece: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseSchema = new Schema(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
    invoiceNo: { type: String, default: "", trim: true },
    items: { type: [PurchaseItemSchema], required: true },
    totalCost: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    purchasedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export type PurchaseDoc = InferSchemaType<typeof PurchaseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Purchase =
  mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);




