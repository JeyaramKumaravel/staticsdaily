'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Account, AccountType, ACCOUNT_TYPE_LABELS } from '@/lib/account-types';
import { Wallet, Landmark, CreditCard } from 'lucide-react';

const accountFormSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(50, 'Account name must be less than 50 characters'),
  type: z.enum(['wallet', 'bank', 'ncmc'], { required_error: 'Please select an account type' }),
  isDefault: z.boolean().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  initialData?: Account;
  onSubmit: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function AccountForm({ initialData, onSubmit, onCancel }: AccountFormProps) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'bank',
      isDefault: initialData?.isDefault || false,
    },
  });

  const handleSubmit = (values: AccountFormValues) => {
    onSubmit({
      name: values.name,
      type: values.type,
      isDefault: values.isDefault || false,
      isActive: true,
    });
  };

  const AccountTypeIcon = ({ type }: { type: AccountType }) => {
    switch (type) {
      case 'wallet':
        return <Wallet className="h-4 w-4" />;
      case 'bank':
        return <Landmark className="h-4 w-4" />;
      case 'ncmc':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., SBI Savings, HDFC Current, Personal NCMC"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <AccountTypeIcon type={value as AccountType} />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Set as default account
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  This account will be pre-selected when adding transactions
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Account' : 'Add Account'}
          </Button>
        </div>
      </form>
    </Form>
  );
}