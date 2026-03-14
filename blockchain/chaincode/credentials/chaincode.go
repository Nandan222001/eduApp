package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type CredentialContract struct {
	contractapi.Contract
}

type Credential struct {
	CredentialID   string    `json:"credentialId"`
	RecipientID    string    `json:"recipientId"`
	RecipientName  string    `json:"recipientName"`
	RecipientEmail string    `json:"recipientEmail"`
	IssuerID       string    `json:"issuerId"`
	IssuerName     string    `json:"issuerName"`
	CredentialType string    `json:"credentialType"`
	SubType        string    `json:"subType"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Skills         []string  `json:"skills"`
	Metadata       string    `json:"metadata"`
	IssuedAt       string    `json:"issuedAt"`
	ExpiresAt      string    `json:"expiresAt"`
	Status         string    `json:"status"`
	RevokedAt      string    `json:"revokedAt,omitempty"`
	RevokedBy      string    `json:"revokedBy,omitempty"`
	RevokeReason   string    `json:"revokeReason,omitempty"`
	BlockchainHash string    `json:"blockchainHash"`
}

type CredentialHistory struct {
	TxID      string     `json:"txId"`
	Timestamp string     `json:"timestamp"`
	Credential Credential `json:"credential"`
}

func (c *CredentialContract) IssueCredential(ctx contractapi.TransactionContextInterface, credentialData string) error {
	var credential Credential
	err := json.Unmarshal([]byte(credentialData), &credential)
	if err != nil {
		return fmt.Errorf("failed to unmarshal credential: %v", err)
	}

	exists, err := c.CredentialExists(ctx, credential.CredentialID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("credential %s already exists", credential.CredentialID)
	}

	credential.IssuedAt = time.Now().UTC().Format(time.RFC3339)
	credential.Status = "active"
	credential.BlockchainHash = ctx.GetStub().GetTxID()

	credentialJSON, err := json.Marshal(credential)
	if err != nil {
		return fmt.Errorf("failed to marshal credential: %v", err)
	}

	err = ctx.GetStub().PutState(credential.CredentialID, credentialJSON)
	if err != nil {
		return fmt.Errorf("failed to put credential to world state: %v", err)
	}

	indexName := "recipientId~credentialId"
	recipientIndexKey, err := ctx.GetStub().CreateCompositeKey(indexName, []string{credential.RecipientID, credential.CredentialID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}
	value := []byte{0x00}
	return ctx.GetStub().PutState(recipientIndexKey, value)
}

func (c *CredentialContract) VerifyCredential(ctx contractapi.TransactionContextInterface, credentialID string) (*Credential, error) {
	credentialJSON, err := ctx.GetStub().GetState(credentialID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if credentialJSON == nil {
		return nil, fmt.Errorf("credential %s does not exist", credentialID)
	}

	var credential Credential
	err = json.Unmarshal(credentialJSON, &credential)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal credential: %v", err)
	}

	return &credential, nil
}

func (c *CredentialContract) RevokeCredential(ctx contractapi.TransactionContextInterface, credentialID string, revokedBy string, reason string) error {
	credential, err := c.VerifyCredential(ctx, credentialID)
	if err != nil {
		return err
	}

	if credential.Status == "revoked" {
		return fmt.Errorf("credential %s is already revoked", credentialID)
	}

	credential.Status = "revoked"
	credential.RevokedAt = time.Now().UTC().Format(time.RFC3339)
	credential.RevokedBy = revokedBy
	credential.RevokeReason = reason

	credentialJSON, err := json.Marshal(credential)
	if err != nil {
		return fmt.Errorf("failed to marshal credential: %v", err)
	}

	return ctx.GetStub().PutState(credentialID, credentialJSON)
}

func (c *CredentialContract) GetCredentialsByRecipient(ctx contractapi.TransactionContextInterface, recipientID string) ([]*Credential, error) {
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("recipientId~credentialId", []string{recipientID})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var credentials []*Credential
	for resultsIterator.HasNext() {
		responseRange, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(responseRange.Key)
		if err != nil {
			return nil, err
		}

		if len(compositeKeyParts) > 1 {
			credentialID := compositeKeyParts[1]
			credential, err := c.VerifyCredential(ctx, credentialID)
			if err != nil {
				continue
			}
			credentials = append(credentials, credential)
		}
	}

	return credentials, nil
}

func (c *CredentialContract) GetCredentialHistory(ctx contractapi.TransactionContextInterface, credentialID string) ([]*CredentialHistory, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(credentialID)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var history []*CredentialHistory
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var credential Credential
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &credential)
			if err != nil {
				return nil, err
			}

			historyEntry := &CredentialHistory{
				TxID:      response.TxId,
				Timestamp: time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String(),
				Credential: credential,
			}
			history = append(history, historyEntry)
		}
	}

	return history, nil
}

func (c *CredentialContract) CredentialExists(ctx contractapi.TransactionContextInterface, credentialID string) (bool, error) {
	credentialJSON, err := ctx.GetStub().GetState(credentialID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return credentialJSON != nil, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&CredentialContract{})
	if err != nil {
		fmt.Printf("Error creating credential chaincode: %v", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting credential chaincode: %v", err)
	}
}
