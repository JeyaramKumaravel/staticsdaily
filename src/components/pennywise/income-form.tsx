
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Landmark, Wallet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAppContext } from "@/contexts/app-context";
import { useAccountContext } from "@/contexts/account-context";
import type { IncomeEntry, IncomeFormValuesAsDate, TransactionSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { MultipleDescriptions } from "./multiple-descriptions";
import { AccountSelector } from "./account-selector";

const incomeFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  source: z.enum(["wallet", "bank"], { required_error: "Please select a source." }),
  accountId: z.string().min(1, { message: "Please select an account." }),
  descriptions: z.array(z.string()).optional(),
  date: z.date({ required_error: "A date is required." }),
});

interface IncomeFormProps {
  isEditMode?: boolean;
  initialData?: IncomeEntry; 
  onSubmitSuccess?: () => void;
}

export function IncomeForm({ isEditMode = false, initialData, onSubmitSuccess }: IncomeFormProps) {
  const { addIncome, updateIncome, getAccountBalance } = useAppContext();
  const { getDefaultAccount, getAccountsByType, getAccount } = useAccountContext();

  const defaultFormValues = useMemo((): IncomeFormValuesAsDate => {
    if (isEditMode && initialData) {
      return {
        amount: initialData.amount,
        source: initialData.source,
        accountId: initialData.accountId || '',
        descriptions: initialData.descriptions || [],
        date: initialData.date ? parseISO(initialData.date) : new Date(),
      };
    }
    
    // For new entries, try to set default account
    const defaultWalletAccount = getDefaultAccount('wallet');
    const defaultBankAccount = getDefaultAccount('bank');
    const defaultAccount = defaultWalletAccount || defaultBankAccount;
    
    return {
      amount: undefined as unknown as number, 
      source: defaultAccount?.type === 'wallet' ? 'wallet' : 'bank',
      accountId: defaultAccount?.id || '',
      descriptions: [],
      date: new Date(),
    };
  }, [isEditMode, initialData, getDefaultAccount]);

  const form = useForm<IncomeFormValuesAsDate>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: defaultFormValues,
  });

  const { setFocus } = form;

  useEffect(() => {
    form.reset(defaultFormValues);
    if (!isEditMode) {
      setFocus("amount");
    }
  }, [defaultFormValues, form, isEditMode, setFocus]);


  function onSubmit(data: IncomeFormValuesAsDate) {
    if (isEditMode && initialData && initialData.id) { 
      updateIncome(initialData.id, data);
    } else {
      if (isEditMode) {
        console.warn("Attempted to update income in edit mode, but initialData.id was missing. Falling back to add.", { initialData });
      }
      addIncome(data);
      const defaultWalletAccount = getDefaultAccount('wallet');
      const defaultBankAccount = getDefaultAccount('bank');
      const defaultAccount = defaultWalletAccount || defaultBankAccount;
      
      form.reset({
        amount: undefined as unknown as number,
        source: defaultAccount?.type === 'wallet' ? 'wallet' : 'bank',
        accountId: defaultAccount?.id || '',
        descriptions: [],
        date: new Date(),
      });
      setFocus("amount"); // Re-focus after reset on add
    }
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 1000"
                  {...field}
                  value={field.value ?? ''} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <AccountSelector
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Update source based on selected account
                    const account = getAccount(value);
                    if (account) {
                      form.setValue('source', account.type === 'wallet' ? 'wallet' : 'bank');
                    }
                  }}
                  placeholder="Select account"
                  filterType={undefined} // Allow all account types for income
                  showBalance={true}
                  getAccountBalance={getAccountBalance}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="descriptions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultipleDescriptions
                  descriptions={field.value || []}
                  onChange={field.onChange}
                  label="Description"
                  placeholder="e.g., Monthly salary, Bonus details..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full btn-primary">
          {isEditMode ? "Save Changes" : "Add Income"}
        </Button>
      </form>
    </Form>
  );
}

    
