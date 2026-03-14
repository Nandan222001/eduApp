from typing import Dict, Any, List, Optional
import json
import logging
import subprocess
import os

logger = logging.getLogger(__name__)


class BlockchainService:
    def __init__(self):
        self.channel_name = "credentialchannel"
        self.chaincode_name = "credentials"
        self.peer_address = "peer0.education.credentials.com:7051"
        self.orderer_address = "orderer.credentials.com:7050"
        
        self.crypto_path = os.path.join(
            os.path.dirname(__file__),
            "../../blockchain/network/crypto-config"
        )
        
        self.use_mock = not os.path.exists(self.crypto_path)
        
        if self.use_mock:
            logger.warning("Blockchain network not available, using mock service")

    def _invoke_chaincode(
        self,
        function: str,
        args: List[str]
    ) -> str:
        if self.use_mock:
            return self._mock_invoke(function, args)
        
        try:
            cmd = [
                "docker", "exec", "cli",
                "peer", "chaincode", "invoke",
                "-o", self.orderer_address,
                "-C", self.channel_name,
                "-n", self.chaincode_name,
                "-c", json.dumps({"function": function, "Args": args}),
                "--tls", "true",
                "--cafile", "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/credentials.com/orderers/orderer.credentials.com/msp/tlscacerts/tlsca.credentials.com-cert.pem",
                "--peerAddresses", self.peer_address,
                "--tlsRootCertFiles", "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/education.credentials.com/peers/peer0.education.credentials.com/tls/ca.crt"
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                logger.error(f"Chaincode invoke failed: {result.stderr}")
                raise Exception(f"Chaincode invoke failed: {result.stderr}")
            
            import re
            tx_id_match = re.search(r'Chaincode invoke successful\. result: status:(\d+) payload:"([^"]*)"', result.stdout)
            if tx_id_match:
                return tx_id_match.group(2)
            
            tx_id_match = re.search(r'txid:([a-f0-9]+)', result.stdout)
            if tx_id_match:
                return tx_id_match.group(1)
            
            return "success"
            
        except Exception as e:
            logger.error(f"Failed to invoke chaincode: {str(e)}")
            raise

    def _query_chaincode(
        self,
        function: str,
        args: List[str]
    ) -> Any:
        if self.use_mock:
            return self._mock_query(function, args)
        
        try:
            cmd = [
                "docker", "exec", "cli",
                "peer", "chaincode", "query",
                "-C", self.channel_name,
                "-n", self.chaincode_name,
                "-c", json.dumps({"function": function, "Args": args})
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                logger.error(f"Chaincode query failed: {result.stderr}")
                raise Exception(f"Chaincode query failed: {result.stderr}")
            
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return result.stdout.strip()
            
        except Exception as e:
            logger.error(f"Failed to query chaincode: {str(e)}")
            raise

    def _mock_invoke(self, function: str, args: List[str]) -> str:
        import hashlib
        mock_data = f"{function}:{':'.join(args)}"
        return hashlib.sha256(mock_data.encode()).hexdigest()

    def _mock_query(self, function: str, args: List[str]) -> Any:
        if function == "VerifyCredential":
            credential_id = args[0]
            return {
                "credentialId": credential_id,
                "status": "active",
                "blockchainHash": self._mock_invoke(function, args)
            }
        elif function == "GetCredentialsByRecipient":
            return []
        elif function == "GetCredentialHistory":
            return []
        return None

    def issue_credential(self, credential_data: Dict[str, Any]) -> str:
        credential_json = json.dumps(credential_data)
        
        try:
            tx_id = self._invoke_chaincode("IssueCredential", [credential_json])
            logger.info(f"Credential issued on blockchain: {tx_id}")
            return tx_id
        except Exception as e:
            logger.error(f"Failed to issue credential on blockchain: {str(e)}")
            raise

    def verify_credential(self, credential_id: str) -> Optional[Dict[str, Any]]:
        try:
            result = self._query_chaincode("VerifyCredential", [credential_id])
            
            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except json.JSONDecodeError:
                    return None
            
            return result
        except Exception as e:
            logger.error(f"Failed to verify credential on blockchain: {str(e)}")
            return None

    def revoke_credential(
        self,
        credential_id: str,
        revoked_by: str,
        reason: str
    ) -> str:
        try:
            tx_id = self._invoke_chaincode(
                "RevokeCredential",
                [credential_id, revoked_by, reason]
            )
            logger.info(f"Credential revoked on blockchain: {tx_id}")
            return tx_id
        except Exception as e:
            logger.error(f"Failed to revoke credential on blockchain: {str(e)}")
            raise

    def get_credentials_by_recipient(self, recipient_id: str) -> List[Dict[str, Any]]:
        try:
            result = self._query_chaincode("GetCredentialsByRecipient", [recipient_id])
            
            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except json.JSONDecodeError:
                    return []
            
            if not isinstance(result, list):
                return []
            
            return result
        except Exception as e:
            logger.error(f"Failed to get credentials from blockchain: {str(e)}")
            return []

    def get_credential_history(self, credential_id: str) -> List[Dict[str, Any]]:
        try:
            result = self._query_chaincode("GetCredentialHistory", [credential_id])
            
            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except json.JSONDecodeError:
                    return []
            
            if not isinstance(result, list):
                return []
            
            return result
        except Exception as e:
            logger.error(f"Failed to get credential history from blockchain: {str(e)}")
            return []

    def check_network_status(self) -> Dict[str, Any]:
        if self.use_mock:
            return {
                "status": "mock",
                "message": "Using mock blockchain service"
            }
        
        try:
            cmd = ["docker", "ps", "--filter", "name=peer0.education.credentials.com", "--format", "{{.Status}}"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0 and result.stdout.strip():
                return {
                    "status": "running",
                    "message": "Blockchain network is running"
                }
            else:
                return {
                    "status": "stopped",
                    "message": "Blockchain network is not running"
                }
        except Exception as e:
            logger.error(f"Failed to check network status: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
