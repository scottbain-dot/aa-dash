# What changed

Newest first.

**How we work:** everything lands on `claude/genericise-portal-lab-r1l098` first and
is shown as screenshots here before anything goes near `main`. Nothing merges
until Scott says so. The two sections below are the two states — what students
have, and what is waiting on a yes.

---

## On the branch, waiting on a decision

Not merged. Students see none of this. No portal file is touched by any of it —
these are standalone pages plus this changelog.

| | |
|---|---|
| **`ladder-prototype.html`** | **Where you are now.** Speed / Power / Strength / Move well as a stack, Change of direction and Engine alongside. Each rung says the same four things: what you can do, where that sits, which way it's going, what you're doing about it. The rungs *support* each other — they do not gate. Feeds Training Age directly. Runs on athlete 41's real record and a worked example. |
| **`year-view-prototype.html`** · Focus first | The month tile carries **what you're building**; the sports drop to an in-season / training / off ribbon. Dissolves the "which sport leads" problem — sports tied for the lead are tied on phase, so the tile looked identical either way. |
| **`year-view-prototype.html`** · Year strip | The 12-tile strip made multi-sport: tile = the leading sport, name shown only where the lead *changes*, other sports as lettered pips. Two rows of six on a phone so the whole year fits without scrolling. |
| **`CHANGELOG.md`** | This file. |

**Open questions before any of it merges**

- The dashboard's level bands return `4` for two adjacent thresholds, so Level 4 is twice as wide as every other band and Level 5 only opens at the top threshold. The ladder leans entirely on these. Fix or confirm first.
- Does the Year tab's block expand into the ladder, or do they stay separate?
- Only the aerobic base is measured. Threshold and top end would each need a test adding.

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
