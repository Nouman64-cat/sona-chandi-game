from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.get("/groups/7/members")
print(response.json())
