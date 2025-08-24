import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Comprehensive expense form schema
const expenseFormSchema = z.object({
  categoryId: z.number().min(1, 'Category is required'),
  subcategoryId: z.number().optional(),
  vendorId: z.number().optional(),
  branchId: z.number().optional(),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  taxRate: z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
    'Tax rate must be between 0 and 100'
  ),
  taxAmount: z.string().optional(),
  currency: z.string().default('USD'),
  exchangeRate: z.string().default('1'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
  receiptNumber: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bank', 'credit_card', 'digital_wallet'], {
    required_error: 'Payment method is required',
  }),
  paymentReference: z.string().optional(),
  expenseDate: z.date({
    required_error: 'Expense date is required',
  }),
  dueDate: z.date().optional(),
  isPettyCash: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurringEndDate: z.date().optional(),
  projectId: z.string().optional(),
  costCenter: z.string().optional(),
  taxType: z.enum(['VAT', 'GST', 'withholding']).optional(),
  isReimbursable: z.boolean().default(false),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  expenseId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ expenseId, onSuccess, onCancel }: ExpenseFormProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isCalculatingTax, setIsCalculatingTax] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data for form options
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/expense-categories'],
    queryFn: () => apiRequest('/api/expense-categories'),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['/api/expense-vendors'],
    queryFn: () => apiRequest('/api/expense-vendors'),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: () => apiRequest('/api/branches'),
  });

  // Fetch existing expense if editing
  const { data: existingExpense } = useQuery({
    queryKey: ['/api/expenses', expenseId],
    queryFn: () => apiRequest(`/api/expenses/${expenseId}`),
    enabled: !!expenseId,
  });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      currency: 'USD',
      exchangeRate: '1',
      isPettyCash: false,
      isRecurring: false,
      isReimbursable: false,
      paymentMethod: 'cash',
      expenseDate: new Date(),
    },
  });

  // Watch form values for calculations
  const watchedAmount = form.watch('amount');
  const watchedTaxRate = form.watch('taxRate');
  const watchedIsRecurring = form.watch('isRecurring');
  const watchedCategoryId = form.watch('categoryId');

  // Calculate tax amount automatically
  const calculateTaxAmount = () => {
    const amount = Number(watchedAmount || 0);
    const taxRate = Number(watchedTaxRate || 0);
    const taxAmount = (amount * taxRate / 100).toFixed(2);
    form.setValue('taxAmount', taxAmount);
  };

  // Get subcategories based on selected category
  const subcategories = categories.filter((cat: any) => cat.parentId === watchedCategoryId);

  // Create/Update expense mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      const formData = {
        ...data,
        amount: Number(data.amount),
        taxRate: data.taxRate ? Number(data.taxRate) : 0,
        taxAmount: data.taxAmount ? Number(data.taxAmount) : 0,
        exchangeRate: Number(data.exchangeRate),
        projectId: data.projectId ? Number(data.projectId) : undefined,
        attachments: attachments,
      };

      if (expenseId) {
        return apiRequest(`/api/expenses/${expenseId}`, {
          method: 'PUT',
          data: formData,
        });
      } else {
        return apiRequest('/api/expenses', {
          method: 'POST',
          data: formData,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Expense ${expenseId ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expense-dashboard/stats'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${expenseId ? 'update' : 'create'} expense`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    saveMutation.mutate(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const amount = Number(watchedAmount || 0);
    const taxAmount = Number(form.watch('taxAmount') || 0);
    return (amount + taxAmount).toFixed(2);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the main expense details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of the expense"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories
                          .filter((cat: any) => !cat.parentId)
                          .map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {subcategories.length > 0 && (
                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-subcategory">
                            <SelectValue placeholder="Select a subcategory" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategories.map((subcategory: any) => (
                            <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor/Payee</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-vendor">
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor: any) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or details"
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Amount & Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle>Amount & Tax Details</CardTitle>
              <CardDescription>
                Enter amount and tax information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (watchedTaxRate) {
                              setTimeout(calculateTaxAmount, 100);
                            }
                          }}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="PKR">PKR (₨)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (watchedAmount) {
                              setTimeout(calculateTaxAmount, 100);
                            }
                          }}
                          data-testid="input-tax-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-tax-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-xl font-bold" data-testid="text-total-amount">
                    ${calculateTotal()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Payment method and details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Reference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Transaction ID, check number, etc."
                        {...field}
                        data-testid="input-payment-reference"
                      />
                    </FormControl>
                    <FormDescription>
                      Reference number for tracking payment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Receipt or invoice number"
                        {...field}
                        data-testid="input-receipt-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Dates & Options */}
          <Card>
            <CardHeader>
              <CardTitle>Dates & Options</CardTitle>
              <CardDescription>
                Important dates and additional options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="expenseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expense Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            data-testid="button-expense-date"
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
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
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="isPettyCash"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-petty-cash"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Petty Cash Expense</FormLabel>
                        <FormDescription>
                          Mark if this is a petty cash expense
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isReimbursable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-reimbursable"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Reimbursable</FormLabel>
                        <FormDescription>
                          Check if this expense should be reimbursed
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-recurring"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Recurring Expense</FormLabel>
                        <FormDescription>
                          Set up automatic recurring payments
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {watchedIsRecurring && (
                <FormField
                  control={form.control}
                  name="recurringPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring Pattern</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recurring-pattern">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>
              Upload receipts, invoices, or supporting documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileUpload}
                    data-testid="input-file-upload"
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Uploaded Files:</h4>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        data-testid={`button-remove-attachment-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            data-testid="button-submit"
          >
            {saveMutation.isPending ? 'Saving...' : expenseId ? 'Update Expense' : 'Create Expense'}
          </Button>
        </div>
      </form>
    </Form>
  );
}