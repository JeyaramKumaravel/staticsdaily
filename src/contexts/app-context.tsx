"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { IncomeEntry, ExpenseEntry, TransferEntry, DebtEntry, ExpenseFormValuesAsDate, IncomeFormValuesAsDate, TransferFormValuesAsDate, DebtFormValuesAsDate } from '@/lib/types';
import useLocalStorageState from '@/hooks/use-local-storage-state';
import { useToast } from "@/hooks/use-toast";
import { isValid, parseISO } from 'date-fns';

// Fallback UUID generator for browsers that don't support crypto.randomUUID
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface AppContextType {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  transferEntries: TransferEntry[];
  debtEntries: DebtEntry[];
  addIncome: (entry: IncomeFormValuesAsDate) => void;
  deleteIncome: (id: string) => void;
  updateIncome: (id: string, data: IncomeFormValuesAsDate) => void;
  replaceAllIncome: (entries: IncomeEntry[]) => void;
  addExpense: (entry: ExpenseFormValuesAsDate) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (id: string, data: ExpenseFormValuesAsDate) => void;
  replaceAllExpenses: (entries: ExpenseEntry[]) => void;
  addTransfer: (entry: TransferFormValuesAsDate) => void;
  deleteTransfer: (id: string) => void;
  updateTransfer: (id: string, data: TransferFormValuesAsDate) => void;
  replaceAllTransfers: (entries: TransferEntry[]) => void;
  addDebt: (entry: DebtFormValuesAsDate) => void;
  deleteDebt: (id: string) => void;
  updateDebt: (id: string, data: DebtFormValuesAsDate) => void;
  settleDebt: (id: string) => void;
  partialSettleDebt: (id: string, amount: number, description?: string) => void;
  replaceAllDebts: (entries: DebtEntry[]) => void;
  walletBalance: number;
  bankBalance: number;
  ncmcBalance: number;
  getAccountBalance: (accountId: string) => number;
  pendingDebtsLent: DebtEntry[];
  pendingDebtsBorrowed: DebtEntry[];
  totalPendingLent: number;
  totalPendingBorrowed: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sortByDateDesc = <T extends { date: string }>(a: T, b: T) => {
  try {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    if (!isValid(dateA) || !isValid(dateB)) return 0;
    return dateB.getTime() - dateA.getTime();
  } catch (e) {
    console.error("Error parsing dates for sort", a, b, e);
    return 0;
  }
};

// Utility to calculate balance for a given source (legacy)
function calculateSourceBalance(
  source: 'wallet' | 'bank' | 'NCMC',
  incomeEntries: IncomeEntry[],
  expenseEntries: ExpenseEntry[],
  transferEntries: TransferEntry[],
  debtEntries: DebtEntry[]
) {
  // Start with all income for this source
  let balance = incomeEntries.filter(e => e.source === source).reduce((sum, e) => sum + e.amount, 0);
  // Subtract all expenses for this source
  balance -= expenseEntries.filter(e => e.source === source).reduce((sum, e) => sum + e.amount, 0);
  // Add/subtract transfers
  transferEntries.forEach(t => {
    if (t.fromSource === source) balance -= t.amount;
    if (t.toSource === source) balance += t.amount;
  });
  // Add/subtract debt transactions
  debtEntries.forEach(d => {
    if (d.source === source) {
      if (d.type === 'lent') {
        // When you lend money, it goes out of your account
        balance -= d.amount;
      } else if (d.type === 'borrowed') {
        // When you borrow money, it comes into your account
        balance += d.amount;
      }
    }
  });
  return balance;
}

// New utility to calculate balance for a specific account
function calculateAccountBalance(
  accountId: string,
  incomeEntries: IncomeEntry[],
  expenseEntries: ExpenseEntry[],
  transferEntries: TransferEntry[],
  debtEntries: DebtEntry[]
) {
  // Start with all income for this account
  let balance = incomeEntries.filter(e => e.accountId === accountId).reduce((sum, e) => sum + e.amount, 0);
  // Subtract all expenses for this account
  balance -= expenseEntries.filter(e => e.accountId === accountId).reduce((sum, e) => sum + e.amount, 0);
  // Add/subtract transfers
  transferEntries.forEach(t => {
    if (t.fromAccountId === accountId) balance -= t.amount;
    if (t.toAccountId === accountId) balance += t.amount;
  });
  // Add/subtract debt transactions
  debtEntries.forEach(d => {
    if (d.accountId === accountId) {
      if (d.type === 'lent') {
        balance -= d.amount;
      } else if (d.type === 'borrowed') {
        balance += d.amount;
      }
    }
  });
  return balance;
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [incomeEntries, setIncomeEntries] = useLocalStorageState<IncomeEntry[]>('staticsdiary-income', []);
  const [expenseEntries, setExpenseEntries] = useLocalStorageState<ExpenseEntry[]>('staticsdiary-expenses', []);
  const [transferEntries, setTransferEntries] = useLocalStorageState<TransferEntry[]>('staticsdiary-transfers', []);
  const [debtEntries, setDebtEntries] = useLocalStorageState<DebtEntry[]>('staticsdiary-debts', []);
  const { toast } = useToast();

  const addIncome = (entryData: IncomeFormValuesAsDate) => {
    const newEntry: IncomeEntry = {
      ...entryData,
      id: generateUUID(),
      date: entryData.date.toISOString(),
      descriptions: entryData.descriptions || [],
    };
    setIncomeEntries((prev) => [...prev, newEntry].sort(sortByDateDesc));
    toast({ title: "Income added", description: `₹${entryData.amount} from ${entryData.source}.` });
  };

  const deleteIncome = (id: string) => {
    setIncomeEntries((prev) => prev.filter((entry) => entry.id !== id));
    toast({ title: "Income deleted", variant: "destructive" });
  };

  const updateIncome = (id: string, data: IncomeFormValuesAsDate) => {
    setIncomeEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...data,
              date: data.date.toISOString(),
              descriptions: data.descriptions || [],
            }
          : entry
      ).sort(sortByDateDesc)
    );
    toast({ title: "Income updated", description: `₹${data.amount} from ${data.source} has been updated.` });
  };

  const replaceAllIncome = (entries: IncomeEntry[]) => {
    const validEntries = entries.filter(entry =>
        typeof entry.id === 'string' &&
        typeof entry.amount === 'number' &&
        typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
        (entry.source === 'wallet' || entry.source === 'bank' || entry.source === 'NCMC')
    ).map(entry => ({...entry, date: parseISO(entry.date).toISOString()}));

    if (validEntries.length !== entries.length) {
        console.warn("Some imported income entries were invalid or had malformed dates and have been filtered/corrected.");
        toast({
          variant: "default",
          title: "Import Note",
          description: "Some income entries might have been filtered or corrected due to invalid data or date formats.",
        });
    }
    setIncomeEntries(validEntries.sort(sortByDateDesc));
  };


  const addExpense = (entryData: ExpenseFormValuesAsDate) => {
    const newEntry: ExpenseEntry = {
      id: generateUUID(),
      amount: entryData.amount,
      category: entryData.category,
      subcategory: entryData.subcategory || "",
      descriptions: entryData.descriptions || [],
      date: entryData.date.toISOString(),
      source: entryData.source,
    };
    setExpenseEntries((prev) => [...prev, newEntry].sort(sortByDateDesc));
    toast({ title: "Expense added", description: `₹${entryData.amount} for ${entryData.category} from ${entryData.source}.` });
  };

  const deleteExpense = (id: string) => {
    setExpenseEntries((prev) => prev.filter((entry) => entry.id !== id));
    toast({ title: "Expense deleted", variant: "destructive" });
  };

  const updateExpense = (id: string, data: ExpenseFormValuesAsDate) => {
    setExpenseEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              amount: data.amount,
              category: data.category,
              subcategory: data.subcategory || "",
              descriptions: data.descriptions || [],
              date: data.date.toISOString(),
              source: data.source,
            }
          : entry
      ).sort(sortByDateDesc)
    );
    toast({ title: "Expense updated", description: `₹${data.amount} for ${data.category} (from ${data.source}) has been updated.` });
  };

  const replaceAllExpenses = (entries: ExpenseEntry[]) => {
    const validEntries = entries.filter(entry =>
        typeof entry.id === 'string' &&
        typeof entry.amount === 'number' &&
        typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
        typeof entry.category === 'string' &&
        (entry.subcategory === undefined || typeof entry.subcategory === 'string') &&
        (entry.source === 'wallet' || entry.source === 'bank' || entry.source === 'NCMC')
    ).map(entry => ({
        ...entry,
        date: parseISO(entry.date).toISOString(),
        subcategory: entry.subcategory || "",
        source: entry.source,
    }));

     if (validEntries.length !== entries.length) {
        console.warn("Some imported expense entries were invalid or had malformed dates and have been filtered/corrected.");
        toast({
          variant: "default",
          title: "Import Note",
          description: "Some expense entries might have been filtered or corrected due to invalid data or date formats.",
        });
    }
    setExpenseEntries(validEntries.sort(sortByDateDesc));
  };

  const addTransfer = (entryData: TransferFormValuesAsDate) => {
    const newEntry: TransferEntry = {
      ...entryData,
      id: generateUUID(),
      date: entryData.date.toISOString(),
      descriptions: entryData.descriptions || [],
    };
    setTransferEntries((prev) => [...prev, newEntry].sort(sortByDateDesc));
    toast({ title: "Transfer recorded", description: `₹${entryData.amount} from ${entryData.fromSource} to ${entryData.toSource}.` });
  };

  const deleteTransfer = (id: string) => {
    setTransferEntries((prev) => prev.filter((entry) => entry.id !== id));
    toast({ title: "Transfer deleted", variant: "destructive" });
  };

  const updateTransfer = (id: string, data: TransferFormValuesAsDate) => {
    setTransferEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...data,
              date: data.date.toISOString(),
              descriptions: data.descriptions || [],
            }
          : entry
      ).sort(sortByDateDesc)
    );
    toast({ title: "Transfer updated" });
  };

  const replaceAllTransfers = (entries: TransferEntry[]) => {
     const validEntries = entries.filter(entry =>
        typeof entry.id === 'string' &&
        typeof entry.amount === 'number' &&
        typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
        (entry.fromSource === 'wallet' || entry.fromSource === 'bank' || entry.fromSource === 'NCMC') &&
        (entry.toSource === 'wallet' || entry.toSource === 'bank' || entry.toSource === 'NCMC') &&
        entry.fromSource !== entry.toSource
    ).map(entry => ({...entry, date: parseISO(entry.date).toISOString()}));

    if (validEntries.length !== entries.length) {
        console.warn("Some imported transfer entries were invalid or had malformed dates/sources and have been filtered/corrected.");
        toast({
          variant: "default",
          title: "Import Note",
          description: "Some transfer entries might have been filtered or corrected.",
        });
    }
    setTransferEntries(validEntries.sort(sortByDateDesc));
  };

  const addDebt = (entryData: DebtFormValuesAsDate) => {
    const newEntry: DebtEntry = {
      ...entryData,
      id: generateUUID(),
      date: entryData.date.toISOString(),
      dueDate: entryData.dueDate?.toISOString(),
      status: 'pending',
      settledAmount: 0,
      descriptions: entryData.descriptions || [],
    };
    setDebtEntries((prev) => [...prev, newEntry].sort(sortByDateDesc));
    toast({ 
      title: "Debt/Loan recorded", 
      description: `₹${entryData.amount} ${entryData.type === 'lent' ? 'lent to' : 'borrowed from'} ${entryData.personName}.` 
    });
  };

  const deleteDebt = (id: string) => {
    setDebtEntries((prev) => prev.filter((entry) => entry.id !== id));
    toast({ title: "Debt/Loan deleted", variant: "destructive" });
  };

  const updateDebt = (id: string, data: DebtFormValuesAsDate) => {
    setDebtEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...data,
              date: data.date.toISOString(),
              dueDate: data.dueDate?.toISOString(),
              descriptions: data.descriptions || [],
            }
          : entry
      ).sort(sortByDateDesc)
    );
    toast({ title: "Debt/Loan updated" });
  };

  const settleDebt = (id: string) => {
    const debtToSettle = debtEntries.find(debt => debt.id === id);
    if (!debtToSettle) return;

    // Mark the debt as settled
    setDebtEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: 'settled' as const,
              settledDate: new Date().toISOString(),
            }
          : entry
      ).sort(sortByDateDesc)
    );

    // Create a corresponding income/expense entry for the settlement
    if (debtToSettle.type === 'lent') {
      // When someone pays back money you lent, it's income
      const settlementIncome: IncomeEntry = {
        id: generateUUID(),
        amount: debtToSettle.amount,
        source: debtToSettle.source,
        subcategory: 'Debt Settlement',
        descriptions: [`Settlement of debt from ${debtToSettle.personName}`, ...(debtToSettle.descriptions || [])],
        date: new Date().toISOString(),
      };
      setIncomeEntries((prev) => [...prev, settlementIncome].sort(sortByDateDesc));
    } else if (debtToSettle.type === 'borrowed') {
      // When you pay back money you borrowed, it's an expense
      const settlementExpense: ExpenseEntry = {
        id: generateUUID(),
        amount: debtToSettle.amount,
        category: 'Debt Repayment',
        subcategory: 'Loan Repayment',
        descriptions: [`Repayment of debt to ${debtToSettle.personName}`, ...(debtToSettle.descriptions || [])],
        date: new Date().toISOString(),
        source: debtToSettle.source,
      };
      setExpenseEntries((prev) => [...prev, settlementExpense].sort(sortByDateDesc));
    }

    toast({ 
      title: "Debt settled", 
      description: `Settlement transaction has been recorded for ${debtToSettle.personName}.` 
    });
  };

  const partialSettleDebt = (id: string, settlementAmount: number, description?: string) => {
    const debtToSettle = debtEntries.find(debt => debt.id === id);
    if (!debtToSettle) return;

    const currentSettledAmount = debtToSettle.settledAmount || 0;
    const newSettledAmount = currentSettledAmount + settlementAmount;
    const isFullySettled = newSettledAmount >= debtToSettle.amount;

    // Update the debt entry
    setDebtEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              settledAmount: newSettledAmount,
              status: isFullySettled ? 'settled' as const : 'pending' as const,
              settledDate: isFullySettled ? new Date().toISOString() : entry.settledDate,
            }
          : entry
      ).sort(sortByDateDesc)
    );

    // Create a corresponding income/expense entry for the partial settlement
    if (debtToSettle.type === 'lent') {
      // When someone pays back money you lent, it's income
      const settlementIncome: IncomeEntry = {
        id: generateUUID(),
        amount: settlementAmount,
        source: debtToSettle.source,
        subcategory: 'Debt Settlement',
        descriptions: [
          `Partial settlement (₹${settlementAmount}) from ${debtToSettle.personName}`,
          `Remaining: ₹${debtToSettle.amount - newSettledAmount}`,
          ...(description ? [description] : [])
        ],
        date: new Date().toISOString(),
      };
      setIncomeEntries((prev) => [...prev, settlementIncome].sort(sortByDateDesc));
    } else if (debtToSettle.type === 'borrowed') {
      // When you pay back money you borrowed, it's an expense
      const settlementExpense: ExpenseEntry = {
        id: generateUUID(),
        amount: settlementAmount,
        category: 'Debt Repayment',
        subcategory: 'Loan Repayment',
        descriptions: [
          `Partial repayment (₹${settlementAmount}) to ${debtToSettle.personName}`,
          `Remaining: ₹${debtToSettle.amount - newSettledAmount}`,
          ...(description ? [description] : [])
        ],
        date: new Date().toISOString(),
        source: debtToSettle.source,
      };
      setExpenseEntries((prev) => [...prev, settlementExpense].sort(sortByDateDesc));
    }

    toast({ 
      title: isFullySettled ? "Debt fully settled" : "Partial settlement recorded", 
      description: isFullySettled 
        ? `Debt with ${debtToSettle.personName} has been fully settled.`
        : `₹${settlementAmount} settled. ₹${debtToSettle.amount - newSettledAmount} remaining.`
    });
  };

  const replaceAllDebts = (entries: DebtEntry[]) => {
    const validEntries = entries.filter(entry =>
        typeof entry.id === 'string' &&
        typeof entry.amount === 'number' &&
        typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
        typeof entry.personName === 'string' &&
        (entry.type === 'lent' || entry.type === 'borrowed') &&
        (entry.source === 'wallet' || entry.source === 'bank' || entry.source === 'NCMC') &&
        (entry.status === 'pending' || entry.status === 'settled')
    ).map(entry => ({
        ...entry,
        date: parseISO(entry.date).toISOString(),
        dueDate: entry.dueDate ? parseISO(entry.dueDate).toISOString() : undefined,
        settledDate: entry.settledDate ? parseISO(entry.settledDate).toISOString() : undefined,
    }));

    if (validEntries.length !== entries.length) {
        console.warn("Some imported debt entries were invalid and have been filtered.");
        toast({
          variant: "default",
          title: "Import Note",
          description: "Some debt entries might have been filtered due to invalid data.",
        });
    }
    setDebtEntries(validEntries.sort(sortByDateDesc));
  };

  // In the context value, add balances for wallet, bank, and NCMC
  const walletBalance = calculateSourceBalance('wallet', incomeEntries, expenseEntries, transferEntries, debtEntries);
  const bankBalance = calculateSourceBalance('bank', incomeEntries, expenseEntries, transferEntries, debtEntries);
  const ncmcBalance = calculateSourceBalance('NCMC', incomeEntries, expenseEntries, transferEntries, debtEntries);

  const getAccountBalance = (accountId: string) => {
    return calculateAccountBalance(accountId, incomeEntries, expenseEntries, transferEntries, debtEntries);
  };

  // Get pending debts with remaining amounts
  const pendingDebtsLent = debtEntries.filter(debt => debt.type === 'lent' && debt.status === 'pending');
  const pendingDebtsBorrowed = debtEntries.filter(debt => debt.type === 'borrowed' && debt.status === 'pending');
  
  // Calculate remaining amounts for pending debts
  const totalPendingLent = pendingDebtsLent.reduce((sum, debt) => sum + (debt.amount - (debt.settledAmount || 0)), 0);
  const totalPendingBorrowed = pendingDebtsBorrowed.reduce((sum, debt) => sum + (debt.amount - (debt.settledAmount || 0)), 0);

  return (
    <AppContext.Provider
      value={{
        incomeEntries,
        expenseEntries,
        transferEntries,
        debtEntries,
        addIncome,
        deleteIncome,
        updateIncome,
        replaceAllIncome,
        addExpense,
        deleteExpense,
        updateExpense,
        replaceAllExpenses,
        addTransfer,
        deleteTransfer,
        updateTransfer,
        replaceAllTransfers,
        addDebt,
        deleteDebt,
        updateDebt,
        settleDebt,
        partialSettleDebt,
        replaceAllDebts,
        walletBalance,
        bankBalance,
        ncmcBalance,
        getAccountBalance,
        pendingDebtsLent,
        pendingDebtsBorrowed,
        totalPendingLent,
        totalPendingBorrowed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
