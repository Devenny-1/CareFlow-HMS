# CareFlow HMS

CareFlow HMS is a JavaScript full-stack hospital operations application. The Vite/React client and Express/Mongoose API are separate applications managed from this root folder.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- MongoDB locally, or a MongoDB Atlas database/user with network access configured

The application selects the `careflow_hms` database through Mongoose. MongoDB credentials are never stored in source code.

## Setup

1. Install dependencies from the project root:

   ```powershell
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. Create the backend environment file:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

   Run this from the project root. If `server\.env` already exists, keep it and edit that file instead.

3. Edit `server\.env`:

   - `MONGODB_URI`: local URI such as `mongodb://127.0.0.1:27017/careflow_hms`, or your private Atlas URI.
   - `JWT_SECRET`: generate a random secret with at least 32 characters. For example, `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.
   - `CLIENT_URL`: origin allowed to call the API (default `http://localhost:5173`).
   - `PORT`: API port (default `4000`).
   - `REGISTRATION_FEE` and `CURRENCY`: amount/currency used when a new patient registration invoice is issued (defaults `25000` and `NGN`).
   - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: set these only when running the administrator seed command. The example values are placeholders, not login credentials. Use a unique email and a strong password of at least 12 characters.

   `server\.env.example` and the root `.env.example` contain placeholders only. Do not commit real environment files or credentials.

4. Start MongoDB, or create an Atlas cluster and allow this development machine's IP in its network access list. The local MongoDB Server executable is not included.

## Initialize the database

Create the starter departments and the first administrator:

```powershell
npm run seed:departments
$env:ADMIN_NAME = "Hospital Administrator"
$env:ADMIN_EMAIL = "admin@your-hospital.example"
$env:ADMIN_PASSWORD = "replace-with-a-unique-strong-password"
npm run seed:admin
Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

Alternatively, put the seed-only administrator variables in `server\.env` and run `npm run seed`; it ensures the departments first and then creates the administrator. The command refuses to overwrite an existing account. It creates no sample staff accounts.

The administrator can create receptionist, nurse, doctor, and finance accounts from the Staff page. Staff passwords are hashed with bcrypt before storage; the admin account itself is created only by the explicit seed command, never by a public registration endpoint.

## Run

From the project root:

```powershell
npm run dev
```

This starts the API at `http://localhost:4000` and client at `http://localhost:5173`. Vite proxies `/api` requests to the API. Alternatively, start them separately with `npm run dev:server` and `npm run dev:client`.

## Implemented workflows

- JWT sign-in, session restoration, sign-out, role-gated client routes, server-side role authorization, and active-account checks.
- Administrator-only staff account creation/deactivation; active staff doctor directory for scheduling.
- Starter and administrator-managed departments.
- Patient registration and searchable records; successful registration issues a configurable registration invoice.
- Finance/admin invoice review, one-time payment confirmation, and payment ledger entries.
- Receptionist/admin visit scheduling and doctor assignment; doctors see assigned visits and update visit status.
- Nurse/admin vital-sign recording with numeric range validation.
- Role-aware operational dashboard, patient, visit, billing, staff, and department screens.
- Central request validation/error responses, Helmet, CORS allow-listing, login rate limiting, and MongoDB indexes for common/unique fields.

## Tests and build

```powershell
npm test
$env:TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/careflow_hms_test"
npm run test:integration
Remove-Item Env:TEST_MONGODB_URI
npm run build
```

Backend API tests cover health status, unauthenticated access, malformed login input, and unknown routes without requiring MongoDB. The integration workflow creates and drops only the dedicated `careflow_hms_test` database and covers staff creation, login, patient registration/invoicing, visit assignment, nurse vital-sign recording, doctor status updates, finance payment confirmation, duplicate-payment prevention, and deactivated-session rejection. Never point `TEST_MONGODB_URI` at a production database.

## API outline

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET|POST /api/staff`, `GET /api/staff/doctors`, `PATCH /api/staff/:id/active`
- `GET|POST /api/departments`, `PATCH /api/departments/:id/active`
- `GET|POST /api/patients`, `GET /api/patients/:id`
- `GET /api/invoices`, `PATCH /api/invoices/:id/pay`, `GET /api/payments`
- `GET|POST /api/visits`, `PATCH /api/visits/:id/status`, `GET /api/triage`, `PATCH /api/triage/:id/vitals`
- `GET /api/dashboard/dashboard`, `GET /api/health`

## Planned for later milestones

This is an initial operational milestone, not a production-certified clinical record system. Full electronic medical records and notes, prescriptions, laboratory/imaging workflows, insurance claims, external payment-gateway integration, patient portal, audit-log/export tooling, password reset/MFA, and production deployment/monitoring are not implemented. Payment confirmation records funds received; it does not charge a card or verify a bank transfer with an external provider. Apply the hospital's privacy, retention, access-control, backup, and regulatory requirements before using real patient information.
