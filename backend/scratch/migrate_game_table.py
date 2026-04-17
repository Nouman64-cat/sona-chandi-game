from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:asdf456nouM$@localhost:5432/sona_chandi_game"
engine = create_engine(DATABASE_URL)

queries = [
    "ALTER TABLE \"game\" ADD COLUMN IF NOT EXISTS current_turn_user_id INTEGER REFERENCES \"user\"(id)",
    "ALTER TABLE \"game\" ADD COLUMN IF NOT EXISTS winner_id INTEGER REFERENCES \"user\"(id)"
]

print("Starting database migration...")
with engine.connect() as conn:
    for query in queries:
        try:
            conn.execute(text(query))
            conn.commit()
            print(f"Successfully executed: {query}")
        except Exception as e:
            print(f"Error/Notice for {query}: {e}")
print("Migration complete.")
