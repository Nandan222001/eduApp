def test_create_user(client):
    response = client.post(
        "/api/v1/users/",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data


def test_get_user(client):
    create_response = client.post(
        "/api/v1/users/",
        json={
            "email": "test2@example.com",
            "username": "testuser2",
            "password": "testpassword123",
        },
    )
    user_id = create_response.json()["id"]

    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "test2@example.com"


def test_get_nonexistent_user(client):
    response = client.get("/api/v1/users/9999")
    assert response.status_code == 404
