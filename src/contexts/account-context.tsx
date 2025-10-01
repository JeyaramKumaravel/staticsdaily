'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Account, DEFAULT_ACCOUNTS } from '@/lib/account-types';
import { v4 as uuidv4 } from 'uuid';

interface AccountContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getAccount: (id: string) => Account | undefined;
  getAccountsByType: (type: Account['type']) => Account[];
  getDefaultAccount: (type: Account['type']) => Account | undefined;
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function useAccountContext() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccountContext must be used within an AccountProvider');
  }
  return context;
}

interface AccountProviderProps {
  children: ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load accounts from localStorage on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        // Check if migration is needed and perform it
        const { AccountMigration } = await import('@/lib/account-migration');
        await AccountMigration.performMigration();
        
        const stored = localStorage.getItem('pennywise-accounts');
        if (stored) {
          const parsedAccounts = JSON.parse(stored);
          setAccounts(parsedAccounts);
        } else {
          // Initialize with default accounts for new users
          const defaultAccounts: Account[] = DEFAULT_ACCOUNTS.map((account) => ({
            ...account,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setAccounts(defaultAccounts);
          localStorage.setItem('pennywise-accounts', JSON.stringify(defaultAccounts));
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        // Fallback to default accounts
        const defaultAccounts: Account[] = DEFAULT_ACCOUNTS.map((account) => ({
          ...account,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setAccounts(defaultAccounts);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  // Save accounts to localStorage whenever accounts change
  useEffect(() => {
    if (!isLoading && accounts.length > 0) {
      localStorage.setItem('pennywise-accounts', JSON.stringify(accounts));
    }
  }, [accounts, isLoading]);

  const addAccount = (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...accountData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If this is set as default, remove default from other accounts of the same type
    if (accountData.isDefault) {
      setAccounts(prev => prev.map(account => 
        account.type === accountData.type 
          ? { ...account, isDefault: false, updatedAt: new Date().toISOString() }
          : account
      ));
    }

    setAccounts(prev => [...prev, newAccount]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(account => {
      if (account.id === id) {
        const updatedAccount = {
          ...account,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // If setting as default, remove default from other accounts of the same type
        if (updates.isDefault) {
          setAccounts(prevAccounts => prevAccounts.map(acc => 
            acc.type === account.type && acc.id !== id
              ? { ...acc, isDefault: false, updatedAt: new Date().toISOString() }
              : acc
          ));
        }

        return updatedAccount;
      }
      return account;
    }));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
  };

  const getAccount = (id: string) => {
    return accounts.find(account => account.id === id);
  };

  const getAccountsByType = (type: Account['type']) => {
    return accounts.filter(account => account.type === type && account.isActive !== false);
  };

  const getDefaultAccount = (type: Account['type']) => {
    return accounts.find(account => account.type === type && account.isDefault && account.isActive !== false);
  };

  const value: AccountContextType = {
    accounts: accounts.filter(account => account.isActive !== false),
    addAccount,
    updateAccount,
    deleteAccount,
    getAccount,
    getAccountsByType,
    getDefaultAccount,
    isLoading,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}