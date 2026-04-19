from typing import List, Optional
import time
from sqlmodel import Field, Relationship, SQLModel, Column, Integer, ForeignKey
from pydantic import EmailStr

# --- Link Tables ---

class Friendship(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    friend_id: int = Field(foreign_key="user.id", primary_key=True)
    status: str = Field(default="pending") # pending, accepted

class GroupMember(SQLModel, table=True):
    group_id: Optional[int] = Field(
        default=None, foreign_key="group.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )
    is_ready: bool = Field(default=False)
    last_arena_heartbeat: Optional[int] = Field(default=None, sa_column=Column(Integer))

# --- DB Models ---

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True)
    gender: str
    number: str
    password: str
    is_admin: bool = Field(default=False)

    # Many-to-Many Groups
    groups: List["Group"] = Relationship(back_populates="members", link_model=GroupMember)
    
    # Many-to-Many Friends
    friends: List["User"] = Relationship(
        link_model=Friendship,
        sa_relationship_kwargs={
            "primaryjoin": "User.id==Friendship.user_id",
            "secondaryjoin": "User.id==Friendship.friend_id",
        },
    )

class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    creator_id: int = Field(foreign_key="user.id")
    invite_code: str = Field(index=True, unique=True, default_factory=lambda: "".join(__import__("uuid").uuid4().hex[:10]).upper())
    invite_active: bool = Field(default=True)
    
    # Many-to-Many Members
    members: List[User] = Relationship(back_populates="groups", link_model=GroupMember)

# --- API Schemas ---


class UserBase(SQLModel):
    full_name: str
    username: str
    email: EmailStr
    gender: str
    number: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int

class UserLogin(SQLModel):
    username: str
    password: str

class Token(SQLModel):
    access_token: str
    token_type: str
    gender: str

class GroupBase(SQLModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupRead(GroupBase):
    id: int
    creator_id: int
    invite_code: Optional[str] = None
    invite_active: bool = True

# --- Game Models ---

class CardTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    card_type: str = Field(unique=True) # A, B, C, D, G
    name: str
    value: int
    color: str = Field(default="#FFD700")

class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="group.id")
    status: str = Field(default="active") # active, finished
    current_turn_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    turn_order: Optional[str] = Field(default=None)  # comma-separated user IDs, shuffled at game start
    winner_id_1: Optional[int] = Field(default=None, foreign_key="user.id")
    winner_id_2: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: Optional[int] = Field(default=None) # Timestamp

class PlayerCard(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="game.id")
    user_id: int = Field(foreign_key="user.id")
    card_type: str # A, B, C, D
    value: int # 100, 200, 300, 400
    is_played: bool = Field(default=False)
    # Visual preference/theme index 0-3
    theme_index: int = Field(default=0)
    color: str = Field(default="#FFD700")

class GameResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="game.id", index=True)
    user_id: int = Field(foreign_key="user.id")
    position: int # 1, 2, 3...
    points: int # sum of 4 cards
    created_at: int = Field(default_factory=lambda: int(time.time()))

class UserSearchResponse(UserRead):
    is_friend: bool = False
    is_self: bool = False

