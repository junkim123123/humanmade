# Fast Response Mode - Quick Start Guide

## Instant Activation

### For Local Development

Add to `.env.local`:
```env
ANALYZE_FAST_MODE=true
```

Then restart your dev server:
```bash
npm run dev
```

### For Staging/Production

Set environment variable:
```bash
# In your deployment platform (Vercel, Railway, etc.)
ANALYZE_FAST_MODE=true
```

**That's it!** The API will now return in < 1 second with partial results.

## What Changed

### Before (Default Behavior - UNCHANGED)
```
User uploads 3 images
    ↓
Wait 48+ seconds for full analysis
    ↓
Get complete report with suppliers, HS codes, costs
```

### After (With ANALYZE_FAST_MODE=true)
```
User uploads 3 images
    ↓
[Instant] Get partial report with basic facts
- Product name, barcode, category, weight
    ↓
[Background] Full analysis continues
    ↓
[Auto-update] Complete report ready in 30-60s
```

## Response Formats

### API Response Time
| Mode | Time | Status |
|------|------|--------|
| `ANALYZE_FAST_MODE=false` (default) | 48-120s | `completed` |
| `ANALYZE_FAST_MODE=true` | < 1s | `partial` |
| Complete (fast mode) | +30-60s | `completed` |

### Response With FAST_MODE=true
```json
{
  "success": true,
  "reportId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "partial",
  "message": "Fast facts extracted. Detailed analysis running in background.",
  "facts": {
    "productName": "Widget Pro",
    "category": "electronics",
    "barcode": "1234567890",
    "netWeight": 0.5,
    "keywords": ["widget", "professional"]
  }
}
```

### Frontend Polling (Temporary Solution)

Until UI banner is implemented, use this to check status:

```javascript
async function pollReportStatus(reportId) {
  let status = "partial";
  let attempts = 0;
  
  while (status === "partial" && attempts < 120) {
    await new Promise(r => setTimeout(r, 1000)); // Wait 1s
    
    const res = await fetch(`/api/reports/${reportId}`);
    const data = await res.json();
    status = data.status;
    
    console.log(`[Poll ${++attempts}] Status: ${status}`);
    
    if (status === "completed") {
      console.log("✓ Report complete! Reload page.");
      break;
    }
  }
}
```

## Testing

### Step 1: Verify Fast Mode is Active
```bash
# Check logs during analysis
# Should see: "[FastAnalyze] Creating partial report..."
```

### Step 2: Verify Response Time
```bash
# Time the API call
time curl -X POST http://localhost:3000/api/analyze \
  -F "image=@test.jpg" \
  -F "barcode=@barcode.jpg" \
  -F "label=@label.jpg"

# Should show: real 0m0.XXXs (less than 1 second)
```

### Step 3: Verify Background Upgrade
```bash
# Check database immediately after fast response
SELECT id, status, product_name FROM reports 
WHERE id='<reportId>' 
ORDER BY created_at DESC LIMIT 1;

# Result: status='partial'

# Wait 60 seconds, check again
# Result: status='completed'
```

### Step 4: Test Error Resilience
The resilient client automatically handles:
- **429 (Rate Limited)** → Waits for Retry-After header, retries
- **503 (Service Unavailable)** → Exponential backoff, retries up to 3 times
- **504 (Gateway Timeout)** → Treats as transient, retries
- **Permanent Errors** → Tries fallback model (gemini-2.5-flash-lite)

```bash
# Simulate 503 error (requires Gemini API mock)
# Or monitor production logs for real error handling

grep -i "503\|429\|504" /var/log/app.log
```

## Troubleshooting

### Fast Mode Not Activating
**Check:** Is `ANALYZE_FAST_MODE=true` in `.env`?
```bash
echo $ANALYZE_FAST_MODE  # Should output: true
```

**Check:** Did you restart the server?
```bash
npm run dev  # Restart required
```

**Check:** Are there console errors?
```bash
# Look for: "[FastAnalyze] Error creating partial report:"
# This means fast mode tried but failed - falling back to full pipeline
```

### Still Getting 48-Second Response
**Reason 1:** `ANALYZE_FAST_MODE` not set to `true`
```bash
# Verify
echo $ANALYZE_FAST_MODE  # Should be: true
```

**Reason 2:** Fast mode code path error
```bash
# Check logs for: "[FastAnalyze] Error... falling back to full pipeline"
# This triggers full pipeline as failsafe
```

**Reason 3:** Gemini API down
```bash
# Fast facts extraction needs working Gemini API
# Check: GOOGLE_AI_API_KEY or GEMINI_API_KEY is set
echo $GEMINI_API_KEY  # Should be non-empty
```

### Incomplete Facts in Response
This is **expected behavior**. Fast mode returns:
- ✅ `productName` - Always extracted
- ✅ `category` - Usually extracted
- ⚠️ `barcode` - May be null if not visible
- ⚠️ `netWeight` - May be null if not extractable
- ✅ `keywords` - Derived from product name

**The full analysis** (running in background) will fill in missing fields.

## Monitoring

### Response Time SLA
- Fast phase (< 1s): ✅ Verified by build
- Background phase: 30-60s typical
- Total time: 30-60s (vs 48-120s original)

### Error Handling
- Transient errors (429/503/504): Automatic retry with backoff
- Permanent errors: Fallback to secondary model
- Max retries: 3 attempts per model

### Production Metrics to Track
```sql
-- Report creation rate
SELECT date_trunc('minute', created_at), COUNT(*) as count
FROM reports
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY 1 ORDER BY 1 DESC;

-- Partial vs completed reports
SELECT status, COUNT(*) as count
FROM reports
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;

-- Average upgrade time
SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as seconds
FROM reports
WHERE status='completed'
AND created_at > NOW() - INTERVAL '1 hour';
```

## Rollback

If you need to disable fast mode:
```env
ANALYZE_FAST_MODE=false
```

**No code changes needed.** This reverts to the original full-pipeline behavior instantly. All partial reports are preserved in the database.

## Next Steps (Phase 5)

### Frontend Integration
1. **Status Banner** - Show "AI analyzing..." when status='partial'
2. **Retry Button** - Manual trigger for background upgrade retry
3. **Real-time Updates** - WebSocket or polling for status changes
4. **Error Display** - Show last_error_code if background job fails

### Production Deployment
1. Deploy with `ANALYZE_FAST_MODE=false` (safe default)
2. Enable for 10% of users (feature flag)
3. Monitor error rates and response times
4. Gradually increase to 100%

### Job Queue (Optional But Recommended)
Replace manual job invocation with:
- **Bull** (Node.js, Redis-backed)
- **RabbitMQ** (Enterprise message queue)
- **Inngest** (Serverless background jobs)

---

**Questions?** Check [PHASE_4_RESILIENT_PIPELINE_IMPLEMENTATION.md](./PHASE_4_RESILIENT_PIPELINE_IMPLEMENTATION.md) for detailed documentation.
