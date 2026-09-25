"""Integration tests for the `question_nlp` router (src/api/v1/question_nlp.py).

NLP tooling over the question bank: sentence-embedding generation (single
and batch), cosine-similarity search/scoring, HDBSCAN-based clustering,
rule-based question variation generation (paraphrase/difficulty/bloom-level
adjustment) with verification, and a keyword-heuristic Bloom's-taxonomy
classifier (single/batch/persist). Every endpoint already correctly
declared `Depends(get_current_user)` -- no missing-auth bug here.

Bug found and fixed while writing this coverage:

1. **`QuestionNLPService.cluster_questions`'s `insufficient_data`
   early-return omitted the `noise_points`/`cluster_ids` fields its own
   `ClusteringResponse` schema requires as non-`Optional`** (schema/service
   drift). Unlike the routers audited elsewhere this session, this
   endpoint calls the service directly with no `try/except` around it at
   all, so the resulting `pydantic.ValidationError` during response
   serialization wasn't turned into a clean 4xx -- it propagated as an
   unhandled `ResponseValidationError`, a real 500 for every
   `POST /clustering/cluster` call where the grade/subject didn't yet have
   `min_cluster_size` questions, which is the common case for a
   newly-populated question bank. Fixed by adding
   `'noise_points': 0, 'cluster_ids': []` to that early-return dict.

Otherwise, this router and the three services it calls
(`question_nlp_service.py`, `bloom_taxonomy_classifier.py`,
`question_variation_service.py`) were read end-to-end plus
`src/schemas/nlp_schemas.py` and every `QuestionBank`/`QuestionEmbedding`/
`QuestionCluster`/`QuestionClusterMember`/`QuestionVariation` field they
reference against `src/models/previous_year_papers.py` -- no further drift,
no async/sync mismatch (all sync `Session` throughout), no
`func.count(...).filter()`, and `BloomTaxonomyClassifier.classify_question`
never touches its lazy `transformers` `pipeline` property at all (it's rule/
keyword-based), so no network access is needed at request time. The
`sentence-transformers` `all-MiniLM-L6-v2` model used for embeddings is
already cached locally in this environment (confirmed via
`SentenceTransformer(...)` loading in ~1-6s with no network calls) and
returns real 384-dim vectors, so the embedding/similarity/clustering tests
below exercise the real model rather than mocking it out.
"""
import uuid

import pytest

from src.models.previous_year_papers import QuestionBank


@pytest.fixture
def question_a(db_session, institution, grade, subject) -> QuestionBank:
    q = QuestionBank(
        institution_id=institution.id,
        question_text="What is the capital of France?",
        question_type="short_answer",
        grade_id=grade.id,
        subject_id=subject.id,
        difficulty_level="easy",
        bloom_taxonomy_level="remember",
        marks=2,
    )
    db_session.add(q)
    db_session.commit()
    db_session.refresh(q)
    return q


@pytest.fixture
def question_b(db_session, institution, grade, subject) -> QuestionBank:
    q = QuestionBank(
        institution_id=institution.id,
        question_text="Name the capital city of France.",
        question_type="short_answer",
        grade_id=grade.id,
        subject_id=subject.id,
        difficulty_level="easy",
        bloom_taxonomy_level="remember",
        marks=2,
    )
    db_session.add(q)
    db_session.commit()
    db_session.refresh(q)
    return q


class TestEmbeddings:
    def test_generate_embedding(self, client, auth_headers, question_a):
        response = client.post(
            "/api/v1/question-nlp/embeddings/generate",
            params={"question_id": question_a.id},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["question_id"] == question_a.id
        assert data["embedding_dimension"] == 384
        assert data["embedding_model"] == "all-MiniLM-L6-v2"

    def test_generate_embedding_unknown_question_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/question-nlp/embeddings/generate",
            params={"question_id": 999999},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_generate_embedding_requires_auth(self, client, question_a):
        response = client.post(
            "/api/v1/question-nlp/embeddings/generate",
            params={"question_id": question_a.id},
        )
        assert response.status_code == 403

    def test_batch_generate_embeddings(self, client, auth_headers, question_a, question_b):
        response = client.post(
            "/api/v1/question-nlp/embeddings/batch-generate",
            json={"question_ids": [question_a.id, question_b.id], "batch_size": 32},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["status"] == "success"
        assert data["embeddings_generated"] == 2
        assert set(data["question_ids"]) == {question_a.id, question_b.id}


def _generate_embedding(client, auth_headers, question_id):
    response = client.post(
        "/api/v1/question-nlp/embeddings/generate",
        params={"question_id": question_id},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text


class TestSimilarity:
    def test_calculate_similarity_between_similar_questions(self, client, auth_headers, question_a, question_b):
        _generate_embedding(client, auth_headers, question_a.id)
        _generate_embedding(client, auth_headers, question_b.id)

        response = client.get(
            "/api/v1/question-nlp/similarity/calculate",
            params={"question_id1": question_a.id, "question_id2": question_b.id},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        # Both questions ask the same thing in different words -- expect a
        # high cosine similarity from the real sentence-transformer model.
        assert data["similarity_score"] > 0.5

    def test_calculate_similarity_missing_embeddings_404(self, client, auth_headers, question_a, question_b):
        response = client.get(
            "/api/v1/question-nlp/similarity/calculate",
            params={"question_id1": question_a.id, "question_id2": 999999},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_find_similar_questions(self, client, auth_headers, question_a, question_b):
        # find_similar_questions auto-generates the *source* question's
        # embedding on demand, but candidate questions are only matched
        # against QuestionEmbedding rows that already exist -- so
        # question_b needs its embedding generated up front too.
        _generate_embedding(client, auth_headers, question_b.id)

        response = client.post(
            "/api/v1/question-nlp/similarity/find",
            json={
                "question_id": question_a.id,
                "top_k": 5,
                "min_similarity": 0.3,
                "same_subject_only": True,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data) == 1
        assert data[0]["question_id"] == question_b.id

    def test_similarity_requires_auth(self, client, question_a, question_b):
        response = client.get(
            "/api/v1/question-nlp/similarity/calculate",
            params={"question_id1": question_a.id, "question_id2": question_b.id},
        )
        assert response.status_code == 403


class TestClustering:
    def test_cluster_questions_insufficient_data(self, client, auth_headers, question_a, question_b, grade, subject):
        response = client.post(
            "/api/v1/question-nlp/clustering/cluster",
            json={
                "grade_id": grade.id,
                "subject_id": subject.id,
                "min_cluster_size": 5,
                "min_samples": 3,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["status"] == "insufficient_data"
        assert data["total_questions"] == 2
        assert data["clusters_created"] == 0

    def test_get_cluster_info_unknown_404(self, client, auth_headers):
        response = client.get(
            "/api/v1/question-nlp/clustering/cluster/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_list_clusters_empty(self, client, auth_headers, grade, subject):
        response = client.get(
            "/api/v1/question-nlp/clustering/list",
            params={"grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []


class TestVariations:
    def test_generate_paraphrase_variation(self, client, auth_headers, question_a):
        response = client.post(
            "/api/v1/question-nlp/variations/generate",
            json={"question_id": question_a.id, "variation_types": ["paraphrase"]},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data) == 1
        assert data[0]["variation_type"] == "paraphrase"
        assert data[0]["original_question_id"] == question_a.id

    def test_generate_difficulty_variations(self, client, auth_headers, question_a):
        response = client.post(
            "/api/v1/question-nlp/variations/generate",
            json={
                "question_id": question_a.id,
                "variation_types": ["difficulty_easy", "difficulty_hard"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data) == 2
        assert {v["variation_type"] for v in data} == {"difficulty_adjusted"}

    def test_get_question_variations(self, client, auth_headers, question_a):
        client.post(
            "/api/v1/question-nlp/variations/generate",
            json={"question_id": question_a.id, "variation_types": ["paraphrase"]},
            headers=auth_headers,
        )
        response = client.get(
            f"/api/v1/question-nlp/variations/question/{question_a.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert len(response.json()) == 1

    def test_verify_variation(self, client, auth_headers, question_a):
        generate_response = client.post(
            "/api/v1/question-nlp/variations/generate",
            json={"question_id": question_a.id, "variation_types": ["paraphrase"]},
            headers=auth_headers,
        )
        variation_id = generate_response.json()[0]["id"]

        response = client.post(
            f"/api/v1/question-nlp/variations/{variation_id}/verify",
            params={"is_verified": True},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["is_verified"] is True

    def test_verify_unknown_variation_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/question-nlp/variations/999999/verify",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_variations_require_auth(self, client, question_a):
        response = client.post(
            "/api/v1/question-nlp/variations/generate",
            json={"question_id": question_a.id, "variation_types": ["paraphrase"]},
        )
        assert response.status_code == 403


class TestBloomTaxonomy:
    def test_classify_remember_level(self, client, auth_headers):
        response = client.post(
            "/api/v1/question-nlp/bloom-taxonomy/classify",
            json={"question_text": "Define photosynthesis."},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["predicted_level"] == "remember"

    def test_classify_create_level(self, client, auth_headers):
        response = client.post(
            "/api/v1/question-nlp/bloom-taxonomy/classify",
            json={"question_text": "Design and construct a new experiment to test this hypothesis."},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["predicted_level"] == "create"

    def test_update_question_bloom_level(self, client, auth_headers, question_a):
        response = client.post(
            f"/api/v1/question-nlp/bloom-taxonomy/update/{question_a.id}",
            params={"auto_classify": True},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["question_id"] == question_a.id
        assert data["status"] in ("updated", "confirmed")

    def test_update_bloom_level_unknown_question_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/question-nlp/bloom-taxonomy/update/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_batch_classify(self, client, auth_headers, question_a, question_b):
        response = client.post(
            "/api/v1/question-nlp/bloom-taxonomy/batch-classify",
            json={"question_ids": [question_a.id, question_b.id], "auto_update": False},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_processed"] == 2

    def test_classify_requires_auth(self, client):
        response = client.post(
            "/api/v1/question-nlp/bloom-taxonomy/classify",
            json={"question_text": "Define photosynthesis."},
        )
        assert response.status_code == 403
