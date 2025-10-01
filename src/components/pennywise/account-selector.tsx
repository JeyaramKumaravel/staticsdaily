'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccountContext } from '@/contexts/account-context';
import { Account, AccountType, ACCOUNT_TYPE_ICONS } from '@/lib/account-types';
import { Wallet, Landmark, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AccountSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  filterType?: AccountType;
  excludeAccountId?: string;
  showBalance?: boolean;
  getAccountBalance?: (accountId: string) => number;
}

const AccountIcon = ({ type }: { type: AccountType }) => {
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

export function AccountSelector({
  value,
  onValueChange,
  placeholder = "Select account",
  filterType,
  excludeAccountId,
  showBalance = false,
  getAccountBalance,
}: AccountSelectorProps) {
  const { accounts, getAccount } = useAccountContext();

  const filteredAccounts = accounts.filter(account => {
    if (filterType && account.type !== filterType) return false;
    if (excludeAccountId && account.id === excludeAccountId) return false;
    return account.isActive !== false;
  });

  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  const selectedAccount = value ? getAccount(value) : undefined;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {selectedAccount && (
            <div className="flex items-center gap-2">
              <AccountIcon type={selectedAccount.type} />
              <span>{selectedAccount.name}</span>
              {showBalance && getAccountBalance && (
                <span className="text-sm text-muted-foreground ml-auto">
                  {formatCurrency(getAccountBalance(selectedAccount.id))}
                </span>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
          <div key={type}>
            {Object.keys(groupedAccounts).length > 1 && (
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                {type === 'wallet' ? 'Wallets' : type === 'bank' ? 'Bank Accounts' : 'NCMC Cards'}
              </div>
            )}
            {typeAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <AccountIcon type={account.type} />
                    <span>{account.name}</span>
                    {account.isDefault && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  {showBalance && getAccountBalance && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatCurrency(getAccountBalance(account.id))}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}