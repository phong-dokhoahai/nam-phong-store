import { demoMaterials } from "@/components/materials/materialsFixtures";
import type {
  StockReceipt,
  StockReceiptMaterialLookup,
  StockReceiptSupplierLookup,
} from "./types";

export const demoStockReceiptSuppliers: StockReceiptSupplierLookup[] = [
  {
    id: "supplier-viet-cement",
    code: "NCC-XM-VIET",
    name: "Viet Cement Supply",
  },
  {
    id: "supplier-steel-saigon",
    code: "NCC-THEP-SG",
    name: "Saigon Steel Depot",
  },
];

export const demoStockReceiptMaterials: StockReceiptMaterialLookup[] =
  demoMaterials
    .filter((material) => material.isActive)
    .map((material) => ({
      id: material.id,
      sku: material.sku,
      name: material.name,
      unitName: material.unitName,
      currentStock: material.currentStock,
      defaultPurchasePrice: material.defaultPurchasePrice,
    }));

export const demoStockReceipts: StockReceipt[] = [
  {
    id: "receipt-demo-draft",
    code: "PN-DEMO-0001",
    supplierId: "supplier-viet-cement",
    supplierName: "Viet Cement Supply",
    receiptDate: "2026-10-06",
    status: "DRAFT",
    subtotal: 7800000,
    discountAmount: 0,
    shippingFee: 250000,
    taxAmount: 0,
    totalAmount: 8050000,
    paidAmount: 0,
    debtAmount: 8050000,
    paymentStatus: "UNPAID",
    supplierInvoiceNumber: "INV-DEMO-01",
    note: "Demo draft receipt.",
    updatedAt: "2026-10-06T04:00:00.000Z",
    lines: [
      {
        id: "receipt-demo-line-cement",
        materialId: "mat-cement-pcb40",
        materialSku: "XM-PCB40",
        materialName: "PCB40 Cement",
        unitName: "Bag",
        quantity: 100,
        unitPrice: 78000,
        discountAmount: 0,
        lineTotal: 7800000,
      },
    ],
  },
];
