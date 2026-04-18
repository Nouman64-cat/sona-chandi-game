from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, friends, groups, auth, games, admin
from app.database.connection import create_db_and_tables

app = FastAPI(title="Sona Chandi Game API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://sona-chandi-game-xrz3.vercel.app",
        "https://sona-chandi-game-xrz3.vercel.app/"
    ],
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
app.include_router(games.router)
app.include_router(admin.router)

@app.get('/')
def root():
    return {"message": "Welcome to Sona Chandi Game API"}