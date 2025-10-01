
"use client";

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExpenseEntry, TransactionType, ExpenseCategoryBarChartProps as OriginalProps } from '@/lib/types';
import { formatCurrency, calculateTotal } from '@/lib/utils';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TransactionList } from './transaction-list';
import { ArrowLeft } from 'lucide-react';


const BAR_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--accent))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
];

interface ExpenseCategoryBarChartProps extends OriginalProps {}

export function ExpenseCategoryBarChart({
  expenses,
  title,
  onDateClick,
  chartMode = 'category',
  onCategoryClick,
  parentCategoryForSubcharts,
  onBackToCategoriesClick,
}: ExpenseCategoryBarChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [selectedSegmentKey, setSelectedSegmentKey] = useState<string | null>(null);
  const [transactionsForSelectedSegment, setTransactionsForSelectedSegment] = useState<ExpenseEntry[]>([]);

  const { chartData, allSegmentKeys, memoizedSegmentTotals, dynamicChartConfig } = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { chartData: [], allSegmentKeys: [], memoizedSegmentTotals: {}, dynamicChartConfig: {} };
    }

    const segmentTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const segmentKey = chartMode === 'category' ? expense.category : (expense.subcategory || '(No Subcategory)');
      segmentTotals[segmentKey] = (segmentTotals[segmentKey] || 0) + expense.amount;
    });

    const sortedSegmentKeys = Object.keys(segmentTotals).sort((a,b) => segmentTotals[b] - segmentTotals[a]);

    const config: ChartConfig = {};
    sortedSegmentKeys.forEach((key, index) => {
      config[key] = {
        label: key,
        color: BAR_COLORS[index % BAR_COLORS.length],
      };
    });
    config['value'] = { label: "Amount", color: "hsl(var(--chart-1))" };


    const finalChartData = sortedSegmentKeys.map(segmentKey => ({
      name: segmentKey,
      value: segmentTotals[segmentKey],
    }));

    return { chartData: finalChartData, allSegmentKeys: sortedSegmentKeys, memoizedSegmentTotals: segmentTotals, dynamicChartConfig: config };
  }, [expenses, chartMode]);


  const handleBarSegmentClick = (data: any) => {
    if (data && data.name) {
      const segmentName = data.name;
      if (chartMode === 'category' && onCategoryClick) {
        onCategoryClick(segmentName);
        return; 
      }

      setSelectedSegmentKey(segmentName);
      let filtered: ExpenseEntry[];
      if (chartMode === 'subcategory' && parentCategoryForSubcharts) {
        filtered = expenses
          .filter(exp => exp.category === parentCategoryForSubcharts && (exp.subcategory || '(No Subcategory)') === segmentName)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else {
        filtered = expenses
          .filter(exp => exp.category === segmentName)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      setTransactionsForSelectedSegment(filtered);
      setViewMode('list');
    }
  };

  const handleLegendClick = (e: any) => {
    if (e && e.payload && typeof e.payload.name === 'string') {
      handleBarSegmentClick({ name: e.payload.name });
    }
  };

  const legendFormatter = (value: string, entry: any): ReactNode => {
    const { color, payload } = entry;
    const itemName = payload?.name || value;
    let displayAmount = 0;

    if (payload && typeof payload.name === 'string' && memoizedSegmentTotals) {
        displayAmount = memoizedSegmentTotals[payload.name] || 0;
    } else if (typeof payload?.value === 'number') {
        displayAmount = payload.value;
    }

    return (
        <span style={{ color }} className="truncate max-w-[150px] inline-block" title={`${itemName} (${formatCurrency(displayAmount)})`}>
            {itemName} ({formatCurrency(displayAmount)})
        </span>
    );
  };


  const dynamicCardTitle = useMemo(() => {
    if (viewMode === 'list') {
      if (chartMode === 'subcategory' && parentCategoryForSubcharts && selectedSegmentKey) {
        return `Transactions for ${parentCategoryForSubcharts} / ${selectedSegmentKey}`;
      }
      return selectedSegmentKey ? `Transactions for ${selectedSegmentKey}` : title;
    }
    return title; 
  }, [viewMode, chartMode, parentCategoryForSubcharts, selectedSegmentKey, title]);


  if (viewMode === 'chart' && chartData.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="p-4 md:p-6">
           <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <CardTitle className="font-headline text-xl md:text-2xl">
              {title}
            </CardTitle>
            {chartMode === 'subcategory' && onBackToCategoriesClick && (
              <Button variant="outline" size="sm" onClick={onBackToCategoriesClick} className="w-full sm:w-auto self-start sm:self-center">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
           <p className="text-muted-foreground text-sm md:text-base py-4 text-center">
            {chartMode === 'subcategory' && parentCategoryForSubcharts
              ? `No subcategories found for ${parentCategoryForSubcharts}.`
              : "No expense data to display for this period."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-start gap-2">
          <CardTitle className="font-headline text-xl md:text-2xl">
            {dynamicCardTitle}
          </CardTitle>
          {viewMode === 'chart' && chartMode === 'subcategory' && onBackToCategoriesClick && (
            <Button variant="outline" size="sm" onClick={onBackToCategoriesClick} className="w-full sm:w-auto self-start sm:self-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {viewMode === 'chart' ? (
          <ChartContainer config={dynamicChartConfig} className="w-full h-[300px] md:h-[400px]">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 70 }}
              barGap={4}
              barSize={30}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-35}
                textAnchor="end"
                height={60}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent
                  hideLabel={true}
                  formatter={(value, name, item) => {
                    if (Number(value) === 0) {
                      return null;
                    }
                    const finalNameToShow = String(item.payload.name); 
                    return `${finalNameToShow}: ${formatCurrency(Number(value))}`;
                  }}
                />}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '12px', paddingTop: '15px', maxHeight: '70px', overflowY: 'auto', width: '100%' }}
                iconSize={10}
                onClick={handleLegendClick}
                payload={allSegmentKeys.map((segmentKey, index) => ({
                  id: segmentKey,
                  type: 'square',
                  value: segmentKey,
                  color: dynamicChartConfig[segmentKey]?.color || BAR_COLORS[index % BAR_COLORS.length],
                  payload: { name: segmentKey, value: memoizedSegmentTotals[segmentKey] }
                }))}
                formatter={legendFormatter}
              />
              <Bar dataKey="value" nameKey="name" radius={[4, 4, 0, 0]} onClick={(payload) => handleBarSegmentClick(payload)}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={dynamicChartConfig[entry.name]?.color || BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          selectedSegmentKey && (
            <div>
              <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(calculateTotal(transactionsForSelectedSegment))}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => {
                    setViewMode('chart');
                    setSelectedSegmentKey(null);
                  }}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Chart
                  </Button>
              </div>
              <ScrollArea className="h-[300px] md:h-[350px] pr-2">
                  <TransactionList transactions={transactionsForSelectedSegment} type="expense" onDateClick={onDateClick} />
              </ScrollArea>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
