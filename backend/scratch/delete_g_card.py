import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def delete_g_card():
    print(f"Connecting to Arena Intelligence...")
    with engine.connect() as conn:
        print("Scrubbing extra 'G' (Sona) card from the archives...")
        conn.execute(text("DELETE FROM cardtemplate WHERE card_type = 'G';"))
        conn.commit()
    print("✅ Archives purged. Only 4 Legends remain.")

if __name__ == "__main__":
    delete_g_card()
