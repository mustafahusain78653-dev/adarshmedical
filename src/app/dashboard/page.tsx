import { connectDb } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RevenueChart, type MonthlyPoint } from "@/components/dashboard/RevenueChart";
import { PaymentPie, type PiePoint } from "@/components/dashboard/PaymentPie";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Supplier } from "@/models/Supplier";
import { Customer } from "@/models/Customer";
import { Purchase } from "@/models/Purchase";
import { Sale } from "@/models/Sale";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function monthLabel(d: Date) {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  await connectDb();

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  const [todayAgg] = await Sale.aggregate([
    { $match: { soldAt: { $gte: todayStart, $lt: tomorrowStart } } },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$totalRevenue" },
        profit: { $sum: "$profit" },
        count: { $sum: 1 },
      },
    },
  ]);

  const todayRevenue = Number(todayAgg?.revenue ?? 0);
  const todayProfit = Number(todayAgg?.profit ?? 0);
  const todaySales = Number(todayAgg?.count ?? 0);

  const [totalAgg] = await Sale.aggregate([
    { $group: { _id: null, revenue: { $sum: "$totalRevenue" }, profit: { $sum: "$profit" } } },
  ]);
  const totalRevenueAll = Number(totalAgg?.revenue ?? 0);

  const startPeriod = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const monthlyAgg = await Sale.aggregate([
    { $match: { soldAt: { $gte: startPeriod } } },
    {
      $group: {
        _id: { y: { $year: "$soldAt" }, m: { $month: "$soldAt" } },
        revenue: { $sum: "$totalRevenue" },
        profit: { $sum: "$profit" },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);

  const monthlyMap = new Map<string, { revenue: number; profit: number }>();
  for (const row of monthlyAgg) {
    const key = `${row._id.y}-${String(row._id.m).padStart(2, "0")}`;
    monthlyMap.set(key, { revenue: Number(row.revenue), profit: Number(row.profit) });
  }

  const monthlyData: MonthlyPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const v = monthlyMap.get(key) ?? { revenue: 0, profit: 0 };
    monthlyData.push({ month: monthLabel(d), revenue: v.revenue, profit: v.profit });
  }

  const [productCount, categoryCount, supplierCount, customerCount, purchaseCount, saleCount] =
    await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Supplier.countDocuments(),
      Customer.countDocuments(),
      Purchase.countDocuments(),
      Sale.countDocuments(),
    ]);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  type PaymentAggRow = { _id: string | null; revenue: number };
  const paymentAgg = await Sale.aggregate<PaymentAggRow>([
    { $match: { soldAt: { $gte: thisMonthStart } } },
    { $group: { _id: "$paymentMethod", revenue: { $sum: "$totalRevenue" } } },
    { $sort: { revenue: -1 } },
  ]);
  const paymentData: PiePoint[] = paymentAgg.map((x) => ({
    name: String(x._id || "unknown"),
    value: Number(x.revenue || 0),
  }));

  type LowStockRow = { _id: unknown; name: string; minStock: number; stockQty: number };
  type ExpiringRow = { _id: unknown; name: string; batchNo: string; expiryDate: Date; qty: number };

  const lowStock = await Product.aggregate<LowStockRow>([
    { $addFields: { stockQty: { $sum: "$batches.qty" } } },
    { $match: { $expr: { $lt: ["$stockQty", "$minStock"] } } },
    { $sort: { stockQty: 1 } },
    { $limit: 8 },
    { $project: { name: 1, minStock: 1, stockQty: 1 } },
  ]);

  const expiringSoon = await Product.aggregate<ExpiringRow>([
    { $unwind: "$batches" },
    {
      $match: {
        "batches.qty": { $gt: 0 },
        "batches.expiryDate": { $gte: todayStart, $lt: addDays(todayStart, 30) },
      },
    },
    { $sort: { "batches.expiryDate": 1 } },
    { $limit: 8 },
    {
      $project: {
        name: 1,
        batchNo: "$batches.batchNo",
        expiryDate: "$batches.expiryDate",
        qty: "$batches.qty",
      },
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            Today revenue, profit and monthly trend.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Today Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₹ {todayRevenue.toFixed(2)}</div>
            <div className="mt-1 text-sm text-zinc-400">{todaySales} sales today</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-400">
              ₹ {todayProfit.toFixed(2)}
            </div>
            <div className="mt-1 text-sm text-zinc-400">Calculated from sold items</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₹ {totalRevenueAll.toFixed(2)}</div>
            <div className="mt-1 text-sm text-zinc-400">All time</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-zinc-900/40 p-2">
                <div className="text-zinc-400">Products</div>
                <div className="font-semibold">{productCount}</div>
              </div>
              <div className="rounded-lg bg-zinc-900/40 p-2">
                <div className="text-zinc-400">Sales</div>
                <div className="font-semibold">{saleCount}</div>
              </div>
              <div className="rounded-lg bg-zinc-900/40 p-2">
                <div className="text-zinc-400">Purchases</div>
                <div className="font-semibold">{purchaseCount}</div>
              </div>
              <div className="rounded-lg bg-zinc-900/40 p-2">
                <div className="text-zinc-400">Suppliers</div>
                <div className="font-semibold">{supplierCount}</div>
              </div>
              <div className="rounded-lg bg-zinc-900/40 p-2">
                <div className="text-zinc-400">Categories</div>
                <div className="font-semibold">{categoryCount}</div>
              </div>
              <div className="rounded-lg bg-zinc-900/40 p-2">
                <div className="text-zinc-400">Customers</div>
                <div className="font-semibold">{customerCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue vs Profit (last 12 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={monthlyData} />
          <div className="mt-2 text-xs text-zinc-400">
            Revenue (black) • Profit (green)
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Revenue by Payment Method (this month)</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.length ? (
              <PaymentPie data={paymentData} />
            ) : (
              <div className="text-sm text-zinc-400">No sales this month yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length ? (
              <div className="space-y-2">
                {lowStock.map((p) => (
                  <div
                    key={String(p._id)}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-zinc-300">
                      {p.stockQty} / min {p.minStock}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-400">No low-stock items.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Soon (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringSoon.length ? (
              <div className="space-y-2">
                {expiringSoon.map((x) => (
                  <div
                    key={`${x._id}-${x.batchNo}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{x.name}</div>
                      <div className="text-xs text-zinc-400">Batch: {x.batchNo}</div>
                    </div>
                    <div className="text-right text-zinc-300">
                      <div>{new Date(x.expiryDate).toLocaleDateString()}</div>
                      <div className="text-xs">Qty: {x.qty}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-400">No expiring batches soon.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


