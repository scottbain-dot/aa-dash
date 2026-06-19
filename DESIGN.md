# DESIGN.md — Athlete Academy Design System

> **Source of truth:** `index.html` (Student Dashboard)
> All other portals should follow these specs exactly.

---

## 1. Colour Tokens

### CSS Custom Properties

```css
:root {
    /* Primary brand */
    --primary: #6b3430;
    --primary-container: #874b46;
    --secondary: #85504c;
    --burgundy: #874b46;
    --burgundy-dark: #6b3430;
    --burgundy-light: #a06b66;

    /* Neutrals */
    --black: #1d1b1b;
    --text: #524342;
    --text-muted: #857371;
    --white: #ffffff;
    --light-grey: #e0dede;

    /* Surfaces */
    --surface: #f8f2f1;
    --surface-inner: #ffffff;
    --surface-elevated: #ede7e5;
    --off-white: #fef8f6;
    --ghost-border: rgba(215, 194, 191, 0.15);

    /* Metal tiers */
    --bronze: #CD7F32;
    --copper: #B87333;
    --silver: #A8A9AD;
    --gold: #D4AF37;

    /* Status */
    --green: #22c55e;
    --green-dark: #16a34a;
    --amber: #f59e0b;
}
```

### Hardcoded Colours (not tokenised but used consistently)

| Colour | Hex / Value | Usage |
|--------|-------------|-------|
| Track background | `#e8e0de` | Progress bar tracks, timeline connector, hover backgrounds |
| Dot inactive | `#d7c2bf` | Carousel dots, timeline future borders |
| Building score | `#ffb3ac` | Training Age score text at Building level |
| Approaching score | `#e8a862` | Training Age score text at Approaching level |
| Achieving score | `#c8c9cd` | Training Age score text at Achieving level |
| Gold dark | `#c49a00` | Gradient start for mastering/leading pillar boxes |
| Gold gradient end | `#B8962E` | End of Leading score gradient |
| Platinum text | `#E5E4E2` | Leading level text colour |
| Component hover | `rgba(135,75,70,0.04)` | Subtle hover on interactive rows |
| Hero gold glow | `rgba(212,175,55,0.15)` | Radial gradient decorative overlay |
| Hero burgundy glow | `rgba(135,75,70,0.1)` | Radial gradient decorative overlay |

### Level Gradient System

Used on fill bars and badges throughout the app:

| Level | Gradient | Text |
|-------|----------|------|
| Building | `linear-gradient(135deg, #8B8B8B, #6B6B6B)` | white |
| Approaching | `linear-gradient(135deg, #CD7F32, #A66828)` | white |
| Achieving | `linear-gradient(135deg, #C0C0C0, #A8A8A8)` | var(--black) |
| Mastering | `linear-gradient(135deg, #FFD700, #D4AF37)` | var(--black) |
| Leading | `linear-gradient(135deg, #2C2C2C, #1a1a1a)` | #E5E4E2 |

---

## 2. Typography

### Font Stack

```css
font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
```

Loaded via Google Fonts with weights: **400, 500, 600, 700, 800, 900**.

### Icon Font

```
Material Symbols Rounded — weight 400, optical size 24, FILL 0 (FILL 1 for active nav)
```

### Type Scale

| Element | Size | Weight | Extras |
|---------|------|--------|--------|
| Hero athlete name | 1.75rem | 800 | letter-spacing: -0.5px |
| Hero Training Age score | 4rem | 900 | letter-spacing: -0.03em |
| Gauge centre number | 2.5rem | 900 | letter-spacing: -0.02em |
| Up Next heading | 1.5rem | 800 | letter-spacing: -0.01em |
| Insight card title | 1.25rem | 800 | line-height: 1.3 |
| Modal title | 1.25rem | 800 | letter-spacing: -0.3px |
| Gauge heading | 1.1rem | 800 | letter-spacing: -0.01em |
| Pattern name (strength) | 1.1rem | 800 | — |
| Component score | 1.25rem | 900 | letter-spacing: -0.02em |
| Pillar box score | 1.75rem | 900 | letter-spacing: -0.02em |
| Body text | 0.85rem | 400–500 | — |
| Insight card body | 0.875rem | 400 | line-height: 1.5 |
| Component name | 0.78rem | 500 | — |
| Nav button | 0.8rem | 600 | — |
| Small labels | 0.75rem | 700 | — |
| Raw value sub-label | 0.65rem | 400 | — |

### Overline Pattern

Used for section labels, card titles, and category headers:

```css
font-size: 0.625rem;      /* 10px */
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.25em;
color: #524342;
```

Variant at 9–10px used for strength tier overlines with `letter-spacing: 0.15em–0.2em`.

---

## 3. Surface Hierarchy

Three-layer nesting system:

```
Page background:   #fef8f6  (--off-white)
  Card / Section:  #f8f2f1  (--surface)
    Inner content: #ffffff  (--surface-inner)
```

Additional surface: `#ede7e5` (--surface-elevated) for pressed/hover states.

The dark hero and Up Next sections break this pattern intentionally — see Dark Surfaces below.

---

## 4. Card Treatments

### Outer Card (Section Container)

```css
background: #f8f2f1;
border-radius: 2rem;
padding: 2rem;
box-shadow: none;
```

### Inner Card (Content Block)

```css
background: #ffffff;
border-radius: 1.5rem;
padding: 1.5rem;
box-shadow: 0px 4px 16px rgba(53, 15, 13, 0.04);
```

**Hover state:**
```css
box-shadow: 0px 12px 32px rgba(53, 15, 13, 0.08);
transform: scale(1.02);
transition: box-shadow 0.2s ease, transform 0.2s ease;
```

### Section Wrapper (alternate)

```css
background: #f8f2f1;
border-radius: 2rem;
padding: 2rem;
margin-bottom: 3rem;
```

---

## 5. Component Patterns

### Progress Bars

Three sizes used throughout:

| Context | Height | Track | Fill | Radius |
|---------|--------|-------|------|--------|
| Component row | 10px | `#e8e0de` | `#874b46` | 9999px |
| Mini graph (expanded) | 8px | `#e8e0de` | `#874b46` | 9999px |
| Strength tier | 6px | `#e8e0de` | `#874b46` | 9999px |

Gold variant fill (`#D4AF37`) used for gold/platinum level components.
All fills animate with `transition: width 0.5s–0.8s ease`.

### Buttons

**Portal Link (primary CTA):**
```css
background: linear-gradient(135deg, var(--primary), var(--primary-container));
color: var(--white);
border-radius: 0.5rem;
font-size: 0.75rem;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 0.5rem 1rem;
```

**Up Next Button (two variants):**
```css
/* Grit (burgundy) */
background: #874b46;
color: #ffffff;
border-radius: 0.5rem;
padding: 0.6rem 1.25rem;
font-size: 0.85rem;
font-weight: 700;

/* Strength (gold) */
background: #D4AF37;
color: #1d1b1b;
```

### Modals

**Overlay:**
```css
background: rgba(0,0,0,0.6);
backdrop-filter: blur(4px);
z-index: 1000;
```

**Content panel:**
```css
background: var(--surface);  /* #f8f2f1 */
border-radius: 2rem;
padding: 2rem;
max-width: 600px;
width: 90%;
max-height: 80vh;
overflow-y: auto;
box-shadow: 0 20px 60px rgba(53, 15, 13, 0.2);
```

**Strength modal variant:** uses `#fef8f6` background, `max-width: 680px`, `width: 92%`.

**Close button:**
```css
width: 36px;
height: 36px;
border-radius: 50%;
color: var(--text-muted);
/* hover: background var(--surface) or #e8e0de */
```

### Loading Spinner

```css
width: 50px;
height: 50px;
border: 4px solid var(--surface);
border-top-color: var(--primary);
border-radius: 50%;
animation: spin 1s linear infinite;
```

### Growth Indicators

Inline badges showing score changes:

```css
font-size: 0.7rem;
font-weight: 600;
padding: 0.15rem 0.4rem;
border-radius: 4px;

/* Variants */
.positive { color: #2e7d32; background: rgba(46,125,50,0.1); }
.negative { color: #c62828; background: rgba(198,40,40,0.1); }
.neutral  { color: #757575; background: rgba(117,117,117,0.1); }
```

### Editorial Quote

```css
padding: 1.5rem 2rem;
border-left: 4px solid var(--primary);
background: transparent;

blockquote { font-size: 1rem; font-style: italic; line-height: 1.6; }
.attribution {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--primary);
}
```

---

## 6. Dark Hero Section

The athlete header card uses a dark surface that breaks the standard light hierarchy:

```css
background: #1d1b1b;
border-radius: 2rem;
padding: 2rem 2.5rem;
box-shadow: 0 12px 40px rgba(53, 15, 13, 0.18);
```

**Layout:** Asymmetric grid `5fr 7fr` — left column holds the circular gauge, right column holds athlete info and pillar boxes.

**Decorative overlay (::before):**
```css
background:
    radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 100%, rgba(135,75,70,0.1) 0%, transparent 50%);
```

**Text colours on dark:**
- Name: `var(--white)` / 800 weight
- Meta: `rgba(255,255,255,0.6)` / 500 weight
- Labels: `rgba(255,255,255,0.7)`
- Score text colours vary by level (see Level Gradient System)

### Hero Pillar Boxes

Stacked vertically in the hero right column:

```css
padding: 0.85rem 1.25rem;
border-radius: 1rem;
```

| Level | Background | Text |
|-------|-----------|------|
| Building / Approaching / Achieving | `rgba(255,255,255,0.12)` | white / 0.8 opacity |
| Mastering / Leading | `linear-gradient(135deg, #c49a00, #D4AF37)` | `#1d1b1b` |

Level badge pill: `font-size: 0.5rem; border-radius: 9999px; background: rgba(0,0,0,0.2)`.

---

## 7. Circular SVG Gauge

Rendered inside the dark hero section:

```css
.gauge-svg-wrap {
    width: 200px;     /* 180px standalone variant */
    height: 200px;
}
```

**SVG structure (viewBox 0 0 200 200):**
- Background circle: `r=80`, `stroke-width=12`, `stroke: rgba(255,255,255,0.15)`
- Fill arc: `r=80`, `stroke-width=12`, `stroke: #D4AF37`, `stroke-linecap: round`
- Arc animated via `stroke-dashoffset` with `transition: 1s ease`
- Rotated `-90deg` so arc starts at 12 o'clock

**Centre text:**
```css
.gauge-number { font-size: 2.5rem; font-weight: 900; color: #ffffff; }
.gauge-max    { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
.gauge-status { font-size: 0.625rem; font-weight: 700; uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.7); }
```

---

## 8. Up Next Dark Card

Two-column CTA section on dark background:

```css
background: linear-gradient(135deg, #1d1b1b, #2d1f1e);
border-radius: 2rem;
padding: 2rem;
```

**Layout:** `grid-template-columns: 1fr 1px 1fr` — two content columns separated by a divider.

**Divider:** `background: rgba(255,255,255,0.1); width: 1px`

**Text hierarchy:**
- Card overline: `10px / 700 / uppercase / 0.25em spacing / rgba(255,255,255,0.5)`
- Column overline: same as card overline
- Heading: `1.5rem / 800 / #ffffff`
- Subtext: `0.85rem / rgba(255,255,255,0.6)`

---

## 9. Foundation Strength Pattern Cards

### Grid Layout

```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 1.25rem;
```

### Individual Card

```css
background: #ffffff;
border-radius: 1.5rem;
padding: 1.5rem;
min-height: 160px;
box-shadow: 0px 4px 16px rgba(53, 15, 13, 0.04);
/* hover */
box-shadow: 0px 12px 32px rgba(53, 15, 13, 0.08);
```

**Muted state (not assessed):** `opacity: 0.45; cursor: default`

### Content Hierarchy

1. **Pattern name** — 1.1rem / 800 / `#1d1b1b`
2. **Exercise name** — 0.8rem / `#524342`
3. **Level label** — 10px / 700 / uppercase / `#874b46`
4. **Strength tier bar** — 6px track + fill (see Progress Bars)
5. **Weight headline** — 0.85rem / 700 / colour depends on gain state

---

## 10. Movement Pattern Images

Six images used as background illustrations on strength cards:

| Pattern | File |
|---------|------|
| Squat | `strength-squat.jpg` |
| Hinge | `strength-hinge.jpg` |
| Push | `strength-push.jpg` |
| Pull | `strength-pull.jpg` |
| Lunge | `strength-lunge.jpg` |
| Press | `strength-press.png` |

### Image Treatment

```css
position: absolute;
top: 0;
right: 0;
width: 55%;
height: 100%;
object-fit: cover;
object-position: center top;
border-radius: 0 1.5rem 1.5rem 0;
opacity: 0.45;
-webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);
mask-image: linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);
pointer-events: none;
```

Key rules for consistency:
- Images are always positioned **right-aligned** within the card
- Fade gradient runs **left** so text on the left remains readable
- Opacity at **0.45** keeps the image subtle — content always dominates
- `pointer-events: none` prevents the image from intercepting clicks

---

## 11. Insights Carousel

### Structure

Cards are stacked using `position: absolute` with `opacity` transitions:

```css
.insight-card {
    position: absolute;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    background: #ffffff;
    border-radius: 1.5rem;
    padding: 1.5rem 1.75rem;
    box-shadow: 0px 4px 16px rgba(53, 15, 13, 0.04);
}
.insight-card.active {
    opacity: 1;
    pointer-events: auto;
    position: relative;
}
```

### Top Colour Bar

```css
position: absolute;
top: 0; left: 0; right: 0;
height: 4px;
border-radius: 1.5rem 1.5rem 0 0;
```

Colour set dynamically per insight category.

### Navigation

- **Dots:** 8px circles, inactive `#d7c2bf`, active `#874b46`, gap 0.4rem
- **Arrows:** `color: #874b46; opacity: 0.6` → `1.0` on hover
- **AI loading pulse:** `animation: insightPulse 1.5s ease-in-out infinite` (opacity 1 → 0.4)

---

## 12. Pillar Component Rows (Expand / Graph)

### Row Layout

```css
display: flex;
align-items: center;
gap: 0.75rem;
padding: 0.25rem 0 0.25rem 0.5rem;
border-left: 3px solid transparent;
border-radius: 6px;
cursor: pointer;
```

**Expanded state:** `border-left-color: #874b46`

### Chevron

```css
font-size: 0.7rem;
color: #857371;
transition: transform 0.3s ease;
/* expanded: rotate(180deg) */
```

### Expandable Mini Graph

```css
max-height: 0;
overflow: hidden;
transition: max-height 0.3s ease;
/* open: max-height: 160px */
```

**Inner panel:**
```css
background: #f8f2f1;
border-radius: 0.75rem;
padding: 1rem;
```

Contains an 8px progress bar and a 70px sparkline chart canvas.

### Chart Tooltip

```css
background: #1d1b1b;
color: #fff;
font-size: 0.65rem;
padding: 3px 7px;
border-radius: 4px;
```

---

## 13. Bottom Navigation (Glassmorphism)

```css
position: fixed;
bottom: 0;
left: 0; right: 0;
background: rgba(254, 248, 246, 0.85);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-top: 1px solid var(--ghost-border);
box-shadow: 0 -12px 32px rgba(53, 15, 13, 0.06);
z-index: 900;
```

**Inner container:** `max-width: 1200px; padding: 0.6rem 2rem`

### Logo

```css
.nav-logo-icon {
    width: 32px; height: 32px;
    background: var(--burgundy);
    border-radius: 8px;
}
.nav-logo-text {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--burgundy-dark);
    /* "Academy" in gold via span */
}
```

### Nav Buttons

```css
padding: 0.5rem 1rem;
border-radius: 0.75rem;
font-size: 0.8rem;
font-weight: 600;
color: #524342;
opacity: 0.5;
border-top: 3px solid transparent;
```

**Active state:**
```css
color: #6b3430;
font-weight: 700;
opacity: 1;
border-top: 3px solid #6b3430;
/* icon: FILL 1 */
```

**Hover state:**
```css
background: var(--burgundy-dark);
color: var(--white);
opacity: 1;
```

---

## 14. Strength Detail Modal

### Level Timeline (Horizontal Stepper)

```css
display: flex;
justify-content: space-between;
/* connector line */
::before {
    top: 16px;
    height: 2px;
    background: #e8e0de;
}
```

**Circle states (32px):**
- Completed: `background: #874b46; color: #ffffff`
- Current: `background: #D4AF37; color: #ffffff`
- Future: `border: 2px solid #d7c2bf; color: #857371`

**Status labels:**
- Passed: `color: #22c55e`
- Active: `color: #D4AF37`

### Strength Chart Tooltip

```css
background: #1d1b1b;
color: #ffffff;
font-size: 0.75rem;
border-radius: 0.5rem;
padding: 6px 10px;
transform: translate(-50%, -100%);
```

---

## 15. Welcome / Sign-In Screen

```css
min-height: 100vh;
background: linear-gradient(135deg, var(--primary), var(--primary-container), var(--secondary));
text-align: center;
```

**Privacy notice:**
```css
background: rgba(255,255,255,0.12);
border-radius: 1rem;
padding: 15px 25px;
max-width: 500px;
```

---

## 16. Layout & Spacing

### Container

```css
max-width: 1200px;
margin: 0 auto;
padding: 2rem 3rem;
```

### Grid Patterns

| Section | Columns | Gap |
|---------|---------|-----|
| Hero | `5fr 7fr` | 2rem |
| Below-hero row | `1fr 1fr` | 1.5rem |
| Pillar detail cards | `repeat(3, 1fr)` | 1.5rem |
| Strength grid | `repeat(3, 1fr)` | 1.25rem |
| Up Next columns | `1fr 1px 1fr` | 0 |
| Modal stats | `repeat(3, 1fr)` | 1rem |

### Spacing Scale

Common values: `0.25rem`, `0.5rem`, `0.6rem`, `0.75rem`, `1rem`, `1.25rem`, `1.5rem`, `2rem`, `3rem`.

Section gaps use `margin-bottom: 3rem` consistently.

### Minimum Width

```css
body { min-width: 1024px; }
```

Page has `padding-bottom: 6rem` to clear the fixed bottom nav.

---

## 17. Transitions & Animation

| Property | Duration | Easing | Usage |
|----------|----------|--------|-------|
| Box shadow + transform | 0.2s | ease | Card hover |
| Bar width | 0.5s–0.8s | ease | Progress bar fill |
| Max height | 0.3s | ease | Expandable panels |
| Opacity | 0.3s | ease | Carousel cards |
| Transform (chevron) | 0.3s | ease | Expand/collapse |
| Stroke-dashoffset | 1s | ease | SVG gauge arc |
| Opacity (tooltip) | 0.15s | — | Chart tooltips |
| Background | 0.2s | — | Nav hover |

### Keyframe: Loading Pulse

```css
@keyframes insightPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}
/* Duration: 1.5s ease-in-out infinite */
```

### Keyframe: Spinner

```css
@keyframes spin {
    to { transform: rotate(360deg); }
}
/* Duration: 1s linear infinite */
```
