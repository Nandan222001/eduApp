# Questions Bank Table Setup Script

## Overview

This script ensures that the `questions_bank` table exists in your database by managing Alembic migrations.

## What It Does

1. **Checks** if the `questions_bank` table exists
2. If not, **downgrades** to migration 006 
3. **Upgrades** specifically to migration 006a to create the table
4. **Verifies** table creation with `DESCRIBE questions_bank`

## Prerequisites

- Python environment with required dependencies installed
- Database credentials configured in `.env` file
- Alembic migrations set up

## Usage

### Basic Usage

```bash
python scripts/setup_questions_bank.py
```

### What to Expect

The script will output detailed information about each step:

```
================================================================================
Questions Bank Table Setup Script
================================================================================

Connecting to database: mysql_db
Host: localhost:3306
✓ Database connection successful

================================================================================
Step 1: Checking if questions_bank table exists
================================================================================
✗ questions_bank table does not exist
  Migration is required.

================================================================================
Step 2: Downgrading to migration 006
================================================================================

Executing: alembic downgrade 006
--------------------------------------------------------------------------------
...
✓ Successfully downgraded to migration 006

================================================================================
Step 3: Upgrading to migration 006a
================================================================================

Executing: alembic upgrade 006a
--------------------------------------------------------------------------------
...
✓ Successfully upgraded to migration 006a

================================================================================
Step 4: Verifying questions_bank table creation
================================================================================
✓ questions_bank table successfully created

questions_bank table structure:
--------------------------------------------------------------------------------
Field                          Type                           Null       Key       
--------------------------------------------------------------------------------
id                             int                            NO         PRI       
institution_id                 int                            NO         MUL       
paper_id                       int                            YES        MUL       
question_text                  text                           NO                   
question_type                  varchar(50)                    NO         MUL       
grade_id                       int                            NO         MUL       
subject_id                     int                            NO         MUL       
chapter_id                     int                            YES        MUL       
topic_id                       int                            YES        MUL       
difficulty_level               varchar(50)                    NO         MUL       
bloom_taxonomy_level           varchar(50)                    NO         MUL       
marks                          float                          YES                  
answer_text                    text                           YES                  
options                        text                           YES                  
correct_option                 varchar(10)                    YES                  
image_url                      varchar(500)                   YES                  
tags                           text                           YES                  
usage_count                    int                            NO                   
is_active                      tinyint(1)                     NO         MUL       
is_verified                    tinyint(1)                     NO         MUL       
created_at                     datetime                       NO         MUL       
updated_at                     datetime                       NO                   
--------------------------------------------------------------------------------

Verifying related tables:
  ✓ previous_year_papers: exists
  ✓ topic_predictions: exists

================================================================================
SUCCESS: All tables created successfully
================================================================================
```

## Troubleshooting

### Database Connection Error

If you see a database connection error:

```
✗ Failed to connect to database: (pymysql.err.OperationalError) (1045, "Access denied...")
```

**Solution:** Check your `.env` file and ensure the database credentials are correct:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
```

### Migration Error

If the migration fails:

```
✗ Failed to upgrade to migration 006a
```

**Possible causes:**
- Database permissions issues
- Foreign key constraints not satisfied (missing parent tables)
- Alembic version table is corrupted

**Solution:** 
1. Check the error messages in the output
2. Verify all prerequisite tables exist (institutions, grades, subjects, chapters, topics, users)
3. Run `alembic current` to check current migration state

### Table Already Exists

If the table already exists:

```
✓ questions_bank table already exists
No migration needed. Exiting.
```

This is normal - the script detected the table and skipped the migration.

## Related Tables

Migration 006a creates three tables:

1. **previous_year_papers** - Stores previous year examination papers
2. **questions_bank** - Stores individual questions from papers or custom questions
3. **topic_predictions** - Stores ML-based topic predictions for upcoming exams

All three tables are created together when running this migration.

## Manual Migration Commands

If you prefer to run migrations manually:

```bash
# Check current migration version
alembic current

# Downgrade to migration 006
alembic downgrade 006

# Upgrade to migration 006a
alembic upgrade 006a

# Verify table creation (in MySQL)
mysql -u your_user -p -e "USE your_database; DESCRIBE questions_bank;"
```

## Exit Codes

- `0` - Success (table exists or was created successfully)
- `1` - Failure (database connection error, migration error, or verification failed)
