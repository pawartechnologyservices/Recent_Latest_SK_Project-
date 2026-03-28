// frontend/components/SuperAdmin/SuperAdminReports.tsx (Mobile Responsive)
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  Users, Calendar, Building, CheckCircle, XCircle, Clock, Eye,
  Loader2, AlertCircle, Download, FileText, Image as ImageIcon, Filter, ChevronDown, ChevronUp,
  Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import siteVisitService from "../../services/SiteVisitService";

interface Manager {
  managerId: string;
  managerName: string;
  totalVisits: number;
  uniqueSites: number;
  lastVisit: Date;
  firstVisit: Date;
}

interface Site {
  siteId: string;
  siteName: string;
  totalVisits: number;
  uniqueManagerCount: number;
  lastVisit: Date;
}

interface Report {
  _id: string;
  siteId: string;
  siteName: string;
  managerId: string;
  managerName: string;
  visitDate: Date;
  photos: any[];
  workQueries: any[];
  updates: any[];
  status: string;
}

interface Statistics {
  dailyVisits: Array<{ _id: string; count: number }>;
  statusBreakdown: Array<{ _id: string; count: number }>;
  managerPerformance: Array<{
    managerId: string;
    managerName: string;
    totalVisits: number;
    uniqueSiteCount: number;
    workQueriesCreated: number;
    lastVisit?: Date;
  }>;
  sitePopularity: Array<{
    siteId: string;
    siteName: string;
    visitCount: number;
    uniqueManagerCount: number;
    lastVisit: Date;
  }>;
  totalVisits: number;
}

const SuperAdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [useCustomDateRange, setUseCustomDateRange] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Generate available years (last 5 years and next 2 years)
  const availableYears = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  }, []);
  
  // Generate months
  const months = [
    { value: 1, name: "Jan", fullName: "January" },
    { value: 2, name: "Feb", fullName: "February" },
    { value: 3, name: "Mar", fullName: "March" },
    { value: 4, name: "Apr", fullName: "April" },
    { value: 5, name: "May", fullName: "May" },
    { value: 6, name: "Jun", fullName: "June" },
    { value: 7, name: "Jul", fullName: "July" },
    { value: 8, name: "Aug", fullName: "August" },
    { value: 9, name: "Sep", fullName: "September" },
    { value: 10, name: "Oct", fullName: "October" },
    { value: 11, name: "Nov", fullName: "November" },
    { value: 12, name: "Dec", fullName: "December" }
  ];
  
  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let year = selectedYear;
      let month = selectedMonth;
      
      if (useCustomDateRange && startDate && endDate) {
        const allReports = await siteVisitService.getMonthlyReports(
          selectedYear,
          selectedMonth,
          {
            ...(selectedManager !== "all" && { managerId: selectedManager }),
            ...(selectedSite !== "all" && { siteId: selectedSite }),
            ...(selectedStatus !== "all" && { status: selectedStatus })
          }
        );
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const filteredReports = allReports.reports.filter(report => {
          const visitDate = new Date(report.visitDate);
          return visitDate >= start && visitDate <= end;
        });
        
        setReports(filteredReports);
        
        const managerMap = new Map<string, Manager>();
        filteredReports.forEach(report => {
          if (!managerMap.has(report.managerId)) {
            managerMap.set(report.managerId, {
              managerId: report.managerId,
              managerName: report.managerName,
              totalVisits: 0,
              uniqueSites: 0,
              lastVisit: report.visitDate,
              firstVisit: report.visitDate
            });
          }
          const manager = managerMap.get(report.managerId)!;
          manager.totalVisits++;
          if (new Date(report.visitDate) > new Date(manager.lastVisit)) {
            manager.lastVisit = report.visitDate;
          }
          if (new Date(report.visitDate) < new Date(manager.firstVisit)) {
            manager.firstVisit = report.visitDate;
          }
        });
        
        const managerSitesMap = new Map<string, Set<string>>();
        filteredReports.forEach(report => {
          if (!managerSitesMap.has(report.managerId)) {
            managerSitesMap.set(report.managerId, new Set());
          }
          managerSitesMap.get(report.managerId)!.add(report.siteId);
        });
        
        const managersList = Array.from(managerMap.values()).map(manager => ({
          ...manager,
          uniqueSites: managerSitesMap.get(manager.managerId)?.size || 0
        }));
        setManagers(managersList);
        
        const siteMap = new Map<string, Site>();
        filteredReports.forEach(report => {
          if (!siteMap.has(report.siteId)) {
            siteMap.set(report.siteId, {
              siteId: report.siteId,
              siteName: report.siteName,
              totalVisits: 0,
              uniqueManagerCount: 0,
              lastVisit: report.visitDate
            });
          }
          const site = siteMap.get(report.siteId)!;
          site.totalVisits++;
          if (new Date(report.visitDate) > new Date(site.lastVisit)) {
            site.lastVisit = report.visitDate;
          }
        });
        
        const siteManagersMap = new Map<string, Set<string>>();
        filteredReports.forEach(report => {
          if (!siteManagersMap.has(report.siteId)) {
            siteManagersMap.set(report.siteId, new Set());
          }
          siteManagersMap.get(report.siteId)!.add(report.managerId);
        });
        
        const sitesList = Array.from(siteMap.values()).map(site => ({
          ...site,
          uniqueManagerCount: siteManagersMap.get(site.siteId)?.size || 0
        }));
        setSites(sitesList);
        
        const dailyVisitsMap = new Map<string, number>();
        filteredReports.forEach(report => {
          const dateKey = format(new Date(report.visitDate), 'yyyy-MM-dd');
          dailyVisitsMap.set(dateKey, (dailyVisitsMap.get(dateKey) || 0) + 1);
        });
        
        const dailyVisits = Array.from(dailyVisitsMap.entries())
          .map(([date, count]) => ({ _id: date, count }))
          .sort((a, b) => a._id.localeCompare(b._id));
        
        const statusBreakdown = [
          { _id: 'approved', count: filteredReports.filter(r => r.status === 'approved').length },
          { _id: 'submitted', count: filteredReports.filter(r => r.status === 'submitted').length },
          { _id: 'rejected', count: filteredReports.filter(r => r.status === 'rejected').length }
        ];
        
        setStatistics({
          dailyVisits,
          statusBreakdown,
          managerPerformance: managersList.map(m => ({
            managerId: m.managerId,
            managerName: m.managerName,
            totalVisits: m.totalVisits,
            uniqueSiteCount: m.uniqueSites,
            workQueriesCreated: filteredReports
              .filter(r => r.managerId === m.managerId)
              .reduce((sum, r) => sum + (r.workQueries?.length || 0), 0),
            lastVisit: m.lastVisit
          })),
          sitePopularity: sitesList.map(s => ({
            siteId: s.siteId,
            siteName: s.siteName,
            visitCount: s.totalVisits,
            uniqueManagerCount: s.uniqueManagerCount,
            lastVisit: s.lastVisit
          })),
          totalVisits: filteredReports.length
        });
        
      } else {
        const { reports: reportsData, stats: reportsStats } = await siteVisitService.getMonthlyReports(
          selectedYear,
          selectedMonth,
          {
            ...(selectedManager !== "all" && { managerId: selectedManager }),
            ...(selectedSite !== "all" && { siteId: selectedSite }),
            ...(selectedStatus !== "all" && { status: selectedStatus })
          }
        );
        
        setReports(reportsData);
        
        const managerMap = new Map<string, Manager>();
        reportsData.forEach(report => {
          if (!managerMap.has(report.managerId)) {
            managerMap.set(report.managerId, {
              managerId: report.managerId,
              managerName: report.managerName,
              totalVisits: 0,
              uniqueSites: 0,
              lastVisit: report.visitDate,
              firstVisit: report.visitDate
            });
          }
          const manager = managerMap.get(report.managerId)!;
          manager.totalVisits++;
          if (new Date(report.visitDate) > new Date(manager.lastVisit)) {
            manager.lastVisit = report.visitDate;
          }
          if (new Date(report.visitDate) < new Date(manager.firstVisit)) {
            manager.firstVisit = report.visitDate;
          }
        });
        
        const managerSitesMap = new Map<string, Set<string>>();
        reportsData.forEach(report => {
          if (!managerSitesMap.has(report.managerId)) {
            managerSitesMap.set(report.managerId, new Set());
          }
          managerSitesMap.get(report.managerId)!.add(report.siteId);
        });
        
        const managersList = Array.from(managerMap.values()).map(manager => ({
          ...manager,
          uniqueSites: managerSitesMap.get(manager.managerId)?.size || 0
        }));
        setManagers(managersList);
        
        const siteMap = new Map<string, Site>();
        reportsData.forEach(report => {
          if (!siteMap.has(report.siteId)) {
            siteMap.set(report.siteId, {
              siteId: report.siteId,
              siteName: report.siteName,
              totalVisits: 0,
              uniqueManagerCount: 0,
              lastVisit: report.visitDate
            });
          }
          const site = siteMap.get(report.siteId)!;
          site.totalVisits++;
          if (new Date(report.visitDate) > new Date(site.lastVisit)) {
            site.lastVisit = report.visitDate;
          }
        });
        
        const siteManagersMap = new Map<string, Set<string>>();
        reportsData.forEach(report => {
          if (!siteManagersMap.has(report.siteId)) {
            siteManagersMap.set(report.siteId, new Set());
          }
          siteManagersMap.get(report.siteId)!.add(report.managerId);
        });
        
        const sitesList = Array.from(siteMap.values()).map(site => ({
          ...site,
          uniqueManagerCount: siteManagersMap.get(site.siteId)?.size || 0
        }));
        setSites(sitesList);
        
        const statsData = await siteVisitService.getStatistics(
          selectedYear,
          selectedMonth,
          selectedManager !== "all" ? selectedManager : undefined
        );
        setStatistics(statsData);
      }
      
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.message || "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedManager, selectedSite, selectedStatus, startDate, endDate, useCustomDateRange]);
  
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);
  
  const resetCustomDateRange = () => {
    setStartDate("");
    setEndDate("");
    setUseCustomDateRange(false);
  };
  
  const applyFilters = () => {
    fetchAllData();
    setMobileMenuOpen(false);
  };
  
  const handleApproveReport = async (reportId: string) => {
    try {
      const result = await siteVisitService.approveReport(reportId, 'SuperAdmin');
      toast.success("Report approved successfully");
      fetchAllData();
      if (selectedReport && selectedReport._id === reportId) {
        setSelectedReport(result);
      }
    } catch (error: any) {
      console.error("Error approving report:", error);
      toast.error(error.message || "Failed to approve report");
    }
  };
  
  const handleRejectReport = async (reportId: string, reason: string) => {
    try {
      const result = await siteVisitService.rejectReport(reportId, reason);
      toast.success("Report rejected");
      fetchAllData();
      if (selectedReport && selectedReport._id === reportId) {
        setSelectedReport(result);
      }
    } catch (error: any) {
      console.error("Error rejecting report:", error);
      toast.error(error.message || "Failed to reject report");
    }
  };
  
  const exportToCSV = () => {
    const headers = ['Site', 'Manager', 'Visit Date', 'Status', 'Photos', 'Queries', 'Updates'];
    const rows = reports.map(report => [
      report.siteName,
      report.managerName,
      format(new Date(report.visitDate), 'dd MMM yyyy, hh:mm a'),
      report.status,
      report.photos.length,
      report.workQueries.length,
      report.updates.length
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site_visits_${useCustomDateRange ? `${startDate}_to_${endDate}` : `${selectedYear}_${selectedMonth}`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export started");
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Mobile Filter Button */}
      <div className="md:hidden sticky top-0 z-10 bg-background p-2 border-b">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Filter className="h-4 w-4" />
          {mobileMenuOpen ? "Hide Filters" : "Show Filters"}
          {mobileMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Filters - Desktop View */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <Card>
          <CardContent className="p-3 md:p-4">
            {/* Basic Filters - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div>
                <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">Year</label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears().map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">Month</label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        <span className="md:hidden">{month.name}</span>
                        <span className="hidden md:inline">{month.fullName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">Manager</label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger className="text-sm truncate">
                    <SelectValue placeholder="All Managers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                    {managers.slice(0, 20).map(manager => (
                      <SelectItem key={manager.managerId} value={manager.managerId} className="truncate">
                        {manager.managerName.length > 20 ? manager.managerName.substring(0, 20) + '...' : manager.managerName}
                        <span className="text-xs text-muted-foreground ml-1">({manager.totalVisits})</span>
                      </SelectItem>
                    ))}
                    {managers.length > 20 && (
                      <SelectItem value="more" disabled>+{managers.length - 20} more</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">Site</label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger className="text-sm truncate">
                    <SelectValue placeholder="All Sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {sites.slice(0, 20).map(site => (
                      <SelectItem key={site.siteId} value={site.siteId} className="truncate">
                        {site.siteName.length > 20 ? site.siteName.substring(0, 20) + '...' : site.siteName}
                        <span className="text-xs text-muted-foreground ml-1">({site.totalVisits})</span>
                      </SelectItem>
                    ))}
                    {sites.length > 20 && (
                      <SelectItem value="more" disabled>+{sites.length - 20} more</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Advanced Filters Toggle */}
            <div className="mt-3 md:mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm w-full md:w-auto"
              >
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                Advanced Filters
                {showAdvancedFilters ? <ChevronUp className="h-3 w-3 md:h-4 md:w-4" /> : <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />}
              </Button>
            </div>
            
            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-3 md:mt-4 p-3 md:p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="customDateRange"
                      checked={useCustomDateRange}
                      onChange={(e) => {
                        setUseCustomDateRange(e.target.checked);
                        if (!e.target.checked) {
                          resetCustomDateRange();
                        }
                      }}
                      className="h-3 w-3 md:h-4 md:w-4 rounded border-gray-300"
                    />
                    <label htmlFor="customDateRange" className="text-xs md:text-sm font-medium">
                      Custom Date Range
                    </label>
                  </div>
                </div>
                
                {useCustomDateRange ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || undefined}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">End Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || undefined}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">Status</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="submitted">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons - Responsive Layout */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3 md:mt-4">
              {(useCustomDateRange || showAdvancedFilters) && (
                <Button variant="outline" onClick={resetCustomDateRange} size="sm" className="text-xs md:text-sm">
                  Reset Filters
                </Button>
              )}
              <Button onClick={applyFilters} size="sm" className="gap-1 md:gap-2 text-xs md:text-sm">
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={exportToCSV} disabled={reports.length === 0} size="sm" className="text-xs md:text-sm">
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Export CSV
              </Button>
            </div>
            
            {/* Date Range Info - Responsive Text */}
            {useCustomDateRange && startDate && endDate && (
              <div className="mt-2 md:mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs md:text-sm text-blue-700">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 inline mr-1 md:mr-2" />
                <span className="text-xs md:text-sm">
                  Showing reports from {format(new Date(startDate), 'dd MMM yyyy')} to {format(new Date(endDate), 'dd MMM yyyy')}
                  {reports.length > 0 && ` (${reports.length} reports found)`}
                </span>
              </div>
            )}
            
            {!useCustomDateRange && (
              <div className="mt-2 md:mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs md:text-sm text-gray-600">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 inline mr-1 md:mr-2" />
                <span className="text-xs md:text-sm">
                  Showing reports for {months.find(m => m.value === selectedMonth)?.fullName} {selectedYear}
                  {reports.length > 0 && ` (${reports.length} reports found)`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Statistics Cards - Responsive Grid */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Total Visits</p>
                  <p className="text-base md:text-2xl font-bold">{statistics.totalVisits || reports.length}</p>
                </div>
                <Calendar className="h-4 w-4 md:h-8 md:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Approved</p>
                  <p className="text-base md:text-2xl font-bold text-green-600">
                    {reports.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Pending</p>
                  <p className="text-base md:text-2xl font-bold text-yellow-600">
                    {reports.filter(r => r.status === 'submitted').length}
                  </p>
                </div>
                <Clock className="h-4 w-4 md:h-8 md:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Active Managers</p>
                  <p className="text-base md:text-2xl font-bold">{managers.length}</p>
                </div>
                <Users className="h-4 w-4 md:h-8 md:w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Charts Section - Responsive */}
      {statistics && statistics.dailyVisits.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 text-xs md:text-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="managers">Managers</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            {/* Daily Visits Chart */}
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-sm md:text-lg">Daily Visits</CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <div className="h-[200px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statistics.dailyVisits}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Visits" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Status Breakdown Pie Chart */}
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-sm md:text-lg">Report Status</CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <div className="h-[200px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statistics.statusBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          const percentage = (percent * 100).toFixed(0);
                          return window.innerWidth < 768 ? `${percentage}%` : `${name}: ${percentage}%`;
                        }}
                        outerRadius={window.innerWidth < 768 ? 60 : 80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {statistics.statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="managers" className="mt-3 md:mt-4">
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-sm md:text-lg">Manager Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm">Manager</TableHead>
                        <TableHead className="text-xs md:text-sm">Visits</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs md:text-sm">Unique Sites</TableHead>
                        <TableHead className="hidden md:table-cell text-xs md:text-sm">Queries</TableHead>
                        <TableHead className="text-xs md:text-sm">Last Visit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statistics.managerPerformance.slice(0, 10).map((manager) => (
                        <TableRow key={manager.managerId}>
                          <TableCell className="text-xs md:text-sm font-medium truncate max-w-[100px] md:max-w-none">
                            {manager.managerName}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">{manager.totalVisits}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs md:text-sm">{manager.uniqueSiteCount}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs md:text-sm">{manager.workQueriesCreated}</TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {manager.lastVisit ? format(new Date(manager.lastVisit), 'dd MMM') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {statistics.managerPerformance.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                            +{statistics.managerPerformance.length - 10} more managers
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sites" className="mt-3 md:mt-4">
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-sm md:text-lg">Site Popularity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm">Site</TableHead>
                        <TableHead className="text-xs md:text-sm">Visits</TableHead>
                        <TableHead className="hidden md:table-cell text-xs md:text-sm">Unique Managers</TableHead>
                        <TableHead className="text-xs md:text-sm">Last Visit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statistics.sitePopularity.slice(0, 10).map((site) => (
                        <TableRow key={site.siteId}>
                          <TableCell className="text-xs md:text-sm font-medium truncate max-w-[100px] md:max-w-none">
                            {site.siteName}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">{site.visitCount}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs md:text-sm">{site.uniqueManagerCount}</TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {format(new Date(site.lastVisit), 'dd MMM')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {statistics.sitePopularity.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                            +{statistics.sitePopularity.length - 10} more sites
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="mt-3 md:mt-4">
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-sm md:text-lg">Site Visit Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm">Site</TableHead>
                        <TableHead className="text-xs md:text-sm hidden sm:table-cell">Manager</TableHead>
                        <TableHead className="text-xs md:text-sm">Date</TableHead>
                        <TableHead className="text-xs md:text-sm">Photos</TableHead>
                        <TableHead className="text-xs md:text-sm hidden sm:table-cell">Queries</TableHead>
                        <TableHead className="text-xs md:text-sm">Status</TableHead>
                        <TableHead className="text-xs md:text-sm text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.slice(0, 20).map((report) => (
                        <TableRow key={report._id}>
                          <TableCell className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-[150px]">
                            {report.siteName}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm hidden sm:table-cell truncate max-w-[100px]">
                            {report.managerName}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {format(new Date(report.visitDate), 'dd/MM/yy')}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">{report.photos?.length || 0}</TableCell>
                          <TableCell className="text-xs md:text-sm hidden sm:table-cell">{report.workQueries?.length || 0}</TableCell>
                          <TableCell className="text-xs md:text-sm">{getStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-xs md:text-sm text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 md:h-8 md:w-8"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setReportDialogOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                              {report.status === 'submitted' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 md:h-8 md:w-8 text-green-600"
                                    onClick={() => handleApproveReport(report._id)}
                                  >
                                    <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 md:h-8 md:w-8 text-red-600"
                                    onClick={() => {
                                      const reason = prompt("Enter rejection reason:");
                                      if (reason) handleRejectReport(report._id, reason);
                                    }}
                                  >
                                    <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {reports.length > 20 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-xs text-muted-foreground">
                            +{reports.length - 20} more reports
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Report Detail Dialog - Responsive */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-3 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-lg">
              Site Visit Report - {selectedReport?.siteName}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Submitted by {selectedReport?.managerName} on {selectedReport && format(new Date(selectedReport.visitDate), 'dd MMM yyyy, hh:mm a')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-3 md:space-y-6">
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <div className="flex gap-1 md:gap-2">
                  {selectedReport.status === 'submitted' && (
                    <>
                      <Button onClick={() => handleApproveReport(selectedReport._id)} size="sm" className="text-xs md:text-sm">
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs md:text-sm"
                        onClick={() => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason) handleRejectReport(selectedReport._id, reason);
                        }}
                      >
                        <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>
              
              {/* Photos Section - Responsive Grid */}
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-xs md:text-sm mb-2 md:mb-3 flex items-center gap-1 md:gap-2">
                    <ImageIcon className="h-3 w-3 md:h-4 md:w-4" />
                    Site Photos ({selectedReport.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {selectedReport.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Site photo ${index + 1}`}
                          className="w-full h-24 md:h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                          onError={(e) => {
                            console.error('Failed to load image:', photo.url);
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Not+Found';
                          }}
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] md:text-xs px-1 rounded">
                          {photo.uploadedAt ? format(new Date(photo.uploadedAt), 'dd MMM') : 'Date unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Work Queries */}
              {selectedReport.workQueries && selectedReport.workQueries.length > 0 && (
                <div>
                  <h3 className="font-semibold text-xs md:text-sm mb-2 md:mb-3">Work Queries ({selectedReport.workQueries.length})</h3>
                  <div className="space-y-2 md:space-y-3">
                    {selectedReport.workQueries.map((query) => (
                      <Card key={query._id}>
                        <CardContent className="p-2 md:p-4">
                          <div className="flex justify-between items-start mb-1 md:mb-2">
                            <h4 className="font-medium text-xs md:text-sm">{query.title}</h4>
                            <Badge variant={
                              query.priority === 'high' ? 'destructive' :
                              query.priority === 'medium' ? 'default' : 'secondary'
                            } className="text-[10px] md:text-xs">
                              {query.priority}
                            </Badge>
                          </div>
                          <p className="text-[10px] md:text-sm text-muted-foreground mb-1 md:mb-2">{query.description}</p>
                          <div className="flex justify-between items-center text-[10px] md:text-sm">
                            <Badge variant={
                              query.status === 'completed' ? 'default' :
                              query.status === 'in-progress' ? 'secondary' : 'outline'
                            } className="text-[10px] md:text-xs">
                              {query.status}
                            </Badge>
                            <span className="text-[10px] md:text-xs text-muted-foreground">
                              Created: {format(new Date(query.createdAt), 'dd MMM yyyy')}
                            </span>
                          </div>
                          {query.resolution && (
                            <div className="mt-1 md:mt-2 p-1 md:p-2 bg-green-50 rounded text-[10px] md:text-sm">
                              <span className="font-medium">Resolution:</span> {query.resolution}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Updates Timeline */}
              {selectedReport.updates && selectedReport.updates.length > 0 && (
                <div>
                  <h3 className="font-semibold text-xs md:text-sm mb-2 md:mb-3">Activity Timeline</h3>
                  <div className="space-y-1 md:space-y-2">
                    {selectedReport.updates.map((update, index) => (
                      <div key={index} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 border-l-2 border-primary">
                        <div className="text-[10px] md:text-xs text-muted-foreground min-w-[70px] md:min-w-[100px]">
                          {format(new Date(update.timestamp), 'dd MMM, hh:mm a')}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] md:text-sm">{update.content}</p>
                          <Badge variant="outline" className="mt-0.5 md:mt-1 text-[8px] md:text-xs">
                            {update.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Rejection Reason */}
              {selectedReport.status === 'rejected' && selectedReport.rejectionReason && (
                <div className="p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 text-xs md:text-sm mb-0.5 md:mb-1">Rejection Reason</h4>
                  <p className="text-[10px] md:text-sm text-red-700">{selectedReport.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminReports;