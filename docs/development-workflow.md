# Development Workflow

This document defines how LumaFlow Studio work moves from idea to production. It is designed for human + Codex collaboration and complements `AGENTS.md`.

## 1. Work hierarchy

Use GitHub as the source of truth:

```text
Product goal
  -> Milestone
    -> Issue
      -> Branch
        -> Commits
          -> Pull Request
            -> CI / review
              -> Merge
```

Do not treat chat prompts as the durable record of a feature. Important context belongs in the issue or linked documentation.

## 2. Milestones

Use milestones for coherent delivery goals, not arbitrary dates.

Recommended sequence for the current product phase:

- `M0 - Workflow & engineering foundation`
- `M1 - SaaS workspace architecture`
- `M2 - Onboarding & activation`
- `M3 - E2E quality`
- `M4 - Client workflow & contracts`
- `M5 - Local AI maturity`
- `M6 - Performance & analytics`
- `M7 - Observability & security hardening`
- `M8 - Public beta validation`
- `M9 - Portfolio case study`
- `V1 - Stable flagship release`

A milestone should have a clear exit condition. Do not move unfinished work forward merely to close a milestone.

## 3. Issue types

### Feature

Use for new product behavior that solves a user problem.

Must include:

- problem/context;
- expected outcome;
- scope;
- non-goals;
- acceptance criteria;
- technical/security impact.

### Bug

Use for reproducible incorrect behavior or regressions.

Must include:

- reproduction steps;
- expected behavior;
- actual behavior;
- environment;
- evidence when available;
- regression acceptance criteria.

### Technical task

Use for refactors, test infrastructure, performance, observability, CI, dependency maintenance and other engineering work that should not invent new product behavior.

Must define the behavior that must remain unchanged.

## 4. Labels

Recommended minimal label taxonomy:

### Type

- `type: feature`
- `type: bug`
- `type: tech-debt`
- `type: docs`

### Area

- `area: frontend`
- `area: backend`
- `area: full-stack`
- `area: auth`
- `area: clients`
- `area: jobs`
- `area: calendar`
- `area: bookings`
- `area: billing-docs`
- `area: deliveries`
- `area: analytics`
- `area: ai`
- `area: infrastructure`

### Priority

- `priority: critical` — production/security/data-loss blocker
- `priority: high` — blocks milestone or key user workflow
- `priority: medium` — important planned work
- `priority: low` — useful but not milestone-critical

### Status

Prefer GitHub project fields for workflow status. If labels are needed, keep them minimal:

- `status: blocked`
- `status: needs-design`
- `status: needs-decision`

Avoid dozens of overlapping labels.

## 5. Preparing an issue for Codex

An issue is ready for Codex when another developer could implement it without inventing product requirements.

Before assigning work, verify:

- acceptance criteria are objective;
- scope/non-goals are explicit;
- relevant files/docs are linked when known;
- unclear product decisions are resolved;
- migration/security/API implications are identified;
- dependencies on other issues are linked.

### Recommended Codex instruction

When starting implementation from an issue, use a short instruction rather than re-describing the feature:

```text
Implement GitHub issue #123 in AVL05/lumaflow-studio.
Follow the repository AGENTS.md files and the issue scope strictly.
Inspect existing patterns before changing code.
Add/update tests and documentation required by the issue.
Run the relevant validation commands.
Create a focused PR that links and closes the issue.
Do not implement out-of-scope roadmap work.
```

The issue should carry the details; the prompt should not become a second conflicting specification.

## 6. Implementation cycle

For each issue:

1. Read root `AGENTS.md` and the nearest nested `AGENTS.md` for files being modified.
2. Inspect existing implementation and tests.
3. Create a correctly named branch.
4. Implement the smallest complete change satisfying the acceptance criteria.
5. Add tests while implementing, not after everything else.
6. Update docs/contracts in the same branch.
7. Run focused checks during iteration.
8. Run the required final validation for the scope.
9. Review the diff for unrelated changes, debug code, accidental dependency churn and secrets.
10. Open a PR using the repository template.

## 7. Pull request review gates

A PR should not be merged until the applicable gates pass.

### Product gate

- Solves the issue's actual problem.
- Does not include speculative adjacent features.
- UI copy and behavior match LumaFlow product principles.

### Architecture gate

- Reuses existing abstractions.
- Domain logic is in the appropriate layer.
- API and frontend remain correctly separated.
- No framework migration or unnecessary dependency is introduced.

### Security gate

- Ownership boundaries remain intact.
- Foreign resources do not leak existence.
- No secrets or real customer data are present.
- Public-token surfaces have been reviewed where touched.

### Quality gate

- Relevant tests exist and pass.
- Regression tests accompany bug fixes where practical.
- Lint/build checks pass.
- Loading/empty/error/responsive states are covered for UI work.

### Documentation gate

- API/architecture/deployment/AI docs reflect behavior.
- Roadmap does not claim unimplemented work is complete.

## 8. Scope control

Codex may discover adjacent problems while implementing an issue. Handle them as follows:

- If required for correctness/security of the current issue: include and explain in the PR.
- If independent and non-blocking: open/follow up with a separate issue.
- If it changes product direction or architecture: stop and request a decision.

Do not turn every issue into a repository-wide cleanup.

## 9. Definition of Ready

An issue is ready to start when:

- problem and expected outcome are clear;
- acceptance criteria are testable;
- key product decisions are resolved;
- dependencies/blockers are known;
- scope is small enough for one reviewable PR or intentionally split into sub-issues.

## 10. Definition of Done

The repository-level Definition of Done is maintained in `AGENTS.md`. In practice, a completed issue should have:

```text
Issue with acceptance criteria
          ↓
Focused branch
          ↓
Implementation + tests + docs
          ↓
Local validation
          ↓
Pull Request
          ↓
CI green + review
          ↓
Merge
          ↓
Issue closed
```

## 11. Releases

Do not treat every merge as a named release.

For stable milestones/releases:

1. ensure milestone-critical issues are closed;
2. validate production migration compatibility;
3. run full CI and production smoke checks;
4. update relevant README/roadmap/release notes;
5. create a version/tag when the release has meaningful external identity.

Public-beta language must remain accurate. Do not advertise billing, SLAs, compliance or guarantees that the product does not actually provide.

## 12. How to use Codex effectively in this repository

Use Codex primarily as an implementation/review agent, not as the product manager.

Good tasks:

- implement a well-defined issue;
- investigate a reproducible bug;
- add regression tests;
- refactor against explicit invariants;
- update API/docs after a defined contract change;
- review a PR for architecture/security/test gaps.

Weak tasks:

- "improve LumaFlow";
- "make the dashboard better";
- "add useful AI features";
- "refactor everything";
- "make it production ready".

Convert broad goals into issues with measurable outcomes before implementation.
