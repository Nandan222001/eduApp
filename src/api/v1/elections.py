from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract
from datetime import datetime
import hashlib
import secrets
import json

from src.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.elections import (
    Election, Candidate, Vote, VoterRegistry, ElectionResult,
    CampaignActivity, ElectionAnalytics, ElectionStatus, CandidateStatus, VoteStatus
)
from src.dependencies.auth import get_current_user
from src.schemas.elections import (
    ElectionCreate, ElectionUpdate, ElectionResponse, ElectionWithStats,
    CandidateCreate, CandidateUpdate, CandidateResponse, CandidateWithStudent,
    CandidateWithVotes, VoteCreate, RankedChoiceVote, VoteResponse, VoteCastResponse,
    CandidateApprovalRequest, ElectionResultResponse, ElectionResultWithCandidate,
    CampaignActivityCreate, CampaignActivityUpdate, CampaignActivityResponse,
    ElectionAnalyticsResponse, VoterRegistryResponse
)

router = APIRouter()


def generate_vote_hash(election_id: int, candidate_id: int, timestamp: str) -> str:
    data = f"{election_id}:{candidate_id}:{timestamp}:{secrets.token_hex(16)}"
    return hashlib.sha256(data.encode()).hexdigest()


def generate_voter_hash(student_id: int, election_id: int) -> str:
    data = f"{student_id}:{election_id}:{secrets.token_hex(32)}"
    return hashlib.sha256(data.encode()).hexdigest()


def encrypt_vote(candidate_id: int, salt: str) -> str:
    data = f"{candidate_id}:{salt}"
    return hashlib.sha256(data.encode()).hexdigest()


def calculate_ranked_choice_results(election_id: int, db: Session) -> List[Dict[str, Any]]:
    candidates = db.query(Candidate).filter(
        Candidate.election_id == election_id,
        Candidate.candidate_status == CandidateStatus.APPROVED.value
    ).all()
    
    votes = db.query(Vote).filter(
        Vote.election_id == election_id,
        Vote.vote_status == VoteStatus.VERIFIED.value
    ).all()
    
    votes_by_voter = {}
    for vote in votes:
        if vote.voter_hash not in votes_by_voter:
            votes_by_voter[vote.voter_hash] = []
        votes_by_voter[vote.voter_hash].append({
            'candidate_id': vote.candidate_id,
            'rank': vote.rank_position or 1
        })
    
    for voter_hash in votes_by_voter:
        votes_by_voter[voter_hash].sort(key=lambda x: x['rank'])
    
    candidate_votes = {c.id: {'first': 0, 'second': 0, 'third': 0, 'total': 0, 'points': 0} for c in candidates}
    
    for voter_ballots in votes_by_voter.values():
        for idx, ballot in enumerate(voter_ballots[:3]):
            candidate_id = ballot['candidate_id']
            if candidate_id in candidate_votes:
                if idx == 0:
                    candidate_votes[candidate_id]['first'] += 1
                    candidate_votes[candidate_id]['points'] += 3
                elif idx == 1:
                    candidate_votes[candidate_id]['second'] += 1
                    candidate_votes[candidate_id]['points'] += 2
                elif idx == 2:
                    candidate_votes[candidate_id]['third'] += 1
                    candidate_votes[candidate_id]['points'] += 1
                candidate_votes[candidate_id]['total'] += 1
    
    results = []
    for candidate in candidates:
        vote_data = candidate_votes[candidate.id]
        results.append({
            'candidate_id': candidate.id,
            'first_choice_votes': vote_data['first'],
            'second_choice_votes': vote_data['second'],
            'third_choice_votes': vote_data['third'],
            'total_votes': vote_data['total'],
            'total_points': vote_data['points']
        })
    
    results.sort(key=lambda x: (x['total_points'], x['first_choice_votes']), reverse=True)
    
    for idx, result in enumerate(results):
        result['rank_position'] = idx + 1
        result['is_winner'] = idx == 0
    
    return results


@router.post("/", response_model=ElectionResponse, status_code=status.HTTP_201_CREATED)
async def create_election(
    election_data: ElectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != election_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    election = Election(**election_data.model_dump(), created_by=current_user.id)
    db.add(election)
    db.commit()
    db.refresh(election)
    return election


@router.get("/", response_model=dict)
async def list_elections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    position: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Election).filter(Election.institution_id == current_user.institution_id)
    
    if position:
        query = query.filter(Election.position == position)
    if status_filter:
        query = query.filter(Election.election_status == status_filter)
    
    total = query.count()
    elections = query.order_by(Election.voting_start.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": [ElectionResponse.model_validate(e) for e in elections],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{election_id}", response_model=ElectionWithStats)
async def get_election(
    election_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    total_candidates = db.query(Candidate).filter(
        Candidate.election_id == election_id,
        Candidate.candidate_status == CandidateStatus.APPROVED.value
    ).count()
    
    total_eligible_voters = db.query(VoterRegistry).filter(
        VoterRegistry.election_id == election_id,
        VoterRegistry.is_eligible == True
    ).count()
    
    total_votes_cast = db.query(VoterRegistry).filter(
        VoterRegistry.election_id == election_id,
        VoterRegistry.has_voted == True
    ).count()
    
    voter_turnout_percentage = None
    if total_eligible_voters > 0:
        voter_turnout_percentage = f"{(total_votes_cast / total_eligible_voters * 100):.2f}"
    
    election_dict = {
        **election.__dict__,
        "total_candidates": total_candidates,
        "total_eligible_voters": total_eligible_voters,
        "total_votes_cast": total_votes_cast,
        "voter_turnout_percentage": voter_turnout_percentage
    }
    
    return election_dict


@router.put("/{election_id}", response_model=ElectionResponse)
async def update_election(
    election_id: int,
    election_data: ElectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    for key, value in election_data.model_dump(exclude_unset=True).items():
        setattr(election, key, value)
    
    db.commit()
    db.refresh(election)
    return election


@router.delete("/{election_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_election(
    election_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    db.delete(election)
    db.commit()


@router.post("/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def nominate_candidate(
    candidate_data: CandidateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == candidate_data.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    if election.election_status not in [ElectionStatus.DRAFT.value, ElectionStatus.NOMINATION_OPEN.value]:
        raise HTTPException(status_code=400, detail="Nomination period is not open")
    
    existing = db.query(Candidate).filter(
        Candidate.election_id == candidate_data.election_id,
        Candidate.student_id == candidate_data.student_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Student already nominated for this election")
    
    candidate = Candidate(**candidate_data.model_dump(), nominated_by=current_user.id)
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/candidates/election/{election_id}", response_model=List[CandidateWithStudent])
async def list_candidates(
    election_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    query = db.query(Candidate, Student).join(
        Student, Candidate.student_id == Student.id
    ).filter(Candidate.election_id == election_id)
    
    if status_filter:
        query = query.filter(Candidate.candidate_status == status_filter)
    
    results = query.all()
    
    candidates_with_students = []
    for candidate, student in results:
        candidate_dict = {
            **candidate.__dict__,
            "student_name": f"{student.first_name} {student.last_name}",
            "student_email": student.email,
            "student_photo_url": student.photo_url
        }
        candidates_with_students.append(candidate_dict)
    
    return candidates_with_students


@router.get("/candidates/{candidate_id}", response_model=CandidateWithStudent)
async def get_candidate(
    candidate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate, student = db.query(Candidate, Student).join(
        Student, Candidate.student_id == Student.id
    ).filter(
        Candidate.id == candidate_id
    ).first() or (None, None)
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    election = db.query(Election).filter(
        Election.id == candidate.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate_dict = {
        **candidate.__dict__,
        "student_name": f"{student.first_name} {student.last_name}",
        "student_email": student.email,
        "student_photo_url": student.photo_url
    }
    
    return candidate_dict


@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int,
    candidate_data: CandidateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    election = db.query(Election).filter(
        Election.id == candidate.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in candidate_data.model_dump(exclude_unset=True).items():
        if key == "withdrawal_reason" and value:
            setattr(candidate, "withdrawal_date", datetime.utcnow())
        setattr(candidate, key, value)
    
    db.commit()
    db.refresh(candidate)
    return candidate


@router.post("/candidates/{candidate_id}/approve", response_model=CandidateResponse)
async def approve_candidate(
    candidate_id: int,
    approval_data: CandidateApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    election = db.query(Election).filter(
        Election.id == candidate.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    candidate.candidate_status = approval_data.candidate_status
    candidate.approved_by = current_user.id
    candidate.approval_date = datetime.utcnow()
    
    if approval_data.rejection_reason:
        candidate.rejection_reason = approval_data.rejection_reason
    
    db.commit()
    db.refresh(candidate)
    return candidate


@router.post("/votes/cast", response_model=VoteCastResponse)
async def cast_vote(
    vote_data: VoteCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == vote_data.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    if election.election_status != ElectionStatus.VOTING_OPEN.value:
        raise HTTPException(status_code=400, detail="Voting is not open")
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")
    
    voter_registry = db.query(VoterRegistry).filter(
        VoterRegistry.election_id == vote_data.election_id,
        VoterRegistry.student_id == student.id
    ).first()
    
    if not voter_registry:
        raise HTTPException(status_code=403, detail="Not eligible to vote in this election")
    
    if voter_registry.has_voted:
        raise HTTPException(status_code=400, detail="Already voted in this election")
    
    candidate = db.query(Candidate).filter(
        Candidate.id == vote_data.candidate_id,
        Candidate.election_id == vote_data.election_id,
        Candidate.candidate_status == CandidateStatus.APPROVED.value
    ).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found or not approved")
    
    timestamp = datetime.utcnow()
    vote_hash = generate_vote_hash(vote_data.election_id, vote_data.candidate_id, timestamp.isoformat())
    voter_hash = generate_voter_hash(student.id, vote_data.election_id)
    verification_code = secrets.token_urlsafe(16)
    salt = secrets.token_hex(32)
    encrypted_vote = encrypt_vote(vote_data.candidate_id, salt)
    
    vote = Vote(
        election_id=vote_data.election_id,
        voter_student_id=student.id,
        candidate_id=vote_data.candidate_id,
        encrypted_vote=encrypted_vote,
        vote_hash=vote_hash,
        voter_hash=voter_hash,
        rank_position=vote_data.rank_position,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        vote_status=VoteStatus.VERIFIED.value,
        verification_code=verification_code,
        verified_at=timestamp,
        timestamp=timestamp
    )
    
    db.add(vote)
    
    voter_registry.has_voted = True
    voter_registry.voted_at = timestamp
    
    db.commit()
    
    return VoteCastResponse(
        success=True,
        message="Vote cast successfully",
        vote_hash=vote_hash,
        verification_code=verification_code,
        timestamp=timestamp
    )


@router.post("/votes/ranked-choice", response_model=VoteCastResponse)
async def cast_ranked_choice_vote(
    vote_data: RankedChoiceVote,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == vote_data.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    if not election.enable_ranked_choice:
        raise HTTPException(status_code=400, detail="Ranked choice voting not enabled for this election")
    
    if election.election_status != ElectionStatus.VOTING_OPEN.value:
        raise HTTPException(status_code=400, detail="Voting is not open")
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")
    
    voter_registry = db.query(VoterRegistry).filter(
        VoterRegistry.election_id == vote_data.election_id,
        VoterRegistry.student_id == student.id
    ).first()
    
    if not voter_registry:
        raise HTTPException(status_code=403, detail="Not eligible to vote in this election")
    
    if voter_registry.has_voted:
        raise HTTPException(status_code=400, detail="Already voted in this election")
    
    max_choices = election.max_ranking_choices or 3
    if len(vote_data.ranked_candidates) > max_choices:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot rank more than {max_choices} candidates"
        )
    
    timestamp = datetime.utcnow()
    voter_hash = generate_voter_hash(student.id, vote_data.election_id)
    verification_code = secrets.token_urlsafe(16)
    
    for rank, candidate_id in enumerate(vote_data.ranked_candidates, start=1):
        candidate = db.query(Candidate).filter(
            Candidate.id == candidate_id,
            Candidate.election_id == vote_data.election_id,
            Candidate.candidate_status == CandidateStatus.APPROVED.value
        ).first()
        
        if not candidate:
            raise HTTPException(
                status_code=404,
                detail=f"Candidate {candidate_id} not found or not approved"
            )
        
        vote_hash = generate_vote_hash(vote_data.election_id, candidate_id, f"{timestamp.isoformat()}:{rank}")
        salt = secrets.token_hex(32)
        encrypted_vote = encrypt_vote(candidate_id, salt)
        
        vote = Vote(
            election_id=vote_data.election_id,
            voter_student_id=student.id,
            candidate_id=candidate_id,
            encrypted_vote=encrypted_vote,
            vote_hash=vote_hash,
            voter_hash=voter_hash,
            rank_position=rank,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            vote_status=VoteStatus.VERIFIED.value,
            verification_code=verification_code,
            verified_at=timestamp,
            timestamp=timestamp
        )
        db.add(vote)
    
    voter_registry.has_voted = True
    voter_registry.voted_at = timestamp
    
    db.commit()
    
    return VoteCastResponse(
        success=True,
        message="Ranked choice vote cast successfully",
        vote_hash=voter_hash,
        verification_code=verification_code,
        timestamp=timestamp
    )


@router.post("/{election_id}/calculate-results", response_model=List[ElectionResultResponse])
async def calculate_results(
    election_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    if election.election_status not in [ElectionStatus.VOTING_CLOSED.value, ElectionStatus.RESULTS_ANNOUNCED.value]:
        raise HTTPException(status_code=400, detail="Voting must be closed to calculate results")
    
    db.query(ElectionResult).filter(ElectionResult.election_id == election_id).delete()
    
    if election.enable_ranked_choice:
        results_data = calculate_ranked_choice_results(election_id, db)
    else:
        candidates = db.query(Candidate).filter(
            Candidate.election_id == election_id,
            Candidate.candidate_status == CandidateStatus.APPROVED.value
        ).all()
        
        results_data = []
        for candidate in candidates:
            total_votes = db.query(Vote).filter(
                Vote.election_id == election_id,
                Vote.candidate_id == candidate.id,
                Vote.vote_status == VoteStatus.VERIFIED.value
            ).count()
            
            results_data.append({
                'candidate_id': candidate.id,
                'total_votes': total_votes,
                'first_choice_votes': total_votes,
                'second_choice_votes': 0,
                'third_choice_votes': 0,
                'total_points': total_votes
            })
        
        results_data.sort(key=lambda x: x['total_votes'], reverse=True)
        
        for idx, result in enumerate(results_data):
            result['rank_position'] = idx + 1
            result['is_winner'] = idx == 0
    
    total_votes = db.query(VoterRegistry).filter(
        VoterRegistry.election_id == election_id,
        VoterRegistry.has_voted == True
    ).count()
    
    election_results = []
    for result_data in results_data:
        vote_percentage = None
        if total_votes > 0:
            vote_percentage = f"{(result_data['total_votes'] / total_votes * 100):.2f}"
        
        election_result = ElectionResult(
            election_id=election_id,
            candidate_id=result_data['candidate_id'],
            total_votes=result_data['total_votes'],
            first_choice_votes=result_data.get('first_choice_votes'),
            second_choice_votes=result_data.get('second_choice_votes'),
            third_choice_votes=result_data.get('third_choice_votes'),
            total_points=result_data.get('total_points'),
            vote_percentage=vote_percentage,
            rank_position=result_data['rank_position'],
            is_winner=result_data['is_winner']
        )
        db.add(election_result)
        election_results.append(election_result)
    
    election.election_status = ElectionStatus.RESULTS_ANNOUNCED.value
    election.results_published_at = datetime.utcnow()
    
    db.commit()
    
    for result in election_results:
        db.refresh(result)
    
    return election_results


@router.get("/{election_id}/results", response_model=List[ElectionResultWithCandidate])
async def get_results(
    election_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    if election.election_status not in [ElectionStatus.RESULTS_ANNOUNCED.value, ElectionStatus.COMPLETED.value]:
        raise HTTPException(status_code=400, detail="Results not yet announced")
    
    results = db.query(ElectionResult, Candidate, Student).join(
        Candidate, ElectionResult.candidate_id == Candidate.id
    ).join(
        Student, Candidate.student_id == Student.id
    ).filter(
        ElectionResult.election_id == election_id
    ).order_by(ElectionResult.rank_position).all()
    
    results_with_candidates = []
    for result, candidate, student in results:
        result_dict = {
            **result.__dict__,
            "candidate_name": f"{student.first_name} {student.last_name}",
            "candidate_photo_url": student.photo_url,
            "campaign_statement": candidate.campaign_statement
        }
        results_with_candidates.append(result_dict)
    
    return results_with_candidates


@router.get("/{election_id}/analytics", response_model=ElectionAnalyticsResponse)
async def get_election_analytics(
    election_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    total_eligible_voters = db.query(VoterRegistry).filter(
        VoterRegistry.election_id == election_id,
        VoterRegistry.is_eligible == True
    ).count()
    
    total_votes_cast = db.query(VoterRegistry).filter(
        VoterRegistry.election_id == election_id,
        VoterRegistry.has_voted == True
    ).count()
    
    voter_turnout_percentage = 0.0
    if total_eligible_voters > 0:
        voter_turnout_percentage = (total_votes_cast / total_eligible_voters) * 100
    
    votes_by_hour = {}
    votes = db.query(Vote).filter(Vote.election_id == election_id).all()
    for vote in votes:
        hour = vote.timestamp.strftime("%Y-%m-%d %H:00")
        votes_by_hour[hour] = votes_by_hour.get(hour, 0) + 1
    
    votes_by_grade = {}
    
    candidates = db.query(Candidate).filter(
        Candidate.election_id == election_id
    ).all()
    
    candidate_statistics = []
    for candidate in candidates:
        student = db.query(Student).filter(Student.id == candidate.student_id).first()
        vote_count = db.query(Vote).filter(
            Vote.election_id == election_id,
            Vote.candidate_id == candidate.id,
            Vote.vote_status == VoteStatus.VERIFIED.value
        ).count()
        
        campaign_activities_count = db.query(CampaignActivity).filter(
            CampaignActivity.candidate_id == candidate.id
        ).count()
        
        candidate_statistics.append({
            "candidate_id": candidate.id,
            "candidate_name": f"{student.first_name} {student.last_name}" if student else "Unknown",
            "total_votes": vote_count,
            "campaign_activities": campaign_activities_count,
            "status": candidate.candidate_status
        })
    
    return ElectionAnalyticsResponse(
        election_id=election_id,
        total_eligible_voters=total_eligible_voters,
        total_votes_cast=total_votes_cast,
        voter_turnout_percentage=voter_turnout_percentage,
        votes_by_grade=votes_by_grade,
        votes_by_hour=votes_by_hour,
        campaign_engagement={
            "total_campaign_activities": db.query(CampaignActivity).join(
                Candidate
            ).filter(Candidate.election_id == election_id).count()
        },
        candidate_statistics=candidate_statistics
    )


@router.post("/campaign-activities", response_model=CampaignActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign_activity(
    activity_data: CampaignActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(Candidate.id == activity_data.candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    election = db.query(Election).filter(
        Election.id == candidate.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    activity = CampaignActivity(**activity_data.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/campaign-activities/candidate/{candidate_id}", response_model=List[CampaignActivityResponse])
async def list_campaign_activities(
    candidate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    election = db.query(Election).filter(
        Election.id == candidate.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    activities = db.query(CampaignActivity).filter(
        CampaignActivity.candidate_id == candidate_id
    ).order_by(CampaignActivity.activity_date.desc()).all()
    
    return activities


@router.put("/campaign-activities/{activity_id}", response_model=CampaignActivityResponse)
async def update_campaign_activity(
    activity_id: int,
    activity_data: CampaignActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activity = db.query(CampaignActivity).filter(CampaignActivity.id == activity_id).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Campaign activity not found")
    
    candidate = db.query(Candidate).filter(Candidate.id == activity.candidate_id).first()
    election = db.query(Election).filter(
        Election.id == candidate.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in activity_data.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)
    
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/campaign-activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activity = db.query(CampaignActivity).filter(CampaignActivity.id == activity_id).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Campaign activity not found")
    
    candidate = db.query(Candidate).filter(Candidate.id == activity.candidate_id).first()
    election = db.query(Election).filter(
        Election.id == candidate.election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(activity)
    db.commit()


@router.post("/{election_id}/voter-registry", response_model=dict)
async def register_voters(
    election_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    eligible_students = db.query(Student).filter(
        Student.institution_id == current_user.institution_id,
        Student.is_active == True
    ).all()
    
    registered_count = 0
    for student in eligible_students:
        existing = db.query(VoterRegistry).filter(
            VoterRegistry.election_id == election_id,
            VoterRegistry.student_id == student.id
        ).first()
        
        if not existing:
            voter_token = secrets.token_urlsafe(32)
            voter_registry = VoterRegistry(
                election_id=election_id,
                student_id=student.id,
                voter_token=voter_token
            )
            db.add(voter_registry)
            registered_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Registered {registered_count} new voters",
        "total_registered": registered_count
    }


@router.get("/{election_id}/voter-registry", response_model=List[VoterRegistryResponse])
async def list_voter_registry(
    election_id: int,
    has_voted: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    election = db.query(Election).filter(
        Election.id == election_id,
        Election.institution_id == current_user.institution_id
    ).first()
    
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    query = db.query(VoterRegistry).filter(VoterRegistry.election_id == election_id)
    
    if has_voted is not None:
        query = query.filter(VoterRegistry.has_voted == has_voted)
    
    voter_registry = query.all()
    return voter_registry
