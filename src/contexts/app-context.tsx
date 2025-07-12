"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { IncomeEntry, ExpenseEntry, TransferEntry, ExpenseFormValuesAsDate, IncomeFormValuesAsDate, TransferFormValuesAsDate } from '@/lib/types';
import useLocalStorageState from '@/hooks/use-local-storage-state';
import { useToast } from "@/hooks/use-toast";
import { isValid, parseISO } from 'date-fns';

interface AppContextType {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  transferEntries: TransferEntry[];
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
  walletBalance: number;
  bankBalance: number;
  ncmcBalance: number;
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

// Utility to calculate balance for a given source
function calculateSourceBalance(
  source: 'wallet' | 'bank' | 'NCMC',
  incomeEntries: IncomeEntry[],
  expenseEntries: ExpenseEntry[],
  transferEntries: TransferEntry[]
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
  return balance;
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [incomeEntries, setIncomeEntries] = useLocalStorageState<IncomeEntry[]>('staticsdiary-income', []);
  const [expenseEntries, setExpenseEntries] = useLocalStorageState<ExpenseEntry[]>('staticsdiary-expenses', []);
  const [transferEntries, setTransferEntries] = useLocalStorageState<TransferEntry[]>('staticsdiary-transfers', []);
  const { toast } = useToast();

  const addIncome = (entryData: IncomeFormValuesAsDate) => {
    const newEntry: IncomeEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      date: entryData.date.toISOString(),
      description: entryData.description || "",
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
              description: data.description || "",
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
      id: crypto.randomUUID(),
      amount: entryData.amount,
      category: entryData.category,
      subcategory: entryData.subcategory || "",
      description: entryData.description || "",
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
              description: data.description || "",
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
      id: crypto.randomUUID(),
      date: entryData.date.toISOString(),
      description: entryData.description || "",
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
              description: data.description || "",
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

  // In the context value, add balances for wallet, bank, and NCMC
  const walletBalance = calculateSourceBalance('wallet', incomeEntries, expenseEntries, transferEntries);
  const bankBalance = calculateSourceBalance('bank', incomeEntries, expenseEntries, transferEntries);
  const ncmcBalance = calculateSourceBalance('NCMC', incomeEntries, expenseEntries, transferEntries);

  return (
    <AppContext.Provider
      value={{
        incomeEntries,
        expenseEntries,
        transferEntries,
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
        walletBalance,
        bankBalance,
        ncmcBalance,
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
