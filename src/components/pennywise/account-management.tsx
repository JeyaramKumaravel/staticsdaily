'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Wallet, Landmark, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Account, AccountType, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS } from '@/lib/account-types';
import { AccountForm } from './account-form';
import { formatCurrency } from '@/lib/utils';

interface AccountManagementProps {
  accounts: Account[];
  onAddAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAccount: (id: string, account: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
  getAccountBalance: (accountId: string) => number;
}

const AccountIcon = ({ type }: { type: AccountType }) => {
  switch (type) {
    case 'wallet':
      return <Wallet className="h-5 w-5 text-green-600" />;
    case 'bank':
      return <Landmark className="h-5 w-5 text-blue-600" />;
    case 'ncmc':
      return <CreditCard className="h-5 w-5 text-purple-600" />;
    default:
      return <Wallet className="h-5 w-5 text-gray-600" />;
  }
};

export function AccountManagement({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  getAccountBalance,
}: AccountManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  const handleAddAccount = (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    onAddAccount(accountData);
    setIsAddDialogOpen(false);
  };

  const handleUpdateAccount = (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingAccount) {
      onUpdateAccount(editingAccount.id, accountData);
      setEditingAccount(null);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      onDeleteAccount(accountId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Account Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <AccountForm
              onSubmit={handleAddAccount}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AccountIcon type={type as AccountType} />
              {ACCOUNT_TYPE_LABELS[type as AccountType]}s
              <Badge variant="secondary">{typeAccounts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {typeAccounts.map((account) => {
                const balance = getAccountBalance(account.id);
                return (
                  <Card key={account.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{account.name}</h3>
                            {account.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className={`text-lg font-semibold ${
                            balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(balance)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAccount(account)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                            disabled={account.isDefault}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Account Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <AccountForm
              initialData={editingAccount}
              onSubmit={handleUpdateAccount}
              onCancel={() => setEditingAccount(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}