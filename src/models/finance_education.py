from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Index, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class ModuleName(str, Enum):
    BUDGETING = "budgeting"
    SAVING = "saving"
    INVESTING = "investing"
    CREDIT_SCORES = "credit_scores"
    LOANS = "loans"
    TAXES = "taxes"
    BANKING = "banking"


class ChallengeType(str, Enum):
    SAVE_100 = "save_$100"
    CREATE_BUDGET = "create_budget"
    INVESTMENT_SIMULATION = "investment_simulation"
    COMPARISON_SHOPPING = "comparison_shopping"


class ChallengeStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"
    PURCHASE = "purchase"
    INCOME = "income"
    EXPENSE = "expense"
    INVESTMENT = "investment"
    DIVIDEND = "dividend"


class InvestmentType(str, Enum):
    STOCKS = "stocks"
    BONDS = "bonds"
    ETF = "etf"
    MUTUAL_FUND = "mutual_fund"


class FinanceLiteracyModule(Base):
    __tablename__ = "finance_literacy_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    module_name = Column(SQLEnum(ModuleName), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    lessons = Column(JSON, nullable=False)
    interactive_simulations = Column(JSON, nullable=True)
    quizzes = Column(JSON, nullable=True)
    real_world_scenarios = Column(JSON, nullable=True)
    estimated_duration_minutes = Column(Integer, nullable=True)
    difficulty_level = Column(String(20), default="beginner", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    completion_tracking = relationship("ModuleCompletion", back_populates="module", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_finance_module_institution', 'institution_id'),
        Index('idx_finance_module_name', 'module_name'),
        Index('idx_finance_module_active', 'is_active'),
        Index('idx_finance_module_order', 'order_index'),
    )


class ModuleCompletion(Base):
    __tablename__ = "module_completions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    module_id = Column(Integer, ForeignKey('finance_literacy_modules.id', ondelete='CASCADE'), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    progress_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    lessons_completed = Column(JSON, default=list, nullable=False)
    quiz_scores = Column(JSON, default=dict, nullable=False)
    simulation_results = Column(JSON, default=dict, nullable=False)
    time_spent_minutes = Column(Integer, default=0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    module = relationship("FinanceLiteracyModule", back_populates="completion_tracking")
    
    __table_args__ = (
        Index('idx_module_completion_institution', 'institution_id'),
        Index('idx_module_completion_user', 'user_id'),
        Index('idx_module_completion_module', 'module_id'),
        Index('idx_module_completion_completed', 'is_completed'),
        Index('idx_module_completion_user_module', 'user_id', 'module_id'),
    )


class VirtualWallet(Base):
    __tablename__ = "virtual_wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    account_name = Column(String(100), default="My Virtual Wallet", nullable=False)
    starting_balance = Column(Numeric(12, 2), default=1000.00, nullable=False)
    current_balance = Column(Numeric(12, 2), default=1000.00, nullable=False)
    savings_goal = Column(Numeric(12, 2), nullable=True)
    savings_goal_name = Column(String(200), nullable=True)
    savings_goal_deadline = Column(DateTime, nullable=True)
    monthly_income = Column(Numeric(12, 2), default=0, nullable=False)
    monthly_expenses = Column(Numeric(12, 2), default=0, nullable=False)
    investment_portfolio = Column(JSON, default=dict, nullable=False)
    investment_total_value = Column(Numeric(12, 2), default=0, nullable=False)
    monthly_challenges_completed = Column(Integer, default=0, nullable=False)
    total_challenges_completed = Column(Integer, default=0, nullable=False)
    financial_health_score = Column(Integer, default=50, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    transactions = relationship("WalletTransaction", back_populates="wallet", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_virtual_wallet_institution', 'institution_id'),
        Index('idx_virtual_wallet_user', 'user_id'),
        Index('idx_virtual_wallet_active', 'is_active'),
    )


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    wallet_id = Column(Integer, ForeignKey('virtual_wallets.id', ondelete='CASCADE'), nullable=False, index=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    balance_after = Column(Numeric(12, 2), nullable=False)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurring_frequency = Column(String(50), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    wallet = relationship("VirtualWallet", back_populates="transactions")
    
    __table_args__ = (
        Index('idx_wallet_transaction_institution', 'institution_id'),
        Index('idx_wallet_transaction_wallet', 'wallet_id'),
        Index('idx_wallet_transaction_type', 'transaction_type'),
        Index('idx_wallet_transaction_category', 'category'),
        Index('idx_wallet_transaction_created', 'created_at'),
    )


class InvestmentHolding(Base):
    __tablename__ = "investment_holdings"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    wallet_id = Column(Integer, ForeignKey('virtual_wallets.id', ondelete='CASCADE'), nullable=False, index=True)
    investment_type = Column(SQLEnum(InvestmentType), nullable=False, index=True)
    symbol = Column(String(20), nullable=False)
    name = Column(String(200), nullable=False)
    quantity = Column(Numeric(12, 4), nullable=False)
    purchase_price = Column(Numeric(12, 2), nullable=False)
    current_price = Column(Numeric(12, 2), nullable=False)
    total_value = Column(Numeric(12, 2), nullable=False)
    gain_loss = Column(Numeric(12, 2), default=0, nullable=False)
    gain_loss_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    purchase_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    wallet = relationship("VirtualWallet")
    
    __table_args__ = (
        Index('idx_investment_holding_institution', 'institution_id'),
        Index('idx_investment_holding_wallet', 'wallet_id'),
        Index('idx_investment_holding_type', 'investment_type'),
        Index('idx_investment_holding_symbol', 'symbol'),
    )


class FinanceChallenge(Base):
    __tablename__ = "finance_challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    challenge_type = Column(SQLEnum(ChallengeType), nullable=False, index=True)
    difficulty_level = Column(String(20), default="beginner", nullable=False)
    completion_criteria = Column(JSON, nullable=False)
    rewards = Column(JSON, nullable=False)
    points_reward = Column(Integer, default=0, nullable=False)
    badge_reward_id = Column(Integer, ForeignKey('badges.id', ondelete='SET NULL'), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    max_participants = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    badge_reward = relationship("Badge")
    participations = relationship("ChallengeParticipation", back_populates="challenge", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_finance_challenge_institution', 'institution_id'),
        Index('idx_finance_challenge_type', 'challenge_type'),
        Index('idx_finance_challenge_active', 'is_active'),
        Index('idx_finance_challenge_dates', 'start_date', 'end_date'),
    )


class ChallengeParticipation(Base):
    __tablename__ = "challenge_participations"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey('finance_challenges.id', ondelete='CASCADE'), nullable=False, index=True)
    status = Column(SQLEnum(ChallengeStatus), default=ChallengeStatus.NOT_STARTED, nullable=False, index=True)
    progress_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    progress_data = Column(JSON, default=dict, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    points_earned = Column(Integer, default=0, nullable=False)
    rank = Column(Integer, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    challenge = relationship("FinanceChallenge", back_populates="participations")
    
    __table_args__ = (
        Index('idx_challenge_participation_institution', 'institution_id'),
        Index('idx_challenge_participation_user', 'user_id'),
        Index('idx_challenge_participation_challenge', 'challenge_id'),
        Index('idx_challenge_participation_status', 'status'),
        Index('idx_challenge_participation_user_challenge', 'user_id', 'challenge_id'),
    )


class FinancialLiteracyAssessment(Base):
    __tablename__ = "financial_literacy_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    assessment_type = Column(String(50), default="comprehensive", nullable=False)
    total_score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    percentage_score = Column(Numeric(5, 2), nullable=False)
    category_scores = Column(JSON, nullable=False)
    strengths = Column(JSON, default=list, nullable=False)
    weaknesses = Column(JSON, default=list, nullable=False)
    recommendations = Column(JSON, default=list, nullable=False)
    questions_data = Column(JSON, nullable=False)
    time_taken_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_financial_assessment_institution', 'institution_id'),
        Index('idx_financial_assessment_user', 'user_id'),
        Index('idx_financial_assessment_type', 'assessment_type'),
        Index('idx_financial_assessment_created', 'created_at'),
    )


class ChallengeLeaderboard(Base):
    __tablename__ = "challenge_leaderboards"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey('finance_challenges.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    completion_time_minutes = Column(Integer, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    challenge = relationship("FinanceChallenge")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_challenge_leaderboard_institution', 'institution_id'),
        Index('idx_challenge_leaderboard_challenge', 'challenge_id'),
        Index('idx_challenge_leaderboard_user', 'user_id'),
        Index('idx_challenge_leaderboard_rank', 'rank'),
        Index('idx_challenge_leaderboard_score', 'score'),
    )
