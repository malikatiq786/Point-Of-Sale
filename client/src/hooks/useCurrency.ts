import { useQuery } from "@tanstack/react-query";

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useCurrency() {
  const { data: currencies = [], isLoading } = useQuery<Currency[]>({
    queryKey: ["/api/currencies"],
  });

  // Get system currency setting
  const { data: systemCurrencySetting } = useQuery<{success: boolean, data: {value: string}}>({
    queryKey: ['/api/settings/system_currency'],
    retry: false,
  });

  // Find the system-selected currency or fallback to default
  const systemCurrencyId = systemCurrencySetting?.data?.value ? 
    parseInt(systemCurrencySetting.data.value) : null;
    
  const defaultCurrency = currencies.find(currency => 
    systemCurrencyId ? currency.id === systemCurrencyId : currency.isDefault
  ) || currencies.find(currency => currency.isDefault) || {
    id: 1,
    code: "PKR",
    name: "Pakistani Rupee",
    symbol: "Rs",
    exchangeRate: 1.0,
    isActive: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const formatCurrency = (amount: number | string, currency?: Currency) => {
    const curr = currency || defaultCurrency;
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return `${curr.symbol}0.00`;
    
    return `${curr.symbol}${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatCurrencyValue = (amount: number | string) => {
    return formatCurrency(amount, defaultCurrency);
  };

  return {
    currencies,
    defaultCurrency,
    formatCurrency,
    formatCurrencyValue,
    isLoading,
  };
}