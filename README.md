# SaveSmart — Customizable Savings Challenge PWA 💰🚀

**SaveSmart** is a mobile-first Progressive Web App (PWA) designed to help individuals build healthy financial habits through customizable savings challenges, randomized daily goals, and persistent local tracking.

---

## ✨ Features

- **🎯 Customizable Savings Goals**:
  - Custom target amounts (Presets: ₹5,000, ₹10,000, ₹25,000, ₹50,000, ₹1,00,000, or any positive integer).
  - Minimum and maximum daily savings constraints.
  - Frequency patterns: **Daily**, **Weekdays only (Mon–Fri)**, or **Weekly**.
- **🎲 Constrained Randomized Partition Algorithm**:
  - Mathematically partitions the target into whole currency units strictly within `[minAmount, maxAmount]`.
  - Guarantees the sum of all generated amounts equals the target **exactly**.
  - Prevents impossible remainders or negative/zero amounts.
- **🔄 Two Challenge Generation Modes**:
  - **Mode A: Complete Plan**: Generates and displays the entire schedule upfront with review and regeneration before starting.
  - **Mode B: Daily Surprise**: Generates each day's amount dynamically while reserving mathematically valid paths to complete the goal. The surprise amount remains stable across refreshes and is only re-rolled upon explicit user request.
- **📱 Daily Savings Checklist**:
  - Clean card-based timeline with sequence number, planned date, amount, status badge, and completion timestamp.
  - One-tap "Mark as Saved" interaction with audio feedback, toast notification, and celebratory confetti.
  - Reversible "Undo" action with confirmation.
  - Concurrency control to prevent double-counting.
- **📊 Real-time Dashboard & History**:
  - Circular progress ring and dynamic gradient progress bar.
  - Total saved, remaining target, percentage completion, streak counter, and daily average.
  - History view with status filters (All, Completed, Pending, Missed) and timestamp audits.
- **🔀 Multi-Goal Split Savings (NEW)**:
  - Split any daily savings amount or lump-sum deposit across multiple active goals simultaneously!
  - Interactive distribution modes: **Equal Split** or **Proportional Split** (weighted by each goal's target).
  - Fine-tune exact allocations with visual percentage sliders and real-time balance checker.
  - Automatically credits and updates progress across each goal in IndexedDB.
  - Dedicated Split History log with goal breakdowns, timestamps, and notes.
- **📁 Multi-Challenge Support**:
  - Manage multiple concurrent challenges (e.g. *Emergency Fund*, *New Phone*, *Travel Fund*).
  - Switch active challenge, pause, resume, or archive. Each challenge maintains strictly isolated financial totals.
- **🌐 Offline-Ready PWA & Free Tier Hosting**:
  - Service Worker offline caching via `vite-plugin-pwa`.
  - 100% client-side persistent storage with IndexedDB (`idb`).
  - Pre-configured for **100% Free Hosting** on Vercel, Netlify, and Cloudflare Pages (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
  - Mobile install prompt banner (`beforeinstallprompt` support).
  - Synthesized Web Audio API chimes (zero external audio dependencies).
- **🎨 Customization & Accessibility**:
  - Dynamic themes: Light, Dark, and System mode.
  - 5 Accent colors: Emerald (default), Teal, Indigo, Rose, and Amber.
  - Proper currency formatting with Indian number grouping for INR (e.g. `₹1,00,000`) and multi-currency support (USD, EUR, GBP, CAD, AUD, etc.).
  - Backup & Restore via JSON export and import.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **React 19** | User interface & reactive state |
| **TypeScript** | Strict type safety & domain modeling |
| **Vite** | Modern build tool and dev server |
| **Tailwind CSS v3** | Responsive, mobile-first utility styling |
| **Lucide React** | Modern iconography |
| **idb** | Lightweight Promise-based IndexedDB wrapper |
| **vite-plugin-pwa** | PWA manifest and Workbox Service Worker generation |
| **canvas-confetti** | Milestone and goal completion celebrations |
| **Web Audio API** | Offline harmonic synthesized completion chimes |
| **Vitest** | Unit and integration test suite |

---

## 📐 The Constrained Random Partition Algorithm

Given target $T > 0$, minimum $min > 0$, and maximum $max \ge min$:

### 1. Mathematical Feasibility
An integer target $T$ can be partitioned into $k$ integers $x_i \in [min, max]$ if and only if:
$$k \cdot min \le T \le k \cdot max$$
The target is feasible if and only if $\lceil T / max \rceil \le \lfloor T / min \rfloor$. If this condition is violated (for instance in interval gaps between $k \cdot max$ and $(k+1) \cdot min$), the validator flags the configuration and calculates the nearest valid target suggestions.

### 2. Bounded Step Selection
At step $i$ with remaining target $R$ and $m = k - i$ entries remaining:
$$low = \max(min, R - m \cdot max)$$
$$high = \min(max, R - m \cdot min)$$
By selecting $x_i \in [low, high]$ uniformly or with a triangular distribution, every intermediate state is guaranteed to leave a solvable remainder, and the final item $x_k$ exactly equals the remaining balance.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20.20+ recommended)
- **npm**: v9.0.0 or higher

### Installation

```bash
# Clone or navigate to the repository
cd f:/savings_challenge

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Running Tests

```bash
npm test
```
All 26 unit tests will run using Vitest, validating partition mathematics, frequency scheduling, currency formatting, and state logic.

### Building for Production

```bash
npm run build
```
This runs TypeScript checking (`tsc -b`) and bundles production assets into `dist/`, including the PWA service worker (`dist/sw.js`) and web app manifest (`dist/manifest.webmanifest`).

### Previewing Production Build

```bash
npm run preview
```

---

## 📲 PWA Installation & Browser Notes

- **Google Chrome / Chromium / Edge (Android, Desktop)**:
  - An "Install" button will automatically appear in the top navigation and banner once the browser fires `beforeinstallprompt`.
  - Alternatively, click the browser install icon in the address bar.
- **Apple Safari (iOS / iPadOS)**:
  - Tap the **Share** button (box with upward arrow) in Safari.
  - Select **"Add to Home Screen"**.
  - Note: iOS does not support the automated `beforeinstallprompt` API, so users must use the standard Safari Share Sheet.
- **Offline Functionality**:
  - Once visited, all app shell resources and Google fonts are cached via Workbox.
  - All challenge data and logs are persisted locally in **IndexedDB** (`savesmart_db`), enabling complete offline operations.

---

## 📄 License

MIT License. Built with ❤️ for financial wellness.
