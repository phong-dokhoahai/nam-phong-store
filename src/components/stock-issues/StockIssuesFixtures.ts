import { demoMaterials } from "@/components/materials/materialsFixtures";
import type {
  StockIssue,
  StockIssueCustomerLookup,
  StockIssueMaterialLookup,
} from "./types";

export const demoStockIssueCustomers: StockIssueCustomerLookup[] = [
  {
    id: "customer-minh-long",
    code: "KH-MINH-LONG",
    name: "Minh Long Construction",
  },
  {
    id: "customer-walk-in",
    code: "WALK_IN_CUSTOMER",
    name: "Walk-in Customer",
  },
];

export const demoStockIssueMaterials: StockIssueMaterialLookup[] =
  demoMaterials
    .filter((material) => material.isActive)
    .map((material) => ({
      id: material.id,
      sku: material.sku,
      name: material.name,
      unitName: material.unitName,
      currentStock: material.currentStock,
      defaultSalePrice: material.defaultSalePrice,
    }));

export const demoStockIssues: StockIssue[] = [
  {
    id: "issue-demo-draft",
    code: "BH-DEMO-0001",
    customerId: "customer-minh-long",
    customerName: "Minh Long Construction",
    issueDate: "2026-10-06",
    status: "DRAFT",
    subtotal: 9200000,
    discountAmount: 0,
    shippingFee: 0,
    taxAmount: 0,
    totalAmount: 9200000,
    paidAmount: 0,
    debtAmount: 9200000,
    paymentStatus: "UNPAID",
    deliveryAddress: "District 1 jobsite",
    note: "Demo draft issue.",
    updatedAt: "2026-10-06T04:30:00.000Z",
    lines: [
      {
        id: "issue-demo-line-cement",
        materialId: "mat-cement-pcb40",
        materialSku: "XM-PCB40",
        materialName: "PCB40 Cement",
        unitName: "Bag",
        quantity: 80,
        unitPrice: 115000,
        discountAmount: 0,
        lineTotal: 9200000,
      },
    ],
  },
];
