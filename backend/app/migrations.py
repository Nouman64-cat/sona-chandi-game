from sqlalchemy import text
from sqlmodel import Session, select, SQLModel, Field
from typing import Optional, List
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migrations")

# --- Internal Migration Tracking Model ---
class MigrationHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    applied_at: Optional[int] = Field(default=None) # Timestamp

# --- The Migrations (Evolution Steps) ---

def add_is_admin_column(session: Session):
    """Evolution 001: Add is_admin column to user table."""
    logger.info("Running Evolution 001: add_is_admin_column")
    # Using raw SQL for schema alteration
    session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;"))
    session.commit()

# --- Migration Registry ---
# Order matters: oldest to newest
MIGRATIONS = [
    {"name": "001_add_is_admin_column", "func": add_is_admin_column},
]

def run_migrations(session: Session):
    """
    Automated Migration Runner.
    Detects missing schema changes and applies them in sequence.
    """
    logger.info("Initializing Arena Intelligence Migrations...")
    
    # 1. Ensure the tracking table exists
    SQLModel.metadata.create_all(session.bind, tables=[MigrationHistory.__table__])
    
    # 2. Get already applied migrations
    statement = select(MigrationHistory.name)
    applied_names = session.exec(statement).all()
    
    # 3. Apply missing migrations
    for migration in MIGRATIONS:
        name = migration["name"]
        if name not in applied_names:
            try:
                logger.info(f"Applying migration: {name}")
                migration["func"](session)
                
                # Record success
                import time
                history = MigrationHistory(name=name, applied_at=int(time.time()))
                session.add(history)
                session.commit()
                logger.info(f"✅ Migration {name} applied successfully.")
            except Exception as e:
                logger.error(f"❌ Failed to apply migration {name}: {e}")
                session.rollback()
                # Stop migration process if a step fails to prevent data corruption
                break
        else:
            logger.info(f"Skipping {name} (already applied).")
            
    logger.info("Arena Intelligence Migrations complete.")
