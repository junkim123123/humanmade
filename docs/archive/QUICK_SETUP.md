# Quick Setup Guide - Admin Panel

## ⚠️ Important: Don't Run TypeScript in SQL Editor!

The error you saw happens when TypeScript code (like `admin.ts`) is accidentally pasted into Supabase's SQL Editor. 

**Files to run in SQL Editor:**
- ✅ `supabase/schema_admin.sql` - This is SQL

**Files that are TypeScript code (do NOT run in SQL):**
- ❌ `src/lib/supabase/admin.ts` - This is TypeScript
- ❌ Any `.ts` or `.tsx` files

---

## Setup Steps

### 1️⃣ Get Your Supabase Keys

Go to: **Supabase Dashboard → Settings → API**

You need **3 values**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  (anon public key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  (service_role secret key)
```

⚠️ **WARNING:** The `service_role` key is powerful - it bypasses all security rules. Keep it secret!

### 2️⃣ Add to .env.local

Create or update `.env.local` in your project root:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Run Database Migration

Go to: **Supabase Dashboard → SQL Editor**

1. Click "New query"
2. Open `supabase/schema_admin.sql` from your project
3. Copy the ENTIRE contents
4. Paste into SQL Editor
5. Click "Run"

You should see: ✅ Success. No rows returned

### 4️⃣ Create Your Admin Account

**Option A: If you already have an account**

1. Sign up at `/signin` using your email
2. Check your email and click the magic link
3. Once signed in, go to Supabase SQL Editor
4. Run this query (replace with your email):

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

**Option B: Create new admin account**

1. Go to: **Supabase Dashboard → Authentication → Users**
2. Click "Add user"
3. Enter email and password
4. In SQL Editor, run:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

### 5️⃣ Start the App

```bash
npm run dev
```

### 6️⃣ Test Admin Access

1. Go to: `http://localhost:3000/signin`
2. Sign in with your admin email
3. Go to: `http://localhost:3000/app/account`
4. You should see an "Admin" badge
5. Click "Go to Admin Panel" or visit `/admin`

---

## Troubleshooting

### ❌ "SUPABASE_SERVICE_ROLE_KEY is missing"

**Fix:** Add the service role key to `.env.local`
- Find it in Supabase Dashboard → Settings → API
- Look for "service_role" under "Project API keys"

### ❌ Can't access /admin

**Check if you're admin:**

```sql
-- Run in Supabase SQL Editor
SELECT email, role FROM profiles WHERE email = 'your@email.com';
```

If role is `user` or `NULL`, update it:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### ❌ "relation profiles does not exist"

**Fix:** You need to run the database migration
- Go to SQL Editor
- Run all of `supabase/schema_admin.sql`

### ❌ SQL syntax error with "server-only"

**Fix:** You tried to run TypeScript code in SQL Editor
- Only run `.sql` files in SQL Editor
- TypeScript files (`.ts`, `.tsx`) are code files, not database scripts

---

## What Each File Does

### TypeScript Files (Application Code)
- `src/lib/supabase/admin.ts` - Creates admin client (run by Next.js)
- `src/app/admin/**/*.tsx` - Admin panel pages (run by Next.js)

### SQL Files (Database Scripts)
- `supabase/schema_admin.sql` - Creates tables and security rules (run in SQL Editor)

---

## Admin Panel URLs

Once setup is complete:

- **Dashboard:** `/admin`
- **Users:** `/admin/users`
- **Reports:** `/admin/reports`
- **Verifications:** `/admin/verifications`
- **Orders:** `/admin/orders`
- **Inbox:** `/admin/inbox`
- **Leads:** `/admin/leads`

---

## Security Notes

✅ **Safe to share:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

❌ **NEVER share:**
- `SUPABASE_SERVICE_ROLE_KEY` (bypasses all security!)

✅ **Safe to commit:**
- `.env.example`
- All TypeScript code

❌ **NEVER commit:**
- `.env.local`
- Any file with real keys

---

**Need help?** Check `IMPLEMENTATION_GUIDE.md` for detailed documentation.
