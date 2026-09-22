# End-to-End Unit Testing Progress

Tracks the ongoing task: "unit test all components, frontend to backend, fix anything broken."
This file is the single source of truth across loop iterations/sessions — always read it first,
update it before stopping, and commit+push every iteration so work is never lost.

## Environment (set up once, iteration 1)
- MySQL 8 installed locally via apt, running as a system service (`service mysql start`).
  root password: `test_password` (matches `tests/conftest.py`), db `test_db` created.
- Redis running locally via `redis-server --daemonize yes --port 6379`.
- Backend deps: `pip install -r requirements.txt -r requirements-dev.txt`
- Frontend deps: `cd frontend && npm install`
- NOTE: on a fresh container these services will NOT be running — re-check/restart them
  at the start of every iteration (`mysqladmin ping`, `redis-cli ping`, `service mysql start`).

## Strategy
1. Phase 0: Get environment working, get EXISTING test suite to run at all (baseline).
2. Phase 1: Fix all FAILING tests in the existing suite (regressions/breakages) — highest value.
3. Phase 2: Add unit tests for backend route modules with NO test coverage yet, prioritized
   by criticality (auth/core academic/payments first).
4. Phase 3: Add unit tests for frontend components/pages with no test coverage.
5. Phase 4: Integration/contract checks between frontend calls and backend endpoints (catch
   frontend/backend mismatches - the "start to end" integration ask).
6. Mobile app tests are lower priority (explicit ask was "frontend to backend") — touch only
   after 1-4 are in good shape, time permitting.

## Status: PHASE 1 — FRONTEND DONE (337/337 passing, 13/13 files). Backend not started yet.

## Baseline
- Frontend (`npx vitest run` in `frontend/`): 133 failed / 199 passed (335 total), 10 of 14 files failing.
- Backend: not yet run (pip install had a dependency conflict, fixed — see below — but full
  `pytest` run not yet attempted this session; do that next).

## Frontend fixes applied (Phase 1) — newest first
1. **auth.test.ts** (commit 90e5f07) — all 14 tests now pass, 0 unhandled errors.
   - Demo credential tests asserted stale lastName/role values from before
     `frontend/src/data/dummyData.ts`'s demo users were updated (e.g. admin demo user is now
     Michael **Anderson** / role **institution_admin**, not Brown / admin).
   - "Non-Demo Credentials" tests mocked the pre-rewrite URL (`/api/auth/login`) but the axios
     request interceptor in `frontend/src/lib/axios.ts` rewrites `/api/*` → `/api/v1/*` before
     the request fires, so the MSW handler never matched.
   - Once matched, hit a real env bug: happy-dom v12's `Response.body` isn't a real
     `ReadableStream` (no `getReader`), which MSW v2's XHR interceptor needs. Rewrote those 3
     tests to mock `axiosInstance.post` directly instead of round-tripping through MSW/XHR
     (also fixed a latent 2nd bug: their fixtures used camelCase `AuthResponse` fields but real
     responses go through `normalizeAuthResponse`, which reads snake_case backend fields).
   - NOTE: this happy-dom gap may resurface in other test files that exercise a real
     axios+MSW+XHR round trip (not just short-circuited demo paths) — if you hit
     "response.body.getReader is not a function" elsewhere, use the same
     mock-axios-directly pattern rather than re-diagnosing from scratch.
2. **Admin/Student/Teacher/Parent Layout tests** (commit ddb12d1) — 144 tests fixed, all 4
   layout suites now fully pass (Admin 32, Student/Teacher/Parent ~82 combined... see commit).
   Root causes (applied identically across all 4 role layouts + their Sidebar components):
   - `tests/test-utils.tsx`'s `AllTheProviders` always wrapped in `<BrowserRouter>`; the layout
     test files also wrap in their own `<MemoryRouter>` → nested-Router crash. Added a
     `withRouter` opt-out option.
   - `AllTheProviders` was also missing `AccessibilityProvider` (present in real `main.tsx`),
     which `AccessibilityToolbar` (rendered by every layout's AppBar) requires — added it.
   - Hamburger-button query regex `/toggle drawer|menu/i` ambiguously also matched the
     accessibility-menu button once AccessibilityProvider was fixed — tightened to
     `/^toggle drawer$/i`.
   - MUI's temporary `Drawer` portals its Paper to `document.body`; an `aria-label` on the
     *wrapping* `<Box>` in each `*Layout.tsx` never reaches the portaled content, so the mobile
     nav landmark was always empty/unfindable. Fixed by labelling the Drawer's `Paper` directly
     via `PaperProps={{ component: 'nav', 'aria-label': 'Mobile navigation' }}` in each
     `*Sidebar.tsx`, and removed the now-redundant/misleading wrapper-Box labelling.
   - `getByRole('main')` was queried while the main content was legitimately `aria-hidden`
     behind an open modal drawer — added `{ hidden: true }` where that's measured post-open.
   - Branding text ("EduPortal", "<Role> Portal", parent's "MONITORING MODE" banner) is
     rendered by BOTH the always-mounted desktop sidebar and the mobile one once actually
     opened — happy-dom doesn't apply the CSS media query that would hide the desktop one, so
     plain `screen.getByText(...)` was ambiguous. Scoped to `within(drawer).getByText(...)`.
3. **requirements-dev.txt / requirements.txt httpx conflict** — `requirements-dev.txt` pinned
   `httpx==0.26.0` while `requirements.txt` resolved `httpx==0.28.1` (pulled in via `openai`),
   making `pip install -r requirements.txt -r requirements-dev.txt` fail with
   `ResolutionImpossible`. Removed the redundant/stale dev pin.

## Frontend: DONE — 337/337 passing (verified `cd frontend && npx vitest run`)
All remaining files from the earlier checkpoint were fixed this session:
4. **AssignmentForm.test.tsx** (commit c15fef6) — happy-dom v12's `cancelAnimationFrame` is
   broken for handles MUI's `TextareaAutosize` passes on unmount (`Cannot create property
   '_destroyed' on number '-1'`) — replaced `window.requestAnimationFrame`/
   `cancelAnimationFrame` globally in `src/setupTests.ts` with setTimeout-based equivalents.
   Also: `@mui/x-date-pickers`' ESM build does bare directory imports (`@mui/material/
   useMediaQuery`, no `/index.js`) that fail under Vitest's native Node ESM resolution
   (`ERR_UNSUPPORTED_DIR_IMPORT`) — added it to `vitest.config.ts`'s `test.server.deps.inline`
   so Vite's transform pipeline handles it instead.
   IMPORTANT: tried bumping happy-dom 12→20 to fix this at the root — regressed the suite
   heavily (72 failed vs 17 baseline, other libs incompatible with its breaking changes).
   Do NOT re-attempt a happy-dom major bump without re-validating the entire suite.
5. **LoginPage.test.tsx** (commit 52c3d6e) — "shows validation errors" expected inline
   DOM text, but the form uses plain HTML `required` fields with no inline-message UI, so
   validation is native-browser-only (not DOM-queryable). Rewrote to assert the real
   behavior (fields report `:invalid`, form stays unsubmitted).
6. **demoDataApi.test.ts** (commit 52c3d6e) — test called `list({ limit: 10 })` but asserted
   `result.limit` toBe(50) — copy-paste bug from the function's default; fixed to expect 10.
7. **tests/e2e/demo-user-flow.spec.ts** (commit 9336a95) — this is a Playwright spec (real
   browser + dev server) that Vitest's default include glob was wrongly collecting. Excluded
   `tests/e2e/**` in `vitest.config.ts`. (Not "fixed" as a unit test — it's simply out of
   Vitest's scope; if E2E coverage is ever run, use `npx playwright test` from repo root,
   which has its own `playwright.config.ts`.)
8. **demoUser.integration.test.tsx** (commit 55f6fa4) — same stale admin-role mismatch as #1
   (7 assertions), plus 5 tests querying `getByRole('main')` on dashboard pages rendered
   *without* their Layout wrapper (the `main` landmark only exists on the Layout, which this
   file intentionally doesn't render) — switched to checking the render actually produced
   content.
9. **tests/examples/integration-example.test.tsx** (commit 64a68d0) — an example `LoginForm`'s
   `<h1>Login</h1>` and its submit button both say "Login", so `getByText('Login')` was
   ambiguous once earlier fixes let both actually render — switched to
   `getByRole('button', {name: 'Login'})`. Separately, "should handle role switching" rendered
   `<Dashboard/>` twice (student then teacher) without unmounting between renders (`render()`
   appends rather than replaces) — added a `cleanup()` call between them.

## Known recurring gotchas to remember for backend/future frontend work
- **Stale demo-data assertions**: `data/dummyData.ts`'s demo users use last names / role
  strings (e.g. `institution_admin`, not `admin`) that many older tests don't reflect. If you
  hit a role/name mismatch, check `dummyData.ts` as the source of truth before assuming the
  app is broken.
- **happy-dom v12 has real bugs** (ReadableStream.getReader missing, cancelAnimationFrame
  broken) — don't re-diagnose from scratch if you see similar crashes elsewhere; check
  `src/setupTests.ts`'s rAF polyfill and the mock-axios-directly pattern in `auth.test.ts`
  first, and extend those rather than reinventing.
- **MUI temporary Drawer portals to document.body** — an aria-label on a wrapping element
  never reaches it; label the Drawer's own `Paper` via `PaperProps`.

## Environment setup commands (re-run at the start of a fresh container/session)
```
service mysql start   # or: mysqld_safe & — check with `mysqladmin -u root -ptest_password ping`
redis-server --daemonize yes --port 6379   # check with `redis-cli ping`
cd /home/user/eduApp && pip install -r requirements.txt -r requirements-dev.txt
cd frontend && npm install
```
NOTE (root-caused): `pip install -r requirements.txt -r requirements-dev.txt` looks like it
succeeds (prints `[exited with code 0]`) but actually silently fails partway through:
`ERROR: Cannot uninstall PyYAML 6.0.1, RECORD file not found. Hint: The package was installed
by debian.` PyYAML was installed via apt (no pip RECORD metadata), so pip can't upgrade/
uninstall it mid-batch, aborts installing most of the remaining packages (fastapi included,
since it sorts late in the dependency-installation order), yet still exits 0. ALWAYS use:
```
pip install --ignore-installed -r requirements.txt -r requirements-dev.txt
```
and verify afterwards with `python3 -c "import fastapi, sqlalchemy, pytest"` — don't trust
a bare `pip install ...` exit code for this repo's backend deps.

## Backend route modules (113 total) — test coverage checklist
Legend: [x] has dedicated test file & passing | [~] has test file, some failing | [ ] no test file yet

Existing test files (45) cover: assignment_service, attendance_service, auth_service,
celery_tasks, ml_services, subscription_service (unit) + auth, ml, parents, students,
subscriptions, teachers, websocket, error_handling, security, api_schema (integration)
+ migration tests.

Modules with NO dedicated unit test yet (108) — work through in this order:
### Tier 1 - Core/Critical (do first)
- [ ] academic_years
- [ ] institutions
- [ ] institution_admin
- [ ] students (unit-level beyond integration)
- [ ] teachers (unit-level beyond integration)
- [ ] users
- [ ] grades
- [ ] sections
- [ ] subjects
- [ ] terms
- [ ] attendance (route-level)
- [ ] exams
- [ ] quizzes
- [ ] assignments (route-level)
- [ ] submissions
- [ ] fees
- [ ] subscriptions (route-level beyond integration)
- [ ] webhooks
- [ ] credentials

### Tier 2 - Feature modules
- [ ] announcements, notifications, notification_templates, notification_analytics
- [ ] messages, conferences, parent_teacher_collab
- [ ] question_bank, question_blueprints, question_bookmarks, question_nlp
- [ ] study_materials, flashcards, previous_year_papers, learning_paths, learning_styles
- [ ] gamification, goals, peer_recognition, sel, wellbeing
- [ ] doubts, reverse_classroom, peer_tutoring
- [ ] library, timetable, timetables, transport
- [ ] content_marketplace, merchandise
- [ ] live_events, live_events_websocket, virtual_classrooms, classroom_websocket, collaboration
- [ ] document_vault, homework_scanner, plagiarism, mistake_analysis, weakness_detection
- [ ] predictions, board_exam_predictions, ai_prediction_dashboard, ml_analytics, ml_monitoring, ml_training, recommendations
- [ ] yearbook, elections, community_service, volunteer_hours, carpools, journalism
- [ ] career, college_planning, scholarship_essays, entrepreneurship, student_employment, finance_education, parent_education
- [ ] olympics, podcasts, research, study_buddy, study_planner, subject_rpg
- [ ] family, parents (route), parent_roi, feedback, profile, settings, onboarding
- [ ] search, dashboard_widgets, data_management, database_maintenance, institution_health
- [ ] branding, chatbot, events
- [ ] super_admin, super_admin_analytics, super_admin_reports, school_admin
- [ ] rate_limits, performance_monitoring, migrations, mobile_auth, grade_configurations

## Frontend (React) — test coverage checklist
~220 page components under `frontend/src/pages`, only 10 test files exist currently.
Detailed per-page checklist to be built in Phase 3 once backend Tier 1 is stable —
don't duplicate that inventory work until we get there.

## Fixes applied so far (running log — newest first)
_(none yet — Phase 0 in progress)_

## Next resume point
Frontend Phase 1 is complete (337/337). Next: run the backend `pytest` suite for the first
time this session (deps + DB were installed earlier — see Environment setup commands above,
but RE-VERIFY mysql/redis are running first, they don't survive a container restart) and
repeat Phase 1 (fix failures) for backend. Expect this to take multiple iterations given the
backend has 113 route modules and only 45 existing test files. Only after backend Phase 1 is
green (or remaining failures are understood/triaged) move to Phase 2 (new test coverage for
the 108 backend route modules and ~210 frontend pages that currently have zero dedicated
tests — see checklists above). Do not restart frontend Phase 1 work — it's done; spot-check
with a full `npx vitest run` if picking this up much later, but don't re-investigate
individual files that are already marked fixed above.
