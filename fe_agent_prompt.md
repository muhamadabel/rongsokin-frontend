# Rongsokin - Frontend Developer Agent Execution Prompt

> [!NOTE]
> Salin dan gunakan seluruh isi prompt di bawah ini ke agent tim Front-End (FE) untuk dieksekusi secara otomatis. Prompt ini dirancang dengan instruksi tingkat rekayasa profesional, aturan desain premium, serta alur pengerjaan fase-demi-fase.

---

```markdown
# TASK SPECIFICATION FOR FRONTEND AGENT: Build High-Fidelity Client & Admin Dashboard for Rongsokin

## 1. Role & Objective
You are a Lead Frontend Engineer AI Agent. Your task is to build a beautiful, premium, and fully interactive frontend application for the **Rongsokin** platform. 

To demonstrate the full business value, you will create a unified modern web application (Single Page Application or multi-view app using React/Vite or Next.js) that allows seamless role-switching between:
1. **Seller Interface** (Masyarakat/Instansi - input junk, track prices, request pickup).
2. **Collector Interface** (Mitra Kolektor - view orders on map, accept order, input scale weight, complete pickup).
3. **Admin Dashboard** (Management - edit metal/scrap prices, view transaction statistics, approve mitra).

---

## 2. Technology Stack & Design System
To achieve a premium, production-ready aesthetic, you must implement the following:

- **Framework**: React.js with Vite (`npx -y create-vite@latest ./ --template react`) or Next.js (depending on workspace setup).
- **Styling**: Tailwind CSS (use vibrant, eco-harmonious colors: Emerald Green, Deep Slate, Charcoal, and Amber gold highlights).
- **Icons**: Lucide-React or Heroicons for sleek visual cues.
- **Typography**: Import Google Fonts `Outfit` or `Inter` in `index.css` for a modern, clean sans-serif look.
- **Animations**: Framer Motion or smooth Tailwind transitions for micro-interactions (hover, skeleton loaders, success popups).
- **Data Visuals**: Recharts or Chart.js for beautiful admin graphs.

### Design Tokens (CSS / Tailwind):
- **Primary Color**: `Emerald-600` (`#10b981`) & `Emerald-500`
- **Secondary/Dark Color**: `Slate-900` (`#0f172a`) & `Slate-800`
- **Backgrounds**: Slate-950 for Dark Mode theme, White/Slate-50 for light surfaces.
- **Glassmorphism**: Combine `backdrop-blur-md bg-slate-900/60 border border-slate-700/50` for premium card designs.

---

## 3. Scope of Views & Features to Build

You are required to build the following three core dashboards inside one application, accessible via a role-switcher header (`[ Seller View ] [ Collector View ] [ Admin View ]`):

### View A: Seller Interface (Masyarakat)
1. **Live Scrap Price Grid**: 
   - Interactive list/cards of scrap categories (e.g., Kertas Kardus, Tembaga Super, Botol Plastik PET, E-Waste).
   - Display price/kg with green "+2.5% today" trends or charts.
2. **Pesan Penjemputan (Pickup Request Form)**:
   - A step-by-step premium wizard form.
   - Step 1: Select Scrap Category (with nice icons).
   - Step 2: Upload photo (with drag-and-drop state, showing image preview).
   - Step 3: Input weight estimate slider (e.g., 5kg to 500kg).
   - Step 4: Map Location Picker (mock map showing pin drop on current location, address details).
3. **Active Order Tracker Timeline**:
   - Dynamic tracker showing state changes: `PENDING` -> `ACCEPTED` (Mitra assigned) -> `ON THE WAY` (Mitra moving on mock map) -> `WEIGHED` (Waiting confirmation) -> `COMPLETED`.

### View B: Collector Interface (Mitra Kolektor)
1. **Nearby Orders Map Panel**:
   - A mock map layout showing pins of nearby seller requests.
   - Selecting a pin opens a drawer/modal showing distance, scrap type, estimated weight, and estimated earnings.
2. **Active Order Navigation & Scaling Flow**:
   - Once an order is accepted, display route navigation UI.
   - **Timbangan Digital Panel**: Interactive input where the collector types the actual weighed kilograms (e.g., "Kardus: 12.5 Kg"). 
   - Dynamically calculates the final payout and displays it.
   - Button "Kirim & Minta Konfirmasi Seller".
3. **Dompet Mitra (E-Wallet)**:
   - Display current deposit balance (e.g., Rp250.000) and withdrawal button.

### View C: Admin Dashboard
1. **Key Performance Indicators (KPIs)**:
   - Cards showing: Total Sampah Terkumpul (Tons), Transaksi Aktif, Total Payout (Rp), dan Pendapatan Platform (Fee).
2. **Scrap Category & Pricing Manager**:
   - Form to add new scrap items or edit current prices per Kg.
   - Updating a price instantly updates the Seller and Collector views (simulated state).
3. **Mitra Verification Queue**:
   - Table of new Collector applicants with KYC document modal previews, with "Setujui" and "Tolak" actions.

---

## 4. Step-by-Step Implementation Phases

### Phase 1: Environment & Theme Setup
1. Initialize the project with Vite/React.
2. Install dependencies: `npm i tailwindcss postcss autoprefixer lucide-react framer-motion` (and optional `recharts` for graphs).
3. Set up `tailwind.config.js` with your custom color scheme (emerald, slate, amber) and font family (`Outfit`).
4. Set up base `index.css` with Google Fonts and scrollbar styling.

### Phase 2: Component Library Construction
Create a `/components` folder with reusable components:
- `Card.jsx`: Glassmorphic dynamic container.
- `Button.jsx`: Custom button with subtle scaling animation on hover/click.
- `StatusBadge.jsx`: Dynamic status pill (Pending: yellow, Completed: green, Cancelled: red).
- `MockMap.jsx`: A stylish interactive map layout (can use styled SVG/Canvas/CSS shapes to look like a premium map grid with pins and routes).

### Phase 3: Simulated Global State
- Create a global Context (`RongsokinContext.jsx`) to manage:
  - Current role (`'seller' | 'collector' | 'admin'`).
  - List of scrap categories and their prices.
  - Active pickups database (mock records representing state).
  - Seller and Collector wallet balances.
- Ensure when Admin updates the price of "Tembaga", the Seller view updates the price list instantly.
- Ensure when Seller submits a new order, it instantly appears in the Collector's "Available Orders" list.

### Phase 4: Page Layouts Assembly
- Assemble the high-fidelity UI views:
  - Create a top header with the role switching utility, notification drawer, and profile badge.
  - Render the views based on active role state.
  - Integrate nice, lively transitions using `framer-motion` when switching tabs/steps.

### Phase 5: Verification & Polish
- Ensure absolute mobile responsiveness. The Seller and Collector views must be highly optimized for mobile devices (375px - 430px wide screens), while the Admin view should look majestic on desktop (1080p+).
- Prevent empty states by filling pages with realistic placeholder listings, beautiful mock profiles (like "Pak Budi - Kolektor Spesialis Logam"), and dynamic logs.
- Verify zero console errors.

---

## 5. Mock Data Seed (Use this JSON structure in your context)
```json
{
  "categories": [
    { "id": 1, "name": "Logam/Besi", "price": 8500, "unit": "Kg", "trend": "+4.2%", "icon": "Hammer" },
    { "id": 2, "name": "Tembaga Super", "price": 95000, "unit": "Kg", "trend": "+1.5%", "icon": "Layers" },
    { "id": 3, "name": "Kertas & Kardus", "price": 2200, "unit": "Kg", "trend": "-0.8%", "icon": "FileText" },
    { "id": 4, "name": "Botol Plastik PET", "price": 4500, "unit": "Kg", "trend": "+2.0%", "icon": "Droplet" },
    { "id": 5, "name": "E-Waste / Elektronik", "price": 35000, "unit": "Pcs", "trend": "Stable", "icon": "Cpu" }
  ],
  "pickups": [
    {
      "id": "RSK-9921",
      "sellerName": "Ibu Ratna",
      "address": "Jl. Kemang Raya No. 42, Jakarta Selatan",
      "category": "Kertas & Kardus",
      "estimatedWeight": 15,
      "status": "PENDING",
      "createdAt": "2026-05-29T10:00:00Z"
    }
  ]
}
```

Start building the frontend system. Wow the user with your premium designs and functional fidelity!
```
