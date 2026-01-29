# TechGalaxy E-Commerce Platform - PRD

## Project Overview
Full-scale e-commerce + enterprise management platform for phones & computers, targeted at Kenya with global reach. Built with FastAPI (backend) + React (frontend) + MongoDB.

## User Personas
1. **Customers** - Browse products, purchase phones/laptops/accessories, track orders
2. **Admin** - Full system control, manage all aspects
3. **Manager** - Manage products, orders, inventory, employees
4. **Sales Staff** - Process orders, customer support
5. **Warehouse Staff** - Inventory management
6. **Accountant** - View financial reports

## Core Requirements (Static)
- Multi-currency support (KES, USD, EUR)
- Payment integrations: Stripe (working), M-Pesa (MOCKED), PayPal (MOCKED)
- JWT + Google OAuth authentication
- Role-based access control
- Product catalog with advanced filters
- Shopping cart and checkout
- Order management with status tracking
- Admin dashboard with stats
- Inventory management with IMEI tracking capability
- Employee management
- CRM (Customer Relationship Management)

## What's Been Implemented (January 29, 2025)

### Backend (100% Complete)
- [x] FastAPI server with all API routes
- [x] User authentication (JWT + Google OAuth via Emergent)
- [x] Product CRUD operations
- [x] Category and brand management
- [x] Shopping cart API
- [x] Order creation and management
- [x] Payment integrations (Stripe checkout)
- [x] Admin stats API
- [x] Inventory management API
- [x] Employee management API
- [x] CRM API (customers, notes)
- [x] Promo code system
- [x] Review system
- [x] AI recommendations endpoint (OpenAI GPT-5.2)

### Frontend (85% Complete)
- [x] Landing page with hero, categories, featured products
- [x] Products page with filters (category, brand, condition, price)
- [x] Product detail page with specs, reviews, add to cart
- [x] Shopping cart page
- [x] Checkout page with payment method selection
- [x] User authentication (login/register)
- [x] Google OAuth integration
- [x] Order history and detail pages
- [x] Admin Dashboard with 8 stats cards
- [x] Admin Products management (CRUD)
- [x] Admin Orders management
- [x] Admin Inventory management
- [x] Admin Customers (CRM)
- [x] Admin Employees management
- [x] Multi-currency toggle (KES/USD/EUR)
- [x] Responsive design (mobile-first)

### Database Collections
- users
- products
- carts
- orders
- reviews
- employees
- customer_notes
- promo_codes
- payment_transactions
- user_sessions

## Prioritized Backlog

### P0 - Completed
- [x] Core e-commerce flow (products → cart → checkout → order)
- [x] User authentication
- [x] Admin dashboard
- [x] Stripe payment integration

### P1 - Next Priority
- [ ] M-Pesa STK Push integration (requires Safaricom Daraja API credentials)
- [ ] PayPal integration completion
- [ ] Invoice PDF generation
- [ ] Email notifications (order confirmation, shipping updates)
- [ ] IMEI tracking for phone inventory

### P2 - Future Features
- [ ] Advanced financial reports (P&L, balance sheet)
- [ ] Sales performance tracking
- [ ] Commission calculation
- [ ] Loyalty points system (backend ready)
- [ ] Flash sales module
- [ ] Referral system
- [ ] Multi-language support (Swahili)
- [ ] Mobile app (React Native)

### P3 - Nice to Have
- [ ] AI-powered product recommendations (backend ready)
- [ ] Price comparison engine
- [ ] Trade-in system
- [ ] Supplier portal
- [ ] POS integration

## Technical Architecture
```
Frontend (React + Tailwind CSS)
    ↓
Backend (FastAPI + Python)
    ↓
MongoDB (Database)
    ↓
External Services:
- Stripe (Payments)
- Emergent Auth (Google OAuth)
- OpenAI GPT-5.2 (AI Recommendations)
```

## Admin Credentials
- Email: admin@techgalaxy.ke
- Password: Admin123!

## Environment Variables Required
- MONGO_URL
- DB_NAME
- EMERGENT_LLM_KEY
- STRIPE_API_KEY
- JWT_SECRET
- JWT_ALGORITHM
- JWT_EXPIRATION_HOURS

## Mocked Integrations
1. **M-Pesa** - Requires Safaricom Daraja API credentials (Consumer Key, Consumer Secret, Shortcode, Passkey)
2. **PayPal** - Returns info message, full integration pending
