# Troubleshooting Guide

Comprehensive troubleshooting guide for the Educational SaaS Platform covering common issues and their solutions.

## Table of Contents
1. [Application Issues](#application-issues)
2. [Database Issues](#database-issues)
3. [Authentication & Authorization](#authentication--authorization)
4. [API & Backend Issues](#api--backend-issues)
5. [Frontend Issues](#frontend-issues)
6. [Performance Issues](#performance-issues)
7. [Deployment Issues](#deployment-issues)
8. [Integration Issues](#integration-issues)
9. [Data Issues](#data-issues)
10. [Diagnostic Tools](#diagnostic-tools)

---

## 1. Application Issues

### Application Won't Start

**Symptom:** Server fails to start or crashes immediately

**Diagnostic Steps:**

```bash
# Check application logs
tail -f logs/app.log

# Or for Docker
docker logs edu-platform-backend

# Or for Kubernetes
kubectl logs -l app=edu-platform-backend --tail=100
```

**Common Causes & Solutions:**

**1. Port Already in Use**

```bash
# Find process using port 8000
lsof -i :8000
# Or on Windows
netstat -ano | findstr :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn src.main:app --port 8001
```

**2. Missing Environment Variables**

```bash
# Check if .env file exists
ls -la .env

# Verify required variables
cat .env | grep -E "DATABASE_URL|REDIS_URL|SECRET_KEY"

# If missing, copy from example
cp .env.example .env
# Then edit with your values
```

**3. Python/Poetry Issues**

```bash
# Verify Python version
python --version  # Should be 3.11+

# Reinstall dependencies
poetry install

# Clear cache
poetry cache clear . --all
rm -rf .venv
poetry install

# Check for conflicts
poetry check
```

**4. Database Connection Failed**

```bash
# Test database connection
mysql -h localhost -u username -p -e "SELECT 1;"

# If fails, check:
# - MySQL is running
docker ps | grep mysql
sudo systemctl status mysql

# - Credentials are correct in .env
# DATABASE_URL format: mysql+pymysql://user:password@host:port/database

# - Database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### Application Crashes Randomly

**Symptom:** Application runs but crashes unexpectedly

**Diagnostic Steps:**

```bash
# Check for memory issues
free -h
docker stats

# Check error logs
grep -i "error\|exception\|fatal" logs/app.log

# Check Sentry (if configured)
# Visit Sentry dashboard for error details
```

**Solutions:**

**1. Out of Memory**

```bash
# Increase container memory limits
# In docker-compose.yml:
services:
  backend:
    mem_limit: 2g

# Or adjust worker count
# In gunicorn/uvicorn config
workers: 2  # Reduce if memory limited
```

**2. Unhandled Exceptions**

```python
# Add global exception handler
# src/main.py
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

**3. Database Connection Pool Exhausted**

```python
# Increase pool size in config.py
DATABASE_POOL_SIZE = 20  # Increase from 5
DATABASE_MAX_OVERFLOW = 40  # Increase from 10
```

### Slow Application Response

**Symptom:** Application responds but very slowly

**Diagnostic Steps:**

```bash
# Check system resources
top
htop

# Check database queries
# Enable query logging
echo "log_statement = 'all'" >> postgresql.conf

# Check slow query log
tail -f /var/log/postgresql/postgresql-14-main.log | grep "duration"

# Profile requests
curl -w "@curl-format.txt" -o /dev/null -s https://api.yourplatform.com/api/v1/students
```

**Solutions:**

**1. Add Database Indexes**

```sql
-- Check existing indexes
SHOW INDEXES FROM students;
SHOW INDEXES FROM assignments;

-- Add indexes on frequently queried columns
CREATE INDEX idx_students_grade_section ON students(grade_id, section_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- Check index usage
SHOW INDEX FROM students;
```

**2. Enable Caching**

```python
# Use Redis cache for expensive queries
from src.redis_client import get_redis_client

async def get_students_cached(grade_id: int):
    cache_key = f"students:grade:{grade_id}"
    redis = await get_redis_client()
    
    # Try cache first
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Query database
    students = db.query(Student).filter_by(grade_id=grade_id).all()
    
    # Cache result
    await redis.setex(cache_key, 3600, json.dumps(students))
    return students
```

**3. Optimize Queries**

```python
# Bad: N+1 query
students = db.query(Student).all()
for student in students:
    print(student.grade.name)  # Triggers additional query

# Good: Eager loading
from sqlalchemy.orm import joinedload
students = db.query(Student).options(joinedload(Student.grade)).all()
for student in students:
    print(student.grade.name)  # No additional query
```

---

## 2. Database Issues

### Cannot Connect to Database

**Symptom:** "connection refused" or "could not connect to server"

**Diagnostic Steps:**

```bash
# Check if MySQL is running
sudo systemctl status mysql
docker ps | grep mysql

# Test connection
mysql -h localhost -u root -p -D edu_platform_dev

# Check network connectivity
telnet localhost 3306
nc -zv localhost 3306
```

**Solutions:**

**1. MySQL Not Running**

```bash
# Start MySQL
sudo systemctl start mysql

# Or with Docker
docker-compose up -d mysql

# Enable auto-start
sudo systemctl enable mysql
```

**2. Wrong Connection String**

```bash
# Verify DATABASE_URL format
# mysql+pymysql://username:password@hostname:port/database
echo $DATABASE_URL

# Example:
# mysql+pymysql://root:password@localhost:3306/edu_platform_dev?charset=utf8mb4

# Test connection
mysql -h localhost -P 3306 -u root -p -e "SELECT 1;"
```

**3. Firewall Blocking**

```bash
# Check firewall rules
sudo ufw status
sudo iptables -L

# Allow MySQL port
sudo ufw allow 3306
```

**4. MySQL Not Listening**

```bash
# Edit my.cnf or my.ini
sudo nano /etc/mysql/my.cnf

# Ensure bind-address allows connections
[mysqld]
bind-address = 0.0.0.0  # or specific IP

# Grant remote access if needed
mysql -u root -p
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;

# Restart MySQL
sudo systemctl restart mysql
```

### Database Locks/Deadlocks

**Symptom:** Queries hang or timeout, "deadlock detected" errors

**Diagnostic Steps:**

```sql
-- Check for locks (MySQL)
SHOW PROCESSLIST;

-- Check InnoDB status
SHOW ENGINE INNODB STATUS;

-- Check for locked tables
SHOW OPEN TABLES WHERE In_use > 0;

-- Check long-running queries
SELECT 
    ID,
    USER,
    HOST,
    DB,
    COMMAND,
    TIME,
    STATE,
    INFO
FROM INFORMATION_SCHEMA.PROCESSLIST
WHERE TIME > 300
ORDER BY TIME DESC;
```

**Solutions:**

**1. Kill Blocking Query**

```sql
-- Show all processes
SHOW PROCESSLIST;

-- Kill specific process
KILL 12345;

-- Kill query (stops query but keeps connection)
KILL QUERY 12345;
```

**2. Prevent Future Deadlocks**

```python
# Use consistent lock ordering
# Bad: Different order in different transactions
# Transaction 1: Lock A then B
# Transaction 2: Lock B then A

# Good: Same order everywhere
# Always lock in alphabetical/ID order
```

**3. Reduce Lock Duration**

```python
# Keep transactions short
with db.begin():
    # Do only necessary work
    student = db.query(Student).filter_by(id=1).with_for_update().first()
    student.grade_id = 10
    db.commit()
# Lock released immediately
```

### Migration Failures

**Symptom:** "alembic upgrade head" fails

**Diagnostic Steps:**

```bash
# Check migration status
alembic current

# Check migration history
alembic history

# Try dry run
alembic upgrade head --sql > migration.sql
# Review migration.sql
```

**Solutions:**

**1. Schema Conflicts**

```bash
# Check if tables already exist
mysql -u username -p -D database_name -e "SHOW TABLES;"

# If migration partially applied
# Manually fix schema to match expected state
# Then stamp the version
alembic stamp head
```

**2. Data Conflicts**

```sql
-- Check for constraint violations
-- Example: Adding NOT NULL column with existing NULL values

-- Fix data first
UPDATE students SET email = 'unknown@example.com' WHERE email IS NULL;

-- Then retry migration
alembic upgrade head
```

**3. Migration Dependency Issues**

```python
# Check revision dependencies in migration file
# alembic/versions/xxx_migration.py
revision = 'abc123'
down_revision = 'def456'  # Must exist

# If broken, fix dependency or merge heads
alembic merge heads -m "merge migrations"
```

---

## 3. Authentication & Authorization

### Cannot Login

**Symptom:** Login fails with 401 Unauthorized

**Diagnostic Steps:**

```bash
# Test login endpoint
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test@example.com", "password": "password"}'

# Check user exists
psql $DATABASE_URL -c "SELECT * FROM users WHERE email = 'test@example.com';"

# Check application logs
tail -f logs/app.log | grep "login"
```

**Solutions:**

**1. Wrong Credentials**

```bash
# Reset password
python scripts/reset_password.py test@example.com

# Or create new user
python scripts/create_admin.py
```

**2. Account Inactive**

```sql
-- Check user status
SELECT email, is_active, is_verified FROM users WHERE email = 'test@example.com';

-- Activate account
UPDATE users SET is_active = TRUE WHERE email = 'test@example.com';
```

**3. JWT Secret Changed**

```bash
# If JWT_SECRET_KEY changed, all tokens are invalid
# Users must login again

# Verify secret in .env
grep JWT_SECRET_KEY .env

# Clear Redis cache (stored tokens)
redis-cli FLUSHALL
```

### Token Expired Issues

**Symptom:** "Token has expired" error

**Diagnostic Steps:**

```python
# Check token expiration
import jwt
token = "your_token_here"
decoded = jwt.decode(token, options={"verify_signature": False})
print(decoded['exp'])  # Unix timestamp
```

**Solutions:**

**1. Extend Token Lifetime**

```python
# config.py
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 120  # Increase from 60

# Or implement refresh tokens
```

**2. Implement Token Refresh**

```python
# src/api/v1/auth.py
@router.post("/refresh")
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    # Validate refresh token
    # Issue new access token
    pass
```

### Permission Denied

**Symptom:** 403 Forbidden on API calls

**Diagnostic Steps:**

```bash
# Check user's role and permissions
mysql -u username -p -D database_name << EOF
SELECT 
    u.email,
    r.name as role,
    GROUP_CONCAT(p.name) as permissions
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'user@example.com'
GROUP BY u.email, r.name;
EOF
```

**Solutions:**

**1. Assign Correct Role**

```sql
-- Update user role
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'teacher')
WHERE email = 'user@example.com';
```

**2. Grant Permissions**

```sql
-- Add permission to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'teacher'),
    (SELECT id FROM permissions WHERE name = 'assignments:create');
```

**3. Check RBAC Middleware**

```python
# Verify middleware is correctly applied
# src/dependencies/rbac.py
def require_permission(permission: str):
    async def check_permission(current_user = Depends(get_current_user)):
        if not has_permission(current_user, permission):
            raise HTTPException(status_code=403, detail="Permission denied")
        return current_user
    return check_permission

# Use in endpoints
@router.post("/assignments")
async def create_assignment(
    data: AssignmentCreate,
    user = Depends(require_permission("assignments:create"))
):
    pass
```

---

## 4. API & Backend Issues

### 500 Internal Server Error

**Symptom:** API returns 500 error

**Diagnostic Steps:**

```bash
# Check detailed error in logs
tail -f logs/app.log

# Check Sentry for error details
# Visit Sentry dashboard

# Test endpoint with verbose error
curl -v http://localhost:8000/api/v1/endpoint
```

**Solutions:**

**1. Unhandled Exception**

```python
# Add try-except blocks
@router.get("/students/{student_id}")
async def get_student(student_id: int, db: Session = Depends(get_db)):
    try:
        student = db.query(Student).filter_by(id=student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return student
    except Exception as e:
        logger.error(f"Error getting student: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
```

**2. Database Error**

```python
# Check for integrity errors
try:
    db.add(new_student)
    db.commit()
except IntegrityError as e:
    db.rollback()
    if "unique constraint" in str(e):
        raise HTTPException(status_code=409, detail="Student already exists")
    raise
```

### Request Timeout

**Symptom:** Request takes too long and times out

**Solutions:**

**1. Increase Timeout**

```python
# uvicorn timeout
uvicorn src.main:app --timeout-keep-alive 300

# Or in gunicorn
timeout = 300
```

**2. Optimize Query**

```python
# Use pagination
@router.get("/students")
async def get_students(
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * size
    students = db.query(Student).offset(skip).limit(size).all()
    return students
```

**3. Use Background Tasks**

```python
from fastapi import BackgroundTasks

@router.post("/generate-report")
async def generate_report(
    background_tasks: BackgroundTasks,
    data: ReportRequest
):
    # Queue task instead of processing immediately
    background_tasks.add_task(generate_report_task, data)
    return {"message": "Report generation started", "job_id": "123"}
```

### CORS Errors

**Symptom:** "CORS policy blocked" in browser console

**Solutions:**

```python
# src/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Connection Failed

**Symptom:** WebSocket fails to connect or disconnects

**Diagnostic Steps:**

```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8000/api/v1/ws');
ws.onopen = () => console.log('Connected');
ws.onerror = (e) => console.error('Error:', e);
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
```

**Solutions:**

**1. Check WebSocket Route**

```python
# src/api/v1/websocket.py
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        pass
```

**2. Load Balancer Configuration**

```nginx
# nginx.conf
location /api/v1/ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

---

## 5. Frontend Issues

### White Screen / Blank Page

**Symptom:** Application loads but shows blank screen

**Diagnostic Steps:**

```bash
# Check browser console for errors
# Open DevTools (F12) → Console

# Check if JavaScript loaded
# Network tab → Check for 404s on JS files

# Check build output
npm run build
ls -la build/
```

**Solutions:**

**1. Build Errors**

```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
npm run dev
```

**2. Environment Variables Missing**

```bash
# Check .env.local exists
cat .env.local

# Required variables for Next.js (must start with NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**3. React Error Boundary**

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
        console.error('Error caught:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }
        return this.props.children;
    }
}
```

### API Calls Failing from Frontend

**Symptom:** Network errors when calling API

**Diagnostic Steps:**

```javascript
// Check network requests in DevTools
// Network tab → Filter: XHR

// Test API directly
fetch('http://localhost:8000/api/v1/students')
    .then(r => r.json())
    .then(console.log)
    .catch(console.error);
```

**Solutions:**

**1. CORS Issues**

See CORS section above in Backend Issues

**2. Wrong API URL**

```typescript
// Check API URL configuration
console.log(process.env.NEXT_PUBLIC_API_URL);

// Update .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**3. Auth Token Not Sent**

```typescript
// Ensure token included in requests
// lib/api.ts
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### Infinite Rendering Loop

**Symptom:** Component re-renders continuously

**Solutions:**

```typescript
// Bad: Missing dependencies
useEffect(() => {
    fetchData();
}, []); // fetchData not in dependencies

// Good: Proper dependencies
const fetchData = useCallback(async () => {
    // fetch logic
}, []);

useEffect(() => {
    fetchData();
}, [fetchData]);

// Or use react-query
const { data } = useQuery('students', fetchStudents);
```

---

## 6. Performance Issues

### High CPU Usage

**Diagnostic Steps:**

```bash
# Check CPU usage
top -o %CPU
htop

# Check what's using CPU
ps aux --sort=-%cpu | head -10

# Profile application
py-spy record -o profile.svg -- python -m uvicorn src.main:app
```

**Solutions:**

**1. Reduce Worker Processes**

```bash
# If CPU-bound, don't exceed CPU cores
uvicorn src.main:app --workers 4
```

**2. Optimize Hot Code Paths**

```python
# Use cProfile to find bottlenecks
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()
# Your code here
profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumtime')
stats.print_stats(10)
```

### High Memory Usage

**Diagnostic Steps:**

```bash
# Check memory usage
free -h
docker stats

# Check Python memory
python -m memory_profiler script.py
```

**Solutions:**

**1. Memory Leaks**

```python
# Close database sessions properly
from contextlib import contextmanager

@contextmanager
def get_db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

# Use context manager
with get_db_session() as db:
    students = db.query(Student).all()
# Session closed automatically
```

**2. Large Query Results**

```python
# Use pagination or streaming
def get_students_streaming(db: Session):
    query = db.query(Student)
    for student in query.yield_per(100):
        yield student

# Or use server-side cursors
```

### Slow Database Queries

**Diagnostic Steps:**

```sql
-- Enable slow query logging (in my.cnf)
-- [mysqld]
-- slow_query_log = 1
-- slow_query_log_file = /var/log/mysql/slow-query.log
-- long_query_time = 2

-- Check slow query log
-- tail -f /var/log/mysql/slow-query.log

-- Explain query
EXPLAIN
SELECT * FROM students WHERE grade_id = 10;

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM students WHERE grade_id = 10;
```

**Solutions:**

**1. Add Indexes**

```sql
-- Create indexes on filtered/sorted columns
CREATE INDEX idx_students_grade ON students(grade_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date DESC);

-- Composite indexes for common filters
CREATE INDEX idx_students_grade_section ON students(grade_id, section_id);
```

**2. Optimize Queries**

```python
# Bad: Load everything
students = db.query(Student).all()

# Good: Load only needed columns
students = db.query(Student.id, Student.name).all()

# Better: Add filters
students = db.query(Student).filter_by(grade_id=10).limit(100).all()
```

**3. Use Query Cache**

```python
# Cache expensive queries
@cached(ttl=3600)
async def get_student_performance(student_id: int):
    # Expensive calculation
    return performance_data
```

---

## 7. Deployment Issues

### Docker Build Fails

**Diagnostic Steps:**

```bash
# Build with verbose output
docker build --progress=plain -t app:latest .

# Check Dockerfile syntax
docker build --check .
```

**Solutions:**

**1. Layer Caching Issues**

```dockerfile
# Use build cache effectively
# Copy dependency files first
COPY poetry.lock pyproject.toml ./
RUN poetry install --no-dev

# Then copy source code
COPY src/ ./src/
```

**2. Build Context Too Large**

```bash
# Check .dockerignore
cat .dockerignore

# Add to .dockerignore:
__pycache__
*.pyc
.git
node_modules
.env
```

### Container Keeps Restarting

**Diagnostic Steps:**

```bash
# Check container logs
docker logs container_name

# Check exit code
docker inspect container_name | grep ExitCode

# Check health check
docker inspect container_name | grep Health
```

**Solutions:**

**1. Application Crashes on Start**

```bash
# Run container interactively
docker run -it container_name /bin/bash
# Debug startup issues
```

**2. Failed Health Check**

```dockerfile
# Fix health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:8000/health || exit 1
```

### Kubernetes Pod in CrashLoopBackOff

**Diagnostic Steps:**

```bash
# Check pod status
kubectl get pods
kubectl describe pod pod-name

# Check logs
kubectl logs pod-name
kubectl logs pod-name --previous  # Previous crash

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

**Solutions:**

**1. ImagePullBackOff**

```bash
# Check image exists
docker pull image:tag

# Check image pull secret
kubectl get secrets
kubectl create secret docker-registry regcred \
    --docker-server=<registry> \
    --docker-username=<username> \
    --docker-password=<password>
```

**2. Resource Limits**

```yaml
# Increase resource limits
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

---

## 8. Integration Issues

### Email Not Sending

**Diagnostic Steps:**

```python
# Test SMTP connection
import smtplib
smtp = smtplib.SMTP('smtp.gmail.com', 587)
smtp.starttls()
smtp.login('user@gmail.com', 'password')
smtp.quit()
```

**Solutions:**

**1. Wrong SMTP Settings**

```python
# Verify settings
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USE_TLS = True

# For Gmail, use app password
# Not regular password
```

**2. Emails in Spam**

```python
# Add SPF, DKIM, DMARC records
# Use reputable email service (SendGrid, SES)

# Add proper headers
msg['From'] = 'noreply@yourdomain.com'
msg['Reply-To'] = 'support@yourdomain.com'
```

### S3 Upload Fails

**Diagnostic Steps:**

```python
# Test S3 connection
import boto3
s3 = boto3.client('s3')
s3.list_buckets()

# Test upload
s3.upload_file('test.txt', 'bucket-name', 'test.txt')
```

**Solutions:**

**1. Permission Denied**

```json
// Add S3 bucket policy
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::account:user/app"},
            "Action": ["s3:PutObject", "s3:GetObject"],
            "Resource": "arn:aws:s3:::bucket-name/*"
        }
    ]
}
```

**2. CORS Issues**

```json
// S3 CORS configuration
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["https://yourdomain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### Redis Connection Issues

**Diagnostic Steps:**

```bash
# Test connection
redis-cli -u redis://localhost:6379 ping

# Check Redis status
redis-cli INFO server
```

**Solutions:**

**1. Connection Refused**

```bash
# Check Redis is running
docker ps | grep redis
sudo systemctl status redis

# Check Redis configuration
redis-cli CONFIG GET bind
redis-cli CONFIG GET protected-mode
```

**2. Out of Memory**

```bash
# Check memory usage
redis-cli INFO memory

# Set max memory
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 9. Data Issues

### Data Corruption

**Symptom:** Invalid or inconsistent data in database

**Diagnostic Steps:**

```sql
-- Check for orphaned records
SELECT s.* FROM students s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- Check for constraint violations
SELECT * FROM students WHERE email NOT LIKE '%@%';

-- Check for duplicate records
SELECT email, COUNT(*)
FROM students
GROUP BY email
HAVING COUNT(*) > 1;
```

**Solutions:**

**1. Clean Up Data**

```sql
-- Remove orphaned records
DELETE FROM students
WHERE user_id NOT IN (SELECT id FROM users);

-- Fix invalid data
UPDATE students
SET email = CONCAT(admission_number, '@unknown.com')
WHERE email IS NULL OR email = '';
```

**2. Prevent Future Issues**

```sql
-- Add constraints
ALTER TABLE students
ADD CONSTRAINT students_email_check CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');

ALTER TABLE students
ADD CONSTRAINT students_user_fk
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### Missing Data

**Symptom:** Expected data not found

**Diagnostic Steps:**

```sql
-- Check if soft deleted
SELECT * FROM students WHERE deleted_at IS NOT NULL;

-- Check audit logs
SELECT * FROM audit_logs
WHERE resource_type = 'student' AND action = 'DELETE'
ORDER BY created_at DESC
LIMIT 10;
```

**Solutions:**

**1. Restore Soft Deleted**

```sql
UPDATE students
SET deleted_at = NULL
WHERE id = 123;
```

**2. Restore from Backup**

```bash
# Find backup
ls -lah backups/

# Restore specific table
pg_restore -t students backup_20240115.dump

# Or restore specific rows
psql $DATABASE_URL < restore_students.sql
```

---

## 10. Diagnostic Tools

### Essential Commands

**System Status:**
```bash
# CPU, Memory, Disk
top
htop
df -h
free -h

# Network
netstat -tuln
ss -tuln
```

**Docker:**
```bash
# Container status
docker ps -a
docker stats

# Logs
docker logs -f container_name
docker logs --tail 100 container_name

# Execute commands in container
docker exec -it container_name /bin/bash
```

**Kubernetes:**
```bash
# Pod status
kubectl get pods -o wide
kubectl describe pod pod-name

# Logs
kubectl logs -f pod-name
kubectl logs pod-name --previous

# Execute commands
kubectl exec -it pod-name -- /bin/bash

# Port forward
kubectl port-forward pod-name 8000:8000
```

**Database:**
```bash
# Connect
mysql -h host -u username -p database_name

# Useful commands
SHOW TABLES;  # List tables
DESCRIBE table_name;  # Describe table
SHOW INDEXES FROM table_name;  # List indexes
SELECT user, host FROM mysql.user;  # List users
SHOW DATABASES;  # List databases

# Performance
SHOW PROCESSLIST;
SHOW STATUS;
SHOW ENGINE INNODB STATUS;
```

**Redis:**
```bash
# Connect
redis-cli

# Commands
INFO
KEYS pattern
GET key
DBSIZE
MONITOR
```

### Log Analysis

```bash
# Find errors
grep -i error logs/app.log

# Count error types
grep -i error logs/app.log | sort | uniq -c | sort -nr

# Find slow requests
grep "duration" logs/app.log | awk '{print $NF}' | sort -n | tail -10

# Watch logs in real-time
tail -f logs/app.log | grep -i "error\|warning"
```

### Network Debugging

```bash
# Test endpoint
curl -v http://localhost:8000/health

# Test with timing
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/students

# DNS lookup
nslookup api.yourplatform.com
dig api.yourplatform.com

# Trace route
traceroute api.yourplatform.com

# Check port
nc -zv localhost 8000
telnet localhost 8000
```

---

## Quick Reference

### Common Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 422 | Validation Error | Input validation failed |
| 500 | Internal Server Error | Application error |
| 502 | Bad Gateway | Upstream server error |
| 503 | Service Unavailable | Server overloaded |
| 504 | Gateway Timeout | Request timeout |

### Emergency Contacts

- **DevOps Team:** devops@yourplatform.com
- **Backend Team:** backend@yourplatform.com
- **Frontend Team:** frontend@yourplatform.com
- **Database Admin:** dba@yourplatform.com
- **On-Call:** +1-XXX-XXX-XXXX

### Useful Links

- **Status Page:** https://status.yourplatform.com
- **Sentry:** https://sentry.io/organizations/your-org
- **CloudWatch:** AWS Console → CloudWatch
- **Documentation:** https://docs.yourplatform.com
- **Runbooks:** https://wiki.yourplatform.com/runbooks

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Maintained By:** Platform Team

For issues not covered in this guide, please contact the platform team or create a ticket in the issue tracking system.
