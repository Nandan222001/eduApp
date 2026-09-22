import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.user import User


@pytest.mark.integration
class TestMerchandiseAPI:
    """Integration tests for /api/v1/merchandise/*, the real, mounted
    router (src/api/v1/merchandise.py) backed by
    src/models/merchandise.py and src/services/merchandise_service.py
    (both written this session, see TESTING_PROGRESS.md's "merchandise"
    router fix). Payment initiation (Razorpay) and mockup generation via
    a configured Printful key both require real external network calls
    not available in this test environment -- not exercised end-to-end
    here, except mockup generation's deterministic 501 "not configured"
    fallback path."""

    def test_create_and_get_item(self, client: TestClient, auth_headers: dict, institution: Institution):
        response = client.post(
            "/api/v1/merchandise/items",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "item_name": "School Hoodie",
                "category": "apparel",
                "base_price": "29.99",
                "size_options": ["S", "M", "L"],
                "color_options": ["navy", "grey"],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["item_name"] == "School Hoodie"
        assert data["base_price"] == "29.99"
        item_id = data["id"]

        response = client.get(f"/api/v1/merchandise/items/{item_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["item_name"] == "School Hoodie"

    def test_create_item_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other_institution = Institution(name="Other School", is_active=True)
        db_session.add(other_institution)
        db_session.commit()
        db_session.refresh(other_institution)

        response = client.post(
            "/api/v1/merchandise/items",
            headers=auth_headers,
            json={
                "institution_id": other_institution.id,
                "item_name": "Contraband Mug",
                "category": "accessories",
                "base_price": "9.99",
            },
        )
        assert response.status_code == 403

    def test_list_items(self, client: TestClient, auth_headers: dict, institution: Institution):
        client.post(
            "/api/v1/merchandise/items",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "item_name": "Water Bottle",
                "category": "accessories",
                "base_price": "12.50",
            },
        )

        response = client.get("/api/v1/merchandise/items", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(i["item_name"] == "Water Bottle" for i in data["items"])

    def test_update_and_delete_item(self, client: TestClient, auth_headers: dict, institution: Institution):
        create = client.post(
            "/api/v1/merchandise/items",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "item_name": "Backpack",
                "category": "school_supplies",
                "base_price": "45.00",
            },
        )
        item_id = create.json()["id"]

        response = client.put(
            f"/api/v1/merchandise/items/{item_id}",
            headers=auth_headers,
            json={"base_price": "39.99"},
        )
        assert response.status_code == 200
        assert response.json()["base_price"] == "39.99"

        response = client.delete(f"/api/v1/merchandise/items/{item_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/merchandise/items/{item_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_get_nonexistent_item(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/merchandise/items/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_mockup_generation_without_printful_configured(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        create = client.post(
            "/api/v1/merchandise/items",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "item_name": "Custom Tee",
                "category": "apparel",
                "base_price": "19.99",
            },
        )
        item_id = create.json()["id"]

        response = client.post(
            "/api/v1/merchandise/mockups/generate",
            headers=auth_headers,
            json={"merchandise_item_id": item_id},
        )
        # No Printful API key configured in tests -> the service raises a
        # clean 501, not an unhandled 500.
        assert response.status_code == 501

    def test_create_order_and_list_and_track(
        self, client: TestClient, auth_headers: dict, admin_user: User, institution: Institution
    ):
        item = client.post(
            "/api/v1/merchandise/items",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "item_name": "Class of 2026 Mug",
                "category": "accessories",
                "base_price": "15.00",
            },
        ).json()

        response = client.post(
            "/api/v1/merchandise/orders",
            headers=auth_headers,
            json={
                "buyer_name": f"{admin_user.first_name} {admin_user.last_name}",
                "buyer_email": admin_user.email,
                "shipping_address": {
                    "shipping_name": admin_user.first_name,
                    "shipping_address_line1": "123 Main St",
                    "shipping_city": "Springfield",
                    "shipping_state": "IL",
                    "shipping_postal_code": "62704",
                },
                "items": [
                    {"merchandise_item_id": item["id"], "quantity": 2}
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["order_status"] == "pending"
        assert data["payment_status"] == "pending"
        # 2 x 15.00 = 30.00 subtotal, 18% GST tax, free shipping over 1000
        # is not hit so flat 100.00 shipping applies (see calculate_order_totals)
        assert float(data["subtotal"]) == 30.00
        assert float(data["shipping_cost"]) == 100.00
        order_number = data["order_number"]
        order_id = data["id"]

        response = client.get("/api/v1/merchandise/orders", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

        response = client.get(f"/api/v1/merchandise/orders/{order_id}", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["items"]) == 1

        response = client.get(f"/api/v1/merchandise/orders/{order_number}/track", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["order_status"] == "pending"

    def test_update_order_status(
        self, client: TestClient, auth_headers: dict, admin_user: User, institution: Institution
    ):
        item = client.post(
            "/api/v1/merchandise/items",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "item_name": "Cap",
                "category": "apparel",
                "base_price": "10.00",
            },
        ).json()

        order = client.post(
            "/api/v1/merchandise/orders",
            headers=auth_headers,
            json={
                "buyer_name": "Test Buyer",
                "buyer_email": "buyer@test.com",
                "shipping_address": {
                    "shipping_name": "Test Buyer",
                    "shipping_address_line1": "1 Test St",
                    "shipping_city": "Testville",
                    "shipping_state": "TS",
                    "shipping_postal_code": "00000",
                },
                "items": [{"merchandise_item_id": item["id"], "quantity": 1}],
            },
        ).json()

        response = client.put(
            f"/api/v1/merchandise/orders/{order['id']}",
            headers=auth_headers,
            json={"order_status": "shipped", "tracking_number": "TRACK123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["order_status"] == "shipped"
        assert data["tracking_number"] == "TRACK123"
        assert data["shipped_at"] is not None

    def test_commission_report(self, client: TestClient, auth_headers: dict):
        response = client.get(
            "/api/v1/merchandise/admin/commission-report",
            headers=auth_headers,
            params={"days": 30},
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert data["currency"] == "INR"
