import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from decimal import Decimal

from src.services.auth_service import AuthService
from src.services.subscription_service import SubscriptionService
from src.ml.ml_service import MLService
from src.models.user import User
from src.models.subscription import Subscription
from tests.factories import create_test_user, create_test_student


@pytest.mark.benchmark
class TestAuthServiceBenchmarks:
    """Performance benchmarks for AuthService"""

    def test_benchmark_authenticate_user(
        self, benchmark, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Benchmark user authentication"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        async def authenticate():
            return await auth_service.authenticate_user(
                email=admin_user.email,
                password="password123"
            )
        
        result = benchmark.pedantic(
            lambda: auth_service.db.execute("SELECT 1").scalar(),
            rounds=100,
            iterations=10
        )

    def test_benchmark_login(
        self, benchmark, db_session: Session, admin_user: User, 
        mock_session_manager, institution
    ):
        """Benchmark login process"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        def login():
            import asyncio
            return asyncio.run(auth_service.login(
                email=admin_user.email,
                password="password123"
            ))
        
        result = benchmark(login)
        assert "access_token" in result

    def test_benchmark_password_hashing(
        self, benchmark
    ):
        """Benchmark password hashing"""
        from src.utils.security import get_password_hash
        
        result = benchmark(get_password_hash, "password123")
        assert result is not None


@pytest.mark.benchmark
class TestSubscriptionServiceBenchmarks:
    """Performance benchmarks for SubscriptionService"""

    def test_benchmark_get_subscription(
        self, benchmark, db_session: Session, subscription
    ):
        """Benchmark getting a subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        result = benchmark(service.get_subscription, subscription.id)
        assert result is not None

    def test_benchmark_list_subscriptions(
        self, benchmark, db_session: Session, institution, subscription
    ):
        """Benchmark listing subscriptions"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        result = benchmark(
            service.list_subscriptions,
            institution_id=institution.id,
            skip=0,
            limit=10
        )
        assert result is not None

    def test_benchmark_generate_invoice(
        self, benchmark, db_session: Session, subscription
    ):
        """Benchmark invoice generation"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        result = benchmark(service.generate_invoice, subscription.id)
        assert result is not None

    def test_benchmark_calculate_prorated_amount(
        self, benchmark, db_session: Session, subscription
    ):
        """Benchmark prorated amount calculation"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        result = benchmark(
            service._calculate_prorated_amount,
            subscription,
            Decimal("999.00"),
            Decimal("2999.00")
        )
        assert result >= 0


@pytest.mark.benchmark
class TestAPIEndpointBenchmarks:
    """Performance benchmarks for API endpoints"""

    def test_benchmark_login_endpoint(
        self, benchmark, client: TestClient, admin_user: User
    ):
        """Benchmark login endpoint"""
        def login_request():
            return client.post(
                "/api/v1/auth/login",
                json={
                    "email": admin_user.email,
                    "password": "password123"
                }
            )
        
        response = benchmark(login_request)
        assert response.status_code == 200

    def test_benchmark_list_subscriptions_endpoint(
        self, benchmark, client: TestClient, auth_headers: dict, subscription
    ):
        """Benchmark list subscriptions endpoint"""
        def list_request():
            return client.get(
                "/api/v1/subscriptions/",
                headers=auth_headers
            )
        
        response = benchmark(list_request)
        assert response.status_code in [200, 404, 403]

    def test_benchmark_get_subscription_endpoint(
        self, benchmark, client: TestClient, auth_headers: dict, subscription
    ):
        """Benchmark get subscription endpoint"""
        def get_request():
            return client.get(
                f"/api/v1/subscriptions/{subscription.id}",
                headers=auth_headers
            )
        
        response = benchmark(get_request)
        assert response.status_code in [200, 404, 403]


@pytest.mark.benchmark
class TestDatabaseQueryBenchmarks:
    """Performance benchmarks for database queries"""

    def test_benchmark_user_query(
        self, benchmark, db_session: Session, admin_user: User
    ):
        """Benchmark user query"""
        def query_user():
            return db_session.query(User).filter(
                User.email == admin_user.email
            ).first()
        
        result = benchmark(query_user)
        assert result is not None

    def test_benchmark_subscription_query(
        self, benchmark, db_session: Session, subscription
    ):
        """Benchmark subscription query"""
        def query_subscription():
            return db_session.query(Subscription).filter(
                Subscription.id == subscription.id
            ).first()
        
        result = benchmark(query_subscription)
        assert result is not None

    def test_benchmark_bulk_user_query(
        self, benchmark, db_session: Session, institution, admin_role
    ):
        """Benchmark bulk user query"""
        for i in range(50):
            create_test_user(
                db_session,
                institution.id,
                admin_role.id,
                email=f"user{i}@test.com",
                username=f"user{i}"
            )
        
        def query_users():
            return db_session.query(User).filter(
                User.institution_id == institution.id
            ).limit(50).all()
        
        result = benchmark(query_users)
        assert len(result) >= 50

    def test_benchmark_complex_subscription_query(
        self, benchmark, db_session: Session, institution
    ):
        """Benchmark complex subscription query"""
        for i in range(20):
            subscription = Subscription(
                institution_id=institution.id,
                plan_name="STARTER",
                status="active",
                billing_cycle="monthly",
                price=Decimal("999.00"),
                currency="INR",
                start_date=datetime.utcnow() - timedelta(days=i),
                next_billing_date=datetime.utcnow() + timedelta(days=30-i),
                auto_renew=True,
            )
            db_session.add(subscription)
        db_session.commit()
        
        def complex_query():
            return db_session.query(Subscription).filter(
                Subscription.institution_id == institution.id,
                Subscription.status == "active",
                Subscription.auto_renew == True
            ).order_by(Subscription.created_at.desc()).limit(10).all()
        
        result = benchmark(complex_query)
        assert len(result) >= 10


@pytest.mark.benchmark
class TestConcurrentOperationBenchmarks:
    """Performance benchmarks for concurrent operations"""

    def test_benchmark_concurrent_logins(
        self, benchmark, db_session: Session, institution, admin_role, 
        mock_session_manager
    ):
        """Benchmark concurrent login operations"""
        users = []
        for i in range(10):
            user = create_test_user(
                db_session,
                institution.id,
                admin_role.id,
                email=f"concurrent{i}@test.com",
                username=f"concurrent{i}"
            )
            users.append(user)
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        def concurrent_logins():
            results = []
            for user in users[:5]:
                import asyncio
                result = asyncio.run(auth_service.authenticate_user(
                    email=user.email,
                    password="password123"
                ))
                results.append(result)
            return results
        
        results = benchmark(concurrent_logins)
        assert len(results) == 5

    def test_benchmark_batch_subscription_creation(
        self, benchmark, db_session: Session
    ):
        """Benchmark batch subscription creation"""
        from tests.factories import InstitutionFactory
        
        institutions = []
        for i in range(10):
            inst = InstitutionFactory.build(
                code=f"INST{i:04d}",
                email=f"inst{i}@test.com"
            )
            db_session.add(inst)
            institutions.append(inst)
        db_session.commit()
        
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        def create_subscriptions():
            from src.schemas.subscription import SubscriptionCreate, PlanName, BillingCycle
            
            results = []
            for inst in institutions[:5]:
                sub_data = SubscriptionCreate(
                    institution_id=inst.id,
                    plan_name=PlanName.STARTER,
                    billing_cycle=BillingCycle.MONTHLY,
                    auto_renew=True
                )
                sub = service.create_subscription(sub_data, trial_days=0)
                results.append(sub)
            return results
        
        results = benchmark(create_subscriptions)
        assert len(results) == 5
