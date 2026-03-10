import json
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from sentence_transformers import SentenceTransformer
import hdbscan
from collections import Counter

from src.models.previous_year_papers import (
    QuestionBank,
    QuestionEmbedding,
    QuestionCluster,
    QuestionClusterMember,
    QuestionVariation,
    QuestionType,
    DifficultyLevel,
    BloomTaxonomyLevel
)


class QuestionNLPService:
    def __init__(self, db: Session, model_name: str = 'all-MiniLM-L6-v2'):
        self.db = db
        self.model_name = model_name
        self._model = None
    
    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
        return self._model
    
    def generate_embedding(self, question_id: int) -> Optional[QuestionEmbedding]:
        question = self.db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
        if not question:
            return None
        
        existing = self.db.query(QuestionEmbedding).filter(
            QuestionEmbedding.question_id == question_id
        ).first()
        
        if existing and existing.embedding_model == self.model_name:
            return existing
        
        embedding = self.model.encode(question.question_text)
        embedding_list = embedding.tolist()
        
        if existing:
            existing.embedding_vector = json.dumps(embedding_list)
            existing.embedding_model = self.model_name
            existing.embedding_dimension = len(embedding_list)
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            return existing
        else:
            question_embedding = QuestionEmbedding(
                question_id=question_id,
                embedding_model=self.model_name,
                embedding_vector=json.dumps(embedding_list),
                embedding_dimension=len(embedding_list)
            )
            self.db.add(question_embedding)
            self.db.commit()
            self.db.refresh(question_embedding)
            return question_embedding
    
    def batch_generate_embeddings(
        self,
        question_ids: List[int],
        batch_size: int = 32
    ) -> List[QuestionEmbedding]:
        results = []
        
        for i in range(0, len(question_ids), batch_size):
            batch_ids = question_ids[i:i + batch_size]
            
            questions = self.db.query(QuestionBank).filter(
                QuestionBank.id.in_(batch_ids)
            ).all()
            
            question_map = {q.id: q for q in questions}
            
            texts = [question_map[qid].question_text for qid in batch_ids if qid in question_map]
            embeddings = self.model.encode(texts, batch_size=batch_size)
            
            for idx, qid in enumerate(batch_ids):
                if qid not in question_map:
                    continue
                
                existing = self.db.query(QuestionEmbedding).filter(
                    QuestionEmbedding.question_id == qid
                ).first()
                
                embedding_list = embeddings[idx].tolist()
                
                if existing:
                    existing.embedding_vector = json.dumps(embedding_list)
                    existing.embedding_model = self.model_name
                    existing.embedding_dimension = len(embedding_list)
                    existing.updated_at = datetime.utcnow()
                    results.append(existing)
                else:
                    question_embedding = QuestionEmbedding(
                        question_id=qid,
                        embedding_model=self.model_name,
                        embedding_vector=json.dumps(embedding_list),
                        embedding_dimension=len(embedding_list)
                    )
                    self.db.add(question_embedding)
                    results.append(question_embedding)
            
            self.db.commit()
        
        return results
    
    def calculate_similarity(
        self,
        question_id1: int,
        question_id2: int
    ) -> Optional[float]:
        emb1 = self.db.query(QuestionEmbedding).filter(
            QuestionEmbedding.question_id == question_id1
        ).first()
        emb2 = self.db.query(QuestionEmbedding).filter(
            QuestionEmbedding.question_id == question_id2
        ).first()
        
        if not emb1 or not emb2:
            return None
        
        vec1 = np.array(json.loads(emb1.embedding_vector))
        vec2 = np.array(json.loads(emb2.embedding_vector))
        
        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
        return float(similarity)
    
    def find_similar_questions(
        self,
        question_id: int,
        top_k: int = 10,
        min_similarity: float = 0.7,
        same_subject_only: bool = True
    ) -> List[Dict[str, Any]]:
        question = self.db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
        if not question:
            return []
        
        emb = self.db.query(QuestionEmbedding).filter(
            QuestionEmbedding.question_id == question_id
        ).first()
        
        if not emb:
            emb = self.generate_embedding(question_id)
        
        if not emb:
            return []
        
        query = self.db.query(QuestionEmbedding, QuestionBank).join(
            QuestionBank, QuestionEmbedding.question_id == QuestionBank.id
        ).filter(
            QuestionEmbedding.question_id != question_id,
            QuestionEmbedding.embedding_model == self.model_name
        )
        
        if same_subject_only:
            query = query.filter(QuestionBank.subject_id == question.subject_id)
        
        candidates = query.all()
        
        target_vec = np.array(json.loads(emb.embedding_vector))
        similarities = []
        
        for candidate_emb, candidate_q in candidates:
            candidate_vec = np.array(json.loads(candidate_emb.embedding_vector))
            similarity = np.dot(target_vec, candidate_vec) / (
                np.linalg.norm(target_vec) * np.linalg.norm(candidate_vec)
            )
            
            if similarity >= min_similarity:
                similarities.append({
                    'question_id': candidate_q.id,
                    'question_text': candidate_q.question_text,
                    'similarity_score': float(similarity),
                    'difficulty_level': candidate_q.difficulty_level.value,
                    'bloom_taxonomy_level': candidate_q.bloom_taxonomy_level.value,
                    'question_type': candidate_q.question_type.value,
                    'marks': candidate_q.marks
                })
        
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        return similarities[:top_k]
    
    def cluster_questions(
        self,
        grade_id: int,
        subject_id: int,
        institution_id: int,
        min_cluster_size: int = 5,
        min_samples: int = 3
    ) -> Dict[str, Any]:
        questions = self.db.query(QuestionBank).filter(
            and_(
                QuestionBank.grade_id == grade_id,
                QuestionBank.subject_id == subject_id,
                QuestionBank.institution_id == institution_id,
                QuestionBank.is_active == True
            )
        ).all()
        
        if len(questions) < min_cluster_size:
            return {
                'status': 'insufficient_data',
                'total_questions': len(questions),
                'clusters_created': 0
            }
        
        question_ids = [q.id for q in questions]
        
        existing_embeddings = self.db.query(QuestionEmbedding).filter(
            QuestionEmbedding.question_id.in_(question_ids)
        ).all()
        
        existing_ids = {e.question_id for e in existing_embeddings}
        missing_ids = [qid for qid in question_ids if qid not in existing_ids]
        
        if missing_ids:
            self.batch_generate_embeddings(missing_ids)
        
        embeddings_records = self.db.query(QuestionEmbedding).filter(
            QuestionEmbedding.question_id.in_(question_ids)
        ).all()
        
        embedding_matrix = []
        question_id_map = []
        
        for emb in embeddings_records:
            embedding_matrix.append(json.loads(emb.embedding_vector))
            question_id_map.append(emb.question_id)
        
        embedding_matrix = np.array(embedding_matrix)
        
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=min_cluster_size,
            min_samples=min_samples,
            metric='euclidean'
        )
        cluster_labels = clusterer.fit_predict(embedding_matrix)
        
        self.db.query(QuestionCluster).filter(
            and_(
                QuestionCluster.institution_id == institution_id,
                QuestionCluster.grade_id == grade_id,
                QuestionCluster.subject_id == subject_id
            )
        ).delete()
        
        self.db.query(QuestionClusterMember).filter(
            QuestionClusterMember.question_id.in_(question_ids)
        ).delete()
        
        unique_clusters = set(cluster_labels)
        unique_clusters.discard(-1)
        
        cluster_objects = []
        
        for cluster_id in unique_clusters:
            cluster_mask = cluster_labels == cluster_id
            cluster_question_ids = [question_id_map[i] for i in range(len(cluster_labels)) if cluster_mask[i]]
            
            cluster_embeddings = embedding_matrix[cluster_mask]
            centroid = np.mean(cluster_embeddings, axis=0)
            
            cluster_questions = self.db.query(QuestionBank).filter(
                QuestionBank.id.in_(cluster_question_ids)
            ).all()
            
            difficulties = [q.difficulty_level.value for q in cluster_questions]
            bloom_levels = [q.bloom_taxonomy_level.value for q in cluster_questions]
            
            avg_difficulty = Counter(difficulties).most_common(1)[0][0] if difficulties else None
            dominant_bloom = Counter(bloom_levels).most_common(1)[0][0] if bloom_levels else None
            
            distances = [np.linalg.norm(cluster_embeddings[i] - centroid) 
                        for i in range(len(cluster_embeddings))]
            representative_idx = np.argmin(distances)
            representative_question_id = cluster_question_ids[representative_idx]
            
            cluster_obj = QuestionCluster(
                institution_id=institution_id,
                cluster_id=int(cluster_id),
                grade_id=grade_id,
                subject_id=subject_id,
                cluster_size=len(cluster_question_ids),
                representative_question_id=representative_question_id,
                centroid_vector=json.dumps(centroid.tolist()),
                avg_difficulty=avg_difficulty,
                dominant_bloom_level=dominant_bloom,
                clustering_algorithm='hdbscan',
                clustering_metadata=json.dumps({
                    'min_cluster_size': min_cluster_size,
                    'min_samples': min_samples,
                    'model': self.model_name
                })
            )
            
            self.db.add(cluster_obj)
            self.db.flush()
            
            cluster_objects.append(cluster_obj)
            
            for idx, qid in enumerate(cluster_question_ids):
                distance = distances[idx]
                
                member = QuestionClusterMember(
                    cluster_table_id=cluster_obj.id,
                    question_id=qid,
                    distance_to_centroid=float(distance),
                    similarity_score=1.0 / (1.0 + distance)
                )
                self.db.add(member)
        
        self.db.commit()
        
        return {
            'status': 'success',
            'total_questions': len(questions),
            'clusters_created': len(unique_clusters),
            'noise_points': int(np.sum(cluster_labels == -1)),
            'cluster_ids': [int(c) for c in unique_clusters]
        }
    
    def get_cluster_info(self, cluster_table_id: int) -> Optional[Dict[str, Any]]:
        cluster = self.db.query(QuestionCluster).filter(
            QuestionCluster.id == cluster_table_id
        ).first()
        
        if not cluster:
            return None
        
        members = self.db.query(QuestionClusterMember, QuestionBank).join(
            QuestionBank, QuestionClusterMember.question_id == QuestionBank.id
        ).filter(
            QuestionClusterMember.cluster_table_id == cluster_table_id
        ).all()
        
        return {
            'cluster_id': cluster.cluster_id,
            'cluster_label': cluster.cluster_label,
            'cluster_size': cluster.cluster_size,
            'representative_question_id': cluster.representative_question_id,
            'avg_difficulty': cluster.avg_difficulty,
            'dominant_bloom_level': cluster.dominant_bloom_level,
            'members': [
                {
                    'question_id': member.question_id,
                    'question_text': question.question_text[:200] + '...' if len(question.question_text) > 200 else question.question_text,
                    'similarity_score': member.similarity_score,
                    'distance_to_centroid': member.distance_to_centroid,
                    'difficulty_level': question.difficulty_level.value,
                    'bloom_taxonomy_level': question.bloom_taxonomy_level.value
                }
                for member, question in members
            ]
        }
    
    def get_all_clusters(
        self,
        institution_id: int,
        grade_id: int,
        subject_id: int
    ) -> List[Dict[str, Any]]:
        clusters = self.db.query(QuestionCluster).filter(
            and_(
                QuestionCluster.institution_id == institution_id,
                QuestionCluster.grade_id == grade_id,
                QuestionCluster.subject_id == subject_id
            )
        ).order_by(QuestionCluster.cluster_size.desc()).all()
        
        return [
            {
                'id': cluster.id,
                'cluster_id': cluster.cluster_id,
                'cluster_label': cluster.cluster_label,
                'cluster_size': cluster.cluster_size,
                'representative_question_id': cluster.representative_question_id,
                'avg_difficulty': cluster.avg_difficulty,
                'dominant_bloom_level': cluster.dominant_bloom_level
            }
            for cluster in clusters
        ]
