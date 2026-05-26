# AA10-12 Athlete Portal — Handoff Brief

**File to build into:** `athlete-portal.html` (the static mockup is already in the repo at this filename — make it functional)
**Repo:** `scottbain-dot/aa-dash`
**Status:** Static mockup → functional portal

---

## What this is

A new portal for the **Grades 10–12 Athlete Academy programme** (25 students across multiple sports). The static mockup is already in the repo at `athlete-portal.html` — visual system locked, interaction patterns designed, four tabs scaffolded (Year, Load, Week, PBs). Your job is to make it work.

The portal sits alongside the existing AA programme:
- G9 students use `index.html` (Training Age dashboard), `grit-portal.html`, `strength-portal.html`, `fuel-lab.html`
- G10–12 students use this new portal as their primary surface at `athlete-portal.html`
- `academy-portal.html` is the older G10-12 surface with a Training Age hero — it stays in the repo for now but is not the focus. v1 of `athlete-portal.html` is the new primary portal for G10-12
- All portals share the same Google OAuth (`701639243214-ud6m1qtmc6ma0pq6v24tk39afbuhcblv...`), same Apps Script web app, same FIS Warriors branding

**Important context on Training Age:** The existing `academy-portal.html` surfaces a Training Age score with three pillars (Psychology / Physiology / Health & Skills). That scoring system was designed for G9 and doesn't yet have a defined G10-12 calculation. **Training Age is deferred — do not integrate it into v1 of `athlete-portal.html`.** A future iteration will integrate Testing data, Grit data, Nutrition data into a G10-12 Training Age model.

Read `CLAUDE.md` in the repo root before starting. This brief layers on top of it.

---

## How to work

**Work in 50-line increments.** Lad has explicitly said: assume he approves and move on. Don't pause for permission on routine work. Branch, commit, push regularly. He'll review via PRs.

**Use four lenses, applied at the right moments.** Not four full passes — that's wasteful. Each lens applies at a specific phase:

1. **Engineer lens — applied FIRST, before any code.** Read the mockup, map the data model, identify integration risks, decide file structure. Output a written architecture plan before writing the first line of functional code. Then proceed.

2. **Lad's lens (product owner) — applied at every architectural decision.** Ask: does this serve the programme? Does it match the pedagogical model? Lad's memory in `CLAUDE.md` has the context; respect it.

3. **Student lens — applied at every user flow.** When wiring Week logging, Year planning, PB capture, ask: would a tired Year 11 actually do this? Cut friction wherever possible. Two taps better than three. Sensible defaults better than empty forms.

4. **Design lens — applied at integration moments.** When real data lands in the designed UI, does the visual system survive? Does an empty Year grid look intentional, or broken? Does a Week with 14 modified sessions look manageable? Refine after wiring, not before.

**Surface genuine decisions, not housekeeping.** Things that need Lad to weigh in:
- Architectural choices (e.g., extend `Workout_Logs` or create `Training_Sessions`?)
- Data model trade-offs (one denormalised JSON blob vs. multiple tables?)
- Scope cuts when something proves harder than expected
- UX choices where the mockup leaves it ambiguous (e.g., when an athlete first opens Year tab with no plan, what shows?)

Don't ask about: variable naming, CSS tweaks, fixing your own bugs, refactoring decisions inside your own code. Just do them.

---

## v1 scope

**Ship all four tabs.** Lad's choice — narrow scope would lose the system effect.

Per tab, v1 means:

**Year tab**
- Athlete sees their year, with sport rows, training states, A-priority, testing windows, other commitments
- Tap any cell → block detail sheet opens
- Edit state, focus, weekly load target, key sessions, note → saves
- "Plan this week →" button switches to Week tab
- Empty state: first-time athlete sees a prompt to set vision + A-priority + first block

**Load tab**
- Weekly load chart across the year (44 bars)
- Bars coloured by training state (from Year tab data)
- Acute:Chronic ratio line overlay
- Three summary cards: this week load, ACWR, weeks logged
- Tappable bars → drills into that week (switches to Week tab for that week)
- Currently a placeholder in the mockup — you'll build the chart

**Week tab**
- The main daily-use surface, already fully designed in the mockup
- Today/Week view toggle (mobile)
- Tap any session → session detail sheet
- Log session: RPE pip selector, duration input, live load calculation, PB toggle, note
- Sessions populate from Year tab's "Key sessions" templates initially
- Carry-forward: planning next week loads this week as starting point
- Empty state: first-time athlete sees a "plan your first week" prompt

**PBs tab**
- List of PBs grouped by sport/exercise
- Each PB shows: name, value, date, previous value, trend
- "Add PB" → form with sport, exercise, value, date, note
- "Mark as PB" from session detail sheet creates a PB entry tied to that session
- Currently a placeholder in the mockup — you'll design and build

---

## Data model — engineer lens, applied first

Existing sheets you must integrate with:
- `Athletes` — student records
- `Workout_Logs` — strength session logs (currently strength-portal specific)
- `Config` — key/value config

New sheets needed for v1. The structure below is a starting proposal — refine it in your architecture plan.

**`Year_Maps`** — one row per athlete per academic year
```
Athlete_ID | Year | Vision | Sub_Goals_JSON | Sports_JSON | A_Priority_JSON | Testing_Windows_JSON | Other_Commitments_JSON | Updated
```
- `Sports_JSON`: array of `{name, isPriority, monthlyStates: [{month, state, focus, loadTarget, keySessions, note}]}`
- One JSON blob per row matches the existing pattern from `Grit_Journal.Challenge_JSON`

**`Training_Sessions`** — replaces `Workout_Logs` going forward, or extends it
- Engineer decision: extend `Workout_Logs` with new columns (`Sport`, `Sport_Type`, `RPE`, `Duration_min`, `Load_au`, `Planned_JSON`, `Status`, `Is_PB`), or create new `Training_Sessions` table?
- Pros of extending: one source of truth, strength sessions still work
- Pros of new table: cleaner schema, no migration risk
- **Decide and propose. Don't decide both ways.**

**`PBs`** — one row per personal best
```
Athlete_ID | Sport | Exercise | Value | Unit | Date | Previous_Value | Note | Session_ID | Updated
```
- `Session_ID` is optional, links back to the session it was set in if applicable

---

## Apps Script actions needed

Extending `COMPLETE-APPS-SCRIPT.gs`:

**Year_Maps:**
- `getYearMap(athleteId)` → returns full year map
- `saveYearMap(athleteId, yearMap)` → upsert
- `saveBlock(athleteId, sport, month, blockData)` → updates one block within the year map

**Training_Sessions:**
- `getWeek(athleteId, weekStart)` → all sessions for a week
- `saveSession(athleteId, sessionData)` → upsert session (handles plan + log)
- `getYearLoad(athleteId)` → weekly load aggregates for the load chart
- `computeACWR(athleteId)` → acute:chronic ratio

**PBs:**
- `getPBs(athleteId)` → all PBs sorted by date
- `savePB(athleteId, pbData)` → upsert

**Existing actions stay as they are.** Don't break the G9 portals.

---

## Visual system — design lens reference

The mockup is the source of truth. Don't drift. Specifically:

**Palette tokens** (already in the mockup's `:root`):
- `--ink: #1a1411` — dark surfaces, today column, primary text
- `--burgundy: #874B46` — Peak state, Hard intensity, primary actions, accent emphasis
- `--gold: #D4AF37` — Build state, Mod intensity, italic emphasis in headlines, sub-goal markers
- `--sage: #6b8268` — Maintain state, Easy intensity, done-session status
- `--cream: #faf3ed` — secondary surfaces inside cards
- `--bg: #fef8f6` — page background, off-white warm

**Type system:**
- Fraunces (serif) — block titles, day names in week grid, italic emphasis only on key headers
- Inter (sans) — everything functional (cards, metadata, buttons, data)
- Numbers (RPE, load, duration) get Inter 600 weight + slightly larger size than surrounding text
- Headings 22px / 28px / 32px depending on context; weights 400 (Fraunces) or 500-700 (Inter)
- 11–14px metadata; never below 11px

**State colour mappings — must be consistent across surfaces:**
- Build = gold, Maintain = sage, Peak = burgundy, Recover = pale cream, Off = hatched
- These apply to: Year grid cells, Load chart bars, intensity badges in Week tab, state pickers
- Don't introduce new colours for these states elsewhere

**Layout principles:**
- Dark navigation header at top (sticky)
- Block context bar below nav (warm, per-tab content)
- Content area (warm, scrollable)
- Sheets slide up from bottom (mobile) or anchor bottom-right (desktop ≥820px)
- Breakpoint at 820px

**Empty states matter.** First-time athletes will see a lot of blank surfaces. Design them with intent — don't show empty grids and call it done.

---

## Build order (recommended)

Don't follow this rigidly, but as a default:

1. **Engineer-lens architecture plan.** Read mockup, decide schema, write 1-page plan. *Surface to Lad.*
2. **Auth + page skeleton.** Wire OAuth, get athlete data into context, plumb the four tabs.
3. **Week tab functional.** This is the daily-use surface; ship it first. Session log working, carry-forward planning, sheet detail.
4. **Year tab functional.** Block sheet editing, save to Year_Maps. Empty state.
5. **PBs tab functional.** List + add. Wire "Mark as PB" from Week sheet.
6. **Load tab functional.** Weekly aggregates query, chart render, ACWR line.
7. **Polish pass — design lens.** Empty states, error states, loading states, mobile-specific fixes.
8. **Test pass — student lens.** Walk through every flow as a tired Year 11. Cut friction. Surface anything that needs a UX fix.

---

## Things that are NOT in scope for v1

To save you from scope creep:

- **Training Age scoring.** The existing portal had a Training Age hero with Psychology / Physiology / Health & Skills pillars. That model was designed for G9 and doesn't yet have a defined G10-12 calculation. It's deferred. Don't try to fold it in. Future iteration will integrate Testing data, Grit data, Nutrition data into a G10-12 Training Age model — but that work happens AFTER v1 ships.
- **AI insights.** No Anthropic API calls in this portal for v1. The existing `index.html` has hero/coaching insights — leave that pattern there.
- **Coach view.** Lad reviews via `admin.html`, which already exists. Extending admin to include G10–12 view is a separate task.
- **Multi-year history.** v1 is for the 2026–27 year only. Year carry-over is a v2 problem.
- **PB charts/trends.** v1 PBs are a list with current vs. previous. Trend lines = v2.
- **Notifications/reminders.** Sunday-plan reminders are a v2 problem. Athletes find their way to the portal.
- **Admin data entry.** Athletes own their year map. Lad doesn't enter blocks for them.

---

## Things to surface to Lad explicitly

Don't make these decisions silently. Surface them with a recommendation:

1. **Training_Sessions vs. extend Workout_Logs?** Your call, with rationale. *Engineer lens.*
2. **First-time-user flow.** When an athlete opens the portal having never used it, what's their first 60 seconds? *Lad + student lens.*
3. **Multi-sport athletes' Year tab.** Mockup shows one sport row. How do multi-sport athletes (Fokas, Mouritsen, etc.) see all their sports? Stack rows? Tabs within Year? *Design + Lad lens.*
4. **The 25-athlete cohort means data scale matters.** Will Apps Script handle daily reads for 25 students all logging on Sunday evening? Cache strategy? *Engineer lens.*
5. **When the year is "set" can blocks still be edited?** Always, until passed? Locked retrospectively? *Lad lens.*

---

## What success looks like

A G10–12 athlete opens `https://scottbain-dot.github.io/aa-dash/athlete-portal.html` on their phone Sunday evening. They:

1. See their Year tab — clear, their year, their sports, their goal
2. Tap the current month's block → see it's a Build phase, with key sessions defined
3. Switch to Week tab → see this past week, log the sessions they did
4. Plan next week using carry-forward from this week as a starting point
5. Mark one session as a PB → it shows up in PBs tab
6. Close the app. Total time: under 5 minutes.

That's the success state. Design and build toward it.

---

## Closing note from Lad

This is the most ambitious surface the AA programme has built. It needs to ship working, but it doesn't need to ship perfect. A working v1 that 25 athletes start using is worth more than a polished v2 that ships in October. Cut where you must. Ask when you genuinely need to. Build.
