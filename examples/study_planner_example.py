"""
Study Planner Example Usage

This example demonstrates how to use the Study Planner API endpoints
to create personalized study plans for students.
"""

import requests
from datetime import date, timedelta
from decimal import Decimal

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
AUTH_TOKEN = "your_auth_token_here"
INSTITUTION_ID = 1

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}


def identify_weak_areas(student_id: int, exam_id: int):
    """Identify weak areas from exam performance"""
    url = f"{BASE_URL}/study-planner/weak-areas/identify-from-exam"
    params = {"institution_id": INSTITUTION_ID}
    data = {
        "student_id": student_id,
        "exam_id": exam_id,
        "weakness_threshold": 60.0
    }
    
    response = requests.post(url, params=params, json=data, headers=headers)
    response.raise_for_status()
    
    weak_areas = response.json()
    print(f"✓ Identified {len(weak_areas)} weak areas")
    
    for wa in weak_areas:
        print(f"  - {wa['subject_name']}: Weakness Score {wa['weakness_score']}")
    
    return weak_areas


def prioritize_topics(student_id: int, exam_id: int = None):
    """Get prioritized topics based on weak areas"""
    url = f"{BASE_URL}/study-planner/topics/prioritize"
    params = {"institution_id": INSTITUTION_ID}
    data = {
        "student_id": student_id,
        "exam_id": exam_id,
        "include_weak_areas_only": True
    }
    
    response = requests.post(url, params=params, json=data, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    priorities = result["priorities"]
    
    print(f"\n✓ Generated {len(priorities)} topic priorities")
    print(f"  Total recommended hours: {result['total_recommended_hours']}")
    
    print("\n  Top 5 priorities:")
    for i, priority in enumerate(priorities[:5], 1):
        print(f"    {i}. {priority['topic_name']} ({priority['subject_name']})")
        print(f"       Priority Score: {priority['priority_score']:.2f}")
        print(f"       Recommended Hours: {priority['recommended_hours']}")
    
    return result


def generate_study_plan(student_id: int, exam_id: int):
    """Generate AI-powered study plan"""
    url = f"{BASE_URL}/study-planner/plans/generate"
    params = {"institution_id": INSTITUTION_ID}
    
    start_date = date.today()
    end_date = start_date + timedelta(days=30)
    
    data = {
        "student_id": student_id,
        "target_exam_id": exam_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "hours_per_day": 4.0,
        "include_weekends": True,
        "preferred_start_time": "14:00:00"
    }
    
    response = requests.post(url, params=params, json=data, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    plan = result["study_plan"]
    summary = result["summary"]
    
    print(f"\n✓ Study plan generated successfully!")
    print(f"  Plan ID: {plan['id']}")
    print(f"  Name: {plan['name']}")
    print(f"  Duration: {plan['start_date']} to {plan['end_date']}")
    print(f"  Total Days: {summary['total_days']}")
    print(f"  Total Hours: {summary['total_hours']}")
    print(f"  Total Topics: {summary['total_topics']}")
    print(f"  Total Tasks: {summary['total_tasks']}")
    print(f"  Avg Tasks/Day: {summary['average_tasks_per_day']}")
    
    return result


def get_daily_tasks(student_id: int, study_plan_id: int, task_date: date = None):
    """Get tasks for a specific day"""
    url = f"{BASE_URL}/study-planner/tasks/daily"
    params = {"institution_id": INSTITUTION_ID}
    
    if task_date is None:
        task_date = date.today()
    
    data = {
        "student_id": student_id,
        "study_plan_id": study_plan_id,
        "date": task_date.isoformat()
    }
    
    response = requests.post(url, params=params, json=data, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    
    print(f"\n✓ Daily tasks for {result['date']}")
    print(f"  Total Tasks: {result['total_tasks']}")
    print(f"  Completed: {result['completed_tasks']}")
    print(f"  Pending: {result['pending_tasks']}")
    print(f"  Completion Rate: {result['completion_rate']:.1f}%")
    
    print("\n  Tasks:")
    for task in result['tasks']:
        status_emoji = "✅" if task['status'] == "COMPLETED" else "⏳"
        print(f"    {status_emoji} {task['title']}")
        print(f"       {task['estimated_duration_minutes']} min | Priority: {task['priority']}")
    
    return result


def complete_task(task_id: int, actual_minutes: int):
    """Mark a task as completed"""
    url = f"{BASE_URL}/study-planner/tasks/complete"
    params = {"institution_id": INSTITUTION_ID}
    data = {
        "task_id": task_id,
        "actual_duration_minutes": actual_minutes,
        "completion_percentage": 100
    }
    
    response = requests.post(url, params=params, json=data, headers=headers)
    response.raise_for_status()
    
    task = response.json()
    print(f"\n✓ Task completed: {task['title']}")
    print(f"  Actual time: {task['actual_duration_minutes']} minutes")
    
    return task


def reschedule_task(task_id: int, new_date: date, reason: str):
    """Reschedule a single task"""
    url = f"{BASE_URL}/study-planner/tasks/reschedule"
    params = {"institution_id": INSTITUTION_ID}
    data = {
        "task_id": task_id,
        "new_date": new_date.isoformat(),
        "reason": reason
    }
    
    response = requests.post(url, params=params, json=data, headers=headers)
    response.raise_for_status()
    
    task = response.json()
    print(f"\n✓ Task rescheduled: {task['title']}")
    print(f"  From: {task['rescheduled_from_date']}")
    print(f"  To: {task['rescheduled_to_date']}")
    print(f"  Reason: {task['rescheduled_reason']}")
    
    return task


def adaptive_reschedule(study_plan_id: int, reason: str):
    """Use adaptive rescheduling for all pending tasks"""
    url = f"{BASE_URL}/study-planner/tasks/adaptive-reschedule"
    params = {"institution_id": INSTITUTION_ID}
    data = {
        "study_plan_id": study_plan_id,
        "reason": reason,
        "consider_pending_tasks": True,
        "redistribute_hours": True
    }
    
    response = requests.post(url, params=params, json=data, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    print(f"\n✓ {result['message']}")
    print(f"  Rescheduled: {result['rescheduled_tasks_count']} tasks")
    print(f"  Affected dates: {len(result['affected_dates'])}")
    
    return result


def sync_calendar(study_plan_id: int):
    """Sync study plan with calendar"""
    url = f"{BASE_URL}/study-planner/calendar/sync"
    params = {"institution_id": INSTITUTION_ID}
    data = {
        "study_plan_id": study_plan_id,
        "calendar_provider": "google",
        "sync_url": "https://calendar.google.com/..."
    }
    
    response = requests.post(url, params=params, json=data, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    print(f"\n✓ {result['message']}")
    print(f"  Synced: {result['synced_tasks_count']} tasks")
    
    return result


def get_study_progress(study_plan_id: int, days: int = 7):
    """Get study progress for last N days"""
    url = f"{BASE_URL}/study-planner/progress"
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    params = {
        "institution_id": INSTITUTION_ID,
        "study_plan_id": study_plan_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    
    progress_list = response.json()
    
    print(f"\n✓ Study progress for last {days} days")
    print(f"  Days with data: {len(progress_list)}")
    
    if progress_list:
        avg_completion = sum(p['completion_rate'] for p in progress_list) / len(progress_list)
        avg_adherence = sum(p['adherence_score'] for p in progress_list if p['adherence_score']) / len(progress_list)
        
        print(f"  Avg Completion Rate: {avg_completion:.1f}%")
        print(f"  Avg Adherence Score: {avg_adherence:.1f}%")
        
        print("\n  Daily breakdown:")
        for progress in progress_list[:5]:  # Show last 5 days
            print(f"    {progress['progress_date']}")
            print(f"      Completed: {progress['completed_tasks']}/{progress['total_tasks']}")
            print(f"      Hours: {progress['actual_study_hours']}/{progress['total_study_hours']}")
    
    return progress_list


def main():
    """Main example workflow"""
    print("=" * 60)
    print("Study Planner Example Workflow")
    print("=" * 60)
    
    # Configuration
    STUDENT_ID = 1
    PAST_EXAM_ID = 5  # Exam to analyze for weak areas
    TARGET_EXAM_ID = 6  # Upcoming exam to prepare for
    
    try:
        # Step 1: Identify weak areas from past exam
        print("\n1. Identifying weak areas from exam...")
        weak_areas = identify_weak_areas(STUDENT_ID, PAST_EXAM_ID)
        
        # Step 2: Get prioritized topics
        print("\n2. Prioritizing topics...")
        priorities = prioritize_topics(STUDENT_ID, TARGET_EXAM_ID)
        
        # Step 3: Generate study plan
        print("\n3. Generating AI study plan...")
        plan_result = generate_study_plan(STUDENT_ID, TARGET_EXAM_ID)
        study_plan_id = plan_result["study_plan"]["id"]
        
        # Step 4: Get today's tasks
        print("\n4. Getting today's tasks...")
        daily_tasks = get_daily_tasks(STUDENT_ID, study_plan_id)
        
        # Step 5: Complete a task (example)
        if daily_tasks['tasks']:
            task_id = daily_tasks['tasks'][0]['id']
            print("\n5. Completing first task...")
            complete_task(task_id, 90)
        
        # Step 6: Reschedule a task (example)
        if len(daily_tasks['tasks']) > 1:
            task_id = daily_tasks['tasks'][1]['id']
            new_date = date.today() + timedelta(days=1)
            print("\n6. Rescheduling second task...")
            reschedule_task(task_id, new_date, "Time conflict")
        
        # Step 7: Adaptive rescheduling (if needed)
        print("\n7. Running adaptive rescheduling...")
        adaptive_reschedule(study_plan_id, "Adjusting for progress")
        
        # Step 8: Sync with calendar
        print("\n8. Syncing with calendar...")
        sync_calendar(study_plan_id)
        
        # Step 9: View progress
        print("\n9. Viewing study progress...")
        get_study_progress(study_plan_id, days=7)
        
        print("\n" + "=" * 60)
        print("✓ Example workflow completed successfully!")
        print("=" * 60)
        
    except requests.exceptions.RequestException as e:
        print(f"\n✗ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")


if __name__ == "__main__":
    main()
