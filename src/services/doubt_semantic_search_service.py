import json
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, text
from sentence_transformers import SentenceTransformer
import logging

from src.models.doubt import DoubtPost, DoubtEmbedding, SimilarDoubt
from src.models.academic import Subject, Chapter

logger = logging.getLogger(__name__)


class DoubtSemanticSearchService:
    def __init__(self):
        self.model_name = 'all-MiniLM-L6-v2'
        self.model = None
        self.embedding_dimension = 384
        
    def _load_model(self) -> SentenceTransformer:
        if self.model is None:
            try:
                self.model = SentenceTransformer(self.model_name)
                logger.info(f"Loaded sentence transformer model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise
        return self.model
    
    def generate_doubt_embedding(
        self,
        db: Session,
        doubt_id: int
    ) -> Optional[DoubtEmbedding]:
        doubt = db.query(DoubtPost).filter(DoubtPost.id == doubt_id).first()
        if not doubt:
            return None
        
        model = self._load_model()
        
        combined_text = f"{doubt.title} {doubt.description}"
        if doubt.tags:
            combined_text += " " + " ".join(doubt.tags)
        
        embedding_vector = model.encode(combined_text, convert_to_numpy=True)
        
        doubt_embedding = db.query(DoubtEmbedding).filter(
            DoubtEmbedding.doubt_id == doubt_id
        ).first()
        
        if doubt_embedding:
            doubt_embedding.embedding_vector = json.dumps(embedding_vector.tolist())
            doubt_embedding.embedding_dimension = len(embedding_vector)
            doubt_embedding.embedding_model = self.model_name
            doubt_embedding.updated_at = datetime.utcnow()
        else:
            doubt_embedding = DoubtEmbedding(
                doubt_id=doubt_id,
                embedding_model=self.model_name,
                embedding_vector=json.dumps(embedding_vector.tolist()),
                embedding_dimension=len(embedding_vector)
            )
            db.add(doubt_embedding)
        
        db.commit()
        db.refresh(doubt_embedding)
        
        return doubt_embedding
    
    def find_similar_doubts(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int,
        top_k: int = 10,
        similarity_threshold: float = 0.7,
        same_subject_only: bool = True
    ) -> List[Dict]:
        doubt = db.query(DoubtPost).filter(
            DoubtPost.id == doubt_id,
            DoubtPost.institution_id == institution_id
        ).first()
        
        if not doubt:
            return []
        
        doubt_embedding = db.query(DoubtEmbedding).filter(
            DoubtEmbedding.doubt_id == doubt_id
        ).first()
        
        if not doubt_embedding:
            doubt_embedding = self.generate_doubt_embedding(db, doubt_id)
            if not doubt_embedding:
                return []
        
        query_vector = np.array(json.loads(doubt_embedding.embedding_vector))
        
        query_filters = [
            DoubtPost.institution_id == institution_id,
            DoubtPost.id != doubt_id,
            DoubtEmbedding.doubt_id.isnot(None)
        ]
        
        if same_subject_only and doubt.subject_id:
            query_filters.append(DoubtPost.subject_id == doubt.subject_id)
        
        candidates = db.query(
            DoubtPost,
            DoubtEmbedding
        ).join(
            DoubtEmbedding,
            DoubtPost.id == DoubtEmbedding.doubt_id
        ).filter(
            and_(*query_filters)
        ).all()
        
        similarities = []
        for candidate_doubt, candidate_embedding in candidates:
            try:
                candidate_vector = np.array(json.loads(candidate_embedding.embedding_vector))
                
                cosine_similarity = np.dot(query_vector, candidate_vector) / (
                    np.linalg.norm(query_vector) * np.linalg.norm(candidate_vector)
                )
                
                if cosine_similarity >= similarity_threshold:
                    similarities.append({
                        'doubt_id': candidate_doubt.id,
                        'similarity_score': float(cosine_similarity),
                        'doubt': candidate_doubt
                    })
            except Exception as e:
                logger.warning(f"Error computing similarity for doubt {candidate_doubt.id}: {e}")
                continue
        
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        top_similar = similarities[:top_k]
        
        for similar in top_similar:
            existing = db.query(SimilarDoubt).filter(
                SimilarDoubt.doubt_id == doubt_id,
                SimilarDoubt.similar_doubt_id == similar['doubt_id']
            ).first()
            
            if existing:
                existing.similarity_score = similar['similarity_score']
                existing.semantic_similarity = similar['similarity_score']
            else:
                similar_doubt = SimilarDoubt(
                    doubt_id=doubt_id,
                    similar_doubt_id=similar['doubt_id'],
                    institution_id=institution_id,
                    similarity_score=similar['similarity_score'],
                    semantic_similarity=similar['similarity_score']
                )
                db.add(similar_doubt)
        
        db.commit()
        
        return top_similar
    
    def search_similar_by_text(
        self,
        db: Session,
        query_text: str,
        institution_id: int,
        subject_id: Optional[int] = None,
        top_k: int = 10,
        similarity_threshold: float = 0.6
    ) -> List[Dict]:
        model = self._load_model()
        query_vector = model.encode(query_text, convert_to_numpy=True)
        
        query_filters = [
            DoubtPost.institution_id == institution_id,
            DoubtEmbedding.doubt_id.isnot(None)
        ]
        
        if subject_id:
            query_filters.append(DoubtPost.subject_id == subject_id)
        
        candidates = db.query(
            DoubtPost,
            DoubtEmbedding
        ).join(
            DoubtEmbedding,
            DoubtPost.id == DoubtEmbedding.doubt_id
        ).filter(
            and_(*query_filters)
        ).all()
        
        similarities = []
        for candidate_doubt, candidate_embedding in candidates:
            try:
                candidate_vector = np.array(json.loads(candidate_embedding.embedding_vector))
                
                cosine_similarity = np.dot(query_vector, candidate_vector) / (
                    np.linalg.norm(query_vector) * np.linalg.norm(candidate_vector)
                )
                
                if cosine_similarity >= similarity_threshold:
                    similarities.append({
                        'doubt_id': candidate_doubt.id,
                        'similarity_score': float(cosine_similarity),
                        'doubt': candidate_doubt
                    })
            except Exception as e:
                logger.warning(f"Error computing similarity for doubt {candidate_doubt.id}: {e}")
                continue
        
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return similarities[:top_k]
    
    def batch_generate_embeddings(
        self,
        db: Session,
        institution_id: int,
        batch_size: int = 50
    ) -> Dict[str, int]:
        doubts_without_embeddings = db.query(DoubtPost).outerjoin(
            DoubtEmbedding,
            DoubtPost.id == DoubtEmbedding.doubt_id
        ).filter(
            DoubtPost.institution_id == institution_id,
            DoubtEmbedding.id.is_(None)
        ).limit(batch_size).all()
        
        model = self._load_model()
        
        successful = 0
        failed = 0
        
        for doubt in doubts_without_embeddings:
            try:
                combined_text = f"{doubt.title} {doubt.description}"
                if doubt.tags:
                    combined_text += " " + " ".join(doubt.tags)
                
                embedding_vector = model.encode(combined_text, convert_to_numpy=True)
                
                doubt_embedding = DoubtEmbedding(
                    doubt_id=doubt.id,
                    embedding_model=self.model_name,
                    embedding_vector=json.dumps(embedding_vector.tolist()),
                    embedding_dimension=len(embedding_vector)
                )
                db.add(doubt_embedding)
                successful += 1
            except Exception as e:
                logger.error(f"Failed to generate embedding for doubt {doubt.id}: {e}")
                failed += 1
                continue
        
        db.commit()
        
        return {
            'successful': successful,
            'failed': failed,
            'total_processed': successful + failed
        }
    
    def get_similar_answered_doubts(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int,
        top_k: int = 5
    ) -> List[Dict]:
        similar_doubts = self.find_similar_doubts(
            db, doubt_id, institution_id, top_k=top_k * 2, similarity_threshold=0.7
        )
        
        answered_doubts = []
        for similar in similar_doubts:
            doubt = similar['doubt']
            if doubt.status in ['answered', 'resolved'] and doubt.answer_count > 0:
                answers = doubt.answers[:3]
                answered_doubts.append({
                    'doubt_id': doubt.id,
                    'title': doubt.title,
                    'description': doubt.description,
                    'similarity_score': similar['similarity_score'],
                    'answer_count': doubt.answer_count,
                    'top_answers': [
                        {
                            'id': ans.id,
                            'content': ans.content,
                            'upvote_count': ans.upvote_count,
                            'is_accepted': ans.is_accepted
                        } for ans in answers
                    ]
                })
            
            if len(answered_doubts) >= top_k:
                break
        
        return answered_doubts
