# DocuDistill — Supabase Setup Guide

## Overview

```
User visits docudistill.yourdomain.com
        ↓
Uploads PDF via the form
        ↓
File goes to Supabase Storage (free, no credit card)
        ↓
Your local pipeline polls Supabase every 30s
        ↓
Downloads new files → creates Document → queues Job
        ↓
Worker processes with Claude → results in PostgreSQL
```

Cost: $0 (Supabase free tier + free static hosting)

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Sign up (GitHub login works) — no credit card needed
3. Click "New project"
4. Name it (e.g. "docudistill"), set a database password, pick a region
5. Wait for it to provision (~30 seconds)

## Step 2: Create Storage Bucket

1. In the Supabase dashboard, go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Name it exactly: `submissions`
4. Toggle **"Public bucket"** to OFF (keep it private)
5. Click **Create bucket**

## Step 3: Set Bucket Policies

Still in Storage, click on the `submissions` bucket, then **Policies**:

**Allow public uploads (for the static site):**
1. Click "New policy" → "For full customization"
2. Policy name: `Allow public uploads`
3. Allowed operation: **INSERT**
4. Target roles: **anon**
5. WITH CHECK expression: `true`
6. Click "Review" → "Save policy"

That's it — the anon key can upload, but cannot read or delete. Your service key (server-side) can do everything.

## Step 4: (Optional) Create Metadata Table

This lets the upload form attach submitter name/notes to files.

Go to **SQL Editor** and run:

```sql
CREATE TABLE submission_metadata (
    id BIGSERIAL PRIMARY KEY,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER,
    submitter_name TEXT DEFAULT 'anonymous',
    submitter_note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow the anon key to insert metadata
ALTER TABLE submission_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public inserts" ON submission_metadata
    FOR INSERT TO anon WITH CHECK (true);
```

## Step 5: Get Your Keys

Go to **Project Settings → API**:

- **Project URL**: `https://xxxxxxxxxxxx.supabase.co` — this is your `SUPABASE_URL`
- **anon / public key**: Goes in the public upload page (`app.js`)
- **service_role key**: Goes in your local `.env` (this key has full access — never expose it publicly)

## Step 6: Configure the Public Upload Page

Edit `docudistill-public/app.js` and replace the placeholders:

```javascript
const SUPABASE_URL = "https://xxxxxxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOi...your-anon-key";
const BUCKET_NAME = "submissions";
```

## Step 7: Configure Your Local Pipeline

Add to your `.env`:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...your-service-role-key
SUPABASE_DEFAULT_PRESET=water-well-plugging-record
SUPABASE_SYNC_INTERVAL=30
```

The `SUPABASE_DEFAULT_PRESET` controls which extraction preset gets auto-applied to incoming files. Set it to any preset ID from your database.

## Step 8: Deploy the Public Upload Page

The `docudistill-public/` folder is a static site. Deploy it for free:

**Netlify (easiest):**
1. Go to https://app.netlify.com/drop
2. Drag the `docudistill-public/` folder onto the page
3. Get a live URL instantly

**GitHub Pages:**
1. Push `docudistill-public/` to a repo
2. Settings → Pages → Deploy from branch

**Vercel:**
1. `npx vercel docudistill-public/`

## How It Works

1. User visits your static site, drops PDFs
2. Files go to the `submissions` bucket in Supabase Storage
3. Your local pipeline polls Supabase every 30 seconds
4. Downloads any files it hasn't seen before
5. Creates a Document record + Job in your local PostgreSQL
6. The worker processes with Claude Vision
7. You see results in your dashboard at localhost:3014

The sync keeps a ledger at `data/supabase_sync_ledger.json` to avoid re-downloading files.

## Free Tier Limits

- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **Projects**: 2 active

For context, your sample PDF was 25KB. That's ~40,000 documents before hitting 1GB. Plenty for a personal pipeline.

## Troubleshooting

**"Supabase sync disabled" in logs:**
Make sure both `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set in `.env`.

**Upload fails on the public page:**
Check that the bucket policy allows anon INSERT. Check browser console for errors.

**Files upload but don't appear in pipeline:**
The sync polls every 30 seconds by default. Check pipeline logs for sync messages. Verify `SUPABASE_SERVICE_KEY` is the service_role key (not the anon key).
