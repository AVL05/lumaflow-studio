# LumaFlow Studio — Product vision

> **Status:** strategic product direction, not a list of implemented features.
> **Audience:** contributors, product/design reviewers, Claude Code, Codex, and other coding agents.
> **Language:** English documentation; Spanish-first product UI.

## North star

**The calm, beautifully designed operating workspace for independent photographers and audiovisual creatives.**

LumaFlow Studio helps creative professionals manage the business *around* their craft: client relationships, inquiries, booking, production, projects, documents, and client handoff. It must reduce admin work and disconnected tools, not try to replace creative software.

**Product promise:** A solo photographer can move from first inquiry to completed delivery with clarity, confidence, and minimal administrative friction.

## Who it serves

**Primary:** independent photographers, especially portrait, wedding, event, and commercial specialists, and small photography studios.

**Secondary:** freelance videographers, filmmakers, and small audiovisual production teams whose workflows overlap with photography.

Prioritize solo operators and small teams. Do not design enterprise complexity, complex permission hierarchies, or general-purpose project management workflows by default.

## The real problem

A typical creator splits clients across messages and spreadsheets; bookings across calendars; projects across notes; contracts and invoices across documents; and approvals across third-party galleries. The result is lost context, duplicated work, and avoidable mistakes.

LumaFlow should become the **operational source of truth** connecting these moments. It need not own every underlying file, channel, or tool.

## Core user journey

1. **Get started:** create an account, understand the workspace, create the first meaningful item.
2. **Capture demand:** record a client and a booking/inquiry.
3. **Agree the work:** track project, quote, contract and business documents as applicable.
4. **Prepare:** schedule a session, plan shots, tasks, checklists, equipment and locations as needed.
5. **Execute:** know today's priorities, session status and pending work at a glance.
6. **Handoff:** connect an external delivery/gallery, collect feedback, favorites or approvals where supported.
7. **Close and return:** mark work complete, find its history and follow up with the client.

These steps are **user outcomes**, not a claim that every step currently works end-to-end. Confirm actual behavior against code and tests.

## Product pillars

- **Connected studio workspace:** clients, jobs, sessions, calendar and tasks share one coherent workflow.
- **Professional client experience:** clear booking, contract and delivery touchpoints that inspire trust.
- **Actionable overview:** upcoming shoots, deadlines, decisions and work requiring attention—not ornamental analytics.
- **Creative production tools:** shot lists, checklists, locations, equipment and reusable workflows where they actually save time.
- **Practical business administration:** quotes, invoices, contracts and business insights, without pretending to provide legal, financial or tax advice.
- **Optional local-first AI:** useful assistance that never blocks core features and respects the user's privacy.

## What LumaFlow is NOT

- Not Lightroom, Capture One, Premiere, or a media editor.
- Not a cloud backup, primary RAW photo/video host, or generic gallery host.
- Not a social network, marketplace, enterprise ERP, or all-purpose task manager.
- Not an AI-first product that requires a model, API key or paid inference to be useful.
- Not a feature-count competition: remove friction before expanding scope.

Continue treating external galleries as first-class integrations/handoff destinations. Don't quietly start storing original media libraries.

## Business model and trust

**Strategic decision:** LumaFlow is intended to remain free to use, supported by **optional voluntary contributions** (for example, donation links when configured). Donations must never unlock privileges, premium features, priority service, or artificial usage allowances.

Do **not** introduce subscriptions, paid tiers, feature paywalls, payment-provider SDKs or donor tracking without a new explicit owner decision. Existing documentation contemplating future plans/pricing is historical and should not override this direction. Legal and fiscal claims still require a separate review; this vision is not a promise of unlimited infrastructure or an SLA.

Design with responsible hosting costs, predictable resource use, no unnecessary third-party tracking, and graceful degradation.

## Product principles, in order

1. **Reliability, security and truthful state.** No fake successful saves, hidden 500s, unauthorized data access, or unsupported production claims.
2. **Real user workflows over isolated CRUD screens.** Reduce steps and prevent re-entering data.
3. **Clarity before density.** Users must know what to do next.
4. **Accessible, responsive, fast by design.** Desktop-first productivity but full mobile usability.
5. **Professional polish without distraction.** Form follows creative work.
6. **Privacy and user agency.** Minimize data, keep media external, make AI optional.
7. **Maintainability and focused changes.** Reuse architecture and existing patterns before adding libraries.

## Product success signals (measure, do not invent)

- Time/steps from signup to first client and first project/session.
- Completion rate for a real client → project → session → delivery journey.
- Rates of failed or abandoned saves, portal operations and account onboarding.
- Actual return usage and qualitative feedback from photographers.
- Support reports about confusing status, navigation or missing information.
- Page responsiveness, accessibility and infrastructure reliability.

Only collect metrics with appropriate privacy review. Do not fabricate current adoption or product-market fit.

## Release priorities

**P0 – Trust and stability:** confirm production reliability (including previously reported intermittent backend 500s), auth, workspace isolation, backups, and recoverable errors. Previous reports are leads for investigation, not confirmation of current production state.

**P1 – Core journey:** simplify onboarding and client/project/session/delivery paths; validate with real users.

**P2 – Cohesion:** connect modules, reduce duplicate concepts, simplify navigation, names and status transitions.

**P3 – Product design:** establish a distinctive, consistent, premium interface after the user journey is sound.

**P4 – Validated expansion:** ship a new feature only with a demonstrated user problem, clear acceptance criteria, and maintenance budget.

**P5 – Scale:** performance, operational maturity and more advanced studio needs when demand justifies them.

## Decision test for every proposal

Before adding or changing a feature, answer:

1. Which photographer or filmmaker needs this?
2. Which concrete workflow is faster, safer or clearer?
3. Can the existing feature be improved instead?
4. Is it useful without local AI or another paid dependency?
5. What security, privacy, infrastructure and maintenance costs does it add?
6. How will we verify that it works?

If the answers are weak, recommend **not building it**. The desired outcome is a smaller, coherent, excellent product—not an inflated roadmap.

## Source-of-truth boundaries

- This document defines **intent and priorities**.
- `README.md`, `docs/architecture.md`, `docs/api.md`, the codebase and automated tests describe **existing implementation**, subject to verification.
- `DESIGN.md` defines the **design direction**, not a claim that all components have been migrated.
- `CLAUDE.md` and `AGENTS.md` define **agent workflow and engineering safeguards**.
- `docs/roadmap.md` tracks current planned/implemented work; synchronize it as decisions evolve.

When sources disagree, highlight the discrepancy rather than silently rewriting history or claiming unimplemented features are live.
