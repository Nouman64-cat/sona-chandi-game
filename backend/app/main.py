from fastapi import FastAPI
from app.routes import users, friends, groups
from app.database.connection import create_db_and_tables

app = FastAPI(title="Sona Chandi Game API")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(users.router)
app.include_router(friends.router)
app.include_router(groups.router)

@app.get('/')
def root():
    return {"message": "Welcome to Sona Chandi Game API"}