#!/usr/bin/env python3
"""
Script to run alembic upgrade head and capture any errors
This helps debug migration 011 issues
"""

import sys
import subprocess
from pathlib import Path

# Change to project root
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def run_alembic_upgrade():
    """Run alembic upgrade head and capture output"""
    try:
        print("Running: alembic upgrade head")
        print("-" * 60)
        
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("\nSTDERR:")
            print(result.stderr)
        
        if result.returncode != 0:
            print(f"\n❌ Command failed with return code: {result.returncode}")
            return False
        else:
            print("\n✅ Migration completed successfully!")
            return True
            
    except subprocess.TimeoutExpired:
        print("❌ Command timed out after 300 seconds")
        return False
    except Exception as e:
        print(f"❌ Error running command: {e}")
        return False

def check_database_schema():
    """Check database schema using Python/SQLAlchemy"""
    try:
        from src.config import settings
        from sqlalchemy import create_engine, inspect, text
        
        print("\n" + "=" * 60)
        print("Checking Database Schema")
        print("=" * 60)
        
        engine = create_engine(settings.database_url)
        inspector = inspect(engine)
        
        # Check if questions_bank exists
        tables = inspector.get_table_names()
        print(f"\n📋 Total tables in database: {len(tables)}")
        
        if 'questions_bank' in tables:
            print("\n✅ questions_bank table exists")
            
            # Get column info for questions_bank.id
            columns = inspector.get_columns('questions_bank')
            id_column = next((col for col in columns if col['name'] == 'id'), None)
            if id_column:
                print(f"   - id column type: {id_column['type']}")
                print(f"   - id column nullable: {id_column['nullable']}")
        else:
            print("\n❌ questions_bank table does NOT exist")
            
        if 'question_recommendations' in tables:
            print("\n✅ question_recommendations table exists")
            
            # Get column info for question_recommendations.question_id
            columns = inspector.get_columns('question_recommendations')
            qid_column = next((col for col in columns if col['name'] == 'question_id'), None)
            if qid_column:
                print(f"   - question_id column type: {qid_column['type']}")
                print(f"   - question_id column nullable: {qid_column['nullable']}")
                
            # Get foreign keys
            fks = inspector.get_foreign_keys('question_recommendations')
            for fk in fks:
                if 'question_id' in fk['constrained_columns']:
                    print(f"   - Foreign key to: {fk['referred_table']}.{fk['referred_columns']}")
        else:
            print("\n❌ question_recommendations table does NOT exist")
            
        # Check current alembic version
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            print(f"\n📌 Current alembic version: {version}")
            
    except Exception as e:
        print(f"\n❌ Error checking database schema: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # First check the schema before migration
    print("=" * 60)
    print("BEFORE MIGRATION")
    print("=" * 60)
    check_database_schema()
    
    # Run the migration
    print("\n\n" + "=" * 60)
    print("RUNNING MIGRATION")
    print("=" * 60)
    success = run_alembic_upgrade()
    
    # Check schema after migration
    if success:
        print("\n\n" + "=" * 60)
        print("AFTER MIGRATION")
        print("=" * 60)
        check_database_schema()
