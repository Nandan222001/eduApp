#!/usr/bin/env python3
"""
Script to verify database schema for migration 011
Specifically checks questions_bank and question_recommendations tables
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def verify_schema():
    """Verify the database schema for migration 011 compatibility"""
    try:
        from src.config import settings
        from sqlalchemy import create_engine, inspect, text
        
        print("=" * 70)
        print("DATABASE SCHEMA VERIFICATION FOR MIGRATION 011")
        print("=" * 70)
        
        # Create engine
        engine = create_engine(settings.database_url)
        inspector = inspect(engine)
        
        # Get all tables
        tables = inspector.get_table_names()
        print(f"\n✓ Connected to database")
        print(f"✓ Total tables: {len(tables)}")
        
        # Check questions_bank table
        print("\n" + "-" * 70)
        print("CHECKING: questions_bank table")
        print("-" * 70)
        
        if 'questions_bank' not in tables:
            print("❌ FAIL: questions_bank table does NOT exist")
            print("   Action: Run 'alembic upgrade 006a' to create this table")
            return False
        
        print("✅ PASS: questions_bank table exists")
        
        # Check questions_bank.id column
        qb_columns = {col['name']: col for col in inspector.get_columns('questions_bank')}
        
        if 'id' not in qb_columns:
            print("❌ FAIL: id column not found in questions_bank")
            return False
        
        id_col = qb_columns['id']
        print(f"✅ PASS: id column exists")
        print(f"   Type: {id_col['type']}")
        print(f"   Nullable: {id_col['nullable']}")
        print(f"   Autoincrement: {id_col.get('autoincrement', 'N/A')}")
        
        # Verify it's an integer type
        id_type_str = str(id_col['type']).upper()
        if 'INT' not in id_type_str:
            print(f"⚠️  WARNING: id column type is {id_col['type']}, expected INTEGER")
        else:
            print(f"✅ PASS: id column is INTEGER type")
        
        # Check primary key
        pk_constraint = inspector.get_pk_constraint('questions_bank')
        if pk_constraint and 'id' in pk_constraint.get('constrained_columns', []):
            print(f"✅ PASS: id is primary key")
        else:
            print(f"⚠️  WARNING: id is not a primary key")
        
        # Check question_recommendations table
        print("\n" + "-" * 70)
        print("CHECKING: question_recommendations table")
        print("-" * 70)
        
        if 'question_recommendations' not in tables:
            print("ℹ️  INFO: question_recommendations table does NOT exist yet")
            print("   This is expected before running migration 011")
            print("   Migration 011 will create this table")
        else:
            print("✅ INFO: question_recommendations table already exists")
            
            # Check question_id column
            qr_columns = {col['name']: col for col in inspector.get_columns('question_recommendations')}
            
            if 'question_id' in qr_columns:
                qid_col = qr_columns['question_id']
                print(f"   question_id Type: {qid_col['type']}")
                print(f"   question_id Nullable: {qid_col['nullable']}")
                
                # Check if types match
                qid_type_str = str(qid_col['type']).upper()
                if 'INT' in id_type_str and 'INT' in qid_type_str:
                    print(f"✅ PASS: Column types are compatible (both INTEGER)")
                else:
                    print(f"❌ FAIL: Column types may not be compatible")
                    print(f"   questions_bank.id: {id_col['type']}")
                    print(f"   question_recommendations.question_id: {qid_col['type']}")
            
            # Check foreign key
            fks = inspector.get_foreign_keys('question_recommendations')
            question_fk = None
            for fk in fks:
                if 'question_id' in fk.get('constrained_columns', []):
                    question_fk = fk
                    break
            
            if question_fk:
                print(f"✅ PASS: Foreign key exists")
                print(f"   References: {question_fk['referred_table']}.{question_fk['referred_columns']}")
            else:
                print(f"⚠️  WARNING: No foreign key found for question_id")
        
        # Check alembic version
        print("\n" + "-" * 70)
        print("CHECKING: Alembic migration version")
        print("-" * 70)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            print(f"Current version: {version}")
            
            if version == '011':
                print("✅ Already at version 011")
            elif version in ['010', '010_study_planner']:
                print("ℹ️  At version 010, ready to upgrade to 011")
            elif version == '006a':
                print("⚠️  At version 006a, need to apply intermediate migrations first")
                print("   Run: alembic upgrade 010")
                print("   Then: alembic upgrade 011")
            else:
                print(f"ℹ️  At version {version}")
        
        # Summary
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        
        if 'questions_bank' in tables and 'id' in qb_columns:
            print("✅ Schema is compatible with migration 011")
            print("\nYou can proceed with:")
            print("   alembic upgrade head")
            print("\nOr run the PowerShell script:")
            print("   .\\scripts\\run_alembic_upgrade.ps1")
            return True
        else:
            print("❌ Schema issues detected")
            print("\nPlease resolve the issues above before running migration 011")
            return False
            
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("\nMake sure you have installed all requirements:")
        print("   pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = verify_schema()
    sys.exit(0 if success else 1)
