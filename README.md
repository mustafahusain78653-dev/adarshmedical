## Adarsh Medical - Admin Panel (Next.js + MongoDB)

Simple **admin-only** panel for medical store management with:

- **Admin login** (single admin; no roles yet)
- **Products** (batch-wise stock + expiry)
- **Categories, Suppliers, Customers** (CRUD)
- **Purchases** (adds stock)
- **Sales** (reduces stock + stores profit)
- **Dashboard analytics**: today revenue + today profit + monthly revenue/profit + low-stock + expiring-soon

## Getting Started

### Install

```bash
npm install
```

### MongoDB Atlas setup (quick)

1. Create a **Cluster**
2. Create a **Database User**
3. Add your IP in **Network Access** (for dev you can allow `0.0.0.0/0`, not recommended for production)
4. Get the connection string from **Connect → Drivers**

Example connection string:

```txt
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/adarsh_medical?retryWrites=true&w=majority&appName=<appName>
```

### Environment variables

This workspace blocks creating dotfiles from the agent, so create `.env.local` manually.

1. Copy `env.example`
2. Create `.env.local`
3. Fill:
   - `MONGODB_URI`
   - `JWT_SECRET` (any long random string)
   - `SETUP_KEY` (a secret key only you know)

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

### Create first admin (one-time)

1. Open `http://localhost:3000/setup`
2. Enter email + password
3. Enter the same `SETUP_KEY` you put in `.env.local`

After the first admin is created, `/setup` will redirect you to `/login`.

## Notes

- Purchases update product batches (qty, batchNo, expiry).
- Sales reduce stock (selected batch or auto earliest-expiry) and store profit.
- PDFs are intentionally not included right now.
