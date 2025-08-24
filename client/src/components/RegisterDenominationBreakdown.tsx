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

  // Calculate totals (notes only)
  const calculatedTotal = useMemo(() => {
    return denominationTypes
      .filter(denom => denom.type === 'note') // Only count notes
      .reduce((sum, denom) => {
        const quantity = quantities[denom.id] || 0;
        return sum + (parseFloat(denom.value) * quantity);
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

    // Prepare denomination breakdown data (notes only)
    const denominationBreakdown = denominationTypes
      .filter(denom => denom.type === 'note' && quantities[denom.id] > 0)
      .map(denom => ({
        denominationId: denom.id,
        quantity: quantities[denom.id],
        amount: (parseFloat(denom.value) * quantities[denom.id]).toFixed(2),
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
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Declared Balance</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1" data-testid="declared-balance-display">
                      PKR {declaredBalanceNum.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DollarSign className="h-8 w-8 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Calculated Total</p>
                    <p className="text-3xl font-bold text-green-900 mt-1" data-testid="calculated-total-display">
                      PKR {calculatedTotal.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Calculator className="h-8 w-8 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`border-2 ${isBalanced ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50' : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold uppercase tracking-wide ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>
                      Balance Status
                    </p>
                    <p className={`text-3xl font-bold mt-1 ${isBalanced ? 'text-emerald-900' : 'text-red-900'}`} data-testid="difference-display">
                      {isBalanced ? '✓ Perfect!' : `Diff: PKR ${difference.toLocaleString()}`}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${isBalanced ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {isBalanced ? (
                      <CheckCircle className={`h-8 w-8 ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`} />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-700" />
                    )}
                  </div>
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

          {/* Notes Denomination Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Label className="text-xl font-semibold text-gray-800">💵 Cash Notes Breakdown</Label>
            </div>
            
            {/* Responsive Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {denominationTypes
                .filter(denom => denom.type === 'note')
                .sort((a, b) => parseFloat(b.value) - parseFloat(a.value)) // Sort highest to lowest
                .map(denom => (
                  <div key={denom.id} className="group relative bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                    {/* Denomination Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-green-600 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {parseFloat(denom.value) >= 1000 ? `${parseFloat(denom.value)/1000}K` : parseFloat(denom.value)}
                        </div>
                        <div>
                          <div className="font-semibold text-green-800 text-lg">
                            PKR {parseFloat(denom.value).toFixed(0)}
                          </div>
                          <div className="text-xs text-green-600">Note</div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`qty-${denom.id}`} className="text-sm font-medium text-gray-700">
                          Quantity
                        </Label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(denom.id, String(Math.max(0, (quantities[denom.id] || 0) - 1)))}
                            className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors"
                          >
                            -
                          </button>
                          <Input
                            id={`qty-${denom.id}`}
                            type="number"
                            min="0"
                            value={quantities[denom.id] || ''}
                            onChange={(e) => handleQuantityChange(denom.id, e.target.value)}
                            placeholder="0"
                            className="w-16 text-center font-medium border-green-200 focus:border-green-400"
                            data-testid={`input-quantity-${denom.id}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(denom.id, String((quantities[denom.id] || 0) + 1))}
                            className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Amount Display */}
                      <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Amount:</span>
                          <span className="font-bold text-green-700 text-lg">
                            PKR {((quantities[denom.id] || 0) * parseFloat(denom.value)).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }
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