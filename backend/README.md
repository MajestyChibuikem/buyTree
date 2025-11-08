# BuyTree Backend

## Quick Setup Checklist

### 1. Verify Database URL

Your `.env` file should have a valid Supabase connection string:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**How to get it:**
1. Go to https://app.supabase.com/
2. Select your project
3. Go to Project Settings → Database
4. Copy "Connection String" (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 2. Test Database Connection

```bash
# Install dependencies first
npm install

# Test connection
node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL||require('dotenv').config()&&process.env.DATABASE_URL});p.query('SELECT NOW()').then(r=>console.log('✅ Connected:',r.rows[0].now)).catch(e=>console.error('❌ Failed:',e.message)).finally(()=>p.end())"
```

### 3. Run Migrations

```bash
npm run migrate
```

You should see:
```
🔄 Starting database migrations...
🔄 Running migration: 001_users_and_sellers.sql
✅ 001_users_and_sellers.sql completed
... (more migrations)
✅ All migrations completed successfully!
```

### 4. Start Development Server

```bash
npm run dev
```

## Common Issues

### "ENOTFOUND" or "Connection refused"
- Check your DATABASE_URL is correct
- Verify Supabase project is running
- Check your internet connection

### "Permission denied"
- Your database user needs CREATE TABLE permissions
- Check password is correct (no special characters causing issues)

### "Syntax error" in migrations
- Check the SQL files in `src/migrations/`
- Make sure they're valid PostgreSQL syntax

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL=postgresql://...          # Supabase connection string
JWT_SECRET=...                         # Generate with: openssl rand -base64 32
PAYSTACK_SECRET_KEY=sk_test_...       # From Paystack dashboard
PAYSTACK_PUBLIC_KEY=pk_test_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Scripts

```bash
npm run dev      # Start dev server (auto-reload)
npm start        # Start production server
npm run migrate  # Run database migrations
```
