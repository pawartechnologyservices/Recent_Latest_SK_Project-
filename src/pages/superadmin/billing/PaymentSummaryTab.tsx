import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Receipt, 
  RefreshCw,
  Loader2,
  FileType,
  AlertCircle,
  CheckCircle,
  BarChart3,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  Home,
  Shield,
  Car,
  Trash2,
  Droplets,
  Users
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import InvoiceService from "@/services/InvoiceService";
import { expenseService } from "@/services/expenseService";
import { toast } from "sonner";

interface PaymentSummaryTabProps {}

// Define interfaces for data from APIs
interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  _id: string;
  id: string;
  invoiceNumber: string;
  voucherNo?: string;
  client: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  date: string;
  dueDate?: string;
  invoiceType: "tax" | "perform";
  items: InvoiceItem[];
  tax: number;
  clientEmail?: string;
  site?: string;
  serviceType?: string;
  gstNumber?: string;
  panNumber?: string;
  managementFeesPercent?: number;
  managementFeesAmount?: number;
  sacCode?: string;
  serviceLocation?: string;
  servicePeriodFrom?: string;
  servicePeriodTo?: string;
  roundUp?: number;
  baseAmount?: number;
  paymentMethod?: string;
  paymentTerms?: string;
  subtotal?: number;
  discount?: number;
}

interface Expense {
  _id: string;
  expenseId: string;
  category: string;
  description: string;
  amount: number;
  baseAmount: number;
  gst: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  vendor: string;
  paymentMethod: string;
  site: string;
  expenseType: "operational" | "office" | "other";
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentMethodDistribution {
  method: string;
  count: number;
  amount: number;
  percentage: number;
  Icon: React.ComponentType<{ className?: string }>;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Helper function to get icon component for payment method
const getPaymentMethodIcon = (method: string): React.ComponentType<{ className?: string }> => {
  const methodLower = (method || "").toLowerCase();
  if (methodLower.includes('bank') || methodLower.includes('transfer') || methodLower.includes('neft') || methodLower.includes('rtgs')) 
    return Banknote;
  if (methodLower.includes('upi') || methodLower.includes('phonepe') || methodLower.includes('google') || methodLower.includes('paytm')) 
    return Smartphone;
  if (methodLower.includes('credit') || methodLower.includes('debit') || methodLower.includes('card')) 
    return CreditCard;
  if (methodLower.includes('cash')) 
    return Wallet;
  if (methodLower.includes('cheque')) 
    return CreditCard;
  return CreditCard;
};

// Get service icon component
const getServiceIcon = (serviceType: string = ""): React.ReactNode => {
  switch (serviceType?.toLowerCase()) {
    case "housekeeping management": return <Home className="h-4 w-4 text-blue-600" />;
    case "security management": return <Shield className="h-4 w-4 text-green-600" />;
    case "parking management": return <Car className="h-4 w-4 text-purple-600" />;
    case "waste management": return <Trash2 className="h-4 w-4 text-red-600" />;
    case "stp tank cleaning": return <Droplets className="h-4 w-4 text-cyan-600" />;
    case "consumables supply": return <Package className="h-4 w-4 text-orange-600" />;
    default: return <Users className="h-4 w-4 text-gray-600" />;
  }
};

// Get badge variant for status
const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case "paid":
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "overdue":
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

const PaymentSummaryTab: React.FC<PaymentSummaryTabProps> = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState({
    invoices: true,
    expenses: true,
    all: true
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'summary' | 'invoices' | 'expenses'>('summary');
  const [paymentMethodDistribution, setPaymentMethodDistribution] = useState<PaymentMethodDistribution[]>([]);
  
  // Mobile responsive state
  const [isMobileView, setIsMobileView] = useState(false);

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setError(null);
      setRefreshing(true);
      setLoading(prev => ({ ...prev, all: true }));
      
      await Promise.all([
        fetchAllInvoices(),
        fetchExpenses()
      ]);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRefreshing(false);
      setLoading(prev => ({ ...prev, all: false }));
    }
  };

  const fetchAllInvoices = async () => {
    try {
      setLoading(prev => ({ ...prev, invoices: true }));
      let data;
      try {
        const invoiceService = new InvoiceService();
        data = await invoiceService.getAllInvoices();
      } catch (serviceError) {
        console.log('InvoiceService failed, trying direct API call...', serviceError);
        const response = await fetch(`https://${window.location.hostname}:5001/api/invoices`);
        if (!response.ok) throw new Error('Failed to fetch invoices');
        const result = await response.json();
        data = result.data || result;
      }
      
      const invoicesArray = Array.isArray(data) ? data : [];
      
      // Map ALL invoices (both tax and perform)
      const mappedInvoices = invoicesArray.map((invoice: any): Invoice => ({
        _id: invoice._id || invoice.id,
        id: invoice.id || invoice._id || `INV-${Date.now()}`,
        invoiceNumber: invoice.invoiceNumber || invoice.id || `INV-${Date.now()}`,
        voucherNo: invoice.voucherNo,
        client: invoice.client || "Unknown Client",
        amount: Number(invoice.amount) || 0,
        status: (invoice.status as "pending" | "paid" | "overdue") || "pending",
        date: invoice.date || new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate,
        invoiceType: invoice.invoiceType || "perform",
        items: Array.isArray(invoice.items) ? invoice.items : [],
        tax: Number(invoice.tax) || 0,
        clientEmail: invoice.clientEmail,
        site: invoice.site,
        serviceType: invoice.serviceType,
        gstNumber: invoice.gstNumber,
        panNumber: invoice.panNumber,
        managementFeesPercent: Number(invoice.managementFeesPercent) || 0,
        managementFeesAmount: Number(invoice.managementFeesAmount) || 0,
        sacCode: invoice.sacCode,
        serviceLocation: invoice.serviceLocation,
        servicePeriodFrom: invoice.servicePeriodFrom,
        servicePeriodTo: invoice.servicePeriodTo,
        roundUp: Number(invoice.roundUp) || 0,
        baseAmount: Number(invoice.baseAmount) || Number(invoice.subtotal) || Number(invoice.amount) || 0,
        paymentMethod: invoice.paymentMethod || invoice.payment_mode || invoice.paymentType || "Not Specified",
        paymentTerms: invoice.paymentTerms,
        subtotal: Number(invoice.subtotal) || Number(invoice.amount) || 0,
        discount: Number(invoice.discount) || 0
      }));
      
      console.log('All invoices with payment methods:', mappedInvoices.map(i => ({ client: i.client, paymentMethod: i.paymentMethod, status: i.status })));
      setInvoices(mappedInvoices);
      return mappedInvoices;
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setInvoices([]);
      toast.error("Failed to fetch invoices");
      return [];
    } finally {
      setLoading(prev => ({ ...prev, invoices: false }));
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(prev => ({ ...prev, expenses: true }));
      let data;
      try {
        // Try to get expenses from the service - fetch ALL expenses without filtering by status
        const result = await expenseService.getExpenses({});
        data = result.data || result;
        console.log('Expenses from service (all):', data);
      } catch (serviceError) {
        console.log('ExpenseService failed, trying direct API call...', serviceError);
        const response = await fetch(`https://${window.location.hostname}:5001/api/expenses`);
        if (!response.ok) throw new Error('Failed to fetch expenses');
        const result = await response.json();
        data = result.data || result;
        console.log('Expenses from direct API (all):', data);
      }
      
      const expensesArray = Array.isArray(data) ? data : [];
      
      // More comprehensive mapping to capture paymentMethod from various possible field names
      const mappedExpenses = expensesArray.map((expense: any): Expense => {
        // Try multiple possible field names for payment method
        let paymentMethodValue = "Not Specified";
        if (expense.paymentMethod && expense.paymentMethod !== "Not Specified") {
          paymentMethodValue = expense.paymentMethod;
        } else if (expense.payment_method && expense.payment_method !== "Not Specified") {
          paymentMethodValue = expense.payment_method;
        } else if (expense.paymentMode && expense.paymentMode !== "Not Specified") {
          paymentMethodValue = expense.paymentMode;
        } else if (expense.payment_mode && expense.payment_mode !== "Not Specified") {
          paymentMethodValue = expense.payment_mode;
        } else if (expense.paymentType && expense.paymentType !== "Not Specified") {
          paymentMethodValue = expense.paymentType;
        } else if (expense.payment_type && expense.payment_type !== "Not Specified") {
          paymentMethodValue = expense.payment_type;
        }
        
        // Log each expense's payment method for debugging
        console.log(`Expense ${expense._id}: paymentMethod = ${paymentMethodValue}, status = ${expense.status}, amount = ${expense.amount}, original fields:`, {
          paymentMethod: expense.paymentMethod,
          payment_method: expense.payment_method,
          paymentMode: expense.paymentMode,
          payment_mode: expense.payment_mode,
          paymentType: expense.paymentType,
          payment_type: expense.payment_type
        });
        
        return {
          _id: expense._id || expense.id,
          expenseId: expense.expenseId || expense._id || `EXP-${Date.now()}`,
          category: expense.category || "Uncategorized",
          description: expense.description || "No description",
          amount: Number(expense.amount) || 0,
          baseAmount: Number(expense.baseAmount) || Number(expense.amount) || 0,
          gst: Number(expense.gst) || 0,
          date: expense.date || new Date().toISOString().split('T')[0],
          status: (expense.status as "pending" | "approved" | "rejected") || "pending",
          vendor: expense.vendor || "Unknown Vendor",
          paymentMethod: paymentMethodValue,
          site: expense.site || expense.siteId?.name || "Unknown Site",
          expenseType: (expense.expenseType as "operational" | "office" | "other") || "other",
          notes: expense.notes,
          createdBy: expense.createdBy,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt
        };
      });
      
      console.log('Mapped expenses (ALL):', mappedExpenses.map(e => ({ description: e.description, paymentMethod: e.paymentMethod, status: e.status, amount: e.amount })));
      setExpenses(mappedExpenses);
      return mappedExpenses;
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
      toast.error("Failed to fetch expenses");
      return [];
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  };

  // Calculate payment methods distribution - NOW INCLUDES ALL EXPENSES (not just approved)
  const calculatePaymentMethods = (): PaymentMethodDistribution[] => {
    const methodTotals: Record<string, { count: number; amount: number }> = {};
    let totalAmount = 0;

    console.log('=== Calculating Payment Methods Distribution ===');
    console.log('Total expenses (ALL):', expenses.length);
    console.log('Total invoices:', invoices.length);

    // Count payment methods from ALL expenses with payment method (not filtering by status)
    const expensesWithPayment = expenses.filter(e => {
      const hasValidPayment = e.paymentMethod && e.paymentMethod !== "Not Specified";
      if (hasValidPayment) {
        console.log(`Expense: ${e.description}, status: ${e.status}, paymentMethod: ${e.paymentMethod}, amount: ${e.amount}`);
      }
      return hasValidPayment;
    });
    
    console.log('Expenses with valid payment methods (ALL statuses):', expensesWithPayment.length);
    
    expensesWithPayment.forEach(expense => {
      const method = expense.paymentMethod;
      if (!methodTotals[method]) {
        methodTotals[method] = { count: 0, amount: 0 };
      }
      methodTotals[method].count++;
      methodTotals[method].amount += expense.amount;
      totalAmount += expense.amount;
    });

    // Count payment methods from paid invoices (BOTH tax AND perform)
    const paidInvoices = invoices.filter(i => {
      const hasValidPayment = i.status === "paid" && i.paymentMethod && i.paymentMethod !== "Not Specified";
      if (hasValidPayment) {
        console.log(`Paid invoice: ${i.invoiceNumber}, client: ${i.client}, paymentMethod: ${i.paymentMethod}, amount: ${i.amount}`);
      }
      return hasValidPayment;
    });
    
    console.log('Paid invoices with valid payment methods:', paidInvoices.length);
    
    paidInvoices.forEach(invoice => {
      const method = invoice.paymentMethod;
      if (!methodTotals[method]) {
        methodTotals[method] = { count: 0, amount: 0 };
      }
      methodTotals[method].count++;
      methodTotals[method].amount += invoice.amount;
      totalAmount += invoice.amount;
    });

    console.log('Payment method totals:', methodTotals);
    console.log('Total amount across all methods:', totalAmount);

    // Convert to array and calculate percentages
    const distribution = Object.entries(methodTotals).map(([method, data]) => {
      const percentage = totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0;
      const Icon = getPaymentMethodIcon(method);
      return {
        method,
        ...data,
        percentage,
        Icon
      };
    });

    // Sort by amount descending
    const sorted = distribution.sort((a, b) => b.amount - a.amount);
    console.log('Final payment method distribution:', sorted);
    
    return sorted;
  };

  // Update payment methods distribution when data changes
  useEffect(() => {
    const distribution = calculatePaymentMethods();
    setPaymentMethodDistribution(distribution);
  }, [invoices, expenses]);

  // Filter data for display
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const allExpenses = expenses; // ALL expenses for display
  const pendingInvoices = invoices.filter(i => i.status === "pending");
  const overdueInvoices = invoices.filter(i => i.status === "overdue");

  // Calculate totals - use ALL expenses for total expenses amount
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalTaxableValue = paidInvoices.reduce((sum, inv) => 
    sum + (inv.baseAmount || inv.amount - inv.tax - (inv.managementFeesAmount || 0)), 0);
  const totalGST = paidInvoices.reduce((sum, inv) => sum + inv.tax, 0);
  const totalExpensesAmount = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpensesGST = allExpenses.reduce((sum, exp) => sum + exp.gst, 0);
  const totalExpensesBase = totalExpensesAmount - totalExpensesGST;
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Calculate net profit using ALL expenses
  const netProfit = totalRevenue - totalExpensesAmount;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const topPaymentMethod = paymentMethodDistribution.length > 0 ? paymentMethodDistribution[0] : null;

  // Mobile Invoice Card Component
  const MobileInvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const PaymentIcon = getPaymentMethodIcon(invoice.paymentMethod || "Unknown");
    
    return (
      <Card className="mb-2 overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-mono text-muted-foreground">
                {invoice.voucherNo || invoice.invoiceNumber || invoice.id}
              </p>
              <h3 className="font-semibold text-sm mt-1">{invoice.client}</h3>
            </div>
            <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-xs">
              {invoice.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="outline" className="text-xs">
                {invoice.invoiceType === "tax" ? "Tax Invoice" : "Performance Invoice"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{formatDate(invoice.date)}</span>
            </div>
            {invoice.paymentMethod && invoice.paymentMethod !== "Not Specified" && (
              <div className="flex items-center gap-1 text-xs">
                <PaymentIcon className="h-3 w-3 text-purple-600" />
                <span className="text-muted-foreground">{invoice.paymentMethod}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Type:</span>
              <span className="text-xs">{invoice.invoiceType === "tax" ? "Tax Invoice" : "Performance"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <span className="text-xs font-medium">Total:</span>
            <span className="text-base font-bold text-green-600">{formatCurrency(invoice.amount)}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Mobile Expense Card Component
  const MobileExpenseCard = ({ expense }: { expense: Expense }) => {
    const IconComponent = getPaymentMethodIcon(expense.paymentMethod);

    return (
      <Card className="mb-2 overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-mono text-muted-foreground">{expense.expenseId}</p>
              <h3 className="font-semibold text-sm mt-1">{expense.description}</h3>
            </div>
            <Badge variant={getStatusBadgeVariant(expense.status)} className="text-xs">
              {expense.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{formatDate(expense.date)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Vendor:</span>
              <span className="text-xs truncate max-w-[100px]">{expense.vendor}</span>
            </div>
            {expense.paymentMethod && expense.paymentMethod !== "Not Specified" && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <IconComponent className="h-3 w-3" />
                {expense.paymentMethod}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Base:</span>
              <span className="text-xs">{formatCurrency(expense.baseAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600">GST:</span>
              <span className="text-xs text-blue-600 font-medium">{formatCurrency(expense.gst)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <span className="text-xs font-medium">Total:</span>
            <span className="text-base font-bold text-red-600">{formatCurrency(expense.amount)}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (loading.all && !refreshing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
          <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-primary mb-4" />
          <h3 className="text-base md:text-lg font-semibold mb-2">Loading Financial Data</h3>
          <p className="text-xs md:text-sm text-muted-foreground">Please wait while we fetch your financial information...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
          <AlertCircle className="h-8 w-8 md:h-12 md:w-12 text-red-500 mb-4" />
          <h3 className="text-base md:text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-xs md:text-sm text-muted-foreground text-center mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={fetchAllData} size={isMobileView ? "sm" : "default"}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} size={isMobileView ? "sm" : "default"}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Financial Summary
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchAllData}
            disabled={refreshing}
            className="flex items-center gap-2 h-8 sm:h-10 text-xs sm:text-sm"
            size={isMobileView ? "sm" : "default"}
          >
            {refreshing ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            {!isMobileView && "Refresh"}
          </Button>
        </div>
      </CardHeader>
      
      {/* View Toggle */}
      <div className="px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap gap-2 border rounded-lg p-1 w-fit">
          <Button
            variant={selectedView === 'summary' ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView('summary')}
            className="flex-1"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Summary
          </Button>
          <Button
            variant={selectedView === 'invoices' ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView('invoices')}
            className="flex-1"
          >
            <FileType className="mr-2 h-4 w-4" />
            Paid Invoices ({paidInvoices.length})
          </Button>
          <Button
            variant={selectedView === 'expenses' ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView('expenses')}
            className="flex-1"
          >
            <Receipt className="mr-2 h-4 w-4" />
            All Expenses ({allExpenses.length})
          </Button>
        </div>
      </div>

      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">
                      {paidInvoices.length} paid invoices
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Pending:</span>
                  <span className="text-yellow-600">{formatCurrency(pendingAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Overdue:</span>
                  <span className="text-red-600">{formatCurrency(overdueAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalExpensesAmount)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-xs text-muted-foreground">
                      {allExpenses.length} total expenses
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Base Amount:</span>
                  <span>{formatCurrency(totalExpensesBase)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>GST Paid:</span>
                  <span className="text-blue-600">{formatCurrency(totalExpensesGST)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfit)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {netProfit >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {profitMargin.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`h-6 w-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Revenue:</span>
                  <span>{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Expenses:</span>
                  <span>{formatCurrency(totalExpensesAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Methods</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {paymentMethodDistribution.length}
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {topPaymentMethod ? (
                      <span className="text-purple-600">{topPaymentMethod.method}</span>
                    ) : (
                      "No Data"
                    )}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                {paymentMethodDistribution.length > 0 ? (
                  paymentMethodDistribution.slice(0, 2).map((method) => {
                    const IconComponent = method.Icon;
                    return (
                      <div key={method.method} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium truncate max-w-[100px]">
                            {method.method}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{method.percentage}%</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(method.amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No payment data available
                  </div>
                )}
                
                {paymentMethodDistribution.length > 2 && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">
                      +{paymentMethodDistribution.length - 2} more methods
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedView === 'summary' ? (
          <>
            {/* Payment Methods Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Payment Methods Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethodDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethodDistribution.map((method) => {
                      const IconComponent = method.Icon;
                      return (
                        <div key={method.method} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1">
                              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                                <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs sm:text-sm truncate">{method.method}</p>
                                <p className="text-xs text-muted-foreground">
                                  {method.count} {method.count === 1 ? 'transaction' : 'transactions'} • {formatCurrency(method.amount)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm sm:text-lg font-bold text-purple-600">{method.percentage}%</p>
                            </div>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${method.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">No payment methods data available</p>
                    <p className="text-xs mt-1">Add paid invoices or expenses with payment methods to see distribution</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Paid Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Paid Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Invoice No</TableHead>
                          <TableHead className="whitespace-nowrap">Client</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                          <TableHead className="whitespace-nowrap">Payment Method</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidInvoices.length > 0 ? (
                          paidInvoices.slice(0, 10).map((invoice) => {
                            const PaymentIcon = getPaymentMethodIcon(invoice.paymentMethod || "Unknown");
                            return (
                              <TableRow key={invoice._id} className="hover:bg-muted/50">
                                <TableCell className="font-medium whitespace-nowrap">
                                  {invoice.voucherNo || invoice.invoiceNumber || invoice.id}
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-[200px]">
                                    <p className="font-medium text-sm truncate">{invoice.client}</p>
                                    {invoice.clientEmail && (
                                      <p className="text-xs text-muted-foreground truncate">{invoice.clientEmail}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="whitespace-nowrap">
                                    {invoice.invoiceType === "tax" ? "Tax Invoice" : "Performance"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {formatDate(invoice.date)}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-green-600 whitespace-nowrap">
                                  {formatCurrency(invoice.amount)}
                                </TableCell>
                                <TableCell>
                                  {invoice.paymentMethod && invoice.paymentMethod !== "Not Specified" ? (
                                    <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                      <PaymentIcon className="h-3 w-3" />
                                      {invoice.paymentMethod}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(invoice.status)} className="whitespace-nowrap">
                                    {invoice.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <FileType className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No paid invoices found</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Mark invoices as paid to see them here
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : selectedView === 'invoices' ? (
          /* All Paid Invoices Table View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileType className="h-5 w-5 text-green-600" />
                All Paid Invoices ({paidInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.invoices ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading invoices...</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Invoice No</TableHead>
                          <TableHead className="whitespace-nowrap">Client</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                          <TableHead className="whitespace-nowrap">Payment Method</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidInvoices.map((invoice) => {
                          const PaymentIcon = getPaymentMethodIcon(invoice.paymentMethod || "Unknown");
                          return (
                            <TableRow key={invoice._id} className="hover:bg-muted/50">
                              <TableCell className="font-medium whitespace-nowrap">
                                {invoice.voucherNo || invoice.invoiceNumber || invoice.id}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[200px]">
                                  <p className="font-medium text-sm truncate">{invoice.client}</p>
                                  {invoice.clientEmail && (
                                    <p className="text-xs text-muted-foreground truncate">{invoice.clientEmail}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="whitespace-nowrap">
                                  {invoice.invoiceType === "tax" ? "Tax Invoice" : "Performance"}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatDate(invoice.date)}</TableCell>
                              <TableCell className="font-semibold text-green-600 whitespace-nowrap">
                                {formatCurrency(invoice.amount)}
                              </TableCell>
                              <TableCell>
                                {invoice.paymentMethod && invoice.paymentMethod !== "Not Specified" ? (
                                  <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                    <PaymentIcon className="h-3 w-3" />
                                    {invoice.paymentMethod}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(invoice.status)} className="whitespace-nowrap">
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {paidInvoices.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <FileType className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No paid invoices found</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Mark invoices as paid to see them here
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* All Expenses View (ALL expenses regardless of status) */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-red-600" />
                All Expenses ({allExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.expenses ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading expenses...</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Expense ID</TableHead>
                          <TableHead className="whitespace-nowrap">Category</TableHead>
                          <TableHead className="whitespace-nowrap">Description</TableHead>
                          <TableHead className="whitespace-nowrap">Vendor</TableHead>
                          <TableHead className="whitespace-nowrap">Payment Method</TableHead>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allExpenses.map((expense) => {
                          const IconComponent = getPaymentMethodIcon(expense.paymentMethod);
                          return (
                            <TableRow key={expense._id} className="hover:bg-muted/50">
                              <TableCell className="font-medium whitespace-nowrap">{expense.expenseId}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                  <span>{expense.category}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                              <TableCell className="whitespace-nowrap">{expense.vendor}</TableCell>
                              <TableCell>
                                {expense.paymentMethod && expense.paymentMethod !== "Not Specified" ? (
                                  <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                    <IconComponent className="h-3 w-3" />
                                    {expense.paymentMethod}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(expense.status)} className="whitespace-nowrap">
                                  {expense.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-red-600 whitespace-nowrap">
                                {formatCurrency(expense.amount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {allExpenses.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No expenses found</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Add expenses in the Expenses tab to see them here
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentSummaryTab;