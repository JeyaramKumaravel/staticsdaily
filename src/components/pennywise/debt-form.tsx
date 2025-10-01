"use client";

import { useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Landmark, Wallet, UserCheck, UserX } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAppContext } from "@/contexts/app-context";
import { useAccountContext } from "@/contexts/account-context";
import { cn } from "@/lib/utils";
import type { DebtEntry, DebtFormValuesAsDate, TransactionSource, DebtType } from "@/lib/types";
import { MultipleDescriptions } from "./multiple-descriptions";
import { AccountSelector } from "./account-selector";

const debtFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(["lent", "borrowed"], { required_error: "Please select debt type." }),
  personName: z.string().min(1, { message: "Person name is required." }),
  source: z.enum(["wallet", "bank", "NCMC"], { required_error: "Please select a source." }),
  accountId: z.string().min(1, { message: "Please select an account." }),
  date: z.date({ required_error: "A date is required." }),
  dueDate: z.date().optional(),
  descriptions: z.array(z.string()).optional(),
});

interface DebtFormProps {
  isEditMode?: boolean;
  initialData?: DebtEntry;
  onSubmitSuccess?: () => void;
}

export function DebtForm({ isEditMode = false, initialData, onSubmitSuccess }: DebtFormProps) {
  const { addDebt, updateDebt, getAccountBalance } = useAppContext();
  const { getDefaultAccount, getAccount } = useAccountContext();

  const defaultFormValues = useMemo((): DebtFormValuesAsDate => {
    if (isEditMode && initialData) {
      return {
        amount: initialData.amount,
        type: initialData.type,
        personName: initialData.personName,
        source: initialData.source,
        accountId: initialData.accountId || '',
        date: initialData.date ? parseISO(initialData.date) : new Date(),
        dueDate: initialData.dueDate ? parseISO(initialData.dueDate) : undefined,
        descriptions: initialData.descriptions || [],
      };
    }
    
    // For new entries, try to set default account
    const defaultWalletAccount = getDefaultAccount('wallet');
    const defaultBankAccount = getDefaultAccount('bank');
    const defaultNcmcAccount = getDefaultAccount('ncmc');
    const defaultAccount = defaultWalletAccount || defaultBankAccount || defaultNcmcAccount;
    
    return {
      amount: undefined as unknown as number,
      type: undefined as unknown as DebtType,
      personName: "",
      source: defaultAccount?.type === 'wallet' ? 'wallet' : defaultAccount?.type === 'bank' ? 'bank' : 'NCMC',
      accountId: defaultAccount?.id || '',
      date: new Date(),
      dueDate: undefined,
      descriptions: [],
    };
  }, [isEditMode, initialData, getDefaultAccount]);

  const form = useForm<DebtFormValuesAsDate>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: defaultFormValues,
  });

  const { setFocus } = form;

  useEffect(() => {
    form.reset(defaultFormValues);
    if (!isEditMode) {
      setFocus("amount");
    }
  }, [defaultFormValues, form, isEditMode, setFocus]);

  function onSubmit(data: DebtFormValuesAsDate) {
    if (isEditMode && initialData && initialData.id) {
      updateDebt(initialData.id, data);
    } else {
      if (isEditMode) {
        console.warn("Attempted to update debt in edit mode, but initialData.id was missing. Falling back to add.", { initialData });
      }
      addDebt(data);
      const defaultWalletAccount = getDefaultAccount('wallet');
      const defaultBankAccount = getDefaultAccount('bank');
      const defaultNcmcAccount = getDefaultAccount('ncmc');
      const defaultAccount = defaultWalletAccount || defaultBankAccount || defaultNcmcAccount;
      
      form.reset({
        amount: undefined as unknown as number,
        type: undefined as unknown as DebtType,
        personName: "",
        source: defaultAccount?.type === 'wallet' ? 'wallet' : defaultAccount?.type === 'bank' ? 'bank' : 'NCMC',
        accountId: defaultAccount?.id || '',
        date: new Date(),
        dueDate: undefined,
        descriptions: [],
      });
      setFocus("amount");
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select debt type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lent">
                    <div className="flex items-center">
                      <UserCheck className="mr-2 h-4 w-4 text-green-600" /> Money Lent (I gave money)
                    </div>
                  </SelectItem>
                  <SelectItem value="borrowed">
                    <div className="flex items-center">
                      <UserX className="mr-2 h-4 w-4 text-red-600" /> Money Borrowed (I received money)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Person Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} value={field.value || ''} />
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
                      const sourceValue = account.type === 'wallet' ? 'wallet' : account.type === 'bank' ? 'bank' : 'NCMC';
                      form.setValue('source', sourceValue);
                    }
                  }}
                  placeholder="Select account"
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
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date (Optional)</FormLabel>
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
                        <span>Pick due date</span>
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
                    disabled={(date) => date < new Date()}
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
                  placeholder="e.g., Emergency loan, business investment..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full btn-primary">
          {isEditMode ? "Save Changes" : "Add Debt/Loan"}
        </Button>
      </form>
    </Form>
  );
}