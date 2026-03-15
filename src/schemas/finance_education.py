from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from src.models.finance_education import (
    ModuleName, ChallengeType, ChallengeStatus, TransactionType, InvestmentType
)


class FinanceLiteracyModuleBase(BaseModel):
    module_name: ModuleName
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    order_index: int = 0
    lessons: List[Dict[str, Any]]
    interactive_simulations: Optional[List[Dict[str, Any]]] = None
    quizzes: Optional[List[Dict[str, Any]]] = None
    real_world_scenarios: Optional[List[Dict[str, Any]]] = None
    estimated_duration_minutes: Optional[int] = None
    difficulty_level: str = "beginner"
    is_active: bool = True


class FinanceLiteracyModuleCreate(FinanceLiteracyModuleBase):
    pass


class FinanceLiteracyModuleUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    order_index: Optional[int] = None
    lessons: Optional[List[Dict[str, Any]]] = None
    interactive_simulations: Optional[List[Dict[str, Any]]] = None
    quizzes: Optional[List[Dict[str, Any]]] = None
    real_world_scenarios: Optional[List[Dict[str, Any]]] = None
    estimated_duration_minutes: Optional[int] = None
    difficulty_level: Optional[str] = None
    is_active: Optional[bool] = None


class FinanceLiteracyModuleResponse(FinanceLiteracyModuleBase):
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModuleCompletionBase(BaseModel):
    progress_percentage: Decimal = Field(default=Decimal(0))
    lessons_completed: List[str] = []
    quiz_scores: Dict[str, Any] = {}
    simulation_results: Dict[str, Any] = {}
    time_spent_minutes: int = 0
    is_completed: bool = False


class ModuleCompletionCreate(BaseModel):
    module_id: int


class ModuleCompletionUpdate(BaseModel):
    progress_percentage: Optional[Decimal] = None
    lessons_completed: Optional[List[str]] = None
    quiz_scores: Optional[Dict[str, Any]] = None
    simulation_results: Optional[Dict[str, Any]] = None
    time_spent_minutes: Optional[int] = None
    is_completed: Optional[bool] = None


class ModuleCompletionResponse(ModuleCompletionBase):
    id: int
    institution_id: int
    user_id: int
    module_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VirtualWalletBase(BaseModel):
    account_name: str = "My Virtual Wallet"
    starting_balance: Decimal = Field(default=Decimal(1000.00))
    savings_goal: Optional[Decimal] = None
    savings_goal_name: Optional[str] = None
    savings_goal_deadline: Optional[datetime] = None
    monthly_income: Decimal = Field(default=Decimal(0))
    monthly_expenses: Decimal = Field(default=Decimal(0))


class VirtualWalletCreate(VirtualWalletBase):
    pass


class VirtualWalletUpdate(BaseModel):
    account_name: Optional[str] = None
    savings_goal: Optional[Decimal] = None
    savings_goal_name: Optional[str] = None
    savings_goal_deadline: Optional[datetime] = None
    monthly_income: Optional[Decimal] = None
    monthly_expenses: Optional[Decimal] = None


class VirtualWalletResponse(VirtualWalletBase):
    id: int
    institution_id: int
    user_id: int
    current_balance: Decimal
    investment_portfolio: Dict[str, Any]
    investment_total_value: Decimal
    monthly_challenges_completed: int
    total_challenges_completed: int
    financial_health_score: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WalletTransactionBase(BaseModel):
    transaction_type: TransactionType
    amount: Decimal
    description: Optional[str] = None
    category: Optional[str] = None
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class WalletTransactionCreate(WalletTransactionBase):
    wallet_id: int


class WalletTransactionResponse(WalletTransactionBase):
    id: int
    institution_id: int
    wallet_id: int
    balance_after: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvestmentHoldingBase(BaseModel):
    investment_type: InvestmentType
    symbol: str = Field(..., max_length=20)
    name: str = Field(..., max_length=200)
    quantity: Decimal
    purchase_price: Decimal


class InvestmentHoldingCreate(InvestmentHoldingBase):
    wallet_id: int


class InvestmentHoldingUpdate(BaseModel):
    quantity: Optional[Decimal] = None
    current_price: Optional[Decimal] = None


class InvestmentHoldingResponse(InvestmentHoldingBase):
    id: int
    institution_id: int
    wallet_id: int
    current_price: Decimal
    total_value: Decimal
    gain_loss: Decimal
    gain_loss_percentage: Decimal
    purchase_date: datetime
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FinanceChallengeBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    challenge_type: ChallengeType
    difficulty_level: str = "beginner"
    completion_criteria: Dict[str, Any]
    rewards: Dict[str, Any]
    points_reward: int = 0
    badge_reward_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_participants: Optional[int] = None
    is_active: bool = True


class FinanceChallengeCreate(FinanceChallengeBase):
    pass


class FinanceChallengeUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    difficulty_level: Optional[str] = None
    completion_criteria: Optional[Dict[str, Any]] = None
    rewards: Optional[Dict[str, Any]] = None
    points_reward: Optional[int] = None
    badge_reward_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_participants: Optional[int] = None
    is_active: Optional[bool] = None


class FinanceChallengeResponse(FinanceChallengeBase):
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChallengeParticipationBase(BaseModel):
    status: ChallengeStatus = ChallengeStatus.NOT_STARTED
    progress_percentage: Decimal = Field(default=Decimal(0))
    progress_data: Dict[str, Any] = {}


class ChallengeParticipationCreate(BaseModel):
    challenge_id: int


class ChallengeParticipationUpdate(BaseModel):
    status: Optional[ChallengeStatus] = None
    progress_percentage: Optional[Decimal] = None
    progress_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class ChallengeParticipationResponse(ChallengeParticipationBase):
    id: int
    institution_id: int
    user_id: int
    challenge_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    points_earned: int
    rank: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FinancialLiteracyAssessmentBase(BaseModel):
    assessment_type: str = "comprehensive"
    total_score: int
    max_score: int
    percentage_score: Decimal
    category_scores: Dict[str, Any]
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    questions_data: Dict[str, Any]
    time_taken_minutes: Optional[int] = None


class FinancialLiteracyAssessmentCreate(FinancialLiteracyAssessmentBase):
    pass


class FinancialLiteracyAssessmentResponse(FinancialLiteracyAssessmentBase):
    id: int
    institution_id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChallengeLeaderboardEntry(BaseModel):
    user_id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    rank: int
    score: int
    completion_time_minutes: Optional[int] = None


class ChallengeLeaderboardResponse(BaseModel):
    challenge_id: int
    challenge_title: str
    entries: List[ChallengeLeaderboardEntry]
    total_participants: int
    current_user_rank: Optional[int] = None


class InvestmentSimulationRequest(BaseModel):
    investment_type: InvestmentType
    symbol: str
    quantity: Decimal
    wallet_id: int


class InvestmentSimulationResponse(BaseModel):
    success: bool
    message: str
    holding: Optional[InvestmentHoldingResponse] = None
    new_balance: Decimal
    transaction: Optional[WalletTransactionResponse] = None


class PortfolioPerformanceResponse(BaseModel):
    total_value: Decimal
    total_invested: Decimal
    total_gain_loss: Decimal
    gain_loss_percentage: Decimal
    holdings: List[InvestmentHoldingResponse]
    best_performer: Optional[InvestmentHoldingResponse] = None
    worst_performer: Optional[InvestmentHoldingResponse] = None


class FinancialHealthReport(BaseModel):
    overall_score: int
    balance: Decimal
    savings_rate: Decimal
    investment_diversity: int
    budget_adherence: Decimal
    debt_to_income_ratio: Decimal
    recommendations: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]


class UserFinancialProgress(BaseModel):
    modules_completed: int
    total_modules: int
    challenges_completed: int
    total_challenges: int
    wallet_balance: Decimal
    investment_value: Decimal
    financial_health_score: int
    badges_earned: int
    total_points: int
    recent_activities: List[Dict[str, Any]]
