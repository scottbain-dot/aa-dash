# Athlete Academy — system review and order of attack

**Date:** 1 October 2026
**Scope:** the G10–12 portal (`portal-lab.html`), the Apps Script backend, and the
surrounding portals. The G9 build (`g9-portal.html`, the Board, admin Stamps) is
referenced but not reviewed here.

This is a baseline. The numbers in §1 are measured, not estimated, and are the
things to re-measure in a term's time.

---

## 1. The baseline

Measured 1 Oct 2026 across the 34 athletes on the G10–12 roster (IDs 41–74),
by Athlete_ID only.

| Stage | Athletes | % |
|---|---|---|
| On the roster | 34 | 100% |
| Year map set | 24 | **71%** |
| Program built | 17 | **50%** |
| Ever logged a day | 13 | **38%** |
| Logged in the last 7 days | 8 | **24%** |

**102 logged training days across the whole cohort, all time.** The top five
athletes account for **73%** of them.

Three stuck groups:

- **Planned a year, never built a program (8):** 44, 49, 50, 52, 60, 65, 69, 70
- **Built a program, never logged once (6):** 46, 47, 48, 54, 56, 72
- **Nothing at all (9):** 53, 55, 63, 64, 66, 67, 71, 73, 74

Foundation movement levels across the same cohort:

- **10 at L2+** with all six patterns stamped — 42–48, 50, 51, 52 (last year's G9)
- **0 at L1 only**
- **24 with no stamps at all** — effectively every G11 and G12

---

## 2. What the system does well

**The data model.** Every portal read and write is keyed by `Athlete_ID`, never
email, enforced by `tools/check-identity.js` on every commit. Training data stays
pseudonymous. This is the thing that makes the system defensible beyond one
school, and it is the single best engineering decision in the project.

**The year → block → week spine.** Most training apps have a week. Almost none
has a year that explains the week. A multi-sport athlete now opens their program
and reads "Cross Country build · week 9 of 13" with swimming marked as ticking
over underneath — derived from a month grid they filled in once.

**A coherent four-year arc.** G9 stamps → G10 program → G11 refinement → G12 CV,
with data carried the whole way. Ten current G10s already have their G9 technique
levels in their record. Nothing else in schools does athletic development as a
multi-year data progression.

**Design judgement.** Celebration-only CV, blocks that label rather than change,
autonomy over prescription, blurred locks instead of zeros, prompts instead of
auto-switching. These are the calls most products get wrong.

**It is real.** 13 students have logged 102 days of genuine training.

---

## 3. The problem that matters more than the rest

**Everything built sits downstream of a logged session, and 62% of students
never log one.**

Load, Grit, streaks, XP, badges, the CV and training age are all dark until
somebody taps "done". The system has a rich back half and a front door most
students never get through.

Athlete 72 is the shape of it: a real goal (college pre-season, July 2027), a
program built, 19 sessions planned, **zero logged, ever**. The portal shows them
nothing, so they do not return, so it stays empty.

There are **two separate leaks**, and they need different fixes:

1. **Year map → program (24 → 17).** Eight students planned a year and never
   built a week. This is a "now what?" gap at the end of the Year tab.
2. **Program → first log (17 → 13).** Six built a week and never ticked anything
   off. This is logging friction.

---

## 4. What else needs work

**Single-teacher dependency.** One person is the admin, the stamper, the
deployer and the only writer to `Strength`. This caps the system at roughly one
teacher's worth of students and is the binding constraint on the ambition.

**Operational fragility.** Three incidents inside two weeks: a load bug silently
reporting every logged week as zero; a re-key tool that archived three current
athletes' data across every tab; and three rounds of deploy confusion. No tests,
no staging, deployment is copy-paste into an editor.

**Codebase sprawl.** 16 HTML files, 2.3 MB. `portal-lab.html` alone is 11,601
lines / 698 KB. Four files untouched since 6 Sep and likely dead — `clash.html`
(234 KB), `academy-portal.html`, `athlete-portal.html`, `grit-portal.html` — plus
`profile-mockup.html` (170 KB of static mockup). Thirteen files hardcode the Apps
Script deployment URL.

**The empty state is the real product for most students.** The experience of an
engaged athlete is designed well. The experience of a student with nothing — nine
of them — is a blank week and a button.

---

## 5. Opportunities and blind spots

1. **The build so far serves the engaged quarter.** Gamification, CV and Level Up
   reward students already using the system. The majority who planned and stopped
   need something different.
2. **Logging friction is a design problem, not a motivation problem.** One-tap
   "did it as planned" from the Today card, log-the-week-at-once, or auto-logging
   from the calendar booking already read for Grit.
3. **Teacher time is the scarce resource, not features.** Almost everything built
   adds something a student can do; very little reduces what the teacher must do.
   Worth asking of every future feature: does this make the system run more
   without me?
4. **The system knows things it never says.** One athlete trained 4,700 au across
   six days with no rest day and two tournaments. Another trains 11 hours a week
   across four sports with no strength work and a stated goal of starting strength
   training. A third has a college goal and three months planned. All of it sits
   in the data and nothing surfaces it.
5. **Parents are absent.** For a youth athlete they drive the car, buy the food
   and care most about the college outcome. A termly auto-generated development
   summary costs nothing after build.
6. **Club coaches are the missing stakeholder.** Athletes do 4–6 club sessions a
   week the academy cannot see — for one athlete the entire program *is* the club
   timetable.
7. **The longitudinal data is the real asset.** Multi-year technique, load,
   testing and psychology data on adolescents. Schools do not have this.
8. **The four-year arc is invisible to the students living it.** They only ever
   see this year.
9. **Duty of care.** The system collects RPE, load, injury flags and hard-period
   data on adolescents. It will at some point be the first place an overtraining
   or under-fuelling pattern is visible. What it should do then is a decision to
   take deliberately, in advance.
10. **Graduation.** If this is the athlete's one-stop shop it should outlive the
    school. Decide before the first cohort leaves.

---

## 6. Order of attack

All ten opportunities above are worth building. Building them in parallel is how
none of them get finished. The order below is chosen so that early work unblocks
later work, and so the thing that gates everything gets fixed first.

### Wave 1 — fix the funnel *(now → half term)*

Nothing else is worth building until the two leaks in §3 are closed.

1. **One-tap logging.** "Did it as planned" straight from the Today card, no
   sheet, no fields. Highest value per hour of work in the whole list.
2. **Design the empty state.** A student with nothing should see one obvious
   action, not a blank week.
3. **Programs attach to blocks** (step 4 of the year/program work). This is the
   fix for the eight who planned a year and stopped — it answers "now what?" at
   the end of the Year tab.
4. **Log the week at once.** A single screen to tick off several days.

*Success measure: ever-logged above 38%, and 7-day-active above 24%.*

### Wave 2 — make it run without one person

5. **Teacher attention list.** Who has not logged in two weeks; whose load
   spiked; whose goal has no plan behind it. Mostly queries that already exist.
6. **Duty-of-care flag.** Decide the policy, then build the trigger into the
   attention list rather than bolting it on later.
7. **Smoke test + deploy checklist.** A script that calls each endpoint after a
   deploy and fails loudly. Three incidents in two weeks justify it on its own.
8. **Delete the dead files.** `clash.html`, `academy-portal.html`,
   `athlete-portal.html`, `profile-mockup.html`, and `grit-portal.html` if the
   Grit unit is not returning.

### Wave 3 — widen the circle

9. **Parent summary.** Termly, auto-generated, no teacher time per student.
10. **Club coach view.** Read-only, so the 4–6 weekly club sessions stop being
    invisible.
11. **CV, finished.** Levels, load tiers, testing with first→latest growth, PBs,
    blurred where there is nothing yet.

### Wave 4 — the long game

12. **The four-year view.** Show a student where they were in G9 and where they
    are heading by G12.
13. **Graduation and portability.** What leaves with the athlete.
14. **The longitudinal data as an asset.** Development curves, and the case this
    data could make externally.

---

## 7. Decisions still open

- Whether `grit-portal.html` returns, or the Grit unit is retired.
- What the system does when it sees an overtraining or under-fuelling pattern.
- Whether club load is entered by the athlete, imported, or stays invisible.
- What an athlete takes with them at graduation.
- Whether the G9 and G10–12 portals converge on shared content or stay separate.
