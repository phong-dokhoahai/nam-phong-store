export type MasterDataSource = "supabase" | "demo";

export type MasterDataKind = "categories" | "units" | "customers" | "suppliers";

export type MasterDataStatus = "all" | "active" | "inactive";

export type MasterDataRecord = {
  id: string;
  code: string;
  name: string;
  description: string;
  precision: number | null;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  taxCode: string;
  note: string;
  isActive: boolean;
  isProtected: boolean;
  updatedAt: string;
};

export type MasterDataFormValues = {
  code: string;
  name: string;
  description: string;
  precision: number;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  taxCode: string;
  note: string;
  isActive: boolean;
};

export type MasterDataPayload = {
  source: MasterDataSource;
  records: MasterDataRecord[];
};
