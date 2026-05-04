# CLAUDE.md - Athlete Academy Project

## Project Owner

**Scott Bain (Lad)** - PE Teacher at Frankfurt International School (FIS), Germany
- Teaches Grade 9
- Runs "Athlete Academy" program for student athletic development
- Competitive HYROX athlete (current PB: 1:17:18, target: sub-1:05)

---

## Git Workflow

When you finish making changes, always create a branch with the changes and provide the direct GitHub URL for me to create a pull request to main. Never push directly to main.

---

## Project Overview

The **Athlete Academy** is a comprehensive student athletic development system with multiple interconnected web portals. All portals share:
- Google Sign-In authentication (same OAuth client)
- Google Sheets as the database (via Apps Script API)
- FIS Warriors branding (burgundy #874B46 + gold #D4AF37)
- Common design language and UX patterns

---

## Files in This Repository

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Student Dashboard — Training Age radar, all scores, AI hero/coaching insights | ✅ Live |
| `strength-portal.html` | Strength workouts — technique levels (1–5), level-specific load tiers, Canvas video submission | ✅ Live |
| `admin.html` | Teacher admin panel — view all students, edit scores, current-session control, session check-ins, Grit coach feedback | ✅ Live |
| `grit-portal.html` | Grit Challenge — 8-session psychology assignment with planning, ideas, evidence reminders | ✅ Live |
| `apply.html` | Student application form — Google sign-in + form, writes to `Student_Applications` | ✅ Live |
| `nominate.html` | Coach nomination form — coach-facing, writes to `Nominations` | ✅ Live |
| `fuel-lab.html` | Nutrition & recovery curriculum + 10-question quiz, plus teacher quiz-stats view | ✅ Live |
| `profile-mockup.html` | Static design mockup for "Maya Hoffmann" — no backend wiring; design reference only | 🎨 Mockup |
| `COMPLETE-APPS-SCRIPT.gs` | Google Apps Script backend for all portals (single web-app deployment) | ✅ Live |
| `assets/` | Marketing screenshots used by `nominate.html` and `apply.html` | — |

---

## API Endpoint

All portals share a **single Apps Script web-app deployment**:

```
https://script.google.com/macros/s/AKfycbwbJOS1zq2rn0LyKREtYfG1uMZMGJJvGaIz71mPowkFCvukic3FwnXDOYzRv8kCrODI/exec
```

Used by: `index.html`, `strength-portal.html`, `admin.html`, `grit-portal.html`, `apply.html`, `nominate.html`, `fuel-lab.html`.

The script also calls Anthropic's API (`https://api.anthropic.com/v1/messages`, model `claude-sonnet-4-20250514`) for the dashboard's hero insight and coaching carousel. The key is read from Apps Script `Script Properties` under `ANTHROPIC_API_KEY`.

---

## Google OAuth Configuration

**Client ID:** `701639243214-ud6m1qtmc6ma0pq6v24tk39afbuhcblv.apps.googleusercontent.com`

Used by every portal that requires sign-in (all except `profile-mockup.html`).

---

## Branding & Design System

### Colors
Core brand tokens shared across portals:
```css
--burgundy: #874B46;
--burgundy-dark: #6a3a36;   /* index.html uses #6b3430 as --primary */
--burgundy-light: #a06b66;
--gold: #D4AF37;
--gold-light: #f5e6b3;
--black: #1a1a1a;            /* index.html uses #1d1b1b */
--white: #ffffff;
--off-white: #f8f6f5;        /* page background is typically #fef8f6 */
--green: #22c55e;
--green-dark: #16a34a;
--amber: #f59e0b;
```
Per-file extras worth noting:
- `index.html`: also defines `--primary`, `--primary-container`, `--secondary`, `--surface`, `--text`, `--text-muted`, plus medal tones (`--bronze`, `--copper`, `--silver`).
- `fuel-lab.html`: editorial palette with `--ink`, `--ink-soft`, `--ink-mute`, `--cream`, `--line`, plus energy-system colours `--red-sys`, `--yellow-sys`, `--green-sys`.

### Typography
- Primary UI: **'Inter'** (Google Fonts) with `'Segoe UI', system-ui, sans-serif` fallback.
- Display / hero headings on `apply.html`, `nominate.html`, `fuel-lab.html`: **'Barlow Condensed'**.
- Editorial headings on `fuel-lab.html`: **'Fraunces'** serif.
- Weights in use: 400 (body), 500/600 (labels), 700 (headings), 800–900 (display numbers).

### UX Preferences
- Plain language — students with learning needs should understand everything
- Hide complexity — examples and scoring info behind toggles
- Show real data — actual scores not placeholders
- Calendar with real dates — not just "Session 1, 2, 3"
- Autonomy — don't over-prescribe; let students plan
- Warm, encouraging tone throughout
- Single HTML files with inline CSS and JS — no build step

---

## Google Sheets — Tabs the Apps Script reads/writes

| Sheet | Used by | Key columns |
|-------|---------|-------------|
| `Athletes` | all student lookups | `Athlete_ID`, `Email`, `Name` (or `First_Name` + `Last_Name`), `Grade` (or `Year_Group`), `Gender`, `Sport_1/2/3` |
| `Strength` | dashboard, strength portal, admin | `Athlete_ID`, `Date`, per-pattern `_Tech` + `_Str_L2..L5` (+ legacy `_Str`), `Notes` |
| `Performance` | dashboard | `Athlete_ID`, `Date`, `Broad_Jump_cm`, `40m_sec`, `5_10_5_sec`, `Cooper_m` |
| `Mobility` | dashboard | `Athlete_ID`, `Date`, `ASL`, `Trunk_Stability`, `Shoulder_Mobility` (each 0–3) |
| `Recovery` | dashboard | `Athlete_ID`, `Date`, `Recovery_Score`, `Nutrition`, `Movement_Technique` (ignored) |
| `Psych_Assessments` | dashboard, admin psych update | `Athlete_ID`, `Date`, `Mindset`, `Focus_Engagement`, `Effort_Work_Ethic`, `Coachability`, `Mental_Toughness` |
| `Grit_Journal` | dashboard, grit portal, admin | `Athlete_ID`, `Date`, `Grit_Assignment`, `Challenge_JSON`, `Challenge_Status`, `Challenge_Updated` |
| `Workout_Logs` | strength portal, admin session counts | `Athlete_ID`, `Date`, `Session_Type`, `Session_Number`, `Exercises_Completed` (JSON), `Notes`, `Duration`, `Completed`, `RPE` |
| `Config` | admin | key/value pairs (`CurrentSession` is the active one) |
| `Observations` | admin check-ins | `Timestamp`, `Session_Number`, `Date`, `Athlete_ID`, `Athlete_Email`, `Rating`, `Rating_Label` |
| `Nominations` | nominate.html | timestamp + coach + athlete + 4 ratings + reason |
| `Student_Applications` | apply.html | timestamp + student + nominator + commitment rating + why |
| `FuelLab_Quiz` | fuel-lab.html | `Timestamp`, `Email`, `Name`, `Score`, `Total`, `Q1..Q10` (1/0/blank per question) |

Sheets are auto-created by the Apps Script when missing (`ensure*` helpers). Most reads use the most-recent row by `Date`. Strength/Grit reads pick the most-recent row per athlete.

---

## Training Age Framework

```
Training Age = (Psychology × 0.35) + (Physiology × 0.35) + (Health & Skills × 0.30)
```

### Psychology Pillar
Average of: Mindset, Focus & Engagement, Effort & Work Ethic, Coachability, Mental Toughness.
- Mindset, Focus_Engagement, Effort_Work_Ethic, Coachability, Mental_Toughness come from `Psych_Assessments` (latest row by Date).
- `Grit_Journal.Grit_Assignment` is also surfaced on the athlete object (used elsewhere on the dashboard) but is *not* part of the Psychology average above.

### Physiology Pillar
Average of non-zero values from:
- Strength — per-pattern composite, see scoring logic below
- Broad Jump — raw cm from `Performance.Broad_Jump_cm`, gender thresholds → 1–5
- 40m Sprint — raw seconds from `Performance.40m_sec`, gender thresholds → 1–5
- Agility (5-10-5) — raw seconds from `Performance.5_10_5_sec`, gender thresholds → 1–5
- Cooper Test — raw metres from `Performance.Cooper_m`, gender thresholds → 1–5
- Mobility — average of `Mobility.ASL`, `Mobility.Trunk_Stability`, `Mobility.Shoulder_Mobility`, each /3 × 5 (FMS-style 0–3 normalised to a 1–5 scale)

### Health & Skills Pillar
Average of:
- Movement Technique — derived from the 6 Tech scores in the Strength sheet (see below)
- Recovery Score — manually entered 1–5 from `Recovery.Recovery_Score`
- Nutrition — manually entered 1–5 from `Recovery.Nutrition`

---

## Strength & Movement Technique Scoring (index.html)

**This is critical — do not revert to the old flat average logic.**

### Strength sheet columns (current schema)

For each pattern (Squat, Hinge, Push, Pull, Lunge, Press) the sheet stores:
- `{Pattern}_Tech` — current technique level, 0–5
- `{Pattern}_Str_L2`, `{Pattern}_Str_L3`, `{Pattern}_Str_L4`, `{Pattern}_Str_L5` — load-tier score (0–5) achieved at each technique level
- `{Pattern}_Str` — **legacy** flat column, kept only as a fallback during data migration

Plus shared columns: `Athlete_ID`, `Date`, `Notes`.

### Strength Score (Physiology pillar)

For each of the 6 movement patterns:
1. Read `{Pattern}_Tech` (0–5).
2. If `Tech ∈ [2,5]`, read the matching level-specific column `{Pattern}_Str_L{Tech}`. Otherwise Str = 0.
3. **Fallback:** if the level-specific column is empty / 0, fall back to legacy `{Pattern}_Str` (this fallback exists in both `index.html` and `getAllStudents` and should be removed once all data is migrated).
4. Pattern sub-score:
   - If both Tech and Str > 0 → `(Tech + Str) / 2`
   - If only Tech > 0 → `Tech`
   - If only Str > 0 (data error) → `Str`
   - Otherwise → 0

Final Strength score = sum of all 6 pattern sub-scores / 6.

Always divide by 6 — unassessed patterns count as zero and pull the score down intentionally. A student with more patterns assessed should score higher than one with fewer.

### Movement Technique Score (Health & Skills pillar)

- Sourced from the 6 `{Pattern}_Tech` values in the Strength sheet — NOT from `Recovery.Movement_Technique`.
- Movement Technique = sum of all 6 `{Pattern}_Tech` values / 6.
- Always divide by 6 — zeros count.
- The Recovery sheet still has a `Movement_Technique` column but it is ignored in the dashboard calculation.

---

## Grit Portal — Full Detail

### Purpose
8-session athletic development challenge building Psychology scores: Mindset, Mental Toughness, Grit.

### Timeline (Spring 2026)

The grit-portal display strings show day + date only ("Wed 25 Mar"); the year is hard-coded in `admin.html`'s session-checkin date list as 2026.

| Date | Session |
|------|---------|
| Wed 25 Mar 2026 | Session 1: Baseline measurement |
| 30 Mar – 12 Apr 2026 | Spring Break (optional practice) |
| Wed 15 Apr 2026 | Session 2 |
| Mon 20 Apr 2026 | Session 3 |
| Wed 22 Apr 2026 | Session 4 |
| Mon 27 Apr 2026 | Session 5 |
| Tue 5 May 2026 | Session 6 |
| Wed 13 May 2026 | Session 7 |
| Tue 19 May 2026 | Session 8: Final test |
| Thu 22 May 2026 | **DUE** — All evidence in Google Drive folder |

### Challenge Types

**Fitness** — improve an official AA fitness score

Categories: Broad Jump, Sprint, Agility, Cooper

Strength is also a Fitness category but has its own custom setup (`grit-portal.html` lines ~430–467):
- **Exercise** — free text (e.g. "Back Squat")
- **Starting weight or reps** — single text input (placeholder `e.g. 20kg or 15 reps`)
- **Goal weight or reps** — single text input (placeholder `e.g. 20kg or 15 reps`)
- Inline hint: "If your goal is max reps, aim for at least 5 — we don't test single rep maxes at this stage." (Hint only — not enforced.)
- Progress display reads `${exercise}` then `${baseline} → ${target}` then `Now: ${current}`.
- Progress % based on the numeric portion of the strings: `(current - start) / (goal - start) × 100`.
- Session check-in prompt for Strength sessions 2–7: "What are you lifting or hitting now? (kg or reps)".

All other Fitness categories (Broad Jump, Sprint, Agility, Cooper) use a single text baseline/target flow — start score, current score, goal score.

**Personal Challenge** — student-defined

Categories (`PERSONAL_OPTIONS` in `grit-portal.html`):
- **Sport Skill** 🎯 (`id: sport`) — sport skills, game tactics, decision making under pressure
- **Movement** 🤸 (`id: movement`) — athletic movement quality: sprinting, lifting, jumping, landing, changing direction
- **Endurance** 🏃 (`id: endurance`) — running/aerobic work outside the official Cooper path; idea content currently mirrors the Sport Skill ideas as a fallback
- **Mobility** 🧘 (`id: mobility`) — flexibility, range of motion, joint control
- **Custom** ✨ (`id: custom`) — anything else, with a free-text description

### Setup Flow (4 Steps)
1. **Choose Type** — Fitness or Personal Challenge (fitness scores visible on Fitness card)
2. **Choose Focus** — specific area, with "Need ideas?" toggle showing example session structure
3. **Set Goal** — baseline, target, measurement method, difficulty (1–5), why
4. **Name Excuses** — list barriers + commitment checkbox

### Session Modals

**Sessions 2–7 (planning structure)**
1. What do you want to achieve in this session?
2. What will you actually do? Be specific.
3. How will you know if it worked?
4. What excuse might try to stop you?
5. How will you beat it?
6. "Need ideas?" toggle — category-specific tabbed panel (see below)

**Session 1 (baseline planning)**
Same as sessions 2–7 but with an additional first question:
- "What did you measure? What's your baseline?" — replaces the session goal question

**Session 8 (final reflection)**
1. How did you re-measure? What was your final result?
2. What changed most over the 8 sessions?
3. What made the biggest difference to your progress?
4. What would you do differently?
5. What are you most proud of?

**Completed sessions**
Completed sessions are clickable in the timeline. Reopening shows a read-only view of all saved responses with a "View only" label and a Close button only — no editing.

### "Need ideas?" Toggle — Session Modals

Appears in all session modals (sessions 1–7). Opens a tabbed panel with three tabs:
- **Early** (Sessions 1–3) — default for sessions 1–3
- **Middle** (Sessions 4–6) — default for sessions 4–6
- **Later** (Sessions 7–8) — default for sessions 7–8

All three tabs are always browsable regardless of current session.

Content is category-specific based on the student's chosen challenge type. See full idea lists below.

#### Fitness — Broad Jump
- **Early:** Measure your jump and record it — distance from takeoff line to nearest heel / Work on your takeoff position — hip hinge, arm swing, weight loaded back / Practise the landing — a controlled landing means the jump counted / Jump for distance not just practice — treat every rep like a test attempt
- **Middle:** Focus on the arm swing — most improvement at this age comes from using arms properly / Practise the full sequence slowly: load, swing, push, land / Add some single leg work to build the power you're drawing on / Film from the side to see where you're losing distance
- **Later:** Re-measure under the same conditions as Session 1 — same surface, same shoes / Take 3 attempts and record your best — that's how the test works / Warm up thoroughly before your final test attempts

#### Fitness — Sprint
- **Early:** Time yourself over the exact distance of your test and record it / Work on your starting position — most time is lost in the first two steps / Practise your reaction — from a still position, explode as fast as possible / Run at full effort every rep — sprint training only works at maximum intensity
- **Middle:** Focus on acceleration mechanics — stay low, drive back, don't stand up too early / Do short sharp reps with full recovery between — quality over quantity / Work on your arm drive — it directly affects your leg speed / Film from the side to check your first-step posture
- **Later:** Re-time yourself over the exact same distance as Session 1 / Taper slightly before your final test — fresher legs run faster / Warm up properly — sprinting cold is slower and risks injury

#### Fitness — Agility
- **Early:** Run the full test and record your time — note where you slow down most / Walk through the pattern first so you know every turn before you run it / Work on your deceleration — slowing down fast is usually the limiter / Practise each direction change in isolation before putting it together
- **Middle:** Focus on your plant foot — a strong plant means a faster change of direction / Lower your centre of gravity on the turns — stay low through the change / Do the full pattern at 80% pace with perfect footwork before going flat out / Add fatigue — practise when tired to see what breaks down
- **Later:** Re-run the full test under the same conditions as Session 1 / Run it at full effort with a proper warm up — treat it like the real test / Focus on the turns you identified as slow in early sessions

#### Fitness — Cooper
- **Early:** Run for 12 minutes and record your distance — that's your baseline / Note your pacing — did you go out too fast, too slow, or was it even? / Identify where you slowed down most and why / Build your weekly running volume gradually — consistency matters more than intensity early
- **Middle:** Practise running at your target pace — work out what that feels like / Add one harder session per week — intervals or a tempo effort / Don't neglect easy running — it builds the aerobic base you need / Work on pacing discipline — even splits almost always beat going out hard
- **Later:** Do a full 12-minute time trial before your final test to check where you are / Taper in the last few days — arrive at the test fresh not tired / Nail your pacing from the first minute — going out too fast is the most common mistake

#### Fitness — Strength
- **Early:** Record your starting weight and reps — that's your baseline / Focus on technique before adding load — a solid pattern now means bigger gains later / Identify which movement feels weakest and start there / Keep volume low and quality high in early sessions
- **Middle:** Add small amounts of load each session — progress doesn't have to be dramatic to be real / When technique breaks down drop the weight and rebuild it / Train the supporting muscles too — most strength plateaus are a weakness somewhere else / Push to a challenging effort level not just comfortable
- **Later:** Re-test your working weight the same way you did in Session 1 / Peak your effort in Session 7 then back off slightly before the final test / Don't add new exercises late — refine what's already working

#### Personal Challenge — Skill or Strategy
- **Early:** Measure your starting point — film it, time it, or count reps so you have something to compare later / Identify the one part of the skill that breaks down most often / Slow everything down and focus on doing it right before doing it fast / Pick one specific situation to practise not the whole skill at once
- **Middle:** Put yourself under pressure — tired, on a timer, competitive — and see what holds up / Target the weakness you found early on not just the parts you're already good at / Practise in the context it actually happens in not just in isolation / Watch footage of someone good at it and find one thing you're still not doing
- **Later:** Re-test the same way you did in Session 1 — same conditions, same measure / Identify what's still weak and spend your last sessions there / Practise under match or game conditions so the skill is ready for real use

#### Personal Challenge — Movement & Technique
- **Early:** Film yourself and note what you see — side on or behind is usually most useful / Measure your starting point — a timed drill, a max effort, or a technique checklist / Break the movement into parts and identify which part feels least controlled / Do it at 50% speed with full focus on position before adding any load or pace
- **Middle:** Drill the weakest part in isolation before putting the whole movement together / Add load or speed only once the basic pattern feels solid / Film again and compare to your Session 1 footage — look for specific changes / Push into the range or speed that feels uncomfortable but controlled
- **Later:** Re-test under the same conditions as Session 1 — same drill, same load, same measure / Put the full movement together at real effort not just practice pace / Identify any remaining faults and prioritise them in your last sessions

#### Personal Challenge — Mobility
- **Early:** Measure your range — a specific position, a distance, an angle — so you can track change / Find the position that feels hardest and spend the most time there / Identify whether your limit is tightness, weakness, or control — they need different approaches / Don't just stretch — move through the range so your body learns to use it
- **Middle:** Add light load to the stretch once you're warm — passive stretching only goes so far / Work the range through movement not just static holds / Spend at least 10 minutes on your target area every home session / Push slightly further than last time — small increments add up
- **Later:** Re-measure the same way you did in Session 1 — same position, same conditions / Test your mobility inside a real movement not just an isolated stretch / Use your final sessions to consolidate the range you've built not push further

#### Personal Challenge — Custom
- **Early:** Define what "better" looks like in a way you can actually measure — if you can't measure it you can't track it / Set your baseline the same way you'll test at the end / Identify the one thing that's limiting your progress right now / Keep it simple early — understand the problem before trying to solve it
- **Middle:** Target the weakness you identified not just the parts that are already improving / Do the thing you've been avoiding — that's usually what matters most / Find the hardest version of your challenge and use it to set your ceiling / Check in on your original goal — are you still working towards it or drifting?
- **Later:** Re-test the same way you did in Session 1 — same conditions, same measure / Reflect on what actually moved the needle and what was wasted effort / Use your last sessions to address anything that's still weak before the final test

---

## Apps Script Actions Reference (`COMPLETE-APPS-SCRIPT.gs`)

`doGet` dispatches on `?action=…` (or returns student data when `?email=` is supplied with no action; `?admin=true` returns every athlete). `doPost` reads `data.action` from the JSON body.

### GET actions
| Action | Purpose | Caller |
|--------|---------|--------|
| `getAthleteData` | Build full athlete object (psych, strength, performance, mobility, recovery + history) | index, strength, grit |
| `getAllStudents` | All athletes + strength + Workout_Logs session counts | admin |
| `getConfig` / `setConfig` | Read/write `Config` sheet (e.g. `CurrentSession`) | admin, strength |
| `updateStudent` | Write Tech / Str_Lx / Notes to `Strength` (also exposed via POST) | admin |
| `saveWorkout` | Append a row to `Workout_Logs` (also exposed via POST) | strength |
| `getLastSession`, `getLastSessionByType`, `getWorkoutHistory`, `getNextWeights` | Workout history helpers | strength, index |
| `getGritChallenge` | Latest `Challenge_JSON` for one athlete | grit, admin |
| `getGritAdminData` | Most-recent challenge per athlete + name/email | admin |
| `getSessionPlanning` | All active challenges' session-N data + `hasPlanned` flag | admin |
| `getObservations` | Read `Observations` (optionally filtered by session) | admin |
| `getFuelLabQuizStats` | Latest-per-student quiz stats: avg score, per-question %, easiest/hardest | fuel-lab teacher view |

### POST actions (JSON body)
| Action | Purpose | Caller |
|--------|---------|--------|
| `saveWorkout` | Log a strength session | strength |
| `updateStudent` | Edit strength scores (any of `_Tech`, `_Str`, `_Str_L2..L5`, `Notes`) | admin |
| `saveGritChallenge` | Persist `currentChallenge` JSON blob to `Grit_Journal` | grit, admin |
| `saveCoachFeedback` | Write `coachFeedback` + `requiresPlanningFirst` into a session inside `Challenge_JSON` | admin |
| `updatePsychScores` | Write Mindset / Mental_Toughness / Grit (1–5) to today's `Psych_Assessments` row | admin |
| `getAICoachingInsights` | Anthropic call → JSON insights for the dashboard carousel | index |
| `getHeroInsight` | Anthropic call → single-sentence hero line | index |
| `saveNomination` | Append to `Nominations` | nominate.html |
| `saveStudentApplication` | Append to `Student_Applications` | apply.html |
| `saveObservation` | Append/update `Observations` row for athlete + session | admin |
| `submitFuelLabQuiz` | Append a row to `FuelLab_Quiz` | fuel-lab.html |

`getAICoachingInsights` and `getHeroInsight` need `ANTHROPIC_API_KEY` set in Apps Script `Script Properties`.

---

## Data Architecture

- All challenge data saved as a JSON blob in `Grit_Journal.Challenge_JSON`. Status and last-updated timestamp are tracked in sibling columns `Challenge_Status` and `Challenge_Updated`.
- `persistChallenge()` sends the entire `currentChallenge` object on every save.
- Session data stored at `currentChallenge.sessions[n-1]`. Coach feedback (when entered from admin) is written into the same session object as `coachFeedback` and `requiresPlanningFirst`.
- New field names: `goal`, `baseline`, `plan`, `measure`, `obstacle`, `counter` (sessions 1–7), `finalRemeasure`, `changed`, `difference`, `differently`, `proud` (session 8).
- Legacy field names still supported for backwards compatibility: `what`, `excuse`, `overcome`, `learned`, `finalMeasure`, `reached`, `almostQuit`, `lesson`.

---

## Evidence Submission

- Evidence due: Thursday 22 May
- Students add photos, videos, screenshots of practice and progress to a shared Google Drive folder
- The Google Drive folder link is posted in the Canvas assignment — the portal itself does not link to Canvas or Google Drive
- Students are reminded after each session to add evidence to their teacher's shared folder

---

## Psychology Scoring

| Component | Who Scores | Based On |
|-----------|-----------|----------|
| **Mindset** (1–5) | Teacher | Goal ambition, difficulty rating, "why", Session 8 reflection |
| **Mental Toughness** (1–5) | Student self-assesses, teacher adjusts | Obstacle/counter evidence across all sessions |
| **Grit** (1–5) | Teacher | Sessions completed, home practice logged, progress vs goal |

---

## Grit Challenge Rubric (1–7 school scale)

### Mindset
- **Not Yet (1–2):** Set an easy unchallenging goal or showed no real understanding of why it mattered. Little reflection on growth in planning or final session.
- **Almost (3–4):** Goal showed some ambition but reasoning was vague. Some growth mindset present but inconsistent.
- **Meeting (5):** Set a genuinely challenging goal with a clear "why". Consistently approaches setbacks as part of the process. Session 8 reflection shows real self-awareness.
- **Exceeding (6):** Goal was ambitious and well-reasoned. Reframes difficulty positively across planning and reflections. Session 8 shows deep understanding of what drove their growth.
- **Leading (7):** Chose the hardest version of their challenge, articulated exactly why it mattered, and showed through every session and final reflection that they understand how challenge drives development.

### Mental Toughness
- **Not Yet (1–2):** Named excuses in setup but showed no evidence of actually overcoming them. Effort dropped when sessions got hard or inconvenient.
- **Almost (3–4):** Shows mental toughness in easier sessions but obstacle/counter planning wasn't followed through consistently.
- **Meeting (5):** Named realistic obstacles and followed through on their plan to beat them across most sessions. Evidence shows they trained when it wasn't easy.
- **Exceeding (6):** Consistently identified and overcame obstacles across all sessions. Evidence is specific — they can point to moments where they pushed through difficulty.
- **Leading (7):** Every session shows deliberate preparation for obstacles and clear evidence of overcoming them. Thrives under pressure and demonstrates exceptional mental discipline.

### Grit
- **Not Yet (1–2):** Completed fewer than half the sessions. Little or no home practice evident. Evidence is sparse.
- **Almost (3–4):** Completed most sessions but home practice was minimal. Effort was uneven across the block.
- **Meeting (5):** Completed all or nearly all sessions. Some home practice evident. Consistent commitment across the 8-session block with clear progress toward goal.
- **Exceeding (6):** Completed every session with strong evidence. Home practice goes beyond the minimum. Progress is measurable and the challenge was pursued with genuine intensity.
- **Leading (7):** Exceptional follow-through across all 8 sessions plus consistent home practice well above the 3-hour target. Evidence is thorough, progress is significant, commitment never wavered.

---

## Known Tech Debt / Follow-ups

- **Legacy `{Pattern}_Str` column.** Both `index.html` and the Apps Script `getAllStudents` include a `TEMPORARY FALLBACK` to the old flat `_Str` column when `_Str_L{Tech}` is empty. Remove once all data is migrated to level-specific columns.
- **`Recovery.Movement_Technique`.** Column still exists in the sheet but is ignored — Movement Technique is derived from Strength `_Tech` columns. Safe to delete after a sheet audit.
- **Grit Endurance ideas.** `SESSION_IDEAS.personal.endurance` in `grit-portal.html` currently mirrors the Sport-Skill copy as a placeholder; replace with endurance-specific ideas.
- **Grit Strength setup inputs.** Currently single text fields ("e.g. 20kg or 15 reps") with no numeric validation. If we want enforced numeric kg + reps + min-5-reps, the inputs need to be split.
- **Hero / coaching insights.** Both call Anthropic with `claude-sonnet-4-20250514`; bump to a current model when refreshing.
- **Year is hard-coded.** Session-checkin dates in `admin.html` are 2026 literals; update each spring.

---

## Style & Communication Preferences

- Use plain language — students with learning needs should understand everything
- Hide complexity behind toggles
- Show current data — actual scores not placeholders
- Calendar with real dates
- Evidence reminders after each session
- Autonomy — don't over-prescribe session content
- Working demos over theoretical discussion
- Single HTML files with inline CSS and JS — no build step
