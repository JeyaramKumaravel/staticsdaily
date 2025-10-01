
"use client";

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IncomeEntry, TransactionType } from '@/lib/types';
import { formatCurrency, calculateTotal } from '@/lib/utils';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TransactionList } from './transaction-list';
import { ArrowLeft } from 'lucide-react';

const BAR_COLORS = [
  'hsl(var(--chart-2))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-5))',
];

interface IncomeSourceBarChartProps {
  income: IncomeEntry[];
  title: string;
  onDateClick?: (date: string, type: TransactionType) => void;
}

export function IncomeSourceBarChart({ income, title, onDateClick }: IncomeSourceBarChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [selectedSegmentKey, setSelectedSegmentKey] = useState<string | null>(null);
  const [transactionsForSelectedSegment, setTransactionsForSelectedSegment] = useState<IncomeEntry[]>([]);

  const { chartData, allSegmentKeys, memoizedSegmentTotals, dynamicChartConfig } = useMemo(() => {
    if (!income || income.length === 0) {
      return { chartData: [], allSegmentKeys: [], memoizedSegmentTotals: {}, dynamicChartConfig: {} };
    }

    const segmentTotals: { [key: string]: number } = {};
    income.forEach(entry => {
      const segmentKey = entry.source.charAt(0).toUpperCase() + entry.source.slice(1); // 'Wallet' or 'Bank'
      segmentTotals[segmentKey] = (segmentTotals[segmentKey] || 0) + entry.amount;
    });

    const sortedSegmentKeys = Object.keys(segmentTotals).sort((a, b) => segmentTotals[b] - segmentTotals[a]);

    const config: ChartConfig = {};
    sortedSegmentKeys.forEach((key, index) => {
      config[key] = {
        label: key,
        color: BAR_COLORS[index % BAR_COLORS.length],
      };
    });
    // 'value' key in config is for the simple bar chart's dataKey if not using individual segment keys for colors
    config['value'] = { label: "Amount", color: "hsl(var(--chart-1))" };


    const finalChartData = sortedSegmentKeys.map(segmentKey => ({
      name: segmentKey, // e.g., 'Wallet', 'Bank'
      value: segmentTotals[segmentKey],
    }));

    return { chartData: finalChartData, allSegmentKeys: sortedSegmentKeys, memoizedSegmentTotals: segmentTotals, dynamicChartConfig: config };
  }, [income]);


  const handleBarClick = (data: any) => {
    if (data && data.name) {
      const segmentToFilter = data.name; // This will be 'Wallet' or 'Bank'
      setSelectedSegmentKey(segmentToFilter);
      const filtered = income
        .filter(inc => (inc.source.charAt(0).toUpperCase() + inc.source.slice(1)) === segmentToFilter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactionsForSelectedSegment(filtered);
      setViewMode('list');
    }
  };

  const handleLegendClick = (e: any) => {
    if (e && e.payload && typeof e.payload.name === 'string') {
      handleBarClick({ name: e.payload.name });
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

  const cardTitle = viewMode === 'chart' ? title :
    (selectedSegmentKey ? `Transactions for ${selectedSegmentKey}` : title);

  if (viewMode === 'chart' && chartData.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="font-headline text-xl md:text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <p className="text-muted-foreground text-sm md:text-base py-4 text-center">No income data to display for this period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="font-headline text-xl md:text-2xl">{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {viewMode === 'chart' ? (
          <ChartContainer config={dynamicChartConfig} className="w-full h-[300px] md:h-[400px]">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 70 }}
              barGap={4}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={0} // Simplified for non-stacked
                textAnchor={"middle"} // Simplified
                height={30} // Simplified
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
                    // For simple bar chart, item.payload.name contains the X-axis category name
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
                  payload: { name: segmentKey, value: memoizedSegmentTotals[segmentKey] },
                }))}
                formatter={legendFormatter}
              />
              <Bar dataKey="value" nameKey="name" radius={[4, 4, 0, 0]} onClick={(payload) => handleBarClick(payload)}>
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
                  <Button variant="outline" size="sm" onClick={() => setViewMode('chart')}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Chart
                  </Button>
              </div>
              <ScrollArea className="h-[300px] md:h-[350px] pr-2">
                  <TransactionList transactions={transactionsForSelectedSegment} type="income" onDateClick={onDateClick} />
              </ScrollArea>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
