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
| **1 · Intro to Training** | Learning how a session works, how the gym works, and the six foundation movements at bodyweight, in alternating **Push** and **Pull** sessions, two patterns introduced per session, then cycled | Two things: a **Board** you project in the gym (today's session, no login), and a **classroom portal** used every 3–4 gym sessions (passport, pattern videos and criteria, self-check, reflection). No laptops in the gym | Everyone starts here |
| **2 · Foundations** | Running the Foundation program (full body A, full body B, athletic basics), levelling up patterns, loaded work pattern by pattern | A workout portal: the full six-part EXOS session map, this week's sessions, Workout Mode, swaps, film and test flows | Teacher marks the unit complete, for the class or per student. Stamps do not gate it |
| **3 · My Program** | Building and running their own repeating week, in the same shape as the academy | A program builder: phase × goal builder, weekly template, PBs | Teacher opens it per student from admin ("Ready to build"). The portal shows a readiness signal to help the call |

**Unlocks are per pattern, not per stage.** A stamped Squat unlocks goblet loading for squat while Push stays bodyweight. The current portal already works this way underneath (technique level decides technique-focus versus loaded); the passport just makes it visible. A student who reaches Foundations with two patterns unstamped keeps practising those at bodyweight inside the Foundation program until they are stamped.

**Everyone reaches Stage 3.** The builder only offers exercises their technique levels qualify for, so a student at level 1 in every pattern still gets a valid bodyweight-and-kettlebell program, and a student at level 3 gets barbells. The stage is the same; the program differs.

---

## 3. The Intro to Training unit (Stage 1)

**Sessions alternate Push and Pull, and every session has the same four blocks:** Warm up (game, World's Greatest Stretch, a plyo, prehab), Primary lifts (one lower, one upper), Accessory (two or three), Extras. This is the shape of last year's session sheets, and it maps onto EXOS: Warm up is pillar and movement prep plus plyos, Primary and Accessory are strength and power, Extras is energy systems and regeneration. The Board can reveal those names under each block when you want to teach the structure; they stay hidden in the intro.

**The slot stays, the content progresses. That is the teaching.** In the intro sessions the Primary block reads "Hinge · technique practice and film"; by Block 3 the same slot reads "Kettlebell or hex-bar deadlift · 3 × 8 · 8/10". Students see the same session shape every time and watch what fills it change.

**Patterns come in two per session.** Pull session: Hinge + Pull. Push session: Squat + Push. Then Press and Lunge join the Push sessions (Press as a primary, Lunge as accessory), and the Pull sessions add posterior chain and core accessories. Each session carries one idea in the header: hips back then pull; knees and push; horizontal vs vertical; single leg vs double leg.

**No laptops in the gym.** You project the Board. Students use the portal in a classroom session after every three or four gym sessions, to consolidate. That is where the ideas (criteria, reading a prescription, RPE) are taught and self-checked, then applied in the next gym block.

**Stamps land whenever they land.** You stamp level 1 for any student, any pattern, any session, from admin on your phone. Some students have six stamps by the end of Block 2, some carry one or two into Foundations.

| Block | Gym sessions (Board) | Classroom session (portal) |
|---|---|---|
| **1 · The shape and the six patterns** | 1 **Pull:** gym rules, the four blocks walked through, **Hinge + Pull** as technique practice and film. 2 **Push:** **Squat + Push** the same way. 3 **Pull:** hinge and pull again with a little load in Accessory. 4 **Push:** **Press** joins as a primary, **Lunge** as accessory | **A:** sign in, meet the passport and what a stamp means, watch the six pattern videos, self-check against the criteria, tick "gym rules" and "partner-checked a movement". Reflection: which pattern feels least controlled? |
| **2 · All six, a new idea each session** | Push and Pull alternate. Ideas in the header: horizontal vs vertical, single leg vs double leg, upper vs lower. Hops replace jumps in the warm up, prehab appears (shoulder taps, groin). Tempo and control as the cue of the block | **B:** reading a prescription (sets × reps, tempo, "last few reps hard"), choosing a weight, what RPE 7 feels like. Self-check all six. Ticks: "held a tempo", "can read a prescription". Reflection: which patterns are you ready to be stamped on? |
| **3 · Loading and running it** | Push and Pull alternate. Primary lifts become "goblet squat or bar back squat · 3 × 8 · 8/10", with the heavier option only for stamped patterns. Effort and RPE in practice. Last session: run it yourself, you observe | **C:** log the last gym session in Workout Mode (first log). Rate it. Preview Foundations: the six-part map and "this week". Ticks: "logged a session", "rated a session". Unit complete |

Three blocks is the default. Add a gym session to any block if a class needs it; the classroom session stays at the end of the block.

**Level 1 sign-off is in class, by you, from admin on your phone.** Canvas video stays for level 2 upwards.

---

## 4. What it looks like to them

Three home screens, one per stage. Same header, same passport, more ownership each time.

**The Board (gym, projected, no login)** — working prototype with your four sessions: https://claude.ai/code/artifact/6a7eb5b1-518f-491b-9fb1-2fb760da7129
- Pick the session from a list (or arrow keys)
- Four lanes in big type: Warm up, Primary lifts, Accessory, Extras. Columns: exercise, sets × reps, note. New patterns tagged. "Technique practice and film" rows in gold
- Today's idea in the header ("hips back, then pull")
- Tap any exercise to teach it: full-screen card with the prescription, the cue, the six criteria for its pattern and where it sits on the level ladder
- "Structure names" toggle reveals the EXOS names under each lane when you want to teach the shape
- Clock on space bar

**Stage 1 home (classroom)**
- "Intro to Training · Classroom B · after gym sessions 4–6"
- The passport: six tiles, stamped or "practising since 12 Sep"
- Learn: the six patterns, each with its video and six criteria, and a self-check ("I can do this with…")
- Ideas covered: the concept checklist, ticked as each is taught
- Reflection prompt for this classroom session, saved

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
Two columns appended to `Strength` by name (the existing `updateStudent` can do this): `Stage` (blank = intro, `foundations`, `program`, set by the teacher) and `Unit_JSON` (concept ticks, self-checks and reflections with dates). Level 1 stamps are simply `{P}_Tech = 1`. Board sessions are content, not data: they live in the shared content file.

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

- **Class stamp view** (phone-first): roster × six patterns, tap to stamp level 1, tap again to undo. Used in any gym session. Uses `updateStudent`
- **Concept checklist** per student, next to the stamps
- **Unit complete** for the whole class in one tap, or per student (sets `Stage`)
- **"Ready to build"** toggle per student (sets `Stage = program`)
- **Session counts** read from `Training_Sessions` instead of `Workout_Logs`
- Existing tech level and tier editors stay

---

## 8. Build order (PR-sized)

Today is 6 Sept 2026 and the unit is about to start. Block 1 needs only the Board and the stamp view, so those ship first.

1. **Content file** — extract patterns, levels, videos, criteria, the tier table (L2 and L3 anchors, L4 blank) and the Board sessions into `strength-content.js`. Wire `index.html` and `admin.html` to it. No behaviour change
2. **Board** — `strength-portal.html?board`: session picker, Prep / Move / Finish in big type, clock. No login. Ship before gym session 1
3. **Admin class stamp view** — needed from gym session 1
4. **Classroom portal (Stage 1)** — ID-only auth via bootstrap, passport, pattern library with self-check, concept checklist, reflection. Ship before Classroom A
5. **Workout Mode + logging** — port Workout Mode, log to `Training_Sessions`. Needed by Classroom C
6. **Stage 2** — the six-part map, Foundation templates, level-gated swaps, film and test flows, "last time" from the log
7. **Move the readers** — dashboard strength card and admin counts onto `Training_Sessions`; retire `Workout_Logs`
8. **Stage 3** — builder and My Program ported from `portal-lab`, level-gated; "Ready to build" in admin
9. **Polish** — plain-language pass, empty states, a G9 section in `guide.html`

---

## 9. Decisions still open

- L4 tier numbers and the Pull unit (§6)
- Is a shared `strength-content.js` acceptable, or must each file stay fully self-contained?
- The readiness signal the portal shows before "Ready to build" (draft: level 2 in four patterns and ten logged sessions)
- The exact session sequence (the Board reads whatever the content file says, so it is data, not code)
- Gym sessions per block (three is the default) and whether every block ends in a classroom session
- What goes on the Board beyond the session: a clock, a criteria slide per pattern, a rest timer
- Whether classroom reflections are private to the student or visible to you in admin

---

## 10. Not in v2

Training Age changes, AI coaching, a coach view beyond admin, PB trend charts, notifications. Same exclusions as the athlete portal v1.
