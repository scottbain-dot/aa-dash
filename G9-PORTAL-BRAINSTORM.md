# G9 Portal — Brainstorm Notes

> **This is NOT a decision.** Nothing here is agreed, scoped or scheduled. It is a
> record of one conversation, written down so the next session doesn't start from
> zero. More context is needed from the G9 side — the unit as it is actually
> running, what last year's portal got wrong in practice, and how a real classroom
> lesson goes — before any of this becomes a plan.
>
> **Date:** 17 Sept 2026
> **Reads with:** `G9-STRENGTH-PORTAL-PLAN.md` (the Sept 6 proposal — also not built),
> `strength-board-prototype.html` (the Training Intro Board), `strength-portal.html`
> (last year's G9 portal), `portal-lab.html` (this year's G10–12 portal).

---

## 1. Where things actually stand

- `G9-STRENGTH-PORTAL-PLAN.md` exists and proposes a full v2 — three stages, a
  content file, a log migration, nine PR-sized steps. **None of it has been built.**
  No `strength-content.js`, no admin stamp view, the Board is still a prototype.
- The eleven days since it was written went into `portal-lab.html` (G10–12) instead:
  XP and badges, the Level Up tab, the CV tab, the Grit Score, faster week nav.
- That's the useful accident. The G10–12 portal now contains several finished,
  tested mechanisms that did not exist when the G9 plan was written, and which
  happen to fit G9 problems well. **That is the main subject of these notes.**

---

## 2. The best of the G10–12 portal, and what could in theory transfer

Each item below is: what it is, why it works, and how it *might* map to G9. The
mapping is speculative. The mechanism is real and running.

### 2a. Level Up's sequencing — likely the single best fit

`portal-lab.html:4864` (`LEARN_BLOCKS`), `lessonOpen()`, `videosWatched()`,
`markVideosWatched()`.

A block is a list of lessons. Lesson 2 won't open until lesson 1 is done. Questions
won't unlock until the videos in that lesson have actually been watched. Progress
saves to a `Learn_Progress` sheet as one `Progress_JSON` blob, keyed by Athlete_ID.

**Why it works:** it removed all the "did they actually engage or just click
through" ambiguity without any policing. The gate *is* the lesson plan.

**Possible G9 mapping:** the Classroom A session described in the plan — meet the
passport, watch the six pattern videos, self-check against the criteria — is
structurally a Level Up block with six lessons, one per movement pattern. The
video gate is exactly the behaviour you want there: you can't tick "I can do this
with a flat back" before you've watched what a flat back looks like.

**What that would save:** the screen, the gating logic, the save/load endpoints and
the sheet all already exist. It becomes a content-authoring job rather than a build.

**Unresolved:** whether six pattern lessons in a row is too slow for a single
classroom period, and whether a G9 self-check should feed anything at all or is
purely for their own reflection.

### 2b. Badges, XP and ranks

`portal-lab.html:6127–6221` (`XP_SESSION`, `RANKS`, `BADGES`, `BADGE_TRACKS`,
`gameStats()`), plus the trophy room, the badge celebration and the confetti.

17 badges across four tracks (Consistency, Volume, Records, Learn), each a simple
`metric` + `goal` pair. Ranks Rookie → Legend off total XP.

**Why it works:** it's declarative. Adding a badge is one object in an array; the
counting, the celebration and the trophy room all follow.

**Possible G9 mapping:** a stamp is the obvious badge. Six patterns, six badges,
plus a "passport complete" for all six. Getting stamped currently produces nothing
on screen at all — the screen doesn't know it happened. A badge and some XP would
give the moment a payoff in front of the student.

**Unresolved:** whether gamifying a *technique sign-off* is right. A badge for
turning up is harmless; a badge for passing hinge could read as a public ranking of
who's good at hinge, in a year group where that lands harder. Worth thinking about
with the CV caution (§2e) in mind. Could be private-only.

### 2c. The CV tab's blurred-lock design

`portal-lab.html:10785` (`PATTERN_IMAGES`), `renderCV()` at `10805`.

The rule that came out of designing it: **a CV can never read as a verdict.** No
zeros, no bottom band, no "you are below average". Things not yet achieved are
blurred and locked rather than shown as failures. Only verifiable, celebratory
content.

**Why it works:** it's motivating whether you have one achievement or twenty. An
empty CV looks like a CV waiting to be filled, not a bad report.

**Possible G9 mapping:** the CV's strength section — six pattern tiles with the
foundation movement images, blurred until achieved — is *already* the passport the
G9 plan describes in §4. Same component, different caption. And the blur/lock
convention maps cleanly onto stamped vs not-yet-stamped, which matters a lot given
some students will carry an unstamped hinge for weeks.

**Unresolved:** whether G9 should see a CV at all this year, or only the passport
strip from it.

### 2d. My Program's structure — week-shaped, date-keyed, no global pointer

The week strip, the session card, Workout Mode (`portal-lab.html:1533`, opened at
`8144`), the done chip, the streak. Sessions live in `Training_Sessions`, keyed by
Athlete_ID and a real date.

**Why it works — and this is the contrast that matters:** last year's G9 portal
(`strength-portal.html`) had a single global `CurrentSession` config value, so the
whole class was pointed at the same session; the teacher unlocked sessions by hand;
practice counts were matched by exercise *name string* and silently vanished when a
student switched sessions; and state was spread across localStorage, the config
sheet and `Workout_Logs` at once. That is a fair amount of why it "got messy". The
G10–12 model has none of those moving parts: one athlete, one date, one row.

**Possible G9 mapping:** the same screen, with the builder removed. Students don't
design the week — it's generated. What they see is the furniture they'll be handed
the controls to next year, which is the stated goal: *in line with what they'd see
next year, without the complexity.*

**Unresolved:** where the generated week comes from (the Foundation templates? the
Board's unit data?), and whether Workout Mode is too much for a first lesson.

### 2e. `EXERCISE_LIBRARY` and level-gated swaps

`portal-lab.html:8397` (`EXERCISE_LIBRARY`), `swapCandidates()` at `8579`.

Every exercise carries an EXOS `component` tag, a pattern, a zone and a tier.
`swapCandidates()` only offers strict matches — same region, pattern, laterality.

**Why it works:** it makes "choose your own exercise" safe. A student can't swap a
hinge for a bicep curl.

**Possible G9 mapping:** this is the machinery that would let a program be *derived
from stamps* rather than hand-built. The plan's §5 already sketches the taxonomy
bridge (G9 `Press` → library `vpush`, etc.) and a level-gating table (level 0–1 sees
foundation tier 1, level 2 sees tiers 1–2, and so on). If that bridge is filled in,
a student's stamped levels can resolve each slot automatically.

**Unresolved:** the L4 tier numbers and the Pull unit, both still open in the plan's
§6. Not blocking for level 1.

### 2f. The identity rule and `getPortalBootstrap`

`apiData()` / `apiDataGet()` at `portal-lab.html:4338`, guarded by
`tools/check-identity.js`.

Every data call carries `athleteId`, never email. Email appears once, at login.

**Why it matters for G9:** these are 14-year-olds and the data includes technique
assessments. Any new G9 endpoint should be built inside this rule from the first
line, not retrofitted. The plan says the same in its opening.

**Related and worth carrying over:** the Fuel Lab teacher endpoint was recently
locked behind real server-side Google token verification (`apVerifyTeacher`). A G9
admin stamp view is a teacher endpoint and needs the same treatment.

### 2g. The Grit Score — probably the one to leave behind

`GRIT_WEIGHTS`, `GRIT_WEEKLY_TARGET`, the credit model, the bands.

It scores adherence, check-in reliability and training through a hard period,
against a week the athlete planned themselves.

**Why it probably doesn't transfer:** G9 don't plan their own weeks — they follow
the Board. There's no adherence to measure, because there's no self-set commitment
to adhere to. Scoring them on it would measure compliance with someone else's plan
and call it grit.

**Possible later use:** the attendance-credit half (credit per session attended, no
penalty for not logging) could work once G9 reach a stage where they own the week.

### 2h. Smaller things that would transfer for free

- **Week caching** (`fetchWeekOnce()` at `10594`) — de-dupes in-flight requests and
  caches by week-start. Made week switching roughly an order of magnitude faster on
  revisits. Any week-shaped G9 screen inherits it.
- **The streak chip and the done chip** — the recently redesigned versions.
- **Availability flags** — the injured/ill week marker, so a bad week doesn't count
  against a student. G9 equivalent: an unstamped pattern shouldn't look like a
  failure either.
- **AI marking** (`handleGradeLearnAnswers`) — marks written answers, sends no
  identity at all, fails soft. Only relevant if G9 get written work.

---

## 3. What has been said so far (direction, not decisions)

From this conversation, for the record:

- **The teacher stamps.** Not partners, not self-assessment. Partner checks in the
  gym are practice. *"So far it's all been student practice, not actual stamping."*
- **Level 1 needs stamping.** *"Some won't pass hinge for example, and shouldn't
  move on."* Unlocks are per pattern — an unstamped hinge doesn't hold up the other
  five.
- **Students film in the classroom lesson**, not at home. The filming and the
  stamping are meant to happen close together.
- **The program follows the stamps.** *"Their personal program becomes based on what
  got stamped, i.e. the progression."*
- **The Board may need to show levels.** *"We may need to edit the training board to
  reflect that they do the level they have been stamped for."*
- **Last year's personal program got messy.** Some good aspects, but it needs to be
  more in line with the G10–12 structure — *"what they would see the next year is
  better, without too much complexity."*

---

## 4. Ideas raised in discussion — untested

Listed so they're not lost, not because they're right.

- **Two rows on the Board, not five.** During Intro to Training only level 1 exists,
  so every Move line could show just two states — "practising" (bodyweight, film it)
  and "stamped" (the light loaded option). Projecting can't personalise, so students
  read their own row. Fanning out to five levels would be building Block 2's problem
  into Block 1's tool.
- **Stamp live, don't watch video.** Six patterns across a full class is 100+
  decisions in a lesson. The suggestion was that the teacher stamps from the movement
  in front of them while students film each other — the film being the student's own
  record and self-check reference, not the teacher's evidence queue. Realistically
  two or three patterns get stamped properly in one lesson, and planning for six may
  be planning to stamp badly.
- **Don't store the video.** Track `filmed ✓`, keep the footage on the student's own
  device or in Canvas where it already lives. Video of minors is the last thing this
  system should hold.
- **"The stamp is the currency, the program is the receipt."** If getting stamped
  visibly rewrites what the student's program says — a different exercise, a weight
  where there wasn't one — then level 1 stamping reads as a reward rather than a
  gate. Matters most for the student who won't pass hinge for a while.

---

## 5. What the G9 session needs to answer

- Does "viewing their personal program" mean the generated Foundation week
  (read-only), or something they build? These are very different builds.
- Are classroom reflections private to the student, or visible in admin?
  (Also open in the plan's §9.)
- How many patterns can realistically be stamped in one lesson, and what does the
  room look like while it happens?
- What specifically went wrong with last year's program — the diagnosis in §2d is
  read off the code, not off the experience of teaching it.
- Is a badge for a technique stamp motivating or exposing, for this year group?
- Does the Board need level rows before the next gym block, or after?
- Still open from the plan's §9: the L4 tier numbers, the Pull unit, whether a
  shared `strength-content.js` is acceptable, and the readiness signal for "ready
  to build".

---

## 6. If something has to be built first

Not a recommendation to build — a note on ordering if the G9 session concludes that
it should be.

The only piece that is genuinely blocking is the **admin class stamp view**: a
phone-first roster × six-pattern grid, tap to stamp level 1, tap to undo, writing
`{Pattern}_Tech = 1` through the existing `updateStudent`. Admin today only edits
one student at a time and has no class view at all — the lesson can't run without
it. It's also small.

Everything else in these notes can wait for the discussion to land.
