"use client";

import type { ReactNode } from 'react';
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { calculateTotal, formatCurrency, formatDate } from "@/lib/utils";
import type { IncomeEntry, ExpenseEntry } from "@/lib/types";
import type { ActivePeriodType } from '@/app/page';
import { TrendingUp, TrendingDown, CalendarDays, Menu, CalendarIcon } from "lucide-react";
import { 
  format, 
  parseISO, 
  isValid, 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  isSameYear 
} from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppContext } from "@/contexts/app-context";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface PeriodSummaryCardProps {
  period: ActivePeriodType;
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  referenceDate: Date | null;
  customStartDate?: Date | null;
  customEndDate?: Date | null;
  onBarClick?: (type: 'income' | 'expenses') => void;
}

function PeriodSummaryCard({ period, income, expenses, referenceDate, customStartDate, customEndDate, onBarClick }: PeriodSummaryCardProps) {
  const totalIncome = calculateTotal(income);
  const totalExpenses = calculateTotal(expenses);

  const chartData = useMemo(() => {
    let label = "";
     if (period === 'allTime') {
        label = "All Time";
    } else if (period === 'custom') {
        if (customStartDate && customEndDate && isValid(customStartDate) && isValid(customEndDate)) {
            label = `${format(customStartDate, "MMM d")} - ${format(customEndDate, "MMM d, yy")}`;
        } else {
            label = "Custom Range";
        }
    } else if (!referenceDate || !(referenceDate instanceof Date) || isNaN(referenceDate.getTime())) {
        return [{ name: "Loading...", income: 0, expenses: 0 }];
    } else if (period === 'daily') {
        label = referenceDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else if (period === 'weekly') {
        const startOfWeekDate = new Date(referenceDate);
        startOfWeekDate.setDate(referenceDate.getDate() - referenceDate.getDay() + (referenceDate.getDay() === 0 ? -6 : 1)); // Adjust to Monday
        label = `Week of ${startOfWeekDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    } else if (period === 'monthly') {
        label = referenceDate.toLocaleDateString(undefined, { month: 'long' });
    } else if (period === 'yearly') {
        label = referenceDate.getFullYear().toString();
    } else {
        label = period.charAt(0).toUpperCase() + period.slice(1);
    }
    return [{ name: label, income: totalIncome, expenses: totalExpenses }];
  }, [period, totalIncome, totalExpenses, referenceDate, customStartDate, customEndDate]);

  const cardTitleLabel = useMemo(() => {
    if (period === 'allTime') return "All Time Financial Overview";
    if (period === 'custom') {
      if (customStartDate && customEndDate && isValid(customStartDate) && isValid(customEndDate)) {
        return `Overview for ${formatDate(customStartDate.toISOString())} - ${formatDate(customEndDate.toISOString())}`;
      }
      return "Custom Range Overview";
    }
    if (!referenceDate || !(referenceDate instanceof Date) || isNaN(referenceDate.getTime())) return "Overview";

    switch(period) {
      case 'daily': return `Daily Overview for ${formatDate(referenceDate.toISOString())}`;
      case 'weekly':
        const startOfWeekDate = new Date(referenceDate);
        startOfWeekDate.setDate(referenceDate.getDate() - referenceDate.getDay() + (referenceDate.getDay() === 0 ? -6 : 1));
        return `Weekly Overview (Week of ${formatDate(startOfWeekDate.toISOString())})`;
      case 'monthly': return `Monthly Overview for ${referenceDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
      case 'yearly': return `Yearly Overview for ${referenceDate.getFullYear()}`;
      default: return `${period.charAt(0).toUpperCase() + period.slice(1)} Overview`;
    }
  }, [period, referenceDate, customStartDate, customEndDate]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="card-shadow hover:border-green-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(totalIncome)}</div>
        </CardContent>
      </Card>
      <Card className="card-shadow hover:border-red-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          <TrendingDown className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-red-600 dark:text-red-500">{formatCurrency(totalExpenses)}</div>
        </CardContent>
      </Card>
      
      { (totalIncome > 0 || totalExpenses > 0) && (
        <Card className="md:col-span-2 card-shadow">
          <CardHeader className="p-4">
            <CardTitle className="text-base font-medium text-foreground">{cardTitleLabel}</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full p-4 pt-0">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <BarChart data={chartData} accessibilityLayer barGap={6}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                  content={<ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[6, 6, 0, 0]} onClick={onBarClick ? () => onBarClick('income') : undefined} cursor={onBarClick ? "pointer" : "default"} barSize={25} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[6, 6, 0, 0]} onClick={onBarClick ? () => onBarClick('expenses') : undefined} cursor={onBarClick ? "pointer" : "default"} barSize={25}/>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SummaryViewProps {
  allIncomeEntries: IncomeEntry[];
  allExpenseEntries: ExpenseEntry[];
  activePeriod: ActivePeriodType;
  onActivePeriodChange: (period: ActivePeriodType) => void;
  referenceDate: Date | null; 
  customStartDate: Date | null;
  customEndDate: Date | null;
  customRangeIncome: IncomeEntry[];
  customRangeExpenses: ExpenseEntry[];
  onShowBreakdown?: (type: 'income' | 'expenses') => void;
  selectedDateForCalendar: Date | null;
  onCalendarDateSelect: (date: Date | undefined) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (isOpen: boolean) => void;
  calendarFromYear: number;
  calendarToYear: number;
  isClient: boolean;
}

const periodTabItems: { value: ActivePeriodType; label: string | ReactNode }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: <span className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4" /> Custom</span> },
  { value: 'allTime', label: 'All Time' },
];

export function SummaryView({
  allIncomeEntries,
  allExpenseEntries,
  activePeriod,
  onActivePeriodChange,
  referenceDate,
  customStartDate,
  customEndDate,
  customRangeIncome,
  customRangeExpenses,
  onShowBreakdown,
  selectedDateForCalendar,
  onCalendarDateSelect,
  isCalendarOpen,
  setIsCalendarOpen,
  calendarFromYear,
  calendarToYear,
  isClient,
}: SummaryViewProps) {
  const isMobile = useIsMobile();
  const { walletBalance, bankBalance, ncmcBalance } = useAppContext();

  const dailyIncome = useMemo(
    () => referenceDate ? calculateTotal(allIncomeEntries.filter(entry => isValid(parseISO(entry.date)) && isSameDay(parseISO(entry.date), referenceDate))) : 0,
    [allIncomeEntries, referenceDate]
  );
  const dailyExpenses = useMemo(
    () => referenceDate ? calculateTotal(allExpenseEntries.filter(entry => isValid(parseISO(entry.date)) && isSameDay(parseISO(entry.date), referenceDate))) : 0,
    [allExpenseEntries, referenceDate]
  );

  const weeklyIncome = useMemo(
    () => referenceDate ? calculateTotal(allIncomeEntries.filter(entry => isValid(parseISO(entry.date)) && isSameWeek(parseISO(entry.date), referenceDate, {weekStartsOn: 1}))) : 0,
    [allIncomeEntries, referenceDate]
  );
  const weeklyExpenses = useMemo(
    () => referenceDate ? calculateTotal(allExpenseEntries.filter(entry => isValid(parseISO(entry.date)) && isSameWeek(parseISO(entry.date), referenceDate, {weekStartsOn: 1}))) : 0,
    [allExpenseEntries, referenceDate]
  );

  const monthlyIncome = useMemo(
    () => referenceDate ? calculateTotal(allIncomeEntries.filter(entry => isValid(parseISO(entry.date)) && isSameMonth(parseISO(entry.date), referenceDate))) : 0,
    [allIncomeEntries, referenceDate]
  );
  const monthlyExpenses = useMemo(
    () => referenceDate ? calculateTotal(allExpenseEntries.filter(entry => isValid(parseISO(entry.date)) && isSameMonth(parseISO(entry.date), referenceDate))) : 0,
    [allExpenseEntries, referenceDate]
  );

  const yearlyIncome = useMemo(
    () => referenceDate ? calculateTotal(allIncomeEntries.filter(entry => isValid(parseISO(entry.date)) && isSameYear(parseISO(entry.date), referenceDate))) : 0,
    [allIncomeEntries, referenceDate]
  );
  const yearlyExpenses = useMemo(
    () => referenceDate ? calculateTotal(allExpenseEntries.filter(entry => isValid(parseISO(entry.date)) && isSameYear(parseISO(entry.date), referenceDate))) : 0,
    [allExpenseEntries, referenceDate]
  );
  
  const currentPeriodLabel = useMemo(() => {
    const currentItem = periodTabItems.find(item => item.value === activePeriod);
    if (currentItem) {
        if (typeof currentItem.label === 'string') return currentItem.label;
        if (currentItem.value === 'custom') return 'Custom Range'; 
    }
    return 'Select Period';
  }, [activePeriod]);

  const showMainDatePicker = activePeriod !== 'allTime' && activePeriod !== 'custom';

  return (
    <Card className="w-full card-shadow mb-6 md:mb-8">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-lg font-semibold text-primary">Financial Summary</CardTitle>
            {showMainDatePicker && isClient && (
                <Popover open={isCalendarOpen && showMainDatePicker} onOpenChange={(isOpen) => showMainDatePicker && setIsCalendarOpen(isOpen)}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        size="sm"
                        className={cn(
                        "w-full sm:w-auto sm:min-w-[180px] justify-start text-left font-normal text-xs",
                        !selectedDateForCalendar && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {selectedDateForCalendar ? format(selectedDateForCalendar, "dd MMM, yyyy") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={selectedDateForCalendar ?? undefined}
                            onSelect={onCalendarDateSelect}
                            initialFocus
                            defaultMonth={selectedDateForCalendar ?? undefined}
                            captionLayout="dropdown-buttons"
                            fromYear={calendarFromYear}
                            toYear={calendarToYear}
                        />
                    </PopoverContent>
                </Popover>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <Tabs
          value={activePeriod}
          onValueChange={(value) => onActivePeriodChange(value as ActivePeriodType)}
          className="w-full"
        >
          <div className="mb-4">
            {isClient && isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-center text-sm py-2 h-auto">
                    <Menu className="mr-2 h-4 w-4" />
                    <span>{currentPeriodLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(var(--radix-dropdown-menu-trigger-width)-2px)] sm:w-56" align="start">
                  {periodTabItems.map((tab) => (
                    <DropdownMenuItem 
                      key={tab.value} 
                      onSelect={() => onActivePeriodChange(tab.value)}
                      className={cn("py-2 text-sm", activePeriod === tab.value && "bg-accent text-accent-foreground")}
                    >
                      {tab.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-secondary/70 rounded-lg">
                {periodTabItems.map((tab) => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className={cn(
                        "text-xs sm:text-sm py-1.5 px-2 rounded-md transition-colors duration-200 ease-out",
                        "data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm", // Updated active state
                        "hover:text-primary/80"
                      )}
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
              </TabsList>
            )}
          </div>
          
          <TabsContent value="daily">
            <PeriodSummaryCard period="daily" income={allIncomeEntries.filter(e => isValid(parseISO(e.date)) && isSameDay(parseISO(e.date), referenceDate!))} expenses={allExpenseEntries.filter(e => isValid(parseISO(e.date)) && isSameDay(parseISO(e.date), referenceDate!))} referenceDate={referenceDate} onBarClick={onShowBreakdown} />
          </TabsContent>
          <TabsContent value="weekly">
            <PeriodSummaryCard period="weekly" income={allIncomeEntries.filter(e => isValid(parseISO(e.date)) && isSameWeek(parseISO(e.date), referenceDate!, {weekStartsOn:1}))} expenses={allExpenseEntries.filter(e => isValid(parseISO(e.date)) && isSameWeek(parseISO(e.date), referenceDate!, {weekStartsOn:1}))} referenceDate={referenceDate} onBarClick={onShowBreakdown} />
          </TabsContent>
          <TabsContent value="monthly">
            <PeriodSummaryCard period="monthly" income={allIncomeEntries.filter(e => isValid(parseISO(e.date)) && isSameMonth(parseISO(e.date), referenceDate!))} expenses={allExpenseEntries.filter(e => isValid(parseISO(e.date)) && isSameMonth(parseISO(e.date), referenceDate!))} referenceDate={referenceDate} onBarClick={onShowBreakdown} />
          </TabsContent>
          <TabsContent value="yearly">
            <PeriodSummaryCard period="yearly" income={allIncomeEntries.filter(e => isValid(parseISO(e.date)) && isSameYear(parseISO(e.date), referenceDate!))} expenses={allExpenseEntries.filter(e => isValid(parseISO(e.date)) && isSameYear(parseISO(e.date), referenceDate!))} referenceDate={referenceDate} onBarClick={onShowBreakdown} />
          </TabsContent>
          <TabsContent value="custom">
            <PeriodSummaryCard
                period="custom"
                income={customRangeIncome}
                expenses={customRangeExpenses}
                referenceDate={referenceDate}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onBarClick={onShowBreakdown}
            />
          </TabsContent>
          <TabsContent value="allTime">
            <PeriodSummaryCard period="allTime" income={allIncomeEntries} expenses={allExpenseEntries} referenceDate={referenceDate} onBarClick={onShowBreakdown} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
    

    
