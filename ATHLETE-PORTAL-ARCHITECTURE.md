# Athlete Portal v1 — Architecture Plan (engineer lens)

**File:** `athlete-portal.html` (wire up the existing mockup — do not redesign)
**Backend:** extend `COMPLETE-APPS-SCRIPT.gs` (no new script file)
**Branch:** `feat/athlete-portal-v1`
**Scope:** four functional tabs — Year, Load, Week, PBs. Training Age deferred.

This document is for **approval of the data-model decisions before any functional code is written.** Everything below is a proposal with a recommendation. The five items flagged **🔵 DECISION** are the ones I need a call on (the five from the brief + the genuinely architectural ones I found while reading the code).

---

## 1. How this slots into the existing system

The mockup already uses the exact AA conventions, so there is almost no new infrastructure:

- **Auth:** identical to `strength-portal.html` / `index.html` — same GSI `<script>`, same `g_id_onload` div with client ID `701639243214-ud6m1qtmc6ma0pq6v24tk39afbuhcblv...`, same `handleCredentialResponse` that JWT-decodes the email. I'll copy the `strength-portal.html` variant because it persists the session to `localStorage` (7-day expiry) so a tired athlete isn't forced to re-auth every Sunday.
- **Identity:** sign-in email → `GET ?action=getAthleteData&email=…` → `data.athlete.Athlete_ID`. This existing action is reused as-is for identity resolution. Everything else keys off `Athlete_ID`.
- **API transport:** reads = `fetch(URL?action=…)` → `.json()`; writes = `POST` with `Content-Type: text/plain` and a JSON body whose `action` field selects the handler. No JSONP, no CORS shims. Same `APPS_SCRIPT_URL` constant.
- **Backend dispatch:** new GET actions added to `doGet`'s `action` chain, new POST actions to `doPost`'s `data.action` chain, new handlers + `ensure*Sheet` helpers appended at the end of the file. Every G9 action is untouched.

**Nothing in the G9 path changes.** `Workout_Logs`, `Grit_Journal`, `getAllStudents`, etc. keep working exactly as they do now.

---

## 2. 🔵 DECISION 1 — `Training_Sessions` (new sheet) vs. extend `Workout_Logs`

**Recommendation: new `Training_Sessions` sheet. Do not extend `Workout_Logs`.**

Rationale:
- `Workout_Logs` is read by `getAllStudents` for the **admin session-count** display (G9 strength block progress). Pouring 25 G10–12 athletes' multi-sport sessions into that sheet would pollute those counts and risk breaking the admin panel — a direct violation of "don't break the G9 portals."
- The two session models genuinely differ. `Workout_Logs` is built around `Session_Type` + `Session_Number` (a numbered G9 strength block). The athlete portal needs per-session **Sport, planned-vs-logged status, RPE, duration, load (au), PB flag, and a planned-workout JSON** — a different shape.
- New sheet = zero migration risk, clean schema, clean queries scoped by `Athlete_ID`.
- Cost: a G10–12 athlete's strength sessions logged *in this portal* land in `Training_Sessions`, not `Workout_Logs`. That's fine — this portal is their primary surface; they won't use `strength-portal.html`. No data is shared or duplicated in practice.

**Proposed `Training_Sessions` schema (one row per session):**

| Column | Notes |
|---|---|
| `Session_ID` | UUID generated on create; stable key for plan→log upsert and PB linking |
| `Athlete_ID` | |
| `Date` | the day the session is scheduled/done (ISO `YYYY-MM-DD`) |
| `Week_Start` | Monday of that session's week (ISO date) — denormalised so the Load chart can aggregate without parsing every Date |
| `Sport` | e.g. "Swimming", "Strength" |
| `Name` | session title, e.g. "Intervals 8×200" |
| `Intensity` | `hard` / `moderate` / `easy` — drives the badge colour |
| `Planned_Duration` | minutes (from the plan) |
| `RPE` | 1–10, blank until logged |
| `Duration` | actual minutes, blank until logged |
| `Load_au` | RPE × Duration, computed on log |
| `Status` | `planned` / `done` / `modified` / `missed` |
| `Is_PB` | TRUE/FALSE |
| `Planned_JSON` | the workout steps (warm-up / main set / cool-down array) shown in the sheet |
| `Note` | free text |
| `Updated` | timestamp |

---

## 3. 🔵 DECISION (found while reading) — Load & ACWR formula + the bootstrap action

Two things the brief implies but doesn't pin down, both architectural:

**3a. Load formula.** I'll use **session-RPE load = RPE × duration (minutes)** — exactly what the mockup already computes (`load = rpe * dur`). Weekly load = sum of that week's `Load_au`. **ACWR = acute (this-week load) ÷ chronic (mean weekly load over the trailing 4 weeks).** Implication for the Load tab: ACWR is meaningless until ~4 weeks of data exist, so early-season it renders as "—" with a "needs 4 weeks of data" note rather than a misleading number. The 44-bar chart spans the academic year on **Monday-start weeks**; the year window is a single constant (proposed start **Mon 31 Aug 2026**, 44 weeks). Flagging so the empty/early-season Load state is intentional, not broken.

**3b. One bootstrap read instead of five.** This is my main answer to the Sunday-load concern (Decision 4). Rather than each athlete firing `getYearMap` + `getWeek` + `getYearLoad` + `getPBs` sequentially on open, I'll add **`getPortalBootstrap(athleteId)`** that returns athlete + year map + current week's sessions + PBs + weekly-load aggregates in **one round-trip**. Cuts the open-the-app request count by ~75%. Individual actions still exist for refresh-on-write.

---

## 4. Other new sheets

**`Year_Maps`** — one row per athlete per academic year (matches the brief, JSON-blob style like `Grit_Journal`):

```
Athlete_ID | Year | Vision | A_Priority_JSON | Sports_JSON | Testing_Windows_JSON | Other_Commitments_JSON | Updated
```

- `Sports_JSON`: `[{ name, isPriority, monthlyStates: [{ month, state, focus, loadTarget, keySessions, note }] }]`
- `state` ∈ `build | maintain | peak | recover | off` (the mockup's five states, mapped gold/sage/burgundy/cream/hatched).
- `A_Priority_JSON`: `{ sport, event, date }` — the one event the year points at.
- Dropped `Sub_Goals_JSON` from the brief's draft for v1 (vision + A-priority cover it; sub-goals add a form field a tired athlete won't fill). Easy to add later.

**`PBs`** — one row per personal best (matches the brief):

```
Athlete_ID | Sport | Exercise | Value | Unit | Date | Previous_Value | Note | Session_ID | Updated
```

- `Session_ID` links a PB back to the session it was set in (when created via "Mark as PB"); blank for manually added PBs.

---

## 5. New Apps Script actions

All additive. Naming follows the existing `handle*Action` / `ensure*Sheet` convention.

**Reads (GET):**
- `getPortalBootstrap` → athlete + year map + current week + PBs + load aggregates (the one-shot open)
- `getYearMap` → full year map for one athlete
- `getWeek&weekStart=…` → sessions for a given week
- `getYearLoad` → weekly load aggregates + ACWR series for the chart
- `getPBs` → all PBs, newest first

**Writes (POST):**
- `saveYearMap` → upsert the whole map
- `saveBlock` → patch one `{sport, month}` block inside the map
- `saveSession` → upsert one session (handles both planning and logging; generates `Session_ID` on create)
- `savePB` → upsert a PB (computes `Previous_Value` from the prior best for that sport+exercise)

**Caching:** server-side `CacheService` on `getYearLoad`/`getYearMap` per athlete (short TTL, invalidated on the matching write); client-side `localStorage` cache of the bootstrap payload, refreshed on every write. Reads stay scoped to one `Athlete_ID` — no full-cohort scans.

---

## 6. 🔵 DECISIONS 2–5 (the product/UX calls from the brief)

**🔵 DECISION 2 — First-time-user flow.** Recommendation: a first-time athlete lands on the **Year tab**, not Week, and sees a single focused empty state — **three inputs only**: pick a sport, name the A-priority (event + date), set this month's state. That's the 60-second flow. "Plan this week →" then seeds the Week tab from that block's key sessions. *Rejected:* dropping them on an empty Week grid (no context) or making them fill a 12-month grid before they can do anything (a tired Year 11 bounces).

**🔵 DECISION 3 — Multi-sport Year tab.** Recommendation: **stack one sport row per sport** in the Year grid (sports = rows, months = columns), not tabs-within-Year. Stacking keeps the whole cross-sport picture visible, which is the entire point of a year map and what makes the Load tab's combined-load view meaningful. Single-sport athletes simply see one row — reads as intentional. *Rejected:* tabs-within-tabs, which hide exactly the cross-sport overlap Lad wants athletes to see.

**🔵 DECISION 4 — Sunday-evening scale (25 athletes).** Recommendation: the **bootstrap action (one round-trip)** + per-athlete server cache + client `localStorage`. 25 athletes doing one combined read each is well inside Apps Script limits; the risk was 25 × 5 sequential reads, which the bootstrap removes. Writes are infrequent and per-athlete. No full-cohort queries anywhere in the athlete path.

**🔵 DECISION 5 — Editing a "set" year.** Recommendation: **blocks are always editable, never locked** — including past months (athletes may log retrospectively). This honours the CLAUDE.md autonomy principle and the brief's "athletes own their year map," and avoids a lock-state machine in v1. If you later want past months locked, that's a one-flag addition; deferring it.

---

## 7. File structure inside `athlete-portal.html`

Single file, inline CSS+JS, no build step (house style). I keep the mockup's markup and CSS verbatim and add:

- A **sign-in gate** (welcome screen visible by default; portal content `display:none` until auth) — copied from `strength-portal.html`.
- The four tabs become real views. The mockup's fully-designed **Week** markup stays; **Year**, **Load**, **PBs** get content containers built to the same visual system (state colours, Fraunces/Inter, sheet pattern, 820px breakpoint). The block-context bar updates its content per active tab.
- A small client state layer: `currentUser`, `athlete`, `yearMap`, `weekSessions`, `pbs`, cached in `localStorage`, refreshed on write.
- Loading state for the initial bootstrap; `showToast` for write feedback — both existing AA patterns.

---

## 8. Explicitly NOT in v1 (respecting the brief's locked scope)

Training Age scoring · AI insights · coach/admin view · multi-year history · PB trend charts · notifications/reminders · admin data entry. None of these get stubbed or half-built.

---

## 9. Build order after approval

1. **(this doc)** ← approve data-model decisions
2. Auth + page skeleton + tab plumbing
3. **Week tab** functional (daily-use surface first) → PR
4. **Year tab** functional + empty state → PR
5. **PBs tab** functional + "Mark as PB" wiring → PR
6. **Load tab** functional (aggregates + chart + ACWR) → PR
7. Design-lens polish (empty/error/loading states), then student-lens friction pass

I'll commit/push in ~50-line increments and open a PR at each logical chunk.

---

**Waiting on your call on the five 🔵 DECISION items above (or a "looks good, proceed").** Defaults I'll run with if you just say go: new `Training_Sessions` sheet, Year-tab-first onboarding with 3 inputs, stacked sport rows, bootstrap+cache, always-editable blocks.
