import { Account, DEFAULT_ACCOUNTS } from './account-types';
import { TransactionSource } from './types';
import { v4 as uuidv4 } from 'uuid';

// Migration utility to convert old transaction sources to account IDs
export class AccountMigration {
  private static accountMap: Map<TransactionSource, string> = new Map();

  // Initialize default accounts and create mapping
  static initializeDefaultAccounts(): Account[] {
    const defaultAccounts: Account[] = DEFAULT_ACCOUNTS.map((account) => ({
      ...account,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Create mapping from old source types to new account IDs
    defaultAccounts.forEach(account => {
      switch (account.type) {
        case 'wallet':
          this.accountMap.set('wallet', account.id);
          break;
        case 'bank':
          this.accountMap.set('bank', account.id);
          break;
        case 'ncmc':
          this.accountMap.set('NCMC', account.id);
          break;
      }
    });

    return defaultAccounts;
  }

  // Convert old transaction source to account ID
  static getAccountIdFromSource(source: TransactionSource): string | null {
    return this.accountMap.get(source) || null;
  }

  // Get account ID for a specific source type
  static getAccountIdForType(accounts: Account[], sourceType: TransactionSource): string | null {
    const accountType = sourceType === 'NCMC' ? 'ncmc' : sourceType;
    const account = accounts.find(acc => acc.type === accountType && acc.isDefault);
    return account?.id || null;
  }

  // Check if migration is needed
  static isMigrationNeeded(): boolean {
    const accounts = localStorage.getItem('pennywise-accounts');
    return !accounts; // If no accounts exist, migration is needed
  }

  // Perform migration
  static async performMigration(): Promise<void> {
    if (!this.isMigrationNeeded()) {
      return;
    }

    console.log('Performing account migration...');
    
    // Initialize default accounts
    const defaultAccounts = this.initializeDefaultAccounts();
    
    // Save to localStorage
    localStorage.setItem('pennywise-accounts', JSON.stringify(defaultAccounts));
    
    // Migrate existing transactions to use account IDs
    this.migrateExistingTransactions(defaultAccounts);
    
    console.log('Account migration completed');
  }

  // Migrate existing transactions to use account IDs
  static migrateExistingTransactions(accounts: Account[]): void {
    try {
      // Migrate income entries
      const incomeEntries = JSON.parse(localStorage.getItem('pennywise-income') || '[]');
      const migratedIncome = incomeEntries.map((entry: any) => {
        if (!entry.accountId) {
          const accountId = this.getAccountIdForType(accounts, entry.source);
          return { ...entry, accountId };
        }
        return entry;
      });
      localStorage.setItem('pennywise-income', JSON.stringify(migratedIncome));

      // Migrate expense entries
      const expenseEntries = JSON.parse(localStorage.getItem('pennywise-expenses') || '[]');
      const migratedExpenses = expenseEntries.map((entry: any) => {
        if (!entry.accountId) {
          const accountId = this.getAccountIdForType(accounts, entry.source);
          return { ...entry, accountId };
        }
        return entry;
      });
      localStorage.setItem('pennywise-expenses', JSON.stringify(migratedExpenses));

      // Migrate transfer entries
      const transferEntries = JSON.parse(localStorage.getItem('pennywise-transfers') || '[]');
      const migratedTransfers = transferEntries.map((entry: any) => {
        if (!entry.fromAccountId || !entry.toAccountId) {
          const fromAccountId = this.getAccountIdForType(accounts, entry.fromSource);
          const toAccountId = this.getAccountIdForType(accounts, entry.toSource);
          return { ...entry, fromAccountId, toAccountId };
        }
        return entry;
      });
      localStorage.setItem('pennywise-transfers', JSON.stringify(migratedTransfers));

      // Migrate debt entries
      const debtEntries = JSON.parse(localStorage.getItem('pennywise-debts') || '[]');
      const migratedDebts = debtEntries.map((entry: any) => {
        if (!entry.accountId) {
          const accountId = this.getAccountIdForType(accounts, entry.source);
          return { ...entry, accountId };
        }
        return entry;
      });
      localStorage.setItem('pennywise-debts', JSON.stringify(migratedDebts));

      console.log('Transaction migration completed');
    } catch (error) {
      console.error('Error migrating transactions:', error);
    }
  }
}

// Helper function to get account balance calculation
export function calculateAccountBalance(
  accountId: string,
  incomeEntries: any[],
  expenseEntries: any[],
  transferEntries: any[],
  debtEntries: any[]
): number {
  let balance = 0;

  // Add income
  incomeEntries.forEach(entry => {
    if (entry.accountId === accountId) {
      balance += entry.amount;
    }
  });

  // Subtract expenses
  expenseEntries.forEach(entry => {
    if (entry.accountId === accountId) {
      balance -= entry.amount;
    }
  });

  // Handle transfers
  transferEntries.forEach(entry => {
    if (entry.fromAccountId === accountId) {
      balance -= entry.amount;
    }
    if (entry.toAccountId === accountId) {
      balance += entry.amount;
    }
  });

  // Handle debts
  debtEntries.forEach(entry => {
    if (entry.accountId === accountId) {
      if (entry.type === 'lent') {
        balance -= entry.amount;
      } else if (entry.type === 'borrowed') {
        balance += entry.amount;
      }
    }
  });

  return balance;
}