// @ts-nocheck
import { NextResponse } from "next/server";
import { runIntelligencePipeline } from "@/lib/intelligence-pipeline";

/**
 * GET /api/test-pipeline
 * 
 * Test endpoint for Intelligence Pipeline
 * Runs the pipeline using dummy data or query parameters and returns JSON results.
 * 
 * Query Parameters (optional):
 * - imageUrl: Product image URL to test (default: dummy image)
 * - quantity: Order quantity (default: 100)
 * - dutyRate: Duty rate (default: 0.15 = 15%)
 * - shippingCost: Shipping cost (default: 500)
 * - fee: Service fee (default: 100)
 * - productId: Existing product ID (optional)
 * 
 * Example:
 * GET /api/test-pipeline?imageUrl=https://example.com/product.jpg&quantity=200
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get from query params or use dummy data
    const imageUrl =
      searchParams.get("imageUrl") ||
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"; // Dummy image
    const quantity = parseInt(searchParams.get("quantity") || "100", 10);
    const dutyRate = parseFloat(searchParams.get("dutyRate") || "0.15");
    const shippingCost = parseFloat(searchParams.get("shippingCost") || "500");
    const fee = parseFloat(searchParams.get("fee") || "100");
    const productId = searchParams.get("productId") || undefined;

    console.log("[Test API] Running pipeline with params:", {
      imageUrl,
      quantity,
      dutyRate,
      shippingCost,
      fee,
      productId,
    });

    // Execute pipeline
    const result = await runIntelligencePipeline({
      imageUrl,
      quantity,
      dutyRate,
      shippingCost,
      fee,
      productId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Intelligence pipeline executed successfully",
        data: result,
        metadata: {
          executionTime: new Date().toISOString(),
          cached: {
            analysis: result.cached.analysis,
            matches: result.cached.matches,
          },
          summary: {
            analysisConfidence: result.analysis.confidence,
            hsCode: result.analysis.hsCode,
            supplierMatchesCount: result.supplierMatches.length,
            landedCostsCount: result.landedCosts.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Test API] Pipeline execution failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Intelligence pipeline execution failed",
        stack: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-pipeline
 * 
 * You can also execute the pipeline via POST request.
 * Request Body:
 * {
 *   "imageUrl": "https://example.com/product.jpg",
 *   "quantity": 100,
 *   "dutyRate": 0.15,
 *   "shippingCost": 500,
 *   "fee": 100,
 *   "productId": "optional-product-id"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    let {
      imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      quantity = 100,
      dutyRate = 0.15,
      shippingCost = 500,
      fee = 100,
      productId,
    } = body;

    // Handle base64 data URL
    // If imageUrl is a data URL (starts with data:), we need to handle it
    // For now, the pipeline expects a URL, so we'll use the data URL as-is
    // The pipeline's fetch will handle data URLs

    console.log("[Test API] Running pipeline with POST body:", {
      imageUrl,
      quantity,
      dutyRate,
      shippingCost,
      fee,
      productId,
    });

    // Execute pipeline
    const result = await runIntelligencePipeline({
      imageUrl,
      quantity,
      dutyRate,
      shippingCost,
      fee,
      productId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Intelligence pipeline executed successfully",
        data: result,
        metadata: {
          executionTime: new Date().toISOString(),
          cached: {
            analysis: result.cached.analysis,
            matches: result.cached.matches,
          },
          summary: {
            analysisConfidence: result.analysis.confidence,
            hsCode: result.analysis.hsCode,
            supplierMatchesCount: result.supplierMatches.length,
            landedCostsCount: result.landedCosts.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Test API] Pipeline execution failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Intelligence pipeline execution failed",
        stack: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
      },
      { status: 500 }
    );
  }
}

