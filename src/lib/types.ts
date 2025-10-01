export type TransactionSource = "wallet" | "bank" | "NCMC";

// New account-based transaction source
export type AccountTransactionSource = string; // Account ID

export type DebtType = "lent" | "borrowed"; // Money lent to others or borrowed from others
export type DebtStatus = "pending" | "settled";

export interface IncomeEntry {
  id: string;
  amount: number;
  source: TransactionSource;
  accountId?: string; // New: specific account ID
  subcategory?: string;
  description?: string;
  descriptions?: string[]; // Multiple descriptions
  date: string; // ISO string
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  category: string;
  subcategory?: string;
  description?: string;
  descriptions?: string[]; // Multiple descriptions
  date: string; // ISO string
  source: TransactionSource;
  accountId?: string; // New: specific account ID
}

export interface TransferEntry {
  id: string;
  amount: number;
  fromSource: TransactionSource;
  toSource: TransactionSource;
  fromAccountId?: string; // New: specific from account ID
  toAccountId?: string; // New: specific to account ID
  date: string; // ISO string
  description?: string;
  descriptions?: string[]; // Multiple descriptions
}

export interface DebtEntry {
  id: string;
  amount: number; // Original amount
  type: DebtType; // "lent" or "borrowed"
  personName: string; // Name of the person
  source: TransactionSource; // Which account the money came from/went to
  accountId?: string; // New: specific account ID
  date: string; // ISO string
  dueDate?: string; // Optional due date
  status: DebtStatus; // "pending" or "settled"
  settledDate?: string; // Date when debt was fully settled
  settledAmount?: number; // Amount settled so far (for partial settlements)
  descriptions?: string[]; // Multiple descriptions
}

export interface ExpenseFormValuesAsDate {
  amount: number;
  category: string;
  subcategory?: string;
  descriptions?: string[]; // Multiple descriptions
  date: Date;
  source: TransactionSource;
  accountId?: string; // New: specific account ID
}

export interface IncomeFormValuesAsDate {
  amount: number;
  source: TransactionSource;
  accountId?: string; // New: specific account ID
  subcategory?: string;
  descriptions?: string[]; // Multiple descriptions
  date: Date;
}

export interface TransferFormValuesAsDate {
  amount: number;
  fromSource: TransactionSource;
  toSource: TransactionSource;
  fromAccountId?: string; // New: specific from account ID
  toAccountId?: string; // New: specific to account ID
  date: Date;
  descriptions?: string[]; // Multiple descriptions
}

export interface DebtFormValuesAsDate {
  amount: number;
  type: DebtType;
  personName: string;
  source: TransactionSource;
  accountId?: string; // New: specific account ID
  date: Date;
  dueDate?: Date;
  descriptions?: string[];
}


export type TransactionType = 'income' | 'expense' | 'transfer' | 'debt';

export type Transaction = IncomeEntry | ExpenseEntry | TransferEntry | DebtEntry;

export type TransactionCardProps = {
  transaction: IncomeEntry | ExpenseEntry | TransferEntry | DebtEntry;
  type: TransactionType;
  onDateClick?: (date: string, type: TransactionType) => void;
};

export type TransactionListGroupByOption = 'none' | 'source' | 'category' | 'subcategory';


export interface TransactionListProps {
  transactions: Array<IncomeEntry | ExpenseEntry | TransferEntry | DebtEntry>;
  type: TransactionType;
  groupBy?: TransactionListGroupByOption;
  sortOption?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
  onDateClick?: (date: string, type: TransactionType) => void;
}

export interface ChartComponentProps {
  onDateClick?: (date: string, type: TransactionType) => void;
}

export interface ExpenseCategoryPieChartProps extends ChartComponentProps {
  expenses: ExpenseEntry[];
  title: string;
  chartMode?: 'category' | 'subcategory';
  onCategoryClick?: (categoryName: string) => void;
  parentCategoryForSubcharts?: string;
  onBackToCategoriesClick?: () => void;
}

export interface IncomeSourcePieChartProps extends ChartComponentProps {
  income: IncomeEntry[];
  title: string;
}

export interface ExpenseCategoryBarChartProps extends ChartComponentProps {
  expenses: ExpenseEntry[];
  title: string;
  chartMode?: 'category' | 'subcategory';
  onCategoryClick?: (categoryName: string) => void;
  parentCategoryForSubcharts?: string;
  onBackToCategoriesClick?: () => void;
}

export interface IncomeSourceBarChartProps extends ChartComponentProps {
  income: IncomeEntry[];
  title: string;
}
