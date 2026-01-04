import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SaleItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    batchNo: { type: String, default: "", trim: true },
    expiryDate: { type: Date, default: null },
    // qty is stored in product stock unit (strip for strip-products; can be fractional when selling pieces)
    qty: { type: Number, required: true, min: 0 },
    // How user entered the qty (strip/piece) for display purposes
    qtyUnit: { type: String, default: "piece", trim: true },
    qtyEntered: { type: Number, default: 0, min: 0 },
    // unitPrice is entered price (per qtyUnit), unitPricePerPiece is computed and used for totals.
    unitPrice: { type: Number, required: true, min: 0 },
    unitPricePerPiece: { type: Number, required: true, min: 0 },
    // Computed cost per piece (derived from batch cost and piecesPerStrip)
    unitCostPerPiece: { type: Number, required: true, min: 0 },
    // Always stored as pieces for consistent display in UI/reports
    piecesSold: { type: Number, required: true, min: 0 },
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

// In Next.js dev with HMR, the model may already be compiled with an older schema.
// Ensure newly added fields exist on the existing model schema too.
const existingModel = mongoose.models.Sale as mongoose.Model<SaleDoc> | undefined;
if (existingModel) {
  // Old schema versions used min: 1 for items.qty, which breaks fractional strip quantities (e.g. 0.1 strip).
  const qtyPath = (existingModel.schema.path("items") as any)?.schema?.path?.("qty") as
    | { options?: { min?: number }; validators?: Array<{ type?: string }> }
    | undefined;
  if (qtyPath) {
    const currentMin = Number(qtyPath.options?.min);
    if (!Number.isNaN(currentMin) && currentMin > 0) {
      if (!qtyPath.options) qtyPath.options = {};
      qtyPath.options.min = 0;
      if (Array.isArray(qtyPath.validators)) {
        qtyPath.validators = qtyPath.validators.filter((v) => v?.type !== "min");
      }
    }
  }
}
if (existingModel) {
  const itemsPath = existingModel.schema.path("items") as any;
  const itemSchema = itemsPath?.schema;

  if (itemSchema && !existingModel.schema.path("items.unitPricePerPiece")) {
    itemSchema.add({
      unitPricePerPiece: { type: Number, required: true, min: 0 },
    });
  }
  if (itemSchema && !existingModel.schema.path("items.unitCostPerPiece")) {
    itemSchema.add({
      unitCostPerPiece: { type: Number, required: true, min: 0 },
    });
  }
  if (itemSchema && !existingModel.schema.path("items.piecesSold")) {
    itemSchema.add({
      piecesSold: { type: Number, required: true, min: 0 },
    });
  }
  if (itemSchema && !existingModel.schema.path("items.qtyUnit")) {
    itemSchema.add({
      qtyUnit: { type: String, default: "piece", trim: true },
      qtyEntered: { type: Number, default: 0, min: 0 },
    });
  }
}

export const Sale = existingModel || mongoose.model<SaleDoc>("Sale", SaleSchema);


