from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, friends, groups, auth
from app.database.connection import create_db_and_tables

app = FastAPI(title="Sona Chandi Game API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(groups.router)

@app.get('/')
def root():
    return {"message": "Welcome to Sona Chandi Game API"}