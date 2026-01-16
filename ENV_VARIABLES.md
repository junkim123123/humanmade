# Environment Variables Reference

## Gemini API (Vision & Reasoning) - CRITICAL

### `GEMINI_API_KEY` ⚠️ REQUIRED FOR ANALYSIS
- **Type:** string (secret)
- **Required:** YES - Without this, all inference features are disabled
- **Default:** None
- **Description:** Server-side Google Generative AI API key for:
  - Vision extraction (label text, barcode, weight estimation, case pack)
  - Customs category and HS code inference
  - Fallback when OCR fails (graceful degradation)
  - Reasoning for supplier recommendations
  - Draft inference when exact matches unavailable
- **Security Rules:**
  - Must NEVER be exposed in client-side code
  - Server-side only: src/app/api/*, src/lib/server/*
  - Never log, only log "API key present" confirmation
  - Use process.env.GEMINI_API_KEY in server routes
- **Setup Steps:**
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create/select a project
  3. Enable Generative AI API
  4. Create API key (Credentials page)
  5. Add to .env.local:
     ```bash
     GEMINI_API_KEY=your-key-here
     ```

### `GEMINI_MODEL` (Optional)
- **Type:** string
- **Default:** `gemini-2.5-flash`
- **Fallback Chain:** `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-pro`
- **Description:** Override primary model. Runtime tries fallbacks if unavailable.
- **Error Handling:**
  - 404 Not Found: Try next fallback
  - 403 Forbidden: Treat as missing key, disable gracefully

## Supplier Enrichment Configuration

### `SUPPLIER_ENRICHMENT_ENABLED`
- **Type:** `"true"` | `"false"` (string)
- **Default:** `false`
- **Description:** Enable supplier enrichment step (only if database table exists)

## Configuration in .env.local

```bash
# 🔑 CRITICAL: Must have this for Gemini inference
GEMINI_API_KEY=your-api-key-from-google-cloud

# Optional: Override default model
# GEMINI_MODEL=gemini-2.5-flash-lite

# Optional: Enable supplier enrichment
SUPPLIER_ENRICHMENT_ENABLED=false

# Keep existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: WhatsApp Cloud API (manual credit request notifications)
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_ADMIN_PHONE=your-admin-phone-number-with-country-code
```

## Client vs Server Rules

✅ **Server-side only (src/app/api, src/lib/server):**
```typescript
const apiKey = process.env.GEMINI_API_KEY; // ✅ OK
```

❌ **Never in client code:**
```typescript
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; // ❌ Don't do this
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Gemini API key not configured" | Set `GEMINI_API_KEY` in `.env.local` |
| "Model not found (404)" | Runtime tries fallbacks automatically |
| "Unauthorized (403)" | Invalid key - regenerate at console.cloud.google.com |
| No inference data | Verify key is set and model supports vision |

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed help.
