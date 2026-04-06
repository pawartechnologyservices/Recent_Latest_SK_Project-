import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  ClipboardList, 
  Clock, 
  Users, 
  LogIn,
  LogOut,
  Coffee,
  Timer,
  CalendarDays,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
  FileText,
  Calendar,
  UserPlus,
  Settings,
  Bell,
  Eye,
  Target,
  LineChart as LineChartIcon,
  Activity,
  CheckSquare,
  PlayCircle,
  AlertTriangle,
  Zap,
  MapPin,
  CalendarCheck,
  Building,
  RefreshCw,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus as UserPlusIcon,
  Home,
  Shield as ShieldIcon,
  Car,
  Trash2,
  Droplets,
  ShoppingCart,
  DollarSign,
  Briefcase,
  User,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Info,
  Target as TargetIcon,
  ExternalLink,
  Camera,
  Crown,
  Paperclip,
  MessageSquare,
  CircleDot,
  History
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/context/RoleContext";
import userService from "@/services/userService";
import { siteService, Site } from "@/services/SiteService";
import taskService, { Task } from "@/services/TaskService";
import { assignTaskService, type AssignTask } from "@/services/assignTaskService";
import axios from "axios";
import CameraCapture from "../supervisor/CameraCapture";

// Import Recharts for charts
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || `https://${window.location.hostname}:5001/api`;

// Chart color constants
const CHART_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  weeklyOff: '#8b5cf6',
  leave: '#f59e0b',
  halfDay: '#3b82f6',
  late: '#f59e0b',
  payroll: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444']
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

// Types
interface Employee {
  id: string;
  _id?: string;
  employeeId?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  site: string;
  siteName?: string;
  status: 'present' | 'absent' | 'leave' | 'weekly-off';
  checkInTime?: string;
  checkOutTime?: string;
  checkInPhoto?: string;
  checkOutPhoto?: string;
  date: string;
  remark?: string;
  action?: 'fine' | 'advance' | 'other' | '' | 'none';
  employeeStatus?: string;
  role?: string;
  gender?: string;
  dateOfJoining?: string;
  dateOfBirth?: string;
  salary?: number | string;
  assignedSites?: string[];
  shift?: string;
  workingHours?: string;
  employeeType?: string;
  reportingManager?: string;
  createdAt?: string;
  updatedAt?: string;
  isOnBreak?: boolean;
  hasCheckedOutToday?: boolean;
  isManager?: boolean;
  isSupervisor?: boolean;
}

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  totalHours: number;
  breakTime: number;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off';
  isCheckedIn: boolean;
  isOnBreak: boolean;
  supervisorId?: string;
  remarks?: string;
  siteName?: string;
  department?: string;
}

interface SiteAttendanceData {
  id: string;
  siteId: string;
  name: string;
  siteName: string;
  clientName?: string;
  location?: string;
  totalEmployees: number;
  present: number;
  absent: number;
  weeklyOff: number;
  leave: number;
  shortage: number;
  date: string;
  daysInPeriod: number;
  totalRequiredAttendance: number;
  totalPresentAttendance: number;
  periodShortage: number;
  startDate: string;
  endDate: string;
  employees: Employee[];
  isRealData: boolean;
  attendanceRate: number;
}

// Interface for daily attendance summary
interface DailyAttendanceSummary {
  date: string;
  day: string;
  present: number;
  absent: number;
  weeklyOff: number;
  leave: number;
  halfDay: number;
  total: number;
  rate: string;
  index: number;
  totalEmployees: number;
  sitesWithData: number;
  siteBreakdown?: {
    [siteName: string]: {
      total: number;
      present: number;
      absent: number;
      weeklyOff: number;
      leave: number;
      halfDay: number;
    }
  };
}

interface AttendanceStatus {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  totalHours: number;
  breakTime: number;
  lastCheckInDate: string | null;
  hasCheckedOutToday: boolean;
}

interface LeaveRequest {
  _id: string;
  id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  site: string;
  siteId?: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedBy: string;
  appliedFor: string;
  createdAt: string;
  updatedAt: string;
  isSupervisorLeave?: boolean;
  supervisorId?: string;
  remarks?: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancellationReason?: string;
  managerRemarks?: string;
  isManagerLeave?: boolean;
  managerId?: string;
  contactNumber?: string;
  position?: string;
  email?: string;
}

// Interface for AssignTask with personal status
interface AssignTaskWithPersonal {
  _id: string;
  taskTitle: string;
  description: string;
  startDate: string;
  endDate: string;
  dueDateTime: string;
  priority: 'high' | 'medium' | 'low';
  taskType: string;
  siteId: string;
  siteName: string;
  siteLocation: string;
  clientName: string;
  assignedManagers: Array<{
    userId: string;
    name: string;
    role: 'manager';
    assignedAt: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  }>;
  assignedSupervisors: Array<{
    userId: string;
    name: string;
    role: 'supervisor';
    assignedAt: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  }>;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completionPercentage?: number;
  isOverdue?: boolean;
  hourlyUpdates?: Array<{
    id: string;
    content: string;
    timestamp: string;
    submittedBy: string;
    submittedByName: string;
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    uploadedByName: string;
    size: number;
    type: string;
  }>;
  // Personal flags
  isCreatedByMe?: boolean;
  isAssignedToMe?: boolean;
  derivedStatus?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
}

interface TaskDetail {
  id: string;
  _id: string;
  title: string;
  description: string;
  assignee: string;
  assignedTo: string;
  assignedToName?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  deadline: string;
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'overdue';
  progress: number;
  siteName?: string;
  siteId?: string;
  clientName?: string;
  taskType?: string;
  createdAt: string;
  source: 'manager' | 'superadmin';
  isAssignedToMe?: boolean;
}

interface QuickAction {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  color: string;
  bgColor: string;
  hoverColor: string;
  gradient: string;
}

interface OutletContext {
  onMenuClick: () => void;
}

// Helper function to format date
const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTimeDisplay = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to format time
const formatTimeForDisplay = (timestamp: string | null): string => {
  if (!timestamp || timestamp === "-" || timestamp === "" || timestamp === "null") return "-";
  
  try {
    if (typeof timestamp === 'string' && (timestamp.includes('AM') || timestamp.includes('PM'))) {
      return timestamp;
    }
    
    if (timestamp.includes('T')) {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
    }
    
    const timeParts = timestamp.split(':');
    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${period}`;
    }
    
    return timestamp;
  } catch (error) {
    return timestamp || "-";
  }
};

// Format short date
const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric'
  });
};

// Normalize site name for comparison
const normalizeSiteName = (siteName: string | null | undefined): string => {
  if (!siteName) return '';
  return siteName
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
};

// Calculate days between dates
const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff + 1;
};

// Fetch all leave requests (employee, supervisor, and manager)
const fetchAllLeaveRequests = async (date?: string): Promise<LeaveRequest[]> => {
  try {
    console.log('🔄 Fetching all leave requests from API...');
    
    let url = `${API_URL}/leaves?limit=1000`;
    if (date) {
      url += `&date=${date}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 Leave API response:', data);
    
    let leavesData = [];
    
    if (Array.isArray(data)) {
      leavesData = data;
    } else if (data?.success && Array.isArray(data.data)) {
      leavesData = data.data;
    } else if (data?.data && Array.isArray(data.data)) {
      leavesData = data.data;
    } else if (data?.leaves && Array.isArray(data.leaves)) {
      leavesData = data.leaves;
    } else if (data?.results && Array.isArray(data.results)) {
      leavesData = data.results;
    }
    
    console.log(`📊 Raw leaves data count: ${leavesData.length}`);
    
    const transformedLeaves: LeaveRequest[] = leavesData.map((leave: any) => ({
      _id: leave._id || leave.id || `leave_${Math.random()}`,
      id: leave._id || leave.id,
      employeeId: leave.employeeId || leave.employeeID || leave.empId || '',
      employeeName: leave.employeeName || leave.name || leave.empName || 'Unknown',
      department: leave.department || leave.dept || 'Unknown',
      site: leave.site || leave.location || leave.siteName || 'Main Site',
      siteId: leave.siteId,
      leaveType: leave.leaveType || leave.type || 'casual',
      fromDate: leave.fromDate || leave.startDate || '',
      toDate: leave.toDate || leave.endDate || '',
      totalDays: leave.totalDays || leave.days || 1,
      reason: leave.reason || leave.description || '',
      status: leave.status || leave.leaveStatus || 'pending',
      appliedBy: leave.appliedBy || leave.applicant || '',
      appliedFor: leave.appliedFor || leave.employeeId || '',
      createdAt: leave.createdAt || leave.created || leave.appliedDate || new Date().toISOString(),
      updatedAt: leave.updatedAt || leave.updated || new Date().toISOString(),
      contactNumber: leave.contactNumber || leave.phone || '',
      remarks: leave.remarks || leave.comments || '',
      approvedBy: leave.approvedBy,
      rejectedBy: leave.rejectedBy,
      approvedAt: leave.approvedAt,
      rejectedAt: leave.rejectedAt,
      cancellationReason: leave.cancellationReason,
      managerRemarks: leave.managerRemarks,
      isSupervisorLeave: leave.isSupervisorLeave === true,
      isManagerLeave: leave.isManagerLeave === true || leave.managerId ? true : false,
      supervisorId: leave.supervisorId,
      managerId: leave.managerId,
      position: leave.position,
      email: leave.email
    }));
    
    console.log(`✅ Transformed ${transformedLeaves.length} leave requests`);
    return transformedLeaves;
  } catch (error: any) {
    console.error('❌ Error fetching leaves:', error);
    toast.error(`Failed to fetch leaves: ${error.message}`);
    return [];
  }
};

// Fetch employees from API
const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    console.log('🔄 Fetching employees from API...');
    
    const response = await fetch(`${API_URL}/employees?limit=1000`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    let employeesData = [];
    
    if (Array.isArray(data)) {
      employeesData = data;
    } else if (data?.success && Array.isArray(data.data)) {
      employeesData = data.data;
    } else if (data?.employees && Array.isArray(data.employees)) {
      employeesData = data.employees;
    } else if (data?.data && Array.isArray(data.data.employees)) {
      employeesData = data.data.employees;
    }
    
    console.log(`📊 Raw employees data count: ${employeesData.length}`);
    
    const transformedEmployees: Employee[] = employeesData.map((emp: any) => ({
      id: emp._id || emp.id || `emp_${Math.random()}`,
      _id: emp._id || emp.id,
      employeeId: emp.employeeId || emp.employeeID || emp.empId || `EMP${String(Math.random()).slice(2, 6)}`,
      name: emp.name || emp.employeeName || emp.fullName || "Unknown Employee",
      email: emp.email || "",
      phone: emp.phone || emp.mobile || emp.contactNumber || "",
      department: emp.department || emp.dept || "Unknown Department",
      position: emp.position || emp.designation || emp.role || "Employee",
      site: emp.site || emp.siteName || emp.location || "Main Site",
      siteName: emp.siteName || emp.site || "Main Site",
      status: "absent" as const,
      employeeStatus: (emp.status || "active") as string,
      role: emp.role || 'employee',
      gender: emp.gender || '',
      dateOfJoining: emp.dateOfJoining || emp.joinDate || '',
      dateOfBirth: emp.dateOfBirth || '',
      salary: emp.salary || emp.basicSalary || 0,
      assignedSites: emp.assignedSites || emp.sites || [],
      shift: emp.shift || 'General',
      workingHours: emp.workingHours || '9:00 AM - 6:00 PM',
      employeeType: emp.employeeType || emp.type || 'Full-time',
      reportingManager: emp.reportingManager || emp.manager || '',
      createdAt: emp.createdAt || emp.created || new Date().toISOString(),
      updatedAt: emp.updatedAt || emp.updated || new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      isManager: (emp.position?.toLowerCase() || '').includes('manager') || (emp.department?.toLowerCase() || '').includes('manager'),
      isSupervisor: (emp.position?.toLowerCase() || '').includes('supervisor') || (emp.department?.toLowerCase() || '').includes('supervisor')
    }));
    
    console.log(`✅ Transformed ${transformedEmployees.length} employees`);
    return transformedEmployees;
  } catch (error: any) {
    console.error('❌ Error fetching employees:', error);
    toast.error(`Failed to fetch employees: ${error.message}`);
    return [];
  }
};

// Fetch manager's assigned sites from tasks
const fetchManagerSites = async (managerId: string): Promise<Site[]> => {
  try {
    console.log('Fetching tasks for manager:', managerId);
    
    const [allSites, allTasks] = await Promise.all([
      siteService.getAllSites(),
      taskService.getAllTasks()
    ]);

    const managerSites = allSites.filter(site => {
      const siteTasks = allTasks.filter(task => task.siteId === site._id);
      
      const isManagerAssigned = siteTasks.some(task => 
        task.assignedUsers?.some((user: any) => 
          user.userId === managerId && user.role === 'manager'
        ) || task.assignedTo === managerId
      );

      return isManagerAssigned;
    });

    console.log(`Found ${managerSites.length} sites for manager`);
    return managerSites;
    
  } catch (error) {
    console.error('Error fetching manager sites:', error);
    return [];
  }
};

// Generate employee data for site for a specific date
const generateSiteEmployeeData = async (siteName: string, date: string): Promise<Employee[]> => {
  try {
    const allEmployees = await fetchEmployees();
    
    const siteEmployees = allEmployees.filter(emp => 
      emp.site === siteName || emp.siteName === siteName
    );
    
    console.log(`Found ${siteEmployees.length} employees for site: ${siteName}`);
    
    const attendanceRecords = await fetchAttendanceRecords(date);
    
    const employees: Employee[] = [];
    
    for (const employee of siteEmployees) {
      const attendance = attendanceRecords.find(record => 
        record.employeeId === employee._id || record.employeeId === employee.id
      );
      
      let status: 'present' | 'absent' | 'leave' | 'weekly-off' = 'absent';
      let checkInTime = '-';
      let checkOutTime = '-';
      let checkInPhoto = null;
      let checkOutPhoto = null;
      let remark = '';
      let isOnBreak = false;
      let hasCheckedOutToday = false;
      
      if (attendance) {
        if (attendance.status === 'present' || attendance.status === 'half-day') {
          status = 'present';
        } else if (attendance.status === 'leave') {
          status = 'leave';
        } else if (attendance.status === 'weekly-off') {
          status = 'weekly-off';
        } else {
          status = 'absent';
        }
        
        checkInTime = attendance.checkInTime ? formatTimeForDisplay(attendance.checkInTime) : '-';
        checkOutTime = attendance.checkOutTime ? formatTimeForDisplay(attendance.checkOutTime) : '-';
        checkInPhoto = attendance.checkInPhoto;
        checkOutPhoto = attendance.checkOutPhoto;
        remark = attendance.remarks || '';
        isOnBreak = attendance.isOnBreak || false;
        hasCheckedOutToday = attendance.checkOutTime ? true : false;
      }
      
      employees.push({
        ...employee,
        status,
        checkInTime,
        checkOutTime,
        checkInPhoto: checkInPhoto || undefined,
        checkOutPhoto: checkOutPhoto || undefined,
        date,
        remark,
        isOnBreak,
        hasCheckedOutToday
      });
    }
    
    console.log(`Processed ${employees.length} employees for site: ${siteName}`);
    return employees;
  } catch (error) {
    console.error('Error generating employee data:', error);
    return [];
  }
};

// Fetch attendance records for a specific date
const fetchAttendanceRecords = async (date: string): Promise<AttendanceRecord[]> => {
  try {
    console.log(`🔄 Fetching attendance records for date: ${date}`);
    const response = await fetch(`${API_URL}/attendance?date=${date}&limit=1000`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map((record: any) => ({
          _id: record._id || record.id,
          employeeId: record.employeeId || '',
          employeeName: record.employeeName || 'Unknown',
          date: record.date || date,
          checkInTime: record.checkInTime || null,
          checkOutTime: record.checkOutTime || null,
          checkInPhoto: record.checkInPhoto || null,
          checkOutPhoto: record.checkOutPhoto || null,
          breakStartTime: record.breakStartTime || null,
          breakEndTime: record.breakEndTime || null,
          totalHours: Number(record.totalHours) || 0,
          breakTime: Number(record.breakTime) || 0,
          status: (record.status?.toLowerCase() || 'absent') as any,
          isCheckedIn: Boolean(record.isCheckedIn),
          isOnBreak: Boolean(record.isOnBreak),
          supervisorId: record.supervisorId,
          remarks: record.remarks || '',
          siteName: record.siteName || record.site || '',
          department: record.department || ''
        }));
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
};

// Calculate site attendance data for a specific date
const calculateSiteAttendanceData = async (site: Site, date: string): Promise<SiteAttendanceData> => {
  const employees = await generateSiteEmployeeData(site.name, date);
  
  const present = employees.filter(emp => emp.status === 'present').length;
  const weeklyOff = employees.filter(emp => emp.status === 'weekly-off').length;
  const leave = employees.filter(emp => emp.status === 'leave').length;
  const absent = employees.filter(emp => emp.status === 'absent').length;
  
  const totalPresent = present + weeklyOff;
  const totalRequired = employees.length;
  const shortage = totalRequired - totalPresent;
  const attendanceRate = totalRequired > 0 ? Math.round((totalPresent / totalRequired) * 100) : 0;
  
  return {
    id: site._id,
    siteId: site._id,
    name: site.name,
    siteName: site.name,
    clientName: site.clientName,
    location: site.location,
    totalEmployees: employees.length,
    present: totalPresent,
    absent,
    weeklyOff,
    leave,
    shortage,
    date,
    daysInPeriod: 1,
    totalRequiredAttendance: totalRequired,
    totalPresentAttendance: totalPresent,
    periodShortage: shortage,
    startDate: date,
    endDate: date,
    employees,
    isRealData: employees.length > 0,
    attendanceRate
  };
};

// Fetch attendance data for manager's sites for the last 7 days
const fetchManagerAttendanceData = async (managerId: string, days: number = 7): Promise<DailyAttendanceSummary[]> => {
  try {
    console.log(`🔄 Fetching attendance data for last ${days} days across manager's sites...`);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    const managerSites = await fetchManagerSites(managerId);
    
    if (managerSites.length === 0) {
      console.log('No sites assigned to manager');
      return [];
    }
    
    let totalEmployeesAllSites = 0;
    const siteEmployeeCounts: { [siteName: string]: number } = {};
    
    for (const site of managerSites) {
      const employees = await generateSiteEmployeeData(site.name, formatDate(new Date()));
      siteEmployeeCounts[site.name] = employees.length;
      totalEmployeesAllSites += employees.length;
    }
    
    console.log(`Total employees across all manager's sites: ${totalEmployeesAllSites}`);
    
    let allRecords: AttendanceRecord[] = [];
    
    try {
      const response = await axios.get(`${API_URL}/attendance`, {
        params: { 
          startDate: startDateStr, 
          endDate: endDateStr,
          limit: 10000
        }
      });
      
      if (response.data) {
        if (response.data.success && Array.isArray(response.data.data)) {
          allRecords = response.data.data;
        } else if (Array.isArray(response.data)) {
          allRecords = response.data;
        } else if (response.data.attendance && Array.isArray(response.data.attendance)) {
          allRecords = response.data.attendance;
        }
      }
    } catch (error) {
      console.log('Main attendance endpoint failed, trying range endpoint:', error);
      
      try {
        const response = await axios.get(`${API_URL}/attendance/range`, {
          params: { startDate: startDateStr, endDate: endDateStr }
        });
        
        if (response.data) {
          if (response.data.success && Array.isArray(response.data.data)) {
            allRecords = response.data.data;
          } else if (Array.isArray(response.data)) {
            allRecords = response.data;
          } else if (response.data.attendance && Array.isArray(response.data.attendance)) {
            allRecords = response.data.attendance;
          }
        }
      } catch (rangeError) {
        console.log('Range endpoint failed, falling back to day-by-day:', rangeError);
        
        const tempDate = new Date(startDate);
        while (tempDate <= endDate) {
          const dateStr = formatDate(tempDate);
          try {
            const response = await axios.get(`${API_URL}/attendance`, {
              params: { date: dateStr }
            });
            
            if (response.data) {
              let dayRecords = [];
              if (response.data.success && Array.isArray(response.data.data)) {
                dayRecords = response.data.data;
              } else if (Array.isArray(response.data)) {
                dayRecords = response.data;
              } else if (response.data.attendance && Array.isArray(response.data.attendance)) {
                dayRecords = response.data.attendance;
              }
              
              allRecords.push(...dayRecords);
            }
          } catch (dayError) {
            console.log(`No data for ${dateStr}`);
          }
          
          tempDate.setDate(tempDate.getDate() + 1);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    console.log(`✅ Fetched ${allRecords.length} attendance records total`);
    
    const allSiteEmployees: Employee[] = [];
    for (const site of managerSites) {
      const employees = await generateSiteEmployeeData(site.name, formatDate(new Date()));
      allSiteEmployees.push(...employees);
    }
    
    const employeeIdsFromSites = new Set(allSiteEmployees.map(emp => emp._id || emp.id));
    
    const dailySummaries: { [key: string]: DailyAttendanceSummary } = {};
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      dailySummaries[dateStr] = {
        date: dateStr,
        day: dateStr === formatDate(new Date()) ? 'Today' :
             dateStr === formatDate(new Date(Date.now() - 86400000)) ? 'Yesterday' : dayName,
        present: 0,
        absent: 0,
        weeklyOff: 0,
        leave: 0,
        halfDay: 0,
        total: 0,
        rate: '0.0%',
        index: days - Math.floor((new Date(endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
        totalEmployees: totalEmployeesAllSites,
        sitesWithData: 0,
        siteBreakdown: {}
      };
      
      Object.keys(siteEmployeeCounts).forEach(siteName => {
        if (dailySummaries[dateStr].siteBreakdown) {
          dailySummaries[dateStr].siteBreakdown![siteName] = {
            total: siteEmployeeCounts[siteName],
            present: 0,
            absent: 0,
            weeklyOff: 0,
            leave: 0,
            halfDay: 0
          };
        }
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const sitesWithDataPerDate: { [date: string]: Set<string> } = {};
    
    allRecords.forEach(record => {
      if (employeeIdsFromSites.has(record.employeeId) && dailySummaries[record.date]) {
        dailySummaries[record.date].total++;
        
        if (record.siteName) {
          if (!sitesWithDataPerDate[record.date]) {
            sitesWithDataPerDate[record.date] = new Set();
          }
          sitesWithDataPerDate[record.date].add(record.siteName);
        }
        
        if (record.siteName && dailySummaries[record.date].siteBreakdown?.[record.siteName]) {
          if (record.status === 'present') {
            dailySummaries[record.date].siteBreakdown![record.siteName].present++;
          } else if (record.status === 'weekly-off') {
            dailySummaries[record.date].siteBreakdown![record.siteName].weeklyOff++;
          } else if (record.status === 'leave') {
            dailySummaries[record.date].siteBreakdown![record.siteName].leave++;
          } else if (record.status === 'half-day') {
            dailySummaries[record.date].siteBreakdown![record.siteName].halfDay++;
          } else {
            dailySummaries[record.date].siteBreakdown![record.siteName].absent++;
          }
        }
        
        if (record.status === 'present') {
          dailySummaries[record.date].present++;
        } else if (record.status === 'weekly-off') {
          dailySummaries[record.date].weeklyOff++;
        } else if (record.status === 'leave') {
          dailySummaries[record.date].leave++;
        } else if (record.status === 'half-day') {
          dailySummaries[record.date].halfDay++;
        } else {
          dailySummaries[record.date].absent++;
        }
      }
    });
    
    Object.keys(sitesWithDataPerDate).forEach(date => {
      if (dailySummaries[date]) {
        dailySummaries[date].sitesWithData = sitesWithDataPerDate[date].size;
      }
    });
    
    Object.values(dailySummaries).forEach(summary => {
      const totalAccounted = summary.present + summary.weeklyOff + summary.leave + summary.halfDay;
      
      if (totalAccounted < summary.totalEmployees) {
        const unaccounted = summary.totalEmployees - totalAccounted;
        summary.absent += unaccounted;
      }
      
      if (summary.siteBreakdown) {
        Object.keys(summary.siteBreakdown).forEach(siteName => {
          const siteData = summary.siteBreakdown![siteName];
          const accountedSite = siteData.present + siteData.weeklyOff + siteData.leave + siteData.halfDay;
          if (accountedSite < siteData.total) {
            siteData.absent += (siteData.total - accountedSite);
          }
        });
      }
      
      const totalPresentWithWO = summary.present + summary.weeklyOff;
      summary.rate = summary.totalEmployees > 0 
        ? ((totalPresentWithWO / summary.totalEmployees) * 100).toFixed(1) + '%'
        : '0.0%';
    });
    
    const summaries = Object.values(dailySummaries).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    console.log(`📊 Processed ${summaries.length} daily summaries for manager's sites`);
    
    return summaries;
    
  } catch (error: any) {
    console.error('Error fetching attendance data:', error);
    toast.error('Failed to fetch attendance data', {
      description: error.message || 'Using demo data instead'
    });
    
    return [];
  }
};

// Site Employee Details Component
interface SiteEmployeeDetailsProps {
  siteData: SiteAttendanceData;
  onBack: () => void;
  selectedDate: string;
}

const SiteEmployeeDetails: React.FC<SiteEmployeeDetailsProps> = ({ siteData, onBack, selectedDate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'present' | 'absent' | 'weekly-off' | 'leave'>('all');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoType, setSelectedPhotoType] = useState<'checkin' | 'checkout'>('checkin');
  const itemsPerPage = 20;

  useEffect(() => {
    if (siteData?.employees && siteData.employees.length > 0) {
      setEmployees(siteData.employees);
    }
  }, [siteData?.employees]);

  const handleViewPhoto = (photoUrl: string | null | undefined, type: 'checkin' | 'checkout') => {
    if (photoUrl) {
      setSelectedPhoto(photoUrl);
      setSelectedPhotoType(type);
      setPhotoModalOpen(true);
    }
  };

  const allEmployees = employees;
  const presentEmployees = allEmployees.filter(emp => emp.status === 'present');
  const weeklyOffEmployees = allEmployees.filter(emp => emp.status === 'weekly-off');
  const leaveEmployees = allEmployees.filter(emp => emp.status === 'leave');
  const absentEmployees = allEmployees.filter(emp => emp.status === 'absent');

  const filteredEmployees = useMemo(() => {
    let filtered = [];
    switch (activeTab) {
      case 'present':
        filtered = presentEmployees;
        break;
      case 'absent':
        filtered = absentEmployees;
        break;
      case 'weekly-off':
        filtered = weeklyOffEmployees;
        break;
      case 'leave':
        filtered = leaveEmployees;
        break;
      default:
        filtered = allEmployees;
    }

    if (employeeSearch) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(employeeSearch.toLowerCase())) ||
        emp.department.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase().includes(employeeSearch.toLowerCase()))
      );
    }

    return filtered;
  }, [activeTab, employeeSearch, allEmployees, presentEmployees, absentEmployees, weeklyOffEmployees, leaveEmployees]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return "bg-green-100 text-green-800 border-green-200";
      case 'absent':
        return "bg-red-100 text-red-800 border-red-200";
      case 'weekly-off':
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 'leave':
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {siteData.name} - Employee Details
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatDateDisplay(selectedDate)} • {siteData.totalEmployees} employees
                {siteData.clientName && ` • Client: ${siteData.clientName}`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Employees</p>
                  <p className="text-2xl font-bold text-blue-600">{siteData.totalEmployees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Present</p>
                  <p className="text-2xl font-bold text-green-600">{siteData.present}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Weekly Off</p>
                  <p className="text-2xl font-bold text-purple-600">{siteData.weeklyOff}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Leave</p>
                  <p className="text-2xl font-bold text-blue-600">{siteData.leave}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{siteData.absent}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={activeTab === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                  >
                    All ({allEmployees.length})
                  </Button>
                  <Button
                    variant={activeTab === 'present' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setActiveTab('present'); setCurrentPage(1); }}
                  >
                    Present ({presentEmployees.length})
                  </Button>
                  <Button
                    variant={activeTab === 'weekly-off' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setActiveTab('weekly-off'); setCurrentPage(1); }}
                  >
                    Weekly Off ({weeklyOffEmployees.length})
                  </Button>
                  <Button
                    variant={activeTab === 'leave' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setActiveTab('leave'); setCurrentPage(1); }}
                  >
                    Leave ({leaveEmployees.length})
                  </Button>
                  <Button
                    variant={activeTab === 'absent' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setActiveTab('absent'); setCurrentPage(1); }}
                  >
                    Absent ({absentEmployees.length})
                  </Button>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={employeeSearch}
                    onChange={(e) => { setEmployeeSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full lg:w-64"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Employee Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Employee Details - {filteredEmployees.length} employees found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left font-medium">Employee ID</th>
                        <th className="h-12 px-4 text-left font-medium">Name</th>
                        <th className="h-12 px-4 text-left font-medium">Department</th>
                        <th className="h-12 px-4 text-left font-medium">Position</th>
                        <th className="h-12 px-4 text-left font-medium">Status</th>
                        <th className="h-12 px-4 text-left font-medium">Check In</th>
                        <th className="h-12 px-4 text-left font-medium">Check Out</th>
                        <th className="h-12 px-4 text-left font-medium">Check In Photo</th>
                        <th className="h-12 px-4 text-left font-medium">Check Out Photo</th>
                        <th className="h-12 px-4 text-left font-medium">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map((employee) => (
                          <tr key={employee.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 align-middle font-mono text-xs">
                              {employee.employeeId || employee.id}
                            </td>
                            <td className="p-4 align-middle">
                              <div className="font-medium">{employee.name}</div>
                            </td>
                            <td className="p-4 align-middle">
                              <Badge variant="outline">{employee.department}</Badge>
                            </td>
                            <td className="p-4 align-middle">{employee.position}</td>
                            <td className="p-4 align-middle">
                              <Badge className={getStatusBadge(employee.status)}>
                                {employee.status === 'weekly-off' ? 'Weekly Off' : 
                                 employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                                {employee.isOnBreak && <span className="ml-1 text-xs">(Break)</span>}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {employee.checkInTime || '-'}
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {employee.checkOutTime || '-'}
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              {employee.checkInPhoto ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewPhoto(employee.checkInPhoto, 'checkin')}
                                  className="h-8 px-2"
                                >
                                  <Camera className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                            <td className="p-4 align-middle">
                              {employee.checkOutPhoto ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewPhoto(employee.checkOutPhoto, 'checkout')}
                                  className="h-8 px-2"
                                >
                                  <Camera className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                            <td className="p-4 align-middle">
                              <div className="space-y-1">
                                {employee.email && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Mail className="h-3 w-3" />
                                    {employee.email}
                                  </div>
                                )}
                                {employee.phone && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Phone className="h-3 w-3" />
                                    {employee.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-muted-foreground">
                            No employees found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredEmployees.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        First
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                        Next
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Photo Modal */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPhotoType === 'checkin' ? 'Check-in Photo' : 'Check-out Photo'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt={`${selectedPhotoType} photo`}
                className="max-w-full h-auto rounded-lg shadow-lg"
                onError={(e) => {
                  console.error('Failed to load image:', selectedPhoto);
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="https://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M8 2v20M16 2v20M2 8h20M2 16h20"%3E%3C/path%3E%3C/svg%3E';
                  toast.error('Failed to load photo');
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoModalOpen(false)}>Close</Button>
            {selectedPhoto && (
              <Button onClick={() => window.open(selectedPhoto, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" /> Open Original
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper function to calculate task status based on supervisor statuses
const calculateTaskStatusFromSupervisors = (task: AssignTask): 'pending' | 'in-progress' | 'completed' | 'cancelled' => {
  if (!task.assignedSupervisors || task.assignedSupervisors.length === 0) {
    return task.status;
  }
  
  const supervisorStatuses = task.assignedSupervisors.map(s => s.status);
  
  if (supervisorStatuses.includes('in-progress')) {
    return 'in-progress';
  }
  
  if (supervisorStatuses.every(status => status === 'completed')) {
    return 'completed';
  }
  
  if (supervisorStatuses.includes('cancelled')) {
    return 'cancelled';
  }
  
  if (supervisorStatuses.every(status => status === 'pending')) {
    return 'pending';
  }
  
  return 'in-progress';
};

// Fetch manager tasks from assignTaskService
const fetchManagerTasksFromAPI = async (managerId: string): Promise<AssignTaskWithPersonal[]> => {
  try {
    const [createdTasks, assignedTasks] = await Promise.all([
      assignTaskService.getTasksByManager(managerId),
      assignTaskService.getTasksWithManager(managerId)
    ]);
    
    const allTasksMap = new Map<string, AssignTaskWithPersonal>();
    
    [...createdTasks, ...assignedTasks].forEach(task => {
      if (!task.attachments) task.attachments = [];
      if (!task.hourlyUpdates) task.hourlyUpdates = [];
      
      const derivedStatus = calculateTaskStatusFromSupervisors(task);
      
      const taskWithPersonal: AssignTaskWithPersonal = {
        ...task,
        isCreatedByMe: task.createdBy === managerId,
        isAssignedToMe: task.assignedManagers?.some(m => m.userId === managerId) || false,
        derivedStatus: derivedStatus
      };
      allTasksMap.set(task._id, taskWithPersonal);
    });
    
    return Array.from(allTasksMap.values());
  } catch (error) {
    console.error('Error fetching manager tasks:', error);
    return [];
  }
};

const ManagerDashboard = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const { user: authUser } = useRole();
  
  // Camera states
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraAction, setCameraAction] = useState<'checkin' | 'checkout' | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Photo modal for viewing
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoType, setSelectedPhotoType] = useState<'checkin' | 'checkout'>('checkin');
  
  // Current user state
  const [managerId, setManagerId] = useState<string>('');
  const [managerName, setManagerName] = useState<string>('');
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Attendance state for manager self
  const [attendance, setAttendance] = useState<AttendanceStatus>({
    isCheckedIn: false,
    isOnBreak: false,
    checkInTime: null,
    checkOutTime: null,
    checkInPhoto: null,
    checkOutPhoto: null,
    breakStartTime: null,
    breakEndTime: null,
    totalHours: 0,
    breakTime: 0,
    lastCheckInDate: null,
    hasCheckedOutToday: false
  });

  // SITE ATTENDANCE DATA
  const [sites, setSites] = useState<Site[]>([]);
  const [siteAttendanceData, setSiteAttendanceData] = useState<SiteAttendanceData[]>([]);
  const [filteredSiteData, setFilteredSiteData] = useState<SiteAttendanceData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSiteDetails, setShowSiteDetails] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteAttendanceData | null>(null);
  const itemsPerPage = 10;

  // 7-DAY ATTENDANCE PIE CHARTS
  const [attendanceData, setAttendanceData] = useState<DailyAttendanceSummary[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [totalEmployeesManagerSites, setTotalEmployeesManagerSites] = useState(0);
  
  // UI navigation for 7-day pie charts
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [sixDaysStartIndex, setSixDaysStartIndex] = useState(1);
  const [showSiteBreakdown, setShowSiteBreakdown] = useState(false);

  // Leave requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [pendingLeaveCount, setPendingLeaveCount] = useState<number>(0);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  
  // Tasks state - Using AssignTaskWithPersonal from ManagerAssignTask
  const [managerTasks, setManagerTasks] = useState<AssignTaskWithPersonal[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [updatingTaskStatus, setUpdatingTaskStatus] = useState<string | null>(null);
  const [selectedTaskForView, setSelectedTaskForView] = useState<AssignTaskWithPersonal | null>(null);
  const [showTaskViewDialog, setShowTaskViewDialog] = useState(false);
  const [hourlyUpdateText, setHourlyUpdateText] = useState('');
  const [showTaskHistoryDialog, setShowTaskHistoryDialog] = useState(false);
  
  // Task stats
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    createdByMe: 0,
    assignedToMe: 0
  });

  // Stats
  const [stats, setStats] = useState({
    presentDays: 0,
    totalSites: 0,
    pendingLeaves: 0,
    productivityScore: 0,
    totalEmployees: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalWeeklyOff: 0,
    totalLeave: 0,
    totalHalfDay: 0,
    attendanceRate: 0
  });

  // Enhanced Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 1,
      title: "Supervisors",
      description: "View and manage supervisors",
      icon: Users,
      action: () => navigate("/manager/supervisors"),
      color: "text-white",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      title: "Leave Management",
      description: "Approve/reject leave requests",
      icon: Calendar,
      action: () => navigate("/manager/leave"),
      color: "text-white",
      bgColor: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      gradient: "from-green-500 to-green-600"
    },
    {
      id: 3,
      title: "Task Management",
      description: "Manage all tasks",
      icon: ClipboardList,
      action: () => navigate("/manager/tasks"),
      color: "text-white",
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      title: "Reports",
      description: "Generate detailed reports",
      icon: FileText,
      action: () => navigate("/manager/reports"),
      color: "text-white",
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
      gradient: "from-orange-500 to-orange-600"
    }
  ];

  // Handle view photo
  const handleViewPhoto = (photoUrl: string | null | undefined, type: 'checkin' | 'checkout') => {
    if (photoUrl) {
      setSelectedPhotoUrl(photoUrl);
      setSelectedPhotoType(type);
      setPhotoModalOpen(true);
    } else {
      toast.error('No photo available');
    }
  };

  // Handle photo capture for manager check-in/check-out
  const handlePhotoCapture = async (photoFile: File) => {
    if (!cameraAction || !managerId) return;
    
    setUploadingPhoto(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('managerId', managerId);
      formData.append('managerName', managerName);
      
      const endpoint = cameraAction === 'checkin' 
        ? `${API_URL}/manager-attendance/checkin-with-photo`
        : `${API_URL}/manager-attendance/checkout-with-photo`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully ${cameraAction === 'checkin' ? 'checked in' : 'checked out'} with photo!`);
        
        if (cameraAction === 'checkin') {
          setAttendance(prev => ({
            ...prev,
            isCheckedIn: true,
            checkInTime: data.data?.checkInTime || new Date().toISOString(),
            checkInPhoto: data.data?.checkInPhoto,
            hasCheckedOutToday: false
          }));
        } else {
          setAttendance(prev => ({
            ...prev,
            isCheckedIn: false,
            checkOutTime: data.data?.checkOutTime || new Date().toISOString(),
            checkOutPhoto: data.data?.checkOutPhoto,
            totalHours: data.data?.totalHours || 0,
            hasCheckedOutToday: true
          }));
        }
        
        setCameraOpen(false);
        setCameraAction(null);
        
        await fetchAttendanceStatus();
        await loadAttendanceData();
      } else {
        toast.error(data.message || `Error ${cameraAction === 'checkin' ? 'checking in' : 'checking out'}`);
      }
    } catch (error: any) {
      console.error('Photo attendance error:', error);
      toast.error(`Failed to ${cameraAction === 'checkin' ? 'check in' : 'check out'}: ${error.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fetch all leave requests for dashboard
  const fetchAllLeaveRequests = useCallback(async () => {
    if (!managerId) return;
    
    try {
      setLoadingLeaves(true);
      console.log("🔍 Fetching all leave requests for manager dashboard...");
      
      const response = await axios.get(`${API_URL}/leaves`, {
        params: { limit: 1000 }
      });
      
      let allLeaves: LeaveRequest[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          allLeaves = response.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          allLeaves = response.data.data;
        } else if (response.data.leaves && Array.isArray(response.data.leaves)) {
          allLeaves = response.data.leaves;
        }
      }
      
      console.log(`📊 Total leaves from API: ${allLeaves.length}`);
      
      const pendingCount = allLeaves.filter(leave => leave.status === 'pending').length;
      setPendingLeaveCount(pendingCount);
      
      const sortedLeaves = [...allLeaves].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const recent = sortedLeaves.slice(0, 5);
      setRecentLeaves(recent);
      
      console.log(`📋 Pending leaves: ${pendingCount}, Recent leaves: ${recent.length}`);
      
      setLeaveRequests(allLeaves);
      
      setStats(prev => ({
        ...prev,
        pendingLeaves: pendingCount
      }));
      
    } catch (error: any) {
      console.error('❌ Error fetching leave requests:', error);
      setLeaveRequests([]);
      setPendingLeaveCount(0);
      setRecentLeaves([]);
    } finally {
      setLoadingLeaves(false);
    }
  }, [managerId]);

  // Fetch manager tasks
  const fetchManagerTasks = useCallback(async () => {
    if (!managerId) return;
    
    try {
      setLoadingTasks(true);
      console.log("🔍 Fetching manager tasks for dashboard...");
      
      const tasks = await fetchManagerTasksFromAPI(managerId);
      setManagerTasks(tasks);
      
      // Calculate task stats
      const statsCalc = {
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => (t.derivedStatus || t.status) === 'pending').length,
        inProgressTasks: tasks.filter(t => (t.derivedStatus || t.status) === 'in-progress').length,
        completedTasks: tasks.filter(t => (t.derivedStatus || t.status) === 'completed').length,
        createdByMe: tasks.filter(t => t.isCreatedByMe).length,
        assignedToMe: tasks.filter(t => t.isAssignedToMe).length
      };
      setTaskStats(statsCalc);
      
      console.log(`📊 Tasks loaded: ${tasks.length} (${statsCalc.pendingTasks} pending, ${statsCalc.inProgressTasks} in-progress, ${statsCalc.completedTasks} completed)`);
      
    } catch (error) {
      console.error('Error fetching manager tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  }, [managerId]);

  // Handle update personal task status
  const handleUpdatePersonalTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingTaskStatus(taskId);
      
      const task = managerTasks.find(t => t._id === taskId);
      if (!task) {
        toast.error('Task not found');
        return;
      }
      
      const managerIdValue = managerId;
      if (!managerIdValue) {
        toast.error('Manager ID not found');
        return;
      }

      // Find the index of the current manager in the assignedManagers array
      const managerIndex = task.assignedManagers?.findIndex(manager => 
        manager.userId === managerIdValue
      );

      if (managerIndex === -1 || managerIndex === undefined) {
        // Manager is not in assignedManagers, update overall task status
        await assignTaskService.updateTaskStatus(taskId, newStatus);
        toast.success(`Task marked as ${newStatus}`);
      } else {
        // Update the manager's personal status in the assignedManagers array
        const updatedManagers = [...(task.assignedManagers || [])];
        updatedManagers[managerIndex] = {
          ...updatedManagers[managerIndex],
          status: newStatus as any,
          updatedAt: new Date().toISOString()
        };

        const response = await fetch(`${API_URL}/assigntasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedManagers: updatedManagers }),
        });

        if (!response.ok) {
          throw new Error('Failed to update personal status');
        }

        toast.success(`Your status updated to ${newStatus}`);
      }
      
      // Refresh tasks
      await fetchManagerTasks();
      
      // Update selected task if it's being viewed
      if (selectedTaskForView && selectedTaskForView._id === taskId) {
        const updatedTask = await assignTaskService.getAssignTaskById(taskId);
        if (updatedTask) {
          const derivedStatus = calculateTaskStatusFromSupervisors(updatedTask);
          setSelectedTaskForView({
            ...updatedTask,
            isCreatedByMe: updatedTask.createdBy === managerIdValue,
            isAssignedToMe: updatedTask.assignedManagers?.some(m => m.userId === managerIdValue) || false,
            derivedStatus: derivedStatus
          });
        }
      }
      
    } catch (error: any) {
      console.error('Error updating personal status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingTaskStatus(null);
    }
  };

  // Handle add hourly update
  const handleAddHourlyUpdate = async (taskId: string) => {
    if (!hourlyUpdateText.trim()) {
      toast.error('Please enter an update');
      return;
    }

    const managerIdValue = managerId;
    const managerNameValue = managerName;

    if (!managerIdValue || !managerNameValue) {
      toast.error('User information not found');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/assigntasks/${taskId}/hourly-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: hourlyUpdateText,
          submittedBy: managerIdValue,
          submittedByName: managerNameValue
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add hourly update');
      }

      toast.success('Hourly update added');
      setHourlyUpdateText('');
      
      // Refresh the selected task if it's open
      if (selectedTaskForView && selectedTaskForView._id === taskId) {
        const updatedTask = await assignTaskService.getAssignTaskById(taskId);
        if (updatedTask) {
          const derivedStatus = calculateTaskStatusFromSupervisors(updatedTask);
          setSelectedTaskForView({
            ...updatedTask,
            isCreatedByMe: updatedTask.createdBy === managerIdValue,
            isAssignedToMe: updatedTask.assignedManagers?.some(m => m.userId === managerIdValue) || false,
            derivedStatus: derivedStatus
          });
        }
      }
      
      await fetchManagerTasks();
    } catch (error: any) {
      console.error('Error adding hourly update:', error);
      toast.error(error.message || 'Failed to add update');
    }
  };

  // Handle view task details
  const handleViewTaskDetails = async (task: AssignTaskWithPersonal) => {
    try {
      const updatedTask = await assignTaskService.getAssignTaskById(task._id);
      if (updatedTask) {
        const derivedStatus = calculateTaskStatusFromSupervisors(updatedTask);
        setSelectedTaskForView({
          ...updatedTask,
          isCreatedByMe: updatedTask.createdBy === managerId,
          isAssignedToMe: updatedTask.assignedManagers?.some(m => m.userId === managerId) || false,
          derivedStatus: derivedStatus
        });
      } else {
        setSelectedTaskForView(task);
      }
      setShowTaskViewDialog(true);
    } catch (error) {
      console.error('Error fetching task details:', error);
      setSelectedTaskForView(task);
      setShowTaskViewDialog(true);
    }
  };

  // Initialize current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (authUser) {
          const userId = authUser._id || authUser.id;
          
          if (userId) {
            const allUsersResponse = await userService.getAllUsers();
            const foundUser = allUsersResponse.allUsers.find((user: any) => 
              user._id === userId || user.id === userId
            );
            
            if (foundUser) {
              setManagerId(foundUser._id);
              setManagerName(foundUser.name || foundUser.firstName || 'Manager');
            } else {
              const storedUser = localStorage.getItem("sk_user");
              if (storedUser) {
                const user = JSON.parse(storedUser);
                setManagerId(user._id || user.id);
                setManagerName(user.name || user.firstName || 'Manager');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, [authUser]);

  // Load attendance data for 7-day pie charts
  const loadAttendanceData = async (showRefreshToast: boolean = false) => {
    if (!managerId) return;
    
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoadingAttendance(true);
      }
      setAttendanceError(null);

      const data = await fetchManagerAttendanceData(managerId, 7);
      setAttendanceData(data);
      
      if (data.length > 0) {
        setTotalEmployeesManagerSites(data[0].totalEmployees);
      }

      if (data.length > 0) {
        setCurrentDayIndex(0);
        setSixDaysStartIndex(Math.min(1, data.length - 6));
      }

      if (showRefreshToast) {
        toast.success('Attendance data refreshed successfully');
      }
    } catch (error: any) {
      console.error('Failed to load attendance data:', error);
      setAttendanceError(error.message || 'Failed to load attendance data');
      toast.error('Failed to load attendance data', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setLoadingAttendance(false);
      setRefreshing(false);
    }
  };

  // Fetch today's attendance status
  const fetchAttendanceStatus = async () => {
    if (!managerId) return;
    
    try {
      const response = await fetch(`${API_URL}/manager-attendance/today/${managerId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const attendanceData = data.data;
          setAttendance({
            isCheckedIn: attendanceData.isCheckedIn || false,
            isOnBreak: attendanceData.isOnBreak || false,
            checkInTime: attendanceData.checkInTime,
            checkOutTime: attendanceData.checkOutTime,
            checkInPhoto: attendanceData.checkInPhoto,
            checkOutPhoto: attendanceData.checkOutPhoto,
            breakStartTime: attendanceData.breakStartTime,
            breakEndTime: attendanceData.breakEndTime,
            totalHours: attendanceData.totalHours || 0,
            breakTime: attendanceData.breakTime || 0,
            lastCheckInDate: attendanceData.lastCheckInDate,
            hasCheckedOutToday: attendanceData.hasCheckedOutToday || false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    }
  };

  // Fetch site attendance data for all manager's sites
  const fetchSiteAttendanceData = async (managerSites: Site[], date: string) => {
    try {
      setRefreshing(true);
      
      const data: SiteAttendanceData[] = [];
      let totalEmployeesAllSites = 0;
      let totalPresentAllSites = 0;
      let totalAbsentAllSites = 0;
      let totalWeeklyOffAllSites = 0;
      let totalLeaveAllSites = 0;
      
      for (const site of managerSites) {
        const siteData = await calculateSiteAttendanceData(site, date);
        data.push(siteData);
        
        totalEmployeesAllSites += siteData.totalEmployees;
        totalPresentAllSites += siteData.present;
        totalAbsentAllSites += siteData.absent;
        totalWeeklyOffAllSites += siteData.weeklyOff;
        totalLeaveAllSites += siteData.leave;
      }
      
      setSiteAttendanceData(data);
      
      const attendanceRate = totalEmployeesAllSites > 0 
        ? Math.round((totalPresentAllSites / totalEmployeesAllSites) * 100) 
        : 0;
      
      setStats(prev => ({
        ...prev,
        totalSites: managerSites.length,
        totalEmployees: totalEmployeesAllSites,
        totalPresent: totalPresentAllSites,
        totalAbsent: totalAbsentAllSites,
        totalWeeklyOff: totalWeeklyOffAllSites,
        totalLeave: totalLeaveAllSites,
        totalHalfDay: 0,
        attendanceRate
      }));
      
      console.log(`Total employees across all sites: ${totalEmployeesAllSites}`);
      
    } catch (error) {
      console.error('Error calculating site attendance:', error);
      toast.error('Error calculating attendance data');
    } finally {
      setRefreshing(false);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setIsLoading(true);
    setIsStatsLoading(true);
    
    try {
      const managerSites = await fetchManagerSites(managerId);
      setSites(managerSites);
      
      await Promise.all([
        fetchAttendanceStatus(),
        fetchAllLeaveRequests(),
        fetchManagerTasks(),
        fetchSiteAttendanceData(managerSites, selectedDate),
        loadAttendanceData()
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setIsLoading(false);
      setIsStatsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (managerId) {
      loadAllData();
    }
  }, [managerId]);

  // Recalculate when date changes
  useEffect(() => {
    if (sites.length > 0) {
      fetchSiteAttendanceData(sites, selectedDate);
    }
  }, [selectedDate]);

  // Filter sites based on search
  useEffect(() => {
    if (!siteAttendanceData || siteAttendanceData.length === 0) {
      setFilteredSiteData([]);
      return;
    }
    
    const filtered = siteAttendanceData.filter(site =>
      site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredSiteData(filtered);
    setCurrentPage(1);
  }, [siteAttendanceData, searchTerm]);

  // Paginate sites
  const paginatedSites = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSiteData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSiteData, currentPage]);

  const totalPages = Math.ceil(filteredSiteData.length / itemsPerPage);

  // Get current day data for pie chart
  const currentDayData = useMemo(() => {
    if (attendanceData.length === 0) {
      return {
        date: new Date().toISOString().split('T')[0],
        day: 'Today',
        present: 0,
        absent: 0,
        weeklyOff: 0,
        leave: 0,
        halfDay: 0,
        total: 0,
        rate: '0.0%',
        index: 0,
        totalEmployees: totalEmployeesManagerSites,
        sitesWithData: 0,
        siteBreakdown: {}
      };
    }
    return attendanceData[currentDayIndex] || attendanceData[0];
  }, [attendanceData, currentDayIndex, totalEmployeesManagerSites]);

  // Get six days data
  const sixDaysData = useMemo(() => {
    if (attendanceData.length === 0) return [];
    return attendanceData.slice(sixDaysStartIndex, sixDaysStartIndex + 6);
  }, [attendanceData, sixDaysStartIndex]);

  // Current day pie data
  const currentDayPieData = [
    { name: 'Present', value: currentDayData.present, color: CHART_COLORS.present },
    { name: 'Weekly Off', value: currentDayData.weeklyOff, color: CHART_COLORS.weeklyOff },
    { name: 'Leave', value: currentDayData.leave, color: CHART_COLORS.leave },
    { name: 'Absent', value: currentDayData.absent, color: CHART_COLORS.absent }
  ].filter(item => item.value > 0);

  // Navigation handlers for pie charts
  const handlePreviousDay = () => {
    setCurrentDayIndex(prev => (prev > 0 ? prev - 1 : attendanceData.length - 1));
  };

  const handleNextDay = () => {
    setCurrentDayIndex(prev => (prev < attendanceData.length - 1 ? prev + 1 : 0));
  };

  const handleSixDaysPrevious = () => {
    setSixDaysStartIndex(prev => {
      const newIndex = prev + 6;
      const maxIndex = attendanceData.length - 6;
      return newIndex <= maxIndex ? newIndex : prev;
    });
  };

  const handleSixDaysNext = () => {
    setSixDaysStartIndex(prev => {
      const newIndex = prev - 6;
      return newIndex >= 1 ? newIndex : prev;
    });
  };

  const canGoSixDaysPrevious = sixDaysStartIndex < attendanceData.length - 6;
  const canGoSixDaysNext = sixDaysStartIndex > 1;

  const getDateRangeText = () => {
    if (sixDaysData.length === 0) return '';

    const firstDate = new Date(sixDaysData[0].date);
    const lastDate = new Date(sixDaysData[sixDaysData.length - 1].date);

    const formatDateRange = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    };

    return `${formatDateRange(firstDate)} - ${formatDateRange(lastDate)}`;
  };

  // Handle view details
  const handleViewDetails = (site: SiteAttendanceData) => {
    setSelectedSite(site);
    setShowSiteDetails(true);
  };

  // Handle back from details
  const handleBackFromDetails = () => {
    setShowSiteDetails(false);
    setSelectedSite(null);
  };

  // Handle refresh
  const handleRefresh = async () => {
    await loadAllData();
    toast.success('Dashboard data refreshed!');
  };

  // Handle check in with camera
  const handleCheckIn = async () => {
    if (attendance.isCheckedIn || attendance.hasCheckedOutToday) {
      toast.error(attendance.hasCheckedOutToday ? "Already checked out for today" : "Already checked in");
      return;
    }
    
    setCameraAction('checkin');
    setCameraOpen(true);
  };

  // Handle check out with camera
  const handleCheckOut = async () => {
    if (!attendance.isCheckedIn || attendance.hasCheckedOutToday) {
      toast.error("Cannot check out");
      return;
    }
    
    setCameraAction('checkout');
    setCameraOpen(true);
  };

  // Handle break in
  const handleBreakIn = async () => {
    if (!attendance.isCheckedIn || attendance.isOnBreak) {
      toast.error(attendance.isOnBreak ? "Already on break" : "Must be checked in");
      return;
    }

    setIsAttendanceLoading(true);
    try {
      const response = await fetch(`${API_URL}/manager-attendance/breakin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Break started!");
        setAttendance(prev => ({
          ...prev,
          isOnBreak: true,
          breakStartTime: data.data.breakStartTime
        }));
      } else {
        toast.error(data.message || "Failed to start break");
      }
    } catch (error) {
      toast.error("Failed to start break");
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  // Handle break out
  const handleBreakOut = async () => {
    if (!attendance.isOnBreak) {
      toast.error("Not on break");
      return;
    }

    setIsAttendanceLoading(true);
    try {
      const response = await fetch(`${API_URL}/manager-attendance/breakout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Break ended!");
        setAttendance(prev => ({
          ...prev,
          isOnBreak: false,
          breakEndTime: data.data.breakEndTime,
          breakTime: prev.breakTime + (data.data.breakDuration || 0)
        }));
      } else {
        toast.error(data.message || "Failed to end break");
      }
    } catch (error) {
      toast.error("Failed to end break");
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  // Handle navigation to attendance page with date
  const handleNavigateToAttendance = (date: string) => {
    navigate(`/manager/managerattendance?tab=team-attendance&date=${date}`);
  };

  // Custom tooltips
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-3 border rounded-lg shadow-lg"
        >
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-sm" style={{ color: data.payload.fill }}>
            {data.value} employees ({((data.value / currentDayData.totalEmployees) * 100).toFixed(1)}%)
          </p>
        </motion.div>
      );
    }
    return null;
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Excellent: "bg-green-100 text-green-800 border-green-200",
      Good: "bg-blue-100 text-blue-800 border-blue-200",
      Average: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Poor: "bg-red-100 text-red-800 border-red-200"
    };
    return styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Get leave status badge
  const getLeaveStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'rejected':
        return "bg-red-100 text-red-800 border-red-200";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'cancelled':
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get leave type badge
  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'annual':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'sick':
        return "bg-red-100 text-red-800 border-red-200";
      case 'casual':
        return "bg-green-100 text-green-800 border-green-200";
      case 'maternity':
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 'paternity':
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case 'bereavement':
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get task priority color
  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-100 text-red-800 border-red-200";
      case 'medium':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'low':
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get task status badge
  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-green-100 text-green-800 border-green-200";
      case 'in-progress':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'cancelled':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Format task date
  const formatTaskDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatTaskDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  // Get manager status badge for task
  const getManagerStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // If showing site details
  if (showSiteDetails && selectedSite) {
    return (
      <SiteEmployeeDetails
        siteData={selectedSite}
        onBack={handleBackFromDetails}
        selectedDate={selectedDate}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <DashboardHeader 
        title="Manager Dashboard" 
        subtitle={`Welcome back, ${managerName}! Here's your site attendance overview`}
        onMenuClick={onMenuClick}
      />

      <div className="p-6 space-y-6">
        {/* Attendance Controls with Camera */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-600" />
                Your Attendance Control
                {isAttendanceLoading && (
                  <Badge variant="outline" className="ml-2">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Processing...
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Take a photo to verify your check-in and check-out times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Work Status</span>
                    <Badge className={attendance.isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {attendance.isCheckedIn ? 'Checked In' : 'Checked Out'}
                    </Badge>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCheckIn}
                      disabled={attendance.isCheckedIn || attendance.hasCheckedOutToday || isAttendanceLoading}
                      className="flex-1 h-12 flex items-center gap-2"
                    >
                      {isAttendanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {isAttendanceLoading ? "Processing..." : "Check In with Photo"}
                    </Button>
                    <Button
                      onClick={handleCheckOut}
                      disabled={!attendance.isCheckedIn || attendance.hasCheckedOutToday || isAttendanceLoading}
                      className="flex-1 h-12 flex items-center gap-2"
                    >
                      {isAttendanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {isAttendanceLoading ? "Processing..." : "Check Out with Photo"}
                    </Button>
                  </div>
                  {attendance.checkInTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Checked in: {formatTimeForDisplay(attendance.checkInTime)}</span>
                      {attendance.checkInPhoto && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPhoto(attendance.checkInPhoto, 'checkin')}
                          className="h-6 px-2 text-xs"
                        >
                          <Camera className="h-3 w-3 mr-1" />
                          View Photo
                        </Button>
                      )}
                    </div>
                  )}
                  {attendance.checkOutTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Checked out: {formatTimeForDisplay(attendance.checkOutTime)}</span>
                      {attendance.checkOutPhoto && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPhoto(attendance.checkOutPhoto, 'checkout')}
                          className="h-6 px-2 text-xs"
                        >
                          <Camera className="h-3 w-3 mr-1" />
                          View Photo
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Break Status</span>
                    <Badge className={attendance.isOnBreak ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>
                      {attendance.isOnBreak ? 'On Break' : 'Active'}
                    </Badge>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleBreakIn}
                      disabled={!attendance.isCheckedIn || attendance.isOnBreak || isAttendanceLoading}
                      className="flex-1 h-12 flex items-center gap-2"
                    >
                      {isAttendanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coffee className="h-4 w-4" />}
                      Break In
                    </Button>
                    <Button
                      onClick={handleBreakOut}
                      disabled={!attendance.isOnBreak || isAttendanceLoading}
                      className="flex-1 h-12 flex items-center gap-2"
                    >
                      {isAttendanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
                      Break Out
                    </Button>
                  </div>
                  {attendance.breakStartTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Break started: {formatTimeForDisplay(attendance.breakStartTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Hours:</span>
                    <p className="font-medium">{attendance.totalHours.toFixed(2)}h</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Break Time:</span>
                    <p className="font-medium">{attendance.breakTime.toFixed(2)}h</p>
                  </div>
                </div>
                {attendance.hasCheckedOutToday && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Already checked out for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 7 Days Attendance Rate Pie Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-blue-100/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="px-4 sm:px-6 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                    <PieChartIcon className="h-5 w-5" />
                    7 Days Attendance - Your Assigned Sites
                  </CardTitle>
                  <p className="text-sm text-blue-600/80 mt-1">
                    Daily attendance overview for {totalEmployeesManagerSites} employees across {sites.length} sites
                    {!loadingAttendance && attendanceData.length > 0 && (
                      <span className="ml-2 text-green-600">
                        • {currentDayData.sitesWithData > 0 ? 'Real Data' : 'Demo Data'}
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className="bg-white/80 border-blue-200">
                  <Eye className="h-3 w-3 mr-1" />
                  All Sites Combined
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {loadingAttendance ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-muted-foreground">Loading attendance data across all sites...</span>
                </div>
              ) : attendanceData.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
                  <p className="text-gray-500 mb-4">No attendance records found for the last 7 days.</p>
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  {/* 6 Days Small Pie Charts */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Historical Overview - All Sites Combined
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getDateRangeText()} | Total Employees: {totalEmployeesManagerSites}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSixDaysPrevious}
                          disabled={!canGoSixDaysPrevious}
                          className="h-8 w-8 p-0 hover:scale-105 transition-transform"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSixDaysNext}
                          disabled={!canGoSixDaysNext}
                          className="h-8 w-8 p-0 hover:scale-105 transition-transform"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {sixDaysData.map((dayData, index) => {
                        const pieData = [
                          { name: 'Present', value: dayData.present, color: CHART_COLORS.present },
                          { name: 'Weekly Off', value: dayData.weeklyOff, color: CHART_COLORS.weeklyOff },
                          { name: 'Leave', value: dayData.leave, color: CHART_COLORS.leave },
                          { name: 'Absent', value: dayData.absent, color: CHART_COLORS.absent }
                        ].filter(item => item.value > 0);

                        return (
                          <motion.div
                            key={`${dayData.date}-${index}`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card
                              className="cursor-pointer transform transition-all duration-200 hover:shadow-lg border-2 hover:border-blue-300"
                              onClick={() => handleNavigateToAttendance(dayData.date)}
                            >
                              <CardContent className="p-3">
                                <div className="text-center mb-2">
                                  <p className="text-xs font-medium text-gray-700">{dayData.day}</p>
                                  <p className="text-xs text-muted-foreground">{dayData.date}</p>
                                  <Badge variant={
                                    parseFloat(dayData.rate) > 90 ? 'default' :
                                      parseFloat(dayData.rate) > 80 ? 'secondary' : 'destructive'
                                  } className="mt-1 text-xs">
                                    {dayData.rate}
                                  </Badge>
                                </div>
                                <div className="h-32">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                      <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={40}
                                        fill="#8884d8"
                                        dataKey="value"
                                        labelLine={false}
                                      >
                                        {pieData.map((entry, cellIndex) => (
                                          <Cell key={`cell-${cellIndex}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip />
                                    </RechartsPieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="text-center mt-2">
                                  <div className="flex justify-center items-center gap-2 text-xs flex-wrap">
                                    {dayData.present > 0 && (
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                        <span>{dayData.present}</span>
                                      </div>
                                    )}
                                    {dayData.weeklyOff > 0 && (
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                                        <span>{dayData.weeklyOff}</span>
                                      </div>
                                    )}
                                    {dayData.leave > 0 && (
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                                        <span>{dayData.leave}</span>
                                      </div>
                                    )}
                                    {dayData.absent > 0 && (
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                                        <span>{dayData.absent}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Total: {dayData.totalEmployees}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Main Today's Pie Chart */}
                  <div className="border-t pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          Today's Overview - All Sites Combined
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Total Employees: {currentDayData.totalEmployees} | 
                          Attendance Rate: {currentDayData.rate} | 
                          Sites with Data: {currentDayData.sitesWithData}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs flex-wrap">
                          <span className="flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                            Present: {currentDayData.present}
                          </span>
                          <span className="flex items-center">
                            <span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span>
                            Weekly Off: {currentDayData.weeklyOff}
                          </span>
                          <span className="flex items-center">
                            <span className="w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
                            Leave: {currentDayData.leave}
                          </span>
                          <span className="flex items-center">
                            <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                            Absent: {currentDayData.absent}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousDay}
                          className="h-8 w-8 p-0 hover:scale-105 transition-transform"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground mx-2 min-w-[60px] text-center">
                          Day {currentDayIndex + 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextDay}
                          className="h-8 w-8 p-0 hover:scale-105 transition-transform"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="cursor-pointer"
                        onClick={() => handleNavigateToAttendance(currentDayData.date)}
                      >
                        <div className="w-full h-80 bg-gradient-to-br from-blue-50/50 to-green-50/50 rounded-xl p-4 border-2 border-blue-200/50 hover:border-blue-400 transition-colors duration-300 backdrop-blur-sm">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={currentDayPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {currentDayPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomPieTooltip />} />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>

                      {/* Detailed Breakdown Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Detailed Attendance Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <span className="font-medium">Present</span>
                              <div className="text-right">
                                <span className="font-bold text-green-600 text-lg">{currentDayData.present}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({((currentDayData.present / totalEmployeesManagerSites) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                              <span className="font-medium">Weekly Off</span>
                              <div className="text-right">
                                <span className="font-bold text-purple-600 text-lg">{currentDayData.weeklyOff}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({((currentDayData.weeklyOff / totalEmployeesManagerSites) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                              <span className="font-medium">On Leave</span>
                              <div className="text-right">
                                <span className="font-bold text-orange-600 text-lg">{currentDayData.leave}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({((currentDayData.leave / totalEmployeesManagerSites) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                              <span className="font-medium">Absent</span>
                              <div className="text-right">
                                <span className="font-bold text-red-600 text-lg">{currentDayData.absent}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({((currentDayData.absent / totalEmployeesManagerSites) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg mt-4 border-t pt-4">
                              <span className="font-medium text-blue-800">Total Employees</span>
                              <span className="font-bold text-blue-600 text-xl">{totalEmployeesManagerSites}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center mt-4"
                    >
                      <p className="text-sm text-muted-foreground">
                        Click on the pie chart to view detailed site-wise attendance for {currentDayData.date}
                      </p>
                    </motion.div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Site Attendance Overview Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-2 border-blue-100/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                    <Building className="h-5 w-5" />
                    Site-wise Attendance Overview
                  </CardTitle>
                  <CardDescription className="text-sm text-blue-600/80 mt-1">
                    Total employees across all your assigned sites: {stats.totalEmployees}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-white/80 border-blue-200">
                  {sites.length} {sites.length === 1 ? 'Site' : 'Sites'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(formatDate(new Date()))}>
                    Today
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sites..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Export feature coming soon')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Sites Table */}
              {refreshing ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading attendance data...</span>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left font-medium">Site Name</th>
                          <th className="h-12 px-4 text-left font-medium">Client</th>
                          <th className="h-12 px-4 text-left font-medium">Location</th>
                          <th className="h-12 px-4 text-left font-medium">Total</th>
                          <th className="h-12 px-4 text-left font-medium text-green-700 bg-green-50">Present</th>
                          <th className="h-12 px-4 text-left font-medium text-purple-700 bg-purple-50">Weekly Off</th>
                          <th className="h-12 px-4 text-left font-medium text-blue-700 bg-blue-50">Leave</th>
                          <th className="h-12 px-4 text-left font-medium text-red-700 bg-red-50">Absent</th>
                          <th className="h-12 px-4 text-left font-medium text-red-700 bg-red-50">Shortage</th>
                          <th className="h-12 px-4 text-left font-medium">Rate</th>
                          <th className="h-12 px-4 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSites.length > 0 ? (
                          paginatedSites.map((site) => {
                            const status = site.attendanceRate >= 90 ? 'Excellent' :
                                          site.attendanceRate >= 80 ? 'Good' :
                                          site.attendanceRate >= 70 ? 'Average' : 'Poor';
                            
                            return (
                              <tr key={site.id} className="border-b hover:bg-muted/50">
                                <td className="p-4 align-middle font-medium">
                                  <div className="font-medium">{site.name}</div>
                                  {site.isRealData && (
                                    <Badge variant="outline" className="mt-1 text-xs bg-green-50">
                                      Real Data
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-4 align-middle">{site.clientName || '-'}</td>
                                <td className="p-4 align-middle">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    {site.location || '-'}
                                  </div>
                                </td>
                                <td className="p-4 align-middle font-bold">{site.totalEmployees}</td>
                                <td className="p-4 align-middle font-bold text-green-700 bg-green-50">{site.present}</td>
                                <td className="p-4 align-middle font-bold text-purple-700 bg-purple-50">{site.weeklyOff}</td>
                                <td className="p-4 align-middle font-bold text-blue-700 bg-blue-50">{site.leave}</td>
                                <td className="p-4 align-middle font-bold text-red-700 bg-red-50">{site.absent}</td>
                                <td className="p-4 align-middle font-bold text-red-700 bg-red-50">{site.shortage}</td>
                                <td className="p-4 align-middle font-bold">{site.attendanceRate}%</td>
                                <td className="p-4 align-middle">
                                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(site)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={11} className="p-8 text-center text-muted-foreground">
                              {filteredSiteData.length === 0 ? (
                                <div className="text-center py-8">
                                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Sites Found</h3>
                                  <p className="text-gray-500">
                                    {searchTerm
                                      ? 'No sites match your search criteria.'
                                      : 'No sites are currently assigned to you.'}
                                  </p>
                                </div>
                              ) : (
                                'No data available'
                              )}
                            </td>
                           </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredSiteData.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSiteData.length)} of {filteredSiteData.length} sites
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                          First
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                          Next
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Leave Requests Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="border-2 border-blue-100/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-t-lg border-b">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Recent Leave Requests
                    {pendingLeaveCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {pendingLeaveCount} Pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm text-blue-600/80 mt-1">
                    Leave requests from employees and supervisors across your assigned sites
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/manager/leave")}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Manage All Leaves
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingLeaves ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : recentLeaves.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No leave requests found</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => navigate("/manager/leave")}
                    className="mt-2"
                  >
                    View all leaves →
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLeaves.map((leave, index) => {
                    const isManagerLeave = leave.isManagerLeave === true;
                    const isSupervisorLeave = leave.isSupervisorLeave === true;
                    
                    return (
                      <motion.div
                        key={leave._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          isManagerLeave ? 'bg-purple-50/50 border-purple-200' : 
                          isSupervisorLeave ? 'bg-amber-50/50 border-amber-200' : ''
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  {isManagerLeave ? (
                                    <Crown className="h-4 w-4 text-purple-600" />
                                  ) : isSupervisorLeave ? (
                                    <Shield className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <User className="h-4 w-4 text-gray-600" />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {leave.employeeName}
                                  </h3>
                                  <p className="text-xs text-gray-500">{leave.employeeId}</p>
                                </div>
                              </div>
                              {isManagerLeave && (
                                <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-300">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Manager
                                </Badge>
                              )}
                              {isSupervisorLeave && !isManagerLeave && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Supervisor
                                </Badge>
                              )}
                              <Badge className={getLeaveStatusBadge(leave.status)}>
                                {leave.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {leave.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {leave.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {leave.department}
                              </div>
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {leave.site || 'Main Site'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatShortDate(leave.fromDate)} - {formatShortDate(leave.toDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {leave.totalDays} day(s)
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {leave.reason}
                            </p>
                            {leave.remarks && (
                              <p className="text-xs text-blue-600 mt-1">
                                Remarks: {leave.remarks}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate("/manager/leave")}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {leave.status === 'pending' && !isManagerLeave && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`${API_URL}/leaves/${leave._id}/status`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ 
                                          status: 'approved',
                                          managerId,
                                          managerName,
                                          remarks: "Approved by manager"
                                        })
                                      });
                                      const data = await response.json();
                                      if (data.success) {
                                        toast.success(`Leave approved for ${leave.employeeName}`);
                                        await loadAllData();
                                      } else {
                                        toast.error(data.message || 'Failed to approve leave');
                                      }
                                    } catch (error) {
                                      console.error('Error approving leave:', error);
                                      toast.error('Failed to approve leave');
                                    }
                                  }}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`${API_URL}/leaves/${leave._id}/status`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ 
                                          status: 'rejected',
                                          managerId,
                                          managerName,
                                          remarks: "Rejected by manager"
                                        })
                                      });
                                      const data = await response.json();
                                      if (data.success) {
                                        toast.success(`Leave rejected for ${leave.employeeName}`);
                                        await loadAllData();
                                      } else {
                                        toast.error(data.message || 'Failed to reject leave');
                                      }
                                    } catch (error) {
                                      console.error('Error rejecting leave:', error);
                                      toast.error('Failed to reject leave');
                                    }
                                  }}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t text-xs text-gray-400 flex justify-between">
                          <span>Applied by: {leave.appliedBy}</span>
                          <span>{formatDateTimeDisplay(leave.createdAt)}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                  {recentLeaves.length >= 5 && (
                    <div className="text-center pt-2">
                      <Button 
                        variant="link" 
                        onClick={() => navigate("/manager/leave")}
                      >
                        View all {leaveRequests.length} leave requests →
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Your Tasks Section - Similar to ManagerAssignTask */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-2 border-blue-100/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-t-lg border-b">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                    Your Tasks
                    {taskStats.pendingTasks > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {taskStats.pendingTasks} Pending
                      </Badge>
                    )}
                    {taskStats.inProgressTasks > 0 && (
                      <Badge variant="default" className="ml-2 bg-blue-500">
                        {taskStats.inProgressTasks} In Progress
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm text-blue-600/80 mt-1">
                    {taskStats.totalTasks} tasks total • {taskStats.createdByMe} created by you • {taskStats.assignedToMe} assigned to you
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/manager/assigntask")}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Manage All Tasks
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingTasks ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : managerTasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No tasks assigned to you</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => navigate("/manager/tasks")}
                    className="mt-2"
                  >
                    Create or view tasks →
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {managerTasks.slice(0, 5).map((task, index) => {
                    const displayStatus = task.derivedStatus || task.status;
                    const myManagerInfo = task.isAssignedToMe 
                      ? task.assignedManagers?.find(m => m.userId === managerId)
                      : null;
                    
                    return (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewTaskDetails(task)}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">
                                {task.taskTitle}
                              </h3>
                              <Badge className={getTaskPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge className={getTaskStatusBadge(displayStatus)}>
                                {displayStatus === 'in-progress' ? 'In Progress' : displayStatus}
                              </Badge>
                              {task.isCreatedByMe && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Created by me
                                </Badge>
                              )}
                              {task.isAssignedToMe && !task.isCreatedByMe && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Assigned to me
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {task.description}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {task.siteName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {formatTaskDateTime(task.dueDateTime)}
                              </div>
                              {task.hourlyUpdates && task.hourlyUpdates.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {task.hourlyUpdates.length} update(s)
                                </div>
                              )}
                              {task.attachments && task.attachments.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  {task.attachments.length} file(s)
                                </div>
                              )}
                            </div>
                            {/* Supervisor Progress Summary */}
                            {task.assignedSupervisors && task.assignedSupervisors.length > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Users className="h-3 w-3" />
                                  <span>Supervisor Progress:</span>
                                  <div className="flex gap-1">
                                    {task.assignedSupervisors.filter(s => s.status === 'in-progress').length > 0 && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                        {task.assignedSupervisors.filter(s => s.status === 'in-progress').length} IP
                                      </Badge>
                                    )}
                                    {task.assignedSupervisors.filter(s => s.status === 'completed').length > 0 && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        {task.assignedSupervisors.filter(s => s.status === 'completed').length} Done
                                      </Badge>
                                    )}
                                    {task.assignedSupervisors.filter(s => s.status === 'pending').length > 0 && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                                        {task.assignedSupervisors.filter(s => s.status === 'pending').length} Pending
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            {myManagerInfo && myManagerInfo.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdatePersonalTaskStatus(task._id, 'in-progress');
                                }}
                                disabled={updatingTaskStatus === task._id}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {updatingTaskStatus === task._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                Start
                              </Button>
                            )}
                            {myManagerInfo && myManagerInfo.status === 'in-progress' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdatePersonalTaskStatus(task._id, 'completed');
                                }}
                                disabled={updatingTaskStatus === task._id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {updatingTaskStatus === task._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTaskDetails(task);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                        {myManagerInfo && myManagerInfo.status === 'in-progress' && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Your Progress</span>
                              <span className="text-gray-700 font-medium">In Progress</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: '50%' }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  {managerTasks.length > 5 && (
                    <div className="text-center pt-2">
                      <Button 
                        variant="link" 
                        onClick={() => navigate("/manager/tasks")}
                      >
                        View all {managerTasks.length} tasks →
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Sections - Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Access frequently used features with one click
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className={`w-full h-28 flex flex-col items-center justify-center gap-3 ${action.bgColor} ${action.hoverColor} border-0 transition-all duration-300 shadow-md hover:shadow-lg`}
                        onClick={action.action}
                      >
                        <div className={`p-3 rounded-full bg-white/20 backdrop-blur-sm`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-sm text-white">{action.title}</div>
                          <div className="text-xs text-white/80 mt-1">{action.description}</div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Task View Dialog */}
      <Dialog open={showTaskViewDialog} onOpenChange={setShowTaskViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Task Details
            </DialogTitle>
            <DialogDescription>
              View task details and recent activity
            </DialogDescription>
          </DialogHeader>

          {selectedTaskForView && (
            <div className="space-y-6">
              {/* Status and Priority Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getTaskPriorityColor(selectedTaskForView.priority)}>
                  {selectedTaskForView.priority} Priority
                </Badge>
                <Badge className={getTaskStatusBadge(selectedTaskForView.derivedStatus || selectedTaskForView.status)}>
                  {selectedTaskForView.derivedStatus === 'in-progress' ? 'In Progress' : (selectedTaskForView.derivedStatus || selectedTaskForView.status)}
                </Badge>
                <Badge variant="outline">{selectedTaskForView.taskType}</Badge>
                {selectedTaskForView.isCreatedByMe && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Created by me
                  </Badge>
                )}
                {selectedTaskForView.isAssignedToMe && !selectedTaskForView.isCreatedByMe && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Assigned to me
                  </Badge>
                )}
              </div>

              {/* Task Information */}
              <div>
                <h3 className="font-semibold text-lg">{selectedTaskForView.taskTitle}</h3>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedTaskForView.description}
                </p>
              </div>

              {/* Site Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Site Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Site Name</p>
                      <p className="font-medium">{selectedTaskForView.siteName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="font-medium">{selectedTaskForView.clientName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedTaskForView.siteLocation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-medium">{formatTaskDate(selectedTaskForView.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="font-medium">{formatTaskDate(selectedTaskForView.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date & Time</p>
                      <p className="font-medium">{formatTaskDateTime(selectedTaskForView.dueDateTime)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supervisor Progress Summary */}
              {selectedTaskForView.assignedSupervisors && selectedTaskForView.assignedSupervisors.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Supervisor Progress ({selectedTaskForView.assignedSupervisors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {(() => {
                          const counts = {
                            pending: selectedTaskForView.assignedSupervisors!.filter(s => s.status === 'pending').length,
                            inProgress: selectedTaskForView.assignedSupervisors!.filter(s => s.status === 'in-progress').length,
                            completed: selectedTaskForView.assignedSupervisors!.filter(s => s.status === 'completed').length,
                            cancelled: selectedTaskForView.assignedSupervisors!.filter(s => s.status === 'cancelled').length
                          };
                          
                          return (
                            <>
                              {counts.inProgress > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs w-20">In Progress:</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full" 
                                      style={{ width: `${(counts.inProgress / selectedTaskForView.assignedSupervisors!.length) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{counts.inProgress}</span>
                                </div>
                              )}
                              {counts.completed > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs w-20">Completed:</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 rounded-full" 
                                      style={{ width: `${(counts.completed / selectedTaskForView.assignedSupervisors!.length) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{counts.completed}</span>
                                </div>
                              )}
                              {counts.pending > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs w-20">Pending:</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-yellow-500 rounded-full" 
                                      style={{ width: `${(counts.pending / selectedTaskForView.assignedSupervisors!.length) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{counts.pending}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-medium mb-2">Supervisor Status:</p>
                        {selectedTaskForView.assignedSupervisors.map((supervisor, idx) => {
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded bg-emerald-50/50">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-emerald-600" />
                                <div>
                                  <p className="font-medium">{supervisor.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Assigned: {formatTaskDateTime(supervisor.assignedAt)}
                                  </p>
                                </div>
                              </div>
                              {supervisor.status === 'completed' && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  Completed
                                </Badge>
                              )}
                              {supervisor.status === 'in-progress' && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  In Progress
                                </Badge>
                              )}
                              {supervisor.status === 'pending' && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  Pending
                                </Badge>
                              )}
                              {supervisor.status === 'cancelled' && (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  Cancelled
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity Section */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTaskHistoryDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    View Full History
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Recent Updates */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Recent Updates
                          <Badge variant="outline" className="ml-2">
                            {selectedTaskForView.hourlyUpdates?.length || 0} total
                          </Badge>
                        </p>
                      </div>
                      <div className="space-y-2">
                        {selectedTaskForView.hourlyUpdates && selectedTaskForView.hourlyUpdates.length > 0 ? (
                          [...selectedTaskForView.hourlyUpdates]
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .slice(0, 3)
                            .map((update, index) => (
                              <div key={update.id || index} className="border rounded-lg p-3">
                                <p className="text-sm">{update.content}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-muted-foreground">
                                    {formatTaskDateTime(update.timestamp)} - {update.submittedByName}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {update.submittedBy === managerId ? 'Manager' : 'Supervisor'}
                                  </Badge>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No updates yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Recent Attachments */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Recent Attachments
                          <Badge variant="outline" className="ml-2">
                            {selectedTaskForView.attachments?.length || 0} total
                          </Badge>
                        </p>
                      </div>
                      <div className="space-y-2">
                        {selectedTaskForView.attachments && selectedTaskForView.attachments.length > 0 ? (
                          [...selectedTaskForView.attachments]
                            .sort((a, b) => {
                              const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
                              const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
                              return dateB - dateA;
                            })
                            .slice(0, 3)
                            .map((attachment, index) => (
                              <div key={attachment.id || index} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1">
                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{attachment.filename}</p>
                                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span>Uploaded by: {attachment.uploadedBy || attachment.uploadedByName || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{attachment.size ? `${(attachment.size / 1024).toFixed(2)} KB` : 'Unknown size'}</span>
                                        <span>•</span>
                                        <span>{attachment.uploadedAt ? formatTaskDateTime(attachment.uploadedAt) : 'Date unknown'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(attachment.url, '_blank')}
                                      title="View"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        fetch(attachment.url)
                                          .then(res => res.blob())
                                          .then(blob => {
                                            const downloadUrl = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = downloadUrl;
                                            link.download = attachment.filename;
                                            link.click();
                                            window.URL.revokeObjectURL(downloadUrl);
                                          })
                                          .catch(err => console.error('Download failed:', err));
                                      }}
                                      title="Download"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No attachments yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Update Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Add Update
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add a new update..."
                    value={hourlyUpdateText}
                    onChange={(e) => setHourlyUpdateText(e.target.value)}
                    rows={2}
                    className="mb-2"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => {
                      handleAddHourlyUpdate(selectedTaskForView._id);
                      setHourlyUpdateText('');
                    }}
                    className="w-full"
                  >
                    Add Update
                  </Button>
                </CardContent>
              </Card>

              {/* Status Update Buttons for current manager */}
              {selectedTaskForView.isAssignedToMe && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Update Your Status</h4>
                  <div className="flex gap-2">
                    {(() => {
                      const myManagerInfo = selectedTaskForView.assignedManagers?.find(
                        m => m.userId === managerId
                      );
                      
                      if (!myManagerInfo) return null;
                      
                      return (
                        <>
                          {myManagerInfo.status === 'pending' && (
                            <Button
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleUpdatePersonalTaskStatus(selectedTaskForView._id, 'in-progress')}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Start Task
                            </Button>
                          )}
                          
                          {myManagerInfo.status === 'in-progress' && (
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleUpdatePersonalTaskStatus(selectedTaskForView._id, 'completed')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </Button>
                          )}
                          
                          {myManagerInfo.status !== 'completed' && myManagerInfo.status !== 'cancelled' && (
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleUpdatePersonalTaskStatus(selectedTaskForView._id, 'cancelled')}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          )}
                        </>
                      );
                    })()}
                    
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowTaskViewDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}

              {/* If manager is not assigned but created the task */}
              {selectedTaskForView.isCreatedByMe && !selectedTaskForView.isAssignedToMe && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Task Actions</h4>
                  <div className="flex gap-2">
                    {(selectedTaskForView.derivedStatus || selectedTaskForView.status) === 'pending' && (
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleUpdatePersonalTaskStatus(selectedTaskForView._id, 'in-progress')}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Start Progress
                      </Button>
                    )}
                    
                    {(selectedTaskForView.derivedStatus || selectedTaskForView.status) === 'in-progress' && (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdatePersonalTaskStatus(selectedTaskForView._id, 'completed')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                    )}
                    
                    {(selectedTaskForView.derivedStatus || selectedTaskForView.status) !== 'completed' && (selectedTaskForView.derivedStatus || selectedTaskForView.status) !== 'cancelled' && (
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleUpdatePersonalTaskStatus(selectedTaskForView._id, 'cancelled')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Task
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowTaskViewDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task History Dialog */}
      <Dialog open={showTaskHistoryDialog} onOpenChange={setShowTaskHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <History className="h-5 w-5" />
              Task History - {selectedTaskForView?.taskTitle}
            </DialogTitle>
            <DialogDescription>
              View all hourly updates and attachments
            </DialogDescription>
          </DialogHeader>

          {selectedTaskForView && (
            <Tabs defaultValue="updates" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="updates" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Hourly Updates
                  <Badge variant="secondary" className="ml-2">
                    {selectedTaskForView.hourlyUpdates?.length || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="attachments" className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                  <Badge variant="secondary" className="ml-2">
                    {selectedTaskForView.attachments?.length || 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="updates" className="space-y-4 mt-4">
                {!selectedTaskForView.hourlyUpdates || selectedTaskForView.hourlyUpdates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hourly updates yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...selectedTaskForView.hourlyUpdates]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((update, index) => (
                        <div key={update.id || index} className="border rounded-lg p-4">
                          <p className="text-sm">{update.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formatTaskDateTime(update.timestamp)} - {update.submittedByName}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {update.submittedBy === managerId ? 'Manager' : 'Supervisor'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4 mt-4">
                {!selectedTaskForView.attachments || selectedTaskForView.attachments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No attachments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...selectedTaskForView.attachments]
                      .sort((a, b) => {
                        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
                        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
                        return dateB - dateA;
                      })
                      .map((attachment, index) => (
                        <div key={attachment.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Paperclip className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{attachment.filename}</div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span>Uploaded by: {attachment.uploadedBy || attachment.uploadedByName || 'Unknown'}</span>
                                  <span>•</span>
                                  <span>{attachment.size ? `${(attachment.size / 1024).toFixed(2)} KB` : 'Unknown size'}</span>
                                  <span>•</span>
                                  <span>{attachment.uploadedAt ? formatTaskDateTime(attachment.uploadedAt) : 'Date unknown'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachment.url, '_blank')}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  fetch(attachment.url)
                                    .then(res => res.blob())
                                    .then(blob => {
                                      const downloadUrl = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = downloadUrl;
                                      link.download = attachment.filename;
                                      link.click();
                                      window.URL.revokeObjectURL(downloadUrl);
                                    })
                                    .catch(err => console.error('Download failed:', err));
                                }}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo View Modal */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPhotoType === 'checkin' ? 'Check-in Photo' : 'Check-out Photo'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedPhotoUrl && (
              <img
                src={selectedPhotoUrl}
                alt={`${selectedPhotoType} photo`}
                className="max-w-full h-auto rounded-lg shadow-lg"
                onError={(e) => {
                  console.error('Failed to load image:', selectedPhotoUrl);
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="https://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M8 2v20M16 2v20M2 8h20M2 16h20"%3E%3C/path%3E%3C/svg%3E';
                  toast.error('Failed to load photo');
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoModalOpen(false)}>Close</Button>
            {selectedPhotoUrl && (
              <Button onClick={() => window.open(selectedPhotoUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" /> Open Original
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Capture Dialog */}
      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handlePhotoCapture}
        title={cameraAction === 'checkin' ? "Take Check-in Photo" : "Take Check-out Photo"}
        description={cameraAction === 'checkin' 
          ? "Take a photo to verify your check-in time. This photo will be stored securely." 
          : "Take a photo to verify your check-out time. This photo will be stored securely."}
        actionLabel={cameraAction === 'checkin' ? "Use for Check-in" : "Use for Check-out"}
      />
    </div>
  );
};

export default ManagerDashboard;