# Blockchain Digital Credential System - Quick Start Guide

## Prerequisites

1. **Docker & Docker Compose**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Hyperledger Fabric Binaries** (Optional - for full blockchain)
   ```bash
   curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5
   export PATH=$PATH:$PWD/bin
   ```

3. **Python Dependencies**
   ```bash
   poetry install
   ```

## Quick Setup (5 Minutes)

### Step 1: Database Migration
```bash
# Run migration to create credential tables
alembic upgrade head
```

### Step 2: Start Application (Mock Blockchain)
```bash
# Start with mock blockchain service (no Hyperledger Fabric required)
poetry run uvicorn src.main:app --reload
```

The system will automatically use a mock blockchain service if the Hyperledger Fabric network is not running.

### Step 3: Test the API

#### Issue a Credential
```bash
curl -X POST "http://localhost:8000/api/v1/credentials/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": 1,
    "credential_type": "certificate",
    "sub_type": "academic",
    "title": "Python Programming Certificate",
    "description": "Completed Python course with distinction",
    "skills": ["Python", "FastAPI", "SQLAlchemy"]
  }'
```

#### Verify a Credential (Public - No Auth)
```bash
curl "http://localhost:8000/api/v1/verify/certificate/CERT-1-20240314120000-ABC12345"
```

## Full Blockchain Setup (15 Minutes)

### Step 1: Start Blockchain Network
```bash
cd blockchain/scripts
chmod +x network.sh
./network.sh up
```

This will:
- Generate crypto materials
- Create genesis block
- Start orderer and peer containers
- Create and join channel

### Step 2: Deploy Chaincode
```bash
./network.sh deploy
```

This will:
- Package the chaincode
- Install on peers
- Approve and commit

### Step 3: Verify Network
```bash
docker ps
```

You should see:
- orderer.credentials.com
- peer0.education.credentials.com
- cli

### Step 4: Start Application (Full Blockchain)
```bash
# Back to project root
cd ../..

# Start application
poetry run uvicorn src.main:app --reload
```

## Common Operations

### Issue Certificate
```python
import requests

url = "http://localhost:8000/api/v1/credentials/"
headers = {"Authorization": f"Bearer {token}"}
data = {
    "recipient_id": 1,
    "credential_type": "certificate",
    "sub_type": "academic",
    "title": "Data Science Certificate",
    "skills": ["Python", "Machine Learning", "Statistics"],
    "grade": "A+",
    "score": 95
}

response = requests.post(url, json=data, headers=headers)
credential = response.json()

print(f"Certificate Number: {credential['certificate_number']}")
print(f"Verification URL: {credential['verification_url']}")
print(f"Blockchain Hash: {credential['blockchain_hash']}")
```

### Issue Digital Badge
```python
data = {
    "recipient_id": 1,
    "credential_type": "digital_badge",
    "sub_type": "skill_based",
    "title": "FastAPI Expert",
    "skills": ["FastAPI", "REST API", "Async Python"]
}

response = requests.post(url, json=data, headers=headers)
badge = response.json()
```

### Bulk Issue Credentials
```python
url = "http://localhost:8000/api/v1/credentials/bulk"
data = {
    "recipient_ids": [1, 2, 3, 4, 5],
    "credential_type": "digital_badge",
    "sub_type": "participation",
    "title": "Hackathon 2024 Participant"
}

response = requests.post(url, json=data, headers=headers)
credentials = response.json()
print(f"Issued {len(credentials)} credentials")
```

### Verify Credential (Public)
```python
cert_number = "CERT-1-20240314120000-ABC12345"
url = f"http://localhost:8000/api/v1/verify/certificate/{cert_number}"

response = requests.get(url)
result = response.json()

print(f"Valid: {result['valid']}")
print(f"Blockchain Verified: {result['blockchain_verified']}")
if result['credential']:
    print(f"Recipient: {result['credential']['recipient_name']}")
    print(f"Title: {result['credential']['title']}")
```

### Create Share Link
```python
credential_id = 123
url = f"http://localhost:8000/api/v1/credentials/{credential_id}/share"
data = {
    "recipient_email": "employer@company.com",
    "recipient_name": "HR Manager",
    "expires_at": "2024-12-31T23:59:59Z"
}

response = requests.post(url, json=data, headers=headers)
share = response.json()

print(f"Share URL: {share['share_url']}")
print(f"Share Token: {share['share_token']}")
```

### Revoke Credential
```python
credential_id = 123
url = f"http://localhost:8000/api/v1/credentials/{credential_id}/revoke"
data = {
    "reason": "Credential issued in error"
}

response = requests.post(url, json=data, headers=headers)
revoked = response.json()

print(f"Status: {revoked['status']}")
print(f"Revoked At: {revoked['revoked_at']}")
```

## Employer Portal Usage

### Verify Single Credential
```bash
curl "http://localhost:8000/api/v1/verify/certificate/CERT-1-20240314120000-ABC12345"
```

### Batch Verify Credentials
```bash
curl -X POST "http://localhost:8000/api/v1/employer/verify/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "certificate_numbers": [
      "CERT-1-20240314120000-ABC12345",
      "CERT-1-20240314120001-DEF67890"
    ]
  }'
```

### View Credential History
```bash
curl "http://localhost:8000/api/v1/employer/credential/CERT-1-20240314120000-ABC12345/history"
```

## Blockchain Management

### Check Network Status
```bash
docker ps --filter "name=credentials"
```

### View Peer Logs
```bash
docker logs peer0.education.credentials.com
```

### View Orderer Logs
```bash
docker logs orderer.credentials.com
```

### Restart Network
```bash
cd blockchain/scripts
./network.sh restart
```

### Stop Network
```bash
./network.sh down
```

## Testing Workflow

### 1. Issue Credentials
```bash
# Issue academic certificate
POST /api/v1/credentials/
{
  "recipient_id": 1,
  "credential_type": "certificate",
  "sub_type": "academic",
  "title": "Bachelor of Science in Computer Science"
}

# Issue skill badge
POST /api/v1/credentials/
{
  "recipient_id": 1,
  "credential_type": "digital_badge",
  "sub_type": "skill_based",
  "title": "Python Expert"
}
```

### 2. Verify Credentials
```bash
# Get certificate number from response
GET /api/v1/verify/certificate/{certificate_number}
```

### 3. Share Credentials
```bash
POST /api/v1/credentials/{id}/share
{
  "recipient_email": "employer@company.com"
}
```

### 4. View Statistics
```bash
GET /api/v1/credentials/statistics
```

## Troubleshooting

### Mock Blockchain Mode
If you see "Using mock blockchain service" in logs:
- The system is running without Hyperledger Fabric
- Credentials are still created and verified
- Blockchain hashes are simulated
- All features work except real blockchain verification

### Start Real Blockchain
```bash
cd blockchain/scripts
./network.sh up
./network.sh deploy
```

### Network Connection Issues
```bash
# Check if containers are running
docker ps

# Restart network
./network.sh restart

# Check logs
docker logs peer0.education.credentials.com
```

### Database Issues
```bash
# Re-run migrations
alembic upgrade head

# Check database connection
psql -U postgres -d fastapi_db -c "SELECT * FROM digital_credentials LIMIT 1;"
```

## API Documentation

Once the application is running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Next Steps

1. **Customize Templates**: Create credential templates for your institution
2. **Design QR Codes**: Customize QR code appearance
3. **Email Integration**: Send credentials to recipients via email
4. **Frontend Integration**: Build UI for credential display
5. **Mobile App**: Create mobile app for credential wallet

## Support

- Check logs: `docker logs <container_name>`
- Network status: `docker ps`
- Database: Check PostgreSQL logs
- API errors: Check FastAPI logs

## Production Checklist

- [ ] Configure proper domain in APP_URL
- [ ] Set up SSL/TLS for blockchain network
- [ ] Configure multi-node blockchain (replace Solo orderer)
- [ ] Set up backup for blockchain data
- [ ] Configure monitoring and alerts
- [ ] Set up rate limiting for verification endpoints
- [ ] Configure CDN for QR code images
- [ ] Set up email notifications for credential issuance
- [ ] Configure proper authentication and authorization
- [ ] Set up audit logging for all operations
