import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';

export class FinancialReportService {
  private expenseRepository: ExpenseRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.expenseRepository = new ExpenseRepository();
    this.transactionRepository = new TransactionRepository();
  }

  async generateFinancialReport(reportType: string, filters: any) {
    try {
      console.log('FinancialReportService: Generating report:', reportType, filters);

      switch (reportType) {
        case 'profit_loss':
          return await this.generateProfitLossReport(filters);
        case 'balance_sheet':
          return await this.generateBalanceSheetReport(filters);
        case 'cashflow':
          return await this.generateCashFlowReport(filters);
        case 'sales_summary':
          return await this.generateSalesSummaryReport(filters);
        case 'expense_report':
          return await this.generateExpenseReport(filters);
        default:
          return { success: false, error: 'Invalid report type' };
      }
    } catch (error) {
      console.error('FinancialReportService: Error generating report:', error);
      return { success: false, error: 'Failed to generate report' };
    }
  }

  async getDashboardSummary(filters: any = {}) {
    try {
      const [expenseStats, revenueStats] = await Promise.all([
        this.getExpenseSummary(filters),
        this.getRevenueSummary(filters)
      ]);

      const totalRevenue = revenueStats.total || 0;
      const totalExpenses = expenseStats.total || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      return {
        success: true,
        data: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
          revenueGrowth: revenueStats.growth || 0,
          expenseGrowth: expenseStats.growth || 0,
          transactionCount: revenueStats.transactionCount || 0,
          expenseCount: expenseStats.expenseCount || 0
        }
      };
    } catch (error) {
      console.error('FinancialReportService: Error getting dashboard summary:', error);
      return { success: false, error: 'Failed to fetch dashboard summary' };
    }
  }

  async getProfitLossData(filters: any = {}) {
    try {
      const period = filters.period || 'monthly';
      const startDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = filters.dateTo ? new Date(filters.dateTo) : new Date();

      // Get revenue data (from transactions)
      const revenueData = await this.getRevenueByPeriod(period, startDate, endDate, filters.branchId);
      
      // Get expense data
      const expenseData = await this.getExpensesByPeriod(period, startDate, endDate, filters.branchId);

      // Combine data for profit/loss chart
      const profitLossData = this.combineProfitLossData(revenueData, expenseData);

      return {
        success: true,
        data: profitLossData
      };
    } catch (error) {
      console.error('FinancialReportService: Error getting profit loss data:', error);
      return { success: false, error: 'Failed to fetch profit loss data' };
    }
  }

  async getExpenseBreakdown(filters: any = {}) {
    try {
      const startDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = filters.dateTo ? new Date(filters.dateTo) : new Date();

      const expensesByCategory = await this.expenseRepository.getExpensesByCategory({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        branchId: filters.branchId
      });

      const breakdownData = expensesByCategory.map((category: any, index: number) => ({
        name: category.categoryName || 'Unknown',
        value: Number(category.totalAmount || 0),
        count: Number(category.count || 0),
        color: this.getChartColor(index)
      }));

      return {
        success: true,
        data: breakdownData
      };
    } catch (error) {
      console.error('FinancialReportService: Error getting expense breakdown:', error);
      return { success: false, error: 'Failed to fetch expense breakdown' };
    }
  }

  private async generateProfitLossReport(filters: any) {
    const profitLossData = await this.getProfitLossData(filters);
    const expenseBreakdown = await this.getExpenseBreakdown(filters);
    const summary = await this.getDashboardSummary(filters);

    return {
      success: true,
      data: {
        profitLoss: profitLossData.data,
        expenseBreakdown: expenseBreakdown.data,
        summary: summary.data
      },
      summary: summary.data
    };
  }

  private async generateBalanceSheetReport(filters: any) {
    // Simplified balance sheet - would need asset, liability, and equity data
    return {
      success: true,
      data: {
        assets: {
          current: 0,
          fixed: 0,
          total: 0
        },
        liabilities: {
          current: 0,
          longTerm: 0,
          total: 0
        },
        equity: {
          retained: 0,
          capital: 0,
          total: 0
        }
      }
    };
  }

  private async generateCashFlowReport(filters: any) {
    const transactions = await this.transactionRepository.getTransactionsByDateRange(
      filters.dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString(),
      filters.dateTo || new Date().toISOString()
    );

    const operating = transactions.filter((t: any) => t.type === 'sale' || t.type === 'expense');
    const investing = transactions.filter((t: any) => t.type === 'investment');
    const financing = transactions.filter((t: any) => t.type === 'loan' || t.type === 'equity');

    return {
      success: true,
      data: {
        operating: this.calculateCashFlow(operating),
        investing: this.calculateCashFlow(investing),
        financing: this.calculateCashFlow(financing)
      }
    };
  }

  private async generateSalesSummaryReport(filters: any) {
    const transactions = await this.transactionRepository.getTransactionsByDateRange(
      filters.dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString(),
      filters.dateTo || new Date().toISOString()
    );

    const salesTransactions = transactions.filter((t: any) => t.type === 'sale');

    return {
      success: true,
      data: {
        totalSales: salesTransactions.reduce((sum: number, t: any) => sum + Number(t.totalAmount || 0), 0),
        transactionCount: salesTransactions.length,
        averageTransaction: salesTransactions.length > 0 ? 
          salesTransactions.reduce((sum: number, t: any) => sum + Number(t.totalAmount || 0), 0) / salesTransactions.length : 0
      }
    };
  }

  private async generateExpenseReport(filters: any) {
    return await this.expenseRepository.getExpensesByCategory({
      startDate: filters.dateFrom,
      endDate: filters.dateTo,
      branchId: filters.branchId
    });
  }

  private async getExpenseSummary(filters: any) {
    try {
      const stats = await this.expenseRepository.getDashboardStatistics(filters);
      return {
        total: Number(stats?.summary?.totalExpenses || 0),
        growth: 5, // Mock growth for now
        expenseCount: Number(stats?.summary?.totalCount || 0)
      };
    } catch (error) {
      console.error('Error getting expense summary:', error);
      return { total: 0, growth: 0, expenseCount: 0 };
    }
  }

  private async getRevenueSummary(filters: any) {
    try {
      // Get sales as revenue source
      const salesData = await this.transactionRepository.getSalesByDateRange(
        filters.dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString(),
        filters.dateTo || new Date().toISOString()
      );

      const total = salesData.reduce((sum: number, sale: any) => sum + Number(sale.totalAmount || 0), 0);

      return {
        total,
        growth: 12, // Mock growth for now
        transactionCount: salesData.length
      };
    } catch (error) {
      console.error('Error getting revenue summary:', error);
      return { total: 0, growth: 0, transactionCount: 0 };
    }
  }

  private async getRevenueByPeriod(period: string, startDate: Date, endDate: Date, branchId?: number) {
    const revenueData = await this.transactionRepository.getRevenueByPeriod(period, startDate, endDate, branchId);
    return revenueData;
  }

  private async getExpensesByPeriod(period: string, startDate: Date, endDate: Date, branchId?: number) {
    const expenses = await this.expenseRepository.getExpenseTrends({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
      branchId
    });

    return expenses;
  }

  private combineProfitLossData(revenueData: any[], expenseData: any[]) {
    const periodMap = new Map();

    // Add revenue data
    revenueData.forEach(item => {
      const period = item.period || item.month || item.date;
      periodMap.set(period, {
        period,
        income: Number(item.total || item.totalAmount || 0),
        expenses: 0,
        profit: 0
      });
    });

    // Add expense data
    expenseData.forEach(item => {
      const period = item.period || item.month || item.date;
      const existing = periodMap.get(period) || { period, income: 0, expenses: 0, profit: 0 };
      existing.expenses = Number(item.total || item.totalAmount || 0);
      periodMap.set(period, existing);
    });

    // Calculate profit and return as array
    const result = Array.from(periodMap.values()).map(item => ({
      ...item,
      profit: item.income - item.expenses
    }));

    return result.sort((a, b) => a.period.localeCompare(b.period));
  }

  private groupByPeriod(data: any[], period: string, valueField: string) {
    const grouped = data.reduce((acc: any, item: any) => {
      const date = new Date(item.createdAt || item.expenseDate);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!acc[key]) {
        acc[key] = { period: key, total: 0, count: 0 };
      }

      acc[key].total += Number(item[valueField] || 0);
      acc[key].count += 1;

      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period));
  }

  private calculateCashFlow(transactions: any[]) {
    return {
      inflow: transactions.filter(t => Number(t.totalAmount) > 0).reduce((sum, t) => sum + Number(t.totalAmount), 0),
      outflow: transactions.filter(t => Number(t.totalAmount) < 0).reduce((sum, t) => sum + Math.abs(Number(t.totalAmount)), 0),
      net: transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    };
  }

  private getChartColor(index: number): string {
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];
    return colors[index % colors.length];
  }
}