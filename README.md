# Tamil Nadu Superstore

Production-grade, modular e-commerce platform tailored for Tamil Nadu shoppers and operations teams.

## Tech Stack

- Frontend: Next.js App Router, React, TailwindCSS
- Backend: Next.js Route Handlers (API)
- Database: PostgreSQL with Prisma ORM
- Auth: JWT access + refresh token cookies, OTP verification
- Payments: Razorpay primary, Cashfree backup (integration phase)
- File Storage: Cloudinary/AWS S3-ready (integration phase)

## Completed Modules

- Authentication and user session management
	- Email/mobile registration with OTP verification
	- JWT access/refresh cookie sessions
	- Forgot/reset password via OTP
	- Guest checkout session
- Product and catalog system
	- Product CRUD
	- Category listing
	- CSV product import
	- Catalog search/filter/sort and related products
- Cart and checkout
	- Add/update/remove cart items
	- Coupon apply flow
	- GST pricing and totals calculation
	- Pincode-based delivery quote
- Orders and payments
	- Place order from cart
	- Order history and order details
	- Order status transition API
	- Payment intent creation and webhook ingestion (Razorpay/Cashfree)
	- Invoice PDF generation
- Admin operations
	- Dashboard overview metrics
	- Payment reconciliation endpoint
	- Review moderation endpoint
- Address management
	- Customer address CRUD APIs

## Seed Defaults

- Admin Login:
	- Email: admin@tnsuperstore.com
	- Password: Admin@12345
- Coupon:
	- Code: WELCOME100
- Delivery zone sample pincodes:
	- 638001, 600001, 641001, 620001, 625001

## Project Structure

```
src/
	app/
		api/
			auth/
			health/
		(admin)/admin/
	modules/
		auth users products categories inventory cart coupons
		addresses checkout payments orders reviews notifications
		analytics admin delivery
	lib/
		api auth config db logging security validation
	types/
prisma/
```

## Environment Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
copy .env.example .env
```

3. Set required values in .env:

- DATABASE_URL
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET

## Local Database Setup

Use one of these options:

1. PostgreSQL installed locally on port 5432
2. Docker Desktop + Compose

If Docker is available:

```bash
docker compose up -d postgres
```

Then run Prisma commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Run Application

```bash
npm run dev
```

App URL: http://localhost:3000

Health check: http://localhost:3000/api/health

## Available Scripts

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run test
- npm run db:generate
- npm run db:migrate
- npm run db:deploy
- npm run db:seed
- npm run db:studio

## API Coverage

### Authentication

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/verify-otp
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/guest-session

### Catalog and Product Management

- GET /api/categories
- GET /api/products
- POST /api/products (admin)
- GET /api/products/[id]
- PATCH /api/products/[id] (admin)
- DELETE /api/products/[id] (admin)
- POST /api/products/import-csv (admin)
- GET /api/products/[id]/related

### Reviews

- GET /api/products/[id]/reviews
- POST /api/products/[id]/reviews
- PATCH /api/admin/reviews/[id]/moderate (admin)

### Cart and Checkout

- GET /api/cart
- POST /api/cart/items
- PATCH /api/cart/items/[itemId]
- DELETE /api/cart/items/[itemId]
- POST /api/cart/apply-coupon
- POST /api/checkout/quote
- POST /api/checkout/place-order

### Address Management

- GET /api/addresses
- POST /api/addresses
- PATCH /api/addresses/[id]
- DELETE /api/addresses/[id]

### Orders and Payments

- GET /api/orders
- GET /api/orders/[id]
- PATCH /api/orders/[id]/status (admin)
- GET /api/orders/[id]/invoice
- POST /api/payments/create-intent
- POST /api/payments/webhooks/razorpay
- POST /api/payments/webhooks/cashfree

### Admin

- GET /api/admin/overview
- GET /api/admin/payments/reconciliation

## Deployment Notes

- Host on AWS (EC2/ECS) or Vercel + managed PostgreSQL
- Put Next.js behind HTTPS termination (ALB/Nginx/Cloudflare)
- Set strong JWT secrets via secret manager
- Enable Redis for distributed rate limiting and cache
- Use S3/Cloudinary for product media
- Set Razorpay/Cashfree webhooks with signature verification

## Performance and Scale Targeting

- App Router SSR/ISR strategy for fast catalog responses
- DB indexes included for critical query paths
- Stateless API design with cookie tokens
- Ready to add queue workers for async notifications and webhooks

## Storefront and Admin Routes

- /
- /products
- /cart
- /checkout
- /orders
- /admin
