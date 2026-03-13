"""
Integration tests for external services with mocks.
"""
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session
from io import BytesIO

from tests.test_mocks import (
    MockSendGridClient, MockRazorpayClient, MockS3Client, MockRedisClient
)
from src.services.subscription_service import SubscriptionService
from decimal import Decimal


@pytest.mark.integration
class TestSendGridIntegration:
    """Integration tests for SendGrid email service"""
    
    def test_send_email_with_mock(self, mock_sendgrid_client: MockSendGridClient):
        """Test sending email with mock SendGrid"""
        with patch('sendgrid.SendGridAPIClient') as mock_sg:
            mock_sg.return_value = mock_sendgrid_client
            
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            message = Mail(
                from_email='test@example.com',
                to_emails='recipient@example.com',
                subject='Test Email',
                html_content='<strong>Test content</strong>'
            )
            
            sg = SendGridAPIClient()
            response = sg.send(message)
            
            assert response.status_code == 202
            assert len(mock_sendgrid_client.sent_emails) == 1
    
    def test_send_multiple_emails(self, mock_sendgrid_client: MockSendGridClient):
        """Test sending multiple emails"""
        with patch('sendgrid.SendGridAPIClient') as mock_sg:
            mock_sg.return_value = mock_sendgrid_client
            
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            sg = SendGridAPIClient()
            
            for i in range(5):
                message = Mail(
                    from_email='test@example.com',
                    to_emails=f'recipient{i}@example.com',
                    subject=f'Test Email {i}',
                    html_content=f'<strong>Test content {i}</strong>'
                )
                sg.send(message)
            
            assert len(mock_sendgrid_client.sent_emails) == 5


@pytest.mark.integration
class TestRazorpayIntegration:
    """Integration tests for Razorpay payment service"""
    
    def test_create_order(self, mock_razorpay_client: MockRazorpayClient):
        """Test creating Razorpay order"""
        order = mock_razorpay_client.order.create({
            'amount': 99900,
            'currency': 'INR',
            'receipt': 'order_rcptid_11',
            'notes': {'test': 'value'}
        })
        
        assert order['amount'] == 99900
        assert order['currency'] == 'INR'
        assert order['status'] == 'created'
        assert 'order_test' in order['id']
    
    def test_fetch_payment(self, mock_razorpay_client: MockRazorpayClient):
        """Test fetching payment details"""
        payment = mock_razorpay_client.payment.fetch('pay_test123')
        
        assert payment['id'] == 'pay_test123'
        assert payment['status'] == 'captured'
    
    def test_razorpay_payment_flow(
        self, db_session: Session, subscription, mock_razorpay_client: MockRazorpayClient
    ):
        """Test complete Razorpay payment flow"""
        with patch('razorpay.Client') as mock_rp:
            mock_rp.return_value = mock_razorpay_client
            
            service = SubscriptionService(db_session, "test_key", "test_secret")
            
            order = mock_razorpay_client.order.create({
                'amount': int(subscription.price * 100),
                'currency': subscription.currency
            })
            
            assert order['amount'] == int(subscription.price * 100)
            
            payment = mock_razorpay_client.payment.capture(
                'pay_test123',
                order['amount']
            )
            
            assert payment['status'] == 'captured'


@pytest.mark.integration
class TestS3Integration:
    """Integration tests for AWS S3 storage service"""
    
    def test_upload_file(self, mock_s3_client: MockS3Client):
        """Test uploading file to S3"""
        mock_s3_client.create_bucket(Bucket='test-bucket')
        
        file_content = BytesIO(b"Test file content")
        mock_s3_client.upload_fileobj(
            file_content,
            'test-bucket',
            'test-file.txt'
        )
        
        assert len(mock_s3_client.uploaded_files) == 1
        assert mock_s3_client.uploaded_files[0]['key'] == 'test-file.txt'
    
    def test_download_file(self, mock_s3_client: MockS3Client):
        """Test downloading file from S3"""
        mock_s3_client.create_bucket(Bucket='test-bucket')
        
        file_content = BytesIO(b"Test file content")
        mock_s3_client.upload_fileobj(
            file_content,
            'test-bucket',
            'test-file.txt'
        )
        
        downloaded = mock_s3_client.download_fileobj(
            'test-bucket',
            'test-file.txt',
            BytesIO()
        )
        
        assert downloaded is not None
    
    def test_delete_file(self, mock_s3_client: MockS3Client):
        """Test deleting file from S3"""
        mock_s3_client.create_bucket(Bucket='test-bucket')
        
        file_content = BytesIO(b"Test file content")
        mock_s3_client.upload_fileobj(
            file_content,
            'test-bucket',
            'test-file.txt'
        )
        
        mock_s3_client.delete_object(Bucket='test-bucket', Key='test-file.txt')
        
        with pytest.raises(Exception):
            mock_s3_client.download_fileobj(
                'test-bucket',
                'test-file.txt',
                BytesIO()
            )
    
    def test_list_objects(self, mock_s3_client: MockS3Client):
        """Test listing objects in S3 bucket"""
        mock_s3_client.create_bucket(Bucket='test-bucket')
        
        for i in range(5):
            mock_s3_client.upload_fileobj(
                BytesIO(b"Content"),
                'test-bucket',
                f'file-{i}.txt'
            )
        
        result = mock_s3_client.list_objects_v2(Bucket='test-bucket')
        
        assert len(result['Contents']) == 5
    
    def test_generate_presigned_url(self, mock_s3_client: MockS3Client):
        """Test generating presigned URL"""
        url = mock_s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': 'test-bucket', 'Key': 'test-file.txt'},
            ExpiresIn=3600
        )
        
        assert 'test-bucket' in url
        assert 'test-file.txt' in url
        assert 'expires=' in url


@pytest.mark.integration
class TestRedisIntegration:
    """Integration tests for Redis caching service"""
    
    @pytest.mark.asyncio
    async def test_set_and_get(self, mock_redis_client: MockRedisClient):
        """Test setting and getting cache value"""
        await mock_redis_client.set('test_key', 'test_value')
        value = await mock_redis_client.get('test_key')
        
        assert value == 'test_value'
    
    @pytest.mark.asyncio
    async def test_set_with_expiry(self, mock_redis_client: MockRedisClient):
        """Test setting value with expiry"""
        await mock_redis_client.set('test_key', 'test_value', ex=3600)
        value = await mock_redis_client.get('test_key')
        ttl = await mock_redis_client.ttl('test_key')
        
        assert value == 'test_value'
        assert ttl == 3600
    
    @pytest.mark.asyncio
    async def test_delete(self, mock_redis_client: MockRedisClient):
        """Test deleting cache value"""
        await mock_redis_client.set('test_key', 'test_value')
        await mock_redis_client.delete('test_key')
        value = await mock_redis_client.get('test_key')
        
        assert value is None
    
    @pytest.mark.asyncio
    async def test_exists(self, mock_redis_client: MockRedisClient):
        """Test checking if key exists"""
        await mock_redis_client.set('test_key', 'test_value')
        exists = await mock_redis_client.exists('test_key')
        
        assert exists == 1
    
    @pytest.mark.asyncio
    async def test_keys_pattern(self, mock_redis_client: MockRedisClient):
        """Test getting keys by pattern"""
        await mock_redis_client.set('user:1', 'value1')
        await mock_redis_client.set('user:2', 'value2')
        await mock_redis_client.set('session:1', 'value3')
        
        user_keys = await mock_redis_client.keys('user:*')
        
        assert len(user_keys) == 2
    
    @pytest.mark.asyncio
    async def test_hash_operations(self, mock_redis_client: MockRedisClient):
        """Test hash operations"""
        await mock_redis_client.hset('user:1', 'name', 'John')
        await mock_redis_client.hset('user:1', 'email', 'john@example.com')
        
        name = await mock_redis_client.hget('user:1', 'name')
        email = await mock_redis_client.hget('user:1', 'email')
        
        assert name == 'John'
        assert email == 'john@example.com'
        
        await mock_redis_client.hdel('user:1', 'email')
        email = await mock_redis_client.hget('user:1', 'email')
        
        assert email is None


@pytest.mark.integration
class TestCombinedExternalServices:
    """Integration tests combining multiple external services"""
    
    @pytest.mark.asyncio
    async def test_payment_with_notification(
        self, db_session: Session, subscription, 
        mock_razorpay_client: MockRazorpayClient,
        mock_sendgrid_client: MockSendGridClient,
        mock_redis_client: MockRedisClient
    ):
        """Test payment processing with email notification and caching"""
        with patch('razorpay.Client') as mock_rp, \
             patch('sendgrid.SendGridAPIClient') as mock_sg:
            
            mock_rp.return_value = mock_razorpay_client
            mock_sg.return_value = mock_sendgrid_client
            
            order = mock_razorpay_client.order.create({
                'amount': int(subscription.price * 100),
                'currency': subscription.currency
            })
            
            await mock_redis_client.set(
                f'order:{order["id"]}',
                f'subscription:{subscription.id}'
            )
            
            payment = mock_razorpay_client.payment.capture(
                'pay_test123',
                order['amount']
            )
            
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            message = Mail(
                from_email='noreply@example.com',
                to_emails=subscription.institution.email,
                subject='Payment Successful',
                html_content='<strong>Your payment was successful</strong>'
            )
            
            sg = SendGridAPIClient()
            sg.send(message)
            
            assert payment['status'] == 'captured'
            assert len(mock_sendgrid_client.sent_emails) == 1
            
            cached_sub = await mock_redis_client.get(f'order:{order["id"]}')
            assert cached_sub == f'subscription:{subscription.id}'
    
    def test_file_upload_with_metadata_storage(
        self, mock_s3_client: MockS3Client,
        mock_redis_client: MockRedisClient
    ):
        """Test file upload with metadata caching"""
        import asyncio
        
        mock_s3_client.create_bucket(Bucket='test-bucket')
        
        file_content = BytesIO(b"Test document content")
        file_key = 'documents/test-doc.pdf'
        
        mock_s3_client.upload_fileobj(
            file_content,
            'test-bucket',
            file_key
        )
        
        url = mock_s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': 'test-bucket', 'Key': file_key},
            ExpiresIn=3600
        )
        
        asyncio.run(mock_redis_client.hset(
            'file:metadata',
            file_key,
            url
        ))
        
        cached_url = asyncio.run(mock_redis_client.hget('file:metadata', file_key))
        
        assert cached_url == url
        assert len(mock_s3_client.uploaded_files) == 1
