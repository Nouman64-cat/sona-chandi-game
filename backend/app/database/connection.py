import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)

from app.models.user import CardTemplate, User
from sqlmodel import select
from app.migrations import run_migrations

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Run automated schema migrations
        run_migrations(session)
        
        # Seed default card templates if empty
        # 1. Seed Templates
        statement = select(CardTemplate)
        existing = session.exec(statement).first()
        if not existing:
            defaults = [
                CardTemplate(card_type="A", name="A", value=100),
                CardTemplate(card_type="B", name="B", value=200),
                CardTemplate(card_type="C", name="C", value=300),
                CardTemplate(card_type="D", name="D", value=400),
            ]
            for d in defaults:
                session.add(d)
        
        # 2. Promote first user to admin
        user_stmt = select(User).order_by(User.id)
        first_user = session.exec(user_stmt).first()
        if first_user and not first_user.is_admin:
            first_user.is_admin = True
            session.add(first_user)
            
        session.commit()

def get_session():
    with Session(engine) as session:
        yield session
