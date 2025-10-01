
"use client";

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IncomeEntry, TransactionType } from '@/lib/types';
import { formatCurrency, calculateTotal } from '@/lib/utils';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TransactionList } from './transaction-list';
import { ArrowLeft } from 'lucide-react';

const PIE_COLORS = [
  'hsl(var(--chart-2))',
  'hsl(var(--chart-4))',
  'hsl(var(--primary))',
  'hsl(var(--accent))',
];

interface IncomeSourcePieChartProps {
  income: IncomeEntry[];
  title: string;
  onDateClick?: (date: string, type: TransactionType) => void;
}

interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomizedLabelProps) => {
  if (percent < 0.05) {
    return null;
  }
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--primary-foreground))"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="10px"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function IncomeSourcePieChart({ income, title, onDateClick }: IncomeSourcePieChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [selectedSegmentName, setSelectedSegmentName] = useState<string | null>(null);
  const [transactionsForSelectedSegment, setTransactionsForSelectedSegment] = useState<IncomeEntry[]>([]);

  const chartData = useMemo(() => {
    if (!income || income.length === 0) {
      return [];
    }
    const sourceTotals: { [key: string]: number } = {};
    income.forEach(entry => {
      const sourceName = entry.source.charAt(0).toUpperCase() + entry.source.slice(1);
      sourceTotals[sourceName] = (sourceTotals[sourceName] || 0) + entry.amount;
    });

    return Object.entries(sourceTotals).map(([name, value]) => ({
      name,
      value,
    })).sort((a,b) => b.value - a.value);
  }, [income]);

  const dynamicChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    });
    return config;
  }, [chartData]);

  const handlePieClick = (data: any) => {
    const segmentName = data.name; // This will be 'Wallet' or 'Bank'
    setSelectedSegmentName(segmentName);
    const filtered = income
      .filter(inc => (inc.source.charAt(0).toUpperCase() + inc.source.slice(1)) === segmentName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactionsForSelectedSegment(filtered);
    setViewMode('list');
  };

  const handleLegendClick = (e: any) => {
    if (e.payload && e.payload.name) {
      handlePieClick({ name: e.payload.name });
    }
  };

  const legendFormatter = (value: string, entry: any) => {
    const { color, payload } = entry;
    if (payload && typeof payload.value === 'number') {
      return <span style={{ color }}>{value} ({formatCurrency(payload.value)})</span>;
    }
    return <span style={{ color }}>{value}</span>;
  };

  const cardTitle = viewMode === 'chart' ? title :
    (selectedSegmentName ? `Transactions for ${selectedSegmentName}` : title);

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
      <CardContent className="pb-4 p-4 pt-2 md:p-6 md:pt-2">
        {viewMode === 'chart' && (
          <ChartContainer config={dynamicChartConfig} className="w-full h-[280px] md:h-[350px]">
            <PieChart margin={{ top: 5, right: 5, bottom: 40, left: 5 }}>
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px', maxHeight: '70px', overflowY: 'auto' }}
                iconSize={10}
                formatter={legendFormatter}
                onClick={handleLegendClick}
                payload={chartData.map((item, index) => ({
                  id: item.name,
                  type: 'square',
                  value: item.name,
                  color: PIE_COLORS[index % PIE_COLORS.length],
                  payload: item,
                }))}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                paddingAngle={1}
                onClick={handlePieClick}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={1}/>
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        {viewMode === 'list' && selectedSegmentName && (
          <div>
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(calculateTotal(transactionsForSelectedSegment))}
                </p>
                <Button variant="outline" size="sm" onClick={() => setViewMode('chart')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Chart
                </Button>
            </div>
            <ScrollArea className="h-[250px] md:h-[300px] pr-2">
                <TransactionList transactions={transactionsForSelectedSegment} type="income" onDateClick={onDateClick} />
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
