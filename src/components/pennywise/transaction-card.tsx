
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Landmark, Trash2, Wallet, Utensils, Car, Home, Film, Activity, ShoppingBag, Package, Pencil, ArrowRightLeft, Repeat, Building, Briefcase, Gift, DollarSign, UserCheck, UserX, CheckCircle, Coins } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { useAccountContext } from "@/contexts/account-context";
import type { IncomeEntry, ExpenseEntry, TransferEntry, DebtEntry, TransactionType, TransactionCardProps as OriginalTransactionCardProps, TransactionSource } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ExpenseForm } from "./expense-form";
import { IncomeForm } from "./income-form";
import { TransferForm } from "./transfer-form";
import { DebtForm } from "./debt-form";
import { PartialSettlementDialog } from "./partial-settlement-dialog";
import { cn } from "@/lib/utils";


interface TransactionCardProps extends OriginalTransactionCardProps {
  onDateClick?: (date: string, type: TransactionType) => void;
}


const categoryIcons: { [key: string]: React.ElementType } = {
  food: Utensils,
  transport: Car,
  utilities: Home,
  entertainment: Film,
  healthcare: Activity,
  shopping: ShoppingBag,
  salary: Briefcase,
  business: Building,
  gifts: Gift,
  investment: DollarSign,
  other: Package,
  default: Package,
};

const CategoryIcon = ({ category }: { category: string }) => {
  const normalizedCategory = category.toLowerCase().split(' ')[0]; // Take first word for better matching
  const IconComponent = categoryIcons[normalizedCategory] || categoryIcons.default;
  return <IconComponent className="mr-2 h-4 w-4 text-primary" />;
};

const SourceIcon = ({ source }: { source: TransactionSource }) => {
  if (source === 'wallet') return <Wallet className="mr-2 h-4 w-4 text-green-600" />;
  if (source === 'bank') return <Landmark className="mr-2 h-4 w-4 text-blue-600" />;
  return <Package className="mr-2 h-4 w-4 text-muted-foreground" />;
}

const AccountDisplay = ({ accountId, source }: { accountId?: string; source: TransactionSource }) => {
  const { getAccount } = useAccountContext();
  
  if (accountId) {
    const account = getAccount(accountId);
    if (account) {
      return (
        <div className="flex items-center">
          <SourceIcon source={source} />
          <span>{account.name}</span>
        </div>
      );
    }
  }
  
  // Fallback to source type
  return (
    <div className="flex items-center">
      <SourceIcon source={source} />
      <span>{source === 'wallet' ? 'Wallet' : source === 'bank' ? 'Bank' : 'NCMC'}</span>
    </div>
  );
}

const AccountName = ({ accountId, source }: { accountId?: string; source: TransactionSource }) => {
  const { getAccount } = useAccountContext();
  
  if (accountId) {
    const account = getAccount(accountId);
    if (account) {
      return <span className="text-xs text-muted-foreground ml-1.5 font-normal">({account.name})</span>;
    }
  }
  
  // Fallback to source type
  return <span className="text-xs text-muted-foreground ml-1.5 font-normal">({source})</span>;
}

const TransferDisplay = ({ transferData }: { transferData: TransferEntry }) => {
  const { getAccount } = useAccountContext();
  
  const fromAccount = transferData.fromAccountId ? getAccount(transferData.fromAccountId) : null;
  const toAccount = transferData.toAccountId ? getAccount(transferData.toAccountId) : null;
  
  const fromName = fromAccount ? fromAccount.name : transferData.fromSource.charAt(0).toUpperCase() + transferData.fromSource.slice(1);
  const toName = toAccount ? toAccount.name : transferData.toSource.charAt(0).toUpperCase() + transferData.toSource.slice(1);
  
  return (
    <span className="flex items-center min-w-0">
      <Repeat className="mr-2 h-4 w-4 text-purple-500" />
      <span className="truncate">Transfer: {fromName}</span>
      <ArrowRightLeft className="mx-1 h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="truncate">{toName}</span>
    </span>
  );
}

export function TransactionCard({ transaction, type, onDateClick }: TransactionCardProps) {
  const { deleteIncome, deleteExpense, deleteTransfer, deleteDebt, settleDebt, partialSettleDebt } = useAppContext();
  const [isExpenseEditDialogOpen, setIsExpenseEditDialogOpen] = useState(false);
  const [isIncomeEditDialogOpen, setIsIncomeEditDialogOpen] = useState(false);
  const [isTransferEditDialogOpen, setIsTransferEditDialogOpen] = useState(false);
  const [isDebtEditDialogOpen, setIsDebtEditDialogOpen] = useState(false);


  const handleDelete = () => {
    if (type === 'income') {
      deleteIncome(transaction.id);
    } else if (type === 'expense') {
      deleteExpense(transaction.id);
    } else if (type === 'transfer') {
      deleteTransfer(transaction.id);
    } else if (type === 'debt') {
      deleteDebt(transaction.id);
    }
  };

  const handleSettle = () => {
    if (type === 'debt') {
      settleDebt(transaction.id);
    }
  };

  const handlePartialSettle = (debtId: string, amount: number, description?: string) => {
    partialSettleDebt(debtId, amount, description);
  };

  const handleDateClick = () => {
    if (onDateClick) {
      onDateClick(transaction.date, type);
    }
  };

  const isIncome = type === 'income';
  const isExpense = type === 'expense';
  const isTransfer = type === 'transfer';
  const isDebt = type === 'debt';

  const incomeData = transaction as IncomeEntry;
  const expenseData = transaction as ExpenseEntry;
  const transferData = transaction as TransferEntry;
  const debtData = transaction as DebtEntry;

  let DialogComponent;
  let EditFormComponent;
  let dialogOpenState;
  let setDialogOpenState;
  let dialogTitle = "";

  if (isIncome) {
    DialogComponent = IncomeForm;
    dialogOpenState = isIncomeEditDialogOpen;
    setDialogOpenState = setIsIncomeEditDialogOpen;
    dialogTitle = "Edit Income";
    EditFormComponent = <IncomeForm isEditMode initialData={incomeData} onSubmitSuccess={() => setIsIncomeEditDialogOpen(false)} />;
  } else if (isExpense) {
    DialogComponent = ExpenseForm;
    dialogOpenState = isExpenseEditDialogOpen;
    setDialogOpenState = setIsExpenseEditDialogOpen;
    dialogTitle = "Edit Expense";
    EditFormComponent = <ExpenseForm isEditMode initialData={expenseData} onSubmitSuccess={() => setIsExpenseEditDialogOpen(false)} />;
  } else if (isTransfer) {
    DialogComponent = TransferForm;
    dialogOpenState = isTransferEditDialogOpen;
    setDialogOpenState = setIsTransferEditDialogOpen;
    dialogTitle = "Edit Transfer";
    EditFormComponent = <TransferForm isEditMode initialData={transferData} onSubmitSuccess={() => setIsTransferEditDialogOpen(false)} />;
  } else if (isDebt) {
    DialogComponent = DebtForm;
    dialogOpenState = isDebtEditDialogOpen;
    setDialogOpenState = setIsDebtEditDialogOpen;
    dialogTitle = "Edit Debt/Loan";
    EditFormComponent = <DebtForm isEditMode initialData={debtData} onSubmitSuccess={() => setIsDebtEditDialogOpen(false)} />;
  }


  return (
    <Card className="mb-3 card-shadow bg-card animate-fade-in">
      <CardHeader className="p-3 pb-1 md:p-4 md:pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-grow min-w-0 overflow-hidden"> {/* Added overflow-hidden */}
            <CardTitle className="text-base md:text-md font-semibold text-foreground">
              {isIncome && (
                <span className="flex items-center min-w-0">
                  <AccountDisplay accountId={incomeData.accountId} source={incomeData.source} />
                </span>
              )}
              {isExpense && (
                <span className="flex items-center min-w-0">
                  <CategoryIcon category={expenseData.category} />
                  <span className="truncate">{expenseData.category}</span>
                  {expenseData.subcategory && <span className="text-sm text-muted-foreground ml-1 font-normal truncate">/ {expenseData.subcategory}</span>}
                  <AccountName accountId={expenseData.accountId} source={expenseData.source} />
                </span>
              )}
              {isTransfer && (
                <TransferDisplay transferData={transferData} />
              )}
              {isDebt && (
                <span className="flex items-center min-w-0">
                  {debtData.type === 'lent' ? (
                    <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <UserX className="mr-2 h-4 w-4 text-red-600" />
                  )}
                  <span className="truncate">
                    {debtData.type === 'lent' ? 'Lent to' : 'Borrowed from'} {debtData.personName}
                  </span>
                  {debtData.status === 'settled' && (
                    <CheckCircle className="ml-2 h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                  <AccountName accountId={debtData.accountId} source={debtData.source} />
                </span>
              )}
            </CardTitle>
            {onDateClick ? (
              <button
                onClick={handleDateClick}
                className={cn(
                  "text-xs text-left p-0 h-auto mt-0.5",
                  "text-muted-foreground hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-sm"
                )}
                aria-label={`View transactions for ${formatDate(transaction.date)}`}
              >
                {formatDate(transaction.date)}
              </button>
            ) : (
              <CardDescription className="text-xs mt-0.5">
                {formatDate(transaction.date)}
              </CardDescription>
            )}
          </div>
          {DialogComponent && EditFormComponent && setDialogOpenState && (
            <div className="flex items-center space-x-0.5 flex-shrink-0">
              {/* Partial settle button for pending debts */}
              {isDebt && debtData.status === 'pending' && (
                <PartialSettlementDialog debt={debtData} onPartialSettle={handlePartialSettle}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-yellow-600 hover:bg-yellow-500/10 h-7 w-7 md:h-8 md:w-8"
                    title="Partial settlement"
                  >
                    <Coins className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </PartialSettlementDialog>
              )}
              
              {/* Full settle button for pending debts */}
              {isDebt && debtData.status === 'pending' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSettle}
                  className="text-green-600 hover:bg-green-500/10 h-7 w-7 md:h-8 md:w-8"
                  title="Mark as fully settled"
                >
                  <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
              )}
              
              <Dialog open={dialogOpenState} onOpenChange={setDialogOpenState}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-500/10 h-7 w-7 md:h-8 md:w-8">
                    <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-semibold text-lg">{dialogTitle}</DialogTitle>
                  </DialogHeader>
                  {EditFormComponent}
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-7 w-7 md:h-8 md:w-8">
                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this {isDebt ? 'debt/loan record' : 'transaction'}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1 md:p-4 md:pt-1">
        <div className={`${
          isIncome ? 'text-green-600' : 
          isExpense ? 'text-red-600' : 
          isTransfer ? 'text-purple-600' :
          isDebt ? (debtData.type === 'lent' ? 'text-orange-600' : 'text-blue-600') : 'text-gray-600'
        } ${isDebt && debtData.status === 'settled' ? 'opacity-60' : ''}`}>
          <p className="text-lg md:text-xl font-bold">
            {formatCurrency(transaction.amount)}
            {isDebt && debtData.status === 'settled' && (
              <span className="text-xs ml-2 text-green-600 font-normal">✓ Settled</span>
            )}
          </p>
          {isDebt && debtData.settledAmount && debtData.settledAmount > 0 && debtData.status === 'pending' && (
            <div className="mt-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Settled: {formatCurrency(debtData.settledAmount)}</span>
                <span>Remaining: {formatCurrency(debtData.amount - debtData.settledAmount)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="progress-bar bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full shadow-sm" 
                  style={{ width: `${(debtData.settledAmount / debtData.amount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {isIncome && (incomeData.descriptions && incomeData.descriptions.length > 0) && (
          <div className="mt-1 space-y-1">
            {incomeData.descriptions.slice(0, 2).map((desc, index) => (
              <p key={index} className="text-xs text-muted-foreground break-words overflow-hidden bg-muted/30 px-2 py-1 rounded-sm" style={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical'
              }}>• {desc}</p>
            ))}
            {incomeData.descriptions.length > 2 && (
              <p className="text-xs text-muted-foreground/70">+{incomeData.descriptions.length - 2} more...</p>
            )}
          </div>
        )}
        {isExpense && (expenseData.descriptions && expenseData.descriptions.length > 0) && (
          <div className="mt-1 space-y-1">
            {expenseData.descriptions.slice(0, 2).map((desc, index) => (
              <p key={index} className="text-xs text-muted-foreground break-words overflow-hidden bg-muted/30 px-2 py-1 rounded-sm" style={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical'
              }}>• {desc}</p>
            ))}
            {expenseData.descriptions.length > 2 && (
              <p className="text-xs text-muted-foreground/70">+{expenseData.descriptions.length - 2} more...</p>
            )}
          </div>
        )}
        {isTransfer && (transferData.descriptions && transferData.descriptions.length > 0) && (
          <div className="mt-1 space-y-1">
            {transferData.descriptions.slice(0, 2).map((desc, index) => (
              <p key={index} className="text-xs text-muted-foreground break-words overflow-hidden bg-muted/30 px-2 py-1 rounded-sm" style={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical'
              }}>• {desc}</p>
            ))}
            {transferData.descriptions.length > 2 && (
              <p className="text-xs text-muted-foreground/70">+{transferData.descriptions.length - 2} more...</p>
            )}
          </div>
        )}
        {isDebt && (
          <div className="mt-1 space-y-1">
            {debtData.dueDate && debtData.status === 'pending' && (
              <p className="text-xs text-orange-600 font-medium">
                Due: {formatDate(debtData.dueDate)}
              </p>
            )}
            {debtData.status === 'settled' && debtData.settledDate && (
              <p className="text-xs text-green-600 font-medium">
                Settled: {formatDate(debtData.settledDate)}
              </p>
            )}
            {debtData.descriptions && debtData.descriptions.length > 0 && (
              <div className="space-y-1">
                {debtData.descriptions.slice(0, 2).map((desc, index) => (
                  <p key={index} className="text-xs text-muted-foreground break-words overflow-hidden bg-muted/30 px-2 py-1 rounded-sm" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical'
                  }}>• {desc}</p>
                ))}
                {debtData.descriptions.length > 2 && (
                  <p className="text-xs text-muted-foreground/70">+{debtData.descriptions.length - 2} more...</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
