from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from enum import Enum
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="EPOS API")
origins = [
    "https://beyah-bcqq.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # مؤقتًا للتأكد 100%
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    DATA_ENTRY = "data_entry"
    BOARD_VIEWER = "board_viewer"

class IndicatorType(str, Enum):
    PERFORMANCE = "performance"
    OUTCOME = "outcome"

class Quarter(int, Enum):
    Q1 = 1
    Q2 = 2
    Q3 = 3
    Q4 = 4

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    name: str
    role: UserRole
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    role: UserRole

class UserInDB(User):
    password_hash: str

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Axis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_ar: str
    order: int
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Indicator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    axis_id: str
    name_ar: str
    type: IndicatorType
    unit: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IndicatorCreate(BaseModel):
    axis_id: str
    name_ar: str
    type: IndicatorType
    unit: str
    description: Optional[str] = None

class Target(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    indicator_id: str
    year: int
    target_value: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TargetUpdate(BaseModel):
    indicator_id: str
    year: int
    target_value: float

class Value(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    indicator_id: str
    year: int
    quarter: int
    actual_value: float
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ValueCreate(BaseModel):
    indicator_id: str
    year: int
    quarter: int
    actual_value: float
    notes: Optional[str] = None

# Helper Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

def require_role(required_roles: List[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return role_checker

# Auth Routes
@api_router.post("/auth/login", response_model=Token)
async def login(request: LoginRequest):
    user_doc = await db.users.find_one({"username": request.username}, {"_id": 0})
    if not user_doc or not verify_password(request.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password_hash'})
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Axes Routes
@api_router.get("/axes", response_model=List[Axis])
async def get_axes(current_user: User = Depends(get_current_user)):
    axes = await db.axes.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    for axis in axes:
        if isinstance(axis['created_at'], str):
            axis['created_at'] = datetime.fromisoformat(axis['created_at'])
    return axes

@api_router.get("/axes/{axis_id}", response_model=Axis)
async def get_axis(axis_id: str, current_user: User = Depends(get_current_user)):
    axis = await db.axes.find_one({"id": axis_id}, {"_id": 0})
    if not axis:
        raise HTTPException(status_code=404, detail="Axis not found")
    if isinstance(axis['created_at'], str):
        axis['created_at'] = datetime.fromisoformat(axis['created_at'])
    return Axis(**axis)

# Indicators Routes
@api_router.get("/indicators", response_model=List[Indicator])
async def get_indicators(
    axis_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {"is_active": True}
    if axis_id:
        query["axis_id"] = axis_id
    
    indicators = await db.indicators.find(query, {"_id": 0}).to_list(1000)
    for indicator in indicators:
        if isinstance(indicator['created_at'], str):
            indicator['created_at'] = datetime.fromisoformat(indicator['created_at'])
    return indicators

@api_router.post("/indicators", response_model=Indicator)
async def create_indicator(
    indicator: IndicatorCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Check if axis exists
    axis = await db.axes.find_one({"id": indicator.axis_id})
    if not axis:
        raise HTTPException(status_code=404, detail="Axis not found")
    
    new_indicator = Indicator(**indicator.model_dump())
    doc = new_indicator.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.indicators.insert_one(doc)
    return new_indicator

@api_router.put("/indicators/{indicator_id}", response_model=Indicator)
async def update_indicator(
    indicator_id: str,
    indicator_data: IndicatorCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    existing = await db.indicators.find_one({"id": indicator_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    update_data = indicator_data.model_dump()
    await db.indicators.update_one({"id": indicator_id}, {"$set": update_data})
    
    updated = await db.indicators.find_one({"id": indicator_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Indicator(**updated)

# Targets Routes
@api_router.get("/targets")
async def get_targets(
    year: int,
    current_user: User = Depends(get_current_user)
):
    targets = await db.targets.find({"year": year}, {"_id": 0}).to_list(1000)
    for target in targets:
        if isinstance(target['created_at'], str):
            target['created_at'] = datetime.fromisoformat(target['created_at'])
    return targets

@api_router.post("/targets", response_model=Target)
async def upsert_target(
    target_data: TargetUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Check if target already exists
    existing = await db.targets.find_one({
        "indicator_id": target_data.indicator_id,
        "year": target_data.year
    })
    
    if existing:
        # Update existing
        await db.targets.update_one(
            {"indicator_id": target_data.indicator_id, "year": target_data.year},
            {"$set": {"target_value": target_data.target_value}}
        )
        updated = await db.targets.find_one(
            {"indicator_id": target_data.indicator_id, "year": target_data.year},
            {"_id": 0}
        )
        if isinstance(updated['created_at'], str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'])
        return Target(**updated)
    else:
        # Create new
        new_target = Target(**target_data.model_dump())
        doc = new_target.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.targets.insert_one(doc)
        return new_target

# Values Routes
@api_router.get("/values")
async def get_values(
    year: Optional[int] = None,
    quarter: Optional[int] = None,
    indicator_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if year:
        query["year"] = year
    if quarter:
        query["quarter"] = quarter
    if indicator_id:
        query["indicator_id"] = indicator_id
    
    values = await db.values.find(query, {"_id": 0}).to_list(1000)
    for value in values:
        if isinstance(value['created_at'], str):
            value['created_at'] = datetime.fromisoformat(value['created_at'])
    return values

@api_router.post("/values", response_model=Value)
async def create_value(
    value_data: ValueCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DATA_ENTRY]))
):
    # Check for duplicate
    existing = await db.values.find_one({
        "indicator_id": value_data.indicator_id,
        "year": value_data.year,
        "quarter": value_data.quarter
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Value already exists for this period")
    
    new_value = Value(**value_data.model_dump(), created_by=current_user.id)
    doc = new_value.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.values.insert_one(doc)
    return new_value

@api_router.put("/values/{value_id}", response_model=Value)
async def update_value(
    value_id: str,
    value_data: ValueCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DATA_ENTRY]))
):
    existing = await db.values.find_one({"id": value_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Value not found")
    
    update_data = value_data.model_dump()
    await db.values.update_one({"id": value_id}, {"$set": update_data})
    
    updated = await db.values.find_one({"id": value_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Value(**updated)

# Dashboard Routes
@api_router.get("/dashboard")
async def get_dashboard(
    year: int,
    current_user: User = Depends(get_current_user)
):
    # Get all axes
    axes = await db.axes.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    
    dashboard_data = []
    total_achievement = 0
    total_indicators = 0
    
    for axis in axes:
        # Get indicators for this axis
        indicators = await db.indicators.find({"axis_id": axis['id'], "is_active": True}, {"_id": 0}).to_list(1000)
        
        axis_achievement = 0
        axis_indicators_count = 0
        
        for indicator in indicators:
            # Get target
            target = await db.targets.find_one({"indicator_id": indicator['id'], "year": year})
            if not target:
                continue
            
            # Get all values for the year
            values = await db.values.find({"indicator_id": indicator['id'], "year": year}, {"_id": 0}).to_list(4)
            
            if not values:
                continue
            
            # Calculate achievement (sum of all quarters / target)
            total_actual = sum(v['actual_value'] for v in values)
            achievement_percent = (total_actual / target['target_value'] * 100) if target['target_value'] > 0 else 0
            
            axis_achievement += achievement_percent
            axis_indicators_count += 1
        
        if axis_indicators_count > 0:
            avg_achievement = axis_achievement / axis_indicators_count
        else:
            avg_achievement = 0
        
        # Determine status color
        if avg_achievement >= 100:
            status = "green"
        elif avg_achievement >= 80:
            status = "yellow"
        else:
            status = "red"
        
        dashboard_data.append({
            "axis": axis,
            "achievement_percent": round(avg_achievement, 2),
            "status": status,
            "indicators_count": axis_indicators_count
        })
        
        total_achievement += avg_achievement
        total_indicators += axis_indicators_count
    
    overall_score = (total_achievement / len(axes)) if len(axes) > 0 else 0
    
    return {
        "year": year,
        "overall_score": round(overall_score, 2),
        "axes": dashboard_data
    }

@api_router.get("/dashboard/axis/{axis_id}")
async def get_axis_details(
    axis_id: str,
    year: int,
    current_user: User = Depends(get_current_user)
):
    # Get axis
    axis = await db.axes.find_one({"id": axis_id}, {"_id": 0})
    if not axis:
        raise HTTPException(status_code=404, detail="Axis not found")
    
    # Get indicators
    indicators = await db.indicators.find({"axis_id": axis_id, "is_active": True}, {"_id": 0}).to_list(1000)
    
    indicators_data = []
    
    for indicator in indicators:
        # Get target
        target = await db.targets.find_one({"indicator_id": indicator['id'], "year": year})
        target_value = target['target_value'] if target else 0
        
        # Get values for all quarters
        values = await db.values.find({"indicator_id": indicator['id'], "year": year}, {"_id": 0}).sort("quarter", 1).to_list(4)
        
        quarter_values = {1: 0, 2: 0, 3: 0, 4: 0}
        for v in values:
            quarter_values[v['quarter']] = v['actual_value']
        
        total_actual = sum(quarter_values.values())
        achievement_percent = (total_actual / target_value * 100) if target_value > 0 else 0
        
        indicators_data.append({
            "indicator": indicator,
            "target_value": target_value,
            "quarterly_values": quarter_values,
            "total_actual": total_actual,
            "achievement_percent": round(achievement_percent, 2)
        })
    
    return {
        "axis": axis,
        "indicators": indicators_data
    }

# Reports Routes
@api_router.get("/reports/annual")
async def get_annual_report(
    year: int,
    current_user: User = Depends(get_current_user)
):
    # Reuse dashboard logic
    dashboard = await get_dashboard(year, current_user)
    
    detailed_axes = []
    for axis_data in dashboard['axes']:
        axis_details = await get_axis_details(axis_data['axis']['id'], year, current_user)
        detailed_axes.append(axis_details)
    
    return {
        "year": year,
        "overall_score": dashboard['overall_score'],
        "axes": detailed_axes
    }

# Users Routes
@api_router.get("/users", response_model=List[User])
async def get_users(
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

@api_router.post("/users", response_model=User)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Check if username exists
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    password_hash = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        name=user_data.name,
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['password_hash'] = password_hash
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
