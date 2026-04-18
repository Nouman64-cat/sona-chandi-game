import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def promote_user(username: str):
    print(f"Connecting to Arena Intelligence...")
    with engine.connect() as conn:
        # Verify user exists
        check_stmt = text("SELECT id, full_name FROM \"user\" WHERE username = :u")
        user = conn.execute(check_stmt, {"u": username}).first()
        
        if not user:
            print(f"❌ Error: Legend with username '@{username}' not found in the archives.")
            return

        print(f"Promoting {user.full_name} (@{username}) to Commander status...")
        promote_stmt = text("UPDATE \"user\" SET is_admin = TRUE WHERE username = :u")
        conn.execute(promote_stmt, {"u": username})
        conn.commit()
        
    print(f"✅ Success! @{username} now holds the Legendary Authority (Admin).")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_user.py <username>")
    else:
        promote_user(sys.argv[1])
