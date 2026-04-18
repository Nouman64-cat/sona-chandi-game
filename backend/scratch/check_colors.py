import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def check_db():
    print(f"Connecting to {DATABASE_URL}...")
    with engine.connect() as conn:
        print("\nCard Templates:")
        res = conn.execute(text("SELECT * FROM cardtemplate"))
        for row in res.mappings():
            print(dict(row))
        
        print("\nPlayer Cards (Limit 5):")
        res = conn.execute(text("SELECT * FROM playercard LIMIT 5"))
        for row in res.mappings():
            print(dict(row))

if __name__ == "__main__":
    check_db()
