import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  Plus,
  Search,
  Package,
  UserCheck,
  AlertTriangle,
  Eye,
  Trash2,
  Download,
  Edit,
  History,
  Building,
  Shield,
  Wrench,
  Printer,
  Palette,
  ShoppingBag,
  Coffee,
  BarChart3,
  MapPin,
  RefreshCw,
  Cpu,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCog,
  ImageIcon,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  DollarSign,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inventoryService, type FrontendInventoryItem } from '@/services/inventoryService';
import { machineService, type FrontendMachine, type MachineStats, type MaintenanceRecordDTO } from '@/services/machineService';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { useOutletContext } from "react-router-dom";
import { siteService, type Site } from '@/services/SiteService';
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Department {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
}

interface MachineUpdate {
  id: string;
  machineId: string;
  machineName: string;
  modelNumber: string;
  site: string;
  description: string;
  status: 'operational' | 'maintenance' | 'out-of-service';
  photoUrls: string[];
  updatedBy: string;
  updatedAt: string;
}

type InventoryItem = FrontendInventoryItem;
type Machine = FrontendMachine;

const machineStatusOptions = [
  { value: 'operational', label: 'Operational', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'maintenance', label: 'Under Maintenance', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  { value: 'out-of-service', label: 'Out of Service', color: 'bg-red-100 text-red-800', icon: XCircle },
];

// Machine View Dialog Component
const MachineViewDialog = ({ machine, open, onClose }: { machine: Machine | null; open: boolean; onClose: () => void }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const machineImages = machine?.photoUrls || [];

  if (!machine) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl md:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-900">
            <Cpu className="h-5 w-5 text-blue-600" />
            Machine Details: {machine.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {machineImages.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs md:text-sm font-medium text-gray-700">Images</Label>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[300px]">
                <img 
                  src={machineImages[currentImageIndex]} 
                  alt={`${machine.name} - ${currentImageIndex + 1}`}
                  className="w-full h-80 object-contain bg-gray-50"
                />
                {machineImages.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? machineImages.length - 1 : prev - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                      onClick={() => setCurrentImageIndex(prev => prev === machineImages.length - 1 ? 0 : prev + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Machine Name</div>
              <div className="font-medium text-sm md:text-base text-gray-900">{machine.name}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Model Number</div>
              <div className="font-medium text-sm md:text-base text-gray-900">{machine.model || 'N/A'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Cost</div>
              <div className="font-medium text-sm md:text-base text-gray-900">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(machine.cost)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Quantity</div>
              <div className="font-medium text-sm md:text-base text-gray-900">{machine.quantity}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Purchase Date</div>
              <div className="font-medium text-sm md:text-base text-gray-900">{new Date(machine.purchaseDate).toLocaleDateString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Status</div>
              <Badge className={machine.status === 'operational' ? 'bg-green-100 text-green-800 border-green-200' : machine.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}>
                {machine.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Location/Site</div>
              <div className="font-medium text-sm md:text-base text-gray-900 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                {machine.location || 'Not assigned'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Department</div>
              <div className="font-medium text-sm md:text-base text-gray-900">{machine.department || 'N/A'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Assigned To</div>
              <div className="font-medium text-sm md:text-base text-gray-900 flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-gray-400" />
                {machine.assignedTo || 'Not assigned'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Last Maintenance</div>
              <div className="font-medium text-sm md:text-base text-gray-900">{machine.lastMaintenanceDate ? new Date(machine.lastMaintenanceDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Next Maintenance</div>
              <div className="font-medium text-sm md:text-base text-gray-900">{machine.nextMaintenanceDate ? new Date(machine.nextMaintenanceDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Description</div>
              <div className="text-sm text-gray-600">{machine.description || 'No description available'}</div>
            </div>
          </div>

          {machine.maintenanceHistory && machine.maintenanceHistory.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs md:text-sm font-medium text-gray-700">Maintenance History</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {machine.maintenanceHistory.map((record, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{record.type}</div>
                        <div className="text-xs text-gray-600">{record.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</div>
                        <div className="text-sm font-medium text-green-600">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(record.cost)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Performed by: {record.performedBy}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 rounded-lg">Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Update View Dialog Component
const UpdateViewDialog = ({ update, open, onClose }: { update: MachineUpdate | null; open: boolean; onClose: () => void }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const updateImages = update?.photoUrls || [];

  if (!update) return null;

  const statusOption = machineStatusOptions.find(s => s.value === update.status);
  const StatusIcon = statusOption?.icon || CheckCircle;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl md:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-900">
            <Building className="h-5 w-5 text-blue-600" />
            Site Update Details: {update.machineName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {updateImages.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs md:text-sm font-medium text-gray-700">Images</Label>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[300px]">
                <img 
                  src={updateImages[currentImageIndex]} 
                  alt={`${update.machineName} - ${currentImageIndex + 1}`}
                  className="w-full h-80 object-contain bg-gray-50"
                />
                {updateImages.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? updateImages.length - 1 : prev - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                      onClick={() => setCurrentImageIndex(prev => prev === updateImages.length - 1 ? 0 : prev + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Machine Name</div>
              <div className="font-medium text-sm md:text-base text-gray-900 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600" />
                {update.machineName}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Model Number</div>
              <div className="font-medium text-sm md:text-base text-gray-900">{update.modelNumber || 'N/A'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Site Location</div>
              <div className="font-medium text-sm md:text-base text-gray-900 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                {update.site}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Status</div>
              <Badge className={`${statusOption?.color} border-0 flex items-center gap-1 w-fit px-2 py-1 rounded-full`}>
                <StatusIcon className="h-3 w-3" />
                {statusOption?.label}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Updated By</div>
              <div className="font-medium text-sm md:text-base text-gray-900 flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-gray-400" />
                {update.updatedBy}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Update Date</div>
              <div className="font-medium text-sm md:text-base text-gray-900 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                {new Date(update.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Description</div>
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {update.description || 'No description provided'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 rounded-lg">Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SuperAdminInventoryPage = () => {
  const outletContext = useOutletContext<{ onMenuClick?: () => void }>();
  
  // State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineUpdates, setMachineUpdates] = useState<MachineUpdate[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [changeHistoryDialogOpen, setChangeHistoryDialogOpen] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
  });
  
  // Machine states
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [viewMachine, setViewMachine] = useState<Machine | null>(null);
  const [viewMachineDialogOpen, setViewMachineDialogOpen] = useState(false);
  const [machineSearchQuery, setMachineSearchQuery] = useState("");
  const [machineStats, setMachineStats] = useState<MachineStats | null>(null);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [selectedMachineForMaintenance, setSelectedMachineForMaintenance] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  
  // Update view state
  const [viewUpdate, setViewUpdate] = useState<MachineUpdate | null>(null);
  const [viewUpdateDialogOpen, setViewUpdateDialogOpen] = useState(false);
  
  // View mode for mobile
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Track active tab
  const [activeTab, setActiveTab] = useState("inventory");
  
  const [backendConnected, setBackendConnected] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // New item form state
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: "",
    sku: "",
    department: "cleaning",
    category: "",
    site: "1",
    assignedManager: "",
    quantity: 0,
    price: 0,
    costPrice: 0,
    supplier: "",
    reorderLevel: 10,
    description: "",
  });

  // New machine form state
  const [newMachine, setNewMachine] = useState<Partial<Machine>>({
    name: "",
    cost: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    quantity: 1,
    description: "",
    status: 'operational',
    location: "",
    model: "",
    department: "",
    assignedTo: "",
  });

  // Maintenance form state
  const [maintenanceRecord, setMaintenanceRecord] = useState<MaintenanceRecordDTO>({
    type: "Routine",
    description: "",
    cost: 0,
    performedBy: "",
  });

  const maintenanceTypes = [
    "Routine",
    "Preventive",
    "Corrective",
    "Emergency",
    "Scheduled",
    "Overhaul"
  ];

  const departments: Department[] = [
    { value: "cleaning", label: "Cleaning", icon: Shield },
    { value: "maintenance", label: "Maintenance", icon: Wrench },
    { value: "office", label: "Office Supplies", icon: Printer },
    { value: "paint", label: "Paint", icon: Palette },
    { value: "tools", label: "Tools", icon: ShoppingBag },
    { value: "canteen", label: "Canteen", icon: Coffee },
  ];

  const managers = ["John Doe", "Jane Smith", "Robert Johnson", "Sarah Wilson", "Michael Brown"];
  
  const categories = {
    cleaning: ["Tools", "Chemicals", "Equipment", "Supplies"],
    maintenance: ["Tools", "Safety", "Equipment", "Parts"],
    office: ["Furniture", "Stationery", "Electronics", "Supplies"],
    paint: ["Paints", "Brushes", "Rollers", "Accessories"],
    tools: ["Power Tools", "Hand Tools", "Safety Gear", "Consumables"],
    canteen: ["Food Items", "Beverages", "Utensils", "Cleaning"],
  };

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load machine updates from localStorage
  useEffect(() => {
    const storedUpdates = localStorage.getItem('machineUpdates');
    if (storedUpdates) {
      const updates = JSON.parse(storedUpdates);
      const migratedUpdates = updates.map((update: any) => ({
        ...update,
        photoUrls: update.photoUrls || (update.photoUrl ? [update.photoUrl] : [])
      }));
      setMachineUpdates(migratedUpdates);
    }
  }, []);

  // Fetch sites
  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const sitesData = await siteService.getAllSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Failed to fetch sites:', error);
      setSites([]);
    }
  };

  const calculateStats = (itemsList: InventoryItem[]): InventoryStats => {
    const totalItems = itemsList.length;
    const lowStockItems = itemsList.filter(item => item.quantity <= item.reorderLevel).length;
    const totalValue = itemsList.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    return { totalItems, lowStockItems, totalValue };
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

  const calculateLocalMachineStats = () => {
    const totalMachines = machines.length;
    const totalMachineValue = machines.reduce((sum, machine) => sum + (machine.cost * machine.quantity), 0);
    const operationalMachines = machines.filter(m => m.status === 'operational').length;
    const maintenanceMachines = machines.filter(m => m.status === 'maintenance').length;
    const outOfServiceMachines = machines.filter(m => m.status === 'out-of-service').length;
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();
    
    const upcomingMaintenanceCount = machines.filter(machine => {
      if (!machine.nextMaintenanceDate) return false;
      try {
        const nextMaintenanceDate = new Date(machine.nextMaintenanceDate);
        return nextMaintenanceDate <= thirtyDaysFromNow && nextMaintenanceDate >= today;
      } catch {
        return false;
      }
    }).length;

    const machinesByDepartment = machines.reduce((acc, machine) => {
      const dept = machine.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const machinesByLocation = machines.reduce((acc, machine) => {
      const location = machine.location || 'Unassigned';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMachines,
      totalMachineValue,
      operationalMachines,
      maintenanceMachines,
      outOfServiceMachines,
      averageMachineCost: totalMachines > 0 ? totalMachineValue / totalMachines : 0,
      machinesByDepartment,
      machinesByLocation,
      upcomingMaintenanceCount
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setBackendConnected(true);
      
      const [itemsData, machinesData] = await Promise.all([
        inventoryService.getItems(),
        machineService.getMachines()
      ]);
      
      setItems(itemsData || []);
      setMachines(machinesData || []);
      
      try {
        const statsData = await machineService.getMachineStats();
        setMachineStats(statsData);
      } catch (statsError) {
        console.warn('Stats endpoint unavailable, using local calculation');
        const localStats = calculateLocalMachineStats();
        setMachineStats(localStats);
      }
      
      setStats(calculateStats(itemsData || []));
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setBackendConnected(false);
      setItems([]);
      setMachines([]);
      setMachineStats(calculateLocalMachineStats());
      setStats({ totalItems: 0, lowStockItems: 0, totalValue: 0 });
      toast.warning("Backend connection issue. Using local data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await fetchData();
      toast.success("Data refreshed successfully!");
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getDepartmentIcon = (department: string) => {
    const dept = departments.find(d => d.value === department);
    return dept ? dept.icon : Package;
  };

  const getCategoriesForDepartment = (dept: string) => {
    return categories[dept as keyof typeof categories] || [];
  };

  // Get unique managers from items
  const uniqueManagers = useMemo(() => {
    const managerSet = new Set(items.map(item => item.assignedManager).filter(Boolean));
    return Array.from(managerSet);
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === "all" || item.department === selectedDepartment;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSite = selectedSite === "all" || item.site === selectedSite;
    const matchesManager = selectedManager === "all" || item.assignedManager === selectedManager;
    return matchesSearch && matchesDept && matchesCategory && matchesSite && matchesManager;
  });

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = 
      machine.name.toLowerCase().includes(machineSearchQuery.toLowerCase()) ||
      machine.model?.toLowerCase().includes(machineSearchQuery.toLowerCase()) ||
      machine.location?.toLowerCase().includes(machineSearchQuery.toLowerCase());
    return matchesSearch;
  });

  // All CRUD operations are disabled - view only mode
  const handleDeleteItem = async (itemId: string) => {
    toast.error("You do not have permission to delete items. View only mode.");
  };

  const handleAddItem = async () => {
    toast.error("You do not have permission to add items. View only mode.");
  };

  const handleEditItem = async () => {
    toast.error("You do not have permission to edit items. View only mode.");
  };

  const handleAddMachine = async () => {
    toast.error("You do not have permission to add machines. View only mode.");
  };

  const handleEditMachine = (machine: Machine) => {
    toast.error("You do not have permission to edit machines. View only mode.");
  };

  const handleViewMachine = async (machineId: string) => {
    try {
      const machine = await machineService.getMachineById(machineId);
      setViewMachine(machine);
      setViewMachineDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch machine details:', error);
      toast.error("Failed to fetch machine details");
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    toast.error("You do not have permission to delete machines. View only mode.");
  };

  const handleAddMaintenance = async () => {
    toast.error("You do not have permission to add maintenance records. View only mode.");
  };

  const handleDeleteUpdate = (updateId: string) => {
    toast.error("You do not have permission to delete updates. View only mode.");
  };

  const handleViewUpdate = (update: MachineUpdate) => {
    setViewUpdate(update);
    setViewUpdateDialogOpen(true);
  };

  const resetNewMachineForm = () => {
    setNewMachine({
      name: "",
      cost: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      description: "",
      status: 'operational',
      location: "",
      model: "",
      department: "",
      assignedTo: "",
    });
  };

  const resetNewItemForm = () => {
    setNewItem({
      name: "",
      sku: "",
      department: "cleaning",
      category: "",
      site: "1",
      assignedManager: "",
      quantity: 0,
      price: 0,
      costPrice: 0,
      supplier: "",
      reorderLevel: 10,
      description: "",
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    toast.error("You do not have permission to edit items. View only mode.");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    toast.error("You do not have permission to import items. View only mode.");
  };

  const handleExport = () => {
    if (items.length === 0) {
      toast.error("No items to export");
      return;
    }

    const csvContent = [
      ["SKU", "Name", "Department", "Category", "Site", "Manager", "Quantity", "Price", "Supplier", "Reorder Level"],
      ...items.map(item => [
        item.sku,
        item.name,
        departments.find(d => d.value === item.department)?.label || item.department,
        item.category,
        item.site,
        item.assignedManager,
        item.quantity.toString(),
        item.price.toString(),
        item.supplier,
        item.reorderLevel.toString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Inventory exported successfully!");
  };

  const handleExportMachines = async () => {
    try {
      if (machines.length === 0) {
        toast.error("No machines to export");
        return;
      }

      const csvContent = [
        ["Name", "Cost", "Purchase Date", "Quantity", "Status", "Location", "Model", "Department", "Assigned To"],
        ...machines.map(machine => [
          machine.name,
          machine.cost.toString(),
          new Date(machine.purchaseDate).toISOString().split('T')[0],
          machine.quantity.toString(),
          machine.status,
          machine.location || '',
          machine.model || '',
          machine.department || '',
          machine.assignedTo || ''
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `machines-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Machines exported successfully!");
    } catch (error) {
      console.error('Failed to export machines:', error);
      toast.error("Failed to export machines");
    }
  };

  const calculateMachineAge = (purchaseDate: string) => {
    const purchase = new Date(purchaseDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - purchase.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  };

  const machineStatsDisplay = machineStats || calculateLocalMachineStats();

  useEffect(() => {
    fetchData();
  }, []);

  // Inventory Grid View Component for Mobile
  const InventoryGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredItems.map((item) => {
        const DeptIcon = getDepartmentIcon(item.department);
        const isLowStock = item.quantity <= item.reorderLevel;
        
        return (
          <Card key={item.id} className="overflow-hidden border-0 shadow-lg rounded-xl">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                  </div>
                </div>
                <Badge variant={isLowStock ? "destructive" : "outline"} className="text-xs">
                  {isLowStock ? "Low Stock" : "In Stock"}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Department:</span>
                  <div className="flex items-center gap-1">
                    <DeptIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-700">{departments.find(d => d.value === item.department)?.label}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Manager:</span>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-700">{item.assignedManager}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Quantity:</span>
                  <span className={`font-medium text-xs ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>{item.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Price:</span>
                  <span className="font-medium text-xs text-green-600">{formatCurrency(item.price)}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={() => setChangeHistoryDialogOpen(item.id)} className="rounded-full hover:bg-blue-100 hover:text-blue-600">
                  <History className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Machines Grid View Component for Mobile
  const MachinesGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredMachines.map((machine) => {
        const statusOption = machineStatusOptions.find(s => s.value === machine.status);
        const StatusIcon = statusOption?.icon || CheckCircle;
        const machineAge = calculateMachineAge(machine.purchaseDate);
        
        return (
          <Card key={machine.id} className="overflow-hidden border-0 shadow-lg rounded-xl">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Cpu className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{machine.name}</p>
                    <p className="text-xs text-gray-500">{machine.model || 'No model'}</p>
                  </div>
                </div>
                <Badge className={`${statusOption?.color} border-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusOption?.label}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Quantity:</span>
                  <span className="font-medium text-xs text-gray-900">{machine.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Cost:</span>
                  <span className="font-medium text-xs text-green-600">{formatCurrency(machine.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Location:</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-700">{machine.location || 'Not assigned'}</span>
                  </div>
                </div>
                {machine.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Assigned To:</span>
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-700">{machine.assignedTo}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={() => handleViewMachine(machine.id)} className="rounded-full hover:bg-blue-100 hover:text-blue-600">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader title="Super Admin Inventory" subtitle="Managing all inventory and machinery" onMenuClick={outletContext?.onMenuClick} />
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-blue-600 mx-auto" />
              <p className="mt-4 text-sm text-gray-500">Loading data from backend...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title={
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Inventory Management
          </span>
        }
        subtitle="Full access to manage and track all inventory, machinery, and site updates" 
        onMenuClick={outletContext?.onMenuClick}
      />
      
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -2, md: { y: -4 }, transition: { duration: 0.2 } }}
          >
            <Card className="border-0 shadow-lg rounded-xl md:rounded-2xl bg-gradient-to-br from-white to-blue-50 hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-100 flex items-center justify-center">
                    <Package className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">Total Items</p>
                    <p className="text-base md:text-3xl font-bold text-gray-900">{stats.totalItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ y: -2, md: { y: -4 }, transition: { duration: 0.2 } }}
          >
            <Card className="border-0 shadow-lg rounded-xl md:rounded-2xl bg-gradient-to-br from-white to-amber-50 hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-amber-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">Low Stock</p>
                    <p className="text-base md:text-3xl font-bold text-amber-600">{stats.lowStockItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ y: -2, md: { y: -4 }, transition: { duration: 0.2 } }}
          >
            <Card className="border-0 shadow-lg rounded-xl md:rounded-2xl bg-gradient-to-br from-white to-green-50 hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">Total Value</p>
                    <p className="text-xs md:text-3xl font-bold text-gray-900 truncate max-w-[80px] md:max-w-none">
                      {formatCurrency(stats.totalValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ y: -2, md: { y: -4 }, transition: { duration: 0.2 } }}
          >
            <Card className="border-0 shadow-lg rounded-xl md:rounded-2xl bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-purple-100 flex items-center justify-center">
                    <Cpu className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">Total Machines</p>
                    <p className="text-base md:text-3xl font-bold text-gray-900">{machineStatsDisplay?.totalMachines || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="space-y-4 md:space-y-6">
          <div className="border-b border-gray-200 overflow-x-auto pb-px">
            <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="inline-flex h-10 md:h-12 items-center justify-start rounded-lg bg-transparent p-0 min-w-max">
                <TabsTrigger 
                  value="inventory" 
                  className="relative px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 transition-all whitespace-nowrap"
                >
                  <Package className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden xs:inline">Inventory</span>
                  <span className="xs:hidden">Inv</span> ({items.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="machines" 
                  className="relative px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 transition-all whitespace-nowrap"
                >
                  <Cpu className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden xs:inline">Machines</span>
                  <span className="xs:hidden">Mach</span> ({machines.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="updates" 
                  className="relative px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 transition-all whitespace-nowrap"
                >
                  <Building className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden xs:inline">Updates</span>
                  <span className="xs:hidden">Upd</span> ({machineUpdates.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* INVENTORY TAB */}
          <AnimatePresence mode="wait">
            {activeTab === "inventory" && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-lg rounded-xl md:rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base md:text-xl font-bold text-gray-900">Inventory Items</CardTitle>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">Manage and track all inventory items across departments</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleExport} 
                          disabled={items.length === 0}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg md:rounded-xl text-xs md:text-sm px-2 md:px-4 h-8 md:h-10"
                        >
                          <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden xs:inline">Export</span>
                        </Button>
                        
                        {isMobileView && (
                          <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                            <Button
                              variant={viewMode === 'table' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-8 px-2 rounded-lg"
                              onClick={() => setViewMode('table')}
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={viewMode === 'grid' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-8 px-2 rounded-lg"
                              onClick={() => setViewMode('grid')}
                            >
                              <Grid3x3 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    {/* Filters */}
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                        <Input 
                          placeholder="Search items..." 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)} 
                          className="pl-8 md:pl-10 h-8 md:h-10 text-xs md:text-sm rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm rounded-lg border-gray-300">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map(dept => {
                            const Icon = dept.icon;
                            return (
                              <SelectItem key={dept.value} value={dept.value}>
                                <div className="flex items-center gap-2"><Icon className="h-3 w-3 md:h-4 md:w-4" /><span className="text-xs md:text-sm">{dept.label}</span></div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={selectedDepartment === "all"}>
                        <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm rounded-lg border-gray-300">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="all">All Categories</SelectItem>
                          {selectedDepartment !== "all" && getCategoriesForDepartment(selectedDepartment).map(cat => (
                            <SelectItem key={cat} value={cat} className="text-xs md:text-sm">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedSite} onValueChange={setSelectedSite}>
                        <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm rounded-lg border-gray-300">
                          <SelectValue placeholder="All Sites" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="all">All Sites</SelectItem>
                          {sites.map(site => (
                            <SelectItem key={site._id} value={site.name} className="text-xs md:text-sm">{site.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedManager} onValueChange={setSelectedManager}>
                        <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm rounded-lg border-gray-300">
                          <SelectValue placeholder="All Managers" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="all">All Managers</SelectItem>
                          {uniqueManagers.map(manager => (
                            <SelectItem key={manager} value={manager} className="text-xs md:text-sm">{manager}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Table/Grid View */}
                    {isMobileView && viewMode === 'grid' ? (
                      <InventoryGridView />
                    ) : (
                      <div className="rounded-lg border border-gray-200 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Name</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Department</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Manager</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Site</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 md:py-12">
                                  <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                                    <Package className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                                  </div>
                                  <p className="text-sm md:text-lg font-semibold text-gray-900">No items found</p>
                                  <p className="text-xs md:text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredItems.map((item, index) => {
                                const DeptIcon = getDepartmentIcon(item.department);
                                const isLowStock = item.quantity <= item.reorderLevel;
                                
                                return (
                                  <TableRow 
                                    key={item.id} 
                                    className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                  >
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                      <span className="font-mono font-medium text-xs md:text-sm text-gray-900">{item.sku}</span>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                          <Package className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <span className="font-medium text-xs md:text-sm text-gray-900">{item.name}</span>
                                          {item.description && <p className="text-[10px] md:text-xs text-gray-500 truncate max-w-[150px]">{item.description}</p>}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden sm:table-cell">
                                      <Badge variant="outline" className="flex items-center gap-1 w-fit border-gray-200 bg-gray-50 text-xs">
                                        <DeptIcon className="h-3 w-3" />
                                        {departments.find(d => d.value === item.department)?.label}
                                      </Badge>
                                      <div className="text-[10px] md:text-xs text-gray-500 mt-1">{item.category}</div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden md:table-cell">
                                      <div className="flex items-center gap-1 text-xs text-gray-700">
                                        <UserCheck className="h-3 w-3 text-gray-400" />
                                        {item.assignedManager}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden lg:table-cell">
                                      <div className="flex items-center gap-1 text-xs text-gray-700">
                                        <Building className="h-3 w-3 text-gray-400" />
                                        {item.site}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                      <div className="flex items-center gap-2">
                                        <span className={`font-medium text-xs md:text-sm ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>{item.quantity}</span>
                                        {isLowStock && <Badge variant="outline" className="text-[8px] md:text-xs border-amber-200 bg-amber-50 text-amber-700"><AlertTriangle className="h-2 w-2 md:h-3 md:w-3 mr-1" />Low</Badge>}
                                      </div>
                                      <div className="text-[10px] md:text-xs text-gray-500">Reorder: {item.reorderLevel}</div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                      <div className="font-medium text-xs md:text-sm text-green-600">{formatCurrency(item.price)}</div>
                                      <div className="text-[10px] md:text-xs text-gray-500">Cost: {formatCurrency(item.costPrice)}</div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                      {isLowStock ? 
                                        <Badge variant="destructive" className="text-[8px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full">Low Stock</Badge> : 
                                        <Badge variant="outline" className="text-[8px] md:text-xs bg-green-50 text-green-700 border-green-200 px-1.5 md:px-2 py-0.5 rounded-full">In Stock</Badge>
                                      }
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => setChangeHistoryDialogOpen(item.id)}
                                          className="w-6 h-6 md:w-8 md:h-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                          title="View History"
                                        >
                                          <History className="h-3 w-3 md:h-4 md:w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MACHINES TAB */}
          <AnimatePresence mode="wait">
            {activeTab === "machines" && (
              <motion.div
                key="machines"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-lg rounded-xl md:rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base md:text-xl font-bold text-gray-900">Machine Management</CardTitle>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">Track and monitor all machinery equipment across sites</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleExportMachines} 
                          disabled={machines.length === 0}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg md:rounded-xl text-xs md:text-sm px-2 md:px-4 h-8 md:h-10"
                        >
                          <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden xs:inline">Export</span>
                        </Button>
                        
                        {isMobileView && (
                          <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                            <Button
                              variant={viewMode === 'table' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-8 px-2 rounded-lg"
                              onClick={() => setViewMode('table')}
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={viewMode === 'grid' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-8 px-2 rounded-lg"
                              onClick={() => setViewMode('grid')}
                            >
                              <Grid3x3 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    {/* Search */}
                    <div className="mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                        <Input 
                          placeholder="Search machines by name, model, location..." 
                          value={machineSearchQuery} 
                          onChange={(e) => setMachineSearchQuery(e.target.value)} 
                          className="pl-8 md:pl-10 h-8 md:h-10 text-xs md:text-sm rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Table/Grid View */}
                    {isMobileView && viewMode === 'grid' ? (
                      <MachinesGridView />
                    ) : (
                      <div className="rounded-lg border border-gray-200 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Machine Name</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Model</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Cost</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Purchase Date</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Location</TableHead>
                              <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredMachines.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 md:py-12">
                                  <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                                    <Cpu className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                                  </div>
                                  <p className="text-sm md:text-lg font-semibold text-gray-900">No machines found</p>
                                  <p className="text-xs md:text-sm text-gray-500 mt-1">Add your first machine to get started</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredMachines.map((machine, index) => {
                                const statusOption = machineStatusOptions.find(s => s.value === machine.status);
                                const StatusIcon = statusOption?.icon || CheckCircle;
                                const machineAge = calculateMachineAge(machine.purchaseDate);
                                
                                return (
                                  <TableRow 
                                    key={machine.id} 
                                    className={`hover:bg-purple-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                  >
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                          <Cpu className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                                        </div>
                                        <span className="font-medium text-xs md:text-sm text-gray-900">{machine.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden sm:table-cell">
                                      <span className="text-xs text-gray-700">{machine.model || 'N/A'}</span>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                      <span className="font-medium text-xs md:text-sm text-gray-900">{machine.quantity}</span>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden md:table-cell">
                                      <div className="font-medium text-xs md:text-sm text-green-600">{formatCurrency(machine.cost)}</div>
                                      <div className="text-[10px] md:text-xs text-gray-500">Total: {formatCurrency(machine.cost * machine.quantity)}</div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden lg:table-cell">
                                      <div className="flex items-center gap-1 text-xs text-gray-700">
                                        <Calendar className="h-3 w-3 text-gray-400" />
                                        {formatDate(machine.purchaseDate)}
                                      </div>
                                      <div className="text-[10px] md:text-xs text-gray-500">Age: {machineAge} year{machineAge !== 1 ? 's' : ''}</div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                      <Badge className={`${statusOption?.color} border-0 flex items-center gap-1 w-fit text-[8px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full`}>
                                        <StatusIcon className="h-2 w-2 md:h-3 md:w-3" />
                                        {statusOption?.label}
                                      </Badge>
                                      {machine.nextMaintenanceDate && <div className="text-[10px] md:text-xs text-gray-500 mt-1">Next: {formatDate(machine.nextMaintenanceDate)}</div>}
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden xl:table-cell">
                                      <div className="flex items-center gap-1 text-xs text-gray-700">
                                        <MapPin className="h-3 w-3 text-gray-400" />
                                        {machine.location || 'Not assigned'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2 md:py-3 px-2 md:px-4 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => handleViewMachine(machine.id)}
                                          className="w-6 h-6 md:w-8 md:h-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                          title="View Details"
                                        >
                                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* UPDATES TAB */}
          <AnimatePresence mode="wait">
            {activeTab === "updates" && (
              <motion.div
                key="updates"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-lg rounded-xl md:rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
                    <div>
                      <CardTitle className="text-base md:text-xl font-bold text-gray-900">Site Updates</CardTitle>
                      <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">Track all machine assignments and status updates across all sites</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="rounded-lg border border-gray-200 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Machine Name</TableHead>
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Model</TableHead>
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Site</TableHead>
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</TableHead>
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Description</TableHead>
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Photos</TableHead>
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Updated By</TableHead>
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</TableHead>
                            <TableHead className="py-2 md:py-3 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {machineUpdates.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 md:py-12">
                                <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                                  <Building className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                                </div>
                                <p className="text-sm md:text-lg font-semibold text-gray-900">No updates found</p>
                                <p className="text-xs md:text-sm text-gray-500 mt-1">Updates will appear here when supervisors record site updates.</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            machineUpdates.map((update, index) => {
                              const statusOption = machineStatusOptions.find(s => s.value === update.status);
                              const StatusIcon = statusOption?.icon || CheckCircle;
                              
                              return (
                                <TableRow 
                                  key={update.id} 
                                  className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                >
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Cpu className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                                      </div>
                                      <span className="font-medium text-xs md:text-sm text-gray-900">{update.machineName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden sm:table-cell">
                                    <span className="text-xs text-gray-700">{update.modelNumber || 'N/A'}</span>
                                  </TableCell>
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden md:table-cell">
                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                      <MapPin className="h-3 w-3 text-gray-400" />
                                      {update.site}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                    <Badge className={`${statusOption?.color} border-0 flex items-center gap-1 w-fit text-[8px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full`}>
                                      <StatusIcon className="h-2 w-2 md:h-3 md:w-3" />
                                      {statusOption?.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden lg:table-cell">
                                    <span className="text-xs text-gray-600 truncate block max-w-[200px]" title={update.description}>
                                      {update.description || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                    <div className="flex -space-x-2">
                                      {update.photoUrls && update.photoUrls.slice(0, 3).map((url, idx) => (
                                        <img 
                                          key={idx}
                                          src={url} 
                                          alt={`Photo ${idx + 1}`} 
                                          className="h-6 w-6 md:h-8 md:w-8 rounded-full object-cover border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                                          onClick={() => window.open(url, '_blank')}
                                        />
                                      ))}
                                      {update.photoUrls && update.photoUrls.length > 3 && (
                                        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-gray-200 flex items-center justify-center text-[8px] md:text-xs font-medium border-2 border-white">
                                          +{update.photoUrls.length - 3}
                                        </div>
                                      )}
                                      {(!update.photoUrls || update.photoUrls.length === 0) && (
                                        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                          <ImageIcon className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4 hidden xl:table-cell">
                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                      <UserCheck className="h-3 w-3 text-gray-400" />
                                      {update.updatedBy}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4">
                                    <span className="text-xs text-gray-700">{formatDate(update.updatedAt)}</span>
                                  </TableCell>
                                  <TableCell className="py-2 md:py-3 px-2 md:px-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleViewUpdate(update)}
                                        className="w-6 h-6 md:w-8 md:h-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                        title="View Details"
                                      >
                                        <Eye className="h-3 w-3 md:h-4 md:w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Machine View Dialog */}
        <MachineViewDialog 
          machine={viewMachine} 
          open={viewMachineDialogOpen} 
          onClose={() => setViewMachineDialogOpen(false)} 
        />

        {/* Update View Dialog */}
        <UpdateViewDialog 
          update={viewUpdate} 
          open={viewUpdateDialogOpen} 
          onClose={() => setViewUpdateDialogOpen(false)} 
        />

        {/* Change History Dialog */}
        <Dialog open={!!changeHistoryDialogOpen} onOpenChange={() => setChangeHistoryDialogOpen(null)}>
          <DialogContent className="max-w-sm md:max-w-md bg-white rounded-xl md:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg font-semibold text-gray-900">Change History</DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-gray-500">
                Track all changes made to this item
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {changeHistoryDialogOpen && (() => { 
                const item = items.find(item => item.id === changeHistoryDialogOpen); 
                return item?.changeHistory && item.changeHistory.length > 0 ? 
                  item.changeHistory.map((change, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs p-2 md:p-3 bg-gray-50 rounded-lg gap-1 border border-gray-100">
                      <span className="text-gray-500">{change.date}</span>
                      <span className="font-medium text-gray-700">{change.change}</span>
                      <span className="text-gray-500">by {change.user}</span>
                      <span className={`font-semibold ${change.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change.quantity > 0 ? '+' : ''}{change.quantity}
                      </span>
                    </div>
                  )) : 
                  <p className="text-sm text-gray-500 text-center py-8">No change history available</p>;
              })()}
            </div>
            <DialogFooter>
              <Button onClick={() => setChangeHistoryDialogOpen(null)} className="bg-blue-600 hover:bg-blue-700 rounded-lg">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SuperAdminInventoryPage;