
"use client";

import type { IncomeEntry, ExpenseEntry, TransferEntry, TransactionType, TransactionSource } from "@/lib/types";
import { TransactionCard } from "./transaction-card";
import { parseISO } from "date-fns";

export type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

interface TransactionListProps {
  transactions: Array<IncomeEntry | ExpenseEntry | TransferEntry>;
  type: TransactionType;
  groupBy?: 'source' | 'category' | 'none'; // 'fromSource' or 'toSource' could be added for transfers
  sortOption?: SortOption;
  onDateClick?: (date: string, type: TransactionType) => void;
}

interface GroupedTransactions {
  [key: string]: Array<IncomeEntry | ExpenseEntry | TransferEntry>;
}

export function TransactionList({ transactions, type, groupBy = 'none', sortOption = 'date_desc', onDateClick }: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No {type} entries for this period.</p>
        {groupBy === 'none' && <p>Add some to see them here!</p>}
      </div>
    );
  }

  let displayTransactions = [...transactions];

  // Apply sorting
  if (sortOption === 'date_asc') {
    displayTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (sortOption === 'date_desc') {
    displayTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else if (sortOption === 'amount_desc') {
    displayTransactions.sort((a, b) => b.amount - a.amount);
  } else if (sortOption === 'amount_asc') {
    displayTransactions.sort((a, b) => a.amount - b.amount);
  }


  if (groupBy !== 'none') {
    const grouped: GroupedTransactions = displayTransactions.reduce((acc, transaction) => {
      let key: string;
      if (type === 'income' && groupBy === 'source') {
        key = (transaction as IncomeEntry).source;
      } else if (type === 'expense' && groupBy === 'category') {
        key = (transaction as ExpenseEntry).category;
      } else if (type === 'transfer' && groupBy === 'source') { // Example: could group transfers by fromSource
        key = (transaction as TransferEntry).fromSource;
      }
       else {
        return acc; // Don't group if type/groupBy combo doesn't make sense
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(transaction);
      return acc;
    }, {} as GroupedTransactions);

    const groupKeys = Object.keys(grouped).sort();

    if (groupKeys.length === 0) {
         return (
          <div className="text-center text-muted-foreground py-8">
            <p>No {type} entries to group for this period.</p>
          </div>
        );
    }

    return (
      <div className="space-y-6">
        {groupKeys.map((groupKey) => (
          <div key={groupKey}>
            <h4 className="text-lg font-semibold font-headline mb-3 capitalize text-primary">
              {groupKey}
            </h4>
            <div className="space-y-3">
              {grouped[groupKey].map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} type={type} onDateClick={onDateClick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat list rendering (no grouping)
  return (
    <div className="space-y-3">
      {displayTransactions.map((transaction) => (
        <TransactionCard key={transaction.id} transaction={transaction} type={type} onDateClick={onDateClick} />
      ))}
    </div>
  );
}
