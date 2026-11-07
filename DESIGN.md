# LumaFlow Studio — Experience and design direction

> Design brief and review criteria. Not an inventory of shipped screens or a mandate to rebuild the UI immediately.

## Experience statement

LumaFlow should feel like a **calm creative studio desk**, not a generic admin panel: focused, confident, practical and unmistakably professional. Take inspiration from the restraint and craft of excellent Apple-like interfaces without copying a proprietary product.

**Premium is the quality of the complete interaction, not the amount of decoration.**

## Design goals

- Make the next relevant action obvious in every workflow.
- Connect related information: client → job → session → delivery, without forcing repeated data entry.
- Support dense information when needed through disclosure, grouping and hierarchy, not through endless cards.
- Give photographers a visual sense of craft: strong typography, rhythm, thoughtful whitespace and subtle imagery where it adds context.
- Respect Spanish-first language, internationalizable strings, accessibility, responsive layouts and real content lengths.
- Prefer fast, quiet feedback and reliable loading, empty, validation, success and error states.

## Visual direction

**Art direction:** minimal editorial foundation + selective cinematic moments. Use a restrained surface hierarchy, deliberate contrast, clear typography and purposeful accent color. Avoid bland template dashboards.

**Do:**
- Design around actual tasks and content rather than an attractive screenshot.
- Create clear page headings, localized labels, navigation hierarchy and obvious primary actions.
- Use reusable design tokens (color, typography, spacing, radius, shadow and motion) and existing Tailwind 4 conventions.
- Give calendar, schedules, checklists and project status appropriate information density.
- Use subtle motion to communicate transitions and state, with reduced-motion support.
- Test dark/light surfaces where present; ensure contrast, focus visibility and touch targets.
- Show representative real-world Spanish copy, realistic long client names and empty datasets.

**Avoid:**
- Generic KPI-card grids on every page, unnecessary glassmorphism or gradient-heavy backgrounds.
- Using photography as decoration that hurts legibility or performance.
- Excessive animation, scroll-jacking, fake charts or fabricated activity.
- Adding a parallel component library, global state system or styling framework without an explicit decision.
- Hiding critical status, errors, or destructive actions for aesthetic simplicity.
- Replacing a working design system wholesale as the first step.

## UX requirements for every critical surface

For dashboard, onboarding, client, job, session, booking, contract and delivery paths:

1. Define the primary user goal and top task.
2. Map the happy path, empty path, error path and return visit.
3. Keep forms short, label required information clearly, preserve user input on recoverable failures.
4. Expose current lifecycle status, ownership and related actions.
5. Handle keyboard navigation, accessible names, focus management and sensible mobile layout.
6. Provide explicit confirmation for destructive operations.
7. Measure success by user effort and task completion, not visual novelty.

Client-facing portals need exceptional clarity, readability, trustworthy status and privacy-aware sharing.

## Proposed design-system artifacts

When a redesign is approved, document and implement incrementally:
- Token inventory grounded in the current code (no invented current token values).
- Typography scale, semantic color roles, layout grid and responsive rules.
- Navigation, buttons, inputs, overlays, tables, calendars, timelines, status and feedback patterns.
- Component states and accessibility contracts.
- Example end-to-end layouts for dashboard → clients → projects → production → delivery.

Capture before/after screenshots and describe **the measurable UX improvement**. A new font, border radius or color alone is not a product redesign.

## Delivery sequence

1. Audit the actual interface and user journeys.
2. Identify the largest usability gaps.
3. Improve the journey/wireframes first.
4. Define/refine shared tokens and reusable components.
5. Implement one coherent vertical slice.
6. Verify behavior, responsive layouts, accessibility and performance.
7. Extend the system to other flows after the first slice is validated.

Keep business logic and API contracts intact unless an approved task explicitly changes them. Never treat a style-only demo as proof the real application is production ready.

## Design review questions

- Can an unfamiliar photographer finish the task without instruction?
- Is the most important action and current status clear?
- Does the screen communicate only real data?
- Does it remain useful on mobile and keyboard?
- Did we remove friction or merely change visual styling?
- Can another developer reuse these patterns consistently?

If the answer is no, the design is unfinished.
