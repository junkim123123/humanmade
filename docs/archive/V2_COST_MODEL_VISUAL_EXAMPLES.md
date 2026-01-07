# V2 Cost Model: Before vs After

## Before (Input Friction Problem)

### Cost Model Display
```
Component         Standard    Conservative
─────────────────────────────────────────
Unit price        $2.50       $3.20
Freight           $0.00       $0.00
  (Needs input)
Duty              $0.00       $0.00
  (Needs input)
Fees              $0.00       $0.00
  (Needs input)
─────────────────────────────────────────
Total             $2.50       $3.20
```

### Warning Message
```
⚠️ Partial estimate: Only unit price is available. 
   Freight, Duty, Fees are not yet calculated. 
   These components will be added to the total once available.
```

### Sensitivity Controls
```
Sensitivity controls
──────────────────────────────────────
Shipping mode:  [Air] [Ocean]

Unit weight (g): [_____________]
                 Enter weight

Carton pack: [_____________]
             e.g., 12 units per carton
```

**Problems:**
- ❌ Shows confusing "$0.00" for missing components
- ❌ Total doesn't reflect true landed cost
- ❌ Users don't know what values to input
- ❌ Warning implies estimate is incomplete
- ❌ No guidance on what the system assumes

---

## After (Frictionless Experience)

### Cost Model Display
```
Component                    Standard    Conservative
──────────────────────────────────────────────────────
Unit price                   $2.50       $3.20
Freight                      $0.12       $0.12
  [From category]
Duty                         $0.00       $0.00
  [From HS estimate]
Fees                         $0.25       $0.25
  [From category]
──────────────────────────────────────────────────────
Total                        $2.87       $3.57
```

### Updated Warning Message
```
💡 Note: Estimate uses assumed shipping and duty. 
   Refine assumptions to tighten the range.
```

### Collapsed Sensitivity Controls (Default State)
```
▶ Refine assumptions
```

### Expanded Sensitivity Controls (When Clicked)
```
▼ Refine assumptions
──────────────────────────────────────
Shipping mode:  [Air] [Ocean]
  We assumed ocean. Edit if you know.

Unit weight (g): [_____________]
  We assumed 150g. Edit if you know.
  Category average for similar products

Carton pack: [_____________]
  We assumed 24 units per carton. Edit if you know.
  Typical carton pack for category
```

**Improvements:**
- ✅ Shows realistic non-zero values immediately
- ✅ Total reflects complete landed cost estimate
- ✅ Clear source labels show where values come from
- ✅ Optional refinement instead of required input
- ✅ Helper text explains what's assumed
- ✅ Less intimidating, more actionable

---

## Real Example: LINE FRIENDS Gummy Candy Toy

### Category Detection
- Product: "LINE FRIENDS Gummy Candy Toy"
- Keywords: ["toy", "candy", "collectible"]
- HS Code: 9503.00.00 (Toys)
- **Detected Category**: Toy

### Inferred Values (Zero User Input)
```
Shipping Mode:     ocean          [Assumed]           70% confidence
  "Ocean shipping assumed (most common for imports)"

Unit Weight:       150g           [From category]     60% confidence
  "Category average for similar products"

Unit Volume:       0.0008m³       [From category]     50% confidence
  "Category average volume"

Carton Pack:       24 units       [From category]     60% confidence
  "Typical carton pack for category"

Duty Rate:         0.0%           [From HS estimate]  80% confidence
  "Based on HS chapter: Toys and sports equipment"

Fees Per Unit:     $0.25          [From category]     70% confidence
  "Typical customs and handling fees"

Shipping Per Unit: $0.12          [From category]     65% confidence
  "Ocean freight estimate (FCL/LCL blended)"
```

### Cost Breakdown
```
Component                    Standard    Conservative
──────────────────────────────────────────────────────
Unit price                   $0.85       $1.20
  (from supplier matches)

Freight [From category]      $0.12       $0.12

Duty [From HS estimate]      $0.00       $0.00

Fees [From category]         $0.25       $0.25
──────────────────────────────────────────────────────
Total                        $1.22       $1.57
```

### User Refines Assumptions (Optional)
User clicks "Refine assumptions" and updates:
- ✏️ Weight: 180g (heavier than average)
- ✏️ Shipping: Air (faster delivery needed)

System recalculates:
```
Shipping Per Unit: $0.57  (was $0.12)
  Updated: Air freight estimate based on weight and volume
  [Adjusted for 180g weight, 3.5x ocean multiplier]
  
Total: $1.67 (was $1.22)
```

---

## Source Badge Color Coding

```css
[Assumed]              /* Gray:   bg-slate-100 text-slate-600   */
[From category]        /* Blue:   bg-blue-50 text-blue-700     */
[From customs records] /* Green:  bg-green-50 text-green-700   */
[From HS estimate]     /* Purple: bg-purple-50 text-purple-700 */
```

### Visual Example
```
Freight  $0.12  [From category]
         ↓      ↓
      Value    Blue badge = Category prior

Duty     $0.00  [From HS estimate]
         ↓      ↓
      Value    Purple badge = HS code lookup
```

---

## Category Prior Examples

### Toy
```
Weight:      150g
Duty:        0.0% (HS 95 duty-free)
Shipping:    $0.12 ocean / $0.45 air
Fees:        $0.25
Carton:      24 units
```

### Apparel (T-Shirt)
```
Weight:      250g
Duty:        16.5% (HS 61/62 apparel)
Shipping:    $0.10 ocean / $0.50 air
Fees:        $0.30
Carton:      12 units
```

### Beauty (Lotion)
```
Weight:      120g
Duty:        6.5% (HS 33 cosmetics)
Shipping:    $0.08 ocean / $0.38 air
Fees:        $0.40
Carton:      24 units
```

### Food (Cookies)
```
Weight:      200g
Duty:        5.5% (HS 19 cereal preparations)
Shipping:    $0.15 ocean / $0.60 air
Fees:        $0.35
Carton:      12 units
```

---

## Confidence Score Interpretation

```
80-100%  High      Green bar   ███████████████████░  "Reliable estimate"
60-79%   Medium    Yellow bar  █████████████░░░░░░░  "Reasonable estimate"
40-59%   Low       Orange bar  ██████░░░░░░░░░░░░░░  "Rough estimate"
0-39%    Very Low  Red bar     ███░░░░░░░░░░░░░░░░░  "Placeholder only"
```

### Confidence Factors
| Source              | Base Confidence | Example                           |
|---------------------|-----------------|-----------------------------------|
| User Input          | 100%            | User entered exact weight         |
| Product Label       | 85%             | Extracted "200g" from photo       |
| HS Code Lookup      | 80%             | HS 6109 → 16.5% duty             |
| Customs Records     | 75%             | Median from 50+ import records    |
| Category Average    | 60-70%          | Typical toy weight: 150g          |
| System Default      | 70%             | Ocean shipping assumed            |
| Generic Fallback    | 50%             | No specific data available        |

---

## Error Prevention

### Before: Confusing Zero Values
```
Q: "Why is my total only $2.50 when shipping to the US?"
A: Because Freight, Duty, and Fees show $0.00
→ User thinks the estimate is broken
→ Support ticket: "Cost calculator not working"
```

### After: Clear Communication
```
Q: "Why is my total $2.87 instead of $2.50?"
A: Total includes $0.12 freight + $0.25 fees (shown as "From category")
→ User sees the source badges
→ Clicks "Refine assumptions" to get more precise
→ No confusion, no support ticket
```

---

## Mobile Responsive Design

### Collapsed (Default)
```
┌─────────────────────────────┐
│ Cost model                  │
├─────────────────────────────┤
│ Component      Standard     │
│ Unit price     $2.50        │
│ Freight        $0.12        │
│   [From category]           │
│ Duty           $0.00        │
│   [From HS]                 │
│ Fees           $0.25        │
│   [From category]           │
│ Total          $2.87        │
├─────────────────────────────┤
│ 💡 Estimate uses assumed    │
│    shipping and duty        │
├─────────────────────────────┤
│ ▶ Refine assumptions        │
└─────────────────────────────┘
```

### Expanded (After Click)
```
┌─────────────────────────────┐
│ Cost model                  │
├─────────────────────────────┤
│ [Cost table...]             │
├─────────────────────────────┤
│ ▼ Refine assumptions        │
│                             │
│ Shipping mode               │
│ [Ocean] [Air]               │
│ We assumed ocean.           │
│                             │
│ Unit weight (g)             │
│ [____________]              │
│ We assumed 150g.            │
│                             │
│ Carton pack                 │
│ [____________]              │
│ We assumed 24 units.        │
└─────────────────────────────┘
```
