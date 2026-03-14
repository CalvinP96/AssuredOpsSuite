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
- **Assessor / Scope Creator / Installer / HVAC** — Field role views for HES IE jobs

### Core Modules
- **HR Management** — Hire and terminate employees, track status and department
- **IT Equipment** — Assign laptops, phones, software licenses; track serial numbers and costs
- **Warehouse Equipment** — Issue tools, uniforms, safety gear; track costs
- **KPI Tracking** — Create and monitor KPIs by department with progress bars and history
- **Termination Billing** — Auto-generates bills for unreturned equipment when employees are terminated
- **Finance Dashboard** — Equipment cost summaries, deployed value, billing overview
- **HES IE Program** — Full Home Energy Savings - Income Eligible program management with measures, process steps, eligibility/deferral rules, job tracking, photo management, HVAC replacements, change orders, and pipeline forecasting

## Tech Stack
- **Frontend:** React 18, React Router 6
- **Backend:** Supabase (PostgreSQL + Row Level Security)
- **Deployment:** Netlify (static SPA)

## Setup

### 1. Supabase

Create a Supabase project and run the migration and seed SQL:

```bash
# In Supabase SQL Editor, run in order:
supabase/migration.sql    # Creates all tables + RLS policies
supabase/seed-hes-ie.sql  # Seeds the HES IE program data
```

### 2. Environment Variables

Set these in Netlify (Site Settings > Environment Variables) and locally in `client/.env`:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Local Development

```bash
cd client
npm install
npm start
```

### 4. Deploy to Netlify

Connect your GitHub repo. Netlify will auto-detect settings from `netlify.toml`:
- Build base: `client`
- Build command: `npm install && npm run build`
- Publish: `build`
