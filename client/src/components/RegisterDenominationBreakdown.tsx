import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Calculator, DollarSign, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DenominationType {
  id: number;
  value: number;
  type: 'note' | 'coin';
  name: string;
  sortOrder: number;
}

interface DenominationQuantity {
  denominationId: number;
  quantity: number;
  amount: number;
}

interface RegisterDenominationBreakdownProps {
  mode: 'opening' | 'closing';
  onSubmit: (data: {
    declaredBalance: string;
    denominationBreakdown: Array<{
      denominationId: number;
      quantity: number;
      amount: string;
    }>;
    notes?: string;
  }) => void;
  isLoading?: boolean;
  title?: string;
  initialData?: {
    declaredBalance?: string;
    denominations?: DenominationQuantity[];
    notes?: string;
  };
}

export function RegisterDenominationBreakdown({
  mode,
  onSubmit,
  isLoading = false,
  title,
  initialData
}: RegisterDenominationBreakdownProps) {
  const [denominationTypes, setDenominationTypes] = useState<DenominationType[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [declaredBalance, setDeclaredBalance] = useState(initialData?.declaredBalance || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [validationError, setValidationError] = useState('');
  const { toast } = useToast();

  // Load denomination types on mount
  useEffect(() => {
    const loadDenominationTypes = async () => {
      try {
        const response = await fetch('/api/register-sessions/denomination-types');
        if (response.ok) {
          const data = await response.json();
          setDenominationTypes(data);
          
          // Initialize quantities with initial data if provided
          if (initialData?.denominations) {
            const initialQuantities: Record<number, number> = {};
            initialData.denominations.forEach(denom => {
              initialQuantities[denom.denominationId] = denom.quantity;
            });
            setQuantities(initialQuantities);
          }
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load denomination types',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading denomination types:', error);
        toast({
          title: 'Error',
          description: 'Failed to load denomination types',
          variant: 'destructive',
        });
      }
    };

    loadDenominationTypes();
  }, [initialData, toast]);

  // Calculate totals
  const calculatedTotal = useMemo(() => {
    return denominationTypes.reduce((sum, denom) => {
      const quantity = quantities[denom.id] || 0;
      return sum + (denom.value * quantity);
    }, 0);
  }, [denominationTypes, quantities]);

  const declaredBalanceNum = parseFloat(declaredBalance) || 0;
  const difference = Math.abs(declaredBalanceNum - calculatedTotal);
  const isBalanced = difference < 0.01; // Allow for minor floating point differences

  // Handle quantity change
  const handleQuantityChange = (denominationId: number, quantity: string) => {
    const numQuantity = Math.max(0, parseInt(quantity) || 0);
    setQuantities(prev => ({
      ...prev,
      [denominationId]: numQuantity,
    }));
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  // Handle declared balance change
  const handleDeclaredBalanceChange = (value: string) => {
    // Only allow positive numbers with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setDeclaredBalance(value);
      
      // Clear validation error when user starts typing
      if (validationError) {
        setValidationError('');
      }
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validation
    if (!declaredBalance || declaredBalanceNum <= 0) {
      setValidationError('Please enter a valid declared balance');
      return;
    }

    if (!isBalanced) {
      setValidationError(
        `Declared balance (${declaredBalanceNum.toFixed(2)}) does not match calculated total (${calculatedTotal.toFixed(2)}). Please verify denomination quantities.`
      );
      return;
    }

    // Check if at least one denomination has been entered
    const hasAnyQuantities = Object.values(quantities).some(qty => qty > 0);
    if (!hasAnyQuantities) {
      setValidationError('Please enter at least one denomination quantity');
      return;
    }

    // Prepare denomination breakdown data
    const denominationBreakdown = denominationTypes
      .filter(denom => quantities[denom.id] > 0)
      .map(denom => ({
        denominationId: denom.id,
        quantity: quantities[denom.id],
        amount: (denom.value * quantities[denom.id]).toFixed(2),
      }));

    onSubmit({
      declaredBalance: declaredBalance,
      denominationBreakdown,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6" data-testid="denomination-breakdown">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {title || `${mode === 'opening' ? 'Opening' : 'Closing'} Balance - Denomination Breakdown`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Declared Balance</p>
                    <p className="text-2xl font-bold" data-testid="declared-balance-display">
                      PKR {declaredBalanceNum.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Calculated Total</p>
                    <p className="text-2xl font-bold" data-testid="calculated-total-display">
                      PKR {calculatedTotal.toFixed(2)}
                    </p>
                  </div>
                  <Calculator className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Difference</p>
                    <p 
                      className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}
                      data-testid="difference-display"
                    >
                      PKR {difference.toFixed(2)}
                    </p>
                  </div>
                  {isBalanced ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance Status */}
          {!isBalanced && calculatedTotal > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The calculated total does not match the declared balance. Please check your denomination quantities.
              </AlertDescription>
            </Alert>
          )}

          {isBalanced && calculatedTotal > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Perfect! Your denomination breakdown matches the declared balance.
              </AlertDescription>
            </Alert>
          )}

          {/* Declared Balance Input */}
          <div className="space-y-2">
            <Label htmlFor="declared-balance">
              Declared {mode === 'opening' ? 'Opening' : 'Closing'} Balance (PKR)
            </Label>
            <Input
              id="declared-balance"
              data-testid="input-declared-balance"
              type="text"
              value={declaredBalance}
              onChange={(e) => handleDeclaredBalanceChange(e.target.value)}
              placeholder="Enter declared balance amount"
              className="text-lg font-medium"
            />
          </div>

          {/* Denomination Grid */}
          <div className="space-y-4">
            <Label className="text-lg font-medium">Denomination Breakdown</Label>
            
            {/* Notes */}
            <div className="grid grid-cols-2 gap-6">
              {/* Notes Column */}
              <div className="space-y-4">
                <h3 className="font-medium text-green-800 bg-green-100 px-3 py-2 rounded">
                  Notes 📄
                </h3>
                {denominationTypes
                  .filter(denom => denom.type === 'note')
                  .map(denom => (
                    <div key={denom.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {denom.name}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          PKR {denom.value.toFixed(0)} each
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={quantities[denom.id] || ''}
                          onChange={(e) => handleQuantityChange(denom.id, e.target.value)}
                          placeholder="0"
                          className="w-20 text-center"
                          data-testid={`input-quantity-${denom.id}`}
                        />
                        <span className="text-sm font-medium min-w-[80px] text-right">
                          = PKR {((quantities[denom.id] || 0) * denom.value).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Coins Column */}
              <div className="space-y-4">
                <h3 className="font-medium text-orange-800 bg-orange-100 px-3 py-2 rounded">
                  Coins 🪙
                </h3>
                {denominationTypes
                  .filter(denom => denom.type === 'coin')
                  .map(denom => (
                    <div key={denom.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          {denom.name}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          PKR {denom.value.toFixed(0)} each
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={quantities[denom.id] || ''}
                          onChange={(e) => handleQuantityChange(denom.id, e.target.value)}
                          placeholder="0"
                          className="w-20 text-center"
                          data-testid={`input-quantity-${denom.id}`}
                        />
                        <span className="text-sm font-medium min-w-[80px] text-right">
                          = PKR {((quantities[denom.id] || 0) * denom.value).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes (Optional)
            </Label>
            <Input
              id="notes"
              data-testid="input-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes..."
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !isBalanced}
            className="w-full"
            size="lg"
            data-testid="button-submit-breakdown"
          >
            {isLoading ? (
              'Processing...'
            ) : (
              `${mode === 'opening' ? 'Open Register Session' : 'Close Register Session'}`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}