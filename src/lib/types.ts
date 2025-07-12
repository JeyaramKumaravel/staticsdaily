export type TransactionSource = "wallet" | "bank" | "NCMC";

export interface IncomeEntry {
  id: string;
  amount: number;
  source: TransactionSource;
  subcategory?: string;
  description?: string;
  date: string; // ISO string
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  category: string;
  subcategory?: string;
  description?: string;
  date: string; // ISO string
  source: TransactionSource;
}

export interface TransferEntry {
  id: string;
  amount: number;
  fromSource: TransactionSource;
  toSource: TransactionSource;
  date: string; // ISO string
  description?: string;
}

export interface ExpenseFormValuesAsDate {
  amount: number;
  category: string;
  subcategory?: string;
  description?: string;
  date: Date;
  source: TransactionSource;
}

export interface IncomeFormValuesAsDate {
  amount: number;
  source: TransactionSource;
  subcategory?: string;
  description?: string;
  date: Date;
}

export interface TransferFormValuesAsDate {
  amount: number;
  fromSource: TransactionSource;
  toSource: TransactionSource;
  date: Date;
  description?: string;
}


export type TransactionType = 'income' | 'expense' | 'transfer';

export type Transaction = IncomeEntry | ExpenseEntry | TransferEntry;

export type TransactionCardProps = {
  transaction: IncomeEntry | ExpenseEntry | TransferEntry;
  type: TransactionType;
  onDateClick?: (date: string, type: TransactionType) => void;
};

export type TransactionListGroupByOption = 'none' | 'source' | 'category' | 'subcategory';


export interface TransactionListProps {
  transactions: Array<IncomeEntry | ExpenseEntry | TransferEntry>;
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
