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
import { cn } from "@/lib/utils";
import type { TransferEntry, TransferFormValuesAsDate, TransactionSource } from "@/lib/types";
import { MultipleDescriptions } from "./multiple-descriptions";

const transferFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  fromSource: z.enum(["wallet", "bank", "NCMC"], { required_error: "Please select a source to transfer from." }),
  toSource: z.enum(["wallet", "bank", "NCMC"], { required_error: "Please select a source to transfer to." }),
  descriptions: z.array(z.string()).optional(),
  date: z.date({ required_error: "A date is required." }),
}).refine(data => data.fromSource !== data.toSource, {
  message: "From and To sources cannot be the same.",
  path: ["toSource"], // Attach error to toSource field for better UX
});

interface TransferFormProps {
  isEditMode?: boolean;
  initialData?: TransferEntry;
  onSubmitSuccess?: () => void;
}

export function TransferForm({ isEditMode = false, initialData, onSubmitSuccess }: TransferFormProps) {
  const { addTransfer, updateTransfer } = useAppContext();

  const defaultFormValues = useMemo((): TransferFormValuesAsDate => {
    if (isEditMode && initialData) {
      return {
        amount: initialData.amount,
        fromSource: initialData.fromSource,
        toSource: initialData.toSource,
        descriptions: initialData.descriptions || [],
        date: initialData.date ? parseISO(initialData.date) : new Date(),
      };
    }
    return {
      amount: undefined as unknown as number,
      fromSource: undefined as unknown as TransactionSource,
      toSource: undefined as unknown as TransactionSource,
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

  const watchedFromSource = form.watch("fromSource");

  function onSubmit(data: TransferFormValuesAsDate) {
    if (isEditMode && initialData && initialData.id) {
      updateTransfer(initialData.id, data);
    } else {
      addTransfer(data);
      form.reset({
        amount: undefined as unknown as number,
        fromSource: undefined as unknown as TransactionSource,
        toSource: undefined as unknown as TransactionSource,
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
          name="fromSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source to transfer from" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="wallet">
                    <div className="flex items-center">
                      <Wallet className="mr-2 h-4 w-4" /> Wallet
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center">
                      <Landmark className="mr-2 h-4 w-4" /> Bank
                    </div>
                  </SelectItem>
                  <SelectItem value="NCMC">
                    <div className="flex items-center">
                      <span className="mr-2 h-4 w-4">🏦</span> NCMC
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
          name="toSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value} 
                defaultValue={field.value}
                disabled={!watchedFromSource}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source to transfer to" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {watchedFromSource !== 'wallet' && (
                    <SelectItem value="wallet">
                      <div className="flex items-center">
                        <Wallet className="mr-2 h-4 w-4" /> Wallet
                      </div>
                    </SelectItem>
                  )}
                  {watchedFromSource !== 'bank' && (
                    <SelectItem value="bank">
                      <div className="flex items-center">
                        <Landmark className="mr-2 h-4 w-4" /> Bank
                      </div>
                    </SelectItem>
                  )}
                  {watchedFromSource !== 'NCMC' && (
                    <SelectItem value="NCMC">
                      <div className="flex items-center">
                        <span className="mr-2 h-4 w-4">🏦</span> NCMC
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
