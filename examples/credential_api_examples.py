"""
Blockchain Digital Credential System - API Usage Examples

This file contains Python examples for interacting with the credential API.
"""

import requests
from typing import List, Dict, Any
from datetime import datetime, timedelta


class CredentialAPIClient:
    """Client for interacting with the Credential API"""
    
    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def issue_certificate(
        self,
        recipient_id: int,
        title: str,
        description: str = None,
        sub_type: str = "academic",
        skills: List[str] = None,
        grade: str = None,
        score: int = None,
        expires_at: datetime = None
    ) -> Dict[str, Any]:
        """Issue an academic certificate"""
        data = {
            "recipient_id": recipient_id,
            "credential_type": "certificate",
            "sub_type": sub_type,
            "title": title,
            "description": description,
            "skills": skills or [],
            "grade": grade,
            "score": score
        }
        
        if expires_at:
            data["expires_at"] = expires_at.isoformat()
        
        response = requests.post(
            f"{self.base_url}/api/v1/credentials/",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def issue_badge(
        self,
        recipient_id: int,
        title: str,
        description: str = None,
        sub_type: str = "skill_based",
        skills: List[str] = None
    ) -> Dict[str, Any]:
        """Issue a digital badge"""
        data = {
            "recipient_id": recipient_id,
            "credential_type": "digital_badge",
            "sub_type": sub_type,
            "title": title,
            "description": description,
            "skills": skills or []
        }
        
        response = requests.post(
            f"{self.base_url}/api/v1/credentials/",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def bulk_issue_credentials(
        self,
        recipient_ids: List[int],
        credential_type: str,
        sub_type: str,
        title: str,
        description: str = None,
        skills: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Issue credentials to multiple recipients"""
        data = {
            "recipient_ids": recipient_ids,
            "credential_type": credential_type,
            "sub_type": sub_type,
            "title": title,
            "description": description,
            "skills": skills or []
        }
        
        response = requests.post(
            f"{self.base_url}/api/v1/credentials/bulk",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_my_credentials(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get credentials issued to the current user"""
        response = requests.get(
            f"{self.base_url}/api/v1/credentials/my-credentials",
            params={"skip": skip, "limit": limit},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_credential_details(self, credential_id: int) -> Dict[str, Any]:
        """Get detailed information about a credential"""
        response = requests.get(
            f"{self.base_url}/api/v1/credentials/{credential_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def create_share_link(
        self,
        credential_id: int,
        recipient_email: str = None,
        recipient_name: str = None,
        expires_at: datetime = None
    ) -> Dict[str, Any]:
        """Create a shareable link for a credential"""
        data = {
            "recipient_email": recipient_email,
            "recipient_name": recipient_name
        }
        
        if expires_at:
            data["expires_at"] = expires_at.isoformat()
        
        response = requests.post(
            f"{self.base_url}/api/v1/credentials/{credential_id}/share",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def revoke_credential(
        self,
        credential_id: int,
        reason: str
    ) -> Dict[str, Any]:
        """Revoke a credential"""
        data = {"reason": reason}
        
        response = requests.post(
            f"{self.base_url}/api/v1/credentials/{credential_id}/revoke",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get credential statistics for the institution"""
        response = requests.get(
            f"{self.base_url}/api/v1/credentials/statistics",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    @staticmethod
    def verify_credential_public(
        base_url: str,
        certificate_number: str
    ) -> Dict[str, Any]:
        """Publicly verify a credential (no authentication required)"""
        response = requests.get(
            f"{base_url}/api/v1/verify/certificate/{certificate_number}"
        )
        response.raise_for_status()
        return response.json()
    
    @staticmethod
    def batch_verify_credentials(
        base_url: str,
        certificate_numbers: List[str]
    ) -> Dict[str, Any]:
        """Batch verify multiple credentials (employer portal)"""
        data = {"certificate_numbers": certificate_numbers}
        
        response = requests.post(
            f"{base_url}/api/v1/employer/verify/batch",
            json=data
        )
        response.raise_for_status()
        return response.json()


# Example Usage Scenarios

def example_issue_course_completion_certificate():
    """Example: Issue a course completion certificate"""
    client = CredentialAPIClient(
        base_url="http://localhost:8000",
        auth_token="your_jwt_token_here"
    )
    
    credential = client.issue_certificate(
        recipient_id=123,
        title="Advanced Python Programming",
        description="Successfully completed 12-week advanced Python programming course",
        sub_type="academic",
        skills=["Python", "Django", "FastAPI", "SQLAlchemy", "Testing"],
        grade="A+",
        score=95,
        expires_at=datetime.now() + timedelta(days=365*5)  # 5 years
    )
    
    print(f"Certificate issued!")
    print(f"Certificate Number: {credential['certificate_number']}")
    print(f"Verification URL: {credential['verification_url']}")
    print(f"QR Code: {credential['qr_code_url'][:50]}...")  # base64 encoded
    print(f"Blockchain Hash: {credential['blockchain_hash']}")


def example_issue_skill_badge():
    """Example: Issue a skill-based badge"""
    client = CredentialAPIClient(
        base_url="http://localhost:8000",
        auth_token="your_jwt_token_here"
    )
    
    badge = client.issue_badge(
        recipient_id=123,
        title="FastAPI Expert",
        description="Demonstrated expert-level proficiency in FastAPI framework",
        sub_type="skill_based",
        skills=["FastAPI", "REST API", "Async Programming", "Pydantic"]
    )
    
    print(f"Badge issued!")
    print(f"Certificate Number: {badge['certificate_number']}")
    print(f"Verification URL: {badge['verification_url']}")


def example_bulk_issue_participation_badges():
    """Example: Bulk issue participation badges for an event"""
    client = CredentialAPIClient(
        base_url="http://localhost:8000",
        auth_token="your_jwt_token_here"
    )
    
    # List of student IDs who participated
    participant_ids = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
    
    credentials = client.bulk_issue_credentials(
        recipient_ids=participant_ids,
        credential_type="digital_badge",
        sub_type="participation",
        title="Annual Tech Fest 2024 Participant",
        description="Participated in Annual Tech Fest 2024 - 3-day technology conference"
    )
    
    print(f"Issued {len(credentials)} participation badges")
    for cred in credentials:
        print(f"- {cred['certificate_number']}")


def example_share_credential_with_employer():
    """Example: Share credential with an employer"""
    client = CredentialAPIClient(
        base_url="http://localhost:8000",
        auth_token="your_jwt_token_here"
    )
    
    # Create a share link valid for 30 days
    share = client.create_share_link(
        credential_id=456,
        recipient_email="hr@techcorp.com",
        recipient_name="TechCorp HR Department",
        expires_at=datetime.now() + timedelta(days=30)
    )
    
    print(f"Share link created!")
    print(f"Share URL: {share['share_url']}")
    print(f"Valid until: {share['expires_at']}")
    print(f"Share token: {share['share_token']}")


def example_employer_verify_credential():
    """Example: Employer verifying a credential"""
    cert_number = "CERT-1-20240314120000-ABC12345"
    
    result = CredentialAPIClient.verify_credential_public(
        base_url="http://localhost:8000",
        certificate_number=cert_number
    )
    
    if result['valid']:
        print("✓ Credential is VALID")
        print(f"Recipient: {result['credential']['recipient_name']}")
        print(f"Title: {result['credential']['title']}")
        print(f"Issued: {result['credential']['issued_at']}")
        print(f"Institution: {result['credential']['institution_name']}")
        print(f"Blockchain Verified: {result['blockchain_verified']}")
    else:
        print("✗ Credential is INVALID")
        print(f"Reason: {result['message']}")


def example_employer_batch_verification():
    """Example: Employer batch verifying multiple credentials"""
    certificate_numbers = [
        "CERT-1-20240314120000-ABC12345",
        "CERT-1-20240314120001-DEF67890",
        "CERT-1-20240314120002-GHI24680"
    ]
    
    results = CredentialAPIClient.batch_verify_credentials(
        base_url="http://localhost:8000",
        certificate_numbers=certificate_numbers
    )
    
    print(f"Verified {results['total']} credentials:")
    for result in results['results']:
        status = "✓ VALID" if result['valid'] else "✗ INVALID"
        print(f"{status} - {result['certificate_number']}")
        if result['valid']:
            print(f"  Blockchain: {'✓' if result['blockchain_verified'] else '✗'}")


def example_get_my_credentials():
    """Example: Student retrieving their credentials"""
    client = CredentialAPIClient(
        base_url="http://localhost:8000",
        auth_token="your_jwt_token_here"
    )
    
    credentials = client.get_my_credentials()
    
    print(f"You have {len(credentials)} credentials:")
    for cred in credentials:
        print(f"\n{cred['credential_type'].upper()}: {cred['title']}")
        print(f"  Type: {cred['sub_type']}")
        print(f"  Issued: {cred['issued_at']}")
        print(f"  Status: {cred['status']}")
        print(f"  Certificate #: {cred['certificate_number']}")
        if cred['skills']:
            print(f"  Skills: {', '.join(cred['skills'])}")


def example_get_institution_statistics():
    """Example: Get credential statistics for institution"""
    client = CredentialAPIClient(
        base_url="http://localhost:8000",
        auth_token="your_jwt_token_here"
    )
    
    stats = client.get_statistics()
    
    print("Credential Statistics:")
    print(f"Total Issued: {stats['total_issued']}")
    print(f"Active: {stats['active_credentials']}")
    print(f"Revoked: {stats['revoked_credentials']}")
    print(f"Expired: {stats['expired_credentials']}")
    print(f"Pending: {stats['pending_credentials']}")
    
    print("\nBy Type:")
    for cred_type, count in stats['by_type'].items():
        print(f"  {cred_type}: {count}")
    
    print("\nBy Sub-Type:")
    for sub_type, count in stats['by_subtype'].items():
        print(f"  {sub_type}: {count}")


def example_revoke_credential():
    """Example: Revoke a credential"""
    client = CredentialAPIClient(
        base_url="http://localhost:8000",
        auth_token="your_jwt_token_here"
    )
    
    revoked = client.revoke_credential(
        credential_id=789,
        reason="Credential was issued in error due to data entry mistake"
    )
    
    print(f"Credential revoked!")
    print(f"Revoked at: {revoked['revoked_at']}")
    print(f"Reason: {revoked['revoke_reason']}")
    print(f"Status: {revoked['status']}")


def example_degree_certificate_workflow():
    """Example: Complete workflow for issuing a degree certificate"""
    client = CredentialAPIClient(
        base_url="http://localhost:8000",
        auth_token="your_jwt_token_here"
    )
    
    # 1. Issue degree certificate
    print("Step 1: Issuing degree certificate...")
    degree = client.issue_certificate(
        recipient_id=123,
        title="Bachelor of Science in Computer Science",
        description="Conferred upon successful completion of all requirements for the degree",
        sub_type="academic",
        skills=[
            "Data Structures",
            "Algorithms",
            "Database Systems",
            "Operating Systems",
            "Software Engineering",
            "Computer Networks",
            "Artificial Intelligence"
        ],
        grade="3.8 GPA",
        score=95,
        expires_at=None  # Degrees don't expire
    )
    
    print(f"✓ Degree issued: {degree['certificate_number']}")
    
    # 2. Get credential details
    print("\nStep 2: Fetching credential details...")
    details = client.get_credential_details(degree['id'])
    print(f"✓ Recipient: {details['recipient_name']}")
    print(f"✓ Blockchain Hash: {details['blockchain_hash']}")
    
    # 3. Create share link for student to share with employers
    print("\nStep 3: Creating shareable link...")
    share = client.create_share_link(
        credential_id=degree['id'],
        expires_at=None  # No expiration
    )
    print(f"✓ Share URL: {share['share_url']}")
    
    # 4. Public verification (as employer would do)
    print("\nStep 4: Public verification...")
    verification = CredentialAPIClient.verify_credential_public(
        base_url="http://localhost:8000",
        certificate_number=degree['certificate_number']
    )
    print(f"✓ Valid: {verification['valid']}")
    print(f"✓ Blockchain Verified: {verification['blockchain_verified']}")


if __name__ == "__main__":
    # Run example workflows
    print("=" * 80)
    print("BLOCKCHAIN DIGITAL CREDENTIAL SYSTEM - API EXAMPLES")
    print("=" * 80)
    
    # Uncomment the examples you want to run:
    
    # example_issue_course_completion_certificate()
    # example_issue_skill_badge()
    # example_bulk_issue_participation_badges()
    # example_share_credential_with_employer()
    # example_employer_verify_credential()
    # example_employer_batch_verification()
    # example_get_my_credentials()
    # example_get_institution_statistics()
    # example_revoke_credential()
    # example_degree_certificate_workflow()
    
    print("\nUncomment the examples in the __main__ section to run them.")
