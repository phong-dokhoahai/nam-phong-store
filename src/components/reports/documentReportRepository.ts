import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { fetchAllRows } from "./reportsRepository";
import type {
  DocumentReportFilters,
  DocumentReportKind,
  DocumentReportLookups,
  DocumentReportRow,
  DocumentStatus,
} from "./types";

type Relation<T> = T | T[] | null;

const one = <T>(value: Relation<T> | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
};

type ItemRow = {
  material_id: string;
  material_name_snapshot: string | null;
  material_sku_snapshot: string | null;
  unit_name_snapshot: string | null;
  quantity: number | string;
  line_total: number | string;
  materials?: Relation<{ name: string; sku: string }>;
};

type DocumentRow = {
  id: string;
  code: string;
  receipt_date?: string;
  sale_date?: string;
  status: DocumentStatus;
  total_amount: number | string;
  party?: Relation<{ code: string; name: string }>;
  creator?: Relation<{ full_name: string }>;
  items?: ItemRow[];
};

const config = {
  purchase: {
    table: "purchase_receipts",
    dateColumn: "receipt_date",
    partyColumn: "supplier_id",
    partyTable: "suppliers",
    itemsTable: "purchase_receipt_items",
  },
  sales: {
    table: "sales_orders",
    dateColumn: "sale_date",
    partyColumn: "customer_id",
    partyTable: "customers",
    itemsTable: "sales_order_items",
  },
} as const;

const itemColumns = `
  material_id,
  material_name_snapshot,
  material_sku_snapshot,
  unit_name_snapshot,
  quantity,
  line_total,
  materials ( name, sku )
`;

// Item names come from the snapshot taken on the document (BR 73: reports
// must not be rebuilt from current master data); fall back for old rows.
const toRow = (
  row: DocumentRow,
  kind: DocumentReportKind,
): DocumentReportRow => {
  const party = one(row.party);

  return {
    id: row.id,
    code: row.code,
    date: (kind === "purchase" ? row.receipt_date : row.sale_date) || "",
    status: row.status,
    partyName: party ? `${party.name} (${party.code})` : "",
    creatorName: one(row.creator)?.full_name ?? null,
    totalAmount: Number(row.total_amount),
    items: (row.items || []).map((item) => {
      const material = one(item.materials);
      return {
        materialId: item.material_id,
        materialName: item.material_name_snapshot || material?.name || "",
        materialSku: item.material_sku_snapshot || material?.sku || "",
        unitName: item.unit_name_snapshot || "",
        quantity: Number(item.quantity),
        lineTotal: Number(item.line_total),
      };
    }),
  };
};

export const fetchDocumentReport = async (
  kind: DocumentReportKind,
  filters: DocumentReportFilters,
): Promise<DocumentReportRow[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const client = supabase;
  const c = config[kind];

  // `!inner` turns the material filter into "documents containing this
  // material" while still returning only that material's lines.
  const itemsEmbed = filters.materialId
    ? `items:${c.itemsTable}!inner(${itemColumns})`
    : `items:${c.itemsTable}(${itemColumns})`;
  const select = `
    id,
    code,
    ${c.dateColumn},
    status,
    total_amount,
    party:${c.partyTable} ( code, name ),
    creator:profiles!${c.table}_created_by_fkey ( full_name ),
    ${itemsEmbed}
  `;

  const rows = await fetchAllRows<DocumentRow>((start, end) => {
    let query = client
      .from(c.table)
      .select(select)
      .gte(c.dateColumn, filters.from)
      .lte(c.dateColumn, filters.to);

    if (filters.status !== "all") query = query.eq("status", filters.status);
    if (filters.partyId) query = query.eq(c.partyColumn, filters.partyId);
    if (filters.creatorId) query = query.eq("created_by", filters.creatorId);
    if (filters.materialId) {
      query = query.eq("items.material_id", filters.materialId);
    }

    return query
      .order(c.dateColumn, { ascending: true })
      .order("code", { ascending: true })
      .range(start, end);
  });

  return rows.map((row) => toRow(row, kind));
};

export const fetchDocumentReportLookups = async (
  kind: DocumentReportKind,
): Promise<DocumentReportLookups> => {
  if (!isSupabaseConfigured || !supabase) {
    return { parties: [], materials: [], creators: [] };
  }

  const [parties, materials, creators] = await Promise.all([
    supabase
      .from(config[kind].partyTable)
      .select("id, code, name")
      .order("name", { ascending: true }),
    supabase
      .from("materials")
      .select("id, sku, name")
      .order("name", { ascending: true }),
    // RLS: admins see every profile, staff only themselves.
    supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name", { ascending: true }),
  ]);

  const error = parties.error || materials.error || creators.error;
  if (error) throw new Error(error.message);

  return {
    parties: (parties.data || []).map((row) => ({
      id: row.id,
      label: `${row.name} (${row.code})`,
    })),
    materials: (materials.data || []).map((row) => ({
      id: row.id,
      label: `${row.name} (${row.sku})`,
    })),
    creators: (creators.data || []).map((row) => ({
      id: row.id,
      label: row.full_name,
    })),
  };
};
