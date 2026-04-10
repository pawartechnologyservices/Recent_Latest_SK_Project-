// src/pages/superadmin/billing/ExpensesSection.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Edit, Eye, DollarSign, Calendar, Building,
  Loader2, AlertCircle, X, Receipt, ChevronDown, ChevronUp,
  TrendingUp, PieChart, Search, RefreshCw, CheckCircle,
  ChevronLeft, ChevronRight, Clock, Wrench,
  Check, XCircle, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { siteService, Site } from "@/services/SiteService";
import { expenseService, Expense, CreateExpenseRequest, MonthlyExpense } from "@/services/expenseService";
import { machineService, FrontendMachine } from "@/services/machineService";
import { useRole } from '@/context/RoleContext';

// Expense Types and Categories
const ExpenseTypes = [
  { value: "operational", label: "Operational", icon: "🏭", color: "blue" },
  { value: "maintenance", label: "Maintenance", icon: "🔧", color: "yellow" },
  { value: "salary", label: "Salary", icon: "💰", color: "green" },
  { value: "utility", label: "Utility", icon: "⚡", color: "purple" },
  { value: "supplies", label: "Supplies", icon: "📦", color: "orange" },
  { value: "other", label: "Other", icon: "📌", color: "gray" }
];

const ExpenseCategories = [
  { value: "housekeeping", label: "Housekeeping", icon: "🧹" },
  { value: "security", label: "Security", icon: "🛡️" },
  { value: "parking", label: "Parking", icon: "🅿️" },
  { value: "waste_management", label: "Waste Mgmt", icon: "🗑️" },
  { value: "maintenance", label: "Maintenance", icon: "🔧" },
  { value: "electricity", label: "Electricity", icon: "⚡" },
  { value: "water", label: "Water", icon: "💧" },
  { value: "internet", label: "Internet", icon: "🌐" },
  { value: "salary", label: "Salary", icon: "💰" },
  { value: "supplies", label: "Supplies", icon: "📦" },
  { value: "equipment", label: "Equipment", icon: "🔨" },
  { value: "transportation", label: "Transport", icon: "🚚" },
  { value: "office_expense", label: "Office", icon: "📋" },
  { value: "other", label: "Other", icon: "📌" }
];

const PaymentMethods = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "bank transfer", label: "Bank Transfer", icon: "🏦" },
  { value: "credit card", label: "Credit Card", icon: "💳" },
  { value: "cheque", label: "Cheque", icon: "📝" },
  { value: "upi", label: "UPI", icon: "📱" }
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface PendingMaintenanceItem {
  machine: FrontendMachine;
  maintenanceIndex: number;
  record: {
    date: string;
    type: string;
    description: string;
    cost: number;
    performedBy: string;
    status?: string;
  };
}

const ExpensesSection = () => {
  const { role, user } = useRole();
  const [sites, setSites] = useState<Site[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [pendingMaintenance, setPendingMaintenance] = useState<PendingMaintenanceItem[]>([]);
  const [machines, setMachines] = useState<FrontendMachine[]>([]);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [monthlyDialogOpen, setMonthlyDialogOpen] = useState(false);
  const [monthDetailsDialogOpen, setMonthDetailsDialogOpen] = useState(false);
  const [siteExpensesDialogOpen, setSiteExpensesDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedPendingItem, setSelectedPendingItem] = useState<PendingMaintenanceItem | null>(null);
  
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyExpense | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("expenses");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const [approvalFormData, setApprovalFormData] = useState({
    category: "maintenance",
    paymentMethod: "bank transfer",
    vendor: "",
    notes: ""
  });
  
  const [formData, setFormData] = useState({
    expenseType: "",
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    paymentMethod: ""
  });
  
  const [customFields, setCustomFields] = useState<Array<{ fieldName: string; fieldValue: string }>>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const [stats, setStats] = useState({
    totalExpenses: 0,
    averageExpense: 0,
    expenseCount: 0,
    categoryCount: 0,
    pendingMaintenanceCount: 0,
    approvedMaintenanceTotal: 0
  });

  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSites();
  }, [sites, searchQuery]);

  useEffect(() => {
    calculateStats();
    updateAvailableYears();
  }, [expenses, pendingMaintenance]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData, expensesData, machinesData] = await Promise.all([
        siteService.getAllSites(),
        expenseService.getExpenses(),
        machineService.getMachines()
      ]);
      setSites(sitesData || []);
      setFilteredSites(sitesData || []);
      setExpenses(expensesData || []);
      setMachines(machinesData || []);
      
      await loadPendingMaintenance();
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || "Failed to load data");
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get site name from machine location
  const getSiteNameFromMachine = (machineLocation: string): string => {
    if (!machineLocation) return 'No site assigned';
    
    // First try to find exact match by site name
    const exactMatch = sites.find(site => 
      site.name.toLowerCase() === machineLocation.toLowerCase()
    );
    if (exactMatch) return exactMatch.name;
    
    // Then try to find by location (city)
    const locationMatch = sites.find(site => 
      site.location?.toLowerCase() === machineLocation.toLowerCase()
    );
    if (locationMatch) return locationMatch.name;
    
    // If no match found, return the original location value
    return machineLocation;
  };

  // Helper function to get site ID from machine location
  const getSiteIdFromMachine = (machineLocation: string): string | null => {
    if (!machineLocation) return null;
    
    const exactMatch = sites.find(site => 
      site.name.toLowerCase() === machineLocation.toLowerCase()
    );
    if (exactMatch) return exactMatch._id;
    
    const locationMatch = sites.find(site => 
      site.location?.toLowerCase() === machineLocation.toLowerCase()
    );
    if (locationMatch) return locationMatch._id;
    
    return null;
  };

  const loadPendingMaintenance = async () => {
    try {
      const allMachines = await machineService.getMachines();
      const pending: PendingMaintenanceItem[] = [];
      
      allMachines.forEach(machine => {
        if (machine.maintenanceHistory && Array.isArray(machine.maintenanceHistory)) {
          machine.maintenanceHistory.forEach((record, index) => {
            if (record.status === 'pending') {
              pending.push({
                machine,
                maintenanceIndex: index,
                record: {
                  date: record.date,
                  type: record.type,
                  description: record.description,
                  cost: record.cost,
                  performedBy: record.performedBy,
                  status: record.status
                }
              });
            }
          });
        }
      });
      
      setPendingMaintenance(pending);
      console.log(`Loaded ${pending.length} pending maintenance records`);
      
      pending.forEach(item => {
        const siteName = getSiteNameFromMachine(item.machine.location || '');
        console.log(`Pending: ${item.machine.name} - Machine Location: ${item.machine.location} -> Site Name: ${siteName}`);
      });
    } catch (error) {
      console.error('Failed to load pending maintenance:', error);
    }
  };

  const filterSites = () => {
    if (!searchQuery.trim()) {
      setFilteredSites(sites);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = sites.filter(site => 
      site.name.toLowerCase().includes(query) ||
      site.clientName.toLowerCase().includes(query) ||
      site.location.toLowerCase().includes(query)
    );
    setFilteredSites(filtered);
  };

  const calculateStats = () => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avg = expenses.length > 0 ? total / expenses.length : 0;
    const categories = new Set(expenses.map(exp => exp.category));
    
    const maintenanceExpenses = expenses.filter(exp => 
      exp.expenseType === 'maintenance' || exp.category === 'maintenance'
    );
    const approvedMaintenanceTotal = maintenanceExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    setStats({
      totalExpenses: total,
      averageExpense: avg,
      expenseCount: expenses.length,
      categoryCount: categories.size,
      pendingMaintenanceCount: pendingMaintenance.length,
      approvedMaintenanceTotal: approvedMaintenanceTotal
    });
  };

  const updateAvailableYears = () => {
    const years = new Set(expenses.map(exp => new Date(exp.date).getFullYear()));
    const yearsArray = Array.from(years).sort((a, b) => b - a);
    if (yearsArray.length === 0) {
      yearsArray.push(new Date().getFullYear());
    }
    setAvailableYears(yearsArray);
  };

  const resetForm = () => {
    setFormData({
      expenseType: "",
      category: "",
      description: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      vendor: "",
      paymentMethod: ""
    });
    setCustomFields([]);
    setNewFieldName("");
    setNewFieldValue("");
    setEditMode(false);
    setSelectedExpense(null);
  };

  const handleAddExpense = (site: Site) => {
    setSelectedSite(site);
    resetForm();
    setAddDialogOpen(true);
  };

  const handleViewSiteExpenses = (site: Site) => {
    setSelectedSite(site);
    setSiteExpensesDialogOpen(true);
  };

  const handleViewMonthlyExpenses = async (site: Site) => {
    setSelectedSite(site);
    try {
      const monthly = await expenseService.getMonthlyExpenses(site._id);
      setMonthlyExpenses(monthly);
      setMonthlyDialogOpen(true);
    } catch (error) {
      toast.error("Failed to load monthly expenses");
    }
  };

  const handleViewMonthDetails = async (site: Site, month: number, year: number) => {
    try {
      const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        const expenseSiteId = typeof e.siteId === 'object' ? e.siteId._id : e.siteId;
        return expenseSiteId === site._id && 
               date.getMonth() + 1 === month && 
               date.getFullYear() === year;
      });
      
      const monthData: MonthlyExpense = {
        _id: { month, year },
        month,
        year,
        totalAmount: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: monthExpenses.length,
        categories: [...new Set(monthExpenses.map(e => e.category))],
        expenses: monthExpenses
      };
      
      setSelectedMonth(monthData);
      setSelectedSite(site);
      setMonthDetailsDialogOpen(true);
    } catch (error) {
      toast.error("Failed to load month details");
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    
    const siteId = typeof expense.siteId === 'object' ? expense.siteId._id : expense.siteId;
    const site = sites.find(s => s._id === siteId);
    setSelectedSite(site || null);
    
    setFormData({
      expenseType: expense.expenseType,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split('T')[0],
      vendor: expense.vendor,
      paymentMethod: expense.paymentMethod
    });
    setCustomFields(expense.customFields || []);
    
    setEditMode(true);
    setAddDialogOpen(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setViewDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSite) {
      toast.error("Please select a site");
      return;
    }
    
    const requiredFields = ['expenseType', 'category', 'description', 'amount', 'vendor', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }
    
    if (parseFloat(formData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    
    const expensePayload: CreateExpenseRequest = {
      siteId: selectedSite._id,
      ...formData,
      amount: parseFloat(formData.amount),
      customFields: customFields.filter(f => f.fieldName && f.fieldValue)
    };
    
    try {
      setIsSubmitting(true);
      
      if (editMode && selectedExpense) {
        const updated = await expenseService.updateExpense(selectedExpense._id, expensePayload);
        if (updated) {
          setExpenses(prevExpenses => 
            prevExpenses.map(exp => exp._id === updated._id ? updated : exp)
          );
          toast.success("Expense updated successfully!");
        }
      } else {
        const created = await expenseService.createExpense(expensePayload);
        if (created) {
          setExpenses(prevExpenses => [created, ...prevExpenses]);
          toast.success("Expense added successfully!");
        }
      }
      
      setAddDialogOpen(false);
      resetForm();
      
      if (selectedSite) {
        try {
          const monthly = await expenseService.getMonthlyExpenses(selectedSite._id);
          setMonthlyExpenses(monthly);
        } catch (error) {
          console.error("Failed to refresh monthly data:", error);
        }
      }
      
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast.error(error.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveMaintenance = async () => {
    if (!selectedPendingItem) return;
    
    if (!approvalFormData.vendor) {
      toast.error("Please enter vendor name");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { machine, maintenanceIndex, record } = selectedPendingItem;
      
      // Get the site name from machine location using the helper function
      const siteName = getSiteNameFromMachine(machine.location || '');
      const siteId = getSiteIdFromMachine(machine.location || '');
      
      if (!siteId) {
        toast.error(`Site not found for machine location: "${machine.location}". Please check the site configuration.`);
        return;
      }
      
      console.log(`Creating expense for machine: ${machine.name}, Location: ${machine.location} -> Site: ${siteName}, Site ID: ${siteId}`);
      
      const expensePayload: CreateExpenseRequest = {
        siteId: siteId,
        expenseType: "maintenance",
        category: approvalFormData.category,
        description: `Maintenance: ${record.description} (Machine: ${machine.name})`,
        amount: record.cost,
        date: new Date().toISOString().split('T')[0],
        vendor: approvalFormData.vendor,
        paymentMethod: approvalFormData.paymentMethod,
        customFields: [
          { fieldName: "Machine Name", fieldValue: machine.name },
          { fieldName: "Machine Location", fieldValue: machine.location || 'Not specified' },
          { fieldName: "Maintenance Type", fieldValue: record.type },
          { fieldName: "Performed By", fieldValue: record.performedBy },
          { fieldName: "Notes", fieldValue: approvalFormData.notes }
        ]
      };
      
      const createdExpense = await expenseService.createExpense(expensePayload);
      
      if (createdExpense) {
        const updatedMachine = { ...machine };
        if (updatedMachine.maintenanceHistory && updatedMachine.maintenanceHistory[maintenanceIndex]) {
          updatedMachine.maintenanceHistory[maintenanceIndex].status = 'approved';
          updatedMachine.maintenanceHistory[maintenanceIndex].expenseId = createdExpense._id;
          
          await machineService.updateMachine(machine.id, {
            maintenanceHistory: updatedMachine.maintenanceHistory
          });
        }
        
        setExpenses(prevExpenses => [createdExpense, ...prevExpenses]);
        await loadPendingMaintenance();
        
        const updatedMachines = await machineService.getMachines();
        setMachines(updatedMachines);
        
        toast.success(`Maintenance approved and expense created successfully for site: ${siteName}!`);
        setApproveDialogOpen(false);
        setSelectedPendingItem(null);
        setApprovalFormData({
          category: "maintenance",
          paymentMethod: "bank transfer",
          vendor: "",
          notes: ""
        });
      }
    } catch (error: any) {
      console.error('Error approving maintenance:', error);
      toast.error(error.message || "Failed to approve maintenance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectMaintenance = async (item: PendingMaintenanceItem) => {
    if (!confirm("Are you sure you want to reject this maintenance request?")) {
      return;
    }
    
    try {
      const { machine, maintenanceIndex } = item;
      
      const updatedMachine = { ...machine };
      if (updatedMachine.maintenanceHistory && updatedMachine.maintenanceHistory[maintenanceIndex]) {
        updatedMachine.maintenanceHistory[maintenanceIndex].status = 'rejected';
        
        await machineService.updateMachine(machine.id, {
          maintenanceHistory: updatedMachine.maintenanceHistory
        });
      }
      
      await loadPendingMaintenance();
      const updatedMachines = await machineService.getMachines();
      setMachines(updatedMachines);
      
      toast.success("Maintenance request rejected");
    } catch (error: any) {
      console.error('Error rejecting maintenance:', error);
      toast.error(error.message || "Failed to reject maintenance");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    
    try {
      const result = await expenseService.deleteExpense(expenseId);
      if (result?.success) {
        setExpenses(prevExpenses => prevExpenses.filter(exp => exp._id !== expenseId));
        toast.success("Expense deleted successfully!");
        setViewDialogOpen(false);
        setMonthDetailsDialogOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete expense");
    }
  };

  const handleAddCustomField = () => {
    if (newFieldName && newFieldValue) {
      setCustomFields([...customFields, { fieldName: newFieldName, fieldValue: newFieldValue }]);
      setNewFieldName("");
      setNewFieldValue("");
    }
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const toggleSection = (siteId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(siteId)) {
      newExpanded.delete(siteId);
    } else {
      newExpanded.add(siteId);
    }
    setExpandedSections(newExpanded);
  };

  const getSiteExpenses = (siteId: string) => {
    return expenses.filter(e => {
      const expenseSiteId = typeof e.siteId === 'object' ? e.siteId._id : e.siteId;
      return expenseSiteId === siteId;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthName = (month: number) => {
    return MONTHS[month - 1] || "Unknown";
  };

  const getCategoryIcon = (category: string) => {
    const cat = ExpenseCategories.find(c => c.value === category);
    return cat?.icon || "📌";
  };

  const getPaymentMethodIcon = (method: string) => {
    const pm = PaymentMethods.find(m => m.value === method);
    return pm?.icon || "💳";
  };

  const changeYear = (increment: number) => {
    setSelectedYear(prev => prev + increment);
  };

  const isAdmin = role === 'admin' || role === 'superadmin';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading expenses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6 px-2 sm:px-4 max-w-full overflow-x-hidden">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center text-red-700 text-sm sm:text-base">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="flex-1 break-words">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-2 h-8 px-2 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold truncate">{formatCurrency(stats.totalExpenses)}</p>
              </div>
              <DollarSign className="h-5 w-5 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Avg</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold truncate">{formatCurrency(stats.averageExpense)}</p>
              </div>
              <TrendingUp className="h-5 w-5 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Trans</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold">{stats.expenseCount}</p>
              </div>
              <Receipt className="h-5 w-5 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Maint. Pending</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-amber-600">{stats.pendingMaintenanceCount}</p>
              </div>
              <Wrench className="h-5 w-5 sm:h-8 sm:w-8 text-amber-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Maint. Approved</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-green-600 truncate">{formatCurrency(stats.approvedMaintenanceTotal)}</p>
              </div>
              <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 h-auto">
            <TabsTrigger value="expenses" className="text-xs sm:text-sm py-2">
              <Receipt className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Expenses</span>
              <span className="xs:hidden">Exp</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="pending" className="text-xs sm:text-sm py-2 relative">
                <Clock className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Pending Approval</span>
                <span className="xs:hidden">Pending</span>
                {stats.pendingMaintenanceCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500">
                    {stats.pendingMaintenanceCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>
          
          {activeTab === "expenses" && (
            <Button 
              onClick={() => { resetForm(); setSelectedSite(null); setAddDialogOpen(true); }} 
              size={isMobileView ? "sm" : "default"}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          )}
        </div>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full text-sm"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={loadData}
                  size={isMobileView ? "default" : "default"}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2 sm:space-y-4">
            {filteredSites.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <Building className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No Sites Found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {searchQuery ? "Try adjusting your search" : "No sites available"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredSites.map((site) => {
                const siteExpenses = getSiteExpenses(site._id);
                const siteTotal = siteExpenses.reduce((sum, e) => sum + e.amount, 0);
                const isExpanded = expandedSections.has(site._id);
                
                return (
                  <Card key={site._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                              <Building className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                              <h3 className="font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{site.name}</h3>
                              <Badge variant={site.status === "active" ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                                {site.status}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              <p className="truncate">{site.clientName}</p>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                <span className="flex items-center">
                                  <Receipt className="h-3 w-3 mr-1" />
                                  {siteExpenses.length}
                                </span>
                                <span className="flex items-center font-medium text-green-600">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(siteTotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {siteExpenses.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleSection(site._id)}
                              className="h-7 w-7 p-0 flex-shrink-0"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1 sm:flex sm:gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewMonthlyExpenses(site)}
                            className="text-xs px-1 sm:px-3"
                          >
                            <Calendar className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Monthly</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSiteExpenses(site)}
                            className="text-xs px-1 sm:px-3"
                          >
                            <Eye className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddExpense(site)}
                            className="text-xs px-1 sm:px-3"
                          >
                            <Plus className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Add</span>
                          </Button>
                        </div>
                      </div>

                      {isExpanded && siteExpenses.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-xs font-medium mb-2">Recent Expenses</h4>
                          <div className="space-y-2">
                            {siteExpenses.slice(0, 3).map((expense) => (
                              <div key={expense._id} className="border rounded-lg p-2 space-y-1.5">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs truncate">{expense.description}</div>
                                    <div className="text-xs text-muted-foreground">{formatDate(expense.date)}</div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs ml-1">
                                    {getCategoryIcon(expense.category)}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground truncate max-w-[100px]">{expense.vendor}</span>
                                  <span className="font-medium">{formatCurrency(expense.amount)}</span>
                                </div>
                                <div className="flex justify-end gap-1 pt-1">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleViewExpense(expense)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditExpense(expense)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteExpense(expense._id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {siteExpenses.length > 3 && (
                            <div className="mt-2 text-center">
                              <Button variant="link" size="sm" className="text-xs" onClick={() => handleViewSiteExpenses(site)}>
                                View all {siteExpenses.length} expenses
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Pending Maintenance Tab - With Correct Site Name Display */}
        {isAdmin && (
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Pending Maintenance Approvals</CardTitle>
                <CardDescription>
                  Review and approve maintenance requests from supervisors. Approved requests will be added as expenses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingMaintenance.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">No pending maintenance requests</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      When supervisors add maintenance records, they will appear here for approval.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingMaintenance.map((item, idx) => {
                      // Get the actual site name from machine location
                      const machineLocationValue = item.machine.location || '';
                      const displaySiteName = getSiteNameFromMachine(machineLocationValue);
                      const associatedSite = sites.find(s => 
                        s.name === displaySiteName || 
                        s.location?.toLowerCase() === machineLocationValue.toLowerCase()
                      );
                      const isSiteValid = displaySiteName !== 'No site assigned' && associatedSite;
                      
                      return (
                        <div key={`${item.machine.id}-${item.maintenanceIndex}`} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Wrench className="h-5 w-5 text-amber-500" />
                                <h4 className="font-semibold">{item.machine.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {item.machine.model || 'No Model'}
                                </Badge>
                              </div>
                              <div className="mt-2 space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Type:</span> {item.record.type}</p>
                                <p><span className="text-muted-foreground">Description:</span> {item.record.description}</p>
                                <p><span className="text-muted-foreground">Performed By:</span> {item.record.performedBy}</p>
                                <p><span className="text-muted-foreground">Date:</span> {formatDate(item.record.date)}</p>
                                <p className="font-bold text-green-600">Amount: {formatCurrency(item.record.cost)}</p>
                              </div>
                              {/* Site Information - Display actual site name */}
                              <div className="mt-3 pt-2 border-t">
                                <div className="flex items-center gap-2 text-sm">
                                  <Building className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">Working Site:</span>
                                  <span className={`${!isSiteValid ? 'text-red-500' : 'text-green-600'} font-semibold`}>
                                    {displaySiteName}
                                  </span>
                                  {associatedSite && associatedSite.status === 'active' && (
                                    <Badge variant="secondary" className="text-xs bg-green-100">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                {machineLocationValue && displaySiteName !== machineLocationValue && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📍 Location: {machineLocationValue}
                                  </p>
                                )}
                                {!isSiteValid && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    ⚠️ This machine is not assigned to any valid site. Please update the machine location.
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setSelectedPendingItem(item);
                                  setApprovalFormData({
                                    category: "maintenance",
                                    paymentMethod: "bank transfer",
                                    vendor: "",
                                    notes: ""
                                  });
                                  setApproveDialogOpen(true);
                                }}
                                disabled={!isSiteValid}
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleRejectMaintenance(item)}
                                className="flex-1 sm:flex-none"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[90vh] m-0 p-0 sm:p-6 rounded-none sm:rounded-lg overflow-hidden flex flex-col">
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg sm:text-xl pr-8">
              {editMode ? "Edit Expense" : "Add Expense"}
              {selectedSite && <span className="block text-sm text-muted-foreground mt-1">{selectedSite.name}</span>}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Enter the expense details below
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8"
              onClick={() => setAddDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenseType" className="text-sm font-medium">Type *</Label>
                <Select value={formData.expenseType} onValueChange={(v) => setFormData({...formData, expenseType: v})} required>
                  <SelectTrigger className="w-full h-11 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ExpenseTypes.map(type => (
                      <SelectItem key={type.value} value={type.value} className="text-sm">
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})} required>
                  <SelectTrigger className="w-full h-11 text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ExpenseCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-sm">
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter description"
                required
                rows={3}
                className="w-full text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                  required
                  className="w-full h-11 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full h-11 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor" className="text-sm font-medium">Vendor *</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  placeholder="Vendor name"
                  required
                  className="w-full h-11 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method *</Label>
              <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({...formData, paymentMethod: v})} required>
                <SelectTrigger className="w-full h-11 text-sm">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PaymentMethods.map(method => (
                    <SelectItem key={method.value} value={method.value} className="text-sm">
                      {method.icon} {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium">Custom Fields</Label>
              
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <span className="flex-1 text-sm font-medium truncate">{field.fieldName}:</span>
                  <span className="flex-1 text-sm truncate">{field.fieldValue}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomField(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Field name"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="flex-1 h-11 text-sm"
                />
                <Input
                  placeholder="Field value"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="flex-1 h-11 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomField}
                  disabled={!newFieldName || !newFieldValue}
                  className="h-11 text-sm whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2 sm:pb-0 sticky bottom-0 bg-background border-t sm:border-0 mt-4">
              <Button 
                type="submit" 
                className="w-full sm:flex-1 h-12 text-base font-medium order-2 sm:order-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editMode ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  editMode ? "Update Expense" : "Add Expense"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAddDialogOpen(false)}
                className="w-full sm:flex-1 h-12 text-base font-medium order-1 sm:order-2"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve Maintenance Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] m-0 p-0 sm:p-6 rounded-none sm:rounded-lg overflow-hidden flex flex-col">
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg sm:text-xl pr-8">
              Approve Maintenance Request
            </DialogTitle>
            <DialogDescription className="text-sm">
              This will create an expense record for the maintenance
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8"
              onClick={() => setApproveDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {selectedPendingItem && (
              <>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Machine:</span> {selectedPendingItem.machine.name}</p>
                  <p><span className="text-muted-foreground">Working Site:</span> 
                    <span className="font-medium ml-2 text-blue-600">
                      {getSiteNameFromMachine(selectedPendingItem.machine.location || '')}
                    </span>
                  </p>
                  <p><span className="text-muted-foreground">Maintenance Type:</span> {selectedPendingItem.record.type}</p>
                  <p><span className="text-muted-foreground">Description:</span> {selectedPendingItem.record.description}</p>
                  <p><span className="text-muted-foreground">Performed By:</span> {selectedPendingItem.record.performedBy}</p>
                  <p><span className="text-muted-foreground">Amount:</span> <span className="font-bold text-green-600">{formatCurrency(selectedPendingItem.record.cost)}</span></p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select 
                      value={approvalFormData.category} 
                      onValueChange={(v) => setApprovalFormData({...approvalFormData, category: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                        <SelectItem value="equipment">🔨 Equipment</SelectItem>
                        <SelectItem value="other">📌 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select 
                      value={approvalFormData.paymentMethod} 
                      onValueChange={(v) => setApprovalFormData({...approvalFormData, paymentMethod: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PaymentMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.icon} {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Vendor *</Label>
                    <Input
                      value={approvalFormData.vendor}
                      onChange={(e) => setApprovalFormData({...approvalFormData, vendor: e.target.value})}
                      placeholder="Enter vendor name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={approvalFormData.notes}
                      onChange={(e) => setApprovalFormData({...approvalFormData, notes: e.target.value})}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={handleApproveMaintenance} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve & Create Expense
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setApproveDialogOpen(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Site Expenses Dialog */}
      <Dialog open={siteExpensesDialogOpen} onOpenChange={setSiteExpensesDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[90vh] m-0 p-0 sm:p-6 rounded-none sm:rounded-lg overflow-hidden flex flex-col">
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg sm:text-xl pr-8">
              Expenses - {selectedSite?.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8"
              onClick={() => setSiteExpensesDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {selectedSite && (
              <div className="space-y-3">
                {getSiteExpenses(selectedSite._id).length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Expenses</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      No expenses recorded for this site yet
                    </p>
                    <Button size="default" onClick={() => {
                      setSiteExpensesDialogOpen(false);
                      handleAddExpense(selectedSite);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Expense
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="sm:hidden space-y-3">
                      {getSiteExpenses(selectedSite._id).map((expense) => (
                        <div key={expense._id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-base truncate">{expense.description}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(expense.date)}</div>
                            </div>
                            <Badge variant="secondary" className="text-sm ml-2">
                              {getCategoryIcon(expense.category)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground block">Vendor</span>
                              <span className="font-medium">{expense.vendor}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Amount</span>
                              <span className="font-bold text-green-600">{formatCurrency(expense.amount)}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground block">Payment</span>
                              <span className="inline-flex items-center gap-1">
                                {getPaymentMethodIcon(expense.paymentMethod)} {expense.paymentMethod}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button variant="outline" size="sm" className="h-10 px-3 text-sm" onClick={() => handleViewExpense(expense)}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </Button>
                            <Button variant="outline" size="sm" className="h-10 px-3 text-sm" onClick={() => {
                              setSiteExpensesDialogOpen(false);
                              handleEditExpense(expense);
                            }}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" className="h-10 px-3 text-sm" onClick={() => handleDeleteExpense(expense._id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSiteExpenses(selectedSite._id).map((expense) => (
                            <TableRow key={expense._id}>
                              <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                              <TableCell className="max-w-[250px]">
                                <div className="font-medium truncate">{expense.description}</div>
                                <div className="text-xs text-muted-foreground">
                                  Type: {expense.expenseType}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="whitespace-nowrap">
                                  {getCategoryIcon(expense.category)} {expense.category.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{expense.vendor}</TableCell>
                              <TableCell>
                                {getPaymentMethodIcon(expense.paymentMethod)} {expense.paymentMethod}
                              </TableCell>
                              <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleViewExpense(expense)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setSiteExpensesDialogOpen(false);
                                    handleEditExpense(expense);
                                  }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense._id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Summary Dialog */}
      <Dialog open={monthlyDialogOpen} onOpenChange={setMonthlyDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] m-0 p-0 sm:p-6 rounded-none sm:rounded-lg overflow-hidden flex flex-col">
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg sm:text-xl pr-8">
              Monthly Summary - {selectedSite?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Click on any month to view detailed expenses
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8"
              onClick={() => setMonthlyDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {selectedSite && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold">{selectedYear}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="default" onClick={() => changeYear(-1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <Button variant="outline" size="default" onClick={() => changeYear(1)}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {monthlyExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Monthly Data</h3>
                    <p className="text-sm text-muted-foreground">
                      No expenses found for {selectedSite.name}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Expenses</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyExpenses
                          .filter(m => m.year === selectedYear)
                          .sort((a, b) => a.month - b.month)
                          .map((monthData) => (
                            <TableRow 
                              key={`${monthData.year}-${monthData.month}`}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                handleViewMonthDetails(selectedSite, monthData.month, monthData.year);
                                setMonthlyDialogOpen(false);
                              }}
                            >
                              <TableCell className="font-medium">{getMonthName(monthData.month)}</TableCell>
                              <TableCell>{monthData.year}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{monthData.count}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {monthData.categories.slice(0, 2).map((cat, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {getCategoryIcon(cat)}
                                    </Badge>
                                  ))}
                                  {monthData.categories.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{monthData.categories.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-green-600">
                                {formatCurrency(monthData.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewMonthDetails(selectedSite, monthData.month, monthData.year);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Month Details Dialog */}
      <Dialog open={monthDetailsDialogOpen} onOpenChange={setMonthDetailsDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[90vh] m-0 p-0 sm:p-6 rounded-none sm:rounded-lg overflow-hidden flex flex-col">
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg sm:text-xl pr-8">
              {selectedMonth && `${getMonthName(selectedMonth.month)} ${selectedMonth.year} Expenses`}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedMonth?.count} {selectedMonth?.count === 1 ? 'expense' : 'expenses'} totaling {selectedMonth && formatCurrency(selectedMonth.totalAmount)}
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8"
              onClick={() => setMonthDetailsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {selectedSite && selectedMonth && (
              <div className="space-y-4">
                {selectedMonth.expenses && selectedMonth.expenses.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedMonth.expenses.map((expense) => (
                            <TableRow key={expense._id}>
                              <TableCell>{formatDate(expense.date)}</TableCell>
                              <TableCell className="max-w-[250px]">
                                <div className="font-medium truncate">{expense.description}</div>
                                <div className="text-xs text-muted-foreground">
                                  Type: {expense.expenseType}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {getCategoryIcon(expense.category)} {expense.category.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{expense.vendor}</TableCell>
                              <TableCell>
                                {getPaymentMethodIcon(expense.paymentMethod)} {expense.paymentMethod}
                              </TableCell>
                              <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setMonthDetailsDialogOpen(false);
                                    handleViewExpense(expense);
                                  }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setMonthDetailsDialogOpen(false);
                                    handleEditExpense(expense);
                                  }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense._id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end items-center gap-4 pt-4 border-t">
                      <span className="text-muted-foreground">
                        Total for {getMonthName(selectedMonth.month)}:
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedMonth.totalAmount)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Expenses</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      No expenses found for {getMonthName(selectedMonth.month)} {selectedMonth.year}
                    </p>
                    <Button size="default" onClick={() => {
                      setMonthDetailsDialogOpen(false);
                      if (selectedSite) handleAddExpense(selectedSite);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] m-0 p-0 sm:p-6 rounded-none sm:rounded-lg overflow-hidden flex flex-col">
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg sm:text-xl pr-8">Expense Details</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8"
              onClick={() => setViewDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {selectedExpense && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(selectedExpense.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-xl text-green-600">{formatCurrency(selectedExpense.amount)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium break-words">{selectedExpense.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Site</p>
                    <p className="font-medium break-words">
                      {typeof selectedExpense.siteId === 'object' 
                        ? selectedExpense.siteId.name 
                        : sites.find(s => s._id === selectedExpense.siteId)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-medium break-words">{selectedExpense.vendor}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Expense Type</p>
                    <Badge variant="secondary">{selectedExpense.expenseType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Category</p>
                    <Badge variant="outline">
                      {getCategoryIcon(selectedExpense.category)} {selectedExpense.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <Badge variant="outline">
                    {getPaymentMethodIcon(selectedExpense.paymentMethod)} {selectedExpense.paymentMethod}
                  </Badge>
                </div>

                {selectedExpense.customFields && selectedExpense.customFields.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Custom Fields</p>
                    <div className="space-y-2">
                      {selectedExpense.customFields.map((field, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg text-sm">
                          <span className="font-medium">{field.fieldName}:</span> {field.fieldValue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground border-t pt-3">
                  Created: {new Date(selectedExpense.createdAt).toLocaleString()}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleEditExpense(selectedExpense);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleDeleteExpense(selectedExpense._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesSection;