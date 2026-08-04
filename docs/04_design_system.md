# Design System

## Project

**DecisionReady AI**

**Tagline:**  
AI Decision Intelligence for Modern Hiring

---

# Design Inspiration Analysis

DecisionReady AI should feel like a premium Decision Intelligence Platform for recruiters and hiring managers—calm, executive, and information-first. Visual direction is informed by modern enterprise SaaS principles (and the spacious, restrained language associated with products like MUST Company), without copying any brand, layout, logo, or website. Product docs also anchor the UI in a modern, minimal SaaS aesthetic (Ashby / Linear / Stripe–inspired).

- Clean, spacious layouts with generous whitespace so readiness and next actions can be scanned without visual crowding
- Strong typography hierarchy that makes page identity and verdicts primary, and supporting evidence clearly secondary
- Minimal visual noise—no decorative chrome, dense icon rows, or ATS-style pipeline clutter
- Thin borders and light surface separation preferred over heavy multi-layer shadows
- Large, soft rounded corners that feel modern and approachable without becoming playful
- Color used with restraint; green reserved as a positive accent for readiness and confirmation, not as a dominant brand wash
- Calm enterprise aesthetic that signals trust for high-stakes hiring decisions
- Executive, trustworthy tone suitable for debrief rooms and hiring-manager review—not consumer flash or chatbot theater
- Information-first interfaces where structured metrics, status, and evidence lead; ornamentation never competes with content
- Premium SaaS quality in spacing, alignment, and interaction polish (subtle hover, clear focus, consistent rhythm)
- Progressive disclosure: lead with verdict and blockers; reveal competency and interviewer detail only when needed
- One clear primary action per screen to keep cognitive load low across the three-screen MVP journey
- Status and readiness communicated with compact, consistent badges—never color alone
- Mobile-capable decision support: same hierarchy and content on small viewports, stacked rather than stripped
- Product recognition at a glance as Decision Intelligence (readiness, coverage, blockers)—not an ATS candidate board or freeform AI chat

---

# Product Personality

DecisionReady AI is a Decision Intelligence Platform used at a consequential moment in hiring: after interviews, before a debrief. The product personality must match that moment.

It communicates **trust**, **confidence**, **clarity**, **evidence**, **professionalism**, **precision**, and **calmness**. Every UI decision should reinforce these values.

| Value | How the UI reinforces it |
|---|---|
| **Trust** | Transparent status, explainable outputs, no decorative AI theatrics; Analysis Transparency and evidence-backed claims make the system feel accountable |
| **Confidence** | A clear readiness verdict and next best action appear early; primary CTAs are unambiguous; the interface never hedges with visual clutter |
| **Clarity** | Strong hierarchy, plain language, one primary action per screen; recruiters should understand readiness without studying the layout |
| **Evidence** | Metrics, coverage, blockers, and mapped interview notes outrank illustration or marketing copy; insights remain traceable to input evidence |
| **Professionalism** | Enterprise SaaS restraint—neutral surfaces, compact badges, consistent spacing—suitable for hiring-manager review and debrief rooms |
| **Precision** | Tabular numbers, exact status labels, and structured sections; avoid vague visual metaphors that imply hire/reject outcomes |
| **Calmness** | Generous whitespace, muted chrome, subtle motion; the UI lowers cognitive load so people can think about the decision, not the tool |

### What DecisionReady AI must never feel like

| Avoid | Why |
|---|---|
| **Playful** | Hiring decisions are serious; playful chrome undermines trust |
| **Futuristic** | Neon, glow, and speculative AI aesthetics suggest novelty over reliability |
| **Experimental** | Unusual patterns increase learning cost across three focused screens |
| **Over-designed** | Heavy illustration, dense ornament, and competing accents distract from readiness |
| **Marketing-heavy** | Landing-page hero energy belongs outside the product; in-app UI is a working surface for evidence and judgment |

If a visual choice does not increase trust, clarity, or comprehension of decision readiness, it does not belong in the product.

---

# Design Philosophy

These principles guide interface decisions across the Decision Dashboard, New Decision Analysis, and Decision Intelligence Dashboard.

### Decision-first, not feature-first

The product answers one question: *Do we have enough evidence to make a fair and confident hiring decision?* Layout, CTAs, and information order exist to serve that question. Features that do not advance readiness judgment stay out of the MVP.

### Evidence over decoration

UI should surface job requirements, interview feedback, coverage, conflicts, and gaps. Decorative gradients, illustration-as-content, and stylistic flourishes must never outrank structured evidence.

### Calm interfaces reduce cognitive load

Recruiters arrive after fragmented scorecards and notes. A calm surface—quiet color, measured spacing, limited motion—helps them synthesize rather than scan noise.

### Progressive disclosure

Lead with verdict, next action, and blockers. Expand competency detail and interviewer contribution on demand. Depth is available without forcing every user through every row.

### Explainable AI

DecisionReady AI does not recommend Hire or Reject. Interfaces must show what was evaluated, what was missing, and what the system did not do—so humans remain owners of the final decision.

### Consistency over novelty

Reuse established patterns for headers, cards, badges, tables, and empty states. Novelty for its own sake taxes memory and slows demos and daily use.

### Spacious layouts improve comprehension

Whitespace is a comprehension tool. Tight packing makes readiness, metrics, and blockers compete. Space separates hierarchy levels so the eye finds the verdict first.

### Information hierarchy before visual styling

Decide what must be read first (identity → readiness → next action → blockers → detail), then style. Color, type, and elevation exist to encode that order—not to invent a parallel visual story.

---

# Color System

The palette is minimal and enterprise-focused: near-neutral surfaces, dark primary actions, and restrained semantic accents. **Green is an accent for success and Decision Ready states—not the dominant UI color.** Brand identity is carried by typography, spacing, and structure more than by saturated brand fills.

| Token | Hex | Intended usage | Design rationale |
|---|---|---|---|
| **Primary Background** | `#FFFFFF` | App canvas behind shell and pages | Clean working surface; maximizes contrast for text and data |
| **Secondary Background** | `#F7F7F5` | Page bands, empty-state wells, muted regions behind lists | Soft separation without introducing a second brand color |
| **Surface** | `#FFFFFF` | Cards, panels, primary content containers | Keeps Decision Analyses and intelligence sections legible and flat |
| **Elevated Surface** | `#FFFFFF` | Popovers, dialogs, menus sitting above the page | Same base as Surface; elevation comes from border + subtle shadow, not a tint shift |
| **Primary Text** | `#111111` | Headings, candidate names, primary labels, key values | Near-black for executive clarity and strong hierarchy |
| **Secondary Text** | `#3F3F46` | Body copy, role titles, supporting sentences | Readable secondary layer without competing with Primary Text |
| **Muted Text** | `#71717A` | Captions, timestamps, metric labels, helper text | Recedes so status and verdicts remain dominant |
| **Primary Brand** | `#18181B` | Primary buttons, key interactive fills | Neutral “ink” brand—confident and professional; avoids green-as-brand |
| **Primary Brand Hover** | `#27272A` | Hover / pressed state for primary actions | Slightly lighter ink for feedback without loud color change |
| **Success** | `#16A34A` | Decision Ready, sufficient coverage, positive confirmation accents | Green used sparingly as a readiness/success signal only |
| **Warning** | `#D97706` | Partially Ready, partial coverage, caution states | Amber communicates incomplete evidence without alarm |
| **Destructive** | `#DC2626` | Needs Evidence emphasis, conflicts, critical gaps, destructive actions | Reserved for risk and missing-evidence urgency—not decorative |
| **Border** | `#E4E4E7` | Card edges, input outlines, structural frames | Thin borders define structure more than shadows |
| **Divider** | `#F4F4F5` | Subtle section separators inside panels | Quieter than Border so internal splits do not fracture the layout |
| **Hover Background** | `#F4F4F5` | Row / card / nav hover washes | Soft feedback that preserves calm; no glow |
| **Focus Ring** | `#A1A1AA` | Keyboard focus outlines on interactive controls | Visible accessibility without neon brand rings |

### Color usage rules

1. Prefer neutrals for layout chrome; use Success / Warning / Destructive only for status and semantic meaning.
2. Do not rely on color alone for readiness—pair with text labels on badges and verdicts.
3. Keep large filled regions neutral (white / near-white). Accent colors appear in compact badges, icons, and short emphasis text.
4. Destructive red is for blockers, conflicts, and missing evidence—not for primary navigation.

---

# Typography

Typography prioritizes readability and hierarchy over decoration. Use a single professional sans-serif family across the product (system or product font stack). Avoid display fonts that feel editorial or playful.

| Style | Weight | Size | Line height | Letter spacing | Intended usage |
|---|---|---|---|---|---|
| **Display** | Semibold (600) | 36px / 2.25rem | 40px / 1.11 | `-0.02em` | Rare hero-level product moments only; not used on working dashboards by default |
| **H1** | Semibold (600) | 28px / 1.75rem | 36px / 1.29 | `-0.02em` | Page titles (e.g., Decision Dashboard, Decision Intelligence) |
| **H2** | Medium (500) | 18px / 1.125rem | 28px / 1.56 | `-0.01em` | Card titles, candidate names, major section headings |
| **H3** | Medium (500) | 16px / 1rem | 24px / 1.5 | `0` | Subsection titles (Next Action, Evidence Health, Decision Brief) |
| **Body Large** | Regular (400) | 16px / 1rem | 26px / 1.625 | `0` | Verdicts, primary explanatory sentences, important supporting copy |
| **Body** | Regular (400) | 14px / 0.875rem | 22px / 1.57 | `0` | Default UI copy, form labels’ helper text, list descriptions |
| **Caption** | Regular (400) | 12px / 0.75rem | 16px / 1.33 | `0` | Timestamps, fine print, Analysis Transparency footnotes |
| **Metric Labels** | Medium (500) | 11px / 0.6875rem | 14px / 1.27 | `0.04em` | Uppercase or tracked labels above readiness score, coverage, interviewers, blockers |
| **Buttons** | Medium (500) | 14px / 0.875rem | 20px / 1.43 | `0` | Primary and secondary button labels; keep short and action-oriented |

### Typography rules

1. One H1 per page. Do not use Display on operational screens unless hierarchy truly requires it.
2. Prefer Medium over Bold for most headings to keep an executive, calm tone.
3. Metric values use tabular numerals where possible so scores and ratios align visually.
4. Never reduce contrast below accessible Primary / Secondary / Muted pairings on their intended backgrounds.

---

# Spacing System

Spacing uses a fixed scale. Prefer these values; do not invent one-off gaps.

| Token | Value | Where to use it |
|---|---|---|
| **4** | 4px | Tight inline gaps (icon-to-label, badge padding adjustments, metric label-to-value) |
| **8** | 8px | Compact related elements; small stack gaps inside dense UI clusters |
| **12** | 12px | Default gap between sibling controls; list item internal rhythm |
| **16** | 16px | Card padding (compact); form field vertical spacing; section-internal groups |
| **24** | 24px | Default card padding; gap between page header and content; comfortable form sections |
| **32** | 32px | Separation between major page blocks; header-to-list breathing room |
| **48** | 48px | Large section breaks on the Decision Intelligence Dashboard; empty-state vertical padding |
| **64** | 64px | Page-level vertical margins on sparse screens; generous empty states |
| **96** | 96px | Rare full-bleed breathing room (e.g., marketing-adjacent shells)—use sparingly inside the app |

### Spacing rules

1. Related content stays within 4–16. Distinct sections start at 24–32.
2. Prefer consistent card padding (16 or 24) across Decision Analysis cards and intelligence panels.
3. Do not close whitespace to “fit more”—comprehension of readiness depends on separation.

---

# Border Radius

Rounded corners should feel modern and soft, without becoming pill-heavy or playful.

| Element | Radius | Notes |
|---|---|---|
| **Cards** | 12px | Decision Analysis cards, evidence panels, intelligence sections |
| **Buttons** | 8px | Primary and secondary actions; slightly tighter than cards for density |
| **Inputs** | 8px | Text fields, textareas, selects—aligned with buttons for form cohesion |
| **Dialogs** | 16px | Modals and confirmation sheets; slightly softer to feel elevated |
| **Badges** | 999px (full pill) | Compact status pills; keep height small so pills stay secondary to content |

### Why consistency matters

Matching radius by component type trains recognition: cards feel like cards, controls feel like controls. Mixing arbitrary radii makes the product feel unfinished and distracts from decision content. Stick to this set unless a documented exception is required.

---

# Shadows

Shadows are subtle and supportive. **Prefer borders for structure; use shadows for light elevation and hover feedback only.**

| Token | Value | Intended usage |
|---|---|---|
| **Small** | `0 1px 2px rgba(17, 17, 17, 0.04)` | Resting elevation for menus or slight lift on dense controls |
| **Medium** | `0 4px 12px rgba(17, 17, 17, 0.06)` | Dialogs, popovers, elevated panels |
| **Large** | `0 12px 32px rgba(17, 17, 17, 0.08)` | Rare high-elevation moments (focused modal contexts) |
| **Hover** | `0 4px 14px rgba(17, 17, 17, 0.08)` | Decision Analysis card hover; soft lift without dramatic motion |

### Shadow rationale

1. Heavy shadows create visual noise and a consumer “floating card” look that fights a calm enterprise aesthetic.
2. Thin borders already define Decision Analysis cards and panels; shadows should not replace that structure.
3. Hover shadow + slight border darkening is enough to signal clickability without animation theater.
4. Never stack multiple large shadows or glow effects—especially not green or brand-colored glows.

---

# Buttons

Buttons are the primary way recruiters commit to workflow steps: create a Decision Analysis, generate intelligence, update evidence, or mark ready for debrief. Every screen should have **one clear primary button**. Secondary and ghost actions support without competing.

### Shared button specifications

| Property | Standard |
|---|---|
| **Height (default)** | 36px |
| **Height (large)** | 40px |
| **Height (small)** | 32px |
| **Horizontal padding** | 12–16px |
| **Border radius** | 8px |
| **Typography** | Buttons style — Medium 14px / 20px |
| **Icon size** | 16px, 8px gap from label |
| **Min touch target** | 44×44px interactive area on mobile (visual height may remain 36–40px with padding) |

---

### Primary

| Aspect | Specification |
|---|---|
| **Purpose** | The single most important action on a screen (e.g., New Decision Analysis, Generate Decision Intelligence, Mark Ready for Debrief) |
| **Visual appearance** | Fill: Primary Brand (`#18181B`); text: white; no border |
| **Size** | Default 36px; Large 40px for page-header CTAs |
| **Border radius** | 8px |
| **Hover behavior** | Background → Primary Brand Hover (`#27272A`); optional 1px lift is unnecessary—color shift is enough |
| **Focus state** | 2px Focus Ring (`#A1A1AA`) with 2px offset from control |
| **Usage guidelines** | One Primary per view region. Never pair two Primaries side by side. Label with a clear verb + object |

### Secondary

| Aspect | Specification |
|---|---|
| **Purpose** | Important but non-dominant actions (e.g., Back to Decision Dashboard, Update Evidence when Primary is Mark Ready for Debrief) |
| **Visual appearance** | Fill: Surface (`#FFFFFF`); text: Primary Text; border: 1px Border (`#E4E4E7`) |
| **Size** | Match Primary height in the same toolbar |
| **Border radius** | 8px |
| **Hover behavior** | Background → Hover Background (`#F4F4F5`); border may darken slightly toward `#D4D4D8` |
| **Focus state** | Same Focus Ring as Primary |
| **Usage guidelines** | Use for reversible or navigational commitments. Prefer Secondary over Ghost when the action must remain visible at a glance |

### Ghost

| Aspect | Specification |
|---|---|
| **Purpose** | Low-emphasis actions (e.g., Copy Decision Brief, tertiary nav links styled as buttons) |
| **Visual appearance** | Transparent background; text: Secondary Text; no border at rest |
| **Size** | Default 36px |
| **Border radius** | 8px |
| **Hover behavior** | Background → Hover Background (`#F4F4F5`); text → Primary Text |
| **Focus state** | Same Focus Ring as Primary |
| **Usage guidelines** | Do not use Ghost for the screen’s main CTA. Avoid long Ghost labels that look like body text |

### Destructive

| Aspect | Specification |
|---|---|
| **Purpose** | Irreversible or high-risk actions (e.g., remove interview feedback entry, discard unsaved evidence after confirm) |
| **Visual appearance** | Soft fill preferred: Destructive at 10% opacity with Destructive text; or solid Destructive with white text for confirm dialogs |
| **Size** | Default 36px |
| **Border radius** | 8px |
| **Hover behavior** | Increase fill intensity modestly; never introduce glow |
| **Focus state** | Focus Ring; for solid destructive, ring may use a muted red tint while remaining visible |
| **Usage guidelines** | Always confirm destructive outcomes when data loss is possible. Never use Destructive for “Needs Evidence” navigation |

### Disabled

| Aspect | Specification |
|---|---|
| **Purpose** | Communicate that an action is unavailable (e.g., Generate blocked until minimum evidence exists) |
| **Visual appearance** | 50% opacity of the underlying variant; no hover elevation; `cursor: not-allowed` |
| **Size** | Same as enabled counterpart |
| **Border radius** | 8px |
| **Hover behavior** | None |
| **Focus state** | Generally not focusable; if focusable for explanation, keep ring and pair with helper text stating why |
| **Usage guidelines** | Prefer enabling with clear requirements over silent disable. When disabled, explain the blocker nearby (helper text) |

### Loading

| Aspect | Specification |
|---|---|
| **Purpose** | Indicate an in-progress action (e.g., Generating Decision Intelligence) |
| **Visual appearance** | Same variant as the committed action; label may change to progressive language; 16px spinner left of label |
| **Size** | Same as resting button to avoid layout shift |
| **Border radius** | 8px |
| **Hover behavior** | Suspended while loading; button non-interactive |
| **Focus state** | Retain focus on the control; announce busy state to assistive tech |
| **Usage guidelines** | Disable duplicate submits. Keep width stable (reserve space for spinner + label). Do not animate the whole page |

---

# Cards

Cards group related decision content. They prioritize **readability and hierarchy over decoration**. Prefer thin borders and quiet surfaces; use hover elevation only when the card is a navigation target.

### Shared card foundations

| Property | Standard |
|---|---|
| **Border** | 1px solid Border (`#E4E4E7`) unless noted |
| **Background** | Surface (`#FFFFFF`) unless noted |
| **Border radius** | 12px (cards) |
| **Default padding** | 16–24px |
| **Shadow at rest** | None (border defines structure) |

---

### Decision Analysis Card

| Aspect | Specification |
|---|---|
| **Purpose** | List item on the Decision Dashboard—open or continue a Decision Analysis |
| **Padding** | 20–24px |
| **Border** | 1px Border |
| **Background** | Surface |
| **Border radius** | 12px |
| **Shadow** | None at rest; Hover shadow on pointer hover |
| **Hover behavior** | Border → slightly stronger (`#D4D4D8`); Hover shadow; 1px upward translate optional; chevron shifts 4px right; `cursor: pointer` |
| **Internal spacing** | 12–16px between identity block, metrics row, and timestamp |
| **When to use** | Decision Dashboard list only; always clickable as a whole |

### Metric Card

| Aspect | Specification |
|---|---|
| **Purpose** | Compact readiness or health metrics (score, coverage, interviewers, blockers) |
| **Padding** | 12–16px |
| **Border** | 1px Border or Divider-only when nested inside a parent card |
| **Background** | Surface or Secondary Background when nested for contrast |
| **Border radius** | 12px (standalone) or 8px (nested chips) |
| **Shadow** | None |
| **Hover behavior** | None unless the metric itself navigates (rare) |
| **Internal spacing** | 4px between Metric Label and value; 16–24px between sibling metrics |
| **When to use** | Evidence Health Summary; secondary row inside Decision Analysis Cards |

### Information Card

| Aspect | Specification |
|---|---|
| **Purpose** | Neutral structured content—verdicts, briefs, transparency, interviewer overview |
| **Padding** | 20–24px |
| **Border** | 1px Border |
| **Background** | Surface |
| **Border radius** | 12px |
| **Shadow** | None |
| **Hover behavior** | None (not a primary navigation target) |
| **Internal spacing** | 8–12px title-to-body; 16–24px between subsections |
| **When to use** | Decision Readiness Verdict body, Decision Brief, Analysis Transparency, non-alerting panels |

### Warning Card

| Aspect | Specification |
|---|---|
| **Purpose** | Surface decision blockers, conflicts, stale intelligence, or insufficient evidence |
| **Padding** | 16–20px |
| **Border** | 1px Warning or Destructive border at low emphasis (tint), or left accent bar 3px |
| **Background** | Soft tint: Warning/Destructive at ~5–8% opacity on white—never loud fills |
| **Border radius** | 12px |
| **Shadow** | None |
| **Hover behavior** | None, unless row expands; then use Hover Background on the interactive row only |
| **Internal spacing** | 8–12px between title, summary, and suggested next step |
| **When to use** | Decision Blockers; stale-intelligence indicator; critical validation summaries |

### Empty State Card

| Aspect | Specification |
|---|---|
| **Purpose** | Orient the user when a list or section has no data yet |
| **Padding** | 48–64px vertical; 24–40px horizontal |
| **Border** | 1px dashed Border |
| **Background** | Secondary Background at low emphasis (`#F7F7F5` / muted wash) |
| **Border radius** | 12px |
| **Shadow** | None |
| **Hover behavior** | None on the container; CTA uses standard button hover |
| **Internal spacing** | 16–24px between illustration, headline, supporting text, and CTA |
| **When to use** | No Decision Analyses; no interview feedback yet; no blockers (confirmation empty may be lighter—text-only is acceptable) |

---

# Status Badges

Badges communicate Decision Analysis or readiness state **instantly** without dominating the layout. Keep them compact, pill-shaped, and always paired with text—not color alone.

### Shared badge specifications

| Property | Standard |
|---|---|
| **Height** | 20–22px |
| **Padding** | 0 8px |
| **Border radius** | Full pill (999px) |
| **Typography** | Medium 12px / 16px; no wide tracking on the label itself |
| **Placement** | Adjacent to candidate/page identity; top-right of Decision Analysis Cards; inline with Decision Intelligence page identity |

---

### Decision Ready

| Aspect | Specification |
|---|---|
| **Semantic meaning** | Sufficient, reliable evidence exists to proceed toward hiring debrief (readiness—not hire) |
| **Color usage** | Success fill (`#16A34A`) with white text |
| **Border** | Transparent / none |
| **Typography** | Medium 12px; label exactly **Decision Ready** |
| **Appropriate placement** | Dashboard cards with ready intelligence; Decision Intelligence identity pill when Ready |

### Partially Ready

| Aspect | Specification |
|---|---|
| **Semantic meaning** | Some required competencies covered; material gaps or thin evidence remain |
| **Color usage** | Warning fill (`#D97706`) with white text |
| **Border** | Transparent / none |
| **Typography** | Medium 12px; label exactly **Partially Ready** |
| **Appropriate placement** | Dashboard and intelligence header when readiness is partial |

### Needs Evidence

| Aspect | Specification |
|---|---|
| **Semantic meaning** | Evidence package incomplete or not yet analyzable; recruiter must assemble inputs |
| **Color usage** | Soft Destructive: fill `rgba(220, 38, 38, 0.10)`, text Destructive (`#DC2626`) |
| **Border** | Transparent / none (soft fill is enough) |
| **Typography** | Medium 12px; label exactly **Needs Evidence** |
| **Appropriate placement** | Dashboard cards without intelligence; lifecycle states awaiting evidence |

### Draft

| Aspect | Specification |
|---|---|
| **Semantic meaning** | Work-in-progress Decision Analysis identity or unsaved/incomplete drafting context (optional lifecycle cue) |
| **Color usage** | Secondary Background / muted fill (`#F4F4F5`) with Secondary Text (`#3F3F46`) |
| **Border** | Optional 1px Border for definition on white |
| **Typography** | Medium 12px; label **Draft** |
| **Appropriate placement** | Prepare flow when identity exists but evidence is incomplete; do not replace Needs Evidence on the dashboard when that status is more accurate |

### Badge rules

1. Never animate badge color in loops—status changes may crossfade once (see Motion).
2. Do not stack more than one readiness badge on the same identity row.
3. Lifecycle labels (Analyzed, Ready for debrief) may appear in secondary contexts; readiness badges remain the primary dashboard signal when intelligence exists.

---

# Form Controls

Forms on **New Decision Analysis** must feel calm and approachable while supporting enterprise paste-heavy workflows (JD, resume, scorecards).

### Shared control specifications

| Property | Standard |
|---|---|
| **Control height (inputs / dropdowns)** | 40px |
| **Border** | 1px solid Border (`#E4E4E7`) |
| **Border radius** | 8px |
| **Background** | Surface (`#FFFFFF`) |
| **Text** | Primary Text; Body 14px |
| **Placeholder** | Muted Text (`#71717A`) |
| **Focus state** | Border → stronger neutral (`#A1A1AA`); 2px Focus Ring with offset; no colored glow |
| **Error state** | Border Destructive; helper/error text Destructive; optional soft tint background at 4% |
| **Disabled state** | Background Secondary Background; text Muted; border Divider; not focusable |

---

### Input fields

Single-line text for candidate name, role/requisition title, interviewer name, round.

- Height 40px; horizontal padding 12px
- Clear label above (not placeholder-as-label)
- Autofill and paste must not break border radius or focus ring

### Textarea

Multi-line paste surfaces for job description, resume, and qualitative notes.

- Min height 120px (notes) to 180–240px (JD / resume)
- Vertical resize optional; prefer auto-grow within a max height to avoid layout chaos
- Same border, radius, focus, and error treatments as inputs
- Monospace is unnecessary; Body typography keeps the product calm

### Dropdown

Selects for constrained values (when used).

- Height 40px; chevron 16px, Muted Text
- Menu: Elevated Surface, Border, Medium shadow, 8px radius
- Option hover: Hover Background
- Keyboard: arrow keys, Enter, Escape

### Upload Area

Optional paste-adjacent drop zone for future file intake; MVP may emphasize paste, but the pattern should exist.

- Dashed Border; Secondary Background wash; 12px radius
- Centered short instruction + secondary Browse action
- Hover: border darkens; background Hover Background
- Active drop: Focus Ring treatment
- Never imply automated resume parsing beyond MVP scope in copy

### Labels

- Body Medium 14px / Primary or Secondary Text
- 6–8px gap above control
- Required fields indicated with text (“Required”) or subtle asterisk—never by color alone

### Helper Text

- Caption 12px / Muted Text
- Sits below the control; explains paste expectations or minimum evidence rules
- One helper idea per field

### Validation Messages

- Caption / Body Small equivalent 12–13px, Destructive text
- Appears below the field after submit or blur—avoid shouting on every keystroke
- Summarize page-level blockers near the Primary action when Generate is blocked

### Primary Actions (in forms)

- Use Primary button for Generate Decision Intelligence / Save
- Place Primary at the end of the evidence flow (and sticky/repeated on long mobile forms)
- Pair with Secondary “Back to Decision Dashboard” when navigation is needed
- Loading state required for Generate

---

# Tables

Tables are the working surface for competency evidence and blocker lists. Optimize for **scanability**: stable columns, quiet chrome, predictable hover.

### Header

- Background: Secondary Background or Surface with bottom Divider
- Typography: Metric Labels or Medium 12px; Secondary/Muted Text; optional uppercase for dense ledgers
- Sticky header on long Decision Intelligence tables (desktop)
- No heavy header fills or colored bars

### Rows

- Min height 44–48px for touch and scan comfort
- Horizontal padding 12–16px per cell
- Bottom border: Divider (`#F4F4F5`)—prefer hairline separators over zebra stripes
- Zebra optional only if density requires it; default is white rows

### Hover

- Row background → Hover Background
- Cursor pointer only when the row expands or navigates
- Do not lift rows with shadows

### Sorting

- Sortable headers show a 16px subtle chevron
- Active sort: Primary Text on header label; inactive remain Muted
- Sorting must not reshuffle expanded-row state without clear reset

### Empty State

- Inside table container: centered Empty State Card pattern or a single calm row message
- Explain what will appear (e.g., competencies after analysis)—never a dead blank grid

### Spacing

- Cell padding 12px vertical / 16px horizontal as default
- Expandable detail: inset 16–24px with Secondary Background well

### Alignment

- Text: left
- Scores, counts, ranges: right or tabular center consistently per column
- Status badges: left-aligned in their column with consistent indent

### Typography

- Header: Medium 12px
- Body cells: Regular 14px / Secondary or Primary Text
- Nested evidence notes: Regular 13–14px / Secondary Text; captions for round metadata

---

# Icons

Use **Lucide** icons exclusively for consistency with the engineering stack.

| Size | Use |
|---|---|
| **16px** | Inline with buttons, badges-adjacent cues, table sort markers, dense metadata, chevrons in cards |
| **20px** | Navigation items, section header accents, empty-state secondary glyphs |
| **24px** | Standalone empty-state illustrations’ core glyph, rare feature callouts—never decorative clusters |

### Icon rules

1. Icons support comprehension (status, navigation, action)—they are not ornament.
2. Default color: Muted or Secondary Text; inherit Success/Warning/Destructive only when semantic.
3. Stroke width should stay consistent with Lucide defaults; do not mix filled playful icons.
4. Always provide a text label for primary actions; icon-only controls need an accessible name.

---

# Motion

Motion reinforces confidence and usability. Prefer short, quiet transitions. **Avoid flashy animations, loops, and parallax.**

### Global defaults

| Property | Value |
|---|---|
| **Duration (micro)** | 120–160ms — button color, focus ring appearance |
| **Duration (standard)** | 180–220ms — card hover, row hover, border transitions |
| **Duration (explicit)** | 240–300ms — expand/collapse rows, status crossfade |
| **Easing** | `cubic-bezier(0.2, 0.0, 0, 1)` (standard enterprise ease-out) |
| **Reduce motion** | Honor `prefers-reduced-motion: reduce`—replace motion with instant state changes |

### By element

| Element | Guidance |
|---|---|
| **Buttons** | Background and border color transition 150ms; no scale bounce |
| **Cards** | Border-color, shadow, and optional 1px translate over ~200ms; chevron translate 4px |
| **Inputs** | Border and ring fade 150ms on focus/blur |
| **Navigation** | Link color 150ms; no sliding mega-menus in MVP |
| **Tables** | Row background 150ms; expand/collapse height 250ms max with ease-out |
| **Status changes** | Badge label/color crossfade once ≤300ms after analysis completes—no pulsing “AI alive” effects |

### Motion anti-patterns

- Skeleton shimmer is acceptable for loading; neon or brand-colored pulse is not
- Do not auto-play illustrative motion on the Decision Intelligence Dashboard
- Loading spinners rotate simply; avoid ornate loaders

---

# Responsive Design

All three MVP screens remain available on every breakpoint. Content hierarchy does not change—only layout density does.

### Desktop (≥1024px)

| Topic | Behavior |
|---|---|
| **Grid** | Single main column within AppShell max width (~1152px); Decision Intelligence sections stack vertically in fixed IA order |
| **Cards** | Full-width list cards; metrics in a 4-column row |
| **Spacing** | Page padding 24px; section gaps 32px |
| **Tables** | Full-width readable tables; sticky header allowed |
| **Buttons** | Primary aligned with PageHeader (right on wide layouts) |

### Tablet (768–1023px)

| Topic | Behavior |
|---|---|
| **Grid** | Same single column; slightly reduced horizontal padding (16–24px) |
| **Cards** | Stack naturally; metrics may wrap to 2×2 |
| **Spacing** | Section gaps 24–32px |
| **Tables** | Prefer horizontal scroll with sticky first column **or** stacked definition lists for blocker tables—choose one pattern per table type and keep it consistent |
| **Buttons** | Header actions may wrap under title; maintain Primary visibility |

### Mobile (<768px)

| Topic | Behavior |
|---|---|
| **Grid** | Single column only |
| **Card stacking** | Full-bleed-within-padding cards; metrics in 2-column grid |
| **Spacing** | Page padding 16px; tighten section gaps to 24px; preserve card internal padding ≥16px |
| **Tables** | Stacked cards or horizontal scroll; expandable competency detail must remain thumb-friendly (≥44px targets) |
| **Button placement** | Primary full-width or sticky near bottom on long Prepare / Intelligence flows; Secondary stacks below Primary |

### Responsive rules

1. Do not hide Decision Intelligence sections on mobile.
2. Do not convert the product into a bottom-tab ATS shell.
3. Touch targets ≥44px for primary interactive rows and buttons.

---

# Accessibility

DecisionReady AI should meet **WCAG AA** wherever practical—especially contrast, keyboard use, and status clarity.

### Contrast

- Primary Text on Primary Background and Surface meets AA for body and headings
- Muted Text used only for non-essential captions at sizes that still meet AA where required
- Badge text on Success/Warning fills must maintain sufficient contrast (white on solid fills)
- Soft Destructive badges rely on dark Destructive text on light tint—not light red on white alone

### Keyboard navigation

- All primary actions, cards-as-links, inputs, dropdowns, and expandable table rows are reachable via Tab
- Enter/Space activates buttons and expandable rows
- Escape closes dialogs and dismissible menus
- Logical focus order follows visual reading order (header → primary CTA → content)

### Focus indicators

- Visible 2px Focus Ring (`#A1A1AA`) with offset on interactive elements
- Never remove focus outlines without an equivalent custom ring
- Focus must remain visible on dark Primary buttons (light ring / offset)

### ARIA labels

- Icon-only controls require `aria-label`
- Decision Analysis cards expose an accessible name including candidate and role
- Loading buttons expose busy state (`aria-busy` / live region for analysis completion as appropriate)
- Status badges’ text is present in the accessibility tree (not icon-only status)
- Tables use proper `<table>` / header scopes or an equivalent semantic structure for stacked mobile variants

### Touch targets

- Minimum 44×44px for primary controls and expandable row hit areas on touch devices
- Increase spacing between destructive and primary actions to prevent mis-taps

### Readable typography

- Minimum body 14px in product UI
- Avoid ultra-light weights
- Line length for long evidence text ideally ≤70–80 characters where layout allows
- Do not convey readiness by color alone—text labels are required

---

# Design Principles Summary

Use this checklist for every future UI implementation:

1. **Evidence before aesthetics.** Structured readiness, coverage, and blockers outrank decoration.
2. **Calm interfaces reduce cognitive load.** Quiet color, measured space, and minimal motion help people decide.
3. **Every component should reinforce trust.** No playful, futuristic, or marketing-heavy patterns in the product shell.
4. **Consistency is more valuable than novelty.** Reuse buttons, cards, badges, and tables as specified.
5. **AI should explain, not overwhelm.** Progressive disclosure and transparency over chat-like spectacle.
6. **One primary action per screen.** Hierarchy of commitment must stay obvious.
7. **Borders before heavy shadows.** Structure with hairlines; elevate lightly only when interaction needs it.
8. **Green is an accent, not a brand wash.** Success color signals readiness—neutrals carry the UI.
9. **Status needs words, not just color.** Badges and verdicts remain readable without hue.
10. **The same product on every viewport.** Responsive stacking never removes Decision Intelligence substance.

---

| Field | Value |
|---|---|
| **Status** | Complete — Component patterns through Design Principles Summary |
| **Reference Documents** | `docs/00_execution_plan.md` · `docs/01_problem_discovery.md` · `docs/02_product_requirements.md` · `docs/03_information_architecture.md` |
| **Product** | DecisionReady AI — AI Decision Intelligence Platform |
