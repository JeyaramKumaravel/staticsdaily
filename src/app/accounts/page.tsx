'use client';

import { useAccountContext } from '@/contexts/account-context';
import { useAppContext } from '@/contexts/app-context';
import { AccountManagement } from '@/components/pennywise/account-management';
import { calculateAccountBalance } from '@/lib/account-migration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AccountsPage() {
  const { 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount,
    isLoading 
  } = useAccountContext();
  
  const { 
    incomeEntries, 
    expenseEntries, 
    transferEntries, 
    debtEntries,
    getAccountBalance
  } = useAppContext();

  const calculateBalance = (accountId: string): number => {
    return getAccountBalance(accountId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {accounts.filter(a => a.type === 'wallet').length}
                </p>
                <p className="text-sm text-muted-foreground">Wallets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {accounts.filter(a => a.type === 'bank').length}
                </p>
                <p className="text-sm text-muted-foreground">Bank Accounts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {accounts.filter(a => a.type === 'ncmc').length}
                </p>
                <p className="text-sm text-muted-foreground">NCMC Cards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AccountManagement
        accounts={accounts}
        onAddAccount={addAccount}
        onUpdateAccount={updateAccount}
        onDeleteAccount={deleteAccount}
        getAccountBalance={calculateBalance}
      />
    </div>
  );
}