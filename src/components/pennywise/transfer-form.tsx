"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import type { TransferEntry, TransferFormValuesAsDate, TransactionSource } from "@/lib/types";
import { MultipleDescriptions } from "./multiple-descriptions";
import { AccountSelector } from "./account-selector";

const transferFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  fromSource: z.enum(["wallet", "bank", "NCMC"], { required_error: "Please select a source to transfer from." }),
  toSource: z.enum(["wallet", "bank", "NCMC"], { required_error: "Please select a source to transfer to." }),
  fromAccountId: z.string().min(1, { message: "Please select an account to transfer from." }),
  toAccountId: z.string().min(1, { message: "Please select an account to transfer to." }),
  descriptions: z.array(z.string()).optional(),
  date: z.date({ required_error: "A date is required." }),
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: "From and To accounts cannot be the same.",
  path: ["toAccountId"], // Attach error to toAccountId field for better UX
});

interface TransferFormProps {
  isEditMode?: boolean;
  initialData?: TransferEntry;
  onSubmitSuccess?: () => void;
}

export function TransferForm({ isEditMode = false, initialData, onSubmitSuccess }: TransferFormProps) {
  const { addTransfer, updateTransfer, getAccountBalance } = useAppContext();
  const { getDefaultAccount, getAccount } = useAccountContext();

  const defaultFormValues = useMemo((): TransferFormValuesAsDate => {
    if (isEditMode && initialData) {
      return {
        amount: initialData.amount,
        fromSource: initialData.fromSource,
        toSource: initialData.toSource,
        fromAccountId: initialData.fromAccountId || '',
        toAccountId: initialData.toAccountId || '',
        descriptions: initialData.descriptions || [],
        date: initialData.date ? parseISO(initialData.date) : new Date(),
      };
    }
    return {
      amount: undefined as unknown as number,
      fromSource: undefined as unknown as TransactionSource,
      toSource: undefined as unknown as TransactionSource,
      fromAccountId: '',
      toAccountId: '',
      descriptions: [],
      date: new Date(),
    };
  }, [isEditMode, initialData]);

  const form = useForm<TransferFormValuesAsDate>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: defaultFormValues,
  });

  const { setFocus } = form;

  useEffect(() => {
    form.reset(defaultFormValues);
    if (!isEditMode) {
      setFocus("amount");
    }
  }, [defaultFormValues, form, isEditMode, setFocus]);

  const watchedFromAccountId = form.watch("fromAccountId");

  function onSubmit(data: TransferFormValuesAsDate) {
    if (isEditMode && initialData && initialData.id) {
      updateTransfer(initialData.id, data);
    } else {
      addTransfer(data);
      form.reset({
        amount: undefined as unknown as number,
        fromSource: undefined as unknown as TransactionSource,
        toSource: undefined as unknown as TransactionSource,
        fromAccountId: '',
        toAccountId: '',
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
                  placeholder="e.g., 500"
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
          name="fromAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Account</FormLabel>
              <FormControl>
                <AccountSelector
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Update fromSource based on selected account
                    const account = getAccount(value);
                    if (account) {
                      const sourceValue = account.type === 'wallet' ? 'wallet' : account.type === 'bank' ? 'bank' : 'NCMC';
                      form.setValue('fromSource', sourceValue);
                    }
                    // Clear toAccountId if it's the same as fromAccountId
                    if (form.getValues('toAccountId') === value) {
                      form.setValue('toAccountId', '');
                      form.setValue('toSource', undefined as unknown as TransactionSource);
                    }
                  }}
                  placeholder="Select account to transfer from"
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
          name="toAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To Account</FormLabel>
              <FormControl>
                <AccountSelector
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Update toSource based on selected account
                    const account = getAccount(value);
                    if (account) {
                      const sourceValue = account.type === 'wallet' ? 'wallet' : account.type === 'bank' ? 'bank' : 'NCMC';
                      form.setValue('toSource', sourceValue);
                    }
                  }}
                  placeholder="Select account to transfer to"
                  excludeAccountId={watchedFromAccountId}
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
                    initialFocus
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
                  placeholder="e.g., Moved cash to bank account, Transfer reason..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full btn-primary">
          {isEditMode ? "Save Changes" : "Record Transfer"}
        </Button>
      </form>
    </Form>
  );
}
