# 3 Mandatory Images Requirement

## Overview
Refactored the Analyze UI and API to require all 3 images (product, barcode, label) for every analysis. This improves classification accuracy and provides stronger evidence for AI-powered matching.

## Changes Made

### 1. New Component: ThreeImageUpload
**File:** `src/components/analyze/ThreeImageUpload.tsx`

- Created dedicated 3-slot upload component
- Each slot shows:
  - Label (Product photo / Barcode photo / Label photo)
  - Helper text explaining what to upload
  - "Required" badge
  - Preview thumbnail once uploaded
  - Remove button (X) when image present
  - Upload zone with drag & drop, click, and paste support
- Visual feedback: green border when slot filled, gray dashed when empty
- Aspect ratio: 4:3 for consistent preview sizing

### 2. AnalyzeForm Refactoring
**File:** `src/components/analyze/AnalyzeForm.tsx`

**Removed:**
- `UploadZone` single-image component
- "Proof boosters" toggle (barcode/label now always required)
- "Assumptions we used" details block

**Updated:**
- Import `ThreeImageUpload` instead of `UploadZone`
- Changed file state from `{ front, barcode, label }` to `{ product, barcode, label }`
- Updated validation: `hasValidInput` checks all 3 images present
- Error message: "All 3 photos are required: product, barcode, and label."
- Warning block: "All 3 photos are required to run analysis."
- Restored draft message: "Re-attach your 3 photos and submit."
- Added header: "Upload 3 photos to start" with subtitle "Takes 20 seconds. Prevents expensive mistakes."

**Button Layout:**
- Changed from stacked buttons to flex layout
- Primary button (Run analysis): `flex-1` on mobile, full width
- Secondary button (Power users only): `flex-1 sm:flex-initial` for responsive sizing
- Gap: `gap-2` between buttons
- Responsive: vertical on mobile (`flex-col`), horizontal on desktop (`sm:flex-row`)

### 3. API Route Updates
**File:** `src/app/api/analyze/route.ts`

**Validation:**
- Changed from checking `!imageFile` to `!imageFile || !barcodeFile || !labelFile`
- Error code: `IMAGES_REQUIRED` (was `IMAGE_REQUIRED`)
- Error message: "All 3 photos are required: product, barcode, and label."
- Returns 400 status if any image missing

**Upload Logic:**
- Created `uploadImage` helper function for reusable upload
- Uploads all 3 images in parallel with `Promise.all()`
- Each image gets unique prefix: `product-`, `barcode-`, `label-`
- Storage paths: `{userId}/{prefix}-{uuid}.{ext}`
- Returns public URLs for all 3 images

**Database Storage:**
- `reports.image_url`: Set to `productImageUrl` (main product image for backward compatibility)
- `reports.data`: Extended with:
  ```typescript
  {
    ...report,
    product_image_url: productImageUrl,
    barcode_image_url: barcodeImageUrl,
    label_image_url: labelImageUrl,
  }
  ```
- `pipeline_result`: Stores all 3 paths:
  ```typescript
  {
    queued: true,
    productImagePath: productImageUrl,
    barcodeImagePath: barcodeImageUrl,
    labelImagePath: labelImageUrl,
  }
  ```

**Pipeline Integration:**
- Passes `productImageUrl` as `imagePublicUrl` to pipeline
- Main product image used for classification
- Barcode/label stored for future enrichment and validation

### 4. User Experience
**Before:**
- 1 required image (product photo)
- Optional barcode/label via "Proof boosters" toggle
- "Assumptions we used" block showing auto-estimated costs
- Buttons stacked vertically

**After:**
- 3 required images displayed side-by-side (grid on desktop)
- No toggles or optional uploads
- Clean, focused UI with clear requirements
- "Assumptions" block removed for simplicity
- Buttons side-by-side on desktop, stacked on mobile
- Copy: "Upload 3 photos to start — Takes 20 seconds. Prevents expensive mistakes."

## Benefits

1. **Higher Accuracy:** All 3 images provide comprehensive product data
2. **Better Evidence:** Barcode and label data strengthen supplier matching
3. **Simplified UX:** No optional sections, clear expectations upfront
4. **Small Business Friendly:** Removed technical jargon like "duty rate" and "assumptions"
5. **Future-Proof:** Barcode/label images stored for enhanced AI classification

## Migration Notes

- **Backward Compatibility:** `reports.image_url` still exists (set to product image)
- **New Fields:** `product_image_url`, `barcode_image_url`, `label_image_url` in `reports.data`
- **Existing Reports:** Will continue to work (only have 1 image in `image_url`)
- **New Reports:** Must have all 3 images to be created

## Testing Checklist

- [ ] Upload all 3 images successfully
- [ ] Validation fails if any image missing
- [ ] Preview shows correctly for all slots
- [ ] Remove button works for each slot
- [ ] Drag & drop works for each slot
- [ ] Paste works for each slot
- [ ] Button layout responsive (stacked mobile, side-by-side desktop)
- [ ] API returns 400 with IMAGES_REQUIRED error code
- [ ] All 3 image URLs stored in database
- [ ] Pipeline runs with product image
- [ ] Report page shows product image (backward compatibility)

## Future Enhancements

1. **Multi-Image AI Analysis:** Pass barcode/label images to Gemini for enhanced classification
2. **Barcode Validation:** Extract UPC/EAN from barcode image, validate against product database
3. **Label Compliance:** OCR label text for compliance checking (ingredients, country of origin)
4. **Visual Comparison:** Show all 3 images in report for review
