# ShipStory — Landing Page Design Guide
**For: Antigravity / Gemini coding agent**
**Stack: shadcn/ui + Tailwind**
**Reference: Alden (healthcare AI coordination landing page)**

This document is a literal build spec, not inspiration. Every token, spacing
value, and structural decision below is final. Where the original reference
used "Drew, Scheduling Agent," this version uses ShipStory's real agents.
Do not invent new layout patterns — follow the structure section by section.

---

## 0. Why the reference works (read this before building)

The Alden hero card is not a screenshot of a real product. It's a **diagram
disguised as software**. Three flat cards, connected by thin curved
connector lines, sitting inside one soft outer container. That's the entire
trick. It reads as "look how clean our system is" because:

1. There is exactly **one elevation level** (the outer wrapper), and
   everything inside it is flat white cards on a slightly grey-green floor.
2. The connector lines are **thin, muted, and curved** — never straight,
   never bold. They imply motion without adding visual noise.
3. Typography inside the cards is **small and quiet** (11–14px), so the
   *structure* is the hero, not the text.
4. Color is almost entirely neutral — black text, white cards, grey-green
   background. The ONE color accent (sage green) is reserved for buttons
   and the live-status dot. This restraint is why it feels premium.

Your job is to replicate this exact restraint, mapped to ShipStory's
six-agent pipeline, compressed into 3 visible nodes for the hero (with the
full 6-agent view appearing later as a "How it works" section).

---

## 1. Design tokens

### 1.1 Color palette (exact hex, light mode only — this reference has no dark mode)

```css
:root {
  /* Backgrounds */
  --bg-page: #FFFFFF;
  --bg-canvas: #EFEFEA;        /* the soft floor the hero card sits on */
  --bg-canvas-gradient-end: #E4EDD9; /* faint sage bleed at canvas edges */
  --bg-card: #FFFFFF;
  --bg-card-inset: #F5F5F2;    /* the "Shifts to be staffed" stat block bg */
  --bg-pill: #ECECE8;          /* neutral pill/badge background */

  /* Brand accent — sage green */
  --accent: #B7CE8F;           /* button fill, status dot */
  --accent-text: #2B3324;      /* dark text ON the green button */
  --accent-soft: #DCE8C8;      /* lighter sage for hover/backgrounds */
  --accent-blue: #A9D3E8;      /* the "Healthcare" headline word color */

  /* Text */
  --text-primary: #1A1A18;     /* headline black */
  --text-secondary: #5C5C57;   /* body/subtext grey */
  --text-tertiary: #8C8C86;    /* card micro-labels, timestamps */
  --text-on-dark: #FFFFFF;

  /* Borders */
  --border-subtle: #E8E8E3;
  --border-card: #ECECE7;

  /* Dark elements (the agent avatar circle) */
  --node-dark: #1F1F1D;        /* the black circle with waveform icon */

  /* Status */
  --status-dot: #B7CE8F;
}
```

### 1.2 Typography

```css
--font-sans: 'Inter', -apple-system, sans-serif; /* or 'Geist' if available in shadcn setup */

/* Headline (hero H1) */
--text-hero: 48px / 1.15 / 500;     /* font-size/line-height/weight */
--text-hero-mobile: 32px / 1.2 / 500;

/* Section headline (the "Staffing shortages..." line) */
--text-section-h: 32px / 1.3 / 500;

/* Body */
--text-body: 16px / 1.5 / 400;
--text-body-sm: 14px / 1.5 / 400;

/* Inside hero card — this is the part people overlook */
--text-card-label: 11px / 1.4 / 600;   /* "SCHEDULING CAREGIVERS" uppercase, letter-spacing 0.04em */
--text-card-stat: 28px / 1 / 500;      /* the "24" number */
--text-card-name: 20px / 1.2 / 500;    /* "Drew" / agent name */
--text-card-role: 13px / 1.4 / 400;    /* "Alden Scheduling Agent" subtitle */
--text-card-row-label: 12px / 1.4 / 400;  /* "EHR" / "Patient" / "Shift" labels */
--text-card-row-value: 13px / 1.4 / 500;  /* the values next to those labels */
```

Use `text-pretty` / tight tracking on the hero headline. The reference uses
a slightly rounded geometric sans (looks like a grotesque, similar to
**Inter**, **Geist**, or **General Sans**). Stick with Inter or Geist since
they're already in most shadcn setups — don't introduce a third font.

### 1.3 Spacing & radius scale

```css
--radius-card: 16px;        /* individual node cards */
--radius-outer: 24px;       /* the big canvas container holding all 3 nodes */
--radius-pill: 999px;       /* buttons, badges */
--radius-avatar: 8px;       /* small square-ish avatar photos */
--radius-node-dark: 999px;  /* the black circular agent icon */

--space-card-pad: 20px;     /* inner padding of each white node card */
--space-canvas-pad: 40px;   /* padding of outer grey-green wrapper */
--space-node-gap: 32px;     /* horizontal gap between the 3 cards, where connector lines live */
```

### 1.4 Shadows (keep these extremely subtle — this is 80% of why it looks expensive)

```css
--shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.03);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.06);
--shadow-outer-canvas: 0 1px 3px rgba(0,0,0,0.02);
--shadow-button: 0 1px 2px rgba(0,0,0,0.06);
```

Never use a shadow darker than ~6% opacity black anywhere on this page. The
reference has almost no shadow — depth comes from background color
contrast (white card on grey-green floor), not drop shadows.

---

## 2. Page structure (top to bottom)

```
┌─────────────────────────────────────────┐
│ NAVBAR (sticky, transparent, white bg)   │
├─────────────────────────────────────────┤
│ HERO                                     │
│  - Eyebrow-free H1, 2 lines, centered    │
│  - Subhead, 1 line, centered, grey       │
│  - CTA button, centered                  │
│  - [HERO WORKFLOW CANVAS] ← the diagram  │
├─────────────────────────────────────────┤
│ LOGO STRIP ("Built with industry         │
│  leaders at...")                         │
├─────────────────────────────────────────┤
│ ABOUT / PROBLEM SECTION                  │
│  - floating avatar circles top corners   │
│  - centered "ABOUT" pill label           │
│  - large statement headline w/ partial   │
│    color fade-out + underline on 1 phrase│
│  - supporting paragraph below            │
├─────────────────────────────────────────┤
│ (continues: Features, Impact, etc. —     │
│  not shown in reference crop, build per  │
│  your own content using same components) │
└─────────────────────────────────────────┘
```

---

## 3. Component-by-component build spec

### 3.1 Navbar

- Height: 72px. Background: white, no border, no shadow (blends into hero).
- Left: wordmark "ShipStory" — plain text, 18px, weight 600, black. No logo icon needed (reference uses text-only too).
- Center-right: nav links `Agents` `Pipeline` `Pricing` — 14px, `--text-secondary`, weight 400. Use shadcn `NavigationMenu` but strip it down to plain links, no dropdown chrome.
- Right: CTA button "Get started" — sage green pill, see §3.6.

```tsx
<header className="sticky top-0 z-50 bg-white">
  <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
    <span className="text-lg font-semibold text-[#1A1A18]">ShipStory</span>
    <div className="hidden gap-8 md:flex">
      <a className="text-sm text-[#5C5C57] hover:text-[#1A1A18]">Agents</a>
      <a className="text-sm text-[#5C5C57] hover:text-[#1A1A18]">Pipeline</a>
      <a className="text-sm text-[#5C5C57] hover:text-[#1A1A18]">Pricing</a>
    </div>
    <Button className="rounded-full bg-[#B7CE8F] text-[#2B3324] hover:bg-[#A9C17D] px-5 h-9 text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      Get started
    </Button>
  </nav>
</header>
```

### 3.2 Hero headline block

- Centered, max-width ~640px, margin-top ~64px from navbar.
- H1: two lines. Line 1 plain black. Line 2 has ONE colored word (the
  reference colors "Healthcare" in soft blue — for you, color the word that
  names your core value prop, e.g. **"Pipeline"** or **"Automatically"**).
- Use a **serif italic or different weight on the accent word** — look
  closely at the reference: "Healthcare" is rendered in a different,
  lighter/serif-leaning font than the rest of the headline. Replicate this:
  use a contrasting font (e.g. `font-serif italic`) ONLY on that one word.

```tsx
<h1 className="mx-auto max-w-2xl text-center text-[48px] font-medium leading-[1.15] text-[#1A1A18]">
  AI-Powered Shipping,
  <br />
  Built for <span className="font-serif italic text-[#A9D3E8]">Codebases</span>
</h1>
<p className="mx-auto mt-4 max-w-md text-center text-base text-[#5C5C57]">
  Purpose-built for dev teams who ship fast and can't write changelogs.
</p>
<div className="mt-8 flex justify-center">
  <Button className="rounded-full bg-[#B7CE8F] text-[#2B3324] hover:bg-[#A9C17D] px-6 h-10">
    Get started
  </Button>
</div>
```

### 3.3 THE Hero Workflow Canvas — this is the centerpiece, build it exactly

This is one outer container (`--bg-canvas`, rounded 24px, padded 40px)
containing a horizontal flex row of **3 white node cards** connected by
**SVG curved connector lines**, plus a small floating mute/status pill in
the top-right corner of the canvas.

**Outer canvas:**

```tsx
<div className="relative mx-auto mt-12 max-w-5xl rounded-[24px] bg-[#EFEFEA] p-10 
                bg-[radial-gradient(ellipse_at_bottom_right,#E4EDD9_0%,transparent_60%)]">
  
  {/* floating status pill, top right */}
  <div className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center 
                  rounded-full bg-[#B7CE8F] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
    <MicOffIcon className="h-4 w-4 text-[#2B3324]" />
  </div>

  <div className="relative flex items-stretch justify-between gap-8">
    {/* NODE 1, CONNECTOR, NODE 2, CONNECTOR, NODE 3 go here — see below */}
  </div>
</div>
```

**Node 1 — "Pipeline status card" (maps to reference's "Scheduling Caregivers" card).**
For ShipStory, this is the trigger state: a GitHub push waiting to be processed.

```tsx
<div className="w-[260px] rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8C8C86]">
      Pipeline Queue
    </span>
    <MoreHorizontal className="h-4 w-4 text-[#8C8C86]" />
  </div>

  <div className="mt-4 rounded-xl bg-[#F5F5F2] p-4">
    <p className="text-xs text-[#8C8C86]">Commits to process</p>
    <div className="mt-1 flex items-center justify-between">
      <span className="text-[28px] font-medium text-[#1A1A18]">6</span>
      <span className="rounded-full bg-[#ECECE8] px-2.5 py-1 text-[11px] text-[#5C5C57]">
        Pulled from GitHub
      </span>
    </div>
  </div>

  <div className="mt-4 flex items-center gap-1.5 text-xs text-[#5C5C57]">
    <span className="h-1.5 w-1.5 rounded-full bg-[#B7CE8F]" />
    All agents matching
  </div>
</div>
```

**Node 2 — Center "Active agent" card.** This is the visual anchor — the
black circular avatar with waveform icon is the single most important
detail in the whole reference. For ShipStory's first hero pass, feature
**Devin** (or whichever agent triggers first in your real pipeline — likely
the one that watches the GitHub webhook).

```tsx
<div className="flex w-[280px] flex-col items-center justify-center rounded-2xl 
                bg-white px-6 py-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
  <div className="h-16 w-16 overflow-hidden rounded-lg bg-[#F5F5F2]">
    {/* agent avatar image or initials fallback */}
  </div>
  <h3 className="mt-4 text-xl font-medium text-[#1A1A18]">Devin</h3>
  <p className="text-sm text-[#5C5C57]">ShipStory Trigger Agent</p>

  <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1F1F1D]">
    <AudioWaveformIcon className="h-5 w-5 text-white" />
  </div>

  <p className="mt-6 text-xs text-[#8C8C86]">Watching — git push detected</p>
</div>
```

**Node 3 — "Result/output card" (maps to reference's "New shift updated" card).**
For ShipStory, this is the generated content output handed to the next
agent (Priscilla, for copy review, or straight to Marshall for graphics).

```tsx
<div className="w-[260px] rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-[#B7CE8F]" />
      <span className="text-xs font-medium text-[#1A1A18]">New content drafted</span>
    </div>
    <MoreHorizontal className="h-4 w-4 text-[#8C8C86]" />
  </div>

  <div className="mt-4 space-y-3">
    <Row label="Repo" value="shipstory/core" />
    <Row label="Commit" value="feat: agent handoff v2" />
    <Row label="Branch" value="main" />
    <Row label="Assigned to" value="Priscilla" avatar />
  </div>
</div>

{/* Row helper */}
function Row({ label, value, avatar }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#8C8C86]">{label}</span>
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#1A1A18]">
        {avatar && <span className="h-4 w-4 rounded-full bg-[#DCE8C8]" />}
        {value}
      </span>
    </div>
  );
}
```

**Connector lines — the detail most agents get wrong.**

Do NOT use a plain CSS border or a straight `<div>` line. The reference
uses a curved SVG path that exits the right-center of one card, curves, and
enters the left-center of the next — like a flowchart, not a divider.

```tsx
function Connector() {
  return (
    <svg
      className="w-8 shrink-0 self-center"
      viewBox="0 0 32 40"
      fill="none"
    >
      <path
        d="M0 8 C 16 8, 16 8, 16 20 C 16 32, 16 32, 32 32"
        stroke="#D8D8D2"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
```

Place one `<Connector />` between Node 1→2 and one (mirrored, flip the
curve direction with `scaleY(-1)` or adjust the path) between Node 2→3, so
the line enters from top on the left side and exits toward bottom-right —
matching the reference's slight S-curve asymmetry. Stroke color must stay
in the `#D8D8D2`–`#E0E0DA` range — never black, never the accent green.

**Below the canvas:** the reference shows a thin horizontal scroll-indicator
bar (two small pill segments, one darker = "active page"). Optional, but
if replicated:

```tsx
<div className="mt-6 flex justify-center gap-1.5">
  <span className="h-1 w-6 rounded-full bg-[#1A1A18]" />
  <span className="h-1 w-6 rounded-full bg-[#D8D8D2]" />
</div>
```

### 3.4 Logo strip ("Built with industry leaders at")

- Plain centered label, 13px, `--text-tertiary`, margin-bottom 24px.
- Logos in a single row, `flex justify-between` or `justify-center gap-12`,
  grayscale/low-opacity treatment (`opacity-60 grayscale hover:opacity-100
  hover:grayscale-0 transition`), vertically centered regardless of each
  logo's natural height (`items-center`).
- For ShipStory, swap real healthcare logos for **integration partners**:
  GitHub, Vercel, Slack, Linear, Figma, OpenAI/Anthropic — whatever you
  actually integrate with.

### 3.5 About / problem statement section

- Two floating circular avatar photos positioned absolutely at top-left and
  top-right of the section (`rounded-full`, ~56px, subtle shadow) — these
  are a decorative trust signal, not functional. For ShipStory, replace
  with small avatars of real users/testimonial faces, or agent avatars.
- Centered pill badge above the headline: text "ABOUT", `bg-[--bg-pill]`,
  rounded-full, 11px uppercase, padding `px-3 py-1`.
- Large statement headline (32px), centered, max-width ~720px. **Key
  detail**: in the reference, the headline fades from full black opacity to
  ~30% opacity partway through the second line, and ONE phrase
  ("healthcare coordinators") is underlined. Replicate with a `<span>`
  wrapping the back half of the text in `text-[#1A1A18]/40` and one phrase
  wrapped in `underline underline-offset-4 decoration-1`.
- Supporting paragraph below: 14px, centered, `--text-secondary`,
  max-width ~520px, two lines.
- Background: page goes white→very faint sage radial gradient bleeding in
  from the bottom corners (`bg-[radial-gradient(circle_at_bottom_left,#E4EDD9_0%,transparent_50%)]`
  layered with one at bottom-right too).

### 3.6 Buttons (shadcn Button variant overrides)

Add this as a `pill` variant in your shadcn `button.tsx`:

```ts
pill: "rounded-full bg-[#B7CE8F] text-[#2B3324] hover:bg-[#A9C17D] " +
      "shadow-[0_1px_2px_rgba(0,0,0,0.06)] font-medium transition-colors"
```

Never use shadcn's default `rounded-md` buttons anywhere on this page —
every CTA is a full pill. Border-radius is part of the brand here.

---

## 4. Motion (the reference is static, but your agent system is live — use this)

Since ShipStory's actual hero card represents a *live* multi-agent
pipeline, add **restrained** motion the static reference can't show:

- Connector lines: animate `stroke-dashoffset` on load (line "draws in"
  left to right, 600ms ease-out, staggered 150ms between the two
  connectors).
- Center node's waveform circle: subtle pulsing scale (`scale-100` →
  `scale-105`, 2s ease-in-out infinite) to imply "listening."
- Status dot in Node 3: `animate-pulse` at 2s interval, opacity 100%→40%.
- On scroll into view, the three cards fade-up with 80ms stagger
  (`opacity-0 translate-y-2` → `opacity-100 translate-y-0`, 400ms).

Do not animate anything else. No parallax, no hover-tilt on cards, no
gradient animation. The reference's power is stillness; only animate what
signals "this is a live system," nothing decorative.

---

## 5. What NOT to do (common agent failure modes)

- ❌ Don't add icons inside every text row "for visual interest" — the
  reference uses icons sparingly (only the avatar photo and the
  waveform). Most rows are text-only.
- ❌ Don't make the cards different sizes/heights to "add hierarchy" — all
  three are roughly equal width, center card slightly taller due to
  padding only.
- ❌ Don't use a drop shadow heavier than 6% opacity anywhere.
- ❌ Don't default to shadcn's stock blue/slate theme — override the CSS
  variables in `globals.css` per §1.1 before building anything.
- ❌ Don't make the connector lines straight or use Tailwind border
  utilities — they must be curved SVG paths.
- ❌ Don't center-align the body copy under the section headlines if it
  runs more than 2 lines — reference keeps all paragraph copy short and
  tight, max ~90 characters per line.
- ❌ Don't use pure black `#000000` anywhere — all "black" text in this
  guide is `#1A1A18` (warm near-black), all "white" backgrounds can stay
  pure `#FFFFFF` but text never does.

---

## 6. File/component checklist for the agent

```
/components
  /landing
    Navbar.tsx
    Hero.tsx
    WorkflowCanvas.tsx       ← §3.3, the centerpiece
    NodeCard.tsx             ← shared card shell used by all 3 nodes
    Connector.tsx            ← SVG curve, §3.3
    LogoStrip.tsx
    AboutSection.tsx
/lib
  tokens.ts                  ← export the §1 values as JS constants too,
                              so charts/other sections can reuse them
```

Build `WorkflowCanvas.tsx` first and get it pixel-correct before touching
anything else — it's the section that sells the whole page. Everything
below the fold can be simpler shadcn defaults re-skinned with the same
color tokens.