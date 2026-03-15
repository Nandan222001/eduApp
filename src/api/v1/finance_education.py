from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from src.database import get_db
from src.models.finance_education import (
    FinanceLiteracyModule, ModuleCompletion, VirtualWallet, WalletTransaction,
    InvestmentHolding, FinanceChallenge, ChallengeParticipation,
    FinancialLiteracyAssessment, ChallengeLeaderboard,
    ModuleName, ChallengeType, ChallengeStatus, TransactionType, InvestmentType
)
from src.models.user import User
from src.schemas.finance_education import (
    FinanceLiteracyModuleCreate, FinanceLiteracyModuleUpdate, FinanceLiteracyModuleResponse,
    ModuleCompletionCreate, ModuleCompletionUpdate, ModuleCompletionResponse,
    VirtualWalletCreate, VirtualWalletUpdate, VirtualWalletResponse,
    WalletTransactionCreate, WalletTransactionResponse,
    InvestmentHoldingCreate, InvestmentHoldingUpdate, InvestmentHoldingResponse,
    FinanceChallengeCreate, FinanceChallengeUpdate, FinanceChallengeResponse,
    ChallengeParticipationCreate, ChallengeParticipationUpdate, ChallengeParticipationResponse,
    FinancialLiteracyAssessmentCreate, FinancialLiteracyAssessmentResponse,
    ChallengeLeaderboardResponse, ChallengeLeaderboardEntry,
    InvestmentSimulationRequest, InvestmentSimulationResponse,
    PortfolioPerformanceResponse, FinancialHealthReport, UserFinancialProgress
)

router = APIRouter()


@router.post("/modules", response_model=FinanceLiteracyModuleResponse, status_code=status.HTTP_201_CREATED)
def create_module(
    module: FinanceLiteracyModuleCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    db_module = FinanceLiteracyModule(
        institution_id=institution_id,
        **module.model_dump()
    )
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module


@router.get("/modules", response_model=List[FinanceLiteracyModuleResponse])
def list_modules(
    institution_id: int = Query(...),
    module_name: Optional[ModuleName] = None,
    is_active: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(FinanceLiteracyModule).filter(
        FinanceLiteracyModule.institution_id == institution_id,
        FinanceLiteracyModule.is_active == is_active
    )
    
    if module_name:
        query = query.filter(FinanceLiteracyModule.module_name == module_name)
    
    return query.order_by(FinanceLiteracyModule.order_index).offset(skip).limit(limit).all()


@router.get("/modules/{module_id}", response_model=FinanceLiteracyModuleResponse)
def get_module(
    module_id: int,
    db: Session = Depends(get_db)
):
    module = db.query(FinanceLiteracyModule).filter(FinanceLiteracyModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@router.put("/modules/{module_id}", response_model=FinanceLiteracyModuleResponse)
def update_module(
    module_id: int,
    module_update: FinanceLiteracyModuleUpdate,
    db: Session = Depends(get_db)
):
    module = db.query(FinanceLiteracyModule).filter(FinanceLiteracyModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    for key, value in module_update.model_dump(exclude_unset=True).items():
        setattr(module, key, value)
    
    db.commit()
    db.refresh(module)
    return module


@router.post("/modules/{module_id}/start", response_model=ModuleCompletionResponse, status_code=status.HTTP_201_CREATED)
def start_module(
    module_id: int,
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    module = db.query(FinanceLiteracyModule).filter(FinanceLiteracyModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    existing = db.query(ModuleCompletion).filter(
        ModuleCompletion.user_id == user_id,
        ModuleCompletion.module_id == module_id
    ).first()
    
    if existing:
        return existing
    
    completion = ModuleCompletion(
        institution_id=institution_id,
        user_id=user_id,
        module_id=module_id,
        lessons_completed=[],
        quiz_scores={},
        simulation_results={}
    )
    db.add(completion)
    db.commit()
    db.refresh(completion)
    return completion


@router.put("/modules/completions/{completion_id}", response_model=ModuleCompletionResponse)
def update_module_completion(
    completion_id: int,
    update_data: ModuleCompletionUpdate,
    db: Session = Depends(get_db)
):
    completion = db.query(ModuleCompletion).filter(ModuleCompletion.id == completion_id).first()
    if not completion:
        raise HTTPException(status_code=404, detail="Module completion not found")
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(completion, key, value)
    
    if update_data.is_completed and not completion.completed_at:
        completion.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(completion)
    return completion


@router.get("/users/{user_id}/module-progress", response_model=List[ModuleCompletionResponse])
def get_user_module_progress(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return db.query(ModuleCompletion).filter(
        ModuleCompletion.user_id == user_id,
        ModuleCompletion.institution_id == institution_id
    ).all()


@router.post("/wallets", response_model=VirtualWalletResponse, status_code=status.HTTP_201_CREATED)
def create_wallet(
    wallet: VirtualWalletCreate,
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    existing = db.query(VirtualWallet).filter(
        VirtualWallet.user_id == user_id,
        VirtualWallet.institution_id == institution_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already has a virtual wallet")
    
    db_wallet = VirtualWallet(
        institution_id=institution_id,
        user_id=user_id,
        current_balance=wallet.starting_balance,
        investment_portfolio={},
        **wallet.model_dump()
    )
    db.add(db_wallet)
    db.commit()
    db.refresh(db_wallet)
    return db_wallet


@router.get("/wallets/{wallet_id}", response_model=VirtualWalletResponse)
def get_wallet(
    wallet_id: int,
    db: Session = Depends(get_db)
):
    wallet = db.query(VirtualWallet).filter(VirtualWallet.id == wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.get("/users/{user_id}/wallet", response_model=VirtualWalletResponse)
def get_user_wallet(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    wallet = db.query(VirtualWallet).filter(
        VirtualWallet.user_id == user_id,
        VirtualWallet.institution_id == institution_id
    ).first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.put("/wallets/{wallet_id}", response_model=VirtualWalletResponse)
def update_wallet(
    wallet_id: int,
    wallet_update: VirtualWalletUpdate,
    db: Session = Depends(get_db)
):
    wallet = db.query(VirtualWallet).filter(VirtualWallet.id == wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    for key, value in wallet_update.model_dump(exclude_unset=True).items():
        setattr(wallet, key, value)
    
    db.commit()
    db.refresh(wallet)
    return wallet


@router.post("/transactions", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: WalletTransactionCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    wallet = db.query(VirtualWallet).filter(VirtualWallet.id == transaction.wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if transaction.transaction_type in [TransactionType.WITHDRAWAL, TransactionType.EXPENSE, TransactionType.PURCHASE]:
        if wallet.current_balance < transaction.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        new_balance = wallet.current_balance - transaction.amount
    else:
        new_balance = wallet.current_balance + transaction.amount
    
    db_transaction = WalletTransaction(
        institution_id=institution_id,
        wallet_id=transaction.wallet_id,
        transaction_type=transaction.transaction_type,
        amount=transaction.amount,
        description=transaction.description,
        category=transaction.category,
        balance_after=new_balance,
        is_recurring=transaction.is_recurring,
        recurring_frequency=transaction.recurring_frequency,
        metadata=transaction.metadata
    )
    
    wallet.current_balance = new_balance
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction


@router.get("/wallets/{wallet_id}/transactions", response_model=List[WalletTransactionResponse])
def get_wallet_transactions(
    wallet_id: int,
    transaction_type: Optional[TransactionType] = None,
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(WalletTransaction).filter(WalletTransaction.wallet_id == wallet_id)
    
    if transaction_type:
        query = query.filter(WalletTransaction.transaction_type == transaction_type)
    
    if category:
        query = query.filter(WalletTransaction.category == category)
    
    return query.order_by(WalletTransaction.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/investments/simulate", response_model=InvestmentSimulationResponse)
def simulate_investment(
    request: InvestmentSimulationRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    wallet = db.query(VirtualWallet).filter(VirtualWallet.id == request.wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    simulated_price = Decimal("100.00")
    total_cost = request.quantity * simulated_price
    
    if wallet.current_balance < total_cost:
        return InvestmentSimulationResponse(
            success=False,
            message="Insufficient balance for investment",
            new_balance=wallet.current_balance
        )
    
    holding = InvestmentHolding(
        institution_id=institution_id,
        wallet_id=request.wallet_id,
        investment_type=request.investment_type,
        symbol=request.symbol,
        name=f"{request.symbol} Investment",
        quantity=request.quantity,
        purchase_price=simulated_price,
        current_price=simulated_price,
        total_value=total_cost,
        gain_loss=Decimal(0),
        gain_loss_percentage=Decimal(0),
        metadata={"simulated": True}
    )
    db.add(holding)
    
    transaction = WalletTransaction(
        institution_id=institution_id,
        wallet_id=request.wallet_id,
        transaction_type=TransactionType.INVESTMENT,
        amount=total_cost,
        description=f"Investment in {request.symbol}",
        category="investment",
        balance_after=wallet.current_balance - total_cost,
        metadata={"investment_type": request.investment_type.value, "symbol": request.symbol}
    )
    db.add(transaction)
    
    wallet.current_balance -= total_cost
    wallet.investment_total_value += total_cost
    
    if not wallet.investment_portfolio:
        wallet.investment_portfolio = {}
    
    if request.symbol not in wallet.investment_portfolio:
        wallet.investment_portfolio[request.symbol] = {"quantity": float(request.quantity), "value": float(total_cost)}
    else:
        wallet.investment_portfolio[request.symbol]["quantity"] += float(request.quantity)
        wallet.investment_portfolio[request.symbol]["value"] += float(total_cost)
    
    db.commit()
    db.refresh(holding)
    db.refresh(transaction)
    
    return InvestmentSimulationResponse(
        success=True,
        message=f"Successfully invested {total_cost} in {request.symbol}",
        holding=holding,
        new_balance=wallet.current_balance,
        transaction=transaction
    )


@router.get("/wallets/{wallet_id}/investments", response_model=List[InvestmentHoldingResponse])
def get_wallet_investments(
    wallet_id: int,
    db: Session = Depends(get_db)
):
    return db.query(InvestmentHolding).filter(InvestmentHolding.wallet_id == wallet_id).all()


@router.get("/wallets/{wallet_id}/portfolio-performance", response_model=PortfolioPerformanceResponse)
def get_portfolio_performance(
    wallet_id: int,
    db: Session = Depends(get_db)
):
    holdings = db.query(InvestmentHolding).filter(InvestmentHolding.wallet_id == wallet_id).all()
    
    if not holdings:
        return PortfolioPerformanceResponse(
            total_value=Decimal(0),
            total_invested=Decimal(0),
            total_gain_loss=Decimal(0),
            gain_loss_percentage=Decimal(0),
            holdings=[],
            best_performer=None,
            worst_performer=None
        )
    
    total_value = sum(h.total_value for h in holdings)
    total_invested = sum(h.quantity * h.purchase_price for h in holdings)
    total_gain_loss = total_value - total_invested
    gain_loss_percentage = (total_gain_loss / total_invested * 100) if total_invested > 0 else Decimal(0)
    
    best_performer = max(holdings, key=lambda h: h.gain_loss_percentage) if holdings else None
    worst_performer = min(holdings, key=lambda h: h.gain_loss_percentage) if holdings else None
    
    return PortfolioPerformanceResponse(
        total_value=total_value,
        total_invested=total_invested,
        total_gain_loss=total_gain_loss,
        gain_loss_percentage=gain_loss_percentage,
        holdings=holdings,
        best_performer=best_performer,
        worst_performer=worst_performer
    )


@router.put("/investments/{holding_id}/update-price", response_model=InvestmentHoldingResponse)
def update_investment_price(
    holding_id: int,
    new_price: Decimal,
    db: Session = Depends(get_db)
):
    holding = db.query(InvestmentHolding).filter(InvestmentHolding.id == holding_id).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Investment holding not found")
    
    holding.current_price = new_price
    holding.total_value = holding.quantity * new_price
    holding.gain_loss = holding.total_value - (holding.quantity * holding.purchase_price)
    holding.gain_loss_percentage = (holding.gain_loss / (holding.quantity * holding.purchase_price) * 100) if holding.purchase_price > 0 else Decimal(0)
    
    wallet = db.query(VirtualWallet).filter(VirtualWallet.id == holding.wallet_id).first()
    if wallet:
        all_holdings = db.query(InvestmentHolding).filter(InvestmentHolding.wallet_id == wallet.id).all()
        wallet.investment_total_value = sum(h.total_value for h in all_holdings)
    
    db.commit()
    db.refresh(holding)
    return holding


@router.post("/challenges", response_model=FinanceChallengeResponse, status_code=status.HTTP_201_CREATED)
def create_challenge(
    challenge: FinanceChallengeCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    db_challenge = FinanceChallenge(
        institution_id=institution_id,
        **challenge.model_dump()
    )
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge


@router.get("/challenges", response_model=List[FinanceChallengeResponse])
def list_challenges(
    institution_id: int = Query(...),
    challenge_type: Optional[ChallengeType] = None,
    is_active: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(FinanceChallenge).filter(
        FinanceChallenge.institution_id == institution_id,
        FinanceChallenge.is_active == is_active
    )
    
    if challenge_type:
        query = query.filter(FinanceChallenge.challenge_type == challenge_type)
    
    return query.offset(skip).limit(limit).all()


@router.get("/challenges/{challenge_id}", response_model=FinanceChallengeResponse)
def get_challenge(
    challenge_id: int,
    db: Session = Depends(get_db)
):
    challenge = db.query(FinanceChallenge).filter(FinanceChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


@router.put("/challenges/{challenge_id}", response_model=FinanceChallengeResponse)
def update_challenge(
    challenge_id: int,
    challenge_update: FinanceChallengeUpdate,
    db: Session = Depends(get_db)
):
    challenge = db.query(FinanceChallenge).filter(FinanceChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    for key, value in challenge_update.model_dump(exclude_unset=True).items():
        setattr(challenge, key, value)
    
    db.commit()
    db.refresh(challenge)
    return challenge


@router.post("/challenges/{challenge_id}/participate", response_model=ChallengeParticipationResponse, status_code=status.HTTP_201_CREATED)
def participate_in_challenge(
    challenge_id: int,
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    challenge = db.query(FinanceChallenge).filter(FinanceChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.max_participants:
        current_count = db.query(func.count(ChallengeParticipation.id)).filter(
            ChallengeParticipation.challenge_id == challenge_id
        ).scalar()
        
        if current_count >= challenge.max_participants:
            raise HTTPException(status_code=400, detail="Challenge is full")
    
    existing = db.query(ChallengeParticipation).filter(
        ChallengeParticipation.user_id == user_id,
        ChallengeParticipation.challenge_id == challenge_id
    ).first()
    
    if existing:
        return existing
    
    participation = ChallengeParticipation(
        institution_id=institution_id,
        user_id=user_id,
        challenge_id=challenge_id,
        status=ChallengeStatus.IN_PROGRESS,
        progress_data={}
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)
    return participation


@router.put("/participations/{participation_id}", response_model=ChallengeParticipationResponse)
def update_participation(
    participation_id: int,
    update_data: ChallengeParticipationUpdate,
    db: Session = Depends(get_db)
):
    participation = db.query(ChallengeParticipation).filter(
        ChallengeParticipation.id == participation_id
    ).first()
    
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(participation, key, value)
    
    if update_data.status == ChallengeStatus.COMPLETED and not participation.completed_at:
        participation.completed_at = datetime.utcnow()
        
        challenge = db.query(FinanceChallenge).filter(
            FinanceChallenge.id == participation.challenge_id
        ).first()
        
        if challenge:
            participation.points_earned = challenge.points_reward
            
            wallet = db.query(VirtualWallet).filter(
                VirtualWallet.user_id == participation.user_id
            ).first()
            
            if wallet:
                wallet.total_challenges_completed += 1
    
    db.commit()
    db.refresh(participation)
    return participation


@router.get("/users/{user_id}/challenge-participations", response_model=List[ChallengeParticipationResponse])
def get_user_participations(
    user_id: int,
    institution_id: int = Query(...),
    status: Optional[ChallengeStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ChallengeParticipation).filter(
        ChallengeParticipation.user_id == user_id,
        ChallengeParticipation.institution_id == institution_id
    )
    
    if status:
        query = query.filter(ChallengeParticipation.status == status)
    
    return query.all()


@router.get("/challenges/{challenge_id}/leaderboard", response_model=ChallengeLeaderboardResponse)
def get_challenge_leaderboard(
    challenge_id: int,
    user_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    challenge = db.query(FinanceChallenge).filter(FinanceChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    participations = db.query(ChallengeParticipation, User).join(
        User, ChallengeParticipation.user_id == User.id
    ).filter(
        ChallengeParticipation.challenge_id == challenge_id,
        ChallengeParticipation.status == ChallengeStatus.COMPLETED
    ).order_by(
        ChallengeParticipation.points_earned.desc(),
        ChallengeParticipation.completed_at.asc()
    ).limit(limit).all()
    
    entries = []
    current_user_rank = None
    
    for rank, (participation, user) in enumerate(participations, start=1):
        entry = ChallengeLeaderboardEntry(
            user_id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            rank=rank,
            score=participation.points_earned,
            completion_time_minutes=None
        )
        entries.append(entry)
        
        if user_id and user.id == user_id:
            current_user_rank = rank
    
    total_participants = db.query(func.count(ChallengeParticipation.id)).filter(
        ChallengeParticipation.challenge_id == challenge_id
    ).scalar()
    
    return ChallengeLeaderboardResponse(
        challenge_id=challenge_id,
        challenge_title=challenge.title,
        entries=entries,
        total_participants=total_participants,
        current_user_rank=current_user_rank
    )


@router.post("/assessments", response_model=FinancialLiteracyAssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    assessment: FinancialLiteracyAssessmentCreate,
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    db_assessment = FinancialLiteracyAssessment(
        institution_id=institution_id,
        user_id=user_id,
        **assessment.model_dump()
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    return db_assessment


@router.get("/users/{user_id}/assessments", response_model=List[FinancialLiteracyAssessmentResponse])
def get_user_assessments(
    user_id: int,
    institution_id: int = Query(...),
    assessment_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(FinancialLiteracyAssessment).filter(
        FinancialLiteracyAssessment.user_id == user_id,
        FinancialLiteracyAssessment.institution_id == institution_id
    )
    
    if assessment_type:
        query = query.filter(FinancialLiteracyAssessment.assessment_type == assessment_type)
    
    return query.order_by(FinancialLiteracyAssessment.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/users/{user_id}/financial-health", response_model=FinancialHealthReport)
def get_financial_health(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    wallet = db.query(VirtualWallet).filter(
        VirtualWallet.user_id == user_id,
        VirtualWallet.institution_id == institution_id
    ).first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    savings_rate = Decimal(0)
    if wallet.monthly_income > 0:
        savings = wallet.monthly_income - wallet.monthly_expenses
        savings_rate = (savings / wallet.monthly_income * 100)
    
    holdings = db.query(InvestmentHolding).filter(InvestmentHolding.wallet_id == wallet.id).all()
    investment_diversity = len(set(h.investment_type for h in holdings))
    
    debt_to_income = Decimal(0)
    if wallet.monthly_income > 0:
        debt_to_income = (wallet.monthly_expenses / wallet.monthly_income)
    
    budget_adherence = Decimal(100) if wallet.monthly_expenses <= wallet.monthly_income else Decimal(50)
    
    recommendations = []
    strengths = []
    areas_for_improvement = []
    
    if wallet.current_balance > 1000:
        strengths.append("Healthy cash reserves")
    else:
        areas_for_improvement.append("Build emergency fund")
        recommendations.append("Aim to save at least $1000 for emergencies")
    
    if savings_rate > 20:
        strengths.append(f"Excellent savings rate ({savings_rate:.1f}%)")
    elif savings_rate < 10:
        areas_for_improvement.append("Low savings rate")
        recommendations.append("Try to save at least 10-20% of your income")
    
    if investment_diversity >= 3:
        strengths.append("Well-diversified investment portfolio")
    elif investment_diversity > 0:
        recommendations.append("Consider diversifying your investment portfolio")
    else:
        areas_for_improvement.append("No investments")
        recommendations.append("Start investing to build wealth over time")
    
    return FinancialHealthReport(
        overall_score=wallet.financial_health_score,
        balance=wallet.current_balance,
        savings_rate=savings_rate,
        investment_diversity=investment_diversity,
        budget_adherence=budget_adherence,
        debt_to_income_ratio=debt_to_income,
        recommendations=recommendations,
        strengths=strengths,
        areas_for_improvement=areas_for_improvement
    )


@router.get("/users/{user_id}/financial-progress", response_model=UserFinancialProgress)
def get_user_financial_progress(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    total_modules = db.query(func.count(FinanceLiteracyModule.id)).filter(
        FinanceLiteracyModule.institution_id == institution_id,
        FinanceLiteracyModule.is_active == True
    ).scalar()
    
    modules_completed = db.query(func.count(ModuleCompletion.id)).filter(
        ModuleCompletion.user_id == user_id,
        ModuleCompletion.institution_id == institution_id,
        ModuleCompletion.is_completed == True
    ).scalar()
    
    total_challenges = db.query(func.count(FinanceChallenge.id)).filter(
        FinanceChallenge.institution_id == institution_id,
        FinanceChallenge.is_active == True
    ).scalar()
    
    challenges_completed = db.query(func.count(ChallengeParticipation.id)).filter(
        ChallengeParticipation.user_id == user_id,
        ChallengeParticipation.institution_id == institution_id,
        ChallengeParticipation.status == ChallengeStatus.COMPLETED
    ).scalar()
    
    wallet = db.query(VirtualWallet).filter(
        VirtualWallet.user_id == user_id,
        VirtualWallet.institution_id == institution_id
    ).first()
    
    wallet_balance = wallet.current_balance if wallet else Decimal(0)
    investment_value = wallet.investment_total_value if wallet else Decimal(0)
    financial_health_score = wallet.financial_health_score if wallet else 50
    
    recent_transactions = []
    if wallet:
        recent_trans = db.query(WalletTransaction).filter(
            WalletTransaction.wallet_id == wallet.id
        ).order_by(WalletTransaction.created_at.desc()).limit(5).all()
        
        for trans in recent_trans:
            recent_transactions.append({
                "type": trans.transaction_type.value,
                "amount": float(trans.amount),
                "description": trans.description,
                "created_at": trans.created_at.isoformat()
            })
    
    return UserFinancialProgress(
        modules_completed=modules_completed or 0,
        total_modules=total_modules or 0,
        challenges_completed=challenges_completed or 0,
        total_challenges=total_challenges or 0,
        wallet_balance=wallet_balance,
        investment_value=investment_value,
        financial_health_score=financial_health_score,
        badges_earned=0,
        total_points=0,
        recent_activities=recent_transactions
    )
