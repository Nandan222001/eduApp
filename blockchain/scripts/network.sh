#!/bin/bash

set -e

function printHelp() {
    echo "Usage: "
    echo "  network.sh <mode> [flags]"
    echo "    <mode>"
    echo "      - 'up' - bring up the network"
    echo "      - 'down' - tear down the network"
    echo "      - 'restart' - restart the network"
    echo "      - 'deploy' - deploy the chaincode"
}

COMPOSE_FILE=../network/docker-compose.yaml
CHANNEL_NAME=credentialchannel
CHAINCODE_NAME=credentials
CHAINCODE_VERSION=1.0
CHAINCODE_PATH=../chaincode/credentials

function networkUp() {
    echo "Starting credential network..."
    
    if [ ! -d "../network/crypto-config" ]; then
        echo "Generating crypto material..."
        cryptogen generate --config=../network/crypto-config.yaml --output="../network/crypto-config"
    fi
    
    if [ ! -d "../network/channel-artifacts" ]; then
        mkdir -p ../network/channel-artifacts
    fi
    
    echo "Generating genesis block..."
    configtxgen -profile CredentialOrdererGenesis -channelID system-channel -outputBlock ../network/channel-artifacts/genesis.block -configPath ../network
    
    echo "Generating channel configuration transaction..."
    configtxgen -profile CredentialChannel -outputCreateChannelTx ../network/channel-artifacts/channel.tx -channelID $CHANNEL_NAME -configPath ../network
    
    echo "Generating anchor peer update for EducationOrg..."
    configtxgen -profile CredentialChannel -outputAnchorPeersUpdate ../network/channel-artifacts/EducationOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg EducationOrgMSP -configPath ../network
    
    docker-compose -f $COMPOSE_FILE up -d
    
    echo "Waiting for network to start..."
    sleep 10
    
    echo "Creating channel..."
    docker exec cli peer channel create -o orderer.credentials.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/credentials.com/orderers/orderer.credentials.com/msp/tlscacerts/tlsca.credentials.com-cert.pem
    
    echo "Joining peer to channel..."
    docker exec cli peer channel join -b $CHANNEL_NAME.block
    
    echo "Updating anchor peers..."
    docker exec cli peer channel update -o orderer.credentials.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/EducationOrgMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/credentials.com/orderers/orderer.credentials.com/msp/tlscacerts/tlsca.credentials.com-cert.pem
    
    echo "Network is up!"
}

function networkDown() {
    echo "Stopping credential network..."
    docker-compose -f $COMPOSE_FILE down --volumes --remove-orphans
    
    echo "Cleaning up artifacts..."
    rm -rf ../network/channel-artifacts/*
    rm -rf ../network/crypto-config
    
    echo "Network is down!"
}

function deployChaincode() {
    echo "Packaging chaincode..."
    docker exec cli peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path /opt/gopath/src/github.com/chaincode --lang golang --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
    
    echo "Installing chaincode on peer..."
    docker exec cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    
    echo "Querying installed chaincode..."
    docker exec cli peer lifecycle chaincode queryinstalled > log.txt
    PACKAGE_ID=$(sed -n "/${CHAINCODE_NAME}_${CHAINCODE_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo "Package ID: $PACKAGE_ID"
    
    echo "Approving chaincode for organization..."
    docker exec cli peer lifecycle chaincode approveformyorg -o orderer.credentials.com:7050 --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $PACKAGE_ID --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/credentials.com/orderers/orderer.credentials.com/msp/tlscacerts/tlsca.credentials.com-cert.pem
    
    echo "Checking commit readiness..."
    docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/credentials.com/orderers/orderer.credentials.com/msp/tlscacerts/tlsca.credentials.com-cert.pem --output json
    
    echo "Committing chaincode..."
    docker exec cli peer lifecycle chaincode commit -o orderer.credentials.com:7050 --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/credentials.com/orderers/orderer.credentials.com/msp/tlscacerts/tlsca.credentials.com-cert.pem --peerAddresses peer0.education.credentials.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/education.credentials.com/peers/peer0.education.credentials.com/tls/ca.crt
    
    echo "Querying committed chaincode..."
    docker exec cli peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/credentials.com/orderers/orderer.credentials.com/msp/tlscacerts/tlsca.credentials.com-cert.pem
    
    rm log.txt
    echo "Chaincode deployed successfully!"
}

MODE=$1

if [ "$MODE" == "up" ]; then
    networkUp
elif [ "$MODE" == "down" ]; then
    networkDown
elif [ "$MODE" == "restart" ]; then
    networkDown
    networkUp
elif [ "$MODE" == "deploy" ]; then
    deployChaincode
else
    printHelp
    exit 1
fi
