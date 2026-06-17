# Multi-Agent Workflow Visualizer — Design Guide
**Target Agent:** Antigravity Gemini  
**Stack:** shadcn/ui preset + Tailwind CSS  
**Goal:** A canvas-based, draggable multi-agent workflow UI that is clean, modern, and undeniably good.

---

## 1. Reference Analysis (The Screenshot)

Break down exactly what makes the reference image work:

### Layout Structure
- **Left sidebar** (~260px): Collapsible panel with two sections — TRIGGERS and CONDITIONS — each with a list of items and a "+ Custom" CTA at the bottom. Dark background (`#0f0f0f` or `#111`).
- **Main canvas** (flex-fill): Light gray/white canvas (`#F5F6F8`), infinite-feel space with a subtle dot-grid or hairline grid overlay. Nodes float on it.
- **Top bar**: Breadcrumb (`Workflow / Name`) on left, `Preview` (ghost) and `Update Workflow` (blue solid) buttons on right.

### Node Anatomy (Copy This Exactly)
Every node card follows this template:
```
┌──────────────────────────────────┐
│ ⚡ [Node Type Label]       [···] │  ← Header row: icon + label + context menu
│ ──────────────────────────────── │
│ 📦 [Main Action Name]            │  ← Body: action icon + action name
│                                  │
│ [Field Label]        [Value]     │  ← Key-value rows (muted label, bold value)
│ [Field Label]        [Value]     │
│                                  │
│ [        Action Button         ] │  ← Full-width ghost/outline CTA
└──────────────────────────────────┘
```
- Card border-radius: `12px`
- Card background: `white`
- Card border: `1px solid #E4E7EC`
- Card box-shadow: `0 1px 4px rgba(0,0,0,0.06)`
- Header section: very light tint of the node's accent color (e.g. orange `#FFF4ED` for Conditions, blue `#EFF6FF` for Triggers)
- Min-width: `280px`, max-width: `320px`

### Connection Lines
- SVG bezier curves (cubic), `stroke: #93C5FD` (blue-300), `stroke-width: 2`
- Connector dots: `8px` filled circle, `background: #3B82F6`, white border `2px`
- Lines animate subtly on hover (stroke dash offset shift)
- Lines connect: right-center of source → left-center of target

### Color Tokens
```
--background-canvas:    #F5F6F8
--sidebar-bg:           #0A0A0B
--sidebar-text:         #E5E7EB
--sidebar-muted:        #6B7280
--sidebar-hover:        #1A1A1E
--card-bg:              #FFFFFF
--card-border:          #E4E7EC
--node-trigger-header:  #EFF6FF  (blue tint)
--node-condition-header:#FFF4ED  (orange tint)
--node-custom-header:   #F0FDF4  (green tint)
--accent-blue:          #2563EB
--accent-blue-light:    #93C5FD
--accent-orange:        #F97316
--accent-green:         #22C55E
--text-primary:         #111827
--text-muted:           #6B7280
--text-label:           #9CA3AF
--border-default:       #E4E7EC
--connector-line:       #93C5FD
```

### Typography
- Font: `Inter` (or `Geist` if available in shadcn preset)
- Sidebar section labels: `10px`, `font-weight: 600`, `letter-spacing: 0.08em`, `text-transform: uppercase`, color: `--text-label`
- Sidebar items: `13px`, `font-weight: 400`, color: `--sidebar-text`
- Node header label: `11px`, `font-weight: 600`, `uppercase`, `letter-spacing: 0.06em`
- Node action name: `14px`, `font-weight: 600`, color: `--text-primary`
- Node field labels: `12px`, `font-weight: 400`, color: `--text-muted`
- Node field values: `12px`, `font-weight: 600`, color: `--text-primary`
- Button text: `12px`, `font-weight: 500`

---

## 2. Layout Architecture

### Two-Column Split (Not Three)
```
┌──────────────┬──────────────────────────────────────────────┐
│  SIDEBAR     │  CANVAS                                      │
│  260px       │  flex: 1                                     │
│  collapsible │  overflow: hidden (pan/zoom handled by JS)   │
│              │                                              │
│  [dark bg]   │  [light dot-grid canvas]                     │
└──────────────┴──────────────────────────────────────────────┘
```

### Top Bar
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] Workflow / Agent Name ✏️        [Preview] [Update ▶]  │
│ height: 56px, border-bottom: 1px solid #E4E7EC              │
└──────────────────────────────────────────────────────────────┘
```

### Sidebar Internals (Collapsible)
- Each section (AGENTS, TRIGGERS, CONDITIONS, TOOLS) has a `<details>` or accordion behavior
- Clicking the section header collapses/expands that group
- When sidebar is fully collapsed → shows icon-only rail (48px wide)
- Toggle button: bottom of sidebar or chevron at the top edge

---

## 3. Canvas Behavior

### Must-Have Interactions
| Feature | Implementation |
|---|---|
| Pan | Mouse drag on empty canvas (`cursor: grab`) |
| Zoom | Mouse wheel / pinch, range `0.25x` to `2x` |
| Drag nodes | Each card draggable via `mousedown` on header |
| Select node | Click → highlight border `#2563EB`, show details panel |
| Multi-select | Shift+click or rubber-band drag |
| Mini-map | Bottom-right corner, 140×90px thumbnail of full canvas |
| Snap to grid | Optional, 16px grid |
| Auto-layout | Button to re-arrange nodes in a readable left→right DAG |

### Canvas Grid
- Dot grid: `radial-gradient(circle, #D1D5DB 1px, transparent 1px)` at `24px 24px`
- Or hairline grid: `1px solid #E9EAEC` every 24px — pick one, not both

### Node Z-order
- Dragged node always on top (`z-index: 999`)
- Selected node: `z-index: 100`
- Lines always behind cards (`z-index: 1`)

---

## 4. Node Types

Define clear visual vocabulary for each agent node type:

### Trigger Node
- Header tint: `#EFF6FF` (blue)
- Header icon color: `#2563EB`
- Left border accent: `3px solid #2563EB`
- Badge: `TRIGGER` in blue pill

### Condition Node
- Header tint: `#FFF4ED` (orange)
- Header icon color: `#F97316`
- Left border accent: `3px solid #F97316`
- Badge: `CONDITION` in orange pill

### Agent Node (your system)
- Header tint: `#F5F3FF` (purple)
- Header icon color: `#7C3AED`
- Left border accent: `3px solid #7C3AED`
- Badge: `AGENT` in purple pill

### Tool/Action Node
- Header tint: `#F0FDF4` (green)
- Header icon color: `#16A34A`
- Left border accent: `3px solid #16A34A`
- Badge: `TOOL` in green pill

### Output/Response Node
- Header tint: `#FDF2F8` (pink)
- Header icon color: `#DB2777`
- Left border accent: `3px solid #DB2777`
- Badge: `OUTPUT` in pink pill

---

## 5. Sidebar Sections

### Section Header Pattern
```jsx
<div className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-sidebar-hover">
  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
    AGENTS
  </span>
  <ChevronDown className="w-3.5 h-3.5 text-gray-500 transition-transform" />
</div>
```

### List Item Pattern
```jsx
<div className="flex items-center gap-2.5 px-4 py-2 rounded-md hover:bg-white/5 cursor-grab active:cursor-grabbing text-sm text-gray-300">
  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
  <span>Item Label</span>
</div>
```

### Drag-to-Canvas
- Sidebar items are **draggable** → drop onto canvas to instantiate a node
- On dragstart: show a ghost preview of what the node will look like
- On drop: create node at drop coordinates

---

## 6. Node Detail Panel (Right Drawer)

When a node is selected, a right-side panel slides in (not a modal):
- Width: `320px`
- Background: `white`
- Border-left: `1px solid #E4E7EC`
- Shows: node config, editable fields, connection list, logs/status

```
┌─────────────────────┐
│ ← Agent Name    [✕] │
│ ─────────────────── │
│ TYPE                │
│ [Trigger Badge]     │
│                     │
│ CONFIGURATION       │
│ Field  [input]      │
│ Field  [input]      │
│                     │
│ CONNECTIONS         │
│ → Connected to X    │
│ → Connected to Y    │
│                     │
│ [Delete Node]       │
└─────────────────────┘
```

---

## 7. shadcn/ui Component Mapping

| Element | shadcn Component |
|---|---|
| Sidebar items | `Button variant="ghost"` |
| Node badges | `Badge` with custom color variants |
| Right drawer | `Sheet` (side="right") |
| Context menus (···) | `DropdownMenu` |
| Collapse sections | `Collapsible` |
| Action buttons in nodes | `Button variant="outline" size="sm"` |
| Top bar buttons | `Button` (ghost + default) |
| Tooltips on icons | `Tooltip` |
| Mini-map | Custom SVG canvas element |

---

## 8. Connection Line Rules

```
Source Node                    Target Node
[right-center connector dot] ──bezier──> [left-center connector dot]

Bezier control points:
  cp1: { x: source.x + 80, y: source.y }
  cp2: { x: target.x - 80, y: target.y }

Line appearance:
  stroke: #93C5FD
  stroke-width: 2
  fill: none
  stroke-dasharray: none (solid)
  on hover: stroke: #2563EB, stroke-width: 2.5

Connector dot:
  r: 5
  fill: #2563EB
  stroke: white
  stroke-width: 2
```

For **conditional branching** (one node → multiple targets):
- Show branch labels on lines: small white pill `IF delay > 24` floating on the line mid-point
- Different branch colors: true branch = green line, false branch = red line

---

## 9. States & Micro-interactions

### Node States
| State | Visual |
|---|---|
| Default | white bg, subtle shadow |
| Hover | `box-shadow: 0 4px 12px rgba(0,0,0,0.1)`, translate `-1px` |
| Selected | blue border `2px solid #2563EB`, blue shadow `0 0 0 3px #BFDBFE` |
| Running | pulsing left border (CSS animation), animated spinner icon in header |
| Success | green left border `#22C55E`, checkmark icon |
| Error | red left border `#EF4444`, error icon, red badge |
| Disabled/Skipped | `opacity: 0.45`, dashed border |

### Line States
- **Idle**: `#93C5FD`
- **Active/Running**: animated dash flow (moving dash offset) in blue
- **Error**: `#FCA5A5`
- **Success**: `#86EFAC`

---

## 10. Collapsible Behavior

### Sidebar Collapse
```
Expanded (260px):   [icon] Label
Collapsed (48px):   [icon] only, tooltip on hover shows label
Toggle:             Arrow button at bottom of sidebar
```

### Node Collapse
- Each node card has a collapse toggle in its `···` menu
- Collapsed node: shows only header row (icon + name + badge), hides body
- Height animates smoothly with CSS transition `height 150ms ease`

### Section Collapse (sidebar)
- Clicking any section header toggles that group open/closed
- Chevron icon rotates 180° when closed
- State persists in `localStorage`

---

## 11. Canvas Toolbar

Float a small toolbar above the canvas (top-center or top-right of canvas area):

```
┌───────────────────────────────────────┐
│  [↺ Undo] [↻ Redo]  │  [⊞ Grid] [🗺 Map] │ [+ Add Node] │ [⤢ Fit View]  │
└───────────────────────────────────────┘
```
- Background: `white`, `border: 1px solid #E4E7EC`, `border-radius: 8px`
- `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- All icon buttons: `32px × 32px`, `hover: bg-gray-100`

---

## 12. Implementation Order (Tell the Agent This)

1. **Set up layout shell**: topbar + sidebar + canvas area (no nodes yet)
2. **Build sidebar** with collapsible sections and drag-ready items
3. **Build canvas** with pan/zoom (use `react-flow` or `@xyflow/react` — it handles 90% of the hard parts and matches this exact pattern)
4. **Build node card component** with all variants (trigger, condition, agent, tool, output)
5. **Wire connection lines** via react-flow's edge system
6. **Build right detail panel** (Sheet component)
7. **Add node states** (running, success, error) with CSS animations
8. **Mini-map** (react-flow has this built-in as `<MiniMap />`)
9. **Polish**: transitions, hover states, keyboard shortcuts

> **CRITICAL**: Use `@xyflow/react` (React Flow v12). It provides: draggable nodes, bezier edges, minimap, controls, background grid, pan/zoom — out of the box. Style it with the tokens above. Don't reinvent this with raw SVG/canvas unless you have a strong reason.

---

## 13. What to Explicitly Avoid

- ❌ No three-column layout — two columns only (sidebar + canvas)
- ❌ No modal popups for node config — use a slide-in Sheet panel
- ❌ No flat color nodes without the header tint accent
- ❌ No rounded nodes (circles/hexagons) — rectangles with 12px radius only
- ❌ No excessive animations — one hover lift, one line pulse, that's it
- ❌ No generic gray badges — every node type gets its own color
- ❌ No cluttered sidebar — collapsible sections, breathing room, 40px item height
- ❌ No hard-coded positions — all nodes placed on a resizable infinite canvas
- ❌ No missing connection dots — every edge must have visible source/target handles

---

## 14. One-Line Summary for the Agent

> Build a 2-column layout: dark collapsible sidebar (drag-to-canvas items, grouped by type) + a light dot-grid infinite canvas using `@xyflow/react`, with white node cards that have colored header tints per type, bezier connection lines in blue, a floating canvas toolbar, a slide-in right panel for node details, and smooth running/success/error states — following the exact token values in this guide.