#!/usr/bin/env python3
"""Quick seeder for test users"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[0]
sys.path.insert(0, str(ROOT / "EcoCare-BE"))

from app.core.database import SessionLocal
from app.models import User
import json

# Load mock users
with open("EcoCare-UI/public/mock/auth-users.json") as f:
    mock_data = json.load(f)

db = SessionLocal()
try:
    users = mock_data["users"]
    print(f"Seeding {len(users)} users...")
    
    for item in users:
        user = User(
            id=item["id"],
            name=item["name"],
            email=item["email"],
            roles=item["roles"],
            default_role=item["defaultRole"],
        )
        db.merge(user)
        print(f"  ✓ {item['name']} ({item['email']})")
    
    db.commit()
    print(f"\n✅ Seeded {len(users)} users successfully!")
    
    # List all users
    all_users = db.query(User).all()
    print(f"\n📊 Total users in DB: {len(all_users)}")
    
finally:
    db.close()
