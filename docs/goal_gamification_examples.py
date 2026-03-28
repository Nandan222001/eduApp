"""
Goal Setting and Gamification System - Usage Examples

This file contains practical examples of using the goal and gamification APIs.
"""

import requests
from datetime import date, timedelta

BASE_URL = "http://localhost:8000/api/v1"
INSTITUTION_ID = 1
USER_ID = 1


def example_create_badge():
    """Create a new badge"""
    badge_data = {
        "name": "Perfect Attendance Champion",
        "description": "Achieved 100% attendance for an entire semester",
        "badge_type": "attendance",
        "rarity": "epic",
        "icon_url": "/static/badges/perfect-attendance-champion.png",
        "points_required": 1000,
        "criteria": "Maintain 100% attendance for 90 consecutive days",
        "is_active": True
    }
    
    response = requests.post(
        f"{BASE_URL}/gamification/badges",
        json=badge_data,
        params={"institution_id": INSTITUTION_ID}
    )
    return response.json()


def example_create_goal_with_milestones():
    """Create a goal with milestones using SMART framework"""
    today = date.today()
    end_date = today + timedelta(days=90)
    
    goal_data = {
        "title": "Achieve 90% in Mathematics",
        "description": "Improve mathematics performance to 90% or above",
        "goal_type": "grade",
        "category": "Academic Performance",
        "specific": "Score 90% or higher in all mathematics assessments",
        "measurable": "Track average score across all tests and assignments",
        "achievable": "Currently at 85%, need to improve by 5%",
        "relevant": "Mathematics is crucial for my engineering aspirations",
        "time_bound": f"Complete by {end_date.isoformat()}",
        "target_value": 90.0,
        "unit": "percentage",
        "start_date": today.isoformat(),
        "end_date": end_date.isoformat(),
        "points_reward": 200,
        "subject_id": 5,
        "milestones": [
            {
                "title": "Reach 86% Average",
                "description": "First improvement milestone",
                "target_value": 86.0,
                "order": 1,
                "points_reward": 40
            },
            {
                "title": "Reach 88% Average",
                "description": "Halfway milestone",
                "target_value": 88.0,
                "order": 2,
                "points_reward": 60
            },
            {
                "title": "Achieve 90% Average",
                "description": "Final goal achievement",
                "target_value": 90.0,
                "order": 3,
                "points_reward": 100
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/goals",
        json=goal_data,
        params={"institution_id": INSTITUTION_ID, "user_id": USER_ID}
    )
    return response.json()


def example_calculate_automatic_progress(goal_id):
    """Trigger automatic progress calculation from system data"""
    response = requests.post(
        f"{BASE_URL}/goals/{goal_id}/calculate-progress"
    )
    return response.json()


def example_get_progress_report(goal_id):
    """Get detailed progress report for a goal"""
    response = requests.get(
        f"{BASE_URL}/goals/{goal_id}/report"
    )
    return response.json()


if __name__ == "__main__":
    print("Goal & Gamification API Examples")
    print("See function definitions above for usage examples")
