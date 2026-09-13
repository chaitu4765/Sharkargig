# SIH26089 — SahakarGig: Cooperative Gig Services Platform

> **SIH 2026 Problem Statement SIH26089**: Cooperative-Owned Digital Marketplace for Household & Community Services.

---

## 🌟 Executive Summary & Concept

**SahakarGig** is a production-grade, cooperative-owned digital platform connecting customers with verified workers belonging to Labour Cooperative Societies. Unlike commercial gig platforms that extract high commission margins from gig workers, SahakarGig empowers worker cooperatives by providing:

1. **Cooperative Ownership Hierarchy**: `Federation → Cooperative Society → Worker → Customer`.
2. **Fair Work Allocation Engine**: Algorithmically distributes booking opportunities equitably among verified workers, preventing monopsony or income inequality.
3. **Worker Welfare & Insurance**: Automated tracking of provident funds, safety net contributions, healthcare insurance policies, and recommended skill upskilling courses.
4. **Worker Safety SOS Alert System**: Instant emergency beacon notifying local Cooperative Safety Desks with live geospatial coordinates.
5. **AI Workforce Intelligence**: Explainable AI demand forecasting, state-wide skill gap analysis, and inter-society workforce reallocation recommendations.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js (ES Modules), RESTful API Architecture, JWT Authentication, bcryptjs.
- **Database**: Relational SQLite via `sqlite3` driver with spatial Haversine distance functions, strict FK constraints, and indexed queries.
- **Frontend**: Vite + React, Lucide Icons, Modern Civic Vanilla CSS Design System, i18next Multilingual Support (English, Hindi, Telugu).
- **AI/ML Module**: Time-Series Poisson Demand Predictor & Explainable Skill-Gap / Reallocation Advisor.
- **Payment Abstraction**: `PaymentService` mock gateway with instant digital invoice PDF generation.

---

## 🔑 Demo Account Credentials (Instant 1-Click Login)

The platform features a persistent **Demo Evaluator Control Bar** at the top of the interface for seamless role switching:

| User Role | Email | Password | Primary Features & Dashboard View |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@sahakar.in` | `Password123!` | Search services, geospatial worker radar, emergency dispatch, booking status tracker, demo payments, digital invoices, ratings |
| **Worker (Member)** | `ravi.worker@sahakar.in` | `Password123!` | Duty toggle (Online/Offline), accept/reject jobs, live status updater (`On The Way`, `In Progress`, `Completed`), SOS emergency button, earnings ledger, welfare & insurance |
| **Coop Admin** | `admin.hyderabad@sahakar.in` | `Password123!` | Worker verification queue (`PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`), active SOS alert monitor board, local revenue/job analytics |
| **Federation Admin** | `admin.state@sahakar.in` | `Password123!` | Multi-society metrics, AI demand prediction maps, skill shortage matrix, explainable workforce reallocation advisor |

---

## 🚀 How to Run the Platform Locally

### 1. Start the Backend Server (Port 5000)
```bash
cd backend
npm install
npm run seed  # Populates realistic Indian seed data
npm run dev
```

### 2. Start the Frontend Application (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🧮 Smart Matching & Fair Allocation Formula

$$\text{MatchScore} = (0.35 \times \text{SkillMatch}) + (0.20 \times \text{Availability}) + (0.20 \times \text{DistanceScore}) + (0.10 \times \text{RatingScore}) + (0.15 \times \text{FairnessScore})$$

- **Fairness Boost Score**: Workers with fewer recent jobs in the past 30 days receive a higher fairness multiplier to guarantee equitable livelihood distribution across all certified members.

---

## 🛡️ Security & Quality Audit Checklist

- [x] Passwords hashed using bcrypt (salt round 10).
- [x] JWT token-based authentication with role-based access control middleware (`requireRole`).
- [x] Concurrency protection: Double-booking prevention during slot reservation.
- [x] Server-side price & tax calculation (Never trusts client-side payment amounts).
- [x] Parameterized SQL query execution preventing SQL injection.
- [x] Multilingual dictionary support for English, Hindi, and Telugu.
