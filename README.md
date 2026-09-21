# Agni CRM - Multi-Branch Enterprise CRM & Service Management System

A robust, full-stack Customer Relationship Management (CRM) and operations portal built for multi-branch organizations. Agni CRM streamlines lead management, service delivery, sales tracking, client invoicing, service agreements, and inter-departmental collaboration across regional branches.

---

## 🌟 Key Features

- **🏢 Multi-Branch Regional Hierarchy**: Pan-India presence spanning 4 Regional Zones (West - Mumbai, North - Delhi, South - Bengaluru, East - Kolkata).
- **👥 Role-Based Access Control (RBAC)**:
  - **Owner**: Panoramic view of national revenue, cross-branch performance, and executive operations.
  - **Branch Manager (BM)**: Operational oversight, revenue targets, team requests, and regional client tracking.
  - **Sales Manager (SM)**: Sales pipeline supervision, client reassignments, approvals, and performance metrics.
  - **Sales Executive**: Direct client lead onboarding, quotation creation, and stage progression.
  - **IT Team**: IT service provisioning, technical audits, and infrastructure tickets.
  - **Marketing Team**: Campaign management, digital ads attribution, and brand service catalog.
  - **Admin & Finance**: Invoice generation, agreement creation, client records, and payment reconciliation.
- **📄 Document & Agreement Generation**: Dynamic contract and invoice creation with instant status tracking.
- **⚡ Modern Stack**: Vite-powered React single-page frontend paired with a modular Express & Prisma ORM backend.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18+ (Vite)
- **Routing**: React Router DOM (v7)
- **Styling**: Tailwind CSS & Lucide React Icons
- **Document Tooling**: PizZip

### Backend
- **Runtime & Language**: Node.js & TypeScript
- **Framework**: Express.js
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Security & Validation**: JWT (JSON Web Tokens), Bcrypt.js, Zod
- **Utilities**: CORS, Dotenv, Nodemon

---

## 📋 Prerequisites

Ensure you have the following installed on your system before proceeding:
1. **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: `v9.0.0` or higher (bundled with Node.js)
3. **PostgreSQL**: Local PostgreSQL service running ([Download PostgreSQL](https://www.postgresql.org/download/)) or a remote PostgreSQL instance URL.

---

## 🚀 Quickstart & Setup Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/agnivridhiindia-cmd/agni-crm.git
cd agni-crm
```

---

### Step 2: Set Up & Start the Frontend

In the root directory (`agni-crm`):

```bash
# 1. Install frontend dependencies
npm install

# 2. Start the frontend development server
npm run dev
```

> 📍 **Frontend App URL**: [http://localhost:5173](http://localhost:5173)

---

### Step 3: Configure Backend & Environment Variables

Open a new terminal window and navigate to the `server` directory:

```bash
cd server

# 1. Install backend dependencies
npm install
```

#### Set Up `.env` File
Create your local environment configuration file from the provided example:

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**On macOS / Linux:**
```bash
cp .env.example .env
```

Open `server/.env` in your code editor and update `DATABASE_URL` with your PostgreSQL username and password:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://<YOUR_POSTGRES_USER>:<YOUR_POSTGRES_PASSWORD>@localhost:5432/agnicrm?schema=public"
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key_here"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
```

---

### Step 4: Initialize PostgreSQL Database & Seed Data

In the `server` directory:

#### 1. Create the Database
In `psql` or **pgAdmin**:
```sql
CREATE DATABASE agnicrm;
```

#### 2. Push Prisma Schema to PostgreSQL
Generate the Prisma Client and automatically synchronize your database schema:
```bash
npx prisma generate
npx prisma db push
```

#### 3. Seed Seed Data & Demo Accounts
Populate 4 standard branches, service catalog offerings, and test team members across all roles:
```bash
npm run seed
```

---

### Step 5: Start Backend Server

In the `server` directory:

```bash
npm run dev
```

> 📍 **Backend API URL**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo & Test Credentials

After running `npm run seed`, all demo accounts are ready for testing with the default password:
> **Default Password**: `password123`

| Role | Branch / Region | Email | Name |
| :--- | :--- | :--- | :--- |
| **Owner** | Pan-India | `owner@agni.com` | Devika Shah |
| **Branch Manager** | West Zone (Mumbai) | `ariana@agni.com` | Ariana Lee |
| **Branch Manager** | North Zone (Delhi) | `rajesh.bm@agni.com` | Rajesh Khanna |
| **Branch Manager** | South Zone (Bengaluru) | `suresh.bm@agni.com` | Suresh Reddy |
| **Branch Manager** | East Zone (Kolkata) | `subhash.bm@agni.com` | Subhash Banerjee |
| **Sales Manager** | West Zone (Mumbai) | `eli@agni.com` | Eli Brooks |
| **Sales Executive** | West Zone (Mumbai) | `mia@agni.com` | Mia Rose |
| **IT Lead** | West Zone (Mumbai) | `noah@agni.com` | Noah Kim |
| **Marketing Lead**| West Zone (Mumbai) | `daniel@agni.com` | Daniel Cruz |
| **Admin Lead** | West Zone (Mumbai) | `admin@agni.com` | Vikramaditya Roy |

---

## 📂 Project Structure

```text
agni-crm/
├── public/                 # Static assets and icons
├── src/                    # Frontend React source code
│   ├── components/         # Reusable UI components & navigation
│   ├── pages/              # Role-specific dashboard pages & workflows
│   ├── services/           # Frontend API client and state helpers
│   ├── App.tsx             # Route definitions & layout wrappers
│   └── main.tsx            # Application entrypoint
├── server/                 # Backend Node.js / Express API
│   ├── prisma/             # Prisma schema and seed script
│   │   ├── schema.prisma   # PostgreSQL models and relational schemas
│   │   └── seed.ts         # Pre-configured seed records
│   ├── src/
│   │   ├── controllers/    # API request handlers
│   │   ├── middlewares/    # Auth, error handling, rate limiting
│   │   ├── routes/         # Express endpoint definitions
│   │   ├── services/       # Core business logic
│   │   └── index.ts        # Server entrypoint
│   └── package.json
├── package.json            # Root frontend package config
└── README.md               # Project documentation
```

---

## 📜 Available Scripts

### Frontend (Root Directory)
- `npm run dev`: Launch Vite local development server (`localhost:5173`).
- `npm run build`: Build production assets to `dist/`.
- `npm run preview`: Locally preview the production build.

### Backend (`server/` Directory)
- `npm run dev`: Run Express API with `nodemon` and `ts-node` hot reloading.
- `npm run seed`: Seed regional branches, catalog items, and team personnel.
- `npm run prisma:generate`: Re-generate Prisma Client types.
- `npm run prisma:push`: Synchronize database schema directly without migrations.
- `npm run prisma:studio`: Open Prisma Studio visual database viewer.
- `npm run build`: Compile TypeScript into `dist/`.
- `npm run test`: Run Jest unit and integration tests.

---

## 🤝 Contribution & License

This project is privately developed for Agni Vridhi India. For internal feature requests, access permissions, or inquiries, please contact the development team.
