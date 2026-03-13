# CLAUDE.md - Athlete Academy Project

## Project Owner
**Scott Bain (Lad)** - PE Teacher at Frankfurt International School (FIS), Germany
- Teaches Grades 7-9
- Runs "Athlete Academy" program for student athletic development
- Competitive HYROX athlete (current PB: 1:17:18, target: sub-1:05)

---

## Project Overview

The **Athlete Academy** is a comprehensive student athletic development system with multiple interconnected web portals. All portals share:
- Google Sign-In authentication (same OAuth client)
- Google Sheets as the database (via Apps Script API)
- FIS Warriors branding (burgundy #874B46 + gold #D4AF37)
- Common design language and UX patterns

### The Ecosystem

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATHLETE ACADEMY ECOSYSTEM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   DASHBOARD  │    │   STRENGTH   │    │     GRIT     │      │
│  │  (index.html)│◄──►│    PORTAL    │◄──►│    PORTAL    │      │
│  │              │    │              │    │              │      │
│  │ Training Age │    │ Workout Gen  │    │ 8-Session    │      │
│  │ Radar Chart  │    │ Tech Levels  │    │ Challenge    │      │
│  │ All Scores   │    │ Strength Tiers│   │ Psychology   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │   ADMIN PANEL   │                          │
│                    │   (admin.html)  │                          │
│                    │                 │                          │
│                    │ Teacher View    │                          │
│                    │ Edit Scores     │                          │
│                    │ Class Overview  │                          │
│                    └─────────────────┘                          │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  GOOGLE SHEETS  │                          │
│                    │   (Database)    │                          │
│                    │                 │                          │
│                    │ + Apps Script   │                          │
│                    │   API Backend   │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files in This Repository

### Main Portals

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Student Dashboard - Training Age radar, all scores overview | ✅ Complete |
| `strength-portal.html` | Strength workouts - technique levels, strength tiers, workout generation | ✅ Complete |
| `admin.html` | Teacher admin panel - view all students, edit scores, class insights | ✅ Complete |
| `grit-portal.html` | Grit Challenge - 8-session psychology assignment | 🔧 Needs integration |

### Backend

| File | Purpose |
|------|---------|
| `COMPLETE-APPS-SCRIPT.gs` | Google Apps Script backend for all portals |

---

## API Endpoints

### Primary Athlete Data API
```
https://script.google.com/macros/s/AKfycbxg8voUoN0Lpffv_fQIcI7igALEksa0MSUscvNMS0HLWLY3Oi_9IqQbUwwSw1JzJ0HK/exec
```
Used by: `index.html` (Dashboard)

**Actions:**
- `?email=X` - Get athlete data by email
- Returns: Training Age scores, physiology data, psychology data, performance tests

### Strength Portal API
```
https://script.google.com/macros/s/AKfycbzoyT7zqrOhEf3LAsflbRB73OO2-RaHdnCz5f676xuO9Odc6wFUQpo0aE3XX6Qt-Bk0/exec
```
Used by: `strength-portal.html`, `admin.html`, `grit-portal.html`

**Actions:**
- `?action=getAthlete&email=X` - Get athlete strength data
- `?action=getWorkoutHistory&odaId=X` - Get workout history
- `?action=getAdminData` - Get all students (admin only)
- POST `saveWorkout` - Save completed workout
- POST `updateAdminData` - Update athlete scores (admin)

### Grit Portal API (to be added)
Same endpoint as Strength Portal, with new actions:
- `?action=getGritChallenge&email=X` - Get student's Grit challenge
- POST `saveGritChallenge` - Save/update challenge data

---

## Google OAuth Configuration

**Client ID:** `761245051498-tptgfgo1ib49s01frtslltm4p6h03fvl.apps.googleusercontent.com`

All portals use the same OAuth client. Students log in once and can navigate between portals seamlessly.

---

## Branding & Design System

### Colors (CSS Variables)
```css
:root {
    --burgundy: #874B46;       /* Primary - FIS Warriors */
    --burgundy-dark: #6a3a36;  /* Darker shade */
    --burgundy-light: #a06b66; /* Lighter shade */
    --gold: #D4AF37;           /* Accent - FIS Warriors */
    --gold-light: #f5e6b3;     /* Light gold */
    --black: #1a1a1a;          /* Text */
    --white: #ffffff;
    --off-white: #f8f6f5;      /* Background */
    --grey: #555555;           /* Secondary text */
    --light-grey: #e0dede;     /* Borders */
    --green: #22c55e;          /* Success */
    --green-dark: #16a34a;
    --amber: #f59e0b;          /* Warning */
    --blue: #2563eb;           /* Info/Links */
}
```

### Typography
- Primary: 'Segoe UI', system-ui, sans-serif
- Weights: 400 (body), 600 (labels), 700 (headings), 800 (numbers)

### Component Patterns
- Cards: `border-radius: 16px`, `padding: 24px`, subtle shadow
- Buttons: `border-radius: 10px`, gradient backgrounds for primary
- Inputs: `border: 2px solid var(--light-grey)`, `border-radius: 10px`
- Progress bars: `border-radius` matches height

### UX Preferences (from Scott)
- **Minimal formatting** - avoid excessive bullet points, headers
- **Natural language** - warm, encouraging tone for students
- **Accessibility focus** - larger text, good contrast, clear labels
- **Mobile-responsive** but primarily used on Mac laptops in class
- **Examples hidden by default** - show via "Need ideas?" toggles (autonomy)
- **No jargon** - avoid terms like "Tier A/B", use plain language

---

## Training Age Framework

The core metric combining multiple dimensions:

### Three Pillars

```
┌─────────────────┬─────────────────┬─────────────────┐
│   PSYCHOLOGY    │   PHYSIOLOGY    │ HEALTH & SKILLS │
├─────────────────┼─────────────────┼─────────────────┤
│ • Coachability  │ • Strength      │ • Movement      │
│ • Mindset       │ • Broad Jump    │ • Technical     │
│ • Grit          │ • 40m Sprint    │ • Health        │
│                 │ • Agility       │ • Balance       │
│ (from Grit      │ • Cooper Test   │                 │
│  Challenge)     │ • Mobility      │ (FMS scores)    │
└─────────────────┴─────────────────┴─────────────────┘
```

### Scoring
- All components scored 1-5
- Displayed as radar chart on dashboard
- Training Age = weighted average (formula in Apps Script)

---

## Strength Portal Details

### Movement Patterns (6 total)
```javascript
const MOVEMENT_PATTERNS = {
    squat: { name: 'Squat', icon: '🏋️' },
    hinge: { name: 'Hinge', icon: '🏋️' },
    push: { name: 'Push', icon: '💪' },
    pull: { name: 'Pull', icon: '🔝' },
    lunge: { name: 'Lunge', icon: '🦵' },
    press: { name: 'Press', icon: '🙆' }
};
```

### Technique Levels (1-5)
Each pattern has 5 technique levels with video demonstrations:
- Level 1: Basic movement (e.g., Box Squat)
- Level 5: Advanced (e.g., Barbell Back Squat)

Students must pass technique assessment before progressing.

### Strength Tiers (1-5)
After technique Level 3+, students can do strength tests:
- Based on weight moved relative to bodyweight
- Different formulas per pattern (documented in Apps Script)

### Workout Generation
- Session A / Session B alternating structure
- Exercises auto-selected based on technique level
- Weight recommendations based on previous workouts
- "Ready to Progress?" prompts when student is ready for next level

---

## Grit Portal Details (NEW - Needs Work)

### Purpose
8-session athletic development challenge that builds Psychology scores (Mindset, Mental Toughness, Grit).

### Timeline (2025)
| Date | Session |
|------|---------|
| Wed 25 Mar | Session 1: Baseline measurement |
| 30 Mar - 12 Apr | Spring Break (optional practice) |
| Wed 15 Apr | Session 2 |
| Mon 20 Apr | Session 3 |
| Wed 22 Apr | Session 4 |
| Mon 27 Apr | Session 5 |
| Tue 5 May | Session 6 |
| Wed 13 May | Session 7 |
| Tue 19 May | Session 8: Final test |
| Thu 22 May | **DUE** - All evidence on Canvas |

### Challenge Types

**Fitness Test (was "Tier A")**
- Improve official fitness score (Strength, Broad Jump, Sprint, Agility, Cooper, Mobility)
- Session 8 must be official retest verified by teacher
- Updates Physiology scores if passed

**Personal Challenge (was "Tier B")**
- Sport Skill (free throws, serves, etc.)
- Movement Skill (handstand, muscle-up, pistol squat)
- Endurance (running streak, distance goal)
- Mobility (splits, deep squat)
- Custom (student proposes)

### Psychology Scoring (from Grit Challenge)

| Component | Who Scores | How |
|-----------|-----------|-----|
| **Mindset** (1-5) | Teacher | Based on goal ambition, challenge level, "Why", reflections |
| **Mental Toughness** (1-5) | Student self-assesses, teacher adjusts | Self-rating + reflection evidence |
| **Grit** (1-5) | Teacher | Sessions completed, time logged, progress achieved |

### Setup Flow (4 steps)
1. **Choose Type** - Fitness Test or Personal Challenge
2. **Choose Focus** - Shows current scores for Fitness Test option
3. **Set Goal** - Baseline, target, measurement method, challenge level (1-5), why
4. **Name Excuses** - List barriers + commitment checkbox

### Active View Features
- **Next Action card** - prominent "Your next step" at top
- **Progress display** - Start → Current → Goal with bar
- **Linear timeline** - All 8 sessions + holiday + due date
- **Home sessions** - Logged practice outside class (target: 3 hours total)
- **Canvas link** - Evidence upload prompt after each session

### Session Check-in (Sessions 1-7)
Prompts:
1. What did you do?
2. What excuse almost stopped you?
3. What made you do it anyway?
4. What did you learn?

After completion: Prompt to upload evidence to Canvas

### Final Session (Session 8)
Prompts:
1. Final measurement
2. Did you reach your goal?
3. Rate your Mental Toughness (1-5 self-assessment)
4. Describe a moment you almost quit
5. What did this teach you about yourself?

---

## Current State & Known Issues

### Grit Portal - Needs Work
1. **API integration** - Needs Apps Script functions for Grit data
2. **Canvas URL** - Placeholder needs real assignment link
3. **Data persistence** - Currently demo mode only
4. **Physiology scores** - Need to pull from same API as dashboard

### API Endpoint Discrepancy
- `index.html` uses different endpoint than `strength-portal.html`
- Both should work but verify they return same athlete data

### Console Logs
- `strength-portal.html` has debug logs that should be removed for production

---

## Development Notes

### Local Testing
All portals have a demo mode:
- "Test Without Login" button on welcome screen
- Sets `DEMO_MODE = true`
- Uses hardcoded demo data

### Deployment
- Files hosted on GitHub Pages (or Netlify)
- Apps Script deployed as web app (Execute as: Me, Access: Anyone)

### File Structure Preference
- Single HTML files with inline CSS and JS (no build step)
- Makes deployment simple - just upload the file
- Larger files are OK for this use case

---

## What to Build Next

### Priority 1: Grit Portal Integration
1. Add Apps Script functions for Grit data (save/load challenge)
2. Connect to real athlete data for physiology scores
3. Test full flow with real Google login
4. Add Canvas assignment URL

### Priority 2: Grit Admin Features
- Teacher view of all student challenges
- Approve/reject plans
- Enter Mindset/Grit scores
- Adjust Mental Toughness scores

### Priority 3: Dashboard Integration
- Show Grit Challenge status on main dashboard
- Link to Grit Portal from dashboard
- Display Psychology scores from Grit Challenge

---

## Style & Communication Preferences

When building for this project:
- **Use plain language** - Students with learning needs should understand everything
- **Hide complexity** - Examples, scoring info, etc. behind toggles
- **Show current data** - When selecting focus, show their actual scores
- **Calendar with real dates** - Not just "Session 1, 2, 3"
- **Evidence reminders** - After each session, prompt Canvas upload
- **Autonomy** - Don't over-prescribe session content; let students plan

---

## Files to Reference

When working on this project, these files in the repo are the source of truth:
- `index.html` - Dashboard design patterns
- `strength-portal.html` - Workout flow, tile design, modal patterns
- `admin.html` - Admin interface patterns
- `COMPLETE-APPS-SCRIPT.gs` - All backend logic

The `grit-portal.html` file is new and may need significant updates to match the integration level of the other portals.

---

## Contact & Context

This is a real school project used by real students. Changes affect actual classroom instruction. The Grit Assignment runs from late March through May 2025 with a Canvas submission deadline of May 22.

Scott (Lad) is usually available to test and provide feedback quickly. He prefers seeing working demos over discussing theoretical changes.
