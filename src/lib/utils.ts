import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  format, 
  parseISO, 
  isValid, 
  getYear, 
  getMonth, 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  isSameYear, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay 
} from 'date-fns';
import type { IncomeEntry, ExpenseEntry } from './types';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return "Invalid Date";
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      console.warn("Invalid date string passed to formatDate:", dateString);
      return "Invalid Date";
    }
    return format(date, 'PPP'); // e.g., Jun 20th, 2023
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
};

export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(0);
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export const calculateTotal = (entries: Array<{ amount: number }>): number => {
  if (!Array.isArray(entries)) {
    return 0;
  }
  return entries.reduce((sum, entry) => sum + (typeof entry.amount === 'number' ? entry.amount : 0), 0);
};

export const filterTransactionsByPeriod = (
  transactions: Array<IncomeEntry | ExpenseEntry>,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly',
  referenceDate: Date
): Array<IncomeEntry | ExpenseEntry> => {
  if (!Array.isArray(transactions) || !referenceDate || !isValid(referenceDate)) {
    return [];
  }

  return transactions.filter(transaction => {
    if (!transaction || !transaction.date) return false;
    const transactionDate = parseISO(transaction.date);
    if (!isValid(transactionDate)) return false;

    switch (period) {
      case 'daily':
        return isSameDay(transactionDate, referenceDate);
      case 'weekly':
        return isSameWeek(transactionDate, referenceDate, { weekStartsOn: 1 }); // Monday as start of week
      case 'monthly':
        return isSameMonth(transactionDate, referenceDate);
      case 'yearly':
        return isSameYear(transactionDate, referenceDate);
      default:
        return false;
    }
  });
};

export const filterTransactionsByCustomRange = (
  transactions: Array<IncomeEntry | ExpenseEntry>,
  startDate: Date | null,
  endDate: Date | null
): Array<IncomeEntry | ExpenseEntry> => {
  if (!Array.isArray(transactions) || !startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
    return [];
  }
  const start = startOfDay(startDate);
  const end = endOfDay(endDate); // Use endOfDay to include all transactions on the end date

  return transactions.filter(transaction => {
    if (!transaction || !transaction.date) return false;
    const transactionDate = parseISO(transaction.date);
    if (!isValid(transactionDate)) return false;
    return transactionDate >= start && transactionDate <= end;
  });
};

export const filterTransactionsBySpecificMonth = (
  transactions: Array<IncomeEntry | ExpenseEntry>,
  monthDate: Date // A date object representing any day in the target month
): Array<IncomeEntry | ExpenseEntry> => {
  if (!Array.isArray(transactions) || !monthDate || !isValid(monthDate)) {
    return [];
  }
  const targetYear = getYear(monthDate);
  const targetMonth = getMonth(monthDate); // 0-indexed

  return transactions.filter(transaction => {
    if (!transaction || !transaction.date) return false;
    const transactionDate = parseISO(transaction.date);
    if (!isValid(transactionDate)) return false;
    return getYear(transactionDate) === targetYear && getMonth(transactionDate) === targetMonth;
  });
};

export const filterTransactionsBySpecificYear = (
  transactions: Array<IncomeEntry | ExpenseEntry>,
  yearDate: Date // A date object representing any day in the target year
): Array<IncomeEntry | ExpenseEntry> => {
  if (!Array.isArray(transactions) || !yearDate || !isValid(yearDate)) {
    return [];
  }
  const targetYear = getYear(yearDate);
  return transactions.filter(transaction => {
    if (!transaction || !transaction.date) return false;
    const transactionDate = parseISO(transaction.date);
    if (!isValid(transactionDate)) return false;
    return getYear(transactionDate) === targetYear;
  });
};

export const getUniqueMonthsWithData = (
  incomeEntries: IncomeEntry[],
  expenseEntries: ExpenseEntry[]
): string[] => {
  if (!Array.isArray(incomeEntries) || !Array.isArray(expenseEntries)) {
    return [];
  }
  const allTransactions = [...incomeEntries, ...expenseEntries];
  const months = new Set<string>();

  allTransactions.forEach(transaction => {
    if (transaction && transaction.date) {
      const date = parseISO(transaction.date);
      if (isValid(date)) {
        months.add(format(date, 'yyyy-MM'));
      }
    }
  });
  return Array.from(months).sort((a, b) => b.localeCompare(a));
};

export const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts or older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    console.warn('Clipboard copy failed:', err);
    return false;
  }
};
