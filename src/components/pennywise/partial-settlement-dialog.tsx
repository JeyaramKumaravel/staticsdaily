"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { DollarSign } from "lucide-react";
import type { DebtEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const partialSettlementSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  description: z.string().optional(),
});

interface PartialSettlementFormData {
  amount: number;
  description?: string;
}

interface PartialSettlementDialogProps {
  debt: DebtEntry;
  onPartialSettle: (debtId: string, amount: number, description?: string) => void;
  children: React.ReactNode;
}

export function PartialSettlementDialog({ debt, onPartialSettle, children }: PartialSettlementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const remainingAmount = debt.amount - (debt.settledAmount || 0);
  
  const form = useForm<PartialSettlementFormData>({
    resolver: zodResolver(partialSettlementSchema),
    defaultValues: {
      amount: remainingAmount,
      description: "",
    },
  });

  const onSubmit = (data: PartialSettlementFormData) => {
    if (data.amount > remainingAmount) {
      form.setError("amount", {
        message: `Amount cannot exceed remaining debt of ${formatCurrency(remainingAmount)}`,
      });
      return;
    }

    onPartialSettle(debt.id, data.amount, data.description);
    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold text-lg">
            Partial Settlement - {debt.personName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Amount:</span>
              <span className="font-medium">{formatCurrency(debt.amount)}</span>
            </div>
            {debt.settledAmount && debt.settledAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Already Settled:</span>
                <span className="font-medium text-green-600">{formatCurrency(debt.settledAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-semibold text-lg">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settlement Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`Max: ${remainingAmount}`}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Partial payment via UPI..." 
                        {...field} 
                        value={field.value || ''} 
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Settle Partial
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}