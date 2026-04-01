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
  Users,
  ChevronDown,
  ChevronUp,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentSummaryTabProps {}

// Define interfaces for data from APIs
interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface TaxInvoice {
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

// Mobile responsive stat card
const MobileStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue", 
  subValue,
  trend 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  color?: string;
  subValue?: string;
  trend?: React.ReactNode;
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600"
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
            {trend && <div className="mt-1">{trend}</div>}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Mobile responsive invoice card
const MobileInvoiceCard = ({ 
  invoice, 
  formatCurrency,
  formatDate,
  getServiceIcon,
  getStatusBadgeVariant 
}: { 
  invoice: TaxInvoice; 
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getServiceIcon: (serviceType?: string) => React.ReactNode;
  getStatusBadgeVariant: (status: string) => "default" | "secondary" | "destructive" | "outline";
}) => {
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

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 text-xs">
            {getServiceIcon(invoice.serviceType)}
            <span className="text-muted-foreground">{invoice.serviceType || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>{formatDate(invoice.date)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Taxable:</span>
            <span className="text-xs">{formatCurrency(invoice.baseAmount || invoice.amount - invoice.tax - (invoice.managementFeesAmount || 0))}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600">GST:</span>
            <span className="text-xs text-blue-600 font-medium">{formatCurrency(invoice.tax)}</span>
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

// Mobile responsive expense card
const MobileExpenseCard = ({ 
  expense, 
  formatCurrency,
  formatDate,
  getExpenseCategoryIcon,
  getPaymentMethodIcon,
  getStatusBadgeVariant 
}: { 
  expense: Expense; 
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getExpenseCategoryIcon: (category: string) => React.ReactNode;
  getPaymentMethodIcon: (method: string) => React.ComponentType<{ className?: string }>;
  getStatusBadgeVariant: (status: string) => "default" | "secondary" | "destructive" | "outline";
}) => {
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

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 text-xs">
            {getExpenseCategoryIcon(expense.category)}
            <span className="text-muted-foreground">{expense.category}</span>
          </div>
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
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <IconComponent className="h-3 w-3" />
            {expense.paymentMethod}
          </Badge>
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
  const methodLower = method.toLowerCase();
  if (methodLower.includes('bank') || methodLower.includes('transfer')) return Banknote;
  if (methodLower.includes('upi') || methodLower.includes('phonepe') || methodLower.includes('google')) return Smartphone;
  if (methodLower.includes('credit') || methodLower.includes('debit') || methodLower.includes('card')) return CreditCard;
  if (methodLower.includes('cash')) return Wallet;
  return CreditCard;
};

// Get service icon component
const getServiceIcon = (serviceType: string = ""): React.ReactNode => {
  switch (serviceType.toLowerCase()) {
    case "housekeeping management": return <Home className="h-4 w-4 text-blue-600" />;
    case "security management": return <Shield className="h-4 w-4 text-green-600" />;
    case "parking management": return <Car className="h-4 w-4 text-purple-600" />;
    case "waste management": return <Trash2 className="h-4 w-4 text-red-600" />;
    case "stp tank cleaning": return <Droplets className="h-4 w-4 text-cyan-600" />;
    case "consumables supply": return <Package className="h-4 w-4 text-orange-600" />;
    default: return <Users className="h-4 w-4 text-gray-600" />;
  }
};

// Get expense category icon component
const getExpenseCategoryIcon = (category: string = ""): React.ReactNode => {
  switch (category.toLowerCase()) {
    case "cleaning supplies": return <Package className="h-4 w-4 text-blue-600" />;
    case "security equipment": return <Shield className="h-4 w-4 text-green-600" />;
    case "office supplies": return <Package className="h-4 w-4 text-purple-600" />;
    case "utilities": return <Droplets className="h-4 w-4 text-cyan-600" />;
    case "maintenance": return <Trash2 className="h-4 w-4 text-red-600" />;
    case "transportation": return <Car className="h-4 w-4 text-orange-600" />;
    default: return <Receipt className="h-4 w-4 text-gray-600" />;
  }
};

// Get badge variant for status
const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
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
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
        fetchTaxInvoices(),
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

  const fetchTaxInvoices = async () => {
    try {
      setLoading(prev => ({ ...prev, invoices: true }));
      let data;
      try {
        // Try to use InvoiceService
        const invoiceService = new InvoiceService();
        data = await invoiceService.getAllInvoices();
      } catch (serviceError) {
        console.log('InvoiceService failed, trying direct API call...', serviceError);
        // Fallback to direct API call
        const response = await fetch(`https://${window.location.hostname}:5001/api/invoices`);
        if (!response.ok) throw new Error('Failed to fetch invoices');
        const result = await response.json();
        data = result.data || result;
      }
      
      // Ensure we have an array
      const invoicesArray = Array.isArray(data) ? data : [];
      
      // Filter only tax invoices and ensure proper typing
      const taxInvoices = invoicesArray
        .filter((invoice: any) => invoice.invoiceType === "tax")
        .map((invoice: any): TaxInvoice => ({
          _id: invoice._id || invoice.id,
          id: invoice.id || invoice._id || `INV-${Date.now()}`,
          invoiceNumber: invoice.invoiceNumber || invoice.id || `INV-${Date.now()}`,
          voucherNo: invoice.voucherNo,
          client: invoice.client || "Unknown Client",
          amount: Number(invoice.amount) || 0,
          status: (invoice.status as "pending" | "paid" | "overdue") || "pending",
          date: invoice.date || new Date().toISOString().split('T')[0],
          dueDate: invoice.dueDate,
          invoiceType: "tax",
          items: Array.isArray(invoice.items) ? invoice.items : [],
          tax: Number(invoice.tax) || 0,
          clientEmail: invoice.clientEmail,
          site: invoice.site,
          serviceType: invoice.serviceType,
          gstNumber: invoice.gstNumber,
          panNumber: invoice.panNumber,
          managementFeesPercent: Number(invoice.managementFeesPercent) || 5,
          managementFeesAmount: Number(invoice.managementFeesAmount) || 0,
          sacCode: invoice.sacCode,
          serviceLocation: invoice.serviceLocation,
          servicePeriodFrom: invoice.servicePeriodFrom,
          servicePeriodTo: invoice.servicePeriodTo,
          roundUp: Number(invoice.roundUp) || 0,
          baseAmount: Number(invoice.baseAmount) || Number(invoice.amount) || 0,
          paymentMethod: invoice.paymentMethod,
          subtotal: Number(invoice.subtotal) || Number(invoice.amount) || 0,
          discount: Number(invoice.discount) || 0
        }));
      
      setInvoices(taxInvoices);
      return taxInvoices;
    } catch (err: any) {
      console.error('Error fetching tax invoices:', err);
      setInvoices([]);
      toast.error("Failed to fetch tax invoices");
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
        // Try to use expenseService
        const result = await expenseService.getExpenses({});
        data = result.data || result;
      } catch (serviceError) {
        console.log('ExpenseService failed, trying direct API call...', serviceError);
        // Fallback to direct API call
        const response = await fetch(`https://${window.location.hostname}:5001/api/expenses`);
        if (!response.ok) throw new Error('Failed to fetch expenses');
        const result = await response.json();
        data = result.data || result;
      }
      
      // Ensure we have an array
      const expensesArray = Array.isArray(data) ? data : [];
      
      // Map to Expense interface
      const mappedExpenses = expensesArray.map((expense: any): Expense => ({
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
        paymentMethod: expense.paymentMethod || "Unknown",
        site: expense.site || "Unknown Site",
        expenseType: (expense.expenseType as "operational" | "office" | "other") || "other",
        notes: expense.notes,
        createdBy: expense.createdBy,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      }));
      
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

  // Calculate payment methods distribution
  const calculatePaymentMethods = (): PaymentMethodDistribution[] => {
    const methodTotals: Record<string, { count: number; amount: number }> = {};
    let totalAmount = 0;

    // Count payment methods from approved expenses
    const approvedExpenses = expenses.filter(e => e.status === "approved");
    approvedExpenses.forEach(expense => {
      const method = expense.paymentMethod || "Unknown";
      if (!methodTotals[method]) {
        methodTotals[method] = { count: 0, amount: 0 };
      }
      methodTotals[method].count++;
      methodTotals[method].amount += expense.amount;
      totalAmount += expense.amount;
    });

    // Count payment methods from paid invoices
    const paidTaxInvoices = invoices.filter(i => i.status === "paid");
    paidTaxInvoices.forEach(invoice => {
      const method = invoice.paymentMethod || "Unknown";
      if (!methodTotals[method]) {
        methodTotals[method] = { count: 0, amount: 0 };
      }
      methodTotals[method].count++;
      methodTotals[method].amount += invoice.amount;
      totalAmount += invoice.amount;
    });

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
    return distribution.sort((a, b) => b.amount - a.amount);
  };

  // Update payment methods distribution when data changes
  useEffect(() => {
    const distribution = calculatePaymentMethods();
    setPaymentMethodDistribution(distribution);
  }, [invoices, expenses]);

  // Filter data
  const paidTaxInvoices = invoices.filter(i => i.status === "paid");
  const approvedExpenses = expenses.filter(e => e.status === "approved");
  const pendingInvoices = invoices.filter(i => i.status === "pending");
  const overdueInvoices = invoices.filter(i => i.status === "overdue");
  const pendingExpenses = expenses.filter(e => e.status === "pending");

  // Calculate totals
  const totalTaxRevenue = paidTaxInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalTaxableValue = paidTaxInvoices.reduce((sum, inv) => 
    sum + (inv.baseAmount || inv.amount - inv.tax - (inv.managementFeesAmount || 0)), 0);
  const totalGST = paidTaxInvoices.reduce((sum, inv) => sum + inv.tax, 0);
  const totalExpensesAmount = approvedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpensesGST = approvedExpenses.reduce((sum, exp) => sum + exp.gst, 0);
  const totalExpensesBase = totalExpensesAmount - totalExpensesGST;
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pendingExpensesAmount = pendingExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate net profit
  const netProfit = totalTaxRevenue - totalExpensesAmount;
  const profitMargin = totalTaxRevenue > 0 ? (netProfit / totalTaxRevenue) * 100 : 0;

  const topPaymentMethod = paymentMethodDistribution.length > 0 ? paymentMethodDistribution[0] : null;

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
      
      {/* View Toggle - Mobile Dropdown */}
      {isMobileView ? (
        <div className="px-4 pb-4">
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Summary
                </div>
              </SelectItem>
              <SelectItem value="invoices">
                <div className="flex items-center">
                  <FileType className="h-4 w-4 mr-2" />
                  Tax Invoices ({paidTaxInvoices.length})
                </div>
              </SelectItem>
              <SelectItem value="expenses">
                <div className="flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
                  Expenses ({approvedExpenses.length})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        /* Desktop View Toggle */
        <div className="px-6 pb-4">
          <div className="flex border rounded-lg p-1 w-fit">
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
              Tax Invoices ({paidTaxInvoices.length})
            </Button>
            <Button
              variant={selectedView === 'expenses' ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedView('expenses')}
              className="flex-1"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Expenses ({approvedExpenses.length})
            </Button>
          </div>
        </div>
      )}

      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* UPDATED SUMMARY CARDS - Mobile Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {isMobileView ? (
            <>
              <MobileStatCard
                title="Revenue"
                value={formatCurrency(totalTaxRevenue)}
                icon={DollarSign}
                color="green"
                subValue={`${paidTaxInvoices.length} paid`}
                trend={
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">↑</span>
                  </div>
                }
              />
              <MobileStatCard
                title="Expenses"
                value={formatCurrency(totalExpensesAmount)}
                icon={Receipt}
                color="red"
                subValue={`${approvedExpenses.length} approved`}
                trend={
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">↓</span>
                  </div>
                }
              />
              <MobileStatCard
                title="Net Profit"
                value={formatCurrency(netProfit)}
                icon={BarChart3}
                color={netProfit >= 0 ? "green" : "red"}
                subValue={`${profitMargin.toFixed(1)}% margin`}
              />
              <MobileStatCard
                title="Methods"
                value={paymentMethodDistribution.length.toString()}
                icon={CreditCard}
                color="purple"
                subValue={topPaymentMethod ? topPaymentMethod.method : "No Data"}
              />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalTaxRevenue)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-muted-foreground">
                          {paidTaxInvoices.length} paid invoices
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
                          {approvedExpenses.length} approved expenses
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
                      <span>{formatCurrency(totalTaxRevenue)}</span>
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
            </>
          )}
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
                    <p className="text-xs mt-1">Add some paid invoices or approved expenses to see payment methods</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Paid Tax Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Paid Tax Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isMobileView ? (
                  <div className="space-y-2">
                    {paidTaxInvoices.length > 0 ? (
                      paidTaxInvoices.slice(0, 3).map((invoice) => (
                        <MobileInvoiceCard
                          key={invoice._id}
                          invoice={invoice}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                          getServiceIcon={getServiceIcon}
                          getStatusBadgeVariant={getStatusBadgeVariant}
                        />
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <FileType className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No paid tax invoices found</p>
                      </div>
                    )}
                    {paidTaxInvoices.length > 3 && (
                      <div className="text-center pt-2">
                        <p className="text-xs text-muted-foreground">
                          +{paidTaxInvoices.length - 3} more invoices
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Invoice No</TableHead>
                            <TableHead className="whitespace-nowrap">Client</TableHead>
                            <TableHead className="whitespace-nowrap">Service Type</TableHead>
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Taxable Value</TableHead>
                            <TableHead className="whitespace-nowrap">GST</TableHead>
                            <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paidTaxInvoices.length > 0 ? (
                            paidTaxInvoices.slice(0, 5).map((invoice) => (
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
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    {getServiceIcon(invoice.serviceType)}
                                    <span>{invoice.serviceType || "-"}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {formatDate(invoice.date)}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {formatCurrency(invoice.baseAmount || invoice.amount - invoice.tax - (invoice.managementFeesAmount || 0))}
                                </TableCell>
                                <TableCell className="text-blue-600 font-medium whitespace-nowrap">
                                  {formatCurrency(invoice.tax)}
                                </TableCell>
                                <TableCell className="font-semibold text-green-600 whitespace-nowrap">
                                  {formatCurrency(invoice.amount)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(invoice.status)} className="whitespace-nowrap">
                                    {invoice.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                <FileType className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No paid tax invoices found</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Mark tax invoices as paid to see them here
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

            {/* Recent Approved Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Approved Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isMobileView ? (
                  <div className="space-y-2">
                    {approvedExpenses.length > 0 ? (
                      approvedExpenses.slice(0, 3).map((expense) => (
                        <MobileExpenseCard
                          key={expense._id}
                          expense={expense}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                          getExpenseCategoryIcon={getExpenseCategoryIcon}
                          getPaymentMethodIcon={getPaymentMethodIcon}
                          getStatusBadgeVariant={getStatusBadgeVariant}
                        />
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No approved expenses found</p>
                      </div>
                    )}
                    {approvedExpenses.length > 3 && (
                      <div className="text-center pt-2">
                        <p className="text-xs text-muted-foreground">
                          +{approvedExpenses.length - 3} more expenses
                        </p>
                      </div>
                    )}
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
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Amount</TableHead>
                            <TableHead className="whitespace-nowrap">Payment Method</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedExpenses.length > 0 ? (
                            approvedExpenses.slice(0, 5).map((expense) => (
                              <TableRow key={expense._id} className="hover:bg-muted/50">
                                <TableCell className="font-medium whitespace-nowrap">{expense.expenseId}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    {getExpenseCategoryIcon(expense.category)}
                                    <span>{expense.category}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                                <TableCell className="whitespace-nowrap">{expense.vendor}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {formatDate(expense.date)}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-red-600 whitespace-nowrap">
                                  {formatCurrency(expense.amount)}
                                </TableCell>
                                <TableCell>
                                  {(() => {
                                    const IconComponent = getPaymentMethodIcon(expense.paymentMethod);
                                    return (
                                      <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                        <IconComponent className="h-3 w-3" />
                                        {expense.paymentMethod}
                                      </Badge>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(expense.status)} className="whitespace-nowrap">
                                    {expense.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No approved expenses found</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Approve expenses in the Expenses tab to see them here
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

            {/* Financial Statistics - Mobile Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Revenue Statistics */}
              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Revenue Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Total Revenue:</span>
                      <span className="font-semibold text-green-600 text-xs sm:text-sm">{formatCurrency(totalTaxRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Total Invoices:</span>
                      <span className="font-medium text-xs sm:text-sm">{paidTaxInvoices.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Average Invoice:</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {paidTaxInvoices.length > 0 ? 
                          formatCurrency(totalTaxRevenue / paidTaxInvoices.length) : 
                          formatCurrency(0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Total GST:</span>
                      <span className="font-medium text-blue-600 text-xs sm:text-sm">{formatCurrency(totalGST)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium text-xs sm:text-sm">GST Rate:</span>
                      <span className="font-semibold text-blue-600 text-xs sm:text-sm">
                        {totalTaxableValue > 0 ? 
                          ((totalGST / totalTaxableValue) * 100).toFixed(2) : 
                          "0.00"}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expenses Statistics */}
              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-red-600" />
                    Expenses Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Total Expenses:</span>
                      <span className="font-semibold text-red-600 text-xs sm:text-sm">{formatCurrency(totalExpensesAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Total Items:</span>
                      <span className="font-medium text-xs sm:text-sm">{approvedExpenses.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Average Expense:</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {approvedExpenses.length > 0 ? 
                          formatCurrency(totalExpensesAmount / approvedExpenses.length) : 
                          formatCurrency(0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Pending Expenses:</span>
                      <span className="font-medium text-yellow-600 text-xs sm:text-sm">{formatCurrency(pendingExpensesAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium text-xs sm:text-sm">GST Rate:</span>
                      <span className="font-semibold text-blue-600 text-xs sm:text-sm">
                        {totalExpensesBase > 0 ? 
                          ((totalExpensesGST / totalExpensesBase) * 100).toFixed(2) : 
                          "0.00"}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : selectedView === 'invoices' ? (
          /* All Paid Tax Invoices Table View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileType className="h-5 w-5 text-green-600" />
                All Paid Tax Invoices ({paidTaxInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.invoices ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading invoices...</p>
                </div>
              ) : isMobileView ? (
                <div className="space-y-2">
                  {paidTaxInvoices.length > 0 ? (
                    paidTaxInvoices.map((invoice) => (
                      <MobileInvoiceCard
                        key={invoice._id}
                        invoice={invoice}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getServiceIcon={getServiceIcon}
                        getStatusBadgeVariant={getStatusBadgeVariant}
                      />
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <FileType className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No paid tax invoices found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mark tax invoices as paid to see them here
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Invoice No</TableHead>
                          <TableHead className="whitespace-nowrap">Client</TableHead>
                          <TableHead className="whitespace-nowrap">Service Type</TableHead>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">GSTIN</TableHead>
                          <TableHead className="whitespace-nowrap">Taxable Value</TableHead>
                          <TableHead className="whitespace-nowrap">GST</TableHead>
                          <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                          <TableHead className="whitespace-nowrap">Payment Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidTaxInvoices.map((invoice) => (
                          <TableRow key={invoice._id} className="hover:bg-muted/50">
                            <TableCell className="font-medium whitespace-nowrap">
                              {invoice.voucherNo || invoice.invoiceNumber || invoice.id}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <p className="font-medium text-sm truncate">{invoice.client}</p>
                                <p className="text-xs text-muted-foreground truncate">{invoice.clientEmail || ""}</p>
                            </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{invoice.serviceType || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(invoice.date)}</TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{invoice.gstNumber || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatCurrency(invoice.baseAmount || invoice.amount - invoice.tax - (invoice.managementFeesAmount || 0))}
                            </TableCell>
                            <TableCell className="text-blue-600 font-medium whitespace-nowrap">{formatCurrency(invoice.tax)}</TableCell>
                            <TableCell className="font-semibold text-green-600 whitespace-nowrap">{formatCurrency(invoice.amount)}</TableCell>
                            <TableCell>
                              {invoice.paymentMethod ? (
                                (() => {
                                  const IconComponent = getPaymentMethodIcon(invoice.paymentMethod);
                                  return (
                                    <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                      <IconComponent className="h-3 w-3" />
                                      {invoice.paymentMethod}
                                    </Badge>
                                  );
                                })()
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {paidTaxInvoices.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
                              <FileType className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No paid tax invoices found</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Mark tax invoices as paid to see them here
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
          /* All Approved Expenses View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-green-600" />
                All Approved Expenses ({approvedExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.expenses ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading expenses...</p>
                </div>
              ) : isMobileView ? (
                <div className="space-y-2">
                  {approvedExpenses.length > 0 ? (
                    approvedExpenses.map((expense) => (
                      <MobileExpenseCard
                        key={expense._id}
                        expense={expense}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getExpenseCategoryIcon={getExpenseCategoryIcon}
                        getPaymentMethodIcon={getPaymentMethodIcon}
                        getStatusBadgeVariant={getStatusBadgeVariant}
                      />
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No approved expenses found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Approve expenses in the Expenses tab to see them here
                      </p>
                    </div>
                  )}
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
                          <TableHead className="whitespace-nowrap">Base Amount</TableHead>
                          <TableHead className="whitespace-nowrap">GST</TableHead>
                          <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedExpenses.map((expense) => (
                          <TableRow key={expense._id} className="hover:bg-muted/50">
                            <TableCell className="font-medium whitespace-nowrap">{expense.expenseId}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                {getExpenseCategoryIcon(expense.category)}
                                <span>{expense.category}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                            <TableCell className="whitespace-nowrap">{expense.vendor}</TableCell>
                            <TableCell>
                              {(() => {
                                const IconComponent = getPaymentMethodIcon(expense.paymentMethod);
                                return (
                                  <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                    <IconComponent className="h-3 w-3" />
                                    {expense.paymentMethod}
                                  </Badge>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatCurrency(expense.baseAmount)}</TableCell>
                            <TableCell className="text-blue-600 whitespace-nowrap">{formatCurrency(expense.gst)}</TableCell>
                            <TableCell className="font-semibold text-red-600 whitespace-nowrap">{formatCurrency(expense.amount)}</TableCell>
                          </TableRow>
                        ))}
                        {approvedExpenses.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
                              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No approved expenses found</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Approve expenses in the Expenses tab to see them here
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