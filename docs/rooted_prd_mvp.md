# ROOTED Companion App — Product Requirements Document (PRD)

## 1. Product Summary

**The ROOTED Companion App** is a recovery-first wellness platform that helps users interpret their biometric signals (HRV, RHR, sleep, stress) and take one personalized, evidence-based action each day. It integrates wearable data when available, but gracefully falls back to reflective self-assessment. The app includes a quiet AI coach (not chatbot-first) and always retains a human-in-the-loop model with real facilitators.

This is not a tracker. This is a **rest-and-restore ally** built for high-functioning but burnt-out individuals.

---

## 2. Target Users

**Primary:**

- High-performing professionals experiencing stress, fatigue, or mild burnout
- Early adopters of wearables (Garmin, Whoop, Muse)
- ROOTED Retreat alumni seeking post-retreat continuity

**Secondary:**

- Users without wearables who want reflective, structured guidance
- Holistic health seekers looking for science-backed, soulful support

---

## 3. Core V1 User Journey

### Onboarding

- Choose: connect wearable OR begin without it
- Answer 4–5 short questions to build initial profile (e.g., sleep quality, fatigue, energy, stress)

### Daily Loop (MVP)

1. **User opens app**
2. Sees a "ROOTED Pulse" summary:
   - Recovery Score (from HRV + Sleep OR subjective check-in)
   - Suggested action (e.g., meditation, mindfulness, breathwork, walk, journaling)
3. Marks it as completed → optional mood check-in (emoji + 1 word)
4. AI coach logs it + adapts future suggestions

### Weekly Loop (MVP)

- Sunday: "Your Recovery Story" email with personalized reflection and small wins

---

## 4. Key MVP Features

### ✅ Daily Recovery Pulse

- If wearable connected: show Recovery Score (HRV + RHR + Sleep trend)
- If not: ask user for simple subjective data (1–3 tap prompts)
- One suggested action with rationale from AI coach

### ✅ Embedded AI Coaching

- LangChain-powered agent using embedded studies from `wellness_embeddings`
- Generates daily suggestions + weekly summaries
- Supports supplements, breathwork, mindset, movement and exercises, and lifestyle guidance

### ✅ Human Support Option

- "Need a human?" button triggers form to contact ROOTED coach (Andrew, Zeger, Ashley)
- Human response via email or WhatsApp (manual)

### ✅ Email Notifications

- Daily morning email: "Your ROOTED Pulse is ready"
- Weekly summary email on Sundays

### ✅ Onboarding Without Wearable

- Questionnaire builds baseline profile
- Reflective insights triggered instead of biometric data

---

## 5. Out of Scope for MVP

- Full chatbot interface
- Push notifications (mobile only)
- Advanced goal tracking or streaks
- Social features or gamification
- OAuth provider login (email only for now)

---

## 6. Future Iterative Features (Post-MVP)

### 🔜 Short Term (v1.1)

- WhatsApp notification integration
- Chat interface for AI coach (side-drawer)
- Burnout risk scoring
- Supplement schedule planner

### 🔭 Long Term (v2+)

- Mobile app with push notifications
- Deeper wearable integrations (Muse, Whoop)
- Journal + voice note logging
- Group programs & shared challenge modes

---

## 7. Tech Stack Summary

- **Next.js (App Router)** — frontend & routing
- **Tailwind CSS** — styling
- **Supabase** — auth, database, pgvector
- **LangChain + OpenAI GPT-4.1-mini** — AI logic
- **Email (via MailerLite)** — notifications
- **Optional: WhatsApp (via Twilio API)** — future comms

---

## 8. MVP Milestone Plan

### Phase 1: Foundation

-

### Phase 2: Feedback & Insight

-

### Phase 3: Coaching & Scale

-

---

## 9. Success Metrics

- 60% weekly active users
- 40% daily open rate (email)
- 70% action completion (daily suggestions)
-
  > 50 NPS score after 30 days

