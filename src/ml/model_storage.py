from typing import Optional, Dict, Any
import os
import joblib
import json
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

from src.config import settings


class ModelStorageService:
    
    def __init__(self):
        self.local_dir = "ml_models"
        self.use_s3 = bool(settings.aws_access_key_id and settings.s3_bucket_name)
        
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
            self.bucket_name = settings.s3_bucket_name
        
        os.makedirs(self.local_dir, exist_ok=True)
    
    def save_model(
        self,
        model: Any,
        model_id: int,
        version: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        model_filename = f"model_{model_id}_{version}.pkl"
        local_path = os.path.join(self.local_dir, model_filename)
        
        joblib.dump(model, local_path)
        
        result = {
            'local_path': local_path,
            's3_key': None
        }
        
        if self.use_s3:
            s3_key = f"ml_models/{model_filename}"
            try:
                self.s3_client.upload_file(local_path, self.bucket_name, s3_key)
                result['s3_key'] = s3_key
            except ClientError as e:
                print(f"Error uploading model to S3: {e}")
        
        if metadata:
            metadata_filename = f"model_{model_id}_{version}_metadata.json"
            metadata_path = os.path.join(self.local_dir, metadata_filename)
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            if self.use_s3:
                s3_metadata_key = f"ml_models/{metadata_filename}"
                try:
                    self.s3_client.upload_file(metadata_path, self.bucket_name, s3_metadata_key)
                except ClientError as e:
                    print(f"Error uploading metadata to S3: {e}")
        
        return result
    
    def save_scaler(
        self,
        scaler: Any,
        model_id: int,
        version: str
    ) -> Dict[str, str]:
        scaler_filename = f"scaler_{model_id}_{version}.pkl"
        local_path = os.path.join(self.local_dir, scaler_filename)
        
        joblib.dump(scaler, local_path)
        
        result = {
            'local_path': local_path,
            's3_key': None
        }
        
        if self.use_s3:
            s3_key = f"ml_models/{scaler_filename}"
            try:
                self.s3_client.upload_file(local_path, self.bucket_name, s3_key)
                result['s3_key'] = s3_key
            except ClientError as e:
                print(f"Error uploading scaler to S3: {e}")
        
        return result
    
    def load_model(self, local_path: str, s3_key: Optional[str] = None) -> Any:
        if not os.path.exists(local_path) and s3_key and self.use_s3:
            try:
                self.s3_client.download_file(self.bucket_name, s3_key, local_path)
            except ClientError as e:
                raise ValueError(f"Error downloading model from S3: {e}")
        
        if not os.path.exists(local_path):
            raise ValueError(f"Model file not found: {local_path}")
        
        return joblib.load(local_path)
    
    def load_scaler(self, local_path: str, s3_key: Optional[str] = None) -> Any:
        if not os.path.exists(local_path) and s3_key and self.use_s3:
            try:
                self.s3_client.download_file(self.bucket_name, s3_key, local_path)
            except ClientError as e:
                raise ValueError(f"Error downloading scaler from S3: {e}")
        
        if not os.path.exists(local_path):
            raise ValueError(f"Scaler file not found: {local_path}")
        
        return joblib.load(local_path)
    
    def delete_model(self, local_path: str, s3_key: Optional[str] = None) -> bool:
        success = True
        
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception as e:
                print(f"Error deleting local model: {e}")
                success = False
        
        if s3_key and self.use_s3:
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            except ClientError as e:
                print(f"Error deleting model from S3: {e}")
                success = False
        
        return success
    
    def list_local_models(self) -> list:
        if not os.path.exists(self.local_dir):
            return []
        
        models = []
        for filename in os.listdir(self.local_dir):
            if filename.startswith('model_') and filename.endswith('.pkl'):
                filepath = os.path.join(self.local_dir, filename)
                stat = os.stat(filepath)
                models.append({
                    'filename': filename,
                    'path': filepath,
                    'size': stat.st_size,
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        return models
    
    def get_model_size(self, local_path: str) -> int:
        if os.path.exists(local_path):
            return os.path.getsize(local_path)
        return 0
