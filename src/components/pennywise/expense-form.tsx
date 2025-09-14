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
import type { ExpenseEntry, ExpenseFormValuesAsDate, TransactionSource } from "@/lib/types";
import { MultipleDescriptions } from "./multiple-descriptions";

const expenseFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  category: z.string().min(1, { message: "Category is required." }),
  subcategory: z.string().optional(),
  descriptions: z.array(z.string()).optional(),
  date: z.date({ required_error: "A date is required." }),
  source: z.enum(["wallet", "bank", "NCMC"], { required_error: "Please select a source." }),
});

interface ExpenseFormProps {
  isEditMode?: boolean;
  initialData?: ExpenseEntry;
  onSubmitSuccess?: () => void;
}

const defaultCategories = ["Food", "Transport", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"];

export function ExpenseForm({ isEditMode = false, initialData, onSubmitSuccess }: ExpenseFormProps) {
  const { addExpense, updateExpense } = useAppContext();

  const defaultFormValues = useMemo((): ExpenseFormValuesAsDate => {
    if (isEditMode && initialData) {
      return {
        amount: initialData.amount,
        category: initialData.category,
        subcategory: initialData.subcategory || "",
        descriptions: initialData.descriptions || [],
        date: initialData.date ? parseISO(initialData.date) : new Date(),
        source: initialData.source,
      };
    }
    return {
      amount: undefined as unknown as number,
      category: "",
      subcategory: "",
      descriptions: [],
      date: new Date(),
      source: undefined as unknown as TransactionSource,
    };
  }, [isEditMode, initialData]);

  const form = useForm<ExpenseFormValuesAsDate>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: defaultFormValues,
  });

  const { setFocus } = form;

  useEffect(() => {
    form.reset(defaultFormValues);
    if (!isEditMode) {
      setFocus("amount");
    }
  }, [defaultFormValues, form, isEditMode, setFocus]);

  function onSubmit(data: ExpenseFormValuesAsDate) {
    if (isEditMode && initialData && initialData.id) {
      updateExpense(initialData.id, data);
    } else {
      if (isEditMode) {
        console.warn("Attempted to update expense in edit mode, but initialData.id was missing. Falling back to add.", { initialData });
      }
      addExpense(data);
      form.reset({
        amount: undefined as unknown as number,
        category: "",
        subcategory: "",
        descriptions: [],
        date: new Date(),
        source: undefined as unknown as TransactionSource,
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
                  placeholder="e.g., 100"
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
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense source" />
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input list="categories" placeholder="e.g., Food, Transport" {...field} value={field.value || ''} />
              </FormControl>
              <datalist id="categories">
                {defaultCategories.map(cat => <option key={cat} value={cat} />)}
              </datalist>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subcategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sub-Category (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Groceries, Dining out" {...field} value={field.value || ''} />
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
                  placeholder="e.g., Lunch with colleagues, Items purchased..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full btn-primary">
          {isEditMode ? "Save Changes" : "Add Expense"}
        </Button>
      </form>
    </Form>
  );
}
