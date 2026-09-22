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

## Backend dependency fixes applied (Phase 1, before any test could even collect)
10. **moto missing entirely** — `tests/conftest.py` does `from moto import mock_aws` but moto
    was never declared in `requirements.txt` or `requirements-dev.txt` in the first place (not
    a drift issue, just never added). Added `moto==5.0.28` to `requirements-dev.txt`
    (test-only dependency, used to mock AWS S3).
11. **requirements.txt drifted from pyproject.toml** — cross-checked every `[tool.poetry.
    dependencies]` entry in `pyproject.toml` against `requirements.txt` and found 4 packages
    declared in pyproject.toml, actually imported in `src/` (`slowapi` in `src/main.py`;
    `qrcode`/`python-barcode` in `src/services/credential_service.py`; `python-pptx` in
    `src/services/certificate_service.py`), but missing from `requirements.txt` — so
    `src/main.py` itself couldn't even be imported (`ModuleNotFoundError: No module named
    'slowapi'`), which broke test collection entirely (conftest imports `src.main.app`).
    Added `python-pptx==1.0.2`, `qrcode==7.4.2`, `python-barcode==0.15.1`, `slowapi==0.1.10`
    plus their transitive deps (`limits`, `deprecated`, `wrapt`, `pypng`, `lxml`,
    `xlsxwriter`) to `requirements.txt` in the correct alphabetical spots, and bumped the
    existing `pillow` pin 10.4.0 → 12.3.0 (qrcode/python-barcode pulled in a newer pillow
    transitively; kept the file internally consistent rather than fighting the resolver).
    **If you hit another `ModuleNotFoundError` for a package that legitimately belongs**
    (i.e. really is used in `src/`), re-run the pyproject.toml-vs-requirements.txt
    cross-check script below rather than adding packages one error at a time — there may be
    more than one at once:
    ```python
    import re
    content = open('pyproject.toml').read()
    section = re.search(r'\[tool\.poetry\.dependencies\](.*?)\n\[', content, re.S).group(1)
    pkgs = [re.match(r'^([A-Za-z0-9_\-\.]+)\s*=', l.strip()).group(1).lower()
            for l in section.splitlines() if l.strip() and not l.strip().startswith('#')
            and re.match(r'^([A-Za-z0-9_\-\.]+)\s*=', l.strip())]
    req = open('requirements.txt').read().lower()
    missing = [p for p in pkgs if p != 'python' and p.replace('_','-') not in req and p not in req]
    print(missing)
    ```
    After adding any new package to `requirements.txt`, install with `pip install
    --ignore-installed -r requirements.txt -r requirements-dev.txt` (see the PyYAML note
    above for why `--ignore-installed` is required) and confirm no duplicate `==` entries:
    `python3 -c "names=[l.split('==')[0].lower() for l in open('requirements.txt') if '==' in l]; print(set(n for n in names if names.count(n)>1))"`.

## MAJOR FINDING: 16 of ~123 API routers are silently disabled at startup
`src/api/v1/__init__.py`'s `_include_optional_router()` wraps EVERY router import in a bare
`try/except Exception` that just does `logger.warning(...)` and moves on -- so a broken router
never fails app startup, it just silently vanishes from the API with no error anyone would
normally see. To see the full current list yourself:
```python
import logging; logging.basicConfig(level=logging.WARNING)
from src.api.v1 import api_router   # prints "Skipping router ..." for each broken one
```
This is **not test infrastructure work** — these are real, otherwise-fully-implemented
features (service + router + often a schema file already exist, hundreds of lines each) that
silently don't work at all in the running app because their SQLAlchemy model was never
written, or a shared dependency was imported from the wrong path. Treat this as its own
priority tier, above writing new unit tests for already-working modules (Phase 2) — there is
no point unit-testing routers that don't even mount.

### Fixed so far (7 of 16, +1 partial) — commits e005a27, 3eb9d7e, 4e0305c, a9fae6d
- `wellbeing` — trivial `NameError: Dict` (missing typing import).
- `chatbot` — imported `get_current_user` from nonexistent `src.api.deps`; real path is
  `src.dependencies.auth`.
- `ml_monitoring` — imported `get_db` from nonexistent `src.dependencies.database`; real path
  is `src.database`.
- `parent_roi` — `src/services/parent_roi_service.py` imported a class `Doubt` that was
  renamed to `DoubtPost`; also had to fix a real bug this exposed: it filtered
  `Doubt.student_id == child.id`, but `DoubtPost` only has `user_id` (FK to `users.id`) and
  `Student.id != Student.user_id` — corrected to `DoubtPost.user_id == child.user_id`.
- `college_planning` — **model file genuinely never existed**. Wrote
  `src/models/college_planning.py` (`CollegeVisit`, `CollegeApplication`,
  `ApplicationStatus`, `DecisionOutcome`) from `src/schemas/college_planning.py` (the
  authoritative field spec — Pydantic request/response models already existed) plus every
  field the ~290-line fully-implemented service actually reads/writes. Verified against
  real MySQL with `Base.metadata.tables[name].create(bind=engine, checkfirst=True)` before
  committing, then dropped the ad-hoc tables (`DROP TABLE IF EXISTS ...` in test_db).
- `institution_health` — same pattern as college_planning. Model needed 4 classes
  (`InstitutionHealthScore`, `InstitutionHealthAlert`, `InstitutionHealthHistory`,
  `ChurnPredictionModel` — the last one wasn't even in the router's own import line, only
  discovered once the service's own imports were checked) derived from
  `src/schemas/institution_health.py` + the ~970-line service.
- `document_vault` — `src/models/document_vault.py` already had 4 of 5 needed classes, just
  missing `DocumentFolder` (folder CRUD + self-referencing hierarchy). Added it.

### Partially fixed (1) — `ml_analytics`: one real bug fixed (dead imports removed), a
second, bigger one found and documented below but not yet fixed. See its row in the table.

### Still broken (9 of 16 fully, +1 partial) — diagnostic info gathered, NOT yet fixed
Use the exact same method for each: (1) find the service/router file that does
`from src.models.X import (...)` and read every class/field it actually constructs or
queries (`grep -n "ClassName("` and `"ClassName\."` in the consuming service file is the
fastest way), (2) check `src/schemas/X.py` if it exists — it's the authoritative Pydantic
field spec, response schemas especially, (3) write the SQLAlchemy model matching the
codebase's established conventions (see `src/models/parent_roi.py` or the two files above
for the house style: `id`, FK `institution_id`, `created_at`/`updated_at` via
`Column(DateTime, default=datetime.utcnow, ...)`, `Index(...)` in `__table_args__`), (4)
verify against real MySQL with the `Base.metadata.tables[...].create(bind=engine,
checkfirst=True)` snippet above BEFORE committing — a bad column definition (see the
Feedback model VARCHAR-length bug earlier in this file) won't show up just from Python
import succeeding, (5) drop the ad-hoc test tables, (6) re-run the "MAJOR FINDING" snippet
above to confirm the router no longer appears, (7) commit.

| Router | Missing/broken import | Schema file exists? | Notes |
|---|---|---|---|
| `institution_admin` `credentials` (both prefixes) | `No module named 'src.models.digital_credential'` (`DigitalCredential`, `CredentialShare`), from `src/api/v1/credentials.py` directly | No — derive purely from `src/api/v1/credentials.py` (455 lines) and `src/services/credential_service.py`. This is the one that backs the blockchain-credential feature from the feature survey; check `src/services/credential_service.py` for Hyperledger Fabric integration details, QR code fields etc. |
| `merchandise` | `src/services/merchandise_service.py` → `from src.models.merchandise import (...)` | Yes: `src/schemas/merchandise.py` | Printful integration feature; check the service for order/fulfillment status fields. |
| `journalism` | `src/api/v1/journalism.py` → `from src.models.journalism import (...)` directly (979 lines, largest remaining router) | Yes: `src/schemas/journalism.py` | Student newspaper module. |
| `learning_styles` | `src/services/learning_styles_service.py` → `from src.models.learning_styles import (...)` | Yes: `src/schemas/learning_styles.py` | 1218-line router — check if it needs multiple model classes for assessment results, adaptive content mapping etc. |
| `yearbook` | `src/api/v1/yearbook.py` → `from src.models.yearbook import (...)` directly (1155 lines) | Yes: `src/schemas/yearbook.py` | Digital yearbook builder — photos/memories/signatures/print orders per the earlier feature survey; likely needs several related model classes, not just one. |
| `parent_teacher_collab` | `src/api/v1/parent_teacher_collab.py` → `from src.models.collaboration import (...)` directly (1240 lines, largest remaining) | No — derive from the router + `src/services/` (check for a `collaboration_service.py` or similar) | |
| `ml_training` | `src/tasks/ml_training_tasks.py` → `from src.models.ml_training import MLTrainingJob, ModelPromotionLog, TrainingStatus, TrainingJobType` | Yes: `src/schemas/ml_training.py` | Imported via a Celery task file, not directly by the router — check `src/tasks/ml_training_tasks.py` too, not just the router/service. |
| `super_admin_reports` | `src/api/v1/super_admin_reports.py` → `from src.models.super_admin_reports import ScheduledReport, DataRetentionPolicy, ArchivalJob` directly (802 lines) | Yes: `src/schemas/super_admin_reports.py` | |
| `virtual_classrooms` | `src/services/virtual_classroom_service.py` → `from src.models.virtual_classroom import (...)` | No — derive from the router (655 lines) + service. This backs Agora video conferencing per the feature survey; check for session/participant/recording fields. | |
| `ml_analytics` (bigger than it looked, partially fixed) | Chain: `ml_analytics.py` → `ml_analytics_integration_service.py` → `analytics_service.py`. Two layers, both now diagnosed: (1) DONE — `analytics_service.py` imported 4 classes from `src.models.analytics` (`AnalyticsCache`, `StudentPerformanceMetrics`, `ClassPerformanceMetrics`, `InstitutionPerformanceMetrics`) that were genuinely **dead/unused** (grep confirmed zero other references in the 1227-line file) — removed the import, don't re-add these. (2) NOT DONE — the next line imports 11 classes from `src.schemas.analytics` (`AnalyticsQueryParams`, `StudentMetrics`, `ClassMetrics`, `InstitutionMetrics`, `ExamAnalytics`, `SubjectPerformance`, `YoYComparison`, `StudentPerformanceComparison`, `DateRangeType`, `MetricType`, `StudentPerformanceTrend`) that ARE genuinely used throughout (usage counts: 10, 4, 4, 4, 4, 3, 3, 3, 11, 1, 3 respectively — `grep -c "\bClassName\b" src/services/analytics_service.py` to re-verify). **The existing `src/schemas/analytics.py` is for a different, unrelated feature** (event-tracking: `AnalyticsEventCreate`/`PerformanceMetricCreate`/`UserSessionCreate`/`FeatureUsageCreate` — these match `src/models/analytics.py`'s actual classes, `AnalyticsEvent`/`PerformanceMetric`/`UserSession`/`FeatureUsage`). `analytics_service.py` is genuinely a different feature (academic performance analytics: student/class/institution metrics, exam analytics, YoY comparisons — check its model imports at the top, Student/Exam/Attendance/Assignment/Grade) that needs its OWN schema classes, either in a new file (e.g. `src/schemas/academic_analytics.py`, then repoint the import) or appended to the existing file if you'd rather not split it — read through all 1227 lines of `analytics_service.py` to extract exact field usage per class (same method as the model fixes above, just for Pydantic schemas instead of SQLAlchemy models, which is arguably easier since there's no MySQL column-type gotcha to verify against). | schemas/analytics.py exists but is NOT the right one — see above | This is the most involved of the remaining routers content-wise (11 classes, largest service file of the bunch) even though its *router* file itself is small — don't let the small router file size mislead you like it misled the initial triage. |

**Recommended order for next iteration**: finish `ml_analytics` first (the schema-file work is
now fully scoped, just needs doing), then the ones with schema files (`merchandise`,
`journalism`, `learning_styles`, `yearbook`, `ml_training`, `super_admin_reports`) since the
schema gives the field spec for free, then the three with no schema file
(`credentials`/digital_credential, `parent_teacher_collab`/collaboration,
`virtual_classrooms`/virtual_classroom) last since those need more reading of router+service
code to reverse-engineer the fields.

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
Frontend Phase 1 is complete (337/337) — do not re-investigate it, just spot-check with a
full `npx vitest run` if picking this up much later.

Backend: deps install correctly now (`pip install --ignore-installed -r requirements.txt -r
requirements-dev.txt`, verified with `python3 -c "import fastapi, sqlalchemy, pytest, redis,
celery"`). **Priority order for backend work, in this order**:
1. **Finish the silently-disabled-routers fix** (see the "MAJOR FINDING" section above) —
   10 of 16 remain, all diagnosed with exact missing classes/fields already identified, no
   re-investigation needed, just implementation. Start with `document_vault` and
   `ml_analytics` (single-class additions to existing model files, smallest diffs), work down
   the table there in the recommended order. After each fix: verify with the Python snippet
   in that section, verify the new table(s) actually `CREATE` against real MySQL before
   committing, drop the ad-hoc tables, commit+push individually or in small batches.
2. Once all 16 (or as many as reasonably tractable) routers are fixed, re-run the full
   backend `pytest` suite (`cd /home/user/eduApp && python3 -m pytest --no-cov -p
   no:cacheprovider -q -n auto` — use `--no-cov` for speed while iterating, the real coverage
   gate can run once things are green) for an updated baseline — the earlier baseline (90
   errors, capped at "stopping after 10 failures") was taken BEFORE the Feedback model fix,
   the httpx pin fix, and any of the router fixes, so it's stale. Expect a very different,
   hopefully much smaller failure count now.
3. Fix whatever that baseline reveals using the same investigate-root-cause-don't-paper-over
   approach used throughout this file. Known already-fixed items you don't need to
   re-diagnose: the Feedback model VARCHAR bug, the httpx/starlette TestClient
   incompatibility, the moto/slowapi/qrcode/python-barcode/python-pptx missing deps.
4. Only after backend Phase 1 is green (or remaining failures are understood/triaged) move to
   Phase 2 (new test coverage for the 108 backend route modules and ~210 frontend pages that
   currently have zero dedicated tests — see checklists above). Note the route-module count
   there may need revisiting once routers gain their missing models — some of Tier 1/2's
   "no test yet" modules are among the 16 that were completely non-functional until this
   session, so "no test" previously also meant "nothing to test."
