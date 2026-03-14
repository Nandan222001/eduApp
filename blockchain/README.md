# Blockchain Digital Credential System

This directory contains the Hyperledger Fabric blockchain network configuration for the digital credential system.

## Prerequisites

- Docker and Docker Compose
- Hyperledger Fabric binaries (v2.5)
- Go (v1.20+)

## Installation

1. Install Hyperledger Fabric binaries:
```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5
export PATH=$PATH:$PWD/bin
```

2. Verify installation:
```bash
peer version
orderer version
configtxgen --version
cryptogen version
```

## Network Setup

### Start the network
```bash
cd scripts
./network.sh up
```

### Deploy chaincode
```bash
./network.sh deploy
```

### Stop the network
```bash
./network.sh down
```

### Restart the network
```bash
./network.sh restart
```

## Network Architecture

- **Orderer**: Single orderer node using Solo consensus
- **Peer Organization**: EducationOrg with 2 peer nodes
- **Channel**: credentialchannel
- **Chaincode**: credentials (v1.0)

## Chaincode Operations

The credentials chaincode supports the following operations:

1. **IssueCredential**: Issue a new digital credential
2. **VerifyCredential**: Verify and retrieve credential details
3. **RevokeCredential**: Revoke an existing credential
4. **GetCredentialsByRecipient**: Get all credentials for a recipient
5. **GetCredentialHistory**: Get the complete history of a credential

## Directory Structure

```
blockchain/
├── network/
│   ├── configtx.yaml          # Channel configuration
│   ├── crypto-config.yaml     # Crypto material configuration
│   ├── docker-compose.yaml    # Docker services
│   ├── crypto-config/         # Generated crypto material (auto-generated)
│   └── channel-artifacts/     # Generated channel artifacts (auto-generated)
├── chaincode/
│   └── credentials/
│       ├── chaincode.go       # Credential smart contract
│       └── go.mod             # Go dependencies
├── scripts/
│   └── network.sh             # Network management script
└── README.md
```

## Integration with FastAPI

The FastAPI application connects to the blockchain network using the Hyperledger Fabric SDK. See `src/services/credential_service.py` for implementation details.

## Monitoring

Access the peer operations service:
- Peer0: http://localhost:9444
- Orderer: http://localhost:9443

## Troubleshooting

1. **Network won't start**: Ensure all Docker containers from previous runs are stopped:
```bash
docker-compose -f network/docker-compose.yaml down --volumes
```

2. **Chaincode deployment fails**: Check the chaincode logs:
```bash
docker logs peer0.education.credentials.com
```

3. **Connection issues**: Verify the network is running:
```bash
docker ps
```

## Security Notes

- TLS is enabled for all communications
- Crypto material is generated using cryptogen
- MSP (Membership Service Provider) is configured for organization identity
- All transactions are signed and verified
