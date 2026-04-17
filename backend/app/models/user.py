from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel, Column, Integer, ForeignKey

# Link table for Friendships (Many-to-Many self-reference)
class Friendship(SQLModel, table=True):
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )
    friend_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )

# Link table for Groups (Many-to-Many User <-> Group)
class GroupMember(SQLModel, table=True):
    group_id: Optional[int] = Field(
        default=None, foreign_key="group.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True)
    gender: str
    number: str
    password: str  # In a real app, hash this!

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
    
    # Many-to-Many Members
    members: List[User] = Relationship(back_populates="groups", link_model=GroupMember)

# For Search/API responses
class UserRead(SQLModel):
    id: int
    full_name: str
    username: str
    email: str
    gender: str
    number: str

class UserCreate(SQLModel):
    full_name: str
    username: str
    email: str
    gender: str
    number: str
    password: str

class GroupCreate(SQLModel):
    name: str
    description: Optional[str] = None
