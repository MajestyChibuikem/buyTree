# Temnix Design System

A tactile, depth-driven design philosophy that creates physical, tangible interfaces.

---

## Core Principle: **Depth Through Light**

Every element exists on a z-axis. Surfaces are either:
- **Inset** (pressed into the surface) - for containers, inputs, inactive states
- **Elevated** (floating above) - for active states, CTAs, focus states

This creates a tactile, almost physical feeling - like buttons that press into surfaces and lift out when active.

---

## 1. Interactive Containers

### Inset Container (Recessed)
Used for: Input fields, inactive button groups, search bars, dropdown containers

```css
bg-gray-50 rounded-2xl shadow-inner
```

### Elevated Element (Floating)
Used for: Active buttons, selected states, focused elements

```css
bg-white rounded-xl shadow-lg shadow-gray-200/50
```

### Combined Pattern: Segmented Button Group
```jsx
{/* Outer inset container */}
<div className="flex bg-gray-50 p-1.5 rounded-2xl gap-1 shadow-inner">
  {/* Active button - elevated */}
  <button className="flex-1 bg-white text-[#111827] py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-gray-200/50 transition-all active:scale-95">
    Active
  </button>
  {/* Inactive button */}
  <button className="flex-1 text-gray-400 py-2.5 rounded-xl text-[11px] font-black hover:bg-white hover:text-gray-500 transition-all">
    Inactive
  </button>
</div>
```

### Search Input Pattern
```jsx
<div className="relative group">
  <input
    type="text"
    placeholder="Search..."
    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 text-[11px] font-black focus:ring-1 focus:ring-emerald-500 shadow-inner"
  />
  <svg className="w-5 h-5 absolute left-4 top-3 text-gray-300 group-focus-within:text-emerald-500 transition-colors">
    {/* icon */}
  </svg>
</div>
```

---

## 2. Color System

### Primary Palette
| Token | Value | Usage |
|-------|-------|-------|
| `emerald-500` | `#10B981` | Primary accent, charts, success states |
| `emerald-400` | `#34D399` | Lighter accent, highlights |
| `emerald-50` | `#ECFDF5` | Background tints, badges |

### Neutral Palette
| Token | Value | Usage |
|-------|-------|-------|
| `gray-900` / `#111827` | Dark text | Headlines, primary text |
| `gray-500` | Medium gray | Secondary text, icons |
| `gray-400` | Light gray | Inactive states, placeholders |
| `gray-300` | Lighter gray | Muted text, timestamps |
| `gray-200` | Very light | Tertiary info, "from last month" |
| `gray-100` | Near white | Borders, dividers (light) |
| `gray-50` | Off-white | Inset backgrounds |

### Semantic Colors
| State | Color | Usage |
|-------|-------|-------|
| Success | `emerald-500` | Positive metrics, completed |
| Warning | `yellow-500` | Pending, attention |
| Error | `red-500` | Canceled, negative |
| Info | `blue-500` | In progress, informational |

---

## 3. Typography

### Font Weight Philosophy
- **font-black** (900): Headlines, numbers, labels - creates visual punch
- **font-bold** (700): Secondary text, descriptions
- **font-semibold** (600): Used sparingly for body text

### Text Sizes
| Size | Class | Usage |
|------|-------|-------|
| 6xl | `text-6xl` | Hero numbers (92%, main stats) |
| 4xl | `text-4xl` | Section headlines, chart values |
| 3xl | `text-3xl` | Featured numbers |
| 2xl | `text-2xl` | Card titles |
| base | `text-base` | Body text |
| 13px | `text-[13px]` | List titles, medium labels |
| 12px | `text-[12px]` | Small labels |
| 11px | `text-[11px]` | Buttons, inputs, small UI |
| 10px | `text-[10px]` | Timestamps, tertiary labels |

### Label Style
Uppercase, tracked, muted:
```css
text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]
```

---

## 4. Card System

### Standard Card
```css
bg-white rounded-[40px] border border-gray-800/10 p-10 shadow-sm
```

### Card with Section Header Outside
```jsx
<div className="space-y-6">
  {/* Header outside card */}
  <div className="flex justify-between items-center px-2">
    <h2 className="text-2xl font-black tracking-tighter">Title</h2>
    <button className="text-[#111827] font-black text-[11px]">Action</button>
  </div>

  {/* Card content */}
  <div className="bg-white rounded-[40px] border border-gray-800/10 p-10 shadow-sm">
    {/* content */}
  </div>
</div>
```

---

## 5. Dividers

### Section Divider (Thick, Dark, Inset)
Does not touch edges - creates breathing room:
```css
mx-4 border-t-2 border-gray-800/15 my-8
```

### Light Divider
```css
border-t border-gray-100
```

---

## 6. Visual Effects

### Liquid/Surface Tension (Bar Charts)
Bars appear like liquid in test tubes - fully rounded capsule shapes:
```jsx
borderRadius={50}  // MUI Charts
// or
className="rounded-full"  // Tailwind
```

### Waterfall/Curtain Effect (Line Charts)
Vertical gradient strips dropping from data points:
```jsx
background: linear-gradient(
  to bottom,
  #10B981 0%,
  rgba(16, 185, 129, 0.4) 30%,
  rgba(16, 185, 129, 0.1) 70%,
  rgba(16, 185, 129, 0.02) 100%
)
```

### Glow Effects
Subtle colored shadows that reinforce the primary color:
```css
shadow-lg shadow-emerald-200/50
filter: drop-shadow(0px 8px 12px rgba(16, 185, 129, 0.3))
```

---

## 7. Border Philosophy

### Dark Thin Borders
Used for card outlines and important containers:
```css
border border-gray-800/10
```

### Light Borders
Used for subtle separation:
```css
border border-gray-100
```

### No Borders
Rely on shadows for depth instead:
```css
shadow-sm  /* subtle elevation */
shadow-lg  /* pronounced elevation */
```

---

## 8. Spacing

### Card Padding
- Large cards: `p-10` (40px)
- Medium cards: `p-6` (24px)
- Compact: `p-4` (16px)

### Corner Radius Scale
| Size | Value | Usage |
|------|-------|-------|
| Full | `rounded-full` | Pills, avatars, chart bars |
| 3xl | `rounded-3xl` | Inner containers |
| 2xl | `rounded-2xl` | Buttons, inputs |
| xl | `rounded-xl` | Small buttons, tags |
| [40px] | `rounded-[40px]` | Large cards |

---

## 9. Interaction States

### Hover
- Buttons: `hover:bg-white hover:text-gray-500`
- Cards: `hover:border-emerald-200 hover:shadow-lg`
- Icons: `hover:text-emerald-500`

### Active/Press
```css
active:scale-95
```

### Focus
```css
focus:ring-1 focus:ring-emerald-500
```

### Group Hover (Child reacts to parent hover)
```jsx
<div className="group">
  <div className="group-hover:scale-110 transition-all">
    {/* child that scales on parent hover */}
  </div>
</div>
```

---

## 10. Motion

### Transitions
All interactive elements should have:
```css
transition-all
```

### Duration
Default browser duration (~150ms) for most interactions.

### Transforms
- Scale down on press: `active:scale-95`
- Scale up on hover: `group-hover:scale-110`

---

## Quick Reference: Component Patterns

| Component | Key Classes |
|-----------|-------------|
| Inset Container | `bg-gray-50 rounded-2xl shadow-inner` |
| Elevated Button | `bg-white rounded-xl shadow-lg shadow-gray-200/50` |
| Card | `bg-white rounded-[40px] border border-gray-800/10 p-10 shadow-sm` |
| Label | `text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]` |
| Search Input | `bg-gray-50 border-none rounded-2xl shadow-inner focus:ring-1 focus:ring-emerald-500` |
| Section Divider | `mx-4 border-t-2 border-gray-800/15` |
| Pill/Capsule | `rounded-full` |

---

*Temnix: Tactile interfaces that feel real.*
