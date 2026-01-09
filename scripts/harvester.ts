/**
 * ImportKey.com Data Harvester
 * 
 * Automatically logs into ImportKey.com, iterates through a keyword list, and downloads CSV data.
 * 
 * Usage:
 *   npx tsx scripts/harvester.ts
 * 
 * Environment Variables (.env.local):
 *   IMPORTKEY_EMAIL=your-email@example.com
 *   IMPORTKEY_PASSWORD=your-password
 */

import puppeteer, { Browser, Page } from "puppeteer";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env.local");
const envResult = dotenv.config({ path: envPath, debug: false });

// Debugging: Check environment variable load status
if (envResult.error) {
  console.warn(`⚠️  .env.local file not found: ${envPath}`);
  console.warn("   Please create a .env.local file in the project root.");
} else {
  console.log(`✅ Environment variable file loaded: ${envPath}`);
  // Debug loaded environment variables
  if (envResult.parsed) {
    console.log(`   📦 Number of variables loaded: ${Object.keys(envResult.parsed).length}`);
  }
}

const KEYWORDS = [
  // 1 General Phrases
  "ARTICLES OF PLASTICS",
  "ARTICLES OF PLASTIC",
  "PLASTICWARE",
  "HOUSEHOLD PLASTICWARE",
  "KITCHEN PLASTICWARE",
  "HOUSEHOLD UTENSILS",
  "HOUSEHOLD UTENSILS PLASTIC",
  "HOUSEHOLD UTENSILS METAL",
  "KITCHEN UTENSILS PLASTIC",
  "KITCHEN UTENSILS METAL",
  "HOUSEHOLD ARTICLES PLASTIC",
  "HOUSEHOLD ARTICLES METAL",
  "HOMEWARE",
  "HOMEWARES",
  "HOUSEWARE ITEMS",
  "KITCHENWARE ITEMS",
  "BATHROOM ITEMS",
  "ASSORTED GOODS",
  "ASSORTED ITEMS",
  "MIXED MERCHANDISE",
  "SUNDRY GOODS",
  "VARIETY ITEMS",
  "NOVELTY PRODUCTS",

  // 2 Retail Store Operating Supplies
  "RETAIL ACCESSORIES",
  "STORE ACCESSORIES",
  "MERCHANDISING ACCESSORIES",
  "DISPLAY ACCESSORY",
  "DISPLAY ACCESSORIES",
  "SHELF ACCESSORIES",
  "SHELF MANAGEMENT",
  "SHELF ORGANIZER",
  "SHELF ORGANIZERS",
  "SHELF DIVIDER",
  "SHELF DIVIDERS PLASTIC",
  "SHELF DIVIDERS METAL",
  "SHELF PUSHER",
  "SHELF PUSHERS",
  "PRICE HOLDER",
  "PRICE HOLDERS",
  "LABEL HOLDER",
  "LABEL HOLDERS",
  "SIGN FRAME",
  "SIGN FRAMES",
  "ACRYLIC FRAME",
  "ACRYLIC FRAMES",
  "ACRYLIC DISPLAY STAND",
  "ACRYLIC DISPLAY STANDS",
  "COUNTERTOP RACK",
  "COUNTERTOP RACKS",
  "FLOOR RACK",
  "FLOOR RACKS",
  "WIRE DISPLAY STAND",
  "WIRE DISPLAY STANDS",
  "METAL DISPLAY RACK",
  "METAL DISPLAY RACKS",
  "HOOK DISPLAY",
  "DISPLAY HOOKS METAL",
  "DISPLAY HOOKS WIRE",
  "SLATWALL ACCESSORIES",
  "SLATWALL BRACKETS",
  "SLATWALL HOOKS",
  "PEGBOARD ACCESSORIES",
  "PEGBOARD HOOKS",
  "GRIDWALL ACCESSORIES",
  "GRIDWALL HOOKS",

  // 3 POS Peripherals
  "RETAIL POS EQUIPMENT",
  "POS ACCESSORIES",
  "POS PARTS",
  "BARCODE SCANNERS",
  "HANDHELD BARCODE SCANNER",
  "WIRELESS BARCODE SCANNER",
  "SCANNER STAND",
  "SCANNER STANDS",
  "LABEL PRINTERS",
  "THERMAL LABEL PRINTER",
  "THERMAL RECEIPT PRINTER",
  "THERMAL RECEIPT PAPER ROLL",
  "RECEIPT PAPER ROLL",
  "LABEL ROLL",
  "LABEL ROLLS",
  "BARCODE LABEL ROLL",
  "BARCODE LABELS ROLL",
  "POS PAPER",
  "CASH REGISTER DRAWER",
  "CASH BOX",
  "COIN TRAY",
  "BILL TRAY",
  "CARD READER ACCESSORIES",

  // 4 Security Tags
  "EAS SYSTEM",
  "EAS ACCESSORIES",
  "EAS HARD TAG",
  "EAS SOFT TAG",
  "SECURITY HARD TAG",
  "SECURITY SOFT TAG",
  "SECURITY LABEL",
  "SECURITY LABELS",
  "RFID LABELS",
  "RFID STICKERS",
  "RFID INLAY",
  "RFID INLAYS",
  "TAG DETACHER",
  "EAS DETACHER",
  "SECURITY DETACHER",
  "LOCKING CABLE",
  "SECURITY CABLE",
  "DISPLAY SECURITY CABLE",

  // 5 Packaging & Logistics
  "PACKAGING MATERIAL",
  "PACKAGING MATERIALS",
  "PACKING MATERIAL",
  "PACKING MATERIALS",
  "PACKING PRODUCTS",
  "SHIPPING MATERIALS",
  "SHIPPING CARTONS",
  "CARTONS PAPER",
  "CARTON BOX",
  "CARTON BOXES",
  "CORRUGATED CARTONS",
  "CORRUGATED BOXES",
  "CARDBOARD CARTONS",
  "MAILER BAG",
  "MAILER BAGS",
  "COURIER BAGS",
  "POLY MAILING BAGS",
  "POLY SHIPPING BAGS",
  "OPP BAGS",
  "OPP BAG",
  "RESEALABLE BAGS",
  "RESEALABLE BAG",
  "ZIPLOCK BAG",
  "ZIPLOCK BAGS",
  "PACKING TAPE",
  "SEALING TAPE",
  "CARTON SEALING TAPE",
  "CLEAR PACKING TAPE",
  "BOPP PACKING TAPE",
  "DOUBLE SIDED TAPE",
  "STRETCH WRAP FILM",
  "SHRINK WRAP FILM",
  "STRETCH FILM ROLL",
  "SHRINK FILM ROLL",
  "BUBBLE WRAP ROLL",
  "BUBBLE WRAP",
  "AIR CUSHION",
  "AIR CUSHION FILM",
  "AIR PILLOW FILM",
  "VOID FILL PAPER",
  "KRAFT PAPER ROLL",
  "PACKING SLIP",
  "PACKING SLIPS",
  "DOCUMENT ENCLOSURE",
  "INVOICE ENCLOSURE",
  "SHIPPING LABELS",
  "WARNING LABELS",
  "FRAGILE LABELS",

  // 6 Cleaning Tools
  "CLEANING ARTICLES",
  "CLEANING PRODUCTS",
  "CLEANING TOOLS",
  "HOUSEHOLD CLEANING TOOLS",
  "SCRUB BRUSHES",
  "CLEANING BRUSHES",
  "BOTTLE BRUSHES",
  "TOILET BRUSH SET",
  "DISH BRUSH",
  "DISH BRUSHES",
  "SPONGES",
  "SCOURING PADS",
  "MICROFIBER CLOTH",
  "MICROFIBER CLOTHS",
  "DUSTERS",
  "MOP HEAD",
  "MOP HEADS",
  "MOPS",
  "BROOMS",
  "DUSTPANS",
  "CLEANING GLOVES",
  "TRASH BINS",
  "WASTE BINS",
  "GARBAGE BINS",
  "TRASH CAN",
  "TRASH CANS",
  "GARBAGE BAGS",
  "TRASH BAGS",

  // 7 Kitchen Utensils
  "KITCHEN TOOLS",
  "KITCHEN GADGETS",
  "COOKING TOOLS",
  "FOOD PREP TOOLS",
  "SILICONE SPATULA",
  "SILICONE SPATULAS",
  "SILICONE BRUSH",
  "SILICONE BRUSHES",
  "KITCHEN TONGS",
  "WHISKS",
  "PEELERS",
  "GRATERS",
  "STRAINERS",
  "SINK STRAINER",
  "SINK STRAINERS",
  "COLANDERS",
  "MEASURING CUPS",
  "MEASURING SPOONS",
  "FOOD CONTAINERS",
  "FOOD STORAGE CONTAINERS",
  "MEAL PREP CONTAINERS",
  "PLASTIC FOOD CONTAINERS",
  "GLASS FOOD CONTAINERS",
  "LUNCH BOXES",
  "WATER BOTTLES",
  "TUMBLERS",
  "TRAVEL MUGS",

  // 8 Bathroom & Living
  "BATHROOM ACCESSORIES",
  "BATH ACCESSORIES",
  "SHOWER ACCESSORIES",
  "SHOWER CADDIES",
  "SHOWER RACK",
  "SHOWER RACKS",
  "SOAP DISPENSERS",
  "SOAP HOLDER",
  "SOAP HOLDERS",
  "TOOTHBRUSH HOLDER",
  "TOOTHBRUSH HOLDERS",
  "TISSUE BOX COVER",
  "TOWEL HOOK",
  "TOWEL HOOKS",
  "BATH MATS",
  "NON SLIP MATS",
  "BATHROOM ORGANIZER",
  "BATHROOM ORGANIZERS",

  // 9 Office Stationery
  "OFFICE SUPPLIES ITEMS",
  "SCHOOL STATIONERY",
  "WRITING INSTRUMENTS",
  "BALLPOINT PENS",
  "GEL PENS",
  "MARKER PENS",
  "HIGHLIGHTER PENS",
  "NOTE PADS",
  "STICKY NOTES",
  "FILE FOLDERS",
  "DOCUMENT FOLDERS",
  "BINDERS",
  "BINDER CLIPS",
  "PAPER CLIPS",
  "STAPLERS",
  "STAPLES",
  "TAPE DISPENSERS",
  "OFFICE TAPE",
  "GLUE STICKS",
  "SCISSORS",
  "CUTTING KNIVES",
  "CRAFT ITEMS",
  "ART MATERIALS",
  "CRAFT MATERIALS",

  // 10 Electronic Accessories
  "ELECTRICAL GOODS",
  "ELECTRICAL ACCESSORIES",
  "USB ACCESSORIES",
  "USB C CABLE",
  "USB C CABLES",
  "CHARGING CABLE",
  "CHARGING CABLES",
  "POWER ADAPTER",
  "POWER ADAPTERS",
  "WALL CHARGER",
  "WALL CHARGERS",
  "USB CHARGER",
  "USB CHARGERS",
  "CAR CHARGER",
  "CAR CHARGERS",
  "POWER BANKS",
  "PORTABLE CHARGERS",
  "EARBUDS",
  "EARPHONES",
  "HEADPHONES",
  "PHONE CASE",
  "PHONE CASES",
  "SCREEN PROTECTOR",
  "SCREEN PROTECTORS",
  "TEMPERED GLASS",
  "PHONE HOLDER",
  "PHONE HOLDERS",
  "CABLE CLIPS",
  "CABLE ORGANIZERS",

  // 11 Hardware
  "FASTENERS",
  "SCREWS METAL",
  "BOLTS METAL",
  "NUTS METAL",
  "WASHERS METAL",
  "WALL ANCHORS",
  "HOOKS METAL",
  "BRACKETS METAL",
  "SHELF BRACKETS",
  "HINGES",
  "DOOR HARDWARE",
  "CABINET HARDWARE",
  "ADHESIVE PRODUCTS",
  "SEALANT PRODUCTS",
  "SILICONE SEALANT",
  "CAULK SEALANT",
  "EPOXY ADHESIVE",
  "SUPER GLUE",
  "WEATHER STRIP",
  "WEATHER STRIPPING",
  "DOOR SEAL STRIP",
  "WINDOW SEAL STRIP",
  "PTFE THREAD SEAL TAPE",
  "CABLE TIES",
  "NYLON CABLE TIES",

  // 12 Pet, Auto, Seasonal
  "PET PRODUCTS ITEMS",
  "PET ACCESSORIES ITEMS",
  "DOG LEASH",
  "DOG LEASHES",
  "DOG COLLAR",
  "DOG COLLARS",
  "PET BOWL",
  "PET BOWLS",
  "PET FEEDER",
  "PET FEEDERS",
  "PET CARRIER",
  "PET CARRIERS",
  "CAT LITTER",
  "LITTER SCOOP",
  "CAT SCRATCHER",
  "AQUARIUM ACCESSORIES",
  "AUTO ACCESSORY ITEMS",
  "CAR CLEANING ITEMS",
  "MICROFIBER TOWELS",
  "CAR ORGANIZER",
  "CAR ORGANIZERS",
  "SEASONAL DECOR ITEMS",
  "PARTY DECOR ITEMS",
] as const





// ImportKey Login Credentials
// dotenv removes quotes, so it doesn't matter if they exist or not
let IMPORTKEY_EMAIL = process.env.IMPORTKEY_EMAIL?.trim() || "";
let IMPORTKEY_PASSWORD = process.env.IMPORTKEY_PASSWORD?.trim() || "";

// Remove quotes (in case they still remain)
IMPORTKEY_EMAIL = IMPORTKEY_EMAIL.replace(/^["']|["']$/g, "");
IMPORTKEY_PASSWORD = IMPORTKEY_PASSWORD.replace(/^["']|["']$/g, "");

// Debugging: Check environment variables
console.log("\n📋 Environment Variable Check:");
console.log(`   IMPORTKEY_EMAIL: ${IMPORTKEY_EMAIL ? `✅ Set (${IMPORTKEY_EMAIL.substring(0, 3)}***)` : "❌ Missing"}`);
console.log(`   IMPORTKEY_PASSWORD: ${IMPORTKEY_PASSWORD ? "✅ Set (***)" : "❌ Missing"}`);

// Check original values (for debugging)
if (!IMPORTKEY_EMAIL || !IMPORTKEY_PASSWORD) {
  console.log("\n🔍 Debugging Info:");
  console.log(`   process.env.IMPORTKEY_EMAIL (original): "${process.env.IMPORTKEY_EMAIL}"`);
  console.log(`   process.env.IMPORTKEY_PASSWORD (original): "${process.env.IMPORTKEY_PASSWORD ? "***" : "undefined"}"`);
  console.log(`   envResult.parsed?.IMPORTKEY_EMAIL: "${envResult.parsed?.IMPORTKEY_EMAIL}"`);
  console.log(`   envResult.parsed?.IMPORTKEY_PASSWORD: "${envResult.parsed?.IMPORTKEY_PASSWORD ? "***" : "undefined"}"`);
}

if (!IMPORTKEY_EMAIL || !IMPORTKEY_PASSWORD) {
  console.error("\n❌ Environment variables are not set.");
  console.error("\n💡 Solution:");
  console.error(`   1. Create a .env.local file in the project root: ${path.resolve(process.cwd(), ".env.local")}`);
  console.error("   2. Add the following content:");
  console.error("      IMPORTKEY_EMAIL=your-email@example.com");
  console.error("      IMPORTKEY_PASSWORD=your-password");
  console.error("\n   ⚠️  Caution:");
  console.error("      - No spaces around the equals sign (=)");
  console.error("      - No quotes needed");
  console.error("      - Comments start with #");
  process.exit(1);
}

// Download directory setup
const DOWNLOAD_DIR = path.resolve(process.cwd(), "downloads");
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

/**
 * Create browser instance
 */
async function createBrowser(): Promise<Browser> {
  console.log("🌐 Starting browser...");
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true if you don't need to see the browser
    defaultViewport: null,
    args: [
      "--start-maximized", // Maximize window
      `--download.default_directory=${DOWNLOAD_DIR}`, // Set download path
      "--disable-blink-features=AutomationControlled", // Prevent automation detection
    ],
  });

  return browser;
}

/**
 * Log into ImportKey.com
 */
async function login(page: Page): Promise<boolean> {
  try {
    console.log("🔐 Navigating to login page...");
    await page.goto("https://importkey.com/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Enter email
    console.log("📧 Entering email...");
    await page.waitForSelector('input[type="email"], input[name="email"], input[id="email"]', {
      timeout: 10000,
    });
    
    // Try multiple possible selectors
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.$(selector);
        if (emailInput) break;
      } catch (e) {
        // Try next selector
      }
    }

    if (!emailInput) {
      throw new Error("Email input field not found.");
    }

    await emailInput.type(IMPORTKEY_EMAIL, { delay: 1 });

    // Enter password
    console.log("🔑 Entering password...");
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = await page.$(selector);
        if (passwordInput) break;
      } catch (e) {
        // Try next selector
      }
    }

    if (!passwordInput) {
      throw new Error("Password input field not found.");
    }

    await passwordInput.type(IMPORTKEY_PASSWORD, { delay: 100 });

    // Click login button
    console.log("🚀 Clicking login button...");
    const loginButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      'a[href*="login"]',
    ];

    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        loginButton = await page.$(selector);
        if (loginButton) break;
      } catch (e) {
        // Try next selector
      }
    }

    if (!loginButton) {
      // Try with Enter key
      await passwordInput.press("Enter");
    } else {
      await loginButton.click();
    }

    // Wait for login completion (URL change or specific element)
    console.log("⏳ Waiting for login completion...");
    
    try {
      // Wait for navigation (max 30s)
      await Promise.race([
        page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: 30000,
        }),
        new Promise((resolve) => setTimeout(resolve, 5000)), // Minimum 5s wait
      ]);
    } catch (navError) {
      // Continue even if navigation wait times out
      console.log("   ⚠️  Navigation wait timeout (continuing)");
    }

    // Additional wait for JavaScript execution
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify login success
    const currentUrl = page.url();
    console.log(`   📄 Current URL: ${currentUrl}`);

    // Multiple ways to verify login success
    const isLoginPage = currentUrl.includes("/login");
    const hasError = await page.evaluate(() => {
      // Check for error messages
      const errorText = document.body.innerText.toLowerCase();
      return errorText.includes("invalid") || 
             errorText.includes("incorrect") || 
             errorText.includes("error") ||
             errorText.includes("failed");
    });

    if (hasError) {
      // Save screenshot
      const screenshotPath = path.join(DOWNLOAD_DIR, "login-error.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Error screenshot saved: ${screenshotPath}`);
      throw new Error("Login error message detected.");
    }

    if (isLoginPage) {
      // Save screenshot
      const screenshotPath = path.join(DOWNLOAD_DIR, "login-still-on-page.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Current page screenshot saved: ${screenshotPath}`);
      console.log("   ⚠️  Still on the login page.");
      console.log("   💡 Please complete login manually.");
      
      // Give user time to complete login manually
      console.log("   ⏸️  Waiting 10 seconds... (please complete login)");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      
      // Re-check URL
      const newUrl = page.url();
      if (newUrl.includes("/login")) {
        throw new Error("Login failed. URL did not change.");
      }
    }

    console.log("✅ Login successful!");
    return true;
  } catch (error) {
    console.error("❌ Login failed:", error);
    return false;
  }
}

/**
 * Search by keyword and download CSV
 */
/**
 * Normalize keyword to URL-safe format
 * Example: "Glass Pipe" -> "glass-pipe"
 */
function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except hyphen
    .replace(/\s+/g, '-') // Replace spaces with hyphen
    .replace(/-+/g, '-') // Replace multiple hyphens with one
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

async function harvestKeyword(
  page: Page,
  keyword: string,
  index: number
): Promise<boolean> {
  try {
    console.log(`\n📦 [${index + 1}/${KEYWORDS.length}] Processing keyword: "${keyword}"`);

    // Normalize keyword (convert to URL-safe format)
    const normalizedKeyword = normalizeKeyword(keyword);
    console.log(`   🔤 Normalized keyword: "${normalizedKeyword}"`);

    // ImportKey actual search URL format: /result/shipment/{keyword}?domain=usimport
    const searchUrl = `https://importkey.com/result/shipment/${normalizedKeyword}?domain=usimport`;
    
    console.log(`   🔍 Navigating to search page: ${searchUrl}`);
    
    // Wait sufficiently for Rocket Loader completion
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for Rocket Loader and JavaScript full load
    console.log("   ⏳ Waiting for Rocket Loader and JavaScript to load...");
    
    try {
      // Wait for Rocket Loader to complete (max 15s)
      await page.waitForFunction(
        () => {
          // Check if document.readyState is complete and main scripts are loaded
          return document.readyState === "complete" && 
                 typeof window !== "undefined" &&
                 !document.querySelector('script[data-cfasync="false"]:not([src*="rocket"])');
        },
        { timeout: 15000 }
      ).catch(() => {
        // Continue even if Rocket Loader check fails
        console.log("   ⚠️  Rocket Loader check skipped (continuing)");
      });
    } catch (e) {
      // Ignore and continue
    }

    // Additional wait for dynamic content
    console.log("   ⏳ Waiting for dynamic content to load...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Additional wait for network requests completion
    try {
      // Wait for additional navigation with networkidle2 (verify Rocket Loader completion)
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {
        // Continue even if no navigation occurs (already loaded page)
      });
    } catch (e) {
      // Ignore and continue
    }
    
    // Final stabilization wait
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // [Expand Date Range] Attempt to click '5 years' button
    console.log("   📅 Attempting to expand date range...");
    try {
      // Multiple ways to find '5 years' button
      const dateRangeSelectors = [
        // XPath based on text
        "//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '5 years')]",
        "//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '5+ years')]",
        "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '5 years')]",
        "//a[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '5 years')]",
        // CSS Selectors
        'button:has-text("5 years")',
        'button:has-text("5+ years")',
        'span:has-text("5 years")',
        'a:has-text("5 years")',
        '[data-value*="5"]',
        '[aria-label*="5 years" i]',
      ];

      let dateButton = null;
      for (const selector of dateRangeSelectors) {
        try {
          if (selector.startsWith('//')) {
            // XPath
            const elements = await (page as any).$x(selector);
            if (elements && elements.length > 0) {
              dateButton = elements[0];
              console.log(`   ✅ Date range button found (XPath): ${selector}`);
              break;
            }
          } else {
            // CSS Selector
            const element = await page.$(selector);
            if (element) {
              dateButton = element;
              console.log(`   ✅ Date range button found (CSS): ${selector}`);
              break;
            }
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (dateButton) {
        // Scroll button into view
        await dateButton.evaluate((el: HTMLElement) => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Attempt click
        try {
          await (dateButton as any).click({ delay: 100 });
          console.log("   ✅ Date range expanded (5 years)");
          
          // Wait for data refresh
          await new Promise((resolve) => setTimeout(resolve, 3000));
          
          // Wait for network requests completion
          try {
            await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {});
          } catch (e) {
            // Ignore
          }
        } catch (clickError) {
          // Attempt JavaScript click
          try {
            await dateButton.evaluate((el: any) => el.click());
            console.log("   ✅ Date range expanded (JavaScript click)");
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (jsError) {
            console.log(`   ⚠️  Date range button click failed: ${jsError}`);
          }
        }
      } else {
        console.log("   ⚠️  Date range button not found (using default settings)");
      }
    } catch (e) {
      console.log(`   ⚠️  Date range change failed (skipping): ${e}`);
    }

    // Search for Export button
    console.log("   🔍 Searching for Export button...");

    // Check file list before download
    const filesBefore = fs.readdirSync(DOWNLOAD_DIR);

    let exportButton = null;

    // Method 1: Simplest method - search for button with exact "Export" text
    try {
      // Find all buttons and check for exact "Export" text
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await btn.evaluate((el: Element) => el.textContent?.trim() || '');
        // Exact "Export" or "Export" included with short text
        if (text.toLowerCase() === 'export' || (text.toLowerCase().includes('export') && text.length < 20)) {
          // Exclude tab buttons
          const isTab = /data|us|global|mexico|import|export data/i.test(text);
          if (!isTab) {
            exportButton = btn;
            console.log(`   ✅ Export button found: "${text}"`);
            break;
          }
        }
      }
    } catch (e) {
      console.log(`   ⚠️  Button search failed: ${e}`);
    }

    // Method 2: XPath search for exact "Export"
    if (!exportButton) {
      try {
        const buttons = await (page as any).$x('//button[normalize-space(text())="Export"]');
        if (buttons && buttons.length > 0) {
          // Check if it's not a tab
          for (const btn of buttons) {
            const text = await btn.evaluate((el: Element) => el.textContent?.trim() || '');
            const isTab = /data|us|global|mexico|import|export data/i.test(text);
            if (!isTab) {
              exportButton = btn;
              console.log(`   ✅ Export button found (XPath): "${text}"`);
              break;
            }
          }
        }
      } catch (e) {
        console.log(`   ⚠️  XPath search failed: ${e}`);
      }
    }

    // Method 3: Scan all elements on page for "Export" text
    if (!exportButton) {
      try {
        const exportElements = await page.evaluate(() => {
          const allElements = Array.from(document.querySelectorAll('button, a, div, span'));
          return allElements
            .map((el, index) => {
              const text = el.textContent?.trim() || '';
              const isExport = text.toLowerCase() === 'export' || 
                             (text.toLowerCase().includes('export') && text.length < 20);
              const isTab = /data|us|global|mexico|import|export data/i.test(text);
              const style = window.getComputedStyle(el);
              const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
              
              if (isExport && !isTab && isVisible) {
                return { index, text, tagName: el.tagName };
              }
              return null;
            })
            .filter(el => el !== null);
        });

        if (exportElements && exportElements.length > 0) {
          console.log(`   📋 ${exportElements.length} Export button candidates found:`);
          exportElements.forEach((el: any, i: number) => {
            console.log(`      ${i + 1}. "${el.text}" (${el.tagName})`);
          });

          // Select first element
          const firstElement = exportElements[0];
          const allElements = await page.$$('button, a, div, span');
          if (allElements[firstElement.index]) {
            exportButton = allElements[firstElement.index];
            console.log(`   ✅ Export button selected: "${firstElement.text}"`);
          }
        }
      } catch (e) {
        console.log(`   ⚠️  Full scan failed: ${e}`);
      }
    }

    if (!exportButton) {
      console.log(`   ❌ Failed: Export button not found. (Saving screenshot)`);
      const screenshotPath = path.join(DOWNLOAD_DIR, `error-${keyword.replace(/\s+/g, "-")}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Screenshot saved: ${screenshotPath}`);
      return false;
    }

    // 🎯 Visual debugging: Highlight found button with red border
    try {
      await page.evaluate((el: HTMLElement) => {
        el.style.border = "5px solid red";
        el.style.backgroundColor = "yellow";
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, exportButton as any);
      console.log("   🎯 Targeted button with red border. Clicking in 1 second.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {
      console.log(`   ⚠️  Visual display failed (continuing): ${e}`);
    }

    // Click Export button
    try {
      await (exportButton as any).click({ delay: 100 });
      console.log("   🖱️ Export button click successful!");
    } catch (clickError) {
      console.log(`   ⚠️  Standard click failed, attempting JavaScript click...`);
      try {
        await exportButton.evaluate((el: any) => el.click());
        console.log("   🖱️ Export button click successful (JavaScript)");
      } catch (jsError) {
        console.error(`   ❌ Export button click failed: ${jsError}`);
        return false;
      }
    }

    // Wait for modal popup
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Configure Export modal and click Download button
    try {
      // Check if modal appeared
      const modalSelectors = [
        'div[class*="modal" i]',
        'div[class*="dialog" i]',
        '[role="dialog"]',
        'div:has-text("Export As")',
        'div:has-text("Export as")',
      ];

      let modal = null;
      for (const selector of modalSelectors) {
        try {
          modal = await page.$(selector);
          if (modal) {
            console.log(`   ✅ Export modal found: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (!modal) {
        // XPath search for modal with "Export As" text
        try {
          const modals = await (page as any).$x('//div[contains(translate(text(), "EXPORT AS", "export as"), "export as")]');
          if (modals && modals.length > 0) {
            modal = modals[0];
            console.log("   ✅ Export modal found (XPath)");
          }
        } catch (e) {
          // Ignore
        }
      }

      if (modal) {
        console.log("   ⚙️  Configuring Export modal...");

        // Set Rows Range 'to' field to 300
        console.log("   🔢 Entering 300 in Rows Range 'to' field...");
        try {
          // Method 1: Find input field next to "to" label (XPath)
          let toInput = null;
          try {
            const inputs = await (page as any).$x('//label[contains(text(), "to") or contains(text(), "To")]/following-sibling::input | //input[preceding-sibling::label[contains(text(), "to") or contains(text(), "To")]] | //input[following-sibling::label[contains(text(), "to") or contains(text(), "To")]]');
            if (inputs && inputs.length > 0) {
              // "to" field is usually the second input field
              toInput = inputs[inputs.length - 1];
              console.log("   ✅ 'to' input field found (XPath)");
            }
          } catch (e) {
            // Try next method
          }

          // Method 2: Find "to" field among all input fields
          if (!toInput) {
            try {
              const allInputs = await page.$$('input[type="text"], input[type="number"]');
              if (allInputs.length >= 2) {
                // Since there are "From" and "to" fields, the second one is "to"
                toInput = allInputs[allInputs.length - 1];
                console.log("   ✅ 'to' input field found (second input field)");
              }
            } catch (e) {
              // Try next method
            }
          }

          // Method 3: Find input field with value "300" (it might already be set)
          if (!toInput) {
            try {
              const inputs = await page.$$('input[value="300"]');
              if (inputs.length > 0) {
                toInput = inputs[0];
                console.log("   ✅ 'to' input field found (value=300)");
              }
            } catch (e) {
              // Try next method
            }
          }

          if (toInput) {
            // Clear existing value and type 300
            await toInput.click({ clickCount: 3 }); // Select all
            await new Promise((resolve) => setTimeout(resolve, 200));
            await toInput.type('300', { delay: 50 });
            await new Promise((resolve) => setTimeout(resolve, 30));
            console.log("   ✅ Rows Range 'to' field entry complete");
          } else {
            // Method 4: Attempt to click quick selection button "300"
            console.log("   🔍 Searching for quick selection button '300'...");
            try {
              // Find all clickable elements within modal
              const clickableElements = await modal.$$eval('button, a, span, div', (elements: Element[]) => {
                return elements
                  .map((el: Element, index: number) => ({
                    index,
                    text: el.textContent?.trim() || '',
                    tagName: el.tagName.toLowerCase(),
                  }))
                  .filter((el: { index: number; text: string; tagName: string }) => el.text === '1' && (el.tagName === 'button' || el.tagName === 'a' || el.tagName === 'span' || el.tagName === 'div'));
              });

              if (clickableElements.length > 0) {
                const elementIndex = clickableElements[0].index;
                const allElements = await modal.$$('button, a, span, div');
                if (allElements[elementIndex]) {
                  await allElements[elementIndex].click();
                  console.log("   ✅ Quick selection button '300' clicked");
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              } else {
                console.log("   ⚠️  'to' input field and quick selection button not found (using default)");
              }
            } catch (e) {
              console.log(`   ⚠️  Quick selection button click failed: ${e}`);
            }
          }
        } catch (e) {
          console.log(`   ⚠️  Rows Range setting failed (continuing): ${e}`);
        }

        // Search for and click Download button
        console.log("   🔍 Searching for Download button...");
        
        let downloadButton = null;

        // Method 1: Search for exact "Download" text among all page buttons
        try {
          const allButtons = await page.$$('button');
          console.log(`   📋 ${allButtons.length} button elements found on page`);
          
          for (const btn of allButtons) {
            const text = await btn.evaluate((el: Element) => el.textContent?.trim() || '');
            
            // Exact "Download" or "Download" included with short text
            if (text.toLowerCase() === 'download' || (text.toLowerCase().includes('download') && text.length < 300)) {
              // Verify button is visible
              const isVisible = await btn.evaluate((el: Element) => {
                const style = window.getComputedStyle(el as HTMLElement);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
              });
              
              if (isVisible) {
                downloadButton = btn;
                console.log(`   ✅ Download button found: "${text}"`);
                break;
              }
            }
          }
        } catch (e) {
          console.log(`   ⚠️  Button search failed: ${e}`);
        }

        // Method 2: Search within modal (if exists)
        if (!downloadButton && modal) {
          try {
            const modalButtons = await modal.$$('button');
            console.log(`   📋 ${modalButtons.length} button elements found within modal`);
            
            for (const btn of modalButtons) {
              const text = await btn.evaluate((el: Element) => el.textContent?.trim() || '');
              if (text.toLowerCase() === 'download' || text.toLowerCase().includes('download')) {
                downloadButton = btn;
                console.log(`   ✅ Download button found (within modal): "${text}"`);
                break;
              }
            }
          } catch (e) {
            console.log(`   ⚠️  Modal internal button search failed: ${e}`);
          }
        }

        // Method 3: XPath search for exact "Download"
        if (!downloadButton) {
          try {
            const buttons = await (page as any).$x('//button[normalize-space(translate(text(), "DOWNLOAD", "download"))="download"]');
            if (buttons && buttons.length > 0) {
              console.log(`   📋 ${buttons.length} Download buttons found via XPath`);
              
              // Find visible button
              for (const btn of buttons) {
                const isVisible = await btn.evaluate((el: Element) => {
                  const style = window.getComputedStyle(el as HTMLElement);
                  return style.display !== 'none' && style.visibility !== 'hidden';
                });
                
                if (isVisible) {
                  downloadButton = btn;
                  console.log("   ✅ Download button found (XPath)");
                  break;
                }
              }
            }
          } catch (e) {
            console.log(`   ⚠️  XPath search failed: ${e}`);
          }
        }

        // Method 4: Page-wide scan for all clickable elements
        if (!downloadButton) {
          try {
            const downloadElements = await page.evaluate(() => {
              const allElements = Array.from(document.querySelectorAll('button, a, div[role="button"], span[role="button"]'));
              return allElements
                .map((el, index) => {
                  const text = el.textContent?.trim() || '';
                  const isDownload = text.toLowerCase() === 'download';
                  const style = window.getComputedStyle(el);
                  const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                  
                  if (isDownload && isVisible) {
                    return { index, text, tagName: el.tagName };
                  }
                  return null;
                })
                .filter(el => el !== null);
            });

            if (downloadElements && downloadElements.length > 0) {
              console.log(`   📋 ${downloadElements.length} Download button candidates found:`);
              downloadElements.forEach((el: any, i: number) => {
                console.log(`      ${i + 1}. "${el.text}" (${el.tagName})`);
              });

              const firstElement = downloadElements[0];
              const allElements = await page.$$('button, a, div[role="button"], span[role="button"]');
              if (allElements[firstElement.index]) {
                downloadButton = allElements[firstElement.index];
                console.log(`   ✅ Download button selected: "${firstElement.text}"`);
              }
            }
          } catch (e) {
            console.log(`   ⚠️  Full scan failed: ${e}`);
          }
        }

        if (downloadButton) {
          // 🎯 Visual debugging: Highlight Download button with red border
          try {
            await page.evaluate((el: HTMLElement) => {
              el.style.border = "5px solid red";
              el.style.backgroundColor = "yellow";
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, downloadButton as any);
            console.log("   🎯 Targeted Download button with red border. Clicking in 1 second.");
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (e) {
            console.log(`   ⚠️  Visual display failed (continuing): ${e}`);
          }

          // Click Download button
          try {
            await (downloadButton as any).click({ delay: 100 });
            console.log("   ✅ Download button click complete");
          } catch (clickError) {
            console.log(`   ⚠️  Standard click failed, attempting JavaScript click...`);
            try {
              await downloadButton.evaluate((el: any) => el.click());
              console.log("   ✅ Download button click complete (JavaScript)");
            } catch (jsError) {
              console.error(`   ❌ Download button click failed: ${jsError}`);
              return false;
            }
          }

          // Wait for modal to close
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          console.log("   ⚠️  Download button not found");
          console.log("   📸 Saving modal screenshot...");
          const modalScreenshot = path.join(DOWNLOAD_DIR, `modal-${keyword.replace(/\s+/g, "-")}.png`);
          await page.screenshot({ path: modalScreenshot, fullPage: true });
          console.log(`   📸 Screenshot saved: ${modalScreenshot}`);
          
          // Attempt to close modal
          try {
            const closeButton = await page.$('button[aria-label*="close" i], button:has-text("×"), button:has-text("✕")');
            if (closeButton) {
              await closeButton.click();
            }
          } catch (e) {
            // Ignore
          }
          return false;
        }
      } else {
        console.log("   ⚠️  Export modal not found (attempting direct download)");
      }
    } catch (modalError) {
      console.log(`   ⚠️  Error during Export modal processing (continuing): ${modalError}`);
    }

    // Wait for download completion
    console.log("   ⏳ Waiting for download completion...");
    await new Promise((resolve) => setTimeout(resolve, 8000)); // Allow time for download

    // Verify downloaded file
    const filesAfter = fs.readdirSync(DOWNLOAD_DIR);
    const newFiles = filesAfter.filter((file) => !filesBefore.includes(file));

    if (newFiles.length > 0) {
      console.log(`   ✅ Download complete: ${newFiles.join(", ")}`);
      return true;
    } else {
      console.log(`   ⚠️  No new file downloaded.`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error processing keyword "${keyword}":`, error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🚀 Starting ImportKey Harvester\n");
  console.log(`📋 Keywords to process: ${KEYWORDS.length}`);
  console.log(`📁 Download path: ${DOWNLOAD_DIR}\n`);

  let browser: Browser | null = null;

  try {
    // Create browser
    browser = await createBrowser();
    const page = await browser.newPage();

    // Manual login mode: Navigate to ImportKey.com and give user time to log in
    console.log("🔐 Manual Login Mode");
    console.log("   Please log in manually once the browser opens.");
    console.log("   After logging in, return to this terminal...");
    
    await page.goto("https://importkey.com/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Give user time to log in (max 5 minutes)
    console.log("\n⏳ Waiting for login... (max 5 minutes)");
    console.log("   Please navigate to the dashboard or search page after logging in.");
    
    // Wait until URL changes from /login
    let waitTime = 0;
    const maxWaitTime = 300000; // 5 minutes
    const checkInterval = 2000; // Check every 2 seconds
    
    while (waitTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
      
      const currentUrl = page.url();
      if (!currentUrl.includes("/login")) {
        console.log(`\n✅ Login detected! (${Math.round(waitTime / 1000)}s elapsed)`);
        console.log(`   Current URL: ${currentUrl}`);
        break;
      }
      
      // Progress display every 10 seconds
      if (waitTime % 10000 === 0) {
        console.log(`   ⏳ Waiting... (${Math.round(waitTime / 1000)}s elapsed)`);
      }
    }

    // Warn if still on the login page
    const finalUrl = page.url();
    if (finalUrl.includes("/login")) {
      console.log("\n⚠️  Warning: Still on the login page.");
      console.log("   Continuing automatically...");
    } else {
      console.log("✅ Login confirmed!");
    }

    // Process keywords
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < KEYWORDS.length; i++) {
      const keyword = KEYWORDS[i];
      const success = await harvestKeyword(page, keyword, i);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Brief wait before next keyword
      if (i < KEYWORDS.length - 1) {
        console.log("   ⏸️  Waiting before next keyword...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Result summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Harvest Complete!");
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📁 Download path: ${DOWNLOAD_DIR}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("\n❌ Fatal error occurred:", error);
    process.exit(1);
  } finally {
    // Close browser
    if (browser) {
      console.log("\n🔒 Closing browser...");
      await browser.close();
    }
  }
}

// Execute script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}

export { main };

