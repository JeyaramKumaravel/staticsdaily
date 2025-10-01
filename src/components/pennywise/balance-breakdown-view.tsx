"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Landmark, Combine, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { useState } from "react";

interface BalanceBreakdownViewProps {
  walletBalance: number;
  bankBalance: number;
  ncmcBalance: number;
  isClient: boolean;
}

export function BalanceBreakdownView({ walletBalance, bankBalance, ncmcBalance, isClient }: BalanceBreakdownViewProps) {
  const [showBalances, setShowBalances] = useState(true);
  const totalNetBalance = walletBalance + bankBalance + ncmcBalance;
  const loadingPlaceholder = "₹--.--";
  const hiddenPlaceholder = "****";

  // Updated to look like inner elements on a primary background card
  const balanceItemClasses = "bg-primary-foreground/10 p-4 rounded-lg shadow-sm transition-all hover:bg-primary-foreground/20";
  const titleClasses = "text-sm font-medium text-primary-foreground/80 mb-1 flex items-center";
  const amountClasses = "text-3xl font-bold text-primary-foreground";

  return (
    <Card className="card-shadow mb-6 md:mb-8 bg-primary text-primary-foreground">
      <CardHeader className="p-4 md:p-6 pb-3 md:pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-primary-foreground">Current Balances</CardTitle>
        <button
          type="button"
          aria-label={showBalances ? "Hide balances" : "Show balances"}
          className="ml-auto p-2 rounded hover:bg-primary-foreground/10 transition-colors"
          onClick={() => setShowBalances((v) => !v)}
        >
          {showBalances ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className={balanceItemClasses + " border border-primary-foreground/10 hover:border-primary-foreground/30 transition-all"}>
          <div className={titleClasses}>
            <Tooltip content="Your cash or digital wallet balance">
              <Wallet className="h-5 w-5 mr-2 text-blue-500" />
            </Tooltip>
            <span>Wallet</span>
          </div>
          <p className={amountClasses + (walletBalance < 0 ? " text-red-400" : " text-green-500") }>
            {showBalances ? (isClient ? formatCurrency(walletBalance) : loadingPlaceholder) : hiddenPlaceholder}
          </p>
        </div>

        <div className={balanceItemClasses + " border border-primary-foreground/10 hover:border-primary-foreground/30 transition-all"}>
          <div className={titleClasses}>
            <Tooltip content="Your bank account balance">
              <Landmark className="h-5 w-5 mr-2 text-purple-500" />
            </Tooltip>
            <span>Bank</span>
          </div>
          <p className={amountClasses + (bankBalance < 0 ? " text-red-400" : " text-green-500") }>
            {showBalances ? (isClient ? formatCurrency(bankBalance) : loadingPlaceholder) : hiddenPlaceholder}
          </p>
        </div>
        
        <div className={balanceItemClasses + " border border-primary-foreground/10 hover:border-primary-foreground/30 transition-all"}>
          <div className={titleClasses}>
            <Tooltip content="Your NCMC card balance">
              <span className="h-5 w-5 mr-2 text-orange-500">🏦</span>
            </Tooltip>
            <span>NCMC</span>
          </div>
          <p className={amountClasses + (ncmcBalance < 0 ? " text-red-400" : " text-green-500") }>
            {showBalances ? (isClient ? formatCurrency(ncmcBalance) : loadingPlaceholder) : hiddenPlaceholder}
          </p>
        </div>

        <div className={cn(balanceItemClasses, "md:col-span-1 border-2 border-primary-foreground/30 bg-primary-foreground/10")}>
           <div className={titleClasses}>
            <Tooltip content="Sum of all balances">
              <Combine className="h-5 w-5 mr-2 text-primary-foreground/90" />
            </Tooltip>
            <span>Total Net</span>
          </div>
          <p className={cn(
            amountClasses, 
            !isClient || totalNetBalance === 0 ? 'text-primary-foreground' : totalNetBalance > 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {showBalances ? (isClient ? formatCurrency(totalNetBalance) : loadingPlaceholder) : hiddenPlaceholder}
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
