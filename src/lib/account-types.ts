export type AccountType = "wallet" | "bank" | "ncmc";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  isDefault?: boolean; // For quick selection
  isActive?: boolean; // Can be disabled without deleting
  createdAt: string;
  updatedAt: string;
}

export interface AccountFormValues {
  name: string;
  type: AccountType;
  isDefault?: boolean;
}

// Default accounts for new users
export const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "Cash Wallet",
    type: "wallet",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Bank Account",
    type: "bank",
    isDefault: true,
    isActive: true,
  },
  {
    name: "NCMC Card",
    type: "ncmc",
    isDefault: true,
    isActive: true,
  },
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  wallet: "Wallet",
  bank: "Bank Account",
  ncmc: "NCMC Card",
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  wallet: "💰",
  bank: "🏦",
  ncmc: "💳",
};