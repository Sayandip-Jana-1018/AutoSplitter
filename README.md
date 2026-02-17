# ⚡ AutoSplit — Smart Expense Splitting & Settlement

> A premium, full-stack expense-splitting web app built with **Next.js 16**, **Prisma**, **PostgreSQL (Neon)**, and **NextAuth v5**. Features glassmorphic UI, AI-powered receipt scanning, debt simplification, real-time analytics, and 12 color themes.

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph Client["🖥️ Frontend — Next.js 16 App Router"]
        Landing["Landing Page"]
        Auth["Auth Pages<br/>(Login / Register)"]
        Dashboard["Dashboard"]
        Groups["Groups & Group Detail"]
        Transactions["Transactions<br/>(List / Timeline / New / Scan / Receipts)"]
        Settlements["Settlements"]
        Analytics["Analytics"]
        Settings["Settings"]
    end

    subgraph Components["🧩 Component Library"]
        UI["UI Components<br/>(Card, Button, Avatar, Modal, Toast,<br/>AmountPad, Confetti, GlobalSearch,<br/>PullToRefresh, Skeleton, Icons)"]
        Features["Feature Components<br/>(OnboardingTour, ThemeSelector,<br/>ClipboardBanner, NotificationBanner,<br/>SplitSelector, GroupInvite,<br/>SettlementGraph)"]
        Charts["Charts<br/>(SpendingCharts via Recharts)"]
    end

    subgraph Hooks["🪝 Custom Hooks"]
        H1["useTheme"]
        H2["useHaptics"]
        H3["useAnimatedNumber"]
        H4["usePullToRefresh"]
        H5["useClipboardPaste"]
        H6["useCurrentUser"]
    end

    subgraph API["🔌 API Routes — Next.js Route Handlers"]
        AuthAPI["POST /api/auth/*<br/>POST /api/register"]
        MeAPI["GET /api/me<br/>GET /api/me/avatar"]
        GroupsAPI["GET/POST /api/groups<br/>GET/PUT /api/groups/:id<br/>GET /api/groups/:id/balances<br/>POST /api/groups/join"]
        TxnAPI["GET/POST /api/transactions<br/>PUT/DELETE /api/transactions/:id"]
        SettleAPI["GET/POST /api/settlements"]
        TripsAPI["GET/POST /api/trips"]
        SearchAPI["GET /api/search"]
    end

    subgraph Backend["⚙️ Backend Services"]
        PrismaORM["Prisma ORM"]
        AuthLib["NextAuth v5"]
        Parser["Transaction Parser<br/>(OCR + regex)"]
        SettleLib["Settlement Engine<br/>(Greedy netting)"]
        Export["CSV/JSON Export"]
        UPI["UPI Deep-link Generator"]
        Validators["Zod Validators"]
    end

    subgraph DB["🗄️ Database — PostgreSQL (Neon)"]
        Users["Users"]
        GroupsDB["Groups"]
        Members["GroupMembers"]
        Trips["Trips"]
        TransDB["Transactions"]
        Splits["SplitItems"]
        SettleDB["Settlements"]
    end

    Client --> Components
    Client --> Hooks
    Client --> API
    API --> Backend
    Backend --> PrismaORM
    PrismaORM --> DB
```

---

## 🗃️ Database Schema (Entity-Relationship)

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ Group : owns
    User ||--o{ GroupMember : joins
    User ||--o{ Transaction : pays
    User ||--o{ SplitItem : owes
    User ||--o{ Settlement : "settles from"
    User ||--o{ Settlement : "settles to"

    Group ||--o{ GroupMember : contains
    Group ||--o{ Trip : has

    Trip ||--o{ Transaction : contains
    Trip ||--o{ Settlement : tracks

    Transaction ||--o{ SplitItem : "split into"

    User {
        string id PK
        string name
        string email UK
        string password
        string phone
        string upiId
        string image
    }

    Group {
        string id PK
        string name
        string emoji
        string inviteCode UK
        string ownerId FK
    }

    Trip {
        string id PK
        string groupId FK
        string title
        datetime startDate
        datetime endDate
        string currency
        boolean isActive
    }

    Transaction {
        string id PK
        string tripId FK
        string payerId FK
        int amount "in paise"
        string title
        string category
        string method
        string splitType
        string receiptUrl
    }

    SplitItem {
        string id PK
        string transactionId FK
        string userId FK
        int amount "in paise"
    }

    Settlement {
        string id PK
        string tripId FK
        string fromId FK
        string toId FK
        int amount "in paise"
        string status
        string method
    }
```

---

## ✨ Features

### Core Functionality
| Feature | Description |
|---|---|
| **Expense Tracking** | Create, edit, delete expenses with categories, payment methods, and receipt URLs |
| **Group Management** | Create groups, invite via link/code, manage members with admin roles |
| **Trip Scoping** | Organize expenses within trips per group with date ranges and currency |
| **Split Types** | Equal, percentage, custom, and item-based splitting |
| **Settlements** | Track who owes whom, mark as completed, with UPI deep-links |
| **Debt Simplification** | Greedy netting algorithm minimizes the number of transfers |
| **Analytics Dashboard** | Category breakdown, spending trends via Recharts |
| **CSV/JSON Export** | Export transaction data for external use |

### AI & Smart Features
| Feature | Description |
|---|---|
| **Receipt Scanner (OCR)** | Tesseract.js-powered scanner extracts amount, merchant, payment method from GPay/PhonePe/Paytm screenshots |
| **Live Camera Capture** | getUserMedia viewfinder with real-time scan guide overlay |
| **Clipboard Paste** | Auto-detect UPI transaction text from clipboard |
| **Transaction Parser** | Regex engine parses UPI/bank SMS into structured data |
| **Smart Notifications** | Auto-cycling banner shows pending settlements with one-tap navigation |
| **Global Search** | Search across transactions, groups, and members |

### Premium UI/UX
| Feature | Description |
|---|---|
| **Glassmorphism Design** | Frosted-glass cards with blur, saturation, and gradient overlays |
| **12 Color Themes** | Rose, Ocean, Emerald, Violet, Amber, Slate, Coral, Teal, Indigo, Lime, Fuchsia, Cyan |
| **Dark / Light Mode** | System-aware with manual toggle; theme saved to localStorage |
| **Animated Numbers** | Counting animations on dashboard stats |
| **Pull to Refresh** | Touch gesture with animated gradient spinner |
| **Haptic Feedback** | Vibration API integration on buttons, navigation, and actions |
| **Activity Timeline** | Grouped-by-day vertical timeline view with staggered animations |
| **Confetti Celebration** | Canvas particle animation when all debts are settled |
| **Onboarding Tour** | 9-step spotlight walkthrough for new users |
| **Skeleton Loading** | Premium shimmer loading states across all pages |
| **Offline Indicator** | Detects network loss and shows a banner |
| **Amount Pad** | GPay-style digit-by-digit number pad bottom sheet |
| **Receipt Gallery** | Browse scanned receipt thumbnails in a 2-column grid |
| **QR Code Invites** | Generate QR codes for group invitations |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19, Server Components) |
| **Language** | TypeScript 5 |
| **Styling** | CSS Modules + CSS Custom Properties (design tokens) |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Charts** | Recharts 3 |
| **OCR** | Tesseract.js 7 |
| **QR Codes** | qrcode.react |
| **Auth** | NextAuth v5 (beta-30) with credentials provider + bcryptjs |
| **ORM** | Prisma 6 |
| **Database** | PostgreSQL on Neon |
| **Validation** | Zod 4 |
| **Compiler** | React Compiler (babel-plugin-react-compiler) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated app shell
│   │   ├── layout.tsx            # Sidebar, header, bottom nav, FAB
│   │   ├── dashboard/            # Home — stats, balance hero, quick actions
│   │   ├── groups/               # Group list & group detail (balances, members, activity)
│   │   ├── transactions/         # List/timeline view, new, scan, receipts
│   │   ├── settlements/          # Settlement tracker with status management
│   │   ├── analytics/            # Spending charts & breakdowns
│   │   └── settings/             # Profile, theme, account settings
│   ├── (auth)/                   # Login & register pages
│   ├── api/                      # Next.js API route handlers
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── register/             # User registration
│   │   ├── me/                   # Current user profile & avatar
│   │   ├── groups/               # CRUD + join + balances
│   │   ├── transactions/         # CRUD with split management
│   │   ├── settlements/          # Create & list settlements
│   │   ├── trips/                # Trip management
│   │   └── search/               # Global search across entities
│   ├── invite/                   # Public invite accept page
│   ├── join/                     # Group join flow
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # 26 reusable UI components
│   ├── features/                 # 8 feature-specific components
│   ├── charts/                   # Recharts-based spending charts
│   └── providers/                # Theme & session providers
├── hooks/                        # 6 custom React hooks
├── lib/                          # 8 utility modules (auth, db, parser, settlement, export, upi, validators, utils)
└── prisma/
    └── schema.prisma             # Database schema (9 models)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** database (or [Neon](https://neon.tech/) free tier)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/AutoSplit.git
cd AutoSplit
npm install
```

### 2. Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:pass@host/autosplit?sslmode=require"

# NextAuth
AUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 🔑 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Create a new user account |
| `GET` | `/api/me` | Get current user profile |
| `GET` | `/api/me/avatar` | Get user avatar |
| `GET` | `/api/groups` | List user's groups |
| `POST` | `/api/groups` | Create a new group |
| `GET` | `/api/groups/:id` | Get group details with members & balances |
| `GET` | `/api/groups/:id/balances` | Compute balances & suggested settlements |
| `POST` | `/api/groups/join` | Join a group via invite code |
| `GET` | `/api/transactions` | List transactions (supports `?limit=`) |
| `POST` | `/api/transactions` | Create transaction with splits |
| `PUT` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |
| `GET` | `/api/settlements` | List settlements |
| `POST` | `/api/settlements` | Create or update settlement |
| `GET` | `/api/trips` | List trips |
| `POST` | `/api/trips` | Create a trip |
| `GET` | `/api/search?q=` | Global search |

---

## 🧮 Debt Simplification Algorithm

The app uses a **greedy netting algorithm** to minimize settlement transfers:

1. Compute each member's **net balance** (total paid − total owed)
2. Separate into **debtors** (negative balance) and **creditors** (positive balance)
3. Sort debtors by largest debt, creditors by largest credit
4. Iteratively match the largest debtor with the largest creditor
5. Transfer the minimum of the two amounts, reducing both
6. Result: an optimal set of transfers (often fewer than n−1)

---

## 🎨 Theming System

AutoSplit uses a **CSS custom properties** design system with HSL-based color tokens:

- **12 accent palettes**: `rose`, `ocean`, `emerald`, `violet`, `amber`, `slate`, `coral`, `teal`, `indigo`, `lime`, `fuchsia`, `cyan`
- **Dark / Light modes** with automatic system detection
- **Glassmorphism tokens**: `--bg-glass`, `--border-glass`, `--shadow-card`
- **Spacing scale**: 4px base with `--space-1` through `--space-12`
- **Typography scale**: `--text-2xs` through `--text-3xl`
- **Border radius**: `--radius-sm` through `--radius-full`

Theme preference is persisted in `localStorage` and applied via CSS class on `<html>`.

---

## 📱 PWA-Ready Features

- **Responsive layout** with mobile-first bottom navigation + FAB
- **Pull-to-refresh** touch gesture on dashboard
- **Haptic feedback** via Vibration API
- **Offline detection** with user-friendly banner
- **Camera integration** via getUserMedia for receipt scanning

---

## 📄 License

This project is private and not open-source.
