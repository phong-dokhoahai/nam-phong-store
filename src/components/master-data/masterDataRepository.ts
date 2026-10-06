import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type {
  MasterDataFormValues,
  MasterDataKind,
  MasterDataPayload,
  MasterDataRecord,
} from "./types";

type CategoryRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  updated_at: string;
};

type UnitRow = {
  id: string;
  code: string;
  name: string;
  precision: number | null;
  is_active: boolean;
  updated_at: string;
};

type CustomerRow = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_code: string | null;
  note: string | null;
  is_active: boolean;
  updated_at: string;
};

type SupplierRow = {
  id: string;
  code: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_code: string | null;
  note: string | null;
  is_active: boolean;
  updated_at: string;
};

const demoCategories: MasterDataRecord[] = [
  {
    id: "cat-cement",
    code: "CEMENT",
    name: "Cement",
    description: "Bagged cement and cement-based binders.",
    precision: null,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "cat-steel",
    code: "STEEL",
    name: "Steel",
    description: "Rebar, shaped steel, and structural steel.",
    precision: null,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "cat-aggregate",
    code: "AGG",
    name: "Sand & Stone",
    description: "Sand, gravel, crushed stone, and aggregates.",
    precision: null,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "cat-brick",
    code: "BRICK",
    name: "Brick",
    description: "Masonry bricks and block materials.",
    precision: null,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
    isActive: false,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
];

const demoUnits: MasterDataRecord[] = [
  {
    id: "unit-bag",
    code: "BAG",
    name: "Bag",
    description: "",
    precision: 0,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "unit-kg",
    code: "KG",
    name: "Kilogram",
    description: "",
    precision: 3,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "unit-m3",
    code: "M3",
    name: "Cubic meter",
    description: "",
    precision: 3,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "unit-piece",
    code: "PCS",
    name: "Piece",
    description: "",
    precision: 0,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
    isActive: false,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
];

const demoCustomers: MasterDataRecord[] = [
  {
    id: "customer-walk-in",
    code: "WALK_IN_CUSTOMER",
    name: "Walk-in Customer",
    description: "",
    precision: null,
    contactName: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "System customer for retail sales without a named customer.",
    isActive: true,
    isProtected: true,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "customer-minh-long",
    code: "KH-MINH-LONG",
    name: "Minh Long Construction",
    description: "",
    precision: null,
    contactName: "",
    phone: "0901 234 567",
    email: "purchasing@minhlong.example",
    address: "District 7, Ho Chi Minh City",
    taxCode: "0312345678",
    note: "Regular contractor account.",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "customer-an-phat",
    code: "KH-AN-PHAT",
    name: "An Phat Build",
    description: "",
    precision: null,
    contactName: "",
    phone: "0918 888 222",
    email: "",
    address: "Thu Duc City",
    taxCode: "",
    note: "",
    isActive: false,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
];

const demoSuppliers: MasterDataRecord[] = [
  {
    id: "supplier-viet-cement",
    code: "NCC-XM-VIET",
    name: "Viet Cement Supply",
    description: "",
    precision: null,
    contactName: "Nguyen Van Minh",
    phone: "028 3456 7890",
    email: "sales@vietcement.example",
    address: "Binh Chanh, Ho Chi Minh City",
    taxCode: "0300001111",
    note: "Main cement supplier.",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
  {
    id: "supplier-steel-saigon",
    code: "NCC-THEP-SG",
    name: "Saigon Steel Depot",
    description: "",
    precision: null,
    contactName: "Tran Thi Lan",
    phone: "0909 456 123",
    email: "",
    address: "District 12, Ho Chi Minh City",
    taxCode: "",
    note: "",
    isActive: true,
    isProtected: false,
    updatedAt: "2026-09-18T04:00:00.000Z",
  },
];

const categorySelect = "id, code, name, description, is_active, updated_at";
const unitSelect = "id, code, name, precision, is_active, updated_at";
const customerSelect =
  "id, code, name, phone, email, address, tax_code, note, is_active, updated_at";
const supplierSelect =
  "id, code, name, contact_name, phone, email, address, tax_code, note, is_active, updated_at";

const toCategoryRecord = (row: CategoryRow): MasterDataRecord => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: row.description || "",
  precision: null,
  contactName: "",
  phone: "",
  email: "",
  address: "",
  taxCode: "",
  note: "",
  isActive: row.is_active,
  isProtected: false,
  updatedAt: row.updated_at,
});

const toUnitRecord = (row: UnitRow): MasterDataRecord => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: "",
  precision: Number(row.precision || 0),
  contactName: "",
  phone: "",
  email: "",
  address: "",
  taxCode: "",
  note: "",
  isActive: row.is_active,
  isProtected: false,
  updatedAt: row.updated_at,
});

const toCustomerRecord = (row: CustomerRow): MasterDataRecord => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: "",
  precision: null,
  contactName: "",
  phone: row.phone || "",
  email: row.email || "",
  address: row.address || "",
  taxCode: row.tax_code || "",
  note: row.note || "",
  isActive: row.is_active,
  isProtected: row.code === "WALK_IN_CUSTOMER",
  updatedAt: row.updated_at,
});

const toSupplierRecord = (row: SupplierRow): MasterDataRecord => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: "",
  precision: null,
  contactName: row.contact_name || "",
  phone: row.phone || "",
  email: row.email || "",
  address: row.address || "",
  taxCode: row.tax_code || "",
  note: row.note || "",
  isActive: row.is_active,
  isProtected: false,
  updatedAt: row.updated_at,
});

const getDemoRecords = (kind: MasterDataKind) => {
  if (kind === "categories") return demoCategories;
  if (kind === "units") return demoUnits;
  if (kind === "customers") return demoCustomers;
  return demoSuppliers;
};

const newDemoId = (kind: MasterDataKind) =>
  `${kind}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

export const isMasterDataBackendAvailable = () =>
  isSupabaseConfigured && Boolean(supabase);

export const fetchMasterData = async (
  kind: MasterDataKind,
): Promise<MasterDataPayload> => {
  if (!isMasterDataBackendAvailable() || !supabase) {
    return {
      source: "demo",
      records: getDemoRecords(kind),
    };
  }

  if (kind === "categories") {
    const { data, error } = await supabase
      .from("categories")
      .select(categorySelect)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      source: "supabase",
      records: ((data || []) as CategoryRow[]).map(toCategoryRecord),
    };
  }

  if (kind === "units") {
    const { data, error } = await supabase
      .from("units")
      .select(unitSelect)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      source: "supabase",
      records: ((data || []) as UnitRow[]).map(toUnitRecord),
    };
  }

  if (kind === "customers") {
    const { data, error } = await supabase
      .from("customers")
      .select(customerSelect)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      source: "supabase",
      records: ((data || []) as CustomerRow[]).map(toCustomerRecord),
    };
  }

  const { data, error } = await supabase
    .from("suppliers")
    .select(supplierSelect)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return {
    source: "supabase",
    records: ((data || []) as SupplierRow[]).map(toSupplierRecord),
  };
};

export const createDemoMasterDataRecord = (
  kind: MasterDataKind,
  values: MasterDataFormValues,
  existing?: MasterDataRecord,
): MasterDataRecord => ({
  id: existing?.id || newDemoId(kind),
  code: values.code.trim().toUpperCase(),
  name: values.name.trim(),
  description: kind === "categories" ? values.description.trim() : "",
  precision: kind === "units" ? values.precision : null,
  contactName: kind === "suppliers" ? values.contactName.trim() : "",
  phone: values.phone.trim(),
  email: values.email.trim(),
  address: values.address.trim(),
  taxCode: values.taxCode.trim(),
  note: values.note.trim(),
  isActive: values.isActive,
  isProtected: existing?.isProtected || false,
  updatedAt: new Date().toISOString(),
});

export const createMasterData = async (
  kind: MasterDataKind,
  values: MasterDataFormValues,
) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  if (kind === "categories") {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description.trim() || null,
        is_active: values.isActive,
      })
      .select(categorySelect)
      .single();

    if (error) throw new Error(error.message);
    return toCategoryRecord(data as CategoryRow);
  }

  if (kind === "units") {
    const { data, error } = await supabase
      .from("units")
      .insert({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        precision: values.precision,
        is_active: values.isActive,
      })
      .select(unitSelect)
      .single();

    if (error) throw new Error(error.message);
    return toUnitRecord(data as UnitRow);
  }

  if (kind === "customers") {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        address: values.address.trim() || null,
        tax_code: values.taxCode.trim() || null,
        note: values.note.trim() || null,
        is_active: values.isActive,
      })
      .select(customerSelect)
      .single();

    if (error) throw new Error(error.message);
    return toCustomerRecord(data as CustomerRow);
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      contact_name: values.contactName.trim() || null,
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      address: values.address.trim() || null,
      tax_code: values.taxCode.trim() || null,
      note: values.note.trim() || null,
      is_active: values.isActive,
    })
    .select(supplierSelect)
    .single();

  if (error) throw new Error(error.message);
  return toSupplierRecord(data as SupplierRow);
};

export const updateMasterData = async (
  kind: MasterDataKind,
  id: string,
  values: MasterDataFormValues,
) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  if (kind === "categories") {
    const { data, error } = await supabase
      .from("categories")
      .update({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description.trim() || null,
        is_active: values.isActive,
      })
      .eq("id", id)
      .select(categorySelect)
      .single();

    if (error) throw new Error(error.message);
    return toCategoryRecord(data as CategoryRow);
  }

  if (kind === "units") {
    const { data, error } = await supabase
      .from("units")
      .update({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        precision: values.precision,
        is_active: values.isActive,
      })
      .eq("id", id)
      .select(unitSelect)
      .single();

    if (error) throw new Error(error.message);
    return toUnitRecord(data as UnitRow);
  }

  if (kind === "customers") {
    const { data, error } = await supabase
      .from("customers")
      .update({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        address: values.address.trim() || null,
        tax_code: values.taxCode.trim() || null,
        note: values.note.trim() || null,
        is_active: values.isActive,
      })
      .eq("id", id)
      .select(customerSelect)
      .single();

    if (error) throw new Error(error.message);
    return toCustomerRecord(data as CustomerRow);
  }

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      contact_name: values.contactName.trim() || null,
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      address: values.address.trim() || null,
      tax_code: values.taxCode.trim() || null,
      note: values.note.trim() || null,
      is_active: values.isActive,
    })
    .eq("id", id)
    .select(supplierSelect)
    .single();

  if (error) throw new Error(error.message);
  return toSupplierRecord(data as SupplierRow);
};

export const deactivateMasterData = async (
  kind: MasterDataKind,
  id: string,
) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  if (kind === "categories") {
    const { data, error } = await supabase
      .from("categories")
      .update({ is_active: false })
      .eq("id", id)
      .select(categorySelect)
      .single();

    if (error) throw new Error(error.message);
    return toCategoryRecord(data as CategoryRow);
  }

  if (kind === "units") {
    const { data, error } = await supabase
      .from("units")
      .update({ is_active: false })
      .eq("id", id)
      .select(unitSelect)
      .single();

    if (error) throw new Error(error.message);
    return toUnitRecord(data as UnitRow);
  }

  if (kind === "customers") {
    const { data, error } = await supabase
      .from("customers")
      .update({ is_active: false })
      .eq("id", id)
      .neq("code", "WALK_IN_CUSTOMER")
      .select(customerSelect)
      .single();

    if (error) throw new Error(error.message);
    return toCustomerRecord(data as CustomerRow);
  }

  const { data, error } = await supabase
    .from("suppliers")
    .update({ is_active: false })
    .eq("id", id)
    .select(supplierSelect)
    .single();

  if (error) throw new Error(error.message);
  return toSupplierRecord(data as SupplierRow);
};
