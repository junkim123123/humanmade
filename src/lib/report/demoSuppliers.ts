/**
 * Demo supplier matches for sample report
 * Ensures factory list always appears in /sample-report/v2
 */

export const DEMO_SUPPLIER_MATCHES = [
  {
    id: "demo-shanghai-1",
    supplierId: "demo-shanghai-1",
    supplier_id: "demo-shanghai-1",
    supplierName: "Shanghai Confectionery",
    supplier_name: "Shanghai Confectionery",
    exact_match_count: 3,
    inferred_match_count: 12,
    _intel: { product_count: 45, price_coverage_pct: 78, last_seen_days: 12 },
    _profile: {
      country: "CN",
      last_seen_date: "2025-12-20",
      shipment_count_12m: 18,
      role: "Manufacturer",
      role_reason: "Ships candy SKUs with consistent exporter identity"
    },
    _supplierType: "Factory",
    _companyType: "Manufacturer",
    _exampleProducts: [
      { product_name: "Fruit gummies variety pack", category: "confectionery", unit_price: 1.08 },
      { product_name: "Gummy bears 1lb bag", category: "confectionery", unit_price: 0.95 }
    ]
  },
  {
    id: "demo-guangzhou-2",
    supplierId: "demo-guangzhou-2",
    supplier_id: "demo-guangzhou-2",
    supplierName: "Guangzhou Sweet",
    supplier_name: "Guangzhou Sweet",
    exact_match_count: 1,
    inferred_match_count: 9,
    _intel: { product_count: 28, price_coverage_pct: 65, last_seen_days: 22 },
    _profile: {
      country: "CN",
      last_seen_date: "2025-12-10",
      shipment_count_12m: 11,
      role: "Manufacturer",
      role_reason: "Multiple confectionery HS records and repeat consignees"
    },
    _supplierType: "Factory",
    _companyType: "Manufacturer",
    _exampleProducts: [
      { product_name: "Sour belts assorted", category: "confectionery", unit_price: 1.12 }
    ]
  },
  {
    id: "demo-shenzhen-3",
    supplierId: "demo-shenzhen-3",
    supplier_id: "demo-shenzhen-3",
    supplierName: "Shenzhen Candy",
    supplier_name: "Shenzhen Candy",
    exact_match_count: 0,
    inferred_match_count: 6,
    _intel: { product_count: 15, price_coverage_pct: 45, last_seen_days: 40 },
    _profile: {
      country: "CN",
      last_seen_date: "2025-11-24",
      shipment_count_12m: 7,
      role: "Manufacturer",
      role_reason: "Smaller factory footprint but consistent shipments"
    },
    _supplierType: "Factory",
    _companyType: "Manufacturer",
    _exampleProducts: []
  }
];

