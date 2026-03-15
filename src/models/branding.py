from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from src.database import Base


class InstitutionBranding(Base):
    __tablename__ = "institution_branding"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Logo and favicon
    logo_url = Column(String(500), nullable=True)
    logo_s3_key = Column(String(500), nullable=True)
    favicon_url = Column(String(500), nullable=True)
    favicon_s3_key = Column(String(500), nullable=True)
    
    # Color scheme
    primary_color = Column(String(7), nullable=True, default="#1976d2")
    secondary_color = Column(String(7), nullable=True, default="#dc004e")
    accent_color = Column(String(7), nullable=True, default="#f50057")
    background_color = Column(String(7), nullable=True, default="#ffffff")
    text_color = Column(String(7), nullable=True, default="#000000")
    
    # Custom domain
    custom_domain = Column(String(255), unique=True, nullable=True, index=True)
    subdomain = Column(String(100), unique=True, nullable=True, index=True)
    ssl_enabled = Column(Boolean, default=False, nullable=False)
    domain_verified = Column(Boolean, default=False, nullable=False)
    
    # Email branding
    email_logo_url = Column(String(500), nullable=True)
    email_logo_s3_key = Column(String(500), nullable=True)
    email_header_color = Column(String(7), nullable=True, default="#1976d2")
    email_footer_text = Column(Text, nullable=True)
    email_from_name = Column(String(100), nullable=True)
    
    # Custom email domain
    custom_email_domain = Column(String(255), nullable=True, index=True)
    email_domain_verified = Column(Boolean, default=False, nullable=False)
    sendgrid_domain_id = Column(String(100), nullable=True)
    dkim_valid = Column(Boolean, default=False, nullable=False)
    spf_valid = Column(Boolean, default=False, nullable=False)
    
    # Login page customization
    login_background_url = Column(String(500), nullable=True)
    login_background_s3_key = Column(String(500), nullable=True)
    login_banner_text = Column(String(255), nullable=True)
    login_welcome_message = Column(Text, nullable=True)
    
    # Additional customization
    institution_name_override = Column(String(255), nullable=True)
    custom_css = Column(Text, nullable=True)
    custom_meta_tags = Column(JSON, nullable=True)
    
    # Social media links
    social_links = Column(JSON, nullable=True)
    
    # Branded notification sounds
    branded_notification_sounds = Column(JSON, nullable=True)
    
    # Loading screen and animations
    loading_screen_animation_url = Column(String(500), nullable=True)
    loading_screen_animation_s3_key = Column(String(500), nullable=True)
    splash_screen_config = Column(JSON, nullable=True)
    
    # Custom help and merchandise
    custom_help_docs_url = Column(String(500), nullable=True)
    merchandise_store_enabled = Column(Boolean, default=False, nullable=False)
    
    # Feature flags
    show_powered_by = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    institution = relationship("Institution", backref="branding", uselist=False)
