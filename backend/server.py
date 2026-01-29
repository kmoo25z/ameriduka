from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'techgalaxy_secret')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="TechGalaxy API", version="1.0.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== ENUMS ==============
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "sales"
    WAREHOUSE = "warehouse"
    ACCOUNTANT = "accountant"
    SUPPORT = "support"
    CUSTOMER = "customer"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PACKED = "packed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    INITIATED = "initiated"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    MPESA = "mpesa"

class ProductCategory(str, Enum):
    PHONES = "phones"
    LAPTOPS = "laptops"
    TABLETS = "tablets"
    ACCESSORIES = "accessories"
    AUDIO = "audio"
    WEARABLES = "wearables"

class ProductCondition(str, Enum):
    NEW = "new"
    REFURBISHED = "refurbished"
    USED = "used"

class Currency(str, Enum):
    KES = "KES"
    USD = "USD"
    EUR = "EUR"

# Exchange rates (base: USD)
EXCHANGE_RATES = {
    "USD": 1.0,
    "KES": 129.50,
    "EUR": 0.92
}

# ============== MODELS ==============
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: UserRole
    picture: Optional[str] = None
    created_at: datetime
    loyalty_points: int = 0

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class ProductBase(BaseModel):
    name: str
    description: str
    category: ProductCategory
    brand: str
    condition: ProductCondition = ProductCondition.NEW
    price_usd: float
    original_price_usd: Optional[float] = None
    stock: int = 0
    images: List[str] = []
    specifications: Dict[str, Any] = {}
    warranty_months: int = 12
    featured: bool = False
    tags: List[str] = []
    # Product variations
    variations: List[Dict[str, Any]] = []  # [{ram: "8GB", storage: "256GB", color: "Black", price_usd: 1199, stock: 10}]
    has_variations: bool = False

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    rating: float = 0.0
    review_count: int = 0
    sold_count: int = 0
    created_at: datetime
    variations: List[Dict[str, Any]] = []
    has_variations: bool = False

# Wishlist Models
class WishlistItem(BaseModel):
    product_id: str

class WishlistResponse(BaseModel):
    items: List[Dict[str, Any]]
    count: int

# Address Models
class AddressCreate(BaseModel):
    label: str = "Home"  # Home, Work, Other
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    country: str = "Kenya"
    postal_code: Optional[str] = None
    is_default: bool = False

class AddressResponse(AddressCreate):
    model_config = ConfigDict(extra="ignore")
    address_id: str
    user_id: str

# Support Ticket Models
class TicketCreate(BaseModel):
    subject: str
    message: str
    order_id: Optional[str] = None
    category: str = "general"  # general, order, payment, refund, technical

class TicketResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ticket_id: str
    user_id: str
    subject: str
    message: str
    order_id: Optional[str] = None
    category: str
    status: str  # open, in_progress, resolved, closed
    created_at: datetime
    updated_at: datetime
    messages: List[Dict[str, Any]] = []
    
class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1
    variation_id: Optional[str] = None  # For products with variations

class CartResponse(BaseModel):
    items: List[Dict[str, Any]]
    subtotal_usd: float
    currency: Currency = Currency.USD
    subtotal_local: float

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price_usd: float
    imei: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: str
    shipping_city: str
    shipping_country: str = "Kenya"
    phone: str
    currency: Currency = Currency.KES
    payment_method: PaymentMethod = PaymentMethod.STRIPE
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    user_id: str
    items: List[OrderItem]
    subtotal_usd: float
    shipping_usd: float
    total_usd: float
    currency: Currency
    total_local: float
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    shipping_address: str
    shipping_city: str
    shipping_country: str
    phone: str
    tracking_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

class ReviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime

class InventoryItem(BaseModel):
    product_id: str
    imei: Optional[str] = None
    serial_number: Optional[str] = None
    warehouse: str = "main"
    status: str = "in_stock"  # in_stock, reserved, sold, returned, damaged

class EmployeeCreate(BaseModel):
    email: EmailStr
    name: str
    phone: str
    role: UserRole
    department: str
    salary: float
    commission_rate: float = 0.0

class EmployeeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    employee_id: str
    user_id: str
    email: str
    name: str
    phone: str
    role: UserRole
    department: str
    salary: float
    commission_rate: float
    total_sales: float = 0.0
    total_commission: float = 0.0
    created_at: datetime

class CustomerNote(BaseModel):
    note: str
    note_type: str = "general"  # general, vip, frequent_buyer, fraud_risk

class CheckoutSessionRequest(BaseModel):
    order_id: str
    origin_url: str

class CheckoutStatusResponse(BaseModel):
    status: str
    payment_status: str
    amount: float
    currency: str

class DashboardStats(BaseModel):
    total_revenue_usd: float
    total_orders: int
    total_customers: int
    total_products: int
    low_stock_count: int
    pending_orders: int
    today_revenue_usd: float
    today_orders: int

class PromoCodeCreate(BaseModel):
    code: str
    discount_percent: float = Field(ge=0, le=100)
    max_uses: int = 100
    valid_until: datetime
    min_order_usd: float = 0

class PromoCodeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    promo_id: str
    code: str
    discount_percent: float
    max_uses: int
    uses_count: int
    valid_until: datetime
    min_order_usd: float
    active: bool

# ============== HELPERS ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def convert_currency(amount_usd: float, target_currency: Currency) -> float:
    rate = EXCHANGE_RATES.get(target_currency.value, 1.0)
    return round(amount_usd * rate, 2)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), request: Request = None) -> Dict:
    # Try cookie first
    token = None
    if request:
        token = request.cookies.get("session_token")
    
    # Fall back to header
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token (for Google OAuth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if user:
            return user
    
    # Try JWT token
    payload = decode_token(token)
    user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_role(allowed_roles: List[UserRole]):
    async def role_checker(user: Dict = Depends(get_current_user)):
        if user.get("role") not in [r.value for r in allowed_roles]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ============== AUTH ROUTES ==============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": UserRole.CUSTOMER.value,
        "picture": None,
        "loyalty_points": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email, UserRole.CUSTOMER.value)
    user_doc.pop("password")
    user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    return TokenResponse(token=token, user=UserResponse(**user_doc))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["user_id"], user["email"], user["role"])
    user.pop("password", None)
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    
    return TokenResponse(token=token, user=UserResponse(**user))

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.get("/auth/session")
async def get_session_data(request: Request):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        data = response.json()
    
    # Check if user exists
    user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if not user:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "role": UserRole.CUSTOMER.value,
            "phone": None,
            "loyalty_points": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        # Update user data if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data.get("picture")}}
        )
    
    # Store session
    session_token = data["session_token"]
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    
    return {"user": UserResponse(**user), "session_token": session_token}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: Dict = Depends(get_current_user)):
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    return UserResponse(**user)

@api_router.post("/auth/logout")
async def logout(response: Response, user: Dict = Depends(get_current_user)):
    await db.user_sessions.delete_one({"user_id": user["user_id"]})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out successfully"}

# ============== PRODUCT ROUTES ==============
@api_router.get("/products", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    category: Optional[ProductCategory] = None,
    brand: Optional[str] = None,
    condition: Optional[ProductCondition] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    featured: Optional[bool] = None
):
    query = {}
    
    if category:
        query["category"] = category.value
    if brand:
        query["brand"] = {"$regex": brand, "$options": "i"}
    if condition:
        query["condition"] = condition.value
    if min_price is not None:
        query["price_usd"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price_usd", {})["$lte"] = max_price
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    if featured is not None:
        query["featured"] = featured
    
    sort_direction = -1 if sort_order == "desc" else 1
    
    total = await db.products.count_documents(query)
    skip = (page - 1) * limit
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_direction).skip(skip).limit(limit).to_list(limit)
    
    for p in products:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
    
    return ProductListResponse(
        products=[ProductResponse(**p) for p in products],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit
    )

@api_router.get("/products/featured", response_model=List[ProductResponse])
async def get_featured_products(limit: int = 8):
    products = await db.products.find({"featured": True}, {"_id": 0}).limit(limit).to_list(limit)
    for p in products:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
    return [ProductResponse(**p) for p in products]

@api_router.get("/products/categories")
async def get_categories():
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    categories = await db.products.aggregate(pipeline).to_list(100)
    return [{"category": c["_id"], "count": c["count"]} for c in categories]

@api_router.get("/products/brands")
async def get_brands():
    pipeline = [
        {"$group": {"_id": "$brand", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    brands = await db.products.aggregate(pipeline).to_list(100)
    return [{"brand": b["_id"], "count": b["count"]} for b in brands]

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get("created_at"), str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    return ProductResponse(**product)

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    product_doc = {
        "product_id": product_id,
        **product.model_dump(),
        "rating": 0.0,
        "review_count": 0,
        "sold_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    product_doc["created_at"] = datetime.fromisoformat(product_doc["created_at"])
    return ProductResponse(**product_doc)

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductCreate, user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    existing = await db.products.find_one({"product_id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one(
        {"product_id": product_id},
        {"$set": product.model_dump()}
    )
    
    updated = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return ProductResponse(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ============== CART ROUTES ==============
@api_router.get("/cart", response_model=CartResponse)
async def get_cart(user: Dict = Depends(get_current_user), currency: Currency = Currency.KES):
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        return CartResponse(items=[], subtotal_usd=0, currency=currency, subtotal_local=0)
    
    items_with_details = []
    subtotal = 0
    
    for item in cart["items"]:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            item_total = product["price_usd"] * item["quantity"]
            subtotal += item_total
            items_with_details.append({
                "product_id": product["product_id"],
                "name": product["name"],
                "price_usd": product["price_usd"],
                "quantity": item["quantity"],
                "image": product["images"][0] if product.get("images") else None,
                "stock": product["stock"]
            })
    
    return CartResponse(
        items=items_with_details,
        subtotal_usd=round(subtotal, 2),
        currency=currency,
        subtotal_local=convert_currency(subtotal, currency)
    )

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, user: Dict = Depends(get_current_user)):
    product = await db.products.find_one({"product_id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product["stock"] < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    cart = await db.carts.find_one({"user_id": user["user_id"]})
    
    if not cart:
        await db.carts.insert_one({
            "user_id": user["user_id"],
            "items": [{"product_id": item.product_id, "quantity": item.quantity}]
        })
    else:
        existing_item = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
        if existing_item:
            new_qty = existing_item["quantity"] + item.quantity
            if new_qty > product["stock"]:
                raise HTTPException(status_code=400, detail="Insufficient stock")
            await db.carts.update_one(
                {"user_id": user["user_id"], "items.product_id": item.product_id},
                {"$set": {"items.$.quantity": new_qty}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["user_id"]},
                {"$push": {"items": {"product_id": item.product_id, "quantity": item.quantity}}}
            )
    
    return {"message": "Added to cart"}

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, user: Dict = Depends(get_current_user)):
    product = await db.products.find_one({"product_id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if item.quantity == 0:
        await db.carts.update_one(
            {"user_id": user["user_id"]},
            {"$pull": {"items": {"product_id": item.product_id}}}
        )
    else:
        if item.quantity > product["stock"]:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        await db.carts.update_one(
            {"user_id": user["user_id"], "items.product_id": item.product_id},
            {"$set": {"items.$.quantity": item.quantity}}
        )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/clear")
async def clear_cart(user: Dict = Depends(get_current_user)):
    await db.carts.delete_one({"user_id": user["user_id"]})
    return {"message": "Cart cleared"}

# ============== ORDER ROUTES ==============
@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, user: Dict = Depends(get_current_user)):
    items = []
    subtotal = 0
    
    for cart_item in order_data.items:
        product = await db.products.find_one({"product_id": cart_item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {cart_item.product_id} not found")
        if product["stock"] < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        item_total = product["price_usd"] * cart_item.quantity
        subtotal += item_total
        
        items.append(OrderItem(
            product_id=product["product_id"],
            product_name=product["name"],
            quantity=cart_item.quantity,
            price_usd=product["price_usd"]
        ))
    
    shipping = 5.0 if order_data.shipping_country == "Kenya" else 25.0
    total = subtotal + shipping
    
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    order_doc = {
        "order_id": order_id,
        "user_id": user["user_id"],
        "items": [item.model_dump() for item in items],
        "subtotal_usd": round(subtotal, 2),
        "shipping_usd": shipping,
        "total_usd": round(total, 2),
        "currency": order_data.currency.value,
        "total_local": convert_currency(total, order_data.currency),
        "status": OrderStatus.PENDING.value,
        "payment_status": PaymentStatus.PENDING.value,
        "payment_method": order_data.payment_method.value,
        "shipping_address": order_data.shipping_address,
        "shipping_city": order_data.shipping_city,
        "shipping_country": order_data.shipping_country,
        "phone": order_data.phone,
        "notes": order_data.notes,
        "tracking_number": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Reserve stock
    for cart_item in order_data.items:
        await db.products.update_one(
            {"product_id": cart_item.product_id},
            {"$inc": {"stock": -cart_item.quantity}}
        )
    
    # Clear cart
    await db.carts.delete_one({"user_id": user["user_id"]})
    
    order_doc["created_at"] = datetime.fromisoformat(order_doc["created_at"])
    order_doc["updated_at"] = datetime.fromisoformat(order_doc["updated_at"])
    
    return OrderResponse(**order_doc)

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: Dict = Depends(get_current_user), limit: int = 50):
    query = {"user_id": user["user_id"]}
    if user.get("role") in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.SALES.value]:
        query = {}  # Admin can see all orders
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for o in orders:
        if isinstance(o.get("created_at"), str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
        if isinstance(o.get("updated_at"), str):
            o["updated_at"] = datetime.fromisoformat(o["updated_at"])
    
    return [OrderResponse(**o) for o in orders]

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: Dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permission
    if order["user_id"] != user["user_id"] and user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.SALES.value]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order.get("updated_at"), str):
        order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    
    return OrderResponse(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: OrderStatus, user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.SALES.value, UserRole.WAREHOUSE.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": status.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ============== PAYMENT ROUTES ==============
@api_router.post("/payments/stripe/checkout")
async def create_stripe_checkout(request: CheckoutSessionRequest, http_request: Request, user: Dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest as StripeRequest
    
    order = await db.orders.find_one({"order_id": request.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    host_url = request.origin_url
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{host_url}/orders/{request.order_id}?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/checkout?cancelled=true"
    
    checkout_request = StripeRequest(
        amount=float(order["total_usd"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": request.order_id,
            "user_id": user["user_id"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Save payment transaction
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "order_id": request.order_id,
        "user_id": user["user_id"],
        "session_id": session.session_id,
        "amount": order["total_usd"],
        "currency": "USD",
        "payment_method": PaymentMethod.STRIPE.value,
        "payment_status": PaymentStatus.INITIATED.value,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/stripe/status/{session_id}")
async def get_stripe_status(session_id: str, user: Dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment and order if paid
    if status.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": session_id})
        if txn and txn.get("payment_status") != PaymentStatus.COMPLETED.value:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": PaymentStatus.COMPLETED.value}}
            )
            await db.orders.update_one(
                {"order_id": txn["order_id"]},
                {"$set": {
                    "payment_status": PaymentStatus.COMPLETED.value,
                    "status": OrderStatus.PROCESSING.value,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update sold count for products
            order = await db.orders.find_one({"order_id": txn["order_id"]})
            if order:
                for item in order["items"]:
                    await db.products.update_one(
                        {"product_id": item["product_id"]},
                        {"$inc": {"sold_count": item["quantity"]}}
                    )
    
    return CheckoutStatusResponse(
        status=status.status,
        payment_status=status.payment_status,
        amount=status.amount_total / 100,
        currency=status.currency.upper()
    )

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": PaymentStatus.COMPLETED.value}}
                )
                await db.orders.update_one(
                    {"order_id": order_id},
                    {"$set": {
                        "payment_status": PaymentStatus.COMPLETED.value,
                        "status": OrderStatus.PROCESSING.value,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# M-Pesa placeholder (requires real credentials)
@api_router.post("/payments/mpesa/initiate")
async def initiate_mpesa(order_id: str, phone_number: str, user: Dict = Depends(get_current_user)):
    # M-Pesa STK Push would be implemented here with real Safaricom credentials
    # For now, return a mock response
    return {
        "message": "M-Pesa integration requires Safaricom Daraja API credentials",
        "status": "mock",
        "instructions": "Please use Stripe or PayPal for testing"
    }

# ============== REVIEW ROUTES ==============
@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, user: Dict = Depends(get_current_user)):
    # Check if product exists
    product = await db.products.find_one({"product_id": review.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user already reviewed
    existing = await db.reviews.find_one({"product_id": review.product_id, "user_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    review_doc = {
        "review_id": review_id,
        "product_id": review.product_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update product rating
    pipeline = [
        {"$match": {"product_id": review.product_id}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    if result:
        await db.products.update_one(
            {"product_id": review.product_id},
            {"$set": {"rating": round(result[0]["avg_rating"], 1), "review_count": result[0]["count"]}}
        )
    
    review_doc["created_at"] = datetime.fromisoformat(review_doc["created_at"])
    return ReviewResponse(**review_doc)

@api_router.get("/reviews/{product_id}", response_model=List[ReviewResponse])
async def get_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for r in reviews:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
    return [ReviewResponse(**r) for r in reviews]

# ============== ADMIN DASHBOARD ROUTES ==============
@api_router.get("/admin/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.ACCOUNTANT.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total revenue
    revenue_pipeline = [
        {"$match": {"payment_status": PaymentStatus.COMPLETED.value}},
        {"$group": {"_id": None, "total": {"$sum": "$total_usd"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Today's revenue
    today_pipeline = [
        {"$match": {
            "payment_status": PaymentStatus.COMPLETED.value,
            "created_at": {"$gte": today_start.isoformat()}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$total_usd"}, "count": {"$sum": 1}}}
    ]
    today_result = await db.orders.aggregate(today_pipeline).to_list(1)
    today_revenue = today_result[0]["total"] if today_result else 0
    today_orders = today_result[0]["count"] if today_result else 0
    
    total_orders = await db.orders.count_documents({})
    total_customers = await db.users.count_documents({"role": UserRole.CUSTOMER.value})
    total_products = await db.products.count_documents({})
    low_stock = await db.products.count_documents({"stock": {"$lte": 5}})
    pending_orders = await db.orders.count_documents({"status": OrderStatus.PENDING.value})
    
    return DashboardStats(
        total_revenue_usd=round(total_revenue, 2),
        total_orders=total_orders,
        total_customers=total_customers,
        total_products=total_products,
        low_stock_count=low_stock,
        pending_orders=pending_orders,
        today_revenue_usd=round(today_revenue, 2),
        today_orders=today_orders
    )

@api_router.get("/admin/inventory")
async def get_inventory(
    user: Dict = Depends(get_current_user),
    page: int = 1,
    limit: int = 20,
    low_stock_only: bool = False
):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.WAREHOUSE.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    query = {"stock": {"$lte": 5}} if low_stock_only else {}
    
    skip = (page - 1) * limit
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "limit": limit
    }

@api_router.put("/admin/inventory/{product_id}/stock")
async def update_stock(product_id: str, stock: int, user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.WAREHOUSE.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.products.update_one(
        {"product_id": product_id},
        {"$set": {"stock": stock}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Stock updated"}

# ============== EMPLOYEE ROUTES ==============
@api_router.get("/admin/employees", response_model=List[EmployeeResponse])
async def get_employees(user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    employees = await db.employees.find({}, {"_id": 0}).to_list(100)
    for e in employees:
        if isinstance(e.get("created_at"), str):
            e["created_at"] = datetime.fromisoformat(e["created_at"])
    return [EmployeeResponse(**e) for e in employees]

@api_router.post("/admin/employees", response_model=EmployeeResponse)
async def create_employee(employee: EmployeeCreate, user: Dict = Depends(get_current_user)):
    if user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admin can create employees")
    
    # Check if email exists
    existing = await db.users.find_one({"email": employee.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user account
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": employee.email,
        "password": hash_password("TempPass123!"),  # Temporary password
        "name": employee.name,
        "phone": employee.phone,
        "role": employee.role.value,
        "picture": None,
        "loyalty_points": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create employee record
    employee_id = f"emp_{uuid.uuid4().hex[:12]}"
    employee_doc = {
        "employee_id": employee_id,
        "user_id": user_id,
        "email": employee.email,
        "name": employee.name,
        "phone": employee.phone,
        "role": employee.role.value,
        "department": employee.department,
        "salary": employee.salary,
        "commission_rate": employee.commission_rate,
        "total_sales": 0.0,
        "total_commission": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.employees.insert_one(employee_doc)
    
    employee_doc["created_at"] = datetime.fromisoformat(employee_doc["created_at"])
    return EmployeeResponse(**employee_doc)

# ============== CRM ROUTES ==============
@api_router.get("/admin/customers")
async def get_customers(
    user: Dict = Depends(get_current_user),
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None
):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.SALES.value, UserRole.SUPPORT.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    query = {"role": UserRole.CUSTOMER.value}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    customers = await db.users.find(query, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    # Enrich with order data
    for customer in customers:
        order_count = await db.orders.count_documents({"user_id": customer["user_id"]})
        total_spent_pipeline = [
            {"$match": {"user_id": customer["user_id"], "payment_status": PaymentStatus.COMPLETED.value}},
            {"$group": {"_id": None, "total": {"$sum": "$total_usd"}}}
        ]
        spent_result = await db.orders.aggregate(total_spent_pipeline).to_list(1)
        customer["order_count"] = order_count
        customer["total_spent_usd"] = spent_result[0]["total"] if spent_result else 0
    
    return {
        "customers": customers,
        "total": total,
        "page": page,
        "limit": limit
    }

@api_router.post("/admin/customers/{user_id}/notes")
async def add_customer_note(user_id: str, note: CustomerNote, user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.SALES.value, UserRole.SUPPORT.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    note_doc = {
        "note_id": f"note_{uuid.uuid4().hex[:12]}",
        "customer_id": user_id,
        "added_by": user["user_id"],
        "note": note.note,
        "note_type": note.note_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.customer_notes.insert_one(note_doc)
    return {"message": "Note added"}

# ============== PROMO ROUTES ==============
@api_router.post("/admin/promos", response_model=PromoCodeResponse)
async def create_promo(promo: PromoCodeCreate, user: Dict = Depends(get_current_user)):
    if user.get("role") not in [UserRole.ADMIN.value, UserRole.MANAGER.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    existing = await db.promo_codes.find_one({"code": promo.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    
    promo_id = f"promo_{uuid.uuid4().hex[:12]}"
    promo_doc = {
        "promo_id": promo_id,
        "code": promo.code.upper(),
        "discount_percent": promo.discount_percent,
        "max_uses": promo.max_uses,
        "uses_count": 0,
        "valid_until": promo.valid_until.isoformat(),
        "min_order_usd": promo.min_order_usd,
        "active": True
    }
    
    await db.promo_codes.insert_one(promo_doc)
    promo_doc["valid_until"] = datetime.fromisoformat(promo_doc["valid_until"])
    return PromoCodeResponse(**promo_doc)

@api_router.get("/promos/validate/{code}")
async def validate_promo(code: str, user: Dict = Depends(get_current_user)):
    promo = await db.promo_codes.find_one({"code": code.upper(), "active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid promo code")
    
    valid_until = promo["valid_until"]
    if isinstance(valid_until, str):
        valid_until = datetime.fromisoformat(valid_until)
    if valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=timezone.utc)
    
    if valid_until < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Promo code expired")
    
    if promo["uses_count"] >= promo["max_uses"]:
        raise HTTPException(status_code=400, detail="Promo code usage limit reached")
    
    return {
        "valid": True,
        "discount_percent": promo["discount_percent"],
        "min_order_usd": promo["min_order_usd"]
    }

# ============== AI RECOMMENDATIONS ==============
@api_router.get("/recommendations/{product_id}")
async def get_recommendations(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Simple recommendation: same category, different product
    similar = await db.products.find(
        {"category": product["category"], "product_id": {"$ne": product_id}},
        {"_id": 0}
    ).limit(4).to_list(4)
    
    for p in similar:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
    
    return [ProductResponse(**p) for p in similar]

@api_router.get("/ai/recommendations")
async def get_ai_recommendations(user: Dict = Depends(get_current_user)):
    """Get AI-powered product recommendations based on user behavior"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get user's order history
        orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).limit(5).to_list(5)
        
        # Get all products for recommendation
        products = await db.products.find({}, {"_id": 0}).limit(20).to_list(20)
        
        if not products:
            return {"recommendations": [], "message": "No products available"}
        
        product_names = [p["name"] for p in products[:10]]
        ordered_items = []
        for order in orders:
            for item in order.get("items", []):
                ordered_items.append(item.get("product_name", ""))
        
        prompt = f"""Based on a customer who has previously purchased: {', '.join(ordered_items) if ordered_items else 'nothing yet'}.

Available products: {', '.join(product_names)}

Recommend 3 products from the available list that would be most relevant for this customer. Return just the product names, one per line."""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"rec_{user['user_id']}",
            system_message="You are a helpful e-commerce product recommendation assistant."
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        recommended_names = [name.strip() for name in response.split('\n') if name.strip()]
        
        recommended_products = []
        for name in recommended_names[:3]:
            for p in products:
                if name.lower() in p["name"].lower():
                    if isinstance(p.get("created_at"), str):
                        p["created_at"] = datetime.fromisoformat(p["created_at"])
                    recommended_products.append(ProductResponse(**p))
                    break
        
        return {"recommendations": recommended_products, "ai_response": response}
    
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        # Fallback to featured products
        featured = await db.products.find({"featured": True}, {"_id": 0}).limit(3).to_list(3)
        for p in featured:
            if isinstance(p.get("created_at"), str):
                p["created_at"] = datetime.fromisoformat(p["created_at"])
        return {"recommendations": [ProductResponse(**p) for p in featured], "message": "Showing featured products"}

# ============== HEALTH CHECK ==============
@api_router.get("/")
async def root():
    return {"message": "TechGalaxy API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
