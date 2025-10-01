"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Landmark, CreditCard, Combine, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAccountContext } from "@/contexts/account-context";
import { useAppContext } from "@/contexts/app-context";
import { AccountType } from "@/lib/account-types";

interface EnhancedBalanceBreakdownViewProps {
  walletBalance: number;
  bankBalance: number;
  ncmcBalance: number;
  isClient: boolean;
}

const AccountTypeIcon = ({ type }: { type: AccountType }) => {
  switch (type) {
    case 'wallet':
      return <Wallet className="h-4 w-4 text-green-600" />;
    case 'bank':
      return <Landmark className="h-4 w-4 text-blue-600" />;
    case 'ncmc':
      return <CreditCard className="h-4 w-4 text-purple-600" />;
    default:
      return <Wallet className="h-4 w-4 text-gray-600" />;
  }
};

export function EnhancedBalanceBreakdownView({ 
  walletBalance, 
  bankBalance, 
  ncmcBalance, 
  isClient 
}: EnhancedBalanceBreakdownViewProps) {
  const [showBalances, setShowBalances] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<AccountType, boolean>>({
    wallet: false,
    bank: false,
    ncmc: false,
  });
  
  const { accounts } = useAccountContext();
  const { getAccountBalance } = useAppContext();
  
  const totalNetBalance = walletBalance + bankBalance + ncmcBalance;
  const loadingPlaceholder = "₹--.--";
  const hiddenPlaceholder = "****";

  const toggleSection = (type: AccountType) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getAccountsByType = (type: AccountType) => {
    return accounts.filter(account => account.type === type && account.isActive !== false);
  };

  const getTotalBalanceForType = (type: AccountType) => {
    switch (type) {
      case 'wallet': return walletBalance;
      case 'bank': return bankBalance;
      case 'ncmc': return ncmcBalance;
      default: return 0;
    }
  };

  const balanceItemClasses = "bg-primary-foreground/10 p-4 rounded-lg shadow-sm transition-all hover:bg-primary-foreground/20";
  const titleClasses = "text-sm font-medium text-primary-foreground/80 mb-1 flex items-center";
  const amountClasses = "text-2xl font-bold text-primary-foreground";
  const subAccountClasses = "bg-primary-foreground/5 p-3 rounded-md border border-primary-foreground/10";

  const accountTypes: { type: AccountType; label: string; icon: React.ReactNode }[] = [
    { type: 'wallet', label: 'Wallets', icon: <Wallet className="h-5 w-5 mr-2 text-green-500" /> },
    { type: 'bank', label: 'Bank Accounts', icon: <Landmark className="h-5 w-5 mr-2 text-blue-500" /> },
    { type: 'ncmc', label: 'NCMC Cards', icon: <CreditCard className="h-5 w-5 mr-2 text-purple-500" /> },
  ];

  return (
    <Card className="card-shadow mb-6 md:mb-8 bg-primary text-primary-foreground">
      <CardHeader className="p-4 md:p-6 pb-3 md:pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-primary-foreground">Account Balances</CardTitle>
        <button
          type="button"
          aria-label={showBalances ? "Hide balances" : "Show balances"}
          className="ml-auto p-2 rounded hover:bg-primary-foreground/10 transition-colors"
          onClick={() => setShowBalances((v) => !v)}
        >
          {showBalances ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-4">
        
        {/* Total Balance */}
        <div className={cn(balanceItemClasses, "border-2 border-primary-foreground/30 bg-primary-foreground/15")}>
          <div className={titleClasses}>
            <Combine className="h-5 w-5 mr-2 text-primary-foreground/90" />
            <span>Total Net Balance</span>
          </div>
          <p className={cn(
            "text-3xl font-bold",
            !isClient || totalNetBalance === 0 ? 'text-primary-foreground' : totalNetBalance > 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {showBalances ? (isClient ? formatCurrency(totalNetBalance) : loadingPlaceholder) : hiddenPlaceholder}
          </p>
        </div>

        {/* Account Type Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accountTypes.map(({ type, label, icon }) => {
            const typeAccounts = getAccountsByType(type);
            const typeBalance = getTotalBalanceForType(type);
            const isExpanded = expandedSections[type];
            const hasMultipleAccounts = typeAccounts.length > 1;

            return (
              <div key={type} className={balanceItemClasses}>
                <div 
                  className={cn(
                    "flex items-center justify-between cursor-pointer",
                    hasMultipleAccounts && "hover:bg-primary-foreground/10 -m-2 p-2 rounded"
                  )}
                  onClick={() => hasMultipleAccounts && toggleSection(type)}
                >
                  <div className={titleClasses}>
                    {icon}
                    <span>{label}</span>
                    <span className="ml-1 text-xs">({typeAccounts.length})</span>
                  </div>
                  {hasMultipleAccounts && (
                    <div className="text-primary-foreground/60">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  )}
                </div>
                
                <p className={cn(amountClasses, typeBalance < 0 ? " text-red-400" : " text-green-500")}>
                  {showBalances ? (isClient ? formatCurrency(typeBalance) : loadingPlaceholder) : hiddenPlaceholder}
                </p>

                {/* Individual Accounts */}
                {hasMultipleAccounts && isExpanded && (
                  <div className="mt-3 space-y-2">
                    {typeAccounts.map((account, index) => {
                      const accountBalance = getAccountBalance(account.id);
                      return (
                        <div key={account.id} className={subAccountClasses}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center min-w-0">
                              <AccountTypeIcon type={account.type} />
                              <span className="ml-2 text-sm font-medium text-primary-foreground/90 truncate">
                                {account.name}
                              </span>
                              {account.isDefault && (
                                <span className="ml-2 text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className={cn(
                              "text-sm font-semibold",
                              accountBalance < 0 ? "text-red-400" : "text-green-500"
                            )}>
                              {showBalances ? (isClient ? formatCurrency(accountBalance) : loadingPlaceholder) : hiddenPlaceholder}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Single Account Details */}
                {!hasMultipleAccounts && typeAccounts.length === 1 && (
                  <div className="mt-2">
                    <div className="flex items-center text-sm text-primary-foreground/70">
                      <AccountTypeIcon type={typeAccounts[0].type} />
                      <span className="ml-2">{typeAccounts[0].name}</span>
                      {typeAccounts[0].isDefault && (
                        <span className="ml-2 text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}