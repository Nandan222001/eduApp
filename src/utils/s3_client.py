import boto3
from typing import Optional, BinaryIO
from botocore.exceptions import ClientError
from src.config import settings
import uuid
from datetime import datetime


class S3Client:
    def __init__(self):
        self.s3_client = None
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
        self.bucket_name = settings.s3_bucket_name

    def upload_file(
        self,
        file_obj: BinaryIO,
        file_name: str,
        folder: str = "uploads",
        content_type: Optional[str] = None
    ) -> tuple[str, str]:
        if not self.s3_client or not self.bucket_name:
            raise ValueError("S3 is not configured properly")

        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        s3_key = f"{folder}/{timestamp}_{unique_id}_{file_name}"

        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type

            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )

            file_url = f"https://{self.bucket_name}.s3.{settings.aws_region}.amazonaws.com/{s3_key}"
            return file_url, s3_key

        except ClientError as e:
            raise Exception(f"Failed to upload file to S3: {str(e)}")

    def delete_file(self, s3_key: str) -> bool:
        if not self.s3_client or not self.bucket_name:
            raise ValueError("S3 is not configured properly")

        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete file from S3: {str(e)}")

    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> str:
        if not self.s3_client or not self.bucket_name:
            raise ValueError("S3 is not configured properly")

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

    def file_exists(self, s3_key: str) -> bool:
        if not self.s3_client or not self.bucket_name:
            return False

        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False


s3_client = S3Client()
