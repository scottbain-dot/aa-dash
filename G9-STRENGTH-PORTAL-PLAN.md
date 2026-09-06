# G9 Strength Portal v2 — Plan

**Status:** proposal for discussion (Sept 2026)
**Replaces:** `strength-portal.html` (the 2025–26 A/B session portal)
**Sits beside:** `portal-lab.html` (G10–12), `index.html` (G9 dashboard), `admin.html`

Read `CLAUDE.md` first. This plan layers on top of it. The identity rule (all data calls by `Athlete_ID`, email only at bootstrap) applies to every new endpoint here.

---

## 1. The idea in one paragraph

The current portal is a "teacher unlocks, student executes" machine. The G10–12 portal is "athlete owns the plan". The G9 portal should be the staged handover between those two. Students start by following a structure, then choose inside it, then build their own program in the same shape (and the same sheets) the academy uses. The six movement patterns and technique levels stay as the spine the whole way through, because that is what feeds Training Age and what makes G9 different from G10–12. Everyone reaches the last stage; it just looks different for each kid, because the program they can build is shaped by their own levels.

---

## 2. The three stages

| Stage | What they're doing | What the portal is | How it opens |
|---|---|---|---|
| **1 · Intro to Training** | Learning how a session works, how the gym works, and practising the six foundation movements at bodyweight, every lesson | A lesson companion: a three-part session (Prep, Move, Finish), the movement passport, the concept checklist | Everyone starts here |
| **2 · Foundations** | Running the Foundation program (full body A, full body B, athletic basics), levelling up patterns, loaded work pattern by pattern | A workout portal: the full six-part EXOS session map, this week's sessions, Workout Mode, swaps, film and test flows | Teacher marks the unit complete, for the class or per student. Stamps do not gate it |
| **3 · My Program** | Building and running their own repeating week, in the same shape as the academy | A program builder: phase × goal builder, weekly template, PBs | Teacher opens it per student from admin ("Ready to build"). The portal shows a readiness signal to help the call |

**Unlocks are per pattern, not per stage.** A stamped Squat unlocks goblet loading for squat while Push stays bodyweight. The current portal already works this way underneath (technique level decides technique-focus versus loaded); the passport just makes it visible. A student who reaches Foundations with two patterns unstamped keeps practising those at bodyweight inside the Foundation program until they are stamped.

**Everyone reaches Stage 3.** The builder only offers exercises their technique levels qualify for, so a student at level 1 in every pattern still gets a valid bodyweight-and-kettlebell program, and a student at level 3 gets barbells. The stage is the same; the program differs.

---

## 3. The Intro to Training unit (Stage 1)

**Same shape every lesson: Prep → Move → Finish.** Prep merges pillar prep and movement prep as "warm up". Move is all six patterns at bodyweight, every lesson (Foundation A and B alternate the emphasis, but every pattern gets practised). Finish is a short finisher and cool down. The full six-part EXOS map waits for Foundations, so the session shape gets richer as they progress.

**Stamps land whenever they land.** Each lesson the student ticks the patterns they practised, so the passport shows "Squat · 5 practices". You stamp level 1 for any student, any pattern, any lesson, from the roster view on your phone. Some students have six stamps by lesson 4, some by the end, some carry one or two into Foundations.

**Lessons are a concept sequence, not a stamp schedule.** Each lesson adds one idea. However many lessons it takes.

| Concept | In the gym | In the portal | Checklist tick |
|---|---|---|---|
| The gym and the shape | Tour, safety, etiquette, re-racking. Prep → Move → Finish walked through once | Sign in. See today's three parts. Tick the patterns practised | Gym rules |
| How do you know it's good? | The six criteria per pattern, partner checks | Criteria on every pattern tile. Practice counts start | Partner-checked a movement |
| Tempo and control | 3-2-1 tempo, pause at the bottom, control down | Tempo shown on the Move block | Held a tempo |
| Jump and land | Drop landing, low box jump and land, in Prep | Prep grows a jump-and-land step | Landed quietly |
| Reading a prescription and first load | Sets × reps, choosing a weight, "last few reps hard". Goblet squat and KB deadlift for stamped patterns | Log a weight for the first time. "Last time" starts working | Logged a weight |
| Effort and RPE | The honesty rule, what a 7 feels like | RPE prompt at the end of the session | Rated a session |
| Finishing properly | Finisher, cool down, foam roll, sleep and fuel (Fuel Lab link) | Finish block gets its steps | Finished a session properly |
| Run it yourself | Full session with no teacher cues. You observe | Everything they need is on screen | Ran a session alone → unit complete |

Med ball, energy systems and regeneration as *named* components are not in the intro. They arrive with the full map in Foundations. Which of jump-and-land, med ball and the finisher belong in the intro at all is an open call (§9).

**Level 1 sign-off is in class, by you, from admin on your phone.** Canvas video stays for level 2 upwards. Six videos per beginner for bodyweight movements is too much friction.

---

## 4. What it looks like to them

Three home screens, one per stage. Same header, same passport, more ownership each time.

**Stage 1 home**
- "Intro to Training · Wed 16 Sep"
- Today's session in three parts: Prep, Move, Finish. Move lists all six patterns with a tick for "practised today"
- The passport: six tiles showing practices so far, and a stamp once you sign it off
- The concept checklist, ticked as each idea is covered
- One button: "Start today's session"

**Stage 2 home**
- "Foundations"
- The full six-part EXOS session map appears here for the first time
- This week: A · B · Athletic basics, with done states
- Next session card with its steps, and a "Start" that opens Workout Mode
- Passport now shows level, tier and the next step per pattern ("film next", "ready to test", "12 kg")
- "Swap" on any exercise, limited to strict matches (same region, pattern, laterality)

**Stage 3 home**
- "My Program"
- Their repeating week (Mon / Wed / Fri), "Build or edit my program"
- Next up, PBs, and the passport as a strip
- This is `portal-lab`'s My Program tab, gated by levels

Plain language throughout. Examples and scoring detail behind toggles. Real dates, not "Session 3".

---

## 5. What changes underneath

### Keep
- `Strength` sheet, `_Tech` and `_Str_L2..L5` columns, admin as the only writer
- The six patterns, five levels, videos and criteria
- The honesty prompt when increasing weight, the RPE prompt, the localStorage session restore

### Borrow from `portal-lab.html`
- `EXERCISE_LIBRARY` with its EXOS `component` tags, `swapCandidates`, Workout Mode, `Weekly_Templates`, `Training_Sessions`, the phase × sport builder, `getPortalBootstrap`
- Add a `portal: 'g9'` flag to the bootstrap so the same call serves both

### Bridge the two taxonomies

| G9 pattern | Library `pattern` |
|---|---|
| Squat | `squat` |
| Hinge | `hinge` (+ `hamstring`) |
| Lunge | `split` |
| Push | `hpush` |
| Press | `vpush` |
| Pull | `hpull`, `vpull` |

### Level gating (which library exercises a student can see per pattern)

| Tech level | Allowed | Examples |
|---|---|---|
| 0–1 | `foundation` zone, tier 1 | air squat, KB deadlift, push-up, ring row |
| 2 | `foundation` zone, tiers 1–2 | goblet squat, DB press, seated row |
| 3 | + `strength` zone, tier 3 bilateral | back squat, hex-bar deadlift, bench press |
| 4 | + `strengthspeed` and loaded unilateral | KB swing, push press, split squat, single-leg RDL |
| 5 | + `speedstrength` and Olympic (with the existing caution flag) | hang clean, jump squat |

### One content source
Exercise names, videos, criteria and load tiers live in the HTML of two different files today and disagree. Move them into one shared `strength-content.js` loaded by the strength portal, `index.html` and `admin.html`. This is a small departure from "single HTML file" but it is not a build step, and it ends the drift.

### One log
G9 sessions land in `Training_Sessions` (Sport = `Strength`, Type = `training`, steps in `Planned_JSON` with `exId`, sets, reps, weight). Two readers move with it: the dashboard strength progression card (`index.html`) and admin's session counts. `Workout_Logs` then retires.

### Stage state
Two columns appended to `Strength` by name (the existing `updateStudent` can do this): `Stage` (blank = intro, `foundations`, `program`, set by the teacher) and `Unit_JSON` (concept-checklist ticks with dates). Practice counts per pattern come from the logged sessions, not a new store. Level 1 stamps are simply `{P}_Tech = 1`.

---

## 6. Load tiers: the finding, and what needs deciding

The portal and the dashboard both hold a tier table, and they disagree because **they are for different levels**:

| Pattern | Portal (M) | Dashboard (M) | Reading |
|---|---|---|---|
| Squat | 8, 16, 24, 32, 36 | 40, 55, 70, 85, 100 | portal = goblet (L2), dashboard = back squat (L3) |
| Hinge | 8, 16, 20, 24, 28 | 50, 70, 90, 110, 130 | portal = KB deadlift (L2), dashboard = barbell (L3–4) |
| Push | 8, 16, 24, 32, 40 | 30, 40, 50, 65, 80 | portal = DB bench total (L2), dashboard = barbell bench (L3) |
| Pull | 5, 8, 12, 15, 20 reps | 12, 16, 20, 24, 32 | portal = inverted row reps (L2); dashboard unit unclear |
| Lunge | 8, 16, 24, 32, 40 | 20, 35, 50, 65, 80 | portal = DB lunge (L2), dashboard = barbell (L3) |
| Press | 6, 14, 24, 32, 36 | 20, 27.5, 35, 42.5, 50 | portal = DB press (L2), dashboard = barbell (L3) |

The sheet already stores a tier **per level** (`_Str_L2..L5`), so the tier table needs a level dimension: pattern × level × gender × 5 tiers.

**Proposal**
- L2 tiers = the portal's numbers (they fit the L2 gear)
- L3 tiers = the dashboard's numbers (they fit the L3 barbell lifts)
- L4 tiers: to set. Front squat, barbell deadlift, single-arm DB press, rear-foot-elevated split squat, pull-up, push press
- L5: no tier. Level 5 exercises are skill lifts (pistol, power clean, jerk). Pass/fail on technique, tested in class
- Pull: settle the unit (reps of inverted row at L2, pull-up reps at L4?)

These numbers go in the shared content file, once. Fill them in the table in §6 of the published plan page, or straight into the file.

---

## 7. Admin changes

- **Class stamp view** (phone-first): roster × six patterns, each cell showing practices so far, tap to stamp level 1, tap again to undo. Used in any lesson. Uses `updateStudent`
- **Concept checklist** per student, next to the stamps
- **Unit complete** for the whole class in one tap, or per student (sets `Stage`)
- **"Ready to build"** toggle per student (sets `Stage = program`)
- **Session counts** read from `Training_Sessions` instead of `Workout_Logs`
- Existing tech level and tier editors stay

---

## 8. Build order (PR-sized)

Today is 6 Sept 2026 and the unit is about to start, so Stage 1 ships first and small.

1. **Content file** — extract patterns, levels, videos, criteria and the tier table (L2 and L3 anchors, L4 blank) into `strength-content.js`. Wire `index.html` and `admin.html` to it. No behaviour change
2. **Portal shell + Stage 1** — new `strength-portal.html`: ID-only auth via bootstrap, the three-part session, passport with practice ticks, concept checklist. Ship before lesson 1
3. **Admin class stamp view** — needed from lesson 2 onwards
4. **Workout Mode + logging** — port Workout Mode, log to `Training_Sessions`. Needed by the "reading a prescription" lesson
5. **Stage 2** — Foundation templates, level-gated swaps, film and test flows, "last time" from `Training_Sessions`
6. **Move the readers** — dashboard strength card and admin counts onto `Training_Sessions`; retire `Workout_Logs`
7. **Stage 3** — builder and My Program ported from `portal-lab`, level-gated; "Ready to build" in admin
8. **Polish** — plain-language pass, empty states, a G9 section in `guide.html`

---

## 9. Decisions still open

- L4 tier numbers and the Pull unit (§6)
- Is a shared `strength-content.js` acceptable, or must each file stay fully self-contained?
- The readiness signal the portal shows before "Ready to build" (draft: level 2 in four patterns and ten logged sessions)
- Which of jump-and-land, med ball and a finisher belong in the intro, or whether the intro stays at Prep, Move, Finish with the six patterns only
- Whether practice ticks are the student's own (tap in the portal) or only count when a session is logged

---

## 10. Not in v2

Training Age changes, AI coaching, a coach view beyond admin, PB trend charts, notifications. Same exclusions as the athlete portal v1.
