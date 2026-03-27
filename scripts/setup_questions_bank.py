"""
Script to ensure questions_bank table exists by managing migrations.

This script will:
1. Check if questions_bank table exists
2. If not, downgrade to migration 006
3. Then upgrade specifically to migration 006a to create the table
4. Verify the table was created successfully
"""

import sys
import subprocess
from pathlib import Path

# Add the parent directory to the path so we can import from src
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, inspect, text
from src.config import settings


def run_command(command):
    """Execute a shell command and return the result."""
    print(f"\nExecuting: {command}")
    print("-" * 80)
    result = subprocess.run(
        command,
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    
    return result.returncode, result.stdout, result.stderr


def check_table_exists(engine, table_name):
    """Check if a table exists in the database."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    return table_name in tables


def describe_table(engine, table_name):
    """Describe the structure of a table."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"DESCRIBE {table_name}"))
            rows = result.fetchall()
            
            print(f"\n{table_name} table structure:")
            print("-" * 80)
            print(f"{'Field':<30} {'Type':<30} {'Null':<10} {'Key':<10}")
            print("-" * 80)
            
            for row in rows:
                field = row[0] if len(row) > 0 else ''
                field_type = row[1] if len(row) > 1 else ''
                null = row[2] if len(row) > 2 else ''
                key = row[3] if len(row) > 3 else ''
                print(f"{field:<30} {field_type:<30} {null:<10} {key:<10}")
            print("-" * 80)
            
            return True
    except Exception as e:
        print(f"Error describing table {table_name}: {e}")
        return False


def main():
    """Main function to set up questions_bank table."""
    print("=" * 80)
    print("Questions Bank Table Setup Script")
    print("=" * 80)
    
    # Create database engine
    try:
        engine = create_engine(settings.database_url)
        print(f"\nConnecting to database: {settings.database_name}")
        print(f"Host: {settings.database_host}:{settings.database_port}")
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Failed to connect to database: {e}")
        print("\nPlease check your database configuration in .env file:")
        print(f"  DATABASE_HOST={settings.database_host}")
        print(f"  DATABASE_PORT={settings.database_port}")
        print(f"  DATABASE_USER={settings.database_user}")
        print(f"  DATABASE_NAME={settings.database_name}")
        return 1
    
    # Check if questions_bank table exists
    print("\n" + "=" * 80)
    print("Step 1: Checking if questions_bank table exists")
    print("=" * 80)
    
    table_exists = check_table_exists(engine, 'questions_bank')
    
    if table_exists:
        print("✓ questions_bank table already exists")
        describe_table(engine, 'questions_bank')
        print("\nNo migration needed. Exiting.")
        return 0
    else:
        print("✗ questions_bank table does not exist")
        print("  Migration is required.")
    
    # Downgrade to migration 006
    print("\n" + "=" * 80)
    print("Step 2: Downgrading to migration 006")
    print("=" * 80)
    
    returncode, stdout, stderr = run_command("alembic downgrade 006")
    
    if returncode != 0:
        print(f"✗ Failed to downgrade to migration 006")
        print("  Please check the error messages above")
        return 1
    
    print("✓ Successfully downgraded to migration 006")
    
    # Upgrade to migration 006a
    print("\n" + "=" * 80)
    print("Step 3: Upgrading to migration 006a")
    print("=" * 80)
    
    returncode, stdout, stderr = run_command("alembic upgrade 006a")
    
    if returncode != 0:
        print(f"✗ Failed to upgrade to migration 006a")
        print("  Please check the error messages above")
        return 1
    
    print("✓ Successfully upgraded to migration 006a")
    
    # Verify table creation
    print("\n" + "=" * 80)
    print("Step 4: Verifying questions_bank table creation")
    print("=" * 80)
    
    # Refresh the engine connection
    engine.dispose()
    engine = create_engine(settings.database_url)
    
    table_exists = check_table_exists(engine, 'questions_bank')
    
    if table_exists:
        print("✓ questions_bank table successfully created")
        describe_table(engine, 'questions_bank')
        
        # Also check related tables
        print("\nVerifying related tables:")
        for table in ['previous_year_papers', 'topic_predictions']:
            exists = check_table_exists(engine, table)
            status = "✓" if exists else "✗"
            print(f"  {status} {table}: {'exists' if exists else 'not found'}")
        
        print("\n" + "=" * 80)
        print("SUCCESS: All tables created successfully")
        print("=" * 80)
        return 0
    else:
        print("✗ questions_bank table was not created")
        print("  Please check the migration file and database logs")
        return 1


if __name__ == "__main__":
    sys.exit(main())
