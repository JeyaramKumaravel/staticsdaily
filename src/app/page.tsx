"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { IncomeForm } from "@/components/pennywise/income-form";
import { ExpenseForm } from "@/components/pennywise/expense-form";
import { TransferForm } from "@/components/pennywise/transfer-form";
import { DebtForm } from "@/components/pennywise/debt-form";
import { TransactionList } from "@/components/pennywise/transaction-list";
import { SummaryView } from "@/components/pennywise/summary-view";
import { EnhancedBalanceBreakdownView } from "@/components/pennywise/enhanced-balance-breakdown-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExpenseCategoryPieChart } from "@/components/pennywise/expense-category-pie-chart";
import { IncomeSourcePieChart } from "@/components/pennywise/income-source-pie-chart";
import { ExpenseCategoryBarChart } from "@/components/pennywise/expense-category-bar-chart";
import { IncomeSourceBarChart } from "@/components/pennywise/income-source-bar-chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Download, Upload, AlertTriangle, Inbox, ArrowLeft, Menu, Repeat, LayoutDashboard, TrendingUp, TrendingDown, Database, Users, UserCheck, UserX, Settings, CreditCard } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn, calculateTotal } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isValid,
  getYear,
  startOfDay,
  startOfYear,
} from "date-fns";
import {
  filterTransactionsBySpecificMonth,
  filterTransactionsBySpecificYear,
  filterTransactionsByPeriod,
  filterTransactionsByCustomRange,
} from "@/lib/utils";
import type { IncomeEntry, ExpenseEntry, TransferEntry, DebtEntry, TransactionType } from "@/lib/types";
import type { SortOption } from "@/components/pennywise/transaction-list";
import { useToast } from "@/hooks/use-toast";
import { ThemeDebug } from "@/components/theme-debug";


export type ActivePeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'allTime' | 'custom';
type OverviewDisplayMode = 'summary' | 'incomeBreakdown' | 'expenseBreakdown';
type ActiveViewType = 'overview' | 'income' | 'expenses' | 'transfers' | 'debts' | 'data';


const tabItems = [
  { value: 'overview' as ActiveViewType, label: 'Overview', icon: LayoutDashboard },
  { value: 'income' as ActiveViewType, label: 'Income', icon: TrendingUp },
  { value: 'expenses' as ActiveViewType, label: 'Expenses', icon: TrendingDown },
  { value: 'transfers' as ActiveViewType, label: 'Transfers', icon: Repeat },
  { value: 'debts' as ActiveViewType, label: 'Debts', icon: Users },
  { value: 'data' as ActiveViewType, label: 'Data', icon: Database },
];

export default function HomePage() {
  const { incomeEntries, expenseEntries, transferEntries, debtEntries, replaceAllIncome, replaceAllExpenses, replaceAllTransfers, replaceAllDebts, walletBalance, bankBalance, ncmcBalance, pendingDebtsLent, pendingDebtsBorrowed, totalPendingLent, totalPendingBorrowed } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activePeriod, setActivePeriod] = useState<ActivePeriodType>('monthly');
  const [activeView, setActiveView] = useState<ActiveViewType>('overview');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [isCustomStartDatePickerOpen, setIsCustomStartDatePickerOpen] = useState(false);
  const [isCustomEndDatePickerOpen, setIsCustomEndDatePickerOpen] = useState(false);

  const [incomeSortOption, setIncomeSortOption] = useState<SortOption>('date_desc');
  const [expenseSortOption, setExpenseSortOption] = useState<SortOption>('date_desc');
  const [transferSortOption, setTransferSortOption] = useState<SortOption>('date_desc');
  const [debtSortOption, setDebtSortOption] = useState<SortOption>('date_desc');
  const [isClient, setIsClient] = useState(false);
  
  const [expenseChartDisplayLevel, setExpenseChartDisplayLevel] = useState<'category' | 'subcategory'>('category');
  const [selectedParentExpenseCategory, setSelectedParentExpenseCategory] = useState<string | null>(null);
  const [overviewDisplayMode, setOverviewDisplayMode] = useState<OverviewDisplayMode>('summary');

  // Add global error handler for clipboard and other browser-specific errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Handle clipboard errors gracefully
      if (event.error?.message?.includes('clipboard') || event.message?.includes('clipboard')) {
        console.warn('Clipboard operation not supported in this browser context:', event.error || event.message);
        event.preventDefault();
        return;
      }
      
      // Handle crypto/UUID errors gracefully
      if (event.error?.message?.includes('crypto.randomUUID') || event.message?.includes('crypto.randomUUID')) {
        console.warn('crypto.randomUUID not supported, using fallback:', event.error || event.message);
        event.preventDefault();
        return;
      }
      
      // Handle other browser-specific errors
      if (event.error?.message?.includes('not supported') || event.message?.includes('not supported')) {
        console.warn('Browser feature not supported:', event.error || event.message);
        event.preventDefault();
        return;
      }
      
      // Log other errors but don't show to user unless critical
      console.error('Global error caught:', event.error || event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle clipboard promise rejections
      if (event.reason?.message?.includes('clipboard') || String(event.reason).includes('clipboard')) {
        console.warn('Clipboard promise rejection handled:', event.reason);
        event.preventDefault();
        return;
      }
      
      // Handle crypto promise rejections
      if (event.reason?.message?.includes('crypto') || String(event.reason).includes('crypto')) {
        console.warn('Crypto promise rejection handled:', event.reason);
        event.preventDefault();
        return;
      }
      
      console.warn('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (!selectedDate) setSelectedDate(new Date());
    if (!customStartDate) setCustomStartDate(startOfMonth(new Date()));
    if (!customEndDate) setCustomEndDate(endOfMonth(new Date()));
  }, []);


  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
      setIsCustomStartDatePickerOpen(false);
      setIsCustomEndDatePickerOpen(false);
      setExpenseChartDisplayLevel('category');
      setSelectedParentExpenseCategory(null);
    }
  };

  const handleTransactionDateNavigation = (dateString: string, type: TransactionType) => {
    const transactionDate = parseISO(dateString);
    if (isValid(transactionDate)) {
      setSelectedDate(transactionDate);
      let targetView: ActiveViewType = type === 'income' ? 'income' : (type === 'expense' ? 'expenses' : (type === 'transfer' ? 'transfers' : 'debts'));
      setActiveView(targetView);
      
      if (type === 'expense') {
        setExpenseChartDisplayLevel('category');
        setSelectedParentExpenseCategory(null);
      }
      
      setIsCalendarOpen(true); 
      setIsCustomStartDatePickerOpen(false);
      setIsCustomEndDatePickerOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Navigation Error",
        description: "Invalid date for navigation.",
      });
    }
  };


  const currentMonthYear = useMemo(() => {
    if (!isClient || !selectedDate) return "Loading date...";
    return format(selectedDate, "MMMM yyyy");
  }, [selectedDate, isClient]);

  const filteredIncomeForMonth = useMemo(
    () => selectedDate ? filterTransactionsBySpecificMonth(incomeEntries, selectedDate) : [],
    [incomeEntries, selectedDate]
  );
  const filteredExpensesForMonth = useMemo(
    () => selectedDate ? filterTransactionsBySpecificMonth(expenseEntries, selectedDate) : [],
    [expenseEntries, selectedDate]
  );
  const filteredTransfersForMonth = useMemo(
    () => selectedDate ? filterTransactionsBySpecificMonth(transferEntries, selectedDate) : [],
    [transferEntries, selectedDate]
  );


  const incomeForSelectedYear = useMemo(
    () => selectedDate ? filterTransactionsBySpecificYear(incomeEntries, selectedDate) : [],
    [incomeEntries, selectedDate]
  );
  const expensesForSelectedYear = useMemo(
    () => selectedDate ? filterTransactionsBySpecificYear(expenseEntries, selectedDate) : [],
    [expenseEntries, selectedDate]
  );

  const customRangeIncome = useMemo(
    () => filterTransactionsByCustomRange(incomeEntries, customStartDate, customEndDate),
    [incomeEntries, customStartDate, customEndDate]
  );
  const customRangeExpenses = useMemo(
    () => filterTransactionsByCustomRange(expenseEntries, customStartDate, customEndDate),
    [expenseEntries, customStartDate, customEndDate]
  );

  const overviewIncomeToDisplay = useMemo(() => {
    if (!selectedDate && (activePeriod === 'daily' || activePeriod === 'weekly' || activePeriod === 'monthly' || activePeriod === 'yearly')) return [];
    switch (activePeriod) {
      case 'daily':
        return filterTransactionsByPeriod(incomeEntries, 'daily', selectedDate!);
      case 'weekly':
        return filterTransactionsByPeriod(incomeEntries, 'weekly', selectedDate!);
      case 'monthly':
        return filteredIncomeForMonth;
      case 'yearly':
        return incomeForSelectedYear;
      case 'custom':
        return customRangeIncome;
      case 'allTime':
        return incomeEntries;
      default:
        return filteredIncomeForMonth;
    }
  }, [activePeriod, incomeEntries, filteredIncomeForMonth, incomeForSelectedYear, selectedDate, customRangeIncome]);

  const overviewExpensesToDisplay = useMemo(() => {
    if (!selectedDate && (activePeriod === 'daily' || activePeriod === 'weekly' || activePeriod === 'monthly' || activePeriod === 'yearly')) return [];
    switch (activePeriod) {
      case 'daily':
        return filterTransactionsByPeriod(expenseEntries, 'daily', selectedDate!);
      case 'weekly':
        return filterTransactionsByPeriod(expenseEntries, 'weekly', selectedDate!);
      case 'monthly':
        return filteredExpensesForMonth;
      case 'yearly':
        return expensesForSelectedYear;
      case 'custom':
        return customRangeExpenses;
      case 'allTime':
        return expenseEntries;
      default:
        return filteredExpensesForMonth;
    }
  }, [activePeriod, expenseEntries, filteredExpensesForMonth, expensesForSelectedYear, selectedDate, customRangeExpenses]);


  const uniqueIncomeSegmentsCount = useMemo(() => {
    if (!overviewIncomeToDisplay || overviewIncomeToDisplay.length === 0) return 0;
    const sources = new Set<string>();
    overviewIncomeToDisplay.forEach(entry => sources.add(entry.source));
    return sources.size;
  }, [overviewIncomeToDisplay]);

  const expensesToDisplayInDrilldownChart = useMemo(() => {
    if (expenseChartDisplayLevel === 'subcategory' && selectedParentExpenseCategory) {
      return overviewExpensesToDisplay.filter(e => e.category === selectedParentExpenseCategory);
    }
    return overviewExpensesToDisplay;
  }, [overviewExpensesToDisplay, expenseChartDisplayLevel, selectedParentExpenseCategory]);

  const uniqueSegmentsForCurrentExpenseView = useMemo(() => {
    if (!expensesToDisplayInDrilldownChart || expensesToDisplayInDrilldownChart.length === 0) return 0;
    const segments = new Set<string>();
    expensesToDisplayInDrilldownChart.forEach(entry => {
      segments.add(expenseChartDisplayLevel === 'category' ? entry.category : (entry.subcategory || '(No Subcategory)'));
    });
    return segments.size;
  }, [expensesToDisplayInDrilldownChart, expenseChartDisplayLevel]);


  const overviewListTitle = useMemo(() => {
    if (!isClient && activePeriod !== 'allTime' && activePeriod !== 'custom') return "for loading date...";
    if (!selectedDate && activePeriod !== 'allTime' && activePeriod !== 'custom') return "for loading date...";

    let refDateForLabel = selectedDate;
    if (activePeriod === 'weekly' && selectedDate) refDateForLabel = startOfWeek(selectedDate, { weekStartsOn: 1 });
    if (activePeriod === 'monthly' && selectedDate) refDateForLabel = startOfMonth(selectedDate);
    if (activePeriod === 'yearly' && selectedDate) refDateForLabel = startOfYear(selectedDate);

    switch (activePeriod) {
      case 'daily':
        return `for ${format(refDateForLabel!, "MMMM d, yyyy")}`;
      case 'weekly':
        const weekStart = startOfWeek(refDateForLabel!, { weekStartsOn: 1 });
        return `for Week of ${format(weekStart, "MMMM d")}`;
      case 'monthly':
        return `for ${format(refDateForLabel!, "MMMM yyyy")}`;
      case 'yearly':
        return `for ${format(refDateForLabel!, "yyyy")}`;
      case 'custom':
        if (customStartDate && customEndDate) {
          return `for ${format(customStartDate, "MMM d, yyyy")} - ${format(customEndDate, "MMM d, yyyy")}`;
        }
        return 'for Custom Range (select dates)';
      case 'allTime':
        return `for All Time`;
      default:
        return selectedDate ? `for ${format(refDateForLabel!, "MMMM yyyy")}` : "for loading date...";
    }
  }, [activePeriod, selectedDate, customStartDate, customEndDate, isClient]);

  const expenseChartTitle = useMemo(() => {
    if (expenseChartDisplayLevel === 'subcategory' && selectedParentExpenseCategory) {
      return `Expense Subcategories for ${selectedParentExpenseCategory} ${overviewListTitle}`;
    }
    return `Expense Breakdown ${overviewListTitle}`;
  }, [expenseChartDisplayLevel, selectedParentExpenseCategory, overviewListTitle]);

  const handleExpenseCategoryChartClick = (categoryName: string) => {
    if (expenseChartDisplayLevel === 'category') {
      setSelectedParentExpenseCategory(categoryName);
      setExpenseChartDisplayLevel('subcategory');
    }
  };

  const handleBackToCategories = () => {
    setExpenseChartDisplayLevel('category');
    setSelectedParentExpenseCategory(null);
  };

  const handleShowBreakdownRequest = (type: 'income' | 'expenses') => {
    setOverviewDisplayMode(type === 'income' ? 'incomeBreakdown' : 'expenseBreakdown');
  };

  const handleBackToSummary = () => {
    setOverviewDisplayMode('summary');
    setExpenseChartDisplayLevel('category'); 
    setSelectedParentExpenseCategory(null); 
  };


  const handleExportData = () => {
    const dataToExport = {
      incomeEntries,
      expenseEntries,
      transferEntries,
      debtEntries,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pennywise_backup_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Data Exported",
      description: "Your data has been successfully downloaded.",
    });
  };

  const isValidIncomeEntry = (entry: any): entry is IncomeEntry => {
    return (
      typeof entry.id === 'string' &&
      typeof entry.amount === 'number' &&
      (entry.source === 'wallet' || entry.source === 'bank' || entry.source === 'NCMC') &&
      typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
      (entry.subcategory === undefined || typeof entry.subcategory === 'string') &&
      (entry.description === undefined || typeof entry.description === 'string')
    );
  };

  const isValidExpenseEntry = (entry: any): entry is ExpenseEntry => {
    return (
      typeof entry.id === 'string' &&
      typeof entry.amount === 'number' &&
      typeof entry.category === 'string' && entry.category.length > 0 &&
      (entry.subcategory === undefined || typeof entry.subcategory === 'string') &&
      typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
      (entry.description === undefined || typeof entry.description === 'string') &&
      (entry.source === 'wallet' || entry.source === 'bank' || entry.source === 'NCMC')
    );
  };

  const isValidTransferEntry = (entry: any): entry is TransferEntry => {
    return (
      typeof entry.id === 'string' &&
      typeof entry.amount === 'number' && entry.amount > 0 &&
      (entry.fromSource === 'wallet' || entry.fromSource === 'bank' || entry.fromSource === 'NCMC') &&
      (entry.toSource === 'wallet' || entry.toSource === 'bank' || entry.toSource === 'NCMC') &&
      entry.fromSource !== entry.toSource &&
      typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
      (entry.description === undefined || typeof entry.description === 'string')
    );
  };

  const isValidDebtEntry = (entry: any): entry is DebtEntry => {
    return (
      typeof entry.id === 'string' &&
      typeof entry.amount === 'number' && entry.amount > 0 &&
      (entry.type === 'lent' || entry.type === 'borrowed') &&
      typeof entry.personName === 'string' && entry.personName.length > 0 &&
      (entry.source === 'wallet' || entry.source === 'bank' || entry.source === 'NCMC') &&
      typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
      (entry.status === 'pending' || entry.status === 'settled') &&
      (entry.dueDate === undefined || (typeof entry.dueDate === 'string' && isValid(parseISO(entry.dueDate)))) &&
      (entry.settledDate === undefined || (typeof entry.settledDate === 'string' && isValid(parseISO(entry.settledDate)))) &&
      (entry.descriptions === undefined || Array.isArray(entry.descriptions))
    );
  };


  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "No file selected.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (
          !data ||
          typeof data !== 'object' ||
          !Array.isArray(data.incomeEntries) ||
          !Array.isArray(data.expenseEntries) ||
          !Array.isArray(data.transferEntries)
        ) {
          throw new Error("Invalid file structure. Expected 'incomeEntries', 'expenseEntries', and 'transferEntries' arrays.");
        }

        // Handle optional debtEntries for backward compatibility
        const debtEntries = Array.isArray(data.debtEntries) ? data.debtEntries : [];

        const allIncomeValid = data.incomeEntries.every(isValidIncomeEntry);
        const allExpensesValid = data.expenseEntries.every(isValidExpenseEntry);
        const allTransfersValid = data.transferEntries.every(isValidTransferEntry);
        const allDebtsValid = debtEntries.every(isValidDebtEntry);

        if (!allIncomeValid) {
          throw new Error("Invalid data in 'incomeEntries'. Please check the file format and content.");
        }
        if (!allExpensesValid) {
          throw new Error("Invalid data in 'expenseEntries'. Please check the file format and content.");
        }
        if (!allTransfersValid) {
          throw new Error("Invalid data in 'transferEntries'. Please check the file format and content.");
        }
        if (!allDebtsValid) {
          throw new Error("Invalid data in 'debtEntries'. Please check the file format and content.");
        }


        const validatedIncomeEntries = data.incomeEntries.filter(isValidIncomeEntry).map((entry: IncomeEntry) => ({
          ...entry,
          date: parseISO(entry.date).toISOString(),
          subcategory: entry.subcategory || "",
        }));
        const validatedExpenseEntries = data.expenseEntries.filter(isValidExpenseEntry).map((entry: ExpenseEntry) => ({
          ...entry,
          date: parseISO(entry.date).toISOString(),
          subcategory: entry.subcategory || "",
          source: entry.source,
        }));
        const validatedTransferEntries = data.transferEntries.filter(isValidTransferEntry).map((entry: TransferEntry) => ({
            ...entry,
            date: parseISO(entry.date).toISOString(),
        }));

        const validatedDebtEntries = debtEntries.filter(isValidDebtEntry).map((entry: DebtEntry) => ({
            ...entry,
            date: parseISO(entry.date).toISOString(),
            dueDate: entry.dueDate ? parseISO(entry.dueDate).toISOString() : undefined,
            settledDate: entry.settledDate ? parseISO(entry.settledDate).toISOString() : undefined,
        }));

        const confirmed = window.confirm(
          "WARNING: Importing data will REPLACE all your current income, expense, transfer, and debt entries. This action CANNOT be undone. Are you sure you want to proceed?"
        );

        if (confirmed) {
          replaceAllIncome(validatedIncomeEntries);
          replaceAllExpenses(validatedExpenseEntries);
          replaceAllTransfers(validatedTransferEntries);
          replaceAllDebts(validatedDebtEntries);
          toast({
            title: "Import Successful",
            description: "Your data has been imported and replaced the existing data.",
          });
        } else {
          toast({
            title: "Import Cancelled",
            description: "Data import was cancelled by the user.",
          });
        }
      } catch (error: any) {
        console.error("Import error:", error);
        
        // Handle specific validation errors
        let errorMessage = "The file is corrupted or not in the correct format. Please check the file and try again.";
        
        if (error.message.includes("Invalid data in 'incomeEntries'")) {
          errorMessage = "Invalid data found in income entries. Please check that all income entries have valid amounts, sources (wallet/bank/NCMC), and dates.";
        } else if (error.message.includes("Invalid data in 'expenseEntries'")) {
          errorMessage = "Invalid data found in expense entries. Please check that all expense entries have valid amounts, categories, sources (wallet/bank/NCMC), and dates.";
        } else if (error.message.includes("Invalid data in 'transferEntries'")) {
          errorMessage = "Invalid data found in transfer entries. Please check that all transfer entries have valid amounts, sources (wallet/bank/NCMC), and dates.";
        } else if (error.message.includes("Invalid file structure")) {
          errorMessage = "Invalid file structure. The file should contain 'incomeEntries', 'expenseEntries', and 'transferEntries' arrays.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: errorMessage,
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
  };

  const calendarRangeYear = isClient && selectedDate ? getYear(selectedDate) : getYear(new Date());
  const calendarFromYear = calendarRangeYear - 10;
  const calendarToYear = calendarRangeYear + 10;

  const currentViewLabel = useMemo(() => {
    return tabItems.find(tab => tab.value === activeView)?.label || 'PennyWise';
  }, [activeView]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-lg">Loading PennyWise...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-20 header-shadow">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">₹</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {currentViewLabel}
              </h1>
              <p className="text-xs text-muted-foreground">Personal Finance Tracker</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                ₹{(walletBalance + bankBalance + ncmcBalance).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Balance</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/accounts" className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Accounts
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 pt-6 md:pt-8 pb-20">
        {activeView === 'overview' && (
          <>
            <EnhancedBalanceBreakdownView
              walletBalance={walletBalance}
              bankBalance={bankBalance}
              ncmcBalance={ncmcBalance}
              isClient={isClient}
            />
            {activeView === 'overview' && activePeriod === 'custom' && overviewDisplayMode === 'summary' && (
              <Card className="card-shadow mb-6">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Popover open={isCustomStartDatePickerOpen} onOpenChange={setIsCustomStartDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customStartDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "PPP") : <span>Start Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customStartDate ?? undefined}
                        onSelect={(date) => {
                          setCustomStartDate(date ?? null);
                          setIsCustomStartDatePickerOpen(false);
                          if (date && customEndDate && date > customEndDate) {
                            setCustomEndDate(null);
                          }
                        }}
                        disabled={(date) => (customEndDate ? date > customEndDate : false) || date > new Date()}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={calendarFromYear}
                        toYear={calendarToYear}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover open={isCustomEndDatePickerOpen} onOpenChange={setIsCustomEndDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customEndDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "PPP") : <span>End Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={customEndDate ?? undefined}
                        onSelect={(date) => {
                            setCustomEndDate(date ?? null);
                            setIsCustomEndDatePickerOpen(false);
                        }}
                        disabled={(date) => (customStartDate ? date < customStartDate : false) || date > new Date()}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={calendarFromYear}
                        toYear={calendarToYear}
                        />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            )}
            
            {overviewDisplayMode === 'summary' && (
              <>
                <SummaryView
                  allIncomeEntries={incomeEntries}
                  allExpenseEntries={expenseEntries}
                  activePeriod={activePeriod}
                  onActivePeriodChange={(newPeriod) => {
                    setActivePeriod(newPeriod);
                    setExpenseChartDisplayLevel('category');
                    setSelectedParentExpenseCategory(null);
                  }}
                  referenceDate={selectedDate}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  customRangeIncome={customRangeIncome}
                  customRangeExpenses={customRangeExpenses}
                  onShowBreakdown={handleShowBreakdownRequest}
                  selectedDateForCalendar={selectedDate}
                  onCalendarDateSelect={handleDateSelect}
                  isCalendarOpen={isCalendarOpen}
                  setIsCalendarOpen={setIsCalendarOpen}
                  calendarFromYear={calendarFromYear}
                  calendarToYear={calendarToYear}
                  isClient={isClient}
                />

                {overviewIncomeToDisplay.length === 0 && overviewExpensesToDisplay.length === 0 && (
                  <Card className="card-shadow mt-6 md:mt-8">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                      <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        {activePeriod === 'allTime' && incomeEntries.length === 0 && expenseEntries.length === 0
                          ? "Welcome to PennyWise!"
                          : "No Transactions Yet"}
                      </h3>
                      <p className="text-muted-foreground">
                        {activePeriod === 'allTime' && incomeEntries.length === 0 && expenseEntries.length === 0
                          ? "Start by adding your income or expenses."
                          : `There are no transactions for the selected period. Try adjusting the date or add new entries.`}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {overviewDisplayMode === 'incomeBreakdown' && (
              <Card className="card-shadow mt-6 md:mt-8">
                <CardHeader className="p-4 md:p-6 flex flex-row items-center justify-between">
                  <CardTitle className="font-semibold text-xl md:text-2xl text-foreground">{`Income Breakdown ${overviewListTitle}`}</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleBackToSummary}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Summary
                  </Button>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {overviewIncomeToDisplay.length > 0 ? (
                    uniqueIncomeSegmentsCount <= 5 ? (
                      <IncomeSourcePieChart income={overviewIncomeToDisplay} title="" onDateClick={handleTransactionDateNavigation} />
                    ) : (
                      <IncomeSourceBarChart income={overviewIncomeToDisplay} title="" onDateClick={handleTransactionDateNavigation} />
                    )
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No income data for this period.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {overviewDisplayMode === 'expenseBreakdown' && (
              <Card className="card-shadow mt-6 md:mt-8">
                <CardHeader className="p-4 md:p-6 flex flex-row items-center justify-between">
                  <CardTitle className="font-semibold text-xl md:text-2xl text-foreground">{expenseChartTitle}</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleBackToSummary}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Summary
                  </Button>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {expensesToDisplayInDrilldownChart.length > 0 ? (
                    <>
                      {uniqueSegmentsForCurrentExpenseView <= 5 ? (
                        <ExpenseCategoryPieChart
                          expenses={expensesToDisplayInDrilldownChart}
                          title="" 
                          chartMode={expenseChartDisplayLevel}
                          parentCategoryForSubcharts={selectedParentExpenseCategory || undefined}
                          onCategoryClick={handleExpenseCategoryChartClick}
                          onDateClick={handleTransactionDateNavigation}
                          onBackToCategoriesClick={expenseChartDisplayLevel === 'subcategory' ? handleBackToCategories : undefined}
                        />
                      ) : (
                        <ExpenseCategoryBarChart
                          expenses={expensesToDisplayInDrilldownChart}
                          title=""
                          chartMode={expenseChartDisplayLevel}
                          parentCategoryForSubcharts={selectedParentExpenseCategory || undefined}
                          onCategoryClick={handleExpenseCategoryChartClick}
                          onDateClick={handleTransactionDateNavigation}
                          onBackToCategoriesClick={expenseChartDisplayLevel === 'subcategory' ? handleBackToCategories : undefined}
                        />
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No expense data for this period.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeView === 'income' && (
           <div className="space-y-6">
             <div className="p-1 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Popover open={isCalendarOpen && activeView === 'income'} onOpenChange={(isOpen) => activeView === 'income' && setIsCalendarOpen(isOpen)}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn( "w-full sm:w-auto sm:min-w-[240px] justify-start text-left font-normal")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? `History for ${format(selectedDate, "MMMM yyyy")}` : <span>Pick a month</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            key={selectedDate ? `income-calendar-${selectedDate.toISOString()}` : 'no-date-income-tab'}
                            mode="single"
                            selected={selectedDate ?? undefined}
                            onSelect={handleDateSelect}
                            initialFocus
                            defaultMonth={selectedDate ?? undefined}
                            captionLayout="dropdown-buttons"
                            fromYear={calendarFromYear}
                            toYear={calendarToYear}
                        />
                    </PopoverContent>
                </Popover>
                 <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Select value={incomeSortOption} onValueChange={(value) => setIncomeSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="card-shadow">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="font-semibold text-xl text-foreground">Add New Income</CardTitle>
                      <CardDescription className="text-sm">Record money received</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 md:p-6 md:pt-2">
                  <IncomeForm />
                </CardContent>
              </Card>
              <Card className="card-shadow">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-semibold text-xl text-foreground">Income History for {currentMonthYear}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-4 md:pt-0 lg:p-6 lg:pt-0">
                   <ScrollArea className="h-[280px] md:h-[380px] pr-3">
                    <TransactionList transactions={filteredIncomeForMonth} type="income" sortOption={incomeSortOption} onDateClick={handleTransactionDateNavigation} groupBy={'none'} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeView === 'expenses' && (
            <div className="space-y-6">
             <div className="p-1 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Popover open={isCalendarOpen && activeView === 'expenses'} onOpenChange={(isOpen) => activeView === 'expenses' && setIsCalendarOpen(isOpen)}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-full sm:w-auto sm:min-w-[240px] justify-start text-left font-normal" )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? `History for ${format(selectedDate, "MMMM yyyy")}` : <span>Pick a month</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            key={selectedDate ? `expense-calendar-${selectedDate.toISOString()}` : 'no-date-expenses-tab'}
                            mode="single"
                            selected={selectedDate ?? undefined}
                            onSelect={handleDateSelect}
                            initialFocus
                            defaultMonth={selectedDate ?? undefined}
                            captionLayout="dropdown-buttons"
                            fromYear={calendarFromYear}
                            toYear={calendarToYear}
                        />
                    </PopoverContent>
                </Popover>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Select value={expenseSortOption} onValueChange={(value) => setExpenseSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="card-shadow">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="font-semibold text-xl text-foreground">Add New Expense</CardTitle>
                      <CardDescription className="text-sm">Record money spent</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 md:p-6 md:pt-2">
                  <ExpenseForm />
                </CardContent>
              </Card>
              <Card className="card-shadow">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-semibold text-xl text-foreground">Expense History for {currentMonthYear}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-4 md:pt-0 lg:p-6 lg:pt-0">
                  <ScrollArea className="h-[280px] md:h-[380px] pr-3">
                    <TransactionList transactions={filteredExpensesForMonth} type="expense" sortOption={expenseSortOption} onDateClick={handleTransactionDateNavigation} groupBy={'none'}/>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeView === 'transfers' && (
           <div className="space-y-6">
            <div className="p-1 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Popover open={isCalendarOpen && activeView === 'transfers'} onOpenChange={(isOpen) => activeView === 'transfers' && setIsCalendarOpen(isOpen)}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-full sm:w-auto sm:min-w-[240px] justify-start text-left font-normal")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? `History for ${format(selectedDate, "MMMM yyyy")}` : <span>Pick a month</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            key={selectedDate ? `transfer-calendar-${selectedDate.toISOString()}` : 'no-date-transfer-tab'}
                            mode="single"
                            selected={selectedDate ?? undefined}
                            onSelect={handleDateSelect}
                            initialFocus
                            defaultMonth={selectedDate ?? undefined}
                            captionLayout="dropdown-buttons"
                            fromYear={calendarFromYear}
                            toYear={calendarToYear}
                        />
                    </PopoverContent>
                </Popover>
                 <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Select value={transferSortOption} onValueChange={(value) => setTransferSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="card-shadow">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Repeat className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="font-semibold text-xl text-foreground">Record New Transfer</CardTitle>
                      <CardDescription className="text-sm">Move money between accounts</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 md:p-6 md:pt-2">
                  <TransferForm />
                </CardContent>
              </Card>
              <Card className="card-shadow">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-semibold text-xl text-foreground">Transfer History for {currentMonthYear}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-4 md:pt-0 lg:p-6 lg:pt-0">
                   <ScrollArea className="h-[280px] md:h-[380px] pr-3">
                    <TransactionList transactions={filteredTransfersForMonth} type="transfer" sortOption={transferSortOption} onDateClick={handleTransactionDateNavigation} groupBy={'none'} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeView === 'debts' && (
          <div className="space-y-6">
            {/* Pending Debts Summary */}
            {(pendingDebtsLent.length > 0 || pendingDebtsBorrowed.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                <Card className="card-shadow gradient-card-orange">
                  <CardHeader className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-orange-600 dark:text-orange-400">Money Lent</CardTitle>
                        <CardDescription className="text-sm">People who owe you money</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                      ₹{totalPendingLent.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{pendingDebtsLent.length} pending transactions</p>
                  </CardContent>
                </Card>
                <Card className="card-shadow gradient-card-blue">
                  <CardHeader className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <UserX className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-blue-600 dark:text-blue-400">Money Borrowed</CardTitle>
                        <CardDescription className="text-sm">Money you owe to others</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      ₹{totalPendingBorrowed.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{pendingDebtsBorrowed.length} pending transactions</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="p-1 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Popover open={isCalendarOpen && activeView === 'debts'} onOpenChange={(isOpen) => activeView === 'debts' && setIsCalendarOpen(isOpen)}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full sm:w-auto sm:min-w-[240px] justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? `History for ${format(selectedDate, "MMMM yyyy")}` : <span>Pick a month</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    key={selectedDate ? `debt-calendar-${selectedDate.toISOString()}` : 'no-date-debt-tab'}
                    mode="single"
                    selected={selectedDate ?? undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                    defaultMonth={selectedDate ?? undefined}
                    captionLayout="dropdown-buttons"
                    fromYear={calendarFromYear}
                    toYear={calendarToYear}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Select value={debtSortOption} onValueChange={(value) => setDebtSortOption(value as SortOption)}>
                  <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                    <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                    <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                    <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="card-shadow">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="font-semibold text-xl text-foreground">Record New Debt/Loan</CardTitle>
                      <CardDescription>Track money lent to others or borrowed from others</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 md:p-6 md:pt-2">
                  <DebtForm />
                </CardContent>
              </Card>
              <Card className="card-shadow">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-semibold text-xl text-foreground">Debt History for {currentMonthYear}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-4 md:pt-0 lg:p-6 lg:pt-0">
                  <ScrollArea className="h-[280px] md:h-[380px] pr-3">
                    <TransactionList 
                      transactions={selectedDate ? debtEntries.filter(debt => {
                        const debtDate = parseISO(debt.date);
                        return debtDate.getMonth() === selectedDate.getMonth() && 
                               debtDate.getFullYear() === selectedDate.getFullYear();
                      }) : []} 
                      type="debt" 
                      sortOption={debtSortOption} 
                      onDateClick={handleTransactionDateNavigation} 
                      groupBy={'none'} 
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {activeView === 'data' && (
            <Card className="card-shadow">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="font-semibold text-xl text-foreground">Data Management</CardTitle>
                <CardDescription>Export your data for backup or import data from a previous backup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-4 md:p-6">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Export / Backup Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download all your income, expense, and transfer entries as a JSON file. Keep this file in a safe place.
                  </p>
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export Data
                  </Button>
                </div>
                <hr/>
                <div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Import Data</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Import data from a previously exported JSON file.
                  </p>
                  <div className="flex items-center p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/30 mb-3">
                     <AlertTriangle className="mr-3 h-6 w-6 flex-shrink-0" />
                     <div className="flex flex-col">
                       <h4 className="font-semibold text-sm">Important Warning</h4>
                       <p className="text-xs font-medium">
                         Importing will <strong className="font-bold">REPLACE ALL</strong> your current data. This action <strong className="font-bold">CANNOT BE UNDONE</strong>. Ensure you have a backup if needed.
                       </p>
                     </div>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Import Data
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportData}
                    accept=".json"
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Clear All Data</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    This will <strong>permanently delete</strong> all your income, expense, and transfer data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to permanently delete ALL your data? This cannot be undone.')) {
                        replaceAllIncome([]);
                        replaceAllExpenses([]);
                        replaceAllTransfers([]);
                        toast({ title: 'All data cleared', description: 'Your data has been permanently deleted.' });
                      }
                    }}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
        )}
      </main>

      <nav className="sticky bottom-0 bg-card/80 backdrop-blur-lg border-t border-border/60 z-20">
        <div className="container mx-auto flex justify-around items-center h-16 px-2">
          {tabItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveView(item.value)}
                className={cn(
                  "nav-tab flex-1 max-w-20",
                  isActive && "active"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 mb-1 transition-all duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

    
