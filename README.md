# Janjian — Token-Based Collaborative Scheduling Web Application

> **Case 2: Stronger Communities and Everyday Services**  
> **Google Developer Group (GDG) Bandung Institute of Technology — STACK 2026**  
> **Team Name:** bian traktir tomoro  
> **Team Members:** Fabian Alvaro Muhammad (Leader), Gwein Antaresya Al Farabi, Stevanus Herdi Pamungkas, Keisha Namirea Aqueena  
> **Live Demo URL:** [https://bian-janjian.web.app](https://bian-janjian.web.app)

---

## 🎯 The Problem

Student organizations, extracurricular clubs, and informal community circles often struggle to finalize event dates. Scheduling depends on finding a time when the majority of members are available, which typically results in scattered chat polls, endless messaging, and buried surveys. 

Admins often spend days manually counting votes, which frequently leads to suboptimal dates being chosen where less than 50% of the members can actually participate.

## 💡 The Solution: Janjian

**Janjian** is a token-based collaborative scheduling platform designed to streamline community event planning:
1. **Token-Based Enclosed Room**: An admin creates a dedicated room for their organization/event and receives a unique entry token (e.g., `STACK-ITB`). Members join simply by providing the token and their name—no forced accounts or friction.
2. **Interactive Shared Calendar Heatmap**: Members select their availability on a shared calendar (**Bisa ✓**, **Ragu ?**, **Tidak ✕**).
3. **Deterministic Ranking Engine**: Automatically aggregates availability, calculates percentages, and ranks dates objectively.
4. **Must-Attend (VIP) Filtering**: Organizers can designate key stakeholders (e.g. speakers, club leaders). Dates missing these members are penalized regardless of total headcount.
5. **Venue Capacity Target Matching**: Allows hosts to configure a preferred attendance target (e.g., a venue that only accommodates around 30% turnout) rather than naively selecting only the date with the highest raw vote.
6. **One-Click Approval & Broadcast**: Admin approves the optimal schedule, triggering celebration confetti, an `.ics` calendar export, Google Calendar sync, and a ready-to-paste WhatsApp/Telegram group announcement.

---

## 🚀 Live Demo

- **Hosting URL:** [https://bian-janjian.web.app](https://bian-janjian.web.app)
- **Demo Room Token:** `STACK-ITB` (Pre-seeded with sample members and candidate dates for instant review)

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Utility & Effects:** `canvas-confetti`, `date-fns`, `clsx`, `tailwind-merge`
- **Testing:** Vitest (comprehensive unit test suite for deterministic ranking algorithms)
- **Hosting:** Firebase Hosting with custom domain routing

---

## 🧪 Testing

Janjian's deterministic ranking engine is thoroughly unit-tested:

```bash
npm run test
```

Test suite covers:
- Token generation formatting (`JAN-XXXX`, `STACK-XXXX`)
- Indonesian locale date formatting
- Raw availability percentage calculation
- Must-attend priority override (essential attendees prioritized over raw vote volume)
- Preferred venue turnout optimization
- Edge cases (empty votes, single members, tie-breaks)

---

## 💻 Local Development

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/Steve1901/Bian-Traktir-Stack-2026-.git
cd Bian-Traktir-Stack-2026-

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` to view the application locally.

### Production Build
```bash
npm run build
```

---

## 📄 License

Developed for GDG ITB STACK 2026 by team **bian traktir tomoro**.
