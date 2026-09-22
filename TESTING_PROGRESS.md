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

## Status: PHASE 1 — fixing failing tests in existing suite (frontend in progress, backend not started yet)

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

## Frontend — still failing after auth.test.ts + 4 layouts fix (re-check counts, don't trust blindly)
As of the last full run before this checkpoint: 8 of 14 files still failing (52 tests) —
recheck with `cd frontend && npx vitest run` since auth.test.ts's fix may have changed the
overall count. Known remaining files (from that run):
- `src/AssignmentForm.test.tsx` — whole file failing to run/collect, not yet investigated.
- `src/LoginPage.test.tsx` — 1 test: "shows validation errors for empty fields"
- `src/api/demoDataApi.test.ts` — 1 test: "should handle list params"
- `src/api/demoUser.integration.test.tsx` — 7 tests failing (role-specific dashboard access,
  demo user consistency/RBAC checks) — not yet investigated, may share root causes with each
  other (single investigation should cover multiple).
- `tests/e2e/demo-user-flow.spec.ts` — whole file failing to run/collect (this is a Playwright
  spec file sitting in the vitest test glob — may just need excluding from vitest's config
  rather than "fixing", check `vitest.config.ts` testMatch/exclude patterns first).
- `tests/examples/integration-example.test.tsx` — 4 tests failing.

## Environment setup commands (re-run at the start of a fresh container/session)
```
service mysql start   # or: mysqld_safe & — check with `mysqladmin ping`
redis-server --daemonize yes --port 6379   # check with `redis-cli ping`
cd /home/user/eduApp && pip install -r requirements.txt -r requirements-dev.txt
cd frontend && npm install
```

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
Continue Phase 1: investigate/fix the remaining frontend files listed above (AssignmentForm,
LoginPage, demoDataApi, demoUser.integration, e2e/demo-user-flow.spec.ts config issue,
examples/integration-example), re-running the full frontend suite after each fix to track
the real remaining count. Once frontend Phase 1 is clean, run the backend `pytest` suite for
the first time this session (deps + DB are installed — see Environment setup commands above)
and repeat Phase 1 for backend. Only after both suites are green (or remaining failures are
understood/triaged) move to Phase 2 (new test coverage for untested modules).
