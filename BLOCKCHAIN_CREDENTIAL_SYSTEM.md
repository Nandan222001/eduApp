# Blockchain-Based Digital Credential System

## Overview

This system implements a complete blockchain-based digital credential platform using Hyperledger Fabric, enabling educational institutions to issue, verify, and manage tamper-proof digital credentials including certificates and badges.

## Features

### Core Functionality
- **Credential Issuance**: Issue digital badges and certificates with blockchain backing
- **Blockchain Integration**: All credentials stored on Hyperledger Fabric blockchain
- **Credential Verification**: Public verification portal with QR code scanning
- **Credential Types**:
  - Digital Badges (Academic, Skill-based, Participation)
  - Certificates (Academic, Skill-based, Participation)
- **Shareable Credentials**: Generate time-limited share links
- **QR Code Generation**: Automatic QR code creation for each credential
- **Revocation**: Ability to revoke credentials with reason tracking
- **Employer Portal**: Dedicated verification interface for employers

### Blockchain Features
- **Immutable Records**: All credentials stored on blockchain
- **Audit Trail**: Complete history of credential lifecycle
- **Tamper-Proof**: Cryptographic verification of credential authenticity
- **Decentralized Verification**: Independent verification without central authority

## Architecture

### Components

1. **Blockchain Network** (`blockchain/`)
   - Hyperledger Fabric v2.5
   - Single orderer with Solo consensus
   - Education organization peer network
   - Credentials chaincode (smart contract)

2. **Database Models** (`src/models/digital_credential.py`)
   - DigitalCredential: Main credential model
   - CredentialVerification: Verification audit logs
   - CredentialShare: Shareable credential links
   - CredentialTemplate: Reusable credential templates

3. **Services** (`src/services/`)
   - `credential_service.py`: Business logic for credentials
   - `blockchain_service.py`: Hyperledger Fabric integration

4. **API Endpoints** (`src/api/v1/credentials.py`)
   - Credential CRUD operations
   - Public verification endpoints
   - Employer verification portal
   - Share link management

## API Endpoints

### Credential Management

#### Issue Credential
```http
POST /api/v1/credentials/
Authorization: Bearer <token>

{
  "recipient_id": 123,
  "credential_type": "certificate",
  "sub_type": "academic",
  "title": "Advanced Python Programming",
  "description": "Successfully completed advanced Python course",
  "skills": ["Python", "Django", "FastAPI"],
  "expires_at": "2025-12-31T23:59:59Z",
  "grade": "A+",
  "score": 95
}
```

#### Bulk Issue Credentials
```http
POST /api/v1/credentials/bulk
Authorization: Bearer <token>

{
  "recipient_ids": [123, 124, 125],
  "credential_type": "digital_badge",
  "sub_type": "participation",
  "title": "Hackathon 2024 Participant",
  "description": "Participated in Annual Hackathon 2024"
}
```

#### List My Credentials
```http
GET /api/v1/credentials/my-credentials?skip=0&limit=100
Authorization: Bearer <token>
```

#### Get Credential Details
```http
GET /api/v1/credentials/{credential_id}
Authorization: Bearer <token>
```

#### Revoke Credential
```http
POST /api/v1/credentials/{credential_id}/revoke
Authorization: Bearer <token>

{
  "reason": "Credential issued in error"
}
```

#### Create Share Link
```http
POST /api/v1/credentials/{credential_id}/share
Authorization: Bearer <token>

{
  "recipient_email": "employer@company.com",
  "recipient_name": "HR Manager",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Public Verification

#### Verify by Certificate Number
```http
GET /api/v1/verify/certificate/{certificate_number}
```

Response:
```json
{
  "valid": true,
  "credential": {
    "id": 123,
    "title": "Advanced Python Programming",
    "credential_type": "certificate",
    "sub_type": "academic",
    "recipient_name": "John Doe",
    "recipient_email": "john@example.com",
    "issued_at": "2024-01-15T10:30:00Z",
    "expires_at": "2025-12-31T23:59:59Z",
    "status": "active",
    "blockchain_hash": "abc123...",
    "institution_name": "Tech University"
  },
  "message": "Credential is valid",
  "verified_at": "2024-03-14T12:00:00Z",
  "blockchain_verified": true
}
```

#### View Shared Credential
```http
GET /api/v1/share/credential/{share_token}
```

### Employer Verification Portal

#### Portal Information
```http
GET /api/v1/employer/verify
```

#### Batch Verification
```http
POST /api/v1/employer/verify/batch

{
  "certificate_numbers": [
    "CERT-1-20240115103000-ABC12345",
    "CERT-1-20240116143000-DEF67890"
  ]
}
```

Response:
```json
{
  "total": 2,
  "results": [
    {
      "certificate_number": "CERT-1-20240115103000-ABC12345",
      "valid": true,
      "message": "Credential is valid",
      "blockchain_verified": true
    },
    {
      "certificate_number": "CERT-1-20240116143000-DEF67890",
      "valid": false,
      "message": "Credential not found",
      "blockchain_verified": false
    }
  ]
}
```

#### Get Credential Blockchain History
```http
GET /api/v1/employer/credential/{certificate_number}/history
```

### Statistics

#### Get Credential Statistics
```http
GET /api/v1/credentials/statistics
Authorization: Bearer <token>
```

Response:
```json
{
  "total_issued": 1500,
  "active_credentials": 1400,
  "revoked_credentials": 50,
  "expired_credentials": 30,
  "pending_credentials": 20,
  "by_type": {
    "certificate": 1000,
    "digital_badge": 500
  },
  "by_subtype": {
    "academic": 800,
    "skill_based": 500,
    "participation": 200
  },
  "recent_issuances": [...]
}
```

## Blockchain Setup

### Prerequisites
```bash
# Install Docker and Docker Compose
# Install Hyperledger Fabric binaries
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5

# Add to PATH
export PATH=$PATH:$PWD/bin
```

### Start Blockchain Network
```bash
cd blockchain/scripts
./network.sh up
```

### Deploy Chaincode
```bash
./network.sh deploy
```

### Stop Network
```bash
./network.sh down
```

## Database Migration

Run the migration to create credential tables:
```bash
alembic upgrade head
```

## Configuration

Add to `.env`:
```bash
# Application URL for verification links
APP_URL=https://your-domain.com

# Blockchain configuration
BLOCKCHAIN_NETWORK_PATH=/path/to/blockchain/network
BLOCKCHAIN_CHANNEL=credentialchannel
BLOCKCHAIN_CHAINCODE=credentials
```

## Security Features

### Blockchain Security
- All credentials cryptographically signed
- Immutable audit trail
- Tamper-proof verification
- Decentralized trust model

### Application Security
- JWT authentication for API endpoints
- Public verification endpoints (no auth required)
- IP tracking for verifications
- Share link expiration
- Revocation tracking

## Data Models

### DigitalCredential
```python
{
    "id": int,
    "institution_id": int,
    "recipient_id": int,
    "issuer_id": int,
    "credential_type": "certificate|digital_badge",
    "sub_type": "academic|skill_based|participation",
    "title": str,
    "description": str,
    "certificate_number": str,
    "skills": List[str],
    "metadata": dict,
    "blockchain_hash": str,
    "blockchain_credential_id": str,
    "blockchain_status": str,
    "verification_url": str,
    "qr_code_url": str,
    "issued_at": datetime,
    "expires_at": datetime,
    "status": "pending|active|revoked|expired",
    "revoked_at": datetime,
    "revoked_by": int,
    "revoke_reason": str,
    "grade": str,
    "score": int
}
```

### Chaincode Functions

The Hyperledger Fabric chaincode supports:

1. **IssueCredential**: Create new credential on blockchain
2. **VerifyCredential**: Retrieve and verify credential
3. **RevokeCredential**: Revoke credential with reason
4. **GetCredentialsByRecipient**: Get all credentials for a user
5. **GetCredentialHistory**: Get complete audit trail

## Use Cases

### Academic Institutions
- Issue degree certificates
- Award skill badges
- Participation certificates for events
- Course completion certificates

### Employers
- Verify candidate credentials
- Batch verification for hiring
- Check credential authenticity
- View credential history

### Students
- Share credentials with employers
- Generate shareable links
- Download QR codes
- Track credential verification

## QR Code Integration

Each credential automatically generates a QR code containing:
- Verification URL
- Certificate number
- Quick verification access

Scan with any QR code reader to instantly verify credential authenticity.

## Frontend Integration Example

```javascript
// Verify credential by scanning QR code
async function verifyCredential(certificateNumber) {
  const response = await fetch(
    `/api/v1/verify/certificate/${certificateNumber}`
  );
  const result = await response.json();
  
  if (result.valid) {
    console.log('Credential is valid!');
    console.log('Blockchain verified:', result.blockchain_verified);
  } else {
    console.log('Invalid credential:', result.message);
  }
}

// Share credential
async function shareCredential(credentialId, email) {
  const response = await fetch(
    `/api/v1/credentials/${credentialId}/share`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient_email: email,
        expires_at: '2024-12-31T23:59:59Z'
      })
    }
  );
  
  const share = await response.json();
  return share.share_url;
}
```

## Monitoring

### Blockchain Network Status
Monitor peer and orderer containers:
```bash
docker ps | grep credentials
```

### View Chaincode Logs
```bash
docker logs peer0.education.credentials.com
```

### Access Peer Operations
- Peer0: http://localhost:9444
- Orderer: http://localhost:9443

## Troubleshooting

### Network Won't Start
```bash
# Clean up existing containers
docker-compose -f blockchain/network/docker-compose.yaml down --volumes

# Remove old artifacts
rm -rf blockchain/network/channel-artifacts/*
rm -rf blockchain/network/crypto-config

# Start fresh
cd blockchain/scripts
./network.sh up
```

### Blockchain Service Unavailable
The system automatically falls back to a mock blockchain service if the network is not available. This allows development and testing without running the full blockchain network.

## Performance Considerations

- Blockchain operations are asynchronous
- Verification is cached for performance
- QR codes are base64 encoded inline
- Bulk operations use batch processing
- Share links have view count tracking

## Future Enhancements

- Multi-signature credentials
- Skills verification via third parties
- NFT credential badges
- Cross-institution credential verification
- Mobile app integration
- Credential marketplace

## Support

For issues or questions:
1. Check blockchain network status
2. Review chaincode logs
3. Verify database migrations
4. Check API endpoint documentation
