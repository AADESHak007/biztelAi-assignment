# BIZTELAI Technologies - AI-Powered Operational Digitization Desk

An advanced, premium full-stack web application prototype built to digitize handwritten, scanned, or semi-structured operational sheets (e.g. manufacturing logs, assembly timecards, shift sheets) and convert them into structured, reviewable databases with real-time analytics and dynamic business compliance rules.

Designed with a state-of-the-art **glassmorphic Midnight-Cyber aesthetic**, utilizing native linear gradient SVG indicators to ensure zero-dependency, hydration-safe, high-fidelity rendering under **Next.js 16.2.6 (Turbopack)** and **React 19**.

---

## 🌟 Key Capabilities & Features

1. **Dual Ingestion Stream Engine (Multimodal AI & Simulation Fallback)**
   - **Gemini 1.5 Flash Mode**: Upload any PNG, JPG, or PDF. The app directly calls Google's Generative AI API client-side (securely using your key) to run deep visual character recognition and extract full operational schemas.
   - **Heuristic OCR Simulator**: No API key? No problem! In Mock Mode, the system analyzes filenames to generate realistic mock sheets (complete with varying confidence levels and validation discrepancies) to demonstrate real-world operational workflows.

2. **Automated Business Rules & Exception Handling**
   - **Real-Time Validation Checks**: Detects missing fields, invalid shifts (expected: `A`, `B`, or `C`), incorrect machine codes (must start with `MC`), duplicate work orders in history, suspicious quantities (>1000), and extreme shift durations (>12 hours).
   - **Supervisor Override Auditing**: Discrepancies are highlighted in neon orange with a slide-out review panel. Supervisors can override validations, edit parameters, and provide mandatory audit log justifications.

3. **Responsive Bento Grid Operations Dashboard**
   - **KPI Highlights**: Total uploads, Exception Rates, Pending Manual Reviews, and Average Extracted Confidence.
   - **Custom SVG Charts**: Reactive horizontal bars representing shift distributions, machine output leaderboards, and exception category breakdowns.
   - **Interactive Exception Hub**: Highlights immediate action items that block record exports.

4. **Split-Screen Ingestion Scanner**
   - Displays a custom CAD-style blueprint mapping out simulated AI-OCR bounding box coordinate stencils side-by-side with an interactive editor showing individual field confidence levels.

5. **Client-Side Data Persistence**
   - Automatically synchronizes all ingested, corrected, and verified logs into `localStorage` so data survives browser refreshes!

---

## 🛠️ Architecture & Tech Stack

- **Core Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **Runtime Environment**: React 19.2.4 & TypeScript 5
- **Styling Layer**: Tailwind CSS v4 & custom Keyframe CSS animations
- **Vector Icons**: Lucide-React
- **State Management**: React State Hooks & browser LocalStorage API
- **AI Integration**: Multimodal Direct Google Gemini REST API

---

## 🚀 Quick Setup Instructions

Follow these simple steps to run the application locally:

### 1. Ingest Dependencies
Ensure you have Node.js 18+ installed, then run:
```bash
npm install --legacy-peer-deps
```

### 2. Configure Your Environment (Optional)
Rename `.env.example` to `.env` or set it in your system variables to activate real AI extraction:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_google_gemini_api_key
```
*Note: You can also enter, save, or clear your Gemini API Key directly inside the **Settings** drawer inside the web interface!*

### 3. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to explore the Digitization Control Desk!

---

## 📁 Project Directory Layout

```txt
biztel-ai-aadesh/
├── src/
│   ├── app/
│   │   ├── components/            # High-Fidelity Glassmorphic Views
│   │   │   ├── Header.tsx         # Ingest Counters & Status Indicator
│   │   │   ├── UploadZone.tsx     # Ingest Stream & Drag/Drop
│   │   │   ├── DashboardView.tsx  # Bento Grid Analytics with SVG Charts
│   │   │   ├── RecordsView.tsx    # Filterable operational database table
│   │   │   ├── ReviewModal.tsx    # Blueprint Scanning Overlay & Editor
│   │   │   └── SettingsView.tsx   # Custom constraints & API Key manager
│   │   ├── utils/
│   │   │   ├── mockData.ts        # Sample initial manufacturing logs
│   │   │   ├── validation.ts      # Enforced Business Rules compiler
│   │   │   └── gemini.ts          # Direct Multimodal API REST connection
│   │   ├── globals.css            # Scannable keyframes & scrollbar variables
│   │   ├── layout.tsx             # Theme Wrapper
│   │   └── page.tsx               # Orchestration State Manager
├── AI_WORKFLOW.md                 # AI Engineering ledger
├── TASK.md                        # Digits Assignment Specifications
└── .env.example                   # Local configuration template
```

---

## ⚡ Interactive Simulation Shortcuts (No API Key Required)
When in **Mock Mode**, drag or select any dummy file and name it as follows to test specific operational exceptions:
- **`weld.png`**: Generates a standard welding shift log (compliant, high confidence).
- **`shift_d.png`**: Simulates an invalid shift value (`D`), flagging an exception.
- **`suspicious.png`**: Emits an anomalous log sheet with high quantity (1500 units) and long hours (16h), triggering manual overrides.
- **`missing.png`**: Creates a sheet with a blank employee code and zero output quantities.
- **`duplicate.png`**: Uploads a duplicate work order matching records already saved in the database history.

---

## 🤖 AI workflow Documentation
To evaluate the AI-assisted development loops, prompting blueprints, code optimization cycles, and compiler warning resolutions, please view [AI_WORKFLOW.md](file:///c:/Users/91774/Desktop/biztel-ai-aadesh/AI_WORKFLOW.md).
