# Migration Tools - Historical Reference

This directory contains one-time migration scripts that were used during the project's database migration process. These scripts are preserved for historical reference and documentation purposes only.

## ⚠️ IMPORTANT NOTICE

**These scripts should NOT be run as part of normal application operations.**

These are one-time migration utilities that were used during specific database transition events. They are kept in the repository for:
- Historical documentation
- Reference for understanding past migrations
- Potential adaptation for future similar migrations
- Audit trail purposes

## Contents

### migrate_postgres_to_mysql.py

**Purpose**: One-time migration script for transitioning from PostgreSQL to MySQL database.

**Status**: ✅ Completed - DO NOT RUN

**What it does**:
- Migrates all data from PostgreSQL to MySQL
- Handles data type conversions (UUID to CHAR(36), JSONB to JSON)
- Manages character encoding
- Validates data integrity post-migration
- Generates comprehensive migration reports

**Original Usage**:
```bash
python migration-tools/migrate_postgres_to_mysql.py \
  --postgres-url "postgresql://user:pass@localhost:5432/dbname" \
  --mysql-url "mysql+pymysql://user:pass@localhost:3306/dbname" \
  --batch-size 1000 \
  --exclude alembic_version
```

**Dependencies**:
- psycopg2 (PostgreSQL adapter)
- pymysql (MySQL adapter)

## When to Use These Scripts

❌ **DO NOT use these scripts for**:
- Regular application operations
- Production deployments
- Development environment setup
- Testing

✅ **These scripts may be referenced for**:
- Understanding historical migration decisions
- Adapting for future database migrations
- Documentation of past system architecture changes
- Training or educational purposes

## Migration History

| Date | Script | Source | Target | Status |
|------|--------|--------|--------|--------|
| TBD | migrate_postgres_to_mysql.py | PostgreSQL | MySQL | Completed |

## Need to Run a Migration?

If you need to perform a new database migration:

1. **Do NOT use these scripts directly**
2. Review the script for reference only
3. Create a new, tested migration script for your specific use case
4. Follow current best practices and project standards
5. Test thoroughly in a non-production environment first
6. Document the new migration properly

## Questions?

If you have questions about these historical migrations or need to understand why they were performed, please contact the development team or review the project's git history and documentation.
