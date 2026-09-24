"""Integration tests for the `chatbot` router (src/api/v1/chatbot.py).

This router is a deliberately simple, rule-based (keyword-matching) chatbot
with no database persistence -- `POST /chatbot/message`, `POST
/chatbot/upload-image`, `POST /chatbot/voice-to-text`, `GET
/chatbot/history`, `GET /chatbot/suggestions`, `DELETE /chatbot/history` all
return canned/templated responses rather than reading or writing real
tables. Every endpoint already had a real `Depends(get_current_user)`. Since
there is no ORM code, no service layer, and no database access at all in
this file, none of the 14 tracked bug classes apply (there is nothing async,
no query, no model, no Decimal, no JWT-minting, no route-shadowing risk --
every path here is a distinct literal). Tests below simply confirm auth is
enforced everywhere and the canned responses behave as documented.
"""


BASE = "/api/v1/chatbot"


class TestSendMessage:
    def test_requires_auth(self, client):
        response = client.post(f"{BASE}/message", json={"message": "hello"})
        assert response.status_code == 403

    def test_homework_keyword(self, client, auth_headers):
        response = client.post(
            f"{BASE}/message", json={"message": "I need homework help"}, headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert "homework" in body["message"].lower()
        assert len(body["suggestions"]) > 0
        assert "timestamp" in body["metadata"]

    def test_exam_keyword(self, client, auth_headers):
        response = client.post(
            f"{BASE}/message", json={"message": "what is my exam schedule"}, headers=auth_headers
        )
        assert response.status_code == 200
        assert "exam" in response.json()["message"].lower()

    def test_grade_keyword(self, client, auth_headers):
        response = client.post(
            f"{BASE}/message", json={"message": "show my grades"}, headers=auth_headers
        )
        assert response.status_code == 200
        assert "grade" in response.json()["message"].lower() or "performance" in response.json()["message"].lower()

    def test_image_context_with_extracted_text(self, client, auth_headers):
        response = client.post(
            f"{BASE}/message",
            json={
                "message": "look at this",
                "context": {"hasImage": True, "extractedText": "2x + 3 = 7"},
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert "2x + 3 = 7" in response.json()["message"]

    def test_fallback_response(self, client, auth_headers):
        response = client.post(
            f"{BASE}/message", json={"message": "gibberish unrelated text"}, headers=auth_headers
        )
        assert response.status_code == 200
        assert "here to help" in response.json()["message"].lower()

    def test_missing_message_field_rejected(self, client, auth_headers):
        response = client.post(f"{BASE}/message", json={}, headers=auth_headers)
        assert response.status_code == 422


class TestUploadImage:
    def test_requires_auth(self, client):
        files = {"image": ("test.png", b"fakeimagebytes", "image/png")}
        response = client.post(f"{BASE}/upload-image", files=files)
        assert response.status_code == 403

    def test_rejects_non_image(self, client, auth_headers):
        files = {"image": ("test.txt", b"not an image", "text/plain")}
        response = client.post(f"{BASE}/upload-image", files=files, headers=auth_headers)
        assert response.status_code == 400

    def test_accepts_image(self, client, auth_headers):
        files = {"image": ("test.png", b"fakeimagebytes", "image/png")}
        response = client.post(f"{BASE}/upload-image", files=files, headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["imageUrl"].startswith("/uploads/chatbot/")
        assert body["extractedText"]
        assert body["analysis"]


class TestVoiceToText:
    def test_requires_auth(self, client):
        files = {"audio": ("test.wav", b"fakeaudiobytes", "audio/wav")}
        response = client.post(f"{BASE}/voice-to-text", files=files)
        assert response.status_code == 403

    def test_transcribes(self, client, auth_headers):
        files = {"audio": ("test.wav", b"fakeaudiobytes", "audio/wav")}
        response = client.post(f"{BASE}/voice-to-text", files=files, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["text"]


class TestHistory:
    def test_get_history_requires_auth(self, client):
        response = client.get(f"{BASE}/history")
        assert response.status_code == 403

    def test_get_history_returns_sample_conversations(self, client, auth_headers):
        response = client.get(f"{BASE}/history", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 2
        assert all("id" in item and "title" in item for item in body)

    def test_clear_history_requires_auth(self, client):
        response = client.delete(f"{BASE}/history")
        assert response.status_code == 403

    def test_clear_history(self, client, auth_headers):
        response = client.delete(f"{BASE}/history", headers=auth_headers)
        assert response.status_code == 200
        assert "message" in response.json()


class TestSuggestions:
    def test_requires_auth(self, client):
        response = client.get(f"{BASE}/suggestions", params={"page": "/student/dashboard"})
        assert response.status_code == 403

    def test_known_page_returns_specific_suggestions(self, client, auth_headers):
        response = client.get(
            f"{BASE}/suggestions", params={"page": "/student/dashboard"}, headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert "What are my assignments today?" in body

    def test_unknown_page_returns_default_suggestions(self, client, auth_headers):
        response = client.get(
            f"{BASE}/suggestions", params={"page": "/some/unknown/page"}, headers=auth_headers
        )
        assert response.status_code == 200
        assert "How can I help you today?" in response.json()

    def test_missing_page_param_rejected(self, client, auth_headers):
        response = client.get(f"{BASE}/suggestions", headers=auth_headers)
        assert response.status_code == 422
