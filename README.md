# AssuredOpsSuite

Company Operations Portal with role-based access, KPI management, HR tracking, equipment billing, and program management.

## Features

### Role-Based Views
- **Admin** — Full access to all modules
- **HR** — Employee hiring/firing, termination billing
- **IT** — Laptop/phone/software assignment and tracking with costs
- **Warehouse** — Tools/uniforms/safety equipment issuance and tracking
- **Finance** — Equipment cost reports, termination billing, financial overview
- **Operations** — KPI dashboards, department summaries
- **Program Manager** — Program-specific workflows, docs, and tasks

### Core Modules
- **HR Management** — Hire and terminate employees, track status and department
- **IT Equipment** — Assign laptops, phones, software licenses; track serial numbers and costs
- **Warehouse Equipment** — Issue tools, uniforms, safety gear; track costs
- **KPI Tracking** — Create and monitor KPIs by department with progress bars and history
- **Termination Billing** — Auto-generates bills for unreturned equipment when employees are terminated
- **Finance Dashboard** — Equipment cost summaries, deployed value, billing overview
- **Program Management** — Manage programs (HES IE, WHE SF, WHE MF, CEDA, Elevate MF, IESP, etc.) with documents, tasks (Kanban board), and milestones
- **HES IE Portal** — Embed and connect to your HES IE site directly

## Tech Stack
- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Frontend:** React 18, React Router 6
- **Database:** SQLite with WAL mode

## Setup

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Start the server (port 4000)
npm start

# Start the React dev server (port 3000, proxies to 4000)
npm run client
```

## API Endpoints

- `GET/POST /api/employees` — Employee CRUD
- `POST /api/employees/:id/terminate` — Terminate employee and generate bill
- `GET/POST /api/equipment/catalog` — Equipment catalog
- `GET/POST /api/equipment/assignments` — Equipment assignments
- `PUT /api/equipment/assignments/:id/return` — Return equipment
- `GET /api/equipment/cost-summary/:employeeId` — Cost summary per employee
- `GET/POST/PUT/DELETE /api/kpis` — KPI management
- `GET/PUT /api/billing` — Termination bills
- `GET/POST/PUT/DELETE /api/programs` — Program management
- `POST /api/programs/:id/documents` — Program documents
- `POST /api/programs/:id/tasks` — Program tasks
- `POST /api/programs/:id/milestones` — Program milestones
