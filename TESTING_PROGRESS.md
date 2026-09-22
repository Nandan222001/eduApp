# End-to-End Unit Testing Progress

Tracks the ongoing task: "unit test all components, frontend to backend, fix anything broken."
This file is the single source of truth across loop iterations/sessions — always read it first,
update it before stopping, and commit+push every iteration so work is never lost.

## ⚠️ CRITICAL FINDING, FIXED — flag this to the user, don't just bury it in the log
Commit 54433b3: `create_access_token`/`create_refresh_token` (`src/utils/security.py`) encoded
the JWT `sub` claim as a raw Python `int` (`user.id`), but `python-jose`'s `jwt.decode` requires
`sub` to be a string per RFC 7519 and raises `JWTClaimsError` otherwise. `decode_token` swallows
that into a silent `None`. **This meant `get_current_user` — the auth dependency behind nearly
every protected API endpoint — would reject every real, validly-issued token, and refresh
tokens could never be redeemed.** This was not a test-only bug; it looks like it would break
real login/session behavior for actual users in any deployed instance of this backend before
this fix. Already fixed and pushed, but this is exactly the kind of thing to surface to a human
explicitly rather than just noting in a commit message, in case it needs backporting somewhere
this branch hasn't reached yet, or explains a previously-reported "can't stay logged in" issue.

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

## Backend test-suite mechanics fixed (Phase 1, second pass) — commits eb92c35
through b42c3b8
After the router fixes above, the actual `pytest` run itself was blocked by a chain of
independent bugs, each cascading through most of the suite until fixed one at a time. In
order found/fixed:
1. `Feedback.user_id` was `CHAR(36)` FK'd to `users.id`, but `User.id` is `Integer` -- MySQL
   rejects a FK between mismatched column types. Fixed `Feedback.user_id` to `Integer`
   (schema's `FeedbackResponse.user_id` too) -- `User.id` is `Integer` everywhere else in the
   codebase, so the Feedback model was the outlier, not User.
2. `tests/conftest.py`'s `institution` fixture passed 8 kwargs that aren't real `Institution`
   columns (and aren't referenced anywhere in `src/` either -- pure stale test data), AND was
   separately missing `logo_url`, which genuinely IS used by 2 services (incl.
   institution_health_service.py). Trimmed the fixture, added the real column.
3. `src/models/doubt.py` and `study_material.py` both had `Index(...)` directly on a JSON
   column (`tags`, `auto_generated_tags`) -- MySQL can't index JSON directly, only via a
   generated column on a specific path. Removed those indexes.
   **After these three, `Base.metadata.create_all()` succeeds for every model in the
   codebase against real MySQL for the first time this session** -- verify this still holds
   with the snippet in the "MAJOR FINDING" section above before assuming it's still true.
4. All 4 Role fixtures (`admin_role`/`teacher_role`/`student_role`/`parent_role`) never set
   `slug`, which is `nullable=False` -- added slugs.
5. Running under `-n auto` (pytest-xdist), `tests/conftest.py`'s `db_session` fixture called
   `Base.metadata.create_all` on EVERY test, and many parallel workers hit MySQL's DDL
   concurrently ("Table was skipped since its definition is being modified by concurrent DDL
   statement"). Fixed with the standard pytest-xdist pattern: a session-scoped autouse
   fixture using a cross-worker `FileLock` (already an installed transitive dep) + sentinel
   file so schema creation runs exactly once total, not once per test.
6. Real deadlocks (MySQL error 1213), not just the DDL race above: the `institution` fixture
   used a hardcoded, unique-constrained `name`/`slug` ("Test School"/"test-school"), so
   concurrent xdist workers' uncommitted INSERTs of the identical value contended for the
   same index gap lock. Now generates a random suffix per call.
7. A **static AST scan** (parse every model's real columns, check every `ModelName(...)`
   call across `tests/` against them) found the same handful of stale/renamed fields repeated
   across ~18 test files: `Institution` (8 bogus kwargs), `Student` (`academic_year_id` bogus,
   `date_of_admission` should be `admission_date`), `Teacher` (`date_of_joining` should be
   `joining_date`), `Subject` (`grade_id` bogus -- relates via `GradeSubject` association, not
   a direct FK), `Attendance` (`period` bogus, unused anywhere in `src/` too), `Assignment`
   (`total_marks` should be `max_marks` -- NOTE `total_marks` IS real on Exam/Quiz/
   previous_year_papers models, so don't blanket-rename it codebase-wide, only within
   `Assignment(...)` calls). **If you add new fixtures or test data, re-run this scan
   pattern before assuming a model's field names** -- it's cheap and catches this whole class
   of bug in one pass instead of one pytest run at a time:
   ```python
   # Walks src/models/*.py to collect each class's real column names (any class-level
   # assignment, so also matches relationships etc., not just Column() -- deliberately
   # loose so it doesn't miss anything), then walks tests/**/*.py for ModelName(kwarg=...)
   # calls and reports any kwarg not in that set. See git log commit b42c3b8 for the
   # exact script if you need the AST-boundary-precise auto-fix version too.
   ```
8. **NOT fixed, needs a real decision**: `tests/test_api_subscriptions.py` constructs a
   `SubscriptionPlan` model that doesn't exist anywhere in `src/models/` -- `Subscription`
   only has a plain `plan_name` string column, no FK to a plans table. This is either (a) a
   genuinely missing model (build `SubscriptionPlan` + a `plan_id` FK column on
   `Subscription`, migrate `plan_name` data), or (b) the whole test file needs rewriting to
   match the simpler plan_name-string design. Given `subscription_service.py` and the
   `subscriptions` API were both working (not in the disabled-routers list) using just
   `plan_name`, (b) — rewriting the test — is probably right, but read
   `src/services/subscription_service.py`'s actual plan-handling logic first to be sure
   before picking either path.

## Backend fixes, third pass — commits f3d1166, and the critical one, 54433b3
9. **CRITICAL, not just a test bug** — see the flagged section at the top of this file.
   `create_access_token`/`create_refresh_token` encoded `sub` as a raw int; python-jose
   requires it to be a string and silently fails to decode otherwise. This broke
   `get_current_user` (used by nearly every protected endpoint) for ALL real tokens, not just
   in tests. Fixed at the source (coerce to str on encode, back to int at the 4 read sites
   that need int semantics).
10. `mock_session_manager` fixture returned a real `SessionManager(mock_redis)` instance, not
    a Mock -- `.assert_called_once()` etc. failed with `AttributeError` regardless of #9.
    Switched to `create_autospec(SessionManager, instance=True)`.
11. The `client` fixture's mocked redis was a plain `AsyncMock` with fixed return values
    (`exists()` always `False`, `get()` always `None`) -- broke any flow needing real
    cross-call state within one test (login stores a refresh token, a later call checks it
    exists). Replaced with `fakeredis.FakeAsyncRedis`, a real in-memory implementation of the
    `redis.asyncio.Redis` interface (added `fakeredis` to `requirements-dev.txt`).
12. `auth_headers` fixture hand-crafted a JWT instead of logging in through the API, so no
    session existed for it in the fake Redis -- `get_current_user` requires both a valid JWT
    AND an active session by design, so this fixture 401'd on every protected endpoint
    regardless of #9/#10/#11. Now does a real `client.post("/api/v1/auth/login")`. Used by
    ~18 test files.
13. `assignment_service.py`'s `grade_submission` computed a late penalty as
    `(float_percentage / 100) * Decimal_marks`, which Python rejects outright. Fixed to
    convert marks to float first (matching the very next line's existing round-trip back to
    Decimal via `Decimal(str(...))`).

Baseline right before this pass's fixes (full suite, first 10-ish failures only, maxfail
cuts it short): 80 passed / 12 failed / 5 errors. Expect a MUCH better number after #9-13,
especially #9/#11/#12 since those unblock essentially every auth-gated integration test, not
just the ones already checked. **A full run with `--maxfail=1000` (overriding pytest.ini's
default `--maxfail=10`) was kicked off right as this checkpoint was written — check
`/tmp/claude-0/.../tasks/` background output or just re-run it fresh if picking this up
later; don't trust the "80/12/5" numbers above once that lands, they're pre-fix.**

## Next resume point (read this first if picking up mid-backend-Phase-1)
1. Check whether the full, uncapped pytest run mentioned just above finished; if so, read its
   actual pass/fail/error counts and the specific failures rather than assuming anything from
   this file. If it didn't finish or wasn't captured, just re-run:
   `mysql -u root -ptest_password -e "DROP DATABASE IF EXISTS test_db; CREATE DATABASE test_db CHARACTER SET utf8mb4;"`
   `rm -f /tmp/eduapp_schema.lock /tmp/eduapp_schema.done`
   `cd /home/user/eduApp && python3 -m pytest --no-cov -p no:cacheprovider -q -n auto --maxfail=1000`
   (always reset test_db and the schema-lock sentinel files first -- stale state from a
   previous run/session causes confusing unrelated-looking failures)
2. Keep fixing what it reveals using the same approach used throughout this file: find the
   REAL root cause (don't paper over symptoms), prefer fixes that address the actual bug over
   ones that just make a test pass, batch related fixes into one commit, verify before
   committing (re-run the specific failing test(s), and for schema changes verify against
   real MySQL per the pattern used for the router model fixes), update this file's log.
3. Once the backend suite is green (or remaining failures are individually understood/
   triaged as out of reasonable scope), finish the remaining 9 silently-disabled routers (see
   the router table above) -- these are real missing features, worth finishing even after
   Phase 1 testing work is "done," since they were discovered as a side effect of this task.
4. Only after that, move to Phase 2: writing new test coverage for backend route modules and
   frontend pages that currently have none (see the checklists earlier in this file). Given
   the scale (108 backend modules + ~210 frontend pages), this phase alone could run for many
   more iterations -- pick a reasonable batch size per iteration (e.g. one feature area's
   worth) rather than trying to do it all at once, and keep committing/pushing incrementally
   as already established throughout this session.

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

## Backend fixes, fourth pass — commits pending (test_carpool_service.py: 0/10 → 10/10)
Baseline before this pass: full uncapped run was 471 passed / 255 failed / 60 errors / 1
skipped. Picked `tests/test_carpool_service.py` as the next individual file to fully green
(was 3/10 → 5/10 → 8/10 → 10/10 across fixture fixes):
14. Fixture `db: Session` params didn't match the actual fixture name `db_session` — renamed
    throughout the file (`sed -i 's/\bdb\b/db_session/g'`, verified via diff).
15. `sample_parent`/`sample_request`/`sample_requests`/`sample_group` fixtures used hardcoded
    `institution_id=1`/`parent_id=1` disconnected from any real row, causing FK violations
    against the real `institution` fixture. Rewired all of them to depend on the real
    `institution` and `sample_parent` fixtures and to self-persist (`db_session.add()` +
    `.commit()`), instead of relying on individual tests to add them.
16. **Real bug in `src/services/carpool_service.py`'s `create_ride_schedule`** — the afternoon
    return-trip `CarpoolRide` read a `'drop_time'` key out of each `pickup_points` entry, but
    `pickup_points` entries only ever carry a `'pickup_time'` key (see the `CarpoolGroup`
    schema/fixtures) — `'drop_time'` never exists, so `.get('drop_time')` was always `None`.
    `pickup_time` is `nullable=False` on `CarpoolRide`, so every afternoon-ride row (and any
    schedule spanning a matching weekday) hit `IntegrityError: Column 'pickup_time' cannot be
    null` in real usage, not just in tests. Fixed to fall back to `'pickup_time'` when
    `'drop_time'` isn't present: `pickup_sequence[-1].get('drop_time') or
    pickup_sequence[-1].get('pickup_time')` (and symmetrically for `drop_time`).
17. `test_find_compatible_carpools` reused `sample_request`, which (after fix #15) shares the
    same `sample_parent` as `sample_group`'s only member/organizer. `find_compatible_carpools`
    correctly skips a group the requesting parent already belongs to (`continue` on
    `request.parent_id in [m.get('parent_id') for m in group.members]`), so the group was
    always filtered out and `matches` was always empty — a test fixture-data bug, not a service
    bug (verified `calculate_route_compatibility` alone does return a positive score for this
    exact institution/group/route data via `test_calculate_route_compatibility_group`, which
    passes). Fixed by giving this test its own distinct parent + request instead of reusing the
    shared `sample_parent`/`sample_request`.

`tests/test_carpool_service.py` is now 10/10 passing. Not yet re-run against the full suite.

## Backend fixes, fifth pass — commits pending (many collection-error files unblocked + real bugs found)
Baseline before this pass (full uncapped run): 483 passed / 260 failed / 43 errors / 1 skipped.
Worked through several whole-file collection ERRORs and the failures they unblocked, file by file
(same root-cause-first approach). All individually verified green with `-n0`; xdist (`-n auto`)
can show unrelated flakiness on files not touched here (e.g. test_auth.py's separate SQLite
setup racing MySQL-based workers) -- always re-check standalone before trusting a red result.

18. **Dead/wrong imports fixed** (unblocked whole files that couldn't even collect before):
    `tests/test_mobile_api_integration.py` (`src.models.parent` doesn't exist -> `Parent`/
    `StudentParent` actually live in `src.models.student`), `tests/unit/test_celery_tasks.py`
    (`AssignmentSubmission` -> the real class is `Submission`; `src.models.exam` -> the real
    module is `src.models.examination`), `tests/migration/test_mysql_comprehensive.py` (dead
    `DashboardMetric` import that doesn't exist in `src.models.analytics`).
19. **`websocket-client` was never in `requirements-dev.txt`**, so `tests/integration/
    test_websocket.py` (37 tests) couldn't even import. Added it. The file's tests gracefully
    `pytest.skip` when no live server is running, so this alone unblocked most of them --
    remaining real failures below (#25).
20. **22 test-local `Role(...)` constructions across 6 files were missing the required `slug`
    field** (same class of bug as the conftest fixture fix in an earlier pass, just reproduced
    ad-hoc): `test_mobile_api_complete_flow.py`, `test_mobile_api_integration.py`,
    `test_parent_multi_child.py`, `migration/test_api_endpoints_mysql.py`,
    `migration/test_mysql_comprehensive.py`. Fixed via a small script deriving
    `slug=name.lower().replace(' ', '_')`.
21. **~26 hand-crafted `create_access_token(...)` calls, across `test_mobile_api_integration.py`
    (20), `test_parent_multi_child.py` (4), and `tests/integration/test_parents_api.py`'s
    `parent_auth_headers` fixture + 1 inline call** -- same root cause as the `auth_headers`
    fixture fix from an earlier pass, just reproduced ad-hoc in these files instead of using
    the shared fixture: a hand-crafted JWT has no matching session in the fake Redis, so
    `get_current_user` 401s regardless of token validity. Replaced with a real
    `client.post("/api/v1/auth/login", ...)` call (all these users share the conftest-standard
    "password123").
22. **CRITICAL, real production bug** -- `exponent-server-sdk` (the Expo push notification SDK)
    was never installed/declared as a dependency. `ExpoPushService.validate_token` silently
    degrades to always returning `False` when the SDK import fails, so **every real device
    registration for push notifications (`POST /api/v1/notifications/register-device`) was
    failing with 400 "Invalid Expo push token" in any environment without this package** --
    not a test-only issue. Added `exponent-server-sdk==2.2.0` to `requirements.txt`.
23. **Real routing bug** in `src/api/v1/notifications.py`: `GET /{notification_id}` (int path
    param) was registered before `GET /devices`, and FastAPI/Starlette matches GET routes in
    registration order -- so `GET /api/v1/notifications/devices` was always being captured by
    the `/{notification_id}` route first, failing int conversion on `"devices"` and returning
    422 instead of ever reaching the real handler. Moved `get_user_devices` before the
    parameterized route (standard FastAPI convention: static routes before dynamic ones).
24. **CRITICAL, real production bug, widespread** -- `S3Client.upload_file(file_content, s3_key,
    content_type=None) -> str` (single return value, `s3_key` provided by the caller) was
    called with the WRONG, apparently-stale signature `upload_file(file_obj=..., file_name=...,
    folder=..., content_type=...)` unpacked as `file_url, s3_key = ...` in **9 call sites across
    6 service files**: `assignment_service.py` (x2 -- assignment files, submission files),
    `branded_media_service.py` (x2 -- notification sounds, animations), `branding_service.py`
    (x1 -- institution branding assets), `previous_year_papers_service.py` (x2 -- PDFs, question
    images), `homework_scanner_service.py` (x1), plus `document_vault_service.py` (x1, but that
    whole service is separately broken/unwired -- see the still-open document_vault item below).
    Every one of these would raise `TypeError: upload_file() got an unexpected keyword argument
    'folder'` the instant a real user tried to upload a file through any of these features. Fixed
    all 8 live call sites to build their own unique `s3_key` (via `uuid.uuid4()`) and call the
    real single-return signature. Updated the two stale test mocks in `tests/unit/
    test_assignment_service.py` that asserted against the old (wrong) call signature.
25. `study_buddy_service.py`'s `chat()` method returned `session_id=None` in its "AI not
    configured" fallback path when the caller didn't pass an existing `session_id` -- violates
    `StudyBuddyChatResponse.session_id: int` (required). Fixed to still create a session in the
    fallback path, matching the on-path behavior just above it.
26. `homework_scanner.py`'s `create_scan` route let a `ValueError` (e.g. "S3 is not configured
    properly" in an environment without AWS creds) propagate as an unhandled exception instead
    of a clean error response. Wrapped in try/except -> `HTTPException(500)`.
27. **Real authorization inconsistency/bug in `parent_service.py`** -- of 7 methods that check
    `_verify_parent_child_relationship` before returning a child's data, 2 (`get_recent_grades`,
    `get_pending_assignments`) silently returned `[]` (200 OK, empty list) instead of denying
    access when a parent queried a child that wasn't theirs, rather than a clean 403/404 like
    the other 5. Changed both to `raise ValueError(...)` (matching `get_weekly_progress`'s
    existing pattern), and added router-level `except ValueError -> HTTPException(403)` on the
    4 routes that call a raising method but had no handler at all before (`get_today_attendance`,
    `get_recent_grades`, `get_pending_assignments`, `get_weekly_progress` -- the last 3 previously
    let the ValueError crash out as an unhandled 500 with no clean response). Also added a
    missing `None` -> 404 check on `get_performance_comparison`'s route (previously would have
    failed FastAPI response-model validation with a 500 for the same "not my child" case).
    `get_child_goals` has the same latent issue (silently returns an empty-goals dict) but has
    no test coverage exercising it yet -- flagged here for whoever adds one next, not fixed now
    to keep this batch's diff reviewable.
28. **CRITICAL, real production bug, three call sites** -- `User.full_name` was referenced in
    live application code (`src/services/study_material_service.py`,
    `src/services/quiz_realtime_service.py` as a SQL column in a `.query(User.id, User.full_name,
    ...)`, and `src/api/v1/websocket.py`) but the `User` model has **no `full_name` attribute at
    all** (only `first_name`/`last_name`). Every one of these code paths would raise
    `AttributeError` the moment it actually ran -- `quiz_realtime_service.py`'s leaderboard query
    would fail to even build. Added a proper SQLAlchemy `hybrid_property full_name` to
    `src/models/user.py` (works both as `user.full_name` on an instance and as `User.full_name`
    inside a query, via `.expression`), computed from `first_name`/`last_name` with NULL-safe
    SQL concatenation.
29. `tests/unit/test_assignment_service.py`: 2 unrelated pre-existing failures found while
    verifying #24 didn't regress this file -- `test_create_assignment_with_due_dates` compared
    datetimes for exact equality across a MySQL round-trip (MySQL's `DATETIME` column has only
    second-level precision and *rounds*, doesn't truncate, so exact equality is never reliable);
    changed to `abs(actual - expected) < timedelta(seconds=1)`. `test_create_assignment_
    passing_marks_validation` expected the service's `create_assignment` to raise `HTTPException`
    for `passing_marks > max_marks`, but `AssignmentCreate` already has a `field_validator` that
    correctly rejects this at schema-construction time (a better fix, already in place) --
    updated the test to expect `pydantic.ValidationError` from schema construction instead.
30. `tests/test_services_assignment.py` (a separate, smaller/older duplicate of `tests/unit/
    test_assignment_service.py`): stale field name `assignment.total_marks` (real column is
    `max_marks`) and stale enum member `AssignmentStatus.ACTIVE` (real enum is
    DRAFT/PUBLISHED/CLOSED/ARCHIVED; a freshly-created assignment defaults to DRAFT, not
    "active").

Verified individually green with `-n0`: test_mobile_api_integration.py (21/21),
test_mobile_api_complete_flow.py (3/3), test_parent_multi_child.py (4/4),
tests/integration/test_websocket.py (27 passed/10 skipped, 0 failed),
tests/unit/test_assignment_service.py (27/27), tests/test_services_assignment.py (4/4),
tests/integration/test_parents_api.py (19/19), tests/test_carpool_service.py (10/10, from the
prior pass, re-verified still green).

**Still failing, NOT yet fixed** (found while verifying the above, unrelated to this batch's
changes -- confirmed pre-existing via standalone `-n0` runs): `tests/unit/test_celery_tasks.py`
has 10 failures (`TestNotificationSendingTasks`, `TestScheduledTasks`,
`TestSubscriptionRenewalReminders`, `TestTaskChaining`, `TestExternalServiceMocking` ::
`test_sendgrid_api_mocked` -- e.g. `Error sending email: HTTP Error 401: Unauthorized`, `result
is True` assertions failing) -- not yet root-caused, next in line. `tests/migration/
test_mysql_comprehensive.py` needs its own separate MySQL database (`test_mysql_migration`) and
real `alembic upgrade head` -- heavier standalone infra, lower priority than the main suite.

## Backend fixes, sixth pass — commits pending (tests/unit/test_celery_tasks.py: 21/31 → 31/31)
Picked up exactly where the fifth pass left off. All 10 pre-existing `test_celery_tasks.py`
failures root-caused and fixed:

31. `test_sendgrid_api_mocked` patched `sendgrid.SendGridAPIClient` (the origin module), but
    `src/services/notification_providers.py` does `from sendgrid import SendGridAPIClient` at
    import time, binding its own name in its own module namespace -- patching the origin
    module after that import doesn't affect the already-bound reference. Classic
    patch-the-wrong-namespace bug. Fixed to patch
    `src.services.notification_providers.SendGridAPIClient`.
32. `test_send_expo_push_notification_success` / `test_send_bulk_notifications_success` /
    `test_bulk_notification_chain`: constructed `NotificationDevice`/`User` rows missing
    required NOT-NULL columns (`role`, `platform` on `NotificationDevice`; `role_id` on `User`,
    ForeignKey to `roles.id`). Added them (using the existing `student_role` fixture for the
    `User` rows).
33. `test_process_grouped_notifications` / `test_grouped_notification_chain`: set
    `grouped_with_id=1`, a hardcoded FK to a `Notification.id` that never existed --
    `notifications_ibfk_3` FK violation. Fixed by creating a real parent `Notification` row
    first and using its actual `.id`.
34. `test_send_scheduled_announcements`: constructed `Announcement` rows missing 3 required
    NOT-NULL columns (`created_by` FK to `users.id`, `audience_type`, `channels`). Added them.
35. **Real app bug** in `src/tasks/notification_tasks.py`'s `retry_failed_notifications`:
    `notification.data["retry_count"] = retry_count + 1` mutates a plain (non-`Mutable`-wrapped)
    JSON column's dict **in place**, which SQLAlchemy's change-tracking never detects for a bare
    `Column(JSON)` -- so the increment silently never persisted to the database. Every fresh
    query re-read the same stale `retry_count`, meaning **failed notifications could retry
    forever, never actually respecting `max_retries`**, since the persisted counter never grew.
    Fixed to reassign the whole dict (`notification.data = {**(notification.data or {}),
    "retry_count": retry_count + 1}`), which SQLAlchemy always detects as a change on plain
    attribute reassignment regardless of mutability tracking.
36. **Real app bug** in `src/utils/subscription_tasks.py`'s `process_renewal_reminders`:
    `days_until_renewal = (subscription.next_billing_date - datetime.utcnow()).days` subtracts
    full timestamps and floors, so it under-reports by one day whenever `datetime.utcnow()`'s
    time-of-day is later than `next_billing_date`'s (which is true almost always in practice,
    since a scheduled task doesn't fire at the exact same wall-clock instant `next_billing_date`
    was computed) -- a subscription due in exactly 7 days would compute `days_until_renewal ==
    6`. This would make the 7-day/3-day renewal reminder emails fire with the wrong "N days"
    label, or on the wrong day entirely, in real production use. Fixed to compare calendar
    dates (`.date()` on both sides) instead of exact timestamps, which is what "N days until
    renewal" actually means for a reminder feature.

`tests/unit/test_celery_tasks.py` is now 31/31 passing (verified `-n0` and `-n auto`). Also
re-verified the whole set of files touched across passes five and six together, both
sequentially and under `-n auto`: 146 passed, 10 skipped (the skips are the
`test_websocket.py` tests that intentionally skip without a live server), 0 failed.

## Backend fixes, seventh pass — commits pending (fixed the `metadata`/`metadata_json` bug class at scale + subscriptions/webhooks)
Baseline before this pass: full uncapped run was 579 passed / 218 failed / 40 errors / 11 skipped
(up from 483/260/43/1 — the fifth/sixth pass fixes already helped broadly). Only 2 whole-file
collection errors remained project-wide at this point (`test_api_subscriptions.py`,
`test_document_vault.py` — see below).

37. `tests/test_external_services_integration.py` (18 tests, all erroring): the test file
    imports `MockSendGridClient`/`MockRazorpayClient`/`MockS3Client`/`MockRedisClient` **classes**
    from `tests/test_mocks.py`, but the actual pytest **fixtures** wrapping them
    (`mock_sendgrid_client`, `mock_razorpay_client`, `mock_s3_client`, `mock_redis_client`,
    also defined in `test_mocks.py`) were never visible to pytest -- fixtures aren't shared
    across sibling test modules, only via `conftest.py`. Re-exported the 4 fixtures by importing
    them into `conftest.py`. This alone took the file from 0/18 to 16/18.
38. **Real, previously-undiscovered missing dependency**: `razorpay` (the payment gateway SDK)
    was never in `requirements.txt` at all, despite being imported by `src/api/v1/merchandise.py`
    and needed by `test_razorpay_payment_flow`/`test_payment_with_notification`. Added
    `razorpay==2.0.1`.
39. `test_payment_with_notification` referenced `subscription.institution.email`, a field that
    doesn't exist on the `Institution` model (only `name`/`slug`/`domain`/`address`/`phone`/
    `logo_url`) and isn't referenced anywhere in real app code either -- test-only bug, fixed to
    use a literal email address (this test only exercises Mail-object construction, not real
    field validation). `tests/test_external_services_integration.py` is now 18/18.
40. **`tests/test_api_subscriptions.py` fully rewritten** (the "needs a design decision" item
    flagged in earlier passes) -- it referenced a `SubscriptionPlan` DB model + `plan_id` FK that
    never existed anywhere in the app; the real design is a denormalized `plan_name` string
    column on `Subscription` plus an in-code plan catalog (`SubscriptionPlans` in
    `subscription_service.py`, served via `GET /api/v1/subscriptions/plans`). Rewrote the whole
    file against the real, already-implemented API (the same design `tests/integration/
    test_subscriptions_api.py` already exercises successfully) instead of inventing a new model.
    This was the last real collection blocker for `SubscriptionPlan`.
41. **CRITICAL, real bug class found at scale, 14 instances across 8 files** — `metadata` is
    reserved by SQLAlchemy's Declarative base for the `MetaData` object, so every one of the
    ~50 models in this codebase that needs a JSON/text metadata column maps it as
    `metadata_json = Column('metadata', JSON, ...)` specifically to avoid the collision (there's
    even a comment saying so on several models). Despite that, plenty of call sites still wrote
    `SomeModel(..., metadata=value)` or `obj.metadata = value` / `obj.metadata['key'] = value` --
    which doesn't error, it just silently shadows the class attribute at the instance level
    (`obj.metadata` starts returning your dict back), while the real `metadata_json` column
    **never gets the value and is never persisted**. Found via the same static-audit technique
    used earlier for stale field names: listed every pydantic schema with a `metadata:` field via
    AST, then manually verified each live (non-disabled-router) call site against its target
    model. Fixed all confirmed-live instances:
    - `gamification_service.py` (`award_badge`, `add_points`): `UserBadge`/`PointHistory`
      constructor calls -- awarding a badge or adding points with metadata silently lost it.
    - `src/api/v1/community_service.py` (verify/reject activity): worse than silent here --
      `if not activity.metadata: activity.metadata = {}` is always False (a `MetaData` object is
      truthy), so `activity.metadata['x'] = y` hits `TypeError: 'MetaData' object does not
      support item assignment` -- these two endpoints were an unconditional 500 whenever a
      verifier left comments or a rejection reason was given.
    - `src/services/study_planner_service.py` (`reschedule_task`) +
      `src/repositories/study_planner_repository.py` (`update_task`'s generic
      `setattr(task, field, value)` loop): `**(task.metadata or {})` on a `MetaData` object
      raises `TypeError` (not iterable via `**`) -- rescheduling a task with existing metadata
      always crashed; the generic update loop) silently dropped metadata for any partial update.
    - `src/services/homework_scanner_service.py` (`create_scan`): metadata silently lost.
    - `src/api/v1/finance_education.py` (wallet transaction creation, investment simulation x2):
      metadata silently lost on 3 separate endpoints.
    - `src/services/wellbeing_service.py` (2 alert-creation sites): metadata silently lost.
    - `src/services/subscription_service.py` (`cancel_subscription`, `update_subscription`):
      `cancel_subscription` called `json.loads(subscription.metadata)` -- `TypeError: the JSON
      object must be str, bytes or bytearray, not MetaData` -- **cancelling a subscription with
      a reason was an unconditional 500** in real use, not just a test gap. `update_subscription`
      had the same generic-setattr-loop silent-drop issue.
    All fixed by writing to `metadata_json` instead of `metadata` at each site (constructor
    kwarg rename, or an `if field == 'metadata': obj.metadata_json = value` branch added to each
    generic setattr-loop). Left unfixed (dead/unreachable code, part of the still-disabled
    routers): `document_vault_service.py`, `virtual_classroom_service.py` -- no point fixing
    call sites in code nothing can currently reach.
42. **Same bug, one level up**: response schemas with `from_attributes=True` (`SubscriptionResponse`,
    `PaymentResponse`, `InvoiceResponse`, `UsageRecordResponse` in `src/schemas/subscription.py`)
    declared a plain `metadata: Optional[str] = None` field -- `model_validate(orm_instance)`
    reads attributes by field name, so it read the reserved `MetaData` object too, and
    `pydantic.ValidationError: Input should be a valid string` on **every single subscription /
    payment / invoice / usage-record API response** that went through serialization. This was
    the single highest-impact bug found this pass -- essentially the whole subscriptions/billing
    API surface was down. Fixed by adding `validation_alias='metadata_json',
    serialization_alias='metadata'` to the field on all 4 response schemas, so the JSON API
    contract (`"metadata"` key) is unchanged for clients while reading from the correct column.
    (Did NOT apply this to `SubscriptionUpdate`, which is a request/input schema parsed from
    client JSON, not from an ORM instance -- that one correctly stays a plain `metadata` field;
    the service layer already maps it to `metadata_json` manually per #41.)
43. **Real bug, unrelated to the metadata class** — `src/api/v1/webhooks.py`'s
    `handle_payment_captured` (the Razorpay `payment.captured` webhook handler) had
    `service.db.query(service.db.query(service.db.models.Payment))...` and
    `payment.paid_at = service.db.func.now()` -- `Session` has neither a `.models` nor a `.func`
    attribute, so this handler has apparently never actually run successfully; **every real
    "payment captured" webhook from Razorpay would 500**, meaning payments could get captured on
    Razorpay's side but never marked captured in this app, and their linked invoice never marked
    paid. Fixed to match the working pattern used by the other 5 webhook handlers in the same
    file (`from src.models.subscription import Payment; service.db.query(Payment)...`) and to use
    `datetime.utcnow()` for the timestamp.
44. Fixed several more pre-existing (unrelated to this pass's own changes, found while verifying
    them) test bugs while re-running the full subscriptions test surface: wrong JSON response key
    names (`"items"` vs the real `"subscriptions"`/`"invoices"`/`"payments"` keys) in
    `tests/test_api_subscriptions_integration.py`; `test_update_subscription_plan_and_billing`
    compared `subscription.price` to `updated.price` where both names reference the *same*
    identity-mapped ORM object post-update (always equal) -- captured the original price first;
    `SubscriptionPlans.get_plan_price` broke when called with actual `BillingCycle`/`PlanName`
    enum members (as several tests do) because an f-string on a `(str, Enum)` member renders as
    `"BillingCycle.MONTHLY"`, not its `.value` -- normalized to `.value` when given an `Enum`;
    `_generate_invoice_number` used a bare second-resolution `int(timestamp())`, which collides
    (unique-index `IntegrityError`) whenever two invoices are generated for the same institution
    within the same second -- added a short random suffix; two more MySQL-DATETIME-rounding test
    assertions (same class as pass five/six) using exact `<=`/`.days` comparisons across a real
    DB round-trip -- widened to a tolerance / calendar-date comparison.

Verified individually green with `-n0` and then together with `-n auto`: **181 passed, 0 failed**
across `test_api_subscriptions_integration.py`, `test_subscription_service.py`,
`unit/test_subscription_service.py`, `test_api_subscriptions.py`,
`integration/test_subscriptions_api.py`, `test_external_services_integration.py`,
`unit/test_celery_tasks.py`. Re-verified `test_mobile_api_integration.py` still 21/21 (touches
`homework_scanner_service.py`, also modified this pass). No dedicated test files exist yet for
`community_service.py`, `gamification_service.py`, `wellbeing_service.py`,
`finance_education.py`, or `study_planner_service.py` -- those fixes are verified by static
import/syntax checks only, not by a passing test suite; worth adding coverage for in Phase 2
given how serious the bugs found in them were.

**Collection errors remaining project-wide: down to 1** (`tests/test_document_vault.py` --
`document_vault_service.py` is dead/unwired code, see the note further down; everything else in
`tests/` now at least collects).

## Backend fixes, eighth pass — commits pending (test_students_api.py, test_teachers_api.py, test_security.py, test_api_assignments.py all fully green)
Baseline before this pass: full uncapped run was 625 passed / 195 failed / 21 errors / 11 skipped
(up from 579/218/40/11 -- the seventh pass's subscriptions fix plus systemic session fixes from
earlier passes kept paying off broadly even in untouched files).

45. `tests/integration/test_students_api.py` (27/29 → 29/29): same hand-crafted-JWT pattern as
    earlier passes, in this file's own `student_auth_headers`/`second_student_auth_headers`
    fixtures -- converted to real logins.
46. **Real bug** in `student_service.py`'s `get_student_dashboard`: `(assignment.due_date -
    today).days` subtracted a `datetime` (the real column type) from a `date` --
    `TypeError: unsupported operand type(s) for -: 'datetime.datetime' and 'datetime.date'` --
    the student dashboard crashed the instant a student had any upcoming assignment. Also
    `assignment.total_marks` (right next to it) doesn't exist on the model (real column is
    `max_marks`) -- same crash class either way. Fixed both.
47. **CRITICAL, real authorization bug** -- `GET /students/{id}/dashboard` and `GET /students/
    {id}/profile` only checked that the target student was in the caller's institution, never
    that a student-role caller was viewing *their own* record. **Any student could view any
    other student's dashboard/profile (grades, attendance, assignments) by ID.** Added a
    `current_user.student_profile.id != student_id` check (teachers/admins, who have no
    `student_profile`, are unaffected). Matches an identical, deliberate check already present
    on `GET /parents/children/{id}/overview` elsewhere in the codebase -- this was a gap, not a
    difference in intended design.
48. **Real authorization bug** in `GET /teachers/{teacher_id}` -- unrestricted to any
    authenticated user in the institution (confirmed via two independent tests in different
    files, `test_students_api.py` and `test_security.py`, both expecting 403/404 for a student
    caller) despite the frontend gating the only page that calls it
    (`users/teachers/:id` under `AdminLayout`) to `['admin', 'institution_admin']` -- the backend
    never enforced what the frontend assumed. Added `require_roles(current_user, ["admin",
    "institution_admin"])`. Same fix applied to `POST /teachers/` (create_teacher; a **student
    could create teacher accounts** with no restriction at all) and `PUT /institutions/{id}`
    (update_institution; any authenticated user in the institution, not just admins, could
    rename/modify institution settings).
49. **Real routing-shadow bug** (same class as #23 in the fifth pass): `GET /teachers/{teacher_id}`
    was registered before `GET /teachers/my-dashboard`, so `/my-dashboard` was always captured by
    the parameterized route first, failing int conversion on `"my-dashboard"` and 422'ing --
    **the teacher dashboard endpoint has never actually worked.** Reordered (static route before
    dynamic, matching the established FastAPI convention already applied in pass five).
50. **Real bugs, several, all in `teacher_service.py`'s `get_teacher_my_dashboard`** (unblocked
    the instant #49 let requests actually reach it): `Exam.exam_date` doesn't exist (real column
    is `start_date`); `Submission.score` doesn't exist (real column is `marks_obtained`), used at
    4 separate call sites in this one method; `Section.class_level` doesn't exist (the real
    relationship is `Section.grade`), used at 3 call sites; a genuine Python operator-precedence
    bug (`cls['class_name'] == x if y else z and ...` parses very differently than intended --
    added the missing parens). This whole dashboard method was apparently never exercised
    end-to-end before; fixed all of it in one pass since the same method needed all of them
    together to actually run.
51. **Real authorization bug** in `POST /submissions/{id}/grade` (`grade_submission`): checked
    that the caller was *a* teacher in the right institution, but never that they were the
    *assignment's own* teacher -- **any teacher could grade any other teacher's assignment
    submissions.** Added `assignment.teacher_id != teacher.id` check.
52. **Real bug**, same class as #24 (bare `response_model=list`/`dict` + returning raw ORM
    objects): `GET /teachers/{id}/subjects` (`response_model=list`) and `GET /assignments/`
    (`response_model=dict`, with raw `Assignment` objects nested in the `"items"` list) both hit
    `PydanticSerializationError: Unable to serialize unknown type` on any real request --
    **the assignment list endpoint was completely broken.** Fixed the subjects endpoint to use
    `response_model=List[SubjectResponse]`; fixed the assignments list endpoint to
    `AssignmentResponse.model_validate()` each item before returning (kept `response_model=dict`
    since the shape is `{items, total, skip, limit}`, not a bare list).
53. Several `PUT /submissions/{id}/grade` test calls should have been `POST` -- the real route
    (`src/api/v1/submissions.py`) has only ever been `@router.post(...)`; no `PUT` route for
    grading exists or ever did. Fixed 4 call sites in `test_teachers_api.py` to use `client.post`.
54. `tests/integration/test_security.py` (26/40 → 38/40): same hand-crafted-JWT pattern in this
    file's own 3 auth-header fixtures -- converted to real logins (took it from 26 to 35 passing
    alone). Plus the same 403-vs-401 (missing vs. invalid/expired token) test-expectation issue
    already fixed in earlier passes, appearing here too. Also one test patched a nonexistent
    `src.middleware.rate_limit.limiter.test` attribute with `unittest.mock.patch`, which errors
    immediately (`AttributeError`) rather than skipping -- the patch was decorative (the test body
    doesn't meaningfully use the mock and already ends in `assert True`), so removed it rather
    than inventing a real target to patch.
55. Stale `AssignmentStatus.ACTIVE` (5x) and `total_marks` (should be `max_marks`, 2x request/
    response spots) and one more 403-vs-401 case, in `tests/test_api_assignments.py` -- same
    patterns as elsewhere this session, fixed the same way. File went from 0/7 (didn't even
    collect cleanly before -- actually collected fine but every test failed) to 7/7.

**Two items found but deliberately NOT fixed this pass** (real gaps, but each is a genuine
design decision / feature-scope question, not a quick bug fix -- flagged rather than rushed):
- `tests/integration/test_security.py::test_student_cannot_access_subscription_endpoints` --
  the entire `src/api/v1/subscriptions.py` router has **no `get_current_user` dependency on any
  route** (confirmed while fixing the metadata bug in pass seven; `list_subscriptions` even takes
  `institution_id` as an optional query param rather than deriving it from the caller). Properly
  securing this means adding auth + role checks + deriving institution scope from `current_user`
  across the *whole* router, not just the one route this test happens to hit -- a real, scoped
  piece of follow-up work, not a one-line fix.
- `tests/integration/test_security.py::test_xss_in_student_name_fields` -- expects `<script>`
  tags to be stripped/escaped server-side on input. The codebase has no established
  server-side sanitization utility used anywhere for user text fields (only a narrow one in
  `chat_moderation_service.py`); this is a React SPA, where the standard, correct mitigation is
  output-side escaping (which JSX does automatically for text content, not `dangerouslySetInnerHTML`).
  Adding input sanitization here would be a new app-wide security policy decision, not a bug fix --
  flagged for a human call on which approach (input sanitization vs. verified output escaping)
  this app should standardize on, rather than picking one unilaterally.

Verified individually green with `-n0` and then together with `-n auto`: 175 passed / 2 failed
(the two flagged items above) / 1 xdist-only flake (re-verify standalone before trusting) across
`test_students_api.py`, `test_teachers_api.py`, `test_security.py`, `test_assignment_service.py`,
`test_services_assignment.py`, `test_api_assignments.py`, `test_parents_api.py`,
`test_mobile_api_integration.py`.

## Backend fixes, ninth pass — commits pending (attendance marking was completely broken; now fully green)
Baseline before this pass: full uncapped run was 702 passed / 119 failed / 20 errors / 11 skipped
(up from 625/195/21/11 -- the eighth pass's auth/routing/ownership fixes kept paying off broadly).

56. **CRITICAL, real production bug, core feature completely broken** --
    `attendance_repository.py`'s `get_student_attendance_stats` (and 3 near-identical sibling
    methods: `get_section_attendance_report`, `get_defaulters`, one more percentage calculation)
    computed `present_count = (result.present_days or 0) + (result.late_days or 0) * 0.5 + ...`.
    MySQL's `SUM(CASE ...)` comes back through pymysql as a `decimal.Decimal`, and Python
    refuses to mix `Decimal` with a bare float literal (`0.5`): `TypeError: unsupported operand
    type(s) for +: 'decimal.Decimal' and 'float'`. **`AttendanceService.create_attendance` calls
    this on every single call (via `_update_summary`/`_recalculate_summary`), so marking
    attendance for even one student -- arguably this app's single most core, highest-frequency
    action -- has apparently never worked.** Fixed all 4 call sites by converting each aggregate
    to `float(...)` before doing the arithmetic. `tests/unit/test_attendance_service.py` went
    from 17/39 to 39/39 the instant this landed -- 22 of its failures were this one root cause.
57. `tests/test_services_attendance.py` (1/4 → 4/4): `test_calculate_attendance_percentage` and
    `test_get_defaulters` both looped 10x constructing `Attendance` rows for the same student
    with the same hardcoded `date.today()` every iteration -- immediately violates the real
    `uq_student_date_subject_attendance` unique constraint (a student can only have one
    attendance record per subject per day, which is correct real-world behavior) on the 2nd
    insert. Varied the date per iteration (`date.today() - timedelta(days=i)`) and widened the
    query's date range to match, matching what the tests were actually trying to simulate ("10
    days of history"). `test_bulk_mark_attendance` used a schema field name that doesn't exist
    (`attendance_records`, real field is `attendances`) and asserted on response keys that don't
    exist either (`total_marked`/`successful`, real keys are `total`/`success`) -- fixed both.
    Also passed a hardcoded `marked_by_id=1` with no real `User` behind it, silently violating
    the FK constraint on `Attendance.marked_by_id` (caught internally by the service's own
    try/except per-item, so it silently counted as a failure rather than raising) -- used the
    real `admin_user` fixture's id instead.
58. `tests/unit/test_subscription_service.py::TestSuspendSubscription` (2 failures): same
    `.days`-floor-across-a-DB-round-trip class of bug fixed repeatedly in earlier passes,
    appearing again in two more tests in this file that weren't touched before. Same fix
    (compare `.date()` instead of exact timestamps).

Verified individually green with `-n0` and then together with `-n auto`: 125 passed, 0 failed,
across `test_attendance_service.py`, `test_services_attendance.py`, `test_subscription_service.py`,
`test_teachers_api.py` (re-verified as a spot-check, untouched this pass).

## Next resume point (current, supersedes the ones above)
1. Commit + push the ninth-pass changes above (#56-58) if not already done, and confirm the
   push succeeded (`git log --oneline -1`, `git status`).
2. Re-run the full uncapped backend suite for a fresh baseline (reset `test_db` and the
   schema-lock sentinels first, per the commands earlier in this file):
   `mysql -u root -ptest_password -e "DROP DATABASE IF EXISTS test_db; CREATE DATABASE test_db CHARACTER SET utf8mb4;"`
   `rm -f /tmp/eduapp_schema.lock /tmp/eduapp_schema.done`
   `cd /home/user/eduApp && python3 -m pytest --no-cov -p no:cacheprovider -q -n auto --maxfail=1000 2>&1 | tail -100`
   Compare against the 702/119/20/11 baseline noted at the top of the ninth pass above. Remaining
   known clusters to work through next (from the eighth-pass full-run tail, not yet triaged):
   `test_auth_service.py` (TestLogout x3, TestTokenSecurity, TestEdgeCases), `test_users.py` (3
   failures, one with a `KeyError: 'id'`), `test_auth_api.py` (register/refresh-token tests),
   `test_error_handling.py` (403/500 handling tests), `test_api_schema.py` (schema-completeness
   tests), `test_models.py::test_assignment_model`, `test_ml_api.py` (several). The
   `migration/`, `benchmark/`, and `test_performance_benchmarks.py` failures are lower priority
   (heavier standalone infra requirements, already noted in earlier passes).
   Compare against the 625/195/21/11 baseline noted at the top of the eighth pass above.
   Note: `-n auto` can show flaky/unrelated failures on files not touched this session
   (e.g. test_auth.py's separate SQLite setup racing MySQL-based workers under parallel
   execution) -- always re-verify red results standalone with `-n0` before trusting them.
4. Pick the next individual failing test FILE (not scattershot individual tests) and drive it
   to green the same way as the last several files were: read the file, run just that file
   (`-n0` for clean sequential output), fix fixtures/imports first (often the actual root cause
   — collection errors, stale field/enum names, missing deps), then real service-layer bugs the
   fixes newly expose, re-verify, commit each file/small-batch separately.
5. `document_vault_service.py` (and its test `tests/test_document_vault.py`) is a known, deeper
   case — investigated in this pass but not fixed: the router (`src/api/v1/document_vault.py`)
   does NOT use this service at all (imports only schemas that exist and work fine), so the
   service is dead/unwired code with its own broken imports (`DocumentType`, `ShareType`,
   `BulkUploadResult`, `DocumentFolderStructure`, `ExpiringDocumentAlert` -- none exist in
   `src/schemas/document_vault.py`) AND deeper field-name mismatches against the real schemas
   even after those are added (e.g. it constructs `DocumentUploadRequest` with `document_name=`/
   `shared_with=`/`metadata=` kwargs that don't exist on that schema). Decide when picked up:
   either finish wiring it into a real feature (bigger job, needs product-intent judgment on
   what the OCR/encryption/S3 vault feature should actually do), or explicitly mark it
   out-of-scope dead code in this file and move on -- don't half-fix it.
6. Once the backend suite is green (or remaining failures are individually understood/triaged
   as out of scope), finish the remaining 9 silently-disabled routers (see the "MAJOR FINDING"
   table above), then move to Phase 2 (new coverage for untested route modules/pages).
