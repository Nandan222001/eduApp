from datetime import datetime
from typing import Optional
import logging
from celery import Task

from src.celery_app import celery_app
from src.database import SessionLocal
from src.config import settings

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.email_tasks.send_verification_email")
def send_verification_email(
    self,
    contact_email: str,
    contact_person: str,
    student_name: str,
    activity_name: str,
    organization_name: str,
    hours_logged: float,
    activity_date: str,
    verification_link: str
) -> dict:
    """
    Send verification email to organization contact to verify student's service hours.
    
    Args:
        contact_email: Email address of the organization contact
        contact_person: Name of the contact person
        student_name: Name of the student
        activity_name: Name of the service activity
        organization_name: Name of the organization
        hours_logged: Number of hours logged
        activity_date: Date of the activity
        verification_link: Unique verification link
    """
    try:
        subject = f"Community Service Hour Verification Request - {student_name}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Community Service Hour Verification Request</h2>
                    
                    <p>Dear {contact_person},</p>
                    
                    <p>
                        We are writing to request verification of community service hours completed 
                        by <strong>{student_name}</strong> at your organization.
                    </p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #2c3e50;">Activity Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Student:</strong> {student_name}</li>
                            <li><strong>Activity:</strong> {activity_name}</li>
                            <li><strong>Organization:</strong> {organization_name}</li>
                            <li><strong>Date:</strong> {activity_date}</li>
                            <li><strong>Hours:</strong> {hours_logged}</li>
                        </ul>
                    </div>
                    
                    <p>
                        Please click the button below to verify these hours. You will be asked to 
                        confirm the hours and may optionally provide a digital signature.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" 
                           style="background-color: #3498db; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Verify Service Hours
                        </a>
                    </div>
                    
                    <p style="color: #7f8c8d; font-size: 14px;">
                        This verification link will expire in 30 days. If you did not expect this 
                        email or if the student did not complete service at your organization, 
                        please disregard this message.
                    </p>
                    
                    <p style="color: #7f8c8d; font-size: 14px;">
                        If the button above doesn't work, you can copy and paste this link into 
                        your browser:<br>
                        <span style="word-break: break-all;">{verification_link}</span>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    
                    <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_content = f"""
        Community Service Hour Verification Request
        
        Dear {contact_person},
        
        We are writing to request verification of community service hours completed 
        by {student_name} at your organization.
        
        Activity Details:
        - Student: {student_name}
        - Activity: {activity_name}
        - Organization: {organization_name}
        - Date: {activity_date}
        - Hours: {hours_logged}
        
        Please visit the following link to verify these hours:
        {verification_link}
        
        This verification link will expire in 30 days.
        
        If you did not expect this email or if the student did not complete service 
        at your organization, please disregard this message.
        """
        
        logger.info(f"Sending verification email to {contact_email} for student {student_name}")
        
        if settings.sendgrid_api_key:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            message = Mail(
                from_email=(settings.sender_email, settings.sender_name),
                to_emails=contact_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content
            )
            
            sg = SendGridAPIClient(settings.sendgrid_api_key)
            response = sg.send(message)
            
            logger.info(f"Verification email sent successfully to {contact_email}. Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message": "Verification email sent successfully"
            }
        else:
            logger.warning(f"SendGrid not configured. Email to {contact_email} not sent.")
            logger.info(f"Verification link: {verification_link}")
            
            return {
                "success": True,
                "status_code": 200,
                "message": "Email sending skipped (SendGrid not configured)",
                "verification_link": verification_link
            }
            
    except Exception as e:
        logger.error(f"Failed to send verification email to {contact_email}: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to send verification email"
        }
