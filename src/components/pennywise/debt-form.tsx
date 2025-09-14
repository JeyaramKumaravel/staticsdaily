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
import { cn } from "@/lib/utils";
import type { DebtEntry, DebtFormValuesAsDate, TransactionSource, DebtType } from "@/lib/types";
import { MultipleDescriptions } from "./multiple-descriptions";

const debtFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(["lent", "borrowed"], { required_error: "Please select debt type." }),
  personName: z.string().min(1, { message: "Person name is required." }),
  source: z.enum(["wallet", "bank", "NCMC"], { required_error: "Please select a source." }),
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
  const { addDebt, updateDebt } = useAppContext();

  const defaultFormValues = useMemo((): DebtFormValuesAsDate => {
    if (isEditMode && initialData) {
      return {
        amount: initialData.amount,
        type: initialData.type,
        personName: initialData.personName,
        source: initialData.source,
        date: initialData.date ? parseISO(initialData.date) : new Date(),
        dueDate: initialData.dueDate ? parseISO(initialData.dueDate) : undefined,
        descriptions: initialData.descriptions || [],
      };
    }
    return {
      amount: undefined as unknown as number,
      type: undefined as unknown as DebtType,
      personName: "",
      source: undefined as unknown as TransactionSource,
      date: new Date(),
      dueDate: undefined,
      descriptions: [],
    };
  }, [isEditMode, initialData]);

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
      form.reset({
        amount: undefined as unknown as number,
        type: undefined as unknown as DebtType,
        personName: "",
        source: undefined as unknown as TransactionSource,
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
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
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