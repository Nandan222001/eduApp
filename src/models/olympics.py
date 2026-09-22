from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum as SQLEnum, JSON, Numeric
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class CompetitionType(str, Enum):
    MATH_OLYMPIAD = "math_olympiad"
    SPEED_CHALLENGE = "speed_challenge"
    QUIZ_BATTLE = "quiz_battle"
    CODING_CONTEST = "coding_contest"
    ESSAY = "essay"
    SCIENCE_EXPERIMENT = "science_experiment"


class CompetitionScope(str, Enum):
    CLASS = "class"
    SCHOOL = "school"
    INTER_SCHOOL = "inter_school"
    NATIONAL = "national"


class EventType(str, Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"
    RELAY = "relay"


class CompetitionStatus(str, Enum):
    DRAFT = "draft"
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Competition(Base):
    __tablename__ = "competitions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    competition_type = Column(SQLEnum(CompetitionType), nullable=False, index=True)
    scope = Column(SQLEnum(CompetitionScope), nullable=False, index=True)
    status = Column(SQLEnum(CompetitionStatus), default=CompetitionStatus.DRAFT, nullable=False, index=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    rules = Column(JSON, nullable=True)
    prize_pool = Column(JSON, nullable=True)
    participating_institutions = Column(JSON, nullable=True)
    banner_url = Column(String(500), nullable=True)
    organizer_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    organizer = relationship("User")
    events = relationship("CompetitionEvent", back_populates="competition", cascade="all, delete-orphan")
    leaderboards = relationship("CompetitionLeaderboard", back_populates="competition", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_competition_institution', 'institution_id'),
        Index('idx_competition_type', 'competition_type'),
        Index('idx_competition_scope', 'scope'),
        Index('idx_competition_status', 'status'),
        Index('idx_competition_dates', 'start_date', 'end_date'),
        Index('idx_competition_organizer', 'organizer_id'),
    )


class CompetitionEvent(Base):
    __tablename__ = "competition_events"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    competition_id = Column(Integer, ForeignKey('competitions.id', ondelete='CASCADE'), nullable=False, index=True)
    event_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(SQLEnum(EventType), nullable=False, index=True)
    max_participants = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    question_set = Column(JSON, nullable=True)
    scoring_rules = Column(JSON, nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    competition = relationship("Competition", back_populates="events")
    entries = relationship("CompetitionEntry", back_populates="event", cascade="all, delete-orphan")
    teams = relationship("CompetitionTeam", back_populates="event", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_competition_event_institution', 'institution_id'),
        Index('idx_event_competition', 'competition_id'),
        Index('idx_competition_event_type', 'event_type'),
        Index('idx_event_times', 'start_time', 'end_time'),
    )


class CompetitionEntry(Base):
    __tablename__ = "competition_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey('competition_events.id', ondelete='CASCADE'), nullable=False, index=True)
    participant_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey('competition_teams.id', ondelete='SET NULL'), nullable=True, index=True)
    score = Column(Numeric(10, 2), default=0, nullable=False)
    rank = Column(Integer, nullable=True)
    time_taken = Column(Integer, nullable=True)
    submission_data = Column(JSON, nullable=True)
    status = Column(String(50), default='registered', nullable=False, index=True)
    submitted_at = Column(DateTime, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    event = relationship("CompetitionEvent", back_populates="entries")
    participant = relationship("Student")
    team = relationship("CompetitionTeam", back_populates="entries")
    
    __table_args__ = (
        UniqueConstraint('event_id', 'participant_student_id', name='uq_event_participant'),
        Index('idx_entry_institution', 'institution_id'),
        Index('idx_entry_event', 'event_id'),
        Index('idx_entry_participant', 'participant_student_id'),
        Index('idx_entry_team', 'team_id'),
        Index('idx_entry_score', 'score'),
        Index('idx_entry_rank', 'rank'),
        Index('idx_entry_status', 'status'),
    )


class CompetitionTeam(Base):
    __tablename__ = "competition_teams"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey('competition_events.id', ondelete='CASCADE'), nullable=False, index=True)
    team_name = Column(String(200), nullable=False)
    team_leader_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    members = Column(JSON, nullable=False)
    total_score = Column(Numeric(10, 2), default=0, nullable=False)
    rank = Column(Integer, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    event = relationship("CompetitionEvent", back_populates="teams")
    team_leader = relationship("Student", foreign_keys=[team_leader_id])
    entries = relationship("CompetitionEntry", back_populates="team", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('event_id', 'team_name', name='uq_event_team_name'),
        Index('idx_team_institution', 'institution_id'),
        Index('idx_team_event', 'event_id'),
        Index('idx_team_leader', 'team_leader_id'),
        Index('idx_team_score', 'total_score'),
        Index('idx_team_rank', 'rank'),
    )


class CompetitionLeaderboard(Base):
    __tablename__ = "competition_leaderboards"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    competition_id = Column(Integer, ForeignKey('competitions.id', ondelete='CASCADE'), nullable=False, index=True)
    scope = Column(SQLEnum(CompetitionScope), nullable=False, index=True)
    rankings = Column(JSON, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)
    total_participants = Column(Integer, default=0, nullable=False)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    competition = relationship("Competition", back_populates="leaderboards")
    
    __table_args__ = (
        UniqueConstraint('competition_id', 'scope', name='uq_competition_scope_leaderboard'),
        Index('idx_competition_leaderboard_institution', 'institution_id'),
        Index('idx_leaderboard_competition', 'competition_id'),
        Index('idx_leaderboard_scope', 'scope'),
        Index('idx_leaderboard_updated', 'last_updated'),
    )
