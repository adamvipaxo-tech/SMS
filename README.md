# StockHub Ltd — Stock Management System (SMS)

**National Practical Exam 2026** · Kigali City, Rwanda

Rename this folder to **`YourFirstName_YourLastName_National_Practical_Exam_2026`** before submission.

## Project structure

```
FirstName_LastName_National_Practical_Exam_2026/
├── docs/ERD.md              # ERD documentation (Mermaid + crow's foot notes)
├── database/sms_schema.sql  # MySQL database SMS
├── backend-project/         # Node.js + Express API
└── frontend-project/        # React + Vite + Tailwind CSS
```

## Requirements checklist

| Requirement | Status |
|-------------|--------|
| ERD with PK/FK and cardinalities | `docs/ERD.md` (+ draw on paper / draw.io) |
| MySQL database `SMS` | `database/sms_schema.sql` |
| Insert on Product, Warehouse, Transactions | ✓ |
| Update/Delete/Retrieve on Transactions only | ✓ |
| User login (username/password) | ✓ default `manager` / `manager123` |
| Axios integration | ✓ |
| Daily / weekly / monthly reports | ✓ |
| Sidebar menu (no navbar): Dashboard, Product, Warehouse, Transactions, Reports, Profile, Logout | ✓ |
| Dashboard with KPIs, low stock alerts, recent transactions | ✓ |
| Profile: create/delete managers, change password | ✓ |
| Print dedicated full report (not current page) | ✓ |
| Responsive UI + Tailwind CSS | ✓ |

## Setup

### 1. MySQL database

Install MySQL, then run:

```bash
mysql -u root -p < database/sms_schema.sql
```

Edit `backend-project/.env` with your MySQL password.

### 2. Backend

```bash
cd backend-project
npm install
npm run dev
```

API: `http://localhost:5000`

### 3. Frontend

```bash
cd frontend-project
npm install
npm run dev
```

App: `http://localhost:5173`

## Default login

- **Username:** `manager`
- **Password:** `manager123`

(Created automatically on first backend start if no users exist.)

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard KPIs, alerts, recent transactions |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register user |
| GET/POST | `/api/products` | List / insert products |
| GET/POST | `/api/warehouses` | List / insert warehouses |
| GET/POST/PUT/DELETE | `/api/transactions` | Full CRUD on transactions |
| GET | `/api/reports/daily` | Daily report |
| GET | `/api/reports/weekly` | Weekly report |
| GET | `/api/reports/monthly` | Monthly report |
| GET | `/api/users` | List all managers |
| GET | `/api/users/me` | Current profile |
| POST | `/api/users` | Create manager |
| PUT | `/api/users/change-password` | Change own password |
| DELETE | `/api/users/:id` | Delete manager (not self) |

Protected routes require header: `Authorization: Bearer <token>`

## ERD (draw on paper first)

**Product** (1) ——< (M) **StockTransaction** >—— (M) **Warehouse** (1)

- `StockTransaction.productCode` → `Product.productCode`
- `StockTransaction.warehouseCode` → `Warehouse.warehouseCode`

See `docs/ERD.md` for full attribute list and Mermaid diagram for Lucidchart/draw.io.
