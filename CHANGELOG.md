# What changed

Newest first.

**How we work:** everything is built on a branch and shown as screenshots here
before it goes near `main`. Nothing merges until Scott says so.

Finished work on the real files goes to `main` on its own, so students get it.
**Prototypes can sit on `main` now, because `main` no longer publishes
everything.** This used to say they must never reach it, and that was right at
the time: Pages served the repository root, so a file on `main` was on the
public internet whether anything linked to it or not. The publish allowlist in
`.github/workflows/pages.yml` ended that — five named pages go out and the build
fails if anything else reaches `_site/`. A `*-prototype.html` on `main` is not
reachable by a student. What still holds: "unlinked" is not "unreleased", so
anything student-facing is a decision, not a side effect.

The two sections below are the two states — what students have, and what is
waiting on a yes.

---

## On the branch, waiting on a decision

**These files are not on `main` and are not reachable by any student.** They live
only on `claude/genericise-portal-lab-r1l098`. No portal file is touched by any
of them — they are standalone pages.

| | |
|---|---|
| **`ladder-prototype.html`** | **Where you are now.** Speed / Power / Strength / Move well as a stack, Change of direction and Engine alongside. Each rung says the same four things: what you can do, where that sits, which way it's going, what you're doing about it. The rungs *support* each other — they do not gate. Feeds Training Age directly. Runs on athlete 41's real record and a worked example. |
| **`year-view-prototype.html`** · Focus first | The month tile carries **what you're building**; the sports drop to an in-season / training / off ribbon. Dissolves the "which sport leads" problem — sports tied for the lead are tied on phase, so the tile looked identical either way. |
| **`year-view-prototype.html`** · Year strip | The 12-tile strip made multi-sport: tile = the leading sport, name shown only where the lead *changes*, other sports as lettered pips. Two rows of six on a phone so the whole year fits without scrolling. |
| **`load-prototype.html`** | **How much you are doing, and whether it matches the plan.** The headline is *"22% of a normal week for you · 1 session · 30 min"* — no arbitrary units anywhere a student can see them. Advice is in sessions: *"2 more sessions than this week"*. Underneath, **what you have been building**: every session is auto-tagged to one of the seven components from its sport and name, and the last three weeks' real mix is held up against what the block claims to be for. Runs on athlete 41's real term. |
| **`CHANGELOG.md`** | This file. |

**Open questions before any of it merges**

- The dashboard's level bands return `4` for two adjacent thresholds, so Level 4 is twice as wide as every other band and Level 5 only opens at the top threshold. The ladder leans entirely on these. Fix or confirm first.
- Does the Year tab's block expand into the ladder, or do they stay separate?
- Only the aerobic base is measured. Threshold and top end would each need a test adding.
- Focus tags are derived from the sport and session name. Should the athlete be able to correct a wrong one, and should `Training_Sessions` get a `Focus` column so the correction sticks?

---

## Going to main — 9 Oct 2026

**43 routes answered an anonymous caller. Now 39 are allowed and the rest are
refused before they reach a handler.**

An audit of every route in `doGet` and `doPost`, checked against which pages are
actually published. Three findings were verified against the live deployment
using identifiers that cannot belong to a real student.

| What | Where |
|---|---|
| **`getAthleteData?email=` answered anyone.** No sign-in. With a real address it returns the full athlete record — psychology, strength, performance, mobility, recovery. FIS addresses are `firstname_lastname@fis.edu`, so they are guessable. `getGritChallenge?email=` was the same, returning the psychology journal. | Apps Script |
| **The fallthrough was worse than any named route.** `doGet` ended with `if (e.parameter.admin === 'true') return handleAdminRequest(ss)` and then `return handleStudentRequest(ss, e.parameter.email)` — so `?admin=true` returned every athlete and `?email=` returned one, both unauthenticated. Not called to confirm: the code has no gate above it, and proving it would have meant pulling 34 children's records. | Apps Script |
| **35 of the 43 open routes had no live caller at all.** Only five pages are published. Last year's Clash, the superseded G9 endpoints, the old workout routes, the unpublished public forms — doors standing in a wall with no building behind them. | — |
| **One allowlist decides what the deployment answers.** `AA_LIVE_ROUTES`, built from the student, admin and AI route lists. Nothing is deleted: a page comes back by adding its routes, the same rule the Pages publish allowlist uses. | Apps Script |
| **The four AI routes moved behind the student session gate.** They were open, so anyone with the URL could spend the Anthropic key. The client already sends `athleteId` and `token` on all four, so gating them needed no portal change. | Apps Script |
| **The AI cap is per-athlete now, not one global bucket.** A single counter capped the bill and nothing else — one caller running it flat also took the coaching assistant away from every student for the rest of the hour. 20 an hour each, with the global 300 kept as a ceiling. | Apps Script |
| **`getConfig` had no gate and no caller.** Off the allowlist, along with seven other admin-shaped routes nothing calls since the grit and check-in tools were removed in September. | Apps Script |
| **The smoke test proves the doors are shut.** Thirteen closed-route checks plus the two fallthrough paths, each called with arguments that cannot match a real student. A route still answering means the deployed script is older than the repo. | `tools/smoke.js` |

**Needs a paste to take effect** — and until it is pasted the new smoke checks
fail by design, which is the test doing its job.

Verified statically: all 35 routes the live pages call are still allowed, all 37
previously-open routes are refused, and the no-action fallthrough is closed.

---

## Going to main — 8 Oct 2026 (fifth push)

**The season card and the year strip were saying the same thing twice.** Scott
asked what the season view was really offering over the year, and for a
single-sport athlete the answer was: a reformat of the row below it.

| What | Where |
|---|---|
| **The blocks bracket the months they cover.** The one thing the card alone carried was block *boundaries* — a row of twelve coloured months tells you what each month is and nothing about where one block ends and the next begins, which is the actual unit of training and the only place the week count lives. It is drawn on the strip now, one grid and two rows so a bracket cannot drift out of line with its months. The block you are in is marked, and an over-long one is flagged on itself. | Year |
| **What is left is one line, not a card.** Where you are today — block, week N of M — and the program running it, as the way out of the plan and into the week. With no program yet, the same slot is the invitation to build one. That was Scott's other ask: the link from the year to My Program was never explicit. | Year |
| **"What are you building this month?"** The empty state used to report a gap — "You have not said what this block is building." It asks the question instead, and names the year planner it is sending you to. | My Program |

Verified headless: the brackets cover the twelve months exactly once, never
overlap, line up with the tiles, carry their week counts, mark the current block
and flag the over-long one; the now line names the block and the week and lands
on My Program; the build invitation replaces it when there is no program;
compare-grid mode still says where you are; and the empty state asks a question
and reaches the planner. No page errors. Identity, icon and reading guards pass.

---

## Going to main — 8 Oct 2026 (fourth push)

**Five icons were rendering as nothing**, including the one on the Finish
workout button. The free Tabler webfont the portal loads has no `-filled`
variants at all, and `ti-flag-checkered` is not a name in it. A missing glyph
does not error, does not warn and does not fall back — it renders as empty
space, so the button keeps its circle and loses its picture. `tools/check-icons.js`
now cross-checks every icon name against a vendored list of the 5,247 that
really ship, so this cannot come back.

| What | Where |
|---|---|
| **"Nailed it" sits beside the date.** Inline it pushed "Base (Bike or Run — Alternate)" onto a second line on every phone — a badge breaking the session name in half to say "done". | My Program |
| **The streak is drawn, not counted.** A tile reading "6" is a dashboard; a row of flames that got longer last week is a streak, and the unlit one on the end is this week asking to be earned. The headline says what would come next — your longest run yet, one more equals your best — and never reports a zero. This week's session bar moved inside it, because that is the thing that keeps the run alive. | My Program |
| **Sessions and bests became rows with somewhere to go.** Each names the next thing — "4 more to Prospect", "set one and it is yours for good" — instead of sitting there as a number. Badges moved to the trophy room, where they already live. | My Program |
| **The block says what it is building.** "Hyrox build · week 10 of 26" is the setting, not the job. The components the athlete picked in the year map were sitting there unused; the card now reads "Building strength and endurance for Hyrox", and the whole eyebrow is the way into the Year tab. | My Program |
| **"On top of your sport: 2–3 sessions a week" only appears when it is advice.** Told to an athlete already running a seven-session Hyrox program it is noise — they are doing four times what it asks and the line still reads as a job outstanding. It now counts the non-sport sessions already in their program and stays quiet when the program covers it. An athlete whose week is three football trainings still gets it, which is who it was always for. | My Program |

Verified headless at 390px and 430px: the flag is in the eyebrow and the title
keeps one line, the run draws and never reads zero, both rows name a next step,
the block eyebrow carries the week and links to the year, the ask appears for a
team-only week and disappears for a program that covers it, and the card stands
up with no year map. No page errors. Identity, icon and reading guards pass.

---

## Going to main — 8 Oct 2026 (third push)

**The CV is a document now, and the board fails one block at a time.**

| What | Where |
|---|---|
| **The board stopped failing as one thing.** Scott hit "Could not load the board" — which was the all-or-nothing catch added this morning doing its job: one block was throwing and taking the other five with it. A noticeboard is a set of independent notices and it fails like one now. A block that cannot render costs that block and names itself in a quiet line at the foot of the board. | Board |
| **`p.you` was a real crash waiting.** Every surface that places the athlete inside the squad assumed the field was there. It is one field on a hand-pasted Apps Script, so a deployment a version behind returns the rest of the payload without it. Five call sites guarded. | Board, squad card, ticker |
| **The CV reads like a CV.** Scott's test: picture them hitting Export and emailing it to a university coach — would they send this? No, because it was built like the rest of the portal. Gold medallions, a coloured grit pill, stat tiles, and rows of blurred padlocks showing everything they had *not* done. Locked placeholders are a game mechanic; on a document sent to a stranger they are a list of gaps. It is a letterhead, rules, tables, one accent colour and real dates, and nothing on it that has not been achieved. | CV |
| **Export PDF is back on the page**, and the print stylesheet now drops every control, every other screen and the page frame. | CV |
| **Editable the whole way.** The athlete writes their own headline and profile, picks what the page leads with, switches any section out of the document, and adds or corrects their own bests. Competition results, fitness testing and strength levels stay read-only — they are what makes the page worth sending, and the document says who recorded them. | CV |
| **Two things that were quietly wrong on paper.** A sprint that got faster printed as "+0.29 s", because the stored delta is a magnitude and the sign was being guessed from the wrong end; it reads "improved 0.29 s" now. And every date carries a year — "14 Feb" is fine inside the app, where everything is this season, and unreadable on a page a coach opens in two years. | CV |

**Needs a paste to take effect.** `COMPLETE-APPS-SCRIPT.gs` gains an
`Athlete_Prefs` sheet (one row per athlete per key) with `getPrefs` / `savePref`,
and the bootstrap returns prefs. This carries the CV's profile text and section
choices. Until it is pasted, the CV renders and edits work for the session but
the athlete's own words do not survive a reload. The `Pinned` column and
`setAwardPins` from the previous push are in the same file — one paste covers
both.

Verified headless: the document carries no padlocks, medals, gradients or
shadows, facts sit in tables, every date has a year, an internal rating is
explained in words a stranger can read, edit mode exposes exactly the fields the
athlete owns, a switched-out section leaves the document, print drops all of it,
and the board survives every missing field in the squad payload. Identity and
reading guards pass.

---

## Going to main — 8 Oct 2026 (second push)

**My Program, in three groups.** Scott's read of the screen, and he grouped it
himself: today, logging and streaks, program details. It was one overloaded hero
card, a burgundy button, a bordered note, and a context strip stranded above the
whole page.

| What | Where |
|---|---|
| **The streak is back, as a number.** Moving it from days to weeks was right — a day streak was the one figure here that could fall to zero — but it then got folded into a grey run-on line reading "10 to Contender · 6 weeks trained · 5 badges", which is where a thing goes to be ignored. Consistency is the habit this programme exists to build, so it gets a tile, a flame, and the current run under it. | My Program |
| **"How you are going" is its own card.** The week bar, three counts that cannot fall — weeks trained, sessions logged, personal bests — and the rank they feed. Today's card now carries today and nothing else. | My Program |
| **Personal bests are on the main screen.** They were two taps into the trophy room. A zero there is an invitation to set the first one, never a score. | My Program |
| **The build button is a card, not a button.** Program name, session count, one edit affordance. It was an icon, two lines of text and a chevron crammed into a burgundy bar. | My Program |
| **"Hyrox build · week 10 of 26" is no longer orphaned.** It was pinned above the entire page, describing a program four cards further down. It is the eyebrow on the program card now, sitting on the thing it is the context for, with "on top of your sport" inside the same card. The Load tab keeps the strip, where the block really does frame everything below it. | My Program |

Verified headless at 390px and 430px: the three cards share one radius family,
the tiles are equal height with their sub-lines aligned, the tiles are real
buttons that go where they should, the strip is gone from My Program and still
on Load, the program card stands up with no year map set, and no raw markup
leaks into the text. No page errors. Identity and reading guards pass.

---

## Going to main — 8 Oct 2026

**The trophy room is a room now, and the medals are in it.** Three things Scott
hit on the live portal, in the order they bite.

| What | Where |
|---|---|
| **The board opens on tap again.** The notice line travels across the bar like a ticker, and on iOS a tap whose target element moves between touch-down and touch-up never fires a click at all. The text was the tap target. Nothing inside the bar is a tap target now — the button is. The board also opens *before* it renders, so a throw in the contents can never again swallow the tap silently. | Notice bar |
| **`syncAwards()` was never called from anywhere.** It was written, deployed and left unwired, which is why the Awards sheet was empty and medals only ever came from the older badge celebration. It now runs after paint on every load, live and demo. | Bootstrap |
| **A medal can be shown again.** The tier and the wording used to be invented when a medal was minted and then thrown away — the sheet stores no tier — so a celebration interrupted by a closed tab was lost for good, and last term's gold had nothing to display. Presentation is now derived from the stored row. | Awards |
| **Trophy Room is a tab.** It was a drawer behind the rank chip. It leads with **the shelf** — every trophy and medal earned, newest first, golds kept visually apart from silvers so a personal best never reads the same size as "logged four sessions" — then the CV, then rank and badges. | New tab |
| **The CV is a door inside the trophy room**, not a tab of its own. The room is everything you have won; the CV is the one page you send to a coach at another school. The strip keeps Trophy Room lit while you are on it, and the CV has a way back. | CV |
| **Highlights on the CV are the athlete's pick.** Up to four, in the order they tapped them, stored as a position on the award's own row so it survives a new phone. Until they pick, the newest results stand in — a blank highlights strip on a page you are about to send somebody is worse than a reasonable guess. | CV |
| **A personal best is no longer rounded to a float.** `parseFloat("2:14.8")` is `2`, so a 200m freestyle was being recorded as a best of "2". Values are stored and shown exactly as the athlete entered them. | Awards |

**Needs a paste to take effect.** `COMPLETE-APPS-SCRIPT.gs` gains a `Pinned`
column on the `Awards` sheet (added automatically to the existing sheet) and a
`setAwardPins` action. Until it is pasted and redeployed, the shelf and the
trophy room work fully and the CV picks simply do not persist across a reload.

Verified headless on a phone viewport: medals pop and queue, the shelf renders
golds and silvers apart, the CV opens through the door with the strip still lit,
the picker numbers picks 1–3 in tap order and the strip follows, the way back
lands in the room, the notice bar is its own tap target, the board opens, and no
page errors. Identity and reading guards pass.

---

## Going to main — 5 Oct 2026

**No arbitrary units on the student's screen.** "au" is a sports-science unit;
"aim for 1350 au a week" is an instruction nobody can follow, including a coach.
Everything below is still computed and still stored — it just isn't shown.

| What | Where |
|---|---|
| **The "Weekly load target · au/week" field is gone.** Nothing ever read the value, and it asked a fifteen year old to name a number of arbitrary units per week. Any figure already saved on a month is kept, not blanked. | Year → month sheet |
| **The read-only "525 au" field is gone** from the log sheet. Backend arithmetic shown as a form field, at the exact moment logging should feel like one tap. | Session sheet |
| **Logged sessions read "60 min · solid"** instead of "60min · RPE 7 · 315au". The effort rating is the athlete's own, so it stays — as the word they'd say out loud. The day summary now totals minutes, not units. | My Program |
| **"Coach view · detailed load" is gone** — au totals, the acute:chronic ratio drawn over the bars on an unlabelled second axis, and a paragraph defining ACWR. The verdict sentence above it already says this in English. The ratio is still computed, for admin. | Load |
| **"Coach view · the number" is gone** from the Grit card — the score out of 100 and the 60/25/15 weighting table. The band is the read and the three counts are the workings; there was nothing left worth hiding behind a toggle. An excluded week now reads "not counted against you". | Load |
| **The year strip stays**, retitled *"Your year, week by week"* with a plain legend and a hover of "% of your biggest week". A year of your own training in one picture needs no explaining. | Load |

Verified before pushing: identity guard passes, the page parses, and a headless
pass over My Program / Load / Year finds no "au", "ACWR" or "RPE" anywhere in the
rendered text, with no page errors.

### Also on this push

- **`SYSTEM-REVIEW-AND-ROADMAP.md` §8** — the abstraction review, and the G9 /
  G10–12 question closed: **they stay separate.** `index.html`,
  `strength-portal.html` and `grit-portal.html` are last year's G9 build and are
  not touched by G10–12 work.
- **`COMPLETE-APPS-SCRIPT.gs`** — `apLoadMobility()` and `apLoadPsych()` added to
  the bootstrap return, so the portal can finally see mobility screens and
  psychology scores. Both skip unscored items rather than counting them as zero.
  **Needs a paste to take effect** — merging does not deploy it.

---

## Merged and live — 2 Oct 2026

Eight pull requests (#387–#394). Four files touched. This is what students
actually have.

### Live for students now (`portal-lab.html`, front-end only, no deploy needed)

| What | Where |
|---|---|
| **Season card cut to one line.** It repeated the strip above it and the Year tab below it. Now one line, and only when it has something to say. | My Program |
| **Session counts moved off the sport.** "2–3 sessions a week on Swimming" is advice nobody can take — the club sets those. Now: *"On top of your sport: 2–3 sessions a week of strength and speed."* Fixed in the season line, the month sheet and the Year legend. | My Program, Year |
| **Workout mode for any session with sets** — not just gym sessions. A swim set or a circuit at practice now gets the walk-through screen. | My Program |
| **Team practice keeps the workout builder.** It was hidden, so a swimmer who tagged their session honestly couldn't write their sets down at all. | Session sheet |
| **No automatic rest countdown.** Ticking a step started a 90-second clock nobody asked for. The chips are still there. | Workout mode |
| **Wording follows the session.** Gym sessions say "Start workout / weight / reps"; everything else says "Start session / target", with one free-text Target field instead of four boxes. | Workout mode |
| **"Start workout" appears as soon as you type the steps**, instead of hiding until the sheet is reopened. | Session sheet |
| **One-tap logging no longer wraps mid-row** on a phone. "Moderate" is "OK" where the button is ~50px. | My Program |
| **Year grid cells show the phase emoji and the focus** (Str, Spd, End) instead of being colour only. | Year |
| **A rotate-your-phone hint**, only on a narrow portrait screen and only when there's a focus to reveal. | Year |
| **Grit score shown to the athlete** — band, plain-language line, the parts as counts. | Load |
| **Goal shortlist and goal check** — two or three qualities for the year, each with where you stand now. | Year |
| **Check-in 3 is turn-up-and-go** — no booking, and excluded from attendance scoring. | Book |

### Backend (`COMPLETE-APPS-SCRIPT.gs`)

- **Check-in 3 moved to Tue 20 Oct**, 07:15–08:15 — the second week back, not the first. **Already deployed and live.**
- **Check-in 4's Monday slot moved to Fri 23 Oct**, 11:40–12:30. Mon 19 is a D day and D-day lunch is PE 8 (06B) in the Sports Hall. **Committed but NOT live — needs a sheet edit, see below.**

### New files

- **`tools/smoke.js`** — run `node tools/smoke.js` after any Apps Script paste. It checks every endpoint and detects a stale deployment, which is the failure that cost three rounds in September.
- **`year-view-prototype.html`** — a prototype, **not wired to anything and not linked from any portal**. Five real year maps in it, by Athlete_ID. For deciding what the Year tab should become.

---

## Waiting on you

1. **Edit the `Check_Ins` sheet.** On the `ci4_mon1019_lunch` row: Date → `2026-10-23`, and ideally ID → `ci4_fri1023_lunch`. All seven Check-in 4 slots have 0 bookings, so nobody is being moved.
2. **If you already ran "Reserve my check-in times"** — there's a calendar hold on Mon 19 that won't follow the sheet. Delete it and re-run.
3. **Send the squad message** about check-ins 3 and 4.
4. **Decide the Year tab direction** — the prototype is the thing to look at.

## Still open from before today

- **Fuel Lab stores names and emails.** Asked for months ago, never done.
- **Teacher-facing Grit view** in admin — not built.
- **`Performance` / `Mobility` / `Recovery` tabs** never checked for `x2526-` rename tags.
- **Dead files** — `clash.html`, `academy-portal.html`, `athlete-portal.html`, `profile-mockup.html`. Parked by you.
- **Parent summary.** Parked by you.
