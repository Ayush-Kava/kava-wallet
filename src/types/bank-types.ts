export interface CreateBankData {
  name: string;
  ifsc_prefix?: string;
}

export interface UpdateBankData {
  name?: string;
  ifsc_prefix?: string;
  is_active?: boolean;
}
