# 🚀 ElevateHer AI

<div align="center">

![ElevateHer AI](https://img.shields.io/badge/ElevateHer-AI%20Powered-blueviolet?style=for-the-badge&logo=sparkles)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge&logo=google)
![Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=for-the-badge&logo=netlify)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**An AI-powered women empowerment platform that helps users discover personalized opportunities using AI and live web search.**

</div>

---

## 💡 The Idea

### Problem Statement

Women often struggle to discover relevant opportunities — colleges, scholarships, education loans, startup funding, mentorship, and financial literacy resources — because this information is **scattered across hundreds of platforms**. Existing solutions are frequently:

- **Outdated** — static lists that are rarely refreshed
- **Generic** — one-size-fits-all recommendations that ignore personal context
- **Fragmented** — no single place to discover education, finance, and career opportunities together
- **Inaccessible** — platforms that assume English fluency and internet familiarity

Women from tier-2 and tier-3 cities, first-generation college students, and aspiring women entrepreneurs are especially underserved. The gap between opportunity and awareness is wide, and it holds back millions of capable women every year.

### Proposed Solution

**ElevateHer AI** is a comprehensive, AI-driven platform that brings all these opportunities together in one place. Instead of relying on hardcoded datasets, every recommendation is generated in real time using a shared AI infrastructure powered by **SearchService**, **Tavily Search**, and **Google Gemini** — delivering accurate, up-to-date, and deeply personalized results sourced directly from official and trusted public websites.

A user simply describes their background and goals, and the platform intelligently surfaces the most relevant colleges, scholarships, loans, funding opportunities, mentors, and financial guidance — all in one dashboard, available in both English and Hindi.

---

## 🔗 Important Links

| Resource | Link |
|---|---|
| 🌐 **Live Deployment** | [Coming Soon — add your Netlify URL here](#) |
| 🎥 **Demo Video** | [Coming Soon — add your demo video link here](#) |
| 💻 **GitHub Repository** | [Coming Soon — add your GitHub repo link here](#) |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎓 **AI College Finder** | Discover colleges that match your academic profile, preferences, and career goals using live AI search |
| 🏆 **AI Scholarship Finder** | Find scholarships tailored to your background, field of study, and eligibility criteria |
| 💳 **AI Education Loan Finder** | Explore education loan options from banks and financial institutions with real-time details |
| 💡 **AI Startup Funding Finder** | Discover funding opportunities, grants, and incubators for women-led startups |
| 📊 **AI Financial Literacy** | Get personalized financial literacy resources, tips, and learning paths |
| 🤝 **AI Mentor Matching & Chat** | Get matched with mentors based on your goals and connect with them directly |
| 🔐 **Authentication & User Profiles** | Secure sign-up and login with personalized user profiles via Supabase Auth |
| 🔖 **Saved Opportunities** | Bookmark colleges, scholarships, loans, and funding opportunities for later |
| 📱 **Responsive Dashboard** | A clean, mobile-friendly dashboard giving a complete overview of your journey |
| 🔔 **Notification System** | Stay updated with alerts and reminders for important deadlines and opportunities |
| 🌐 **Language Toggle** | Easily switch between **English** and **Hindi** to make the platform accessible for users across India |

> 💡 All recommendations are based on **live information** fetched from official websites and trusted public sources — not hardcoded datasets.

---

## 🛠️ Tech Stack & Tools

### Frontend
| Technology | Purpose |
|---|---|
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) React | UI component library |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) TypeScript | Type-safe development |
| ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) Vite | Fast build tooling and dev server |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white) Tailwind CSS | Utility-first styling |

### Backend & Database
| Technology | Purpose |
|---|---|
| ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white) Supabase | Auth, database, and real-time features |
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) PostgreSQL | Relational database for structured data |

### AI & Search
| Technology | Purpose |
|---|---|
| ![Gemini](https://img.shields.io/badge/-Google%20Gemini-4285F4?logo=google&logoColor=white) Google Gemini API | AI reasoning, response generation, and content synthesis |
| ![Tavily](https://img.shields.io/badge/-Tavily%20Search-FF6B35?logo=searchengin&logoColor=white) Tavily Search API | Real-time web search for live opportunity data |

### Deployment
| Technology | Purpose |
|---|---|
| ![Netlify](https://img.shields.io/badge/-Netlify-00C7B7?logo=netlify&logoColor=white) Netlify | Continuous deployment and hosting |

---

## 📚 Documentation

### 🏗️ Overall Project Architecture

Every feature in ElevateHer AI follows a consistent, modular architecture that ensures reusability and maintainability:

```
Feature Page (React Component)
        ↓
Feature Service (e.g., collegeService, scholarshipService)
        ↓
SearchService (Shared AI Infrastructure)
        ↓
Tavily Search API + Google Gemini API
        ↓
ResponseFormatter (Structured JSON output)
        ↓
React UI (Rendered to user)
```

> 🔁 All modules reuse the **same shared AI infrastructure** — there is no duplicated AI logic across features. Every feature service delegates search and reasoning to `SearchService`, which orchestrates Tavily web search and Gemini AI processing.

---

### 🤖 AI Workflow

All AI-powered features in ElevateHer AI share a single, centralized `SearchService`. This eliminates code duplication and ensures consistent, high-quality responses across every module.

```
User Query
    ↓
Feature Service (builds query context)
    ↓
SearchService.search()
    ↓
Tavily API → Live web search results from real websites
    ↓
Gemini API → Reasoning, synthesis, and structured response generation
    ↓
ResponseFormatter → Clean, structured JSON
    ↓
Feature Page → Renders cards, lists, and details to the user
```

**Key principles:**
- 🌐 **Live web search** — Tavily fetches real-time results from the web
- 🧠 **Gemini reasoning** — Google Gemini processes and synthesizes the results
- 📦 **Response formatting** — All outputs are normalized into structured JSON
- ♻️ **No duplicated AI implementations** — Every feature reuses the same infrastructure

---

### ♻️ Shared AI Infrastructure

The `SearchService` is the backbone of ElevateHer AI. All feature services — college, scholarship, loan, funding, mentorship, and financial literacy — call it with their own context rather than maintaining independent AI implementations.

This means:
- Bug fixes or improvements to the AI layer benefit every feature simultaneously
- New features can be added by writing a thin feature service without rewriting AI logic
- Response quality is consistent across the entire platform

---

### 📁 Folder Structure

```
CognitiveLabs-v2v/
├── src/
│   ├── components/          # Reusable UI components organized by feature
│   │   ├── college/         # College Finder components
│   │   ├── scholarship/     # Scholarship Finder components
│   │   ├── educationLoan/   # Education Loan components
│   │   ├── startupFunding/  # Startup Funding components
│   │   ├── financialLiteracy/ # Financial Literacy components
│   │   ├── mentorship/      # Mentor Matching components
│   │   ├── layout/          # Navbar, Sidebar, Footer, layout wrappers
│   │   └── common/          # Shared UI: modals, spinners, error states
│   │
│   ├── pages/               # Top-level page components (one per route)
│   │   ├── Dashboard/       # Main dashboard page
│   │   ├── CollegeFinder/   # College Finder page
│   │   ├── ScholarshipFinder/ # Scholarship Finder page
│   │   ├── EducationLoan/   # Education Loan page
│   │   ├── StartupFunding/  # Startup Funding page
│   │   ├── FinancialLiteracy/ # Financial Literacy page
│   │   ├── Mentorship/      # Mentorship page
│   │   └── Auth/            # Login and signup pages
│   │
│   ├── services/            # All API, AI, and data services
│   │   ├── ai/              # Gemini AI service and prompt builder
│   │   ├── search/          # Shared SearchService (Tavily + Gemini)
│   │   ├── college/         # College feature service
│   │   ├── scholarship/     # Scholarship feature service
│   │   ├── educationLoan/   # Education Loan feature service
│   │   ├── startupFunding/  # Startup Funding feature service
│   │   ├── financialLiteracy/ # Financial Literacy feature service
│   │   └── mentorship/      # Mentorship feature service
│   │
│   ├── types/               # TypeScript interfaces and type definitions
│   ├── hooks/               # Custom React hooks
│   ├── routes/              # App routing (AppRouter.tsx)
│   ├── store/               # Global state management
│   └── App.tsx              # Root application component
│
├── database/                # SQL migration files for Supabase/PostgreSQL
├── public/                  # Static assets (favicon, icons)
└── index.html               # HTML entry point
```

**Directory purposes at a glance:**
- `components/` — Reusable UI building blocks, scoped per feature
- `pages/` — Full page views, each corresponding to a route
- `services/` — All business logic, AI calls, and external API interactions
- `types/` — Centralized TypeScript type definitions shared across the app
- `database/` — Version-controlled SQL migration files for the database schema

---

### Database Architecture

All database schema definitions and migrations are stored in the `database/` folder as incremental SQL files:

```
database/
├── 001_initial_schema.sql       # Core schema — DO NOT MODIFY
├── 002_education_loan.sql       # Education loan tables
├── 003_college_finder.sql       # College finder tables
├── 004_scholarship_finder.sql   # Scholarship finder tables
├── 005_mentorship.sql           # Mentorship tables
├── 006_college_school_chat.sql  # Chat tables
└── 007_startup_funding.sql      # Startup funding tables
```

**Rules:**
- 🚫 `001_initial_schema.sql` must **never be modified** — it is the foundational schema.
- ✅ Every new feature must use a new **incremental migration file** (e.g., `008_new_feature.sql`).
- Run migrations in order against your Supabase SQL editor or via the Supabase CLI.

---

### 🔑 Environment Variables

Create a `.env` file at the root of the project with the following variables:

```env
# Supabase
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# Google Gemini AI
VITE_GEMINI_API_KEY

# Tavily Search
VITE_TAVILY_API_KEY
```

> ⚠️ **Never commit your `.env` file to version control.** It is already included in `.gitignore`.

---

### 📡 Data Sources

ElevateHer AI prioritizes accuracy and authenticity. Recommendations are sourced from:

#### Primary Sources (Official)
| Category | Examples |
|---|---|
| 🏛️ Government | Ministry of Education, UGC, AICTE, Startup India, NSP portals |
| 🎓 Universities | Official university and college admission websites |
| 🏦 Banks & Finance | RBI, SBI, HDFC, ICICI, and other official bank portals |
| 🏢 Companies | Official corporate websites for scholarships and CSR programs |
| 🚀 Incubators & Accelerators | IIT incubators, NASSCOM, T-Hub, official accelerator sites |

#### Secondary Sources (Trusted Public)
When official information is unavailable, the system may reference trusted public sources:

`Google Search` **·** `Wikipedia` **·** `Crunchbase` **·** `TechCrunch` **·** `YourStory` **·** `Inc42` **·** `LinkedIn` **·** `Wellfound` **·** `Reddit` **·** `Quora`

> ✅ ElevateHer AI **does not intentionally generate fabricated or hardcoded recommendations.** All results are sourced dynamically from the web at query time.

---

## 🔮 Future Enhancements

| Enhancement | Description |
|---|---|
| 📄 **Resume Analysis** | AI-powered resume review with personalized improvement suggestions |
| 🗺️ **Career Roadmaps** | Step-by-step AI-generated career paths tailored to individual goals |
| 🤝 **Startup Collaboration** | Connect women entrepreneurs with co-founders, advisors, and collaborators |
| 📱 **Mobile App** | Native iOS and Android app for on-the-go access |
| 🌍 **Regional Language Support** | Multi-language support for Hindi, Tamil, Telugu, and other regional languages |

---

## 👩‍💻 COGNITIVE LABS Team

| Role | Name |
|---|---|
| Team Leader | Pakhi Dubey |
| Team Member 1 | Riddhi Bose |
| Team Member 2 | Nidhi Verma |

> *Built with ❤️ for the empowerment of women everywhere.*

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 ElevateHer AI Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**⭐ If you found this project helpful, please give it a star on GitHub!**

Made with ❤️ by **Cognitive Labs**

</div>
