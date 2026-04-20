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

def add_card_color_fields(session: Session):
    """Evolution 002: Add color column to cardtemplate and playercard."""
    logger.info("Running Evolution 002: add_card_color_fields")
    session.exec(text("ALTER TABLE cardtemplate ADD COLUMN IF NOT EXISTS color VARCHAR DEFAULT '#FFD700';"))
    session.exec(text("ALTER TABLE playercard ADD COLUMN IF NOT EXISTS color VARCHAR DEFAULT '#FFD700';"))
    session.commit()

def add_multi_winner_fields(session: Session):
    """Evolution 003: Replace winner_id with winner_id_1 and winner_id_2."""
    logger.info("Running Evolution 003: add_multi_winner_fields")
    # 1. Add new columns
    session.exec(text("ALTER TABLE game ADD COLUMN IF NOT EXISTS winner_id_1 INTEGER;"))
    session.exec(text("ALTER TABLE game ADD COLUMN IF NOT EXISTS winner_id_2 INTEGER;"))
    session.commit()
    
    # 2. Migrate existing data (Legacy winner_id -> winner_id_1)
    # Check if winner_id exists via a try-except approach or information_schema 
    # For robust manual migration, we just try to copy
    try:
        session.exec(text("UPDATE game SET winner_id_1 = winner_id WHERE winner_id IS NOT NULL;"))
        session.commit()
        logger.info("Legacy victory records migrated to position 1.")
    except Exception as e:
        logger.warning(f"Could not migrate legacy winner_id (might already be gone): {e}")

    # 3. Note: In most production environments, we'd DROP the old column here.
    # But for SQLite compatibility and safety in this sandbox, we'll keep it or ignore it.
    # session.exec(text("ALTER TABLE game DROP COLUMN winner_id;"))

def init_game_result_table(session: Session):
    """Evolution 004: Initialize the gameresult table."""
    logger.info("Running Evolution 004: init_game_result_table")
    from app.models.user import GameResult
    # Ensure the table exists
    SQLModel.metadata.create_all(session.bind, tables=[GameResult.__table__])
    session.commit()

def add_friendship_status(session: Session):
    """Evolution 005: Add status column to friendship table."""
    logger.info("Running Evolution 005: add_friendship_status")
    # 1. Add column with 'accepted' as default for existing records
    session.exec(text("ALTER TABLE friendship ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'accepted';"))
    session.commit()
    
    # 2. Ensure existing records are 'accepted' (redundant with DEFAULT but safe)
    session.exec(text("UPDATE friendship SET status = 'accepted' WHERE status IS NULL;"))
    session.commit()

def add_group_beacon_fields(session: Session):
    """Evolution 006: Add invite_code and invite_active to group table."""
    logger.info("Running Evolution 006: add_group_beacon_fields")
    # 1. Add columns
    session.exec(text("ALTER TABLE \"group\" ADD COLUMN IF NOT EXISTS invite_code VARCHAR;"))
    session.exec(text("ALTER TABLE \"group\" ADD COLUMN IF NOT EXISTS invite_active BOOLEAN DEFAULT TRUE;"))
    session.commit()
    
    # 2. Generate unique codes for any groups missing them
    import uuid
    statement = text("SELECT id FROM \"group\" WHERE invite_code IS NULL")
    groups_to_update = session.exec(statement).all()
    for g_id in groups_to_update:
        new_code = uuid.uuid4().hex[:10].upper()
        session.exec(text("UPDATE \"group\" SET invite_code = :code WHERE id = :id").bindparams(code=new_code, id=g_id[0]))
    
    session.commit()

def add_member_ready_field(session: Session):
    """Evolution 007: Add is_ready to groupmember table."""
    logger.info("Running Evolution 007: add_member_ready_field")
    session.exec(text("ALTER TABLE groupmember ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT FALSE;"))
    session.commit()

def add_member_heartbeat_field(session: Session):
    """Evolution 008: Add last_arena_heartbeat to groupmember table."""
    logger.info("Running Evolution 008: add_member_heartbeat_field")
    session.exec(text("ALTER TABLE groupmember ADD COLUMN IF NOT EXISTS last_arena_heartbeat INTEGER DEFAULT NULL;"))
    session.commit()

def add_game_turn_order(session: Session):
    """Evolution 009: Add turn_order to game table for randomized per-match sequencing."""
    logger.info("Running Evolution 009: add_game_turn_order")
    session.exec(text("ALTER TABLE game ADD COLUMN IF NOT EXISTS turn_order VARCHAR DEFAULT NULL;"))
    session.commit()

def add_card_icon_fields(session: Session):
    """Evolution 010: Add icon column to cardtemplate and playercard."""
    logger.info("Running Evolution 010: add_card_icon_fields")
    session.exec(text("ALTER TABLE cardtemplate ADD COLUMN IF NOT EXISTS icon VARCHAR DEFAULT 'Shield';"))
    session.exec(text("ALTER TABLE playercard ADD COLUMN IF NOT EXISTS icon VARCHAR DEFAULT 'Shield';"))
    session.commit()

def add_game_series_id(session: Session):
    """Evolution 011: Add series_id to game table for tracking multi-round matches."""
    logger.info("Running Evolution 011: add_game_series_id")
    session.exec(text("ALTER TABLE game ADD COLUMN IF NOT EXISTS series_id VARCHAR DEFAULT NULL;"))
    session.commit()

def add_profile_picture_url(session: Session):
    """Evolution 012: Add profile_picture_url to user table."""
    logger.info("Running Evolution 012: add_profile_picture_url")
    session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR DEFAULT NULL;"))
    session.commit()

# --- Migration Registry ---
# Order matters: oldest to newest
MIGRATIONS = [
    {"name": "001_add_is_admin_column", "func": add_is_admin_column},
    {"name": "002_add_card_color_fields", "func": add_card_color_fields},
    {"name": "003_add_multi_winner_fields", "func": add_multi_winner_fields},
    {"name": "004_init_game_result_table", "func": init_game_result_table},
    {"name": "005_add_friendship_status", "func": add_friendship_status},
    {"name": "006_add_group_beacon_fields", "func": add_group_beacon_fields},
    {"name": "007_add_member_ready_field", "func": add_member_ready_field},
    {"name": "008_add_member_heartbeat_field", "func": add_member_heartbeat_field},
    {"name": "009_add_game_turn_order", "func": add_game_turn_order},
    {"name": "010_add_card_icon_fields", "func": add_card_icon_fields},
    {"name": "011_add_game_series_id", "func": add_game_series_id},
    {"name": "012_add_profile_picture_url", "func": add_profile_picture_url},
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
