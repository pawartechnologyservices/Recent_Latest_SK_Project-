import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useRole } from "@/context/RoleContext";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Users, 
  UserPlus, 
  UserMinus,
  Loader2, 
  AlertCircle, 
  Building,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  User,
  Upload,
  DownloadCloud,
  Target,
  MoreVertical,
  Shield,
  History,
  Camera,
  Files,
  Save,
  Database,
  Cloud,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import * as XLSX from 'xlsx';
import { format, differenceInDays } from 'date-fns';

// Import DocumentUpload component
import DocumentUpload from '../superadmin/DocumentUpload';
// Import ExcelImportDialog component
import ExcelImportDialog from '../superadmin/ExcelImportDialog';
// Import SupervisorOnboardingTab component
import SupervisorOnboardingTab from "./SupervisorOnboardingTab";

// API URL
const API_URL = process.env.NODE_ENV === 'development' 
  ? `http://${window.location.hostname}:5001/api` 
  : '/api';

// Types
interface Employee {
  _id: string;
  id?: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  aadharNumber: string;
  panNumber?: string;
  esicNumber?: string;
  uanNumber?: string;
  dateOfBirth?: string;
  dateOfJoining: string;
  joinDate?: string;
  dateOfExit?: string;
  bloodGroup?: string;
  gender?: string;
  maritalStatus?: string;
  permanentAddress?: string;
  permanentPincode?: string;
  localAddress?: string;
  localPincode?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  bankBranch?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  numberOfChildren?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  department: string;
  position: string;
  siteName?: string;
  salary: number;
  status: "active" | "inactive" | "left";
  role?: string;
  pantSize?: string;
  shirtSize?: string;
  capSize?: string;
  idCardIssued?: boolean;
  westcoatIssued?: boolean;
  apronIssued?: boolean;
  photo?: string;
  photoPublicId?: string;
  employeeSignature?: string;
  employeeSignaturePublicId?: string;
  authorizedSignature?: string;
  authorizedSignaturePublicId?: string;
  createdAt?: string;
  updatedAt?: string;
  documents?: any[];
  kycDocuments?: any[];
  siteHistory?: SiteAssignmentHistory[];
  isManager?: boolean;
  isSupervisor?: boolean;
}

interface SiteAssignmentHistory {
  siteName: string;
  assignedDate: string;
  leftDate?: string;
  daysWorked?: number;
}

interface ExtendedEmployee extends Employee {
  siteHistory?: SiteAssignmentHistory[];
}

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  deadline: string;
  dueDateTime?: string;
  siteId: string;
  siteName: string;
  clientName?: string;
  assignedUsers?: Array<{
    userId: string;
    name: string;
    role: string;
    assignedAt: string;
    status: string;
  }>;
  assignedTo?: string;
  assignedToName?: string;
}

interface Site {
  _id: string;
  name: string;
  clientName?: string;
  location?: string;
  status?: string;
  managerCount?: number;
  supervisorCount?: number;
  staffDeployment?: Array<{ role: string; count: number }>;
  currentManagerCount?: number;
  currentSupervisorCount?: number;
  currentStaffCount?: number;
  totalStaff?: number;
}

interface SalaryStructure {
  id: number;
  employeeId: string;
  basic: number;
  hra: number;
  da: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  otherAllowances: number;
  pf: number;
  esic: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  workingDays: number;
  paidDays: number;
  lopDays: number;
}

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  site?: string | string[];
  department?: string;
  phone?: string;
  isActive?: boolean;
}

interface EPFForm11Data {
  memberName: string;
  fatherOrSpouseName: string;
  relationshipType: "father" | "spouse";
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  email: string;
  mobileNumber: string;
  previousEPFMember: boolean;
  previousPensionMember: boolean;
  previousUAN: string;
  previousPFAccountNumber: string;
  dateOfExit: string;
  schemeCertificateNumber: string;
  pensionPaymentOrder: string;
  internationalWorker: boolean;
  countryOfOrigin: string;
  passportNumber: string;
  passportValidityFrom: string;
  passportValidityTo: string;
  bankAccountNumber: string;
  ifscCode: string;
  aadharNumber: string;
  panNumber: string;
  firstEPFMember: boolean;
  enrolledDate: string;
  firstEmploymentWages: string;
  epfMemberBeforeSep2014: boolean;
  epfAmountWithdrawn: boolean;
  epsAmountWithdrawn: boolean;
  epsAmountWithdrawnAfterSep2014: boolean;
  declarationDate: string;
  declarationPlace: string;
  employerDeclarationDate: string;
  employerName: string;
  pfNumber: string;
  kycStatus: "not_uploaded" | "uploaded_not_approved" | "uploaded_approved";
  transferRequestGenerated: boolean;
  physicalClaimFiled: boolean;
}

interface EditEmployeeForm {
  name: string;
  email: string;
  phone: string;
  aadharNumber: string;
  panNumber: string;
  esicNumber: string;
  uanNumber: string;
  dateOfBirth: string;
  bloodGroup: string;
  gender: string;
  maritalStatus: string;
  permanentAddress: string;
  permanentPincode: string;
  localAddress: string;
  localPincode: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  numberOfChildren: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  nomineeName: string;
  nomineeRelation: string;
  pantSize: string;
  shirtSize: string;
  capSize: string;
  idCardIssued: boolean;
  westcoatIssued: boolean;
  apronIssued: boolean;
  department: string;
  position: string;
  salary: number | string;
  siteName: string;
  status: "active" | "inactive" | "left";
}

interface SiteDeploymentStatus {
  siteName: string;
  managerCount: number;
  managerRequirement: number;
  supervisorCount: number;
  supervisorRequirement: number;
  staffCount: number;
  staffRequirement: number;
  totalStaff: number;
  isManagerFull: boolean;
  isSupervisorFull: boolean;
  isStaffFull: boolean;
  remainingManagers: number;
  remainingSupervisors: number;
  remainingStaff: number;
  details: {
    managers: Employee[];
    supervisors: Employee[];
    staff: Employee[];
  };
}

// Default avatar SVG
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

// Schema for employee form
const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  site: z.string().min(1, "Please select a site"),
  shift: z.string().min(1, "Please select a shift"),
  department: z.string().min(1, "Please select department"),
  role: z.string().min(1, "Please enter job role"),
});

// Mobile responsive employee card component
const MobileEmployeeCard = ({
  employee,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDocuments,
  onUploadDocuments,
  onViewHistory,
  onGenerateIDCard,
  onDownloadIDCard,
  onOpenEPFForm,
  employeeTasks,
  isLoadingTasks,
  getPriorityBadge,
  getStatusBadge,
  formatDate
}: {
  employee: ExtendedEmployee;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (employee: ExtendedEmployee) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onViewDocuments: (employee: ExtendedEmployee) => void;
  onUploadDocuments: (employee: ExtendedEmployee) => void;
  onViewHistory: (employee: ExtendedEmployee) => void;
  onGenerateIDCard: (employee: ExtendedEmployee) => void;
  onDownloadIDCard: (employee: ExtendedEmployee) => void;
  onOpenEPFForm: (employee: ExtendedEmployee) => void;
  employeeTasks: Task[];
  isLoadingTasks: boolean;
  getPriorityBadge: (priority: string) => JSX.Element;
  getStatusBadge: (status: string) => JSX.Element;
  formatDate: (date: string) => string;
}) => {
  const [imgError, setImgError] = useState(false);

  const getPhotoUrl = (emp: ExtendedEmployee): string => {
    if (!emp.photo) return "";
    if (emp.photo.startsWith('data:image')) return emp.photo;
    if (emp.photo.includes('cloudinary.com')) return emp.photo;
    if (emp.photo.startsWith('http')) return emp.photo;
    return emp.photo;
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {employee.photo && !imgError ? (
              <img 
                src={getPhotoUrl(employee)} 
                alt={employee.name}
                className="h-12 w-12 rounded-full object-cover"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate">{employee.name}</h3>
                {employee.isManager && (
                  <Badge className="bg-amber-100 text-amber-800 text-xs">Manager</Badge>
                )}
                {employee.isSupervisor && (
                  <Badge className="bg-teal-100 text-teal-800 text-xs">Supervisor</Badge>
                )}
                <Badge 
                  variant={employee.status === "active" ? "default" : 
                          employee.status === "inactive" ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {employee.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">ID: {employee.employeeId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(employee)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewHistory(employee)}>
                  <History className="h-4 w-4 mr-2" /> Site History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewDocuments(employee)}>
                  <Files className="h-4 w-4 mr-2" /> View Documents
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUploadDocuments(employee)}>
                  <Upload className="h-4 w-4 mr-2" /> Upload KYC
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGenerateIDCard(employee)}>
                  <Eye className="h-4 w-4 mr-2" /> View ID Card
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownloadIDCard(employee)}>
                  <Download className="h-4 w-4 mr-2" /> Download ID Card
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenEPFForm(employee)}>
                  <FileText className="h-4 w-4 mr-2" /> EPF Form 11
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(employee._id)}>
                  {employee.status === "active" ? (
                    <UserX className="h-4 w-4 mr-2" />
                  ) : employee.status === "left" ? (
                    <UserCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  {employee.status === "active" ? "Mark as Left" : 
                   employee.status === "left" ? "Mark as Active" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(employee._id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleExpand(employee._id)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate flex-1">{employee.email}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{employee.phone}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium">{employee.department}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium">{employee.position}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Site</p>
              <div className="flex items-center gap-1 mt-1">
                <Building className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{employee.siteName || 'Not Assigned'}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Join Date</p>
              <p className="text-sm">{employee.joinDate || employee.dateOfJoining}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="text-sm">₹{employee.salary?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4" />
                Assigned Tasks
              </h4>
              <Badge variant="outline" className="text-xs">
                {employeeTasks.length} task(s)
              </Badge>
            </div>
            
            {isLoadingTasks ? (
              <div className="text-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Loading tasks...</p>
              </div>
            ) : employeeTasks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {employeeTasks.map((task) => (
                  <Card key={task._id} className="border-l-4" style={{
                    borderLeftColor: task.priority === 'high' ? '#ef4444' : 
                                    task.priority === 'medium' ? '#eab308' : 
                                    task.priority === 'low' ? '#22c55e' : '#6b7280'
                  }}>
                    <CardContent className="p-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h5 className="font-medium text-sm">{task.title}</h5>
                              {getPriorityBadge(task.priority)}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{task.siteName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.deadline)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SupervisorEmployees = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useRole();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<ExtendedEmployee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [employees, setEmployees] = useState<ExtendedEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<ExtendedEmployee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [activeTab, setActiveTab] = useState("employees");
  
  // Import related state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // Document and form dialogs
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedEmployeeForDocuments, setSelectedEmployeeForDocuments] = useState<ExtendedEmployee | null>(null);
  const [documentUploadDialogOpen, setDocumentUploadDialogOpen] = useState(false);
  const [selectedEmployeeForDocumentUpload, setSelectedEmployeeForDocumentUpload] = useState<ExtendedEmployee | null>(null);
  const [refreshDocuments, setRefreshDocuments] = useState(false);
  
  // EPF Form dialog
  const [epfForm11DialogOpen, setEpfForm11DialogOpen] = useState(false);
  const [selectedEmployeeForEPF, setSelectedEmployeeForEPF] = useState<ExtendedEmployee | null>(null);
  const [isSavingEPF, setIsSavingEPF] = useState(false);
  
  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<ExtendedEmployee | null>(null);
  const [editFormData, setEditFormData] = useState<EditEmployeeForm | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<ExtendedEmployee | null>(null);
  
  // Site deployment state
  const [siteDeploymentStatus, setSiteDeploymentStatus] = useState<Map<string, SiteDeploymentStatus>>(new Map());
  const [loadingDeploymentStatus, setLoadingDeploymentStatus] = useState(false);
  
  // Mobile responsive state
  const [isMobileView, setIsMobileView] = useState(false);
  
  const [loading, setLoading] = useState({
    employees: false,
    sites: false,
    tasks: false,
    initial: true
  });
  
  const [sites, setSites] = useState<Site[]>([]);
  const [supervisorSites, setSupervisorSites] = useState<Site[]>([]);
  const [supervisorSiteNames, setSupervisorSiteNames] = useState<string[]>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("all");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<Map<string, Task[]>>(new Map());
  const [tasksLoading, setTasksLoading] = useState<Map<string, boolean>>(new Map());
  
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // EPF Form Data
  const [epfFormData, setEpfFormData] = useState<EPFForm11Data>({
    memberName: "",
    fatherOrSpouseName: "",
    relationshipType: "father",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    email: "",
    mobileNumber: "",
    previousEPFMember: false,
    previousPensionMember: false,
    previousUAN: "",
    previousPFAccountNumber: "",
    dateOfExit: "",
    schemeCertificateNumber: "",
    pensionPaymentOrder: "",
    internationalWorker: false,
    countryOfOrigin: "",
    passportNumber: "",
    passportValidityFrom: "",
    passportValidityTo: "",
    bankAccountNumber: "",
    ifscCode: "",
    aadharNumber: "",
    panNumber: "",
    firstEPFMember: true,
    enrolledDate: new Date().toISOString().split("T")[0],
    firstEmploymentWages: "",
    epfMemberBeforeSep2014: false,
    epfAmountWithdrawn: false,
    epsAmountWithdrawn: false,
    epsAmountWithdrawnAfterSep2014: false,
    declarationDate: new Date().toISOString().split("T")[0],
    declarationPlace: "Mumbai",
    employerDeclarationDate: new Date().toISOString().split("T")[0],
    employerName: "SK ENTERPRISES",
    pfNumber: "",
    kycStatus: "not_uploaded",
    transferRequestGenerated: false,
    physicalClaimFiled: false
  });

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Helper function to normalize site names for comparison
  const normalizeSiteName = useCallback((siteName: string | null | undefined): string => {
    if (!siteName) return '';
    return siteName.toString().toLowerCase().trim();
  }, []);

  // Excel serial to date conversion
  const excelSerialToDate = (serial: number): Date => {
    try {
      const adjustedSerial = serial > 60 ? serial - 1 : serial;
      const utcDays = Math.floor(adjustedSerial - 25569);
      const utcValue = utcDays * 86400 * 1000;
      const date = new Date(utcValue);
      
      if (serial % 1 !== 0) {
        const fraction = serial % 1;
        const hours = Math.floor(fraction * 24);
        const minutes = Math.floor((fraction * 24 * 60) % 60);
        const seconds = Math.floor((fraction * 24 * 60 * 60) % 60);
        date.setHours(hours, minutes, seconds);
      }
      
      return date;
    } catch (error) {
      console.error('Error converting Excel date:', serial, error);
      return new Date();
    }
  };

  // Parse date string
  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    try {
      const cleanStr = dateStr.trim();
      
      const usFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const usMatch = cleanStr.match(usFormat);
      if (usMatch) {
        const month = parseInt(usMatch[1]) - 1;
        const day = parseInt(usMatch[2]);
        const year = parseInt(usMatch[3]);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      const isoFormat = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
      const isoMatch = cleanStr.match(isoFormat);
      if (isoMatch) {
        const year = parseInt(isoMatch[1]);
        const month = parseInt(isoMatch[2]) - 1;
        const day = parseInt(isoMatch[3]);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      const date = new Date(cleanStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing date string:', dateStr, error);
      return null;
    }
  };

  // Calculate site deployment status
  const calculateSiteDeploymentStatus = useCallback(() => {
    setLoadingDeploymentStatus(true);
    
    const statusMap = new Map<string, SiteDeploymentStatus>();
    
    supervisorSites.forEach(site => {
      const siteEmployees = employees.filter(emp => emp.siteName === site.name);
      
      const managerCount = siteEmployees.filter(emp => 
        emp.position?.toLowerCase().includes('manager') || 
        emp.department?.toLowerCase().includes('manager')
      ).length;
      
      const supervisorCount = siteEmployees.filter(emp => 
        emp.position?.toLowerCase().includes('supervisor') || 
        emp.department?.toLowerCase().includes('supervisor')
      ).length;
      
      const staffCount = siteEmployees.filter(emp => 
        !emp.position?.toLowerCase().includes('manager') && 
        !emp.position?.toLowerCase().includes('supervisor') &&
        !emp.department?.toLowerCase().includes('manager') &&
        !emp.department?.toLowerCase().includes('supervisor')
      ).length;
      
      const staffRequirement = Array.isArray(site.staffDeployment) 
        ? site.staffDeployment.reduce((total, item) => {
            const role = item.role?.toLowerCase() || '';
            if (!role.includes('manager') && !role.includes('supervisor')) {
              return total + (Number(item.count) || 0);
            }
            return total;
          }, 0)
        : 0;
      
      statusMap.set(site.name, {
        siteName: site.name,
        managerCount: managerCount,
        managerRequirement: site.managerCount || 0,
        supervisorCount: supervisorCount,
        supervisorRequirement: site.supervisorCount || 0,
        staffCount: staffCount,
        staffRequirement: staffRequirement,
        totalStaff: managerCount + supervisorCount + staffCount,
        isManagerFull: (site.managerCount || 0) > 0 && managerCount >= (site.managerCount || 0),
        isSupervisorFull: (site.supervisorCount || 0) > 0 && supervisorCount >= (site.supervisorCount || 0),
        isStaffFull: staffRequirement > 0 && staffCount >= staffRequirement,
        remainingManagers: Math.max(0, (site.managerCount || 0) - managerCount),
        remainingSupervisors: Math.max(0, (site.supervisorCount || 0) - supervisorCount),
        remainingStaff: Math.max(0, staffRequirement - staffCount),
        details: {
          managers: siteEmployees.filter(emp => 
            emp.position?.toLowerCase().includes('manager') || 
            emp.department?.toLowerCase().includes('manager')
          ),
          supervisors: siteEmployees.filter(emp => 
            emp.position?.toLowerCase().includes('supervisor') || 
            emp.department?.toLowerCase().includes('supervisor')
          ),
          staff: siteEmployees.filter(emp => 
            !emp.position?.toLowerCase().includes('manager') && 
            !emp.position?.toLowerCase().includes('supervisor') &&
            !emp.department?.toLowerCase().includes('manager') &&
            !emp.department?.toLowerCase().includes('supervisor')
          )
        }
      });
    });
    
    setSiteDeploymentStatus(statusMap);
    setLoadingDeploymentStatus(false);
  }, [employees, supervisorSites]);

  // Update site deployment status when employees or sites change
  useEffect(() => {
    if (employees.length > 0 && supervisorSites.length > 0) {
      calculateSiteDeploymentStatus();
    }
  }, [employees, supervisorSites, calculateSiteDeploymentStatus]);

  // Fetch tasks where this specific supervisor is assigned
  const fetchSupervisorSitesFromTasks = useCallback(async () => {
    if (!currentUser) return [];
    
    try {
      setLoading(prev => ({ ...prev, tasks: true }));
      
      const supervisorId = currentUser._id || currentUser.id;
      const supervisorName = currentUser.name;
      
      console.log("🔍 Fetching tasks for supervisor:", {
        id: supervisorId,
        name: supervisorName,
        email: currentUser.email
      });
      
      const response = await axios.get(`${API_URL}/tasks`, {
        params: { limit: 1000 }
      });
      
      let supervisorSiteNamesSet = new Set<string>();
      let supervisorSiteIdsSet = new Set<string>();
      let tasksWithSupervisor: Task[] = [];
      
      let allTasks: Task[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          allTasks = response.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          allTasks = response.data.data;
        } else if (response.data.tasks && Array.isArray(response.data.tasks)) {
          allTasks = response.data.tasks;
        }
      }
      
      console.log(`📊 Total tasks fetched: ${allTasks.length}`);
      
      allTasks.forEach((task: Task) => {
        let isAssignedToThisSupervisor = false;
        
        if (task.assignedUsers && Array.isArray(task.assignedUsers)) {
          isAssignedToThisSupervisor = task.assignedUsers.some(user => {
            const userIdMatch = user.userId === supervisorId;
            const nameMatch = user.name?.toLowerCase() === supervisorName?.toLowerCase();
            return userIdMatch || nameMatch;
          });
        }
        
        if (!isAssignedToThisSupervisor && task.assignedTo) {
          isAssignedToThisSupervisor = 
            task.assignedTo === supervisorId || 
            task.assignedToName?.toLowerCase() === supervisorName?.toLowerCase();
        }
        
        if (isAssignedToThisSupervisor && task.siteId && task.siteName) {
          supervisorSiteIdsSet.add(task.siteId);
          supervisorSiteNamesSet.add(task.siteName);
          tasksWithSupervisor.push(task);
        }
      });
      
      const supervisorSiteNames = Array.from(supervisorSiteNamesSet);
      
      console.log(`✅ Found ${tasksWithSupervisor.length} tasks for this supervisor`);
      console.log("📍 Supervisor's sites from tasks:", supervisorSiteNames);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        supervisorId,
        supervisorName,
        totalTasks: allTasks.length,
        tasksWithSupervisor: tasksWithSupervisor.length,
        supervisorSitesFromTasks: supervisorSiteNames,
        tasksList: tasksWithSupervisor.map(t => ({
          title: t.title,
          site: t.siteName,
          status: t.status
        }))
      }));
      
      return { siteNames: supervisorSiteNames, siteIds: supervisorSiteIdsSet };
      
    } catch (error: any) {
      console.error('❌ Error fetching tasks:', error);
      return { siteNames: [], siteIds: new Set() };
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  }, [currentUser]);

  // Fetch all sites and filter by supervisor's task-assigned sites
  const fetchAllSites = useCallback(async () => {
    if (!currentUser) return [];
    
    try {
      setLoading(prev => ({ ...prev, sites: true }));
      
      const { siteNames: taskSiteNames, siteIds: taskSiteIds } = await fetchSupervisorSitesFromTasks();
      
      console.log("🌐 Fetching all sites from API...");
      
      const response = await axios.get(`${API_URL}/sites`);
      
      let allSites: Site[] = [];
      
      if (response.data) {
        if (response.data.success && Array.isArray(response.data.data)) {
          allSites = response.data.data;
        } else if (Array.isArray(response.data)) {
          allSites = response.data;
        } else if (response.data.sites && Array.isArray(response.data.sites)) {
          allSites = response.data.sites;
        }
      }
      
      console.log(`📊 Fetched ${allSites.length} sites from API`);
      
      const transformedSites = allSites.map((site: any) => ({
        _id: site._id || site.id,
        name: site.name,
        clientName: site.clientName || site.client,
        location: site.location || "",
        status: site.status || "active",
        managerCount: site.managerCount || 0,
        supervisorCount: site.supervisorCount || 0,
        staffDeployment: site.staffDeployment || [],
        totalStaff: site.totalStaff || 0
      }));
      
      setSites(transformedSites);
      
      let supervisorSiteList: Site[] = [];
      
      if (taskSiteNames.length > 0) {
        supervisorSiteList = transformedSites.filter(site => {
          const exactNameMatch = taskSiteNames.some(taskSiteName => 
            site.name === taskSiteName
          );
          const exactNormalizedMatch = taskSiteNames.some(taskSiteName => 
            normalizeSiteName(site.name) === normalizeSiteName(taskSiteName)
          );
          const idMatch = taskSiteIds.has(site._id);
          return exactNameMatch || exactNormalizedMatch || idMatch;
        });
        
        console.log(`✅ Matched ${supervisorSiteList.length} sites from task assignments`);
      }
      
      setSupervisorSites(supervisorSiteList);
      setSupervisorSiteNames(supervisorSiteList.map(site => site.name));
      
      setDebugInfo((prev: any) => ({
        ...prev,
        allSitesCount: transformedSites.length,
        matchedSitesCount: supervisorSiteList.length,
        matchedSites: supervisorSiteList.map(s => s.name),
        taskSiteNames
      }));
      
      return supervisorSiteList;
      
    } catch (error: any) {
      console.error('❌ Error fetching sites:', error);
      toast.error(`Failed to load sites: ${error.message}`);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, sites: false }));
    }
  }, [currentUser, fetchSupervisorSitesFromTasks, normalizeSiteName]);

  // Get photo URL
  const getPhotoUrl = (employee: ExtendedEmployee): string => {
    if (!employee.photo) return "";
    if (employee.photo.startsWith('data:image')) return employee.photo;
    if (employee.photo.includes('cloudinary.com')) {
      if (!employee.photo.includes('w_') && !employee.photo.includes('h_')) {
        return employee.photo.replace('/image/upload/', '/image/upload/w_200,h_200,c_fill,q_auto/');
      }
      return employee.photo;
    }
    if (employee.photo.startsWith('http')) return employee.photo;
    return employee.photo;
  };

  // Handle import employees
  const handleImportEmployees = async (file: File) => {
    try {
      setIsImporting(true);
      setImportProgress({ current: 0, total: 0 });
      
      if (!file) {
        toast.error("Please select a file to import");
        return;
      }

      const toastId = toast.loading(
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="font-medium">Reading Excel file...</span>
          </div>
        </div>
      );

      let freshSites: Site[] = supervisorSites;
      
      if (freshSites.length === 0) {
        toast.error(
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium">No Sites Found</span>
            </div>
            <div className="text-sm text-red-600">
              You don't have any task-assigned sites. Please contact your administrator.
            </div>
          </div>,
          { id: toastId, duration: 10000 }
        );
        return;
      }

      const existingEmployees = employees;
      
      const siteCapacityMap = new Map<string, {
        name: string;
        managerRequirement: number;
        supervisorRequirement: number;
        staffRequirement: number;
        currentManagerCount: number;
        currentSupervisorCount: number;
        currentStaffCount: number;
        remainingManagers: number;
        remainingSupervisors: number;
        remainingStaff: number;
      }>();
      
      freshSites.forEach(site => {
        const staffRequirement = Array.isArray(site.staffDeployment) 
          ? site.staffDeployment.reduce((total, item) => {
              const role = item.role?.toLowerCase() || '';
              if (!role.includes('manager') && !role.includes('supervisor')) {
                return total + (Number(item.count) || 0);
              }
              return total;
            }, 0)
          : 0;
        
        const siteEmployees = existingEmployees.filter(emp => 
          emp.siteName?.trim() === site.name.trim()
        );
        
        const managerCount = siteEmployees.filter(emp => 
          emp.position?.toLowerCase().includes('manager') || 
          emp.department?.toLowerCase().includes('manager')
        ).length;
        
        const supervisorCount = siteEmployees.filter(emp => 
          emp.position?.toLowerCase().includes('supervisor') || 
          emp.department?.toLowerCase().includes('supervisor')
        ).length;
        
        const staffCount = siteEmployees.filter(emp => 
          !emp.position?.toLowerCase().includes('manager') && 
          !emp.position?.toLowerCase().includes('supervisor') &&
          !emp.department?.toLowerCase().includes('manager') &&
          !emp.department?.toLowerCase().includes('supervisor')
        ).length;
        
        siteCapacityMap.set(site.name, {
          name: site.name,
          managerRequirement: site.managerCount || 0,
          supervisorRequirement: site.supervisorCount || 0,
          staffRequirement: staffRequirement,
          currentManagerCount: managerCount,
          currentSupervisorCount: supervisorCount,
          currentStaffCount: staffCount,
          remainingManagers: Math.max(0, (site.managerCount || 0) - managerCount),
          remainingSupervisors: Math.max(0, (site.supervisorCount || 0) - supervisorCount),
          remainingStaff: Math.max(0, staffRequirement - staffCount)
        });
      });

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false
      });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        raw: false,
        dateNF: 'mm/dd/yyyy'
      });
      
      if (jsonData.length < 2) {
        toast.error(
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium">Empty File</span>
            </div>
            <div className="text-sm text-red-600">
              The Excel file has no data rows.
            </div>
          </div>,
          { id: toastId, duration: 10000 }
        );
        return;
      }
      
      const headers = jsonData[0] as string[];
      
      const siteIndex = headers.findIndex(h => h?.toLowerCase().includes('site'));
      const nameIndex = headers.findIndex(h => h?.toLowerCase().includes('name'));
      const dobIndex = headers.findIndex(h => h?.toLowerCase().includes('dob') || h?.toLowerCase().includes('birth'));
      const dojIndex = headers.findIndex(h => h?.toLowerCase().includes('joining') || h?.toLowerCase().includes('join'));
      const contactIndex = headers.findIndex(h => h?.toLowerCase().includes('phone') || h?.toLowerCase().includes('mobile'));
      const bloodGroupIndex = headers.findIndex(h => h?.toLowerCase().includes('blood'));
      const emailIndex = headers.findIndex(h => h?.toLowerCase().includes('email'));
      const aadharIndex = headers.findIndex(h => h?.toLowerCase().includes('aadhar'));
      const panIndex = headers.findIndex(h => h?.toLowerCase().includes('pan'));
      const positionIndex = headers.findIndex(h => h?.toLowerCase().includes('position') || h?.toLowerCase().includes('role'));
      const salaryIndex = headers.findIndex(h => h?.toLowerCase().includes('salary'));
      const departmentIndex = headers.findIndex(h => h?.toLowerCase().includes('department'));
      const accountNumberIndex = headers.findIndex(h => h?.toLowerCase().includes('account'));
      const ifscIndex = headers.findIndex(h => h?.toLowerCase().includes('ifsc'));
      const bankNameIndex = headers.findIndex(h => h?.toLowerCase().includes('bank'));
      const fatherNameIndex = headers.findIndex(h => h?.toLowerCase().includes('father'));
      const motherNameIndex = headers.findIndex(h => h?.toLowerCase().includes('mother'));
      const spouseNameIndex = headers.findIndex(h => h?.toLowerCase().includes('spouse'));
      const emergencyContactNameIndex = headers.findIndex(h => h?.toLowerCase().includes('emergency'));
      const permanentAddressIndex = headers.findIndex(h => h?.toLowerCase().includes('address'));
      
      const employeesToImport = [];
      let processedCount = 0;
      let skippedCount = 0;
      const skippedReasons: string[] = [];
      const invalidSiteNames: Set<string> = new Set();
      let autoGeneratedCount = 0;
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;
        
        const hasData = row.some(cell => cell !== undefined && cell !== null && cell.toString().trim() !== '');
        if (!hasData) continue;
        
        let siteName = '';
        if (siteIndex !== -1 && row[siteIndex] !== undefined && row[siteIndex] !== null) {
          siteName = String(row[siteIndex]).trim();
        }
        
        const name = nameIndex !== -1 && row[nameIndex] ? String(row[nameIndex]).trim() : '';
        
        if (!name) {
          skippedCount++;
          skippedReasons.push(`Row ${i + 1}: Missing employee name`);
          continue;
        }
        
        if (!siteName || !supervisorSiteNames.includes(siteName)) {
          skippedCount++;
          if (siteName && !supervisorSiteNames.includes(siteName)) {
            invalidSiteNames.add(siteName);
          }
          skippedReasons.push(`Row ${i + 1}: Site "${siteName}" not in your task-assigned sites`);
          continue;
        }
        
        let aadhar = '';
        if (aadharIndex !== -1 && row[aadharIndex] !== undefined && row[aadharIndex] !== null) {
          aadhar = String(row[aadharIndex]).trim().replace(/\s/g, '');
          
          if (aadhar.length === 11) {
            skippedReasons.push(`Row ${i + 1}: Aadhar has 11 digits (${aadhar}) - fixed to 12 digits by adding leading zero`);
            aadhar = '0' + aadhar;
          } else if (aadhar.length === 10) {
            skippedReasons.push(`Row ${i + 1}: Aadhar has 10 digits (${aadhar}) - fixed to 12 digits by adding leading zeros`);
            aadhar = '00' + aadhar;
          } else if (aadhar.length > 12) {
            const original = aadhar;
            aadhar = aadhar.slice(-12);
            skippedReasons.push(`Row ${i + 1}: Aadhar had ${original.length} digits, using last 12 digits`);
          }
        }
        
        if (!aadhar || aadhar.length !== 12 || !/^\d+$/.test(aadhar)) {
          const randomAadhar = Math.floor(100000000000 + Math.random() * 900000000000).toString();
          aadhar = randomAadhar;
          autoGeneratedCount++;
          skippedReasons.push(`Row ${i + 1}: Invalid/missing Aadhar - auto-generated: ${randomAadhar}`);
        }
        
        const position = positionIndex !== -1 && row[positionIndex] ? String(row[positionIndex]).trim() : '';
        const department = departmentIndex !== -1 && row[departmentIndex] ? String(row[departmentIndex]).trim() : '';
        
        const siteCapacity = siteCapacityMap.get(siteName);
        const isManager = position.toLowerCase().includes('manager') || department.toLowerCase().includes('manager');
        const isSupervisor = position.toLowerCase().includes('supervisor') || department.toLowerCase().includes('supervisor');
        
        if (siteCapacity) {
          if (isManager && siteCapacity.remainingManagers <= 0) {
            skippedCount++;
            skippedReasons.push(`Row ${i + 1}: Manager position full for ${siteName}`);
            continue;
          }
          if (isSupervisor && siteCapacity.remainingSupervisors <= 0) {
            skippedCount++;
            skippedReasons.push(`Row ${i + 1}: Supervisor position full for ${siteName}`);
            continue;
          }
          if (!isManager && !isSupervisor && siteCapacity.remainingStaff <= 0) {
            skippedCount++;
            skippedReasons.push(`Row ${i + 1}: Staff position full for ${siteName}`);
            continue;
          }
          
          if (isManager) siteCapacity.remainingManagers--;
          else if (isSupervisor) siteCapacity.remainingSupervisors--;
          else siteCapacity.remainingStaff--;
        }
        
        let dateOfBirth: Date | null = null;
        let dateOfJoining: Date = new Date();
        
        if (dojIndex !== -1 && row[dojIndex] !== undefined && row[dojIndex] !== null && row[dojIndex] !== '') {
          try {
            if (row[dojIndex] instanceof Date) {
              dateOfJoining = row[dojIndex];
            } else if (typeof row[dojIndex] === 'number') {
              dateOfJoining = excelSerialToDate(row[dojIndex]);
            } else if (typeof row[dojIndex] === 'string') {
              const parsed = parseDateString(row[dojIndex]);
              if (parsed) {
                dateOfJoining = parsed;
              }
            }
          } catch (error) {
            console.warn(`Row ${i + 1}: Error parsing DOJ:`, error);
          }
        }
        
        if (dobIndex !== -1 && row[dobIndex] !== undefined && row[dobIndex] !== null && row[dobIndex] !== '') {
          try {
            if (row[dobIndex] instanceof Date) {
              dateOfBirth = row[dobIndex];
            } else if (typeof row[dobIndex] === 'number') {
              dateOfBirth = excelSerialToDate(row[dobIndex]);
            } else if (typeof row[dobIndex] === 'string') {
              const parsed = parseDateString(row[dobIndex]);
              if (parsed) dateOfBirth = parsed;
            }
          } catch (error) {
            console.warn(`Row ${i + 1}: Error parsing DOB:`, error);
          }
        }
        
        let phone = '';
        if (contactIndex !== -1 && row[contactIndex] !== undefined && row[contactIndex] !== null) {
          const digits = String(row[contactIndex]).replace(/\D/g, '');
          if (digits.length === 10) {
            phone = digits;
          } else if (digits.length > 10) {
            phone = digits.slice(-10);
          } else if (digits.length > 0) {
            phone = digits.padStart(10, '9');
          }
        }
        
        if (!phone) {
          phone = '99' + Math.floor(10000000 + Math.random() * 90000000).toString();
          autoGeneratedCount++;
        }
        
        let email = '';
        if (emailIndex !== -1 && row[emailIndex] !== undefined && row[emailIndex] !== null) {
          email = String(row[emailIndex]).trim();
        }
        
        if (!email) {
          const nameParts = name.toLowerCase().split(' ');
          const firstName = nameParts[0]?.replace(/[^a-z]/g, '') || 'employee';
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].replace(/[^a-z]/g, '') : '';
          const randomNum = Math.floor(100 + Math.random() * 900);
          email = `${firstName}${lastName ? '.' + lastName : ''}${randomNum}@skenterprises.com`.toLowerCase();
          autoGeneratedCount++;
        }
        
        let salary = 15000;
        if (salaryIndex !== -1 && row[salaryIndex] !== undefined && row[salaryIndex] !== null) {
          const cleaned = String(row[salaryIndex]).replace(/[^0-9.]/g, '');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed) && parsed > 0) {
            salary = parsed;
          }
        }
        
        let bloodGroup = null;
        if (bloodGroupIndex !== -1 && row[bloodGroupIndex] !== undefined && row[bloodGroupIndex] !== null) {
          const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
          const bgUpper = String(row[bloodGroupIndex]).trim().toUpperCase();
          if (validBloodGroups.includes(bgUpper)) {
            bloodGroup = bgUpper;
          }
        }
        
        const employeeData = {
          name: name,
          email: email,
          phone: phone,
          aadharNumber: aadhar,
          dateOfJoining: dateOfJoining,
          department: department || 'General Staff',
          position: position || 'Employee',
          salary: salary,
          status: 'active',
          role: 'employee',
          siteName: siteName,
          dateOfBirth: dateOfBirth,
          bloodGroup: bloodGroup,
          panNumber: panIndex !== -1 && row[panIndex] ? String(row[panIndex]).trim() : null,
          gender: null,
          maritalStatus: null,
          bankName: bankNameIndex !== -1 && row[bankNameIndex] ? String(row[bankNameIndex]).trim() : null,
          accountNumber: accountNumberIndex !== -1 && row[accountNumberIndex] ? String(row[accountNumberIndex]).trim() : null,
          ifscCode: ifscIndex !== -1 && row[ifscIndex] ? String(row[ifscIndex]).trim().toUpperCase() : null,
          fatherName: fatherNameIndex !== -1 && row[fatherNameIndex] ? String(row[fatherNameIndex]).trim() : null,
          motherName: motherNameIndex !== -1 && row[motherNameIndex] ? String(row[motherNameIndex]).trim() : null,
          spouseName: spouseNameIndex !== -1 && row[spouseNameIndex] ? String(row[spouseNameIndex]).trim() : null,
          emergencyContactName: emergencyContactNameIndex !== -1 && row[emergencyContactNameIndex] ? String(row[emergencyContactNameIndex]).trim() : null,
          permanentAddress: permanentAddressIndex !== -1 && row[permanentAddressIndex] ? String(row[permanentAddressIndex]).trim() : null,
          siteHistory: [{
            siteName: siteName,
            assignedDate: dateOfJoining instanceof Date ? dateOfJoining.toISOString().split('T')[0] : dateOfJoining
          }]
        };
        
        employeesToImport.push(employeeData);
        processedCount++;
        
        setImportProgress({ current: i, total: jsonData.length - 1 });
      }
      
      if (employeesToImport.length === 0) {
        let errorMessage = "No valid employees found to import.";
        if (invalidSiteNames.size > 0) {
          errorMessage += ` The following sites are not in your task-assigned sites: ${Array.from(invalidSiteNames).join(', ')}.`;
        }
        
        toast.error(
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium">No Valid Employees Found</span>
            </div>
            <div className="text-sm text-red-600">
              {errorMessage}
            </div>
          </div>,
          { id: toastId, duration: 10000 }
        );
        return;
      }
      
      toast.loading(
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            <span className="font-medium">Importing {employeesToImport.length} employees...</span>
          </div>
        </div>,
        { id: toastId }
      );
      
      let successCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;
      const errorMessages: string[] = [];
      const importedSites: Set<string> = new Set();
      
      const batchSize = 20;
      for (let batchStart = 0; batchStart < employeesToImport.length; batchStart += batchSize) {
        const batch = employeesToImport.slice(batchStart, batchStart + batchSize);
        
        for (let i = 0; i < batch.length; i++) {
          const employee = batch[i];
          
          try {
            const response = await axios.post(`${API_URL}/employees`, employee, {
              timeout: 15000
            });
            
            if (response.data.success) {
              successCount++;
              importedSites.add(employee.siteName);
            } else {
              errorCount++;
              const errorMsg = response.data.message || 'Unknown error';
              errorMessages.push(`${employee.name}: ${errorMsg}`);
              
              if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
                duplicateCount++;
              }
            }
          } catch (error: any) {
            errorCount++;
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
            errorMessages.push(`${employee.name}: ${errorMsg}`);
            
            if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
              duplicateCount++;
            }
          }
          
          setImportProgress({ 
            current: batchStart + i + 1, 
            total: employeesToImport.length 
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const actualNewImports = successCount;
      
      let resultMessage = '';
      if (actualNewImports > 0) {
        resultMessage = `✅ ${actualNewImports} employees imported successfully`;
        if (duplicateCount > 0) {
          resultMessage += `, ⚠️ ${duplicateCount} already existed (skipped)`;
        }
        if (errorCount > duplicateCount) {
          const otherErrors = errorCount - duplicateCount;
          resultMessage += `, ❌ ${otherErrors} failed`;
        }
      } else {
        resultMessage = `❌ No new employees imported. ${duplicateCount} already exist, ${errorCount - duplicateCount} failed.`;
      }
      
      toast.success(
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="font-medium">Import Complete</span>
          </div>
          <div className="text-sm">
            {resultMessage}
          </div>
        </div>,
        { id: toastId, duration: 10000 }
      );
      
      await fetchEmployees();
      
      setImportDialogOpen(false);
      
    } catch (error: any) {
      console.error("Import process failed:", error);
      toast.error(
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="font-medium">Import Failed</span>
          </div>
          <div className="text-sm text-red-600">
            {error.message || "Error processing the file"}
          </div>
        </div>
      );
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  // Fetch employees from API
  const fetchEmployees = useCallback(async () => {
    if (!currentUser) {
      setLoading(prev => ({ ...prev, initial: false }));
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, employees: true, initial: true }));
      
      let supervisorSiteList = supervisorSites;
      let supervisorSiteNameList = supervisorSiteNames;
      
      if (supervisorSiteList.length === 0) {
        supervisorSiteList = await fetchAllSites() || [];
        supervisorSiteNameList = supervisorSiteList.map(site => site.name);
      }
      
      if (supervisorSiteNameList.length === 0) {
        console.log("❌ No sites from tasks - setting empty employees array");
        setEmployees([]);
        setLoading(prev => ({ ...prev, employees: false, initial: false }));
        toast.warning("You have no tasks assigned to any sites. Please contact your administrator.");
        return;
      }
      
      console.log("📡 Fetching all employees from API:", `${API_URL}/employees`);
      
      const response = await axios.get(`${API_URL}/employees`, {
        params: { limit: 1000 }
      });
      
      let fetchedEmployees: ExtendedEmployee[] = [];
      let allEmployees: any[] = [];
      
      if (response.data && response.data.success) {
        allEmployees = response.data.data || response.data.employees || [];
        
        console.log(`📊 Total employees from API: ${allEmployees.length}`);
        console.log("📍 Supervisor's task-assigned sites:", supervisorSiteNameList);
        
        fetchedEmployees = allEmployees
          .filter((emp: any) => {
            const employeeSite = emp.siteName || '';
            const exactMatch = supervisorSiteNameList.some(siteName => siteName === employeeSite);
            const normalizedExactMatch = supervisorSiteNameList.some(siteName => 
              normalizeSiteName(siteName) === normalizeSiteName(employeeSite)
            );
            return exactMatch || normalizedExactMatch;
          })
          .map((emp: any, index: number) => {
            let siteHistory = [];
            if (emp.siteHistory && Array.isArray(emp.siteHistory)) {
              siteHistory = emp.siteHistory.map((history: any) => ({
                siteName: history.siteName || '',
                assignedDate: history.assignedDate,
                leftDate: history.leftDate,
                daysWorked: history.daysWorked
              }));
            }
            
            const employee = {
              _id: emp._id || emp.id || `emp_${index}`,
              id: emp._id || emp.id || `emp_${index}`,
              employeeId: emp.employeeId || emp.employeeID ? 
                emp.employeeId : 
                `SK${index + 1}`,
              name: emp.name || emp.employeeName || "Unknown",
              email: emp.email || "",
              phone: emp.phone || emp.mobile || "",
              aadharNumber: emp.aadharNumber || emp.aadhar || "",
              panNumber: emp.panNumber || emp.pan || "",
              esicNumber: emp.esicNumber || emp.esic || "",
              uanNumber: emp.uanNumber || emp.uan || "",
              dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : "",
              dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              joinDate: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              exitDate: emp.dateOfExit ? new Date(emp.dateOfExit).toISOString().split('T')[0] : "",
              bloodGroup: emp.bloodGroup || "",
              gender: emp.gender || "",
              maritalStatus: emp.maritalStatus || "",
              department: emp.department || "Unknown",
              position: emp.position || emp.designation || "",
              siteName: emp.siteName || emp.site || "",
              salary: emp.salary || emp.basicSalary || 0,
              status: emp.status || "active",
              documents: emp.documents || [],
              photo: emp.photo || null,
              photoPublicId: emp.photoPublicId || null,
              fatherName: emp.fatherName || "",
              motherName: emp.motherName || "",
              spouseName: emp.spouseName || "",
              numberOfChildren: emp.numberOfChildren ? emp.numberOfChildren : 0,
              nomineeName: emp.nomineeName || "",
              nomineeRelation: emp.nomineeRelation || "",
              accountNumber: emp.accountNumber || emp.bankAccountNumber || "",
              ifscCode: emp.ifscCode || "",
              bankName: emp.bankName || "",
              permanentAddress: emp.permanentAddress || "",
              localAddress: emp.localAddress || "",
              emergencyContactName: emp.emergencyContactName || "",
              emergencyContactPhone: emp.emergencyContactPhone || "",
              emergencyContactRelation: emp.emergencyContactRelation || "",
              siteHistory: siteHistory,
              kycDocuments: emp.kycDocuments || [],
              isManager: false,
              isSupervisor: false
            };
            
            if (employee.siteName && siteHistory.length === 0) {
              employee.siteHistory = [{
                siteName: employee.siteName,
                assignedDate: employee.joinDate,
                leftDate: undefined,
                daysWorked: undefined
              }];
            }
            
            const position = employee.position?.toLowerCase() || '';
            const department = employee.department?.toLowerCase() || '';
            
            employee.isManager = position.includes('manager') || department.includes('manager');
            employee.isSupervisor = position.includes('supervisor') || department.includes('supervisor');
            
            return employee;
          });
        
        console.log(`✅ Filtered ${fetchedEmployees.length} employees for supervisor's task-assigned sites`);
        
      } else {
        console.warn("⚠️ Unexpected API response format:", response.data);
        toast.error("Failed to fetch employees: Invalid response format");
      }
      
      setEmployees(fetchedEmployees);
      
    } catch (error: any) {
      console.error('❌ Error fetching employees:', error);
      toast.error(`Failed to load employees: ${error.message}`);
      setEmployees([]);
    } finally {
      setLoading(prev => ({ ...prev, employees: false, initial: false }));
    }
  }, [currentUser, supervisorSites, supervisorSiteNames, fetchAllSites, normalizeSiteName]);

  // Initialize data
  useEffect(() => {
    if (currentUser && currentUser.role === "supervisor") {
      console.log("🚀 Initializing supervisor data...");
      fetchAllSites().then(() => {
        fetchEmployees();
      });
    }
  }, [currentUser]);

  // Filter employees based on search and filters
  useEffect(() => {
    let filtered = [...employees];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.employeeId.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.phone.includes(query) ||
        emp.department.toLowerCase().includes(query) ||
        emp.position.toLowerCase().includes(query)
      );
    }
    
    if (selectedSiteFilter !== "all") {
      filtered = filtered.filter(emp => emp.siteName === selectedSiteFilter);
    }
    
    if (selectedDepartmentFilter !== "all") {
      filtered = filtered.filter(emp => emp.department === selectedDepartmentFilter);
    }
    
    if (selectedStatusFilter !== "all") {
      filtered = filtered.filter(emp => emp.status === selectedStatusFilter);
    }
    
    setFilteredEmployees(filtered);
  }, [employees, searchQuery, selectedSiteFilter, selectedDepartmentFilter, selectedStatusFilter]);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      site: "",
      shift: "Day",
      department: "",
      role: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof employeeSchema>) => {
    try {
      if (editingEmployee) {
        const response = await axios.put(`${API_URL}/employees/${editingEmployee._id}`, {
          name: values.name,
          email: values.email,
          phone: values.phone,
          siteName: values.site,
          department: values.department,
          position: values.role,
        });
        
        if (response.data.success) {
          setEmployees(employees.map(e => 
            e._id === editingEmployee._id 
              ? { 
                  ...e, 
                  name: values.name, 
                  email: values.email,
                  phone: values.phone, 
                  siteName: values.site,
                  department: values.department,
                  position: values.role,
                } 
              : e
          ));
          toast.success("Employee updated successfully!");
        }
      } else {
        const response = await axios.post(`${API_URL}/employees`, {
          name: values.name,
          email: values.email,
          phone: values.phone,
          aadharNumber: "000000000000",
          department: values.department,
          position: values.role,
          siteName: values.site,
          dateOfJoining: new Date().toISOString(),
          salary: 0,
          status: "active"
        });
        
        if (response.data.success) {
          setEmployees([response.data.employee || response.data.data, ...employees]);
          toast.success("Employee added successfully!");
        }
      }
      setDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error saving employee:", error);
      toast.error(error.response?.data?.message || "Failed to save employee");
    }
  };

  // Toggle employee status
  const toggleEmployeeStatus = async (id: string) => {
    try {
      const employee = employees.find(e => e._id === id);
      if (!employee) return;
      
      let newStatus: "active" | "inactive" | "left" = "active";
      if (employee.status === "active") {
        newStatus = "left";
      } else if (employee.status === "left") {
        newStatus = "active";
      } else {
        newStatus = "active";
      }
      
      const response = await axios.patch(`${API_URL}/employees/${id}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setEmployees(employees.map(employee =>
          employee._id === id 
            ? { ...employee, status: newStatus, exitDate: newStatus === "left" ? new Date().toISOString().split("T")[0] : employee.exitDate } 
            : employee
        ));
        toast.success(`Employee marked as ${newStatus}`);
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (id: string) => {
    try {
      setIsDeleting(id);
      const employee = employees.find(e => e._id === id);
      if (!employee) {
        toast.error("Employee not found");
        return;
      }
      
      const response = await axios.delete(`${API_URL}/employees/${id}`);
      
      if (response.data.success) {
        setEmployees(prev => prev.filter(e => e._id !== id));
        toast.success("Employee deleted successfully!");
      }
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      toast.error(error.response?.data?.message || "Error deleting employee");
    } finally {
      setIsDeleting(null);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  // Handle edit employee
  const handleEditEmployee = (employee: ExtendedEmployee) => {
    setSelectedEmployeeForEdit(employee);
    setEditFormData({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      aadharNumber: employee.aadharNumber || "",
      panNumber: employee.panNumber || "",
      esicNumber: employee.esicNumber || "",
      uanNumber: employee.uanNumber || "",
      dateOfBirth: employee.dateOfBirth || "",
      bloodGroup: employee.bloodGroup || "",
      gender: employee.gender || "",
      maritalStatus: employee.maritalStatus || "",
      permanentAddress: employee.permanentAddress || "",
      permanentPincode: employee.permanentPincode || "",
      localAddress: employee.localAddress || "",
      localPincode: employee.localPincode || "",
      bankName: employee.bankName || "",
      accountNumber: employee.accountNumber || "",
      ifscCode: employee.ifscCode || "",
      branchName: employee.branchName || "",
      fatherName: employee.fatherName || "",
      motherName: employee.motherName || "",
      spouseName: employee.spouseName || "",
      numberOfChildren: employee.numberOfChildren?.toString() || "0",
      emergencyContactName: employee.emergencyContactName || "",
      emergencyContactPhone: employee.emergencyContactPhone || "",
      emergencyContactRelation: employee.emergencyContactRelation || "",
      nomineeName: employee.nomineeName || "",
      nomineeRelation: employee.nomineeRelation || "",
      pantSize: employee.pantSize || "",
      shirtSize: employee.shirtSize || "",
      capSize: employee.capSize || "",
      idCardIssued: employee.idCardIssued || false,
      westcoatIssued: employee.westcoatIssued || false,
      apronIssued: employee.apronIssued || false,
      department: employee.department || "",
      position: employee.position || "",
      salary: employee.salary || 0,
      siteName: employee.siteName || "",
      status: employee.status || "active"
    });
    setEditDialogOpen(true);
  };

  // Handle edit form change
  const handleEditFormChange = (field: keyof EditEmployeeForm, value: any) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedEmployeeForEdit || !editFormData) {
      toast.error("No employee selected for editing");
      return;
    }

    const requiredFields = [
      { field: editFormData.name, name: 'Name' },
      { field: editFormData.aadharNumber, name: 'Aadhar Number' },
      { field: editFormData.position, name: 'Position' },
      { field: editFormData.department, name: 'Department' },
      { field: editFormData.siteName, name: 'Site Name' },
    ];

    const missingFields = requiredFields
      .filter(item => !item.field || item.field.toString().trim() === '')
      .map(item => item.name);

    if (missingFields.length > 0) {
      toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (!/^\d{12}$/.test(editFormData.aadharNumber)) {
      toast.error("Please enter a valid 12-digit Aadhar number");
      return;
    }

    try {
      setIsSavingEdit(true);
      
      const apiData = {
        ...editFormData,
        email: editFormData.email?.trim() || null,
        panNumber: editFormData.panNumber?.trim() || null,
        esicNumber: editFormData.esicNumber?.trim() || null,
        uanNumber: editFormData.uanNumber?.trim() || null,
        dateOfBirth: editFormData.dateOfBirth || null,
        bloodGroup: editFormData.bloodGroup || null,
        gender: editFormData.gender || null,
        maritalStatus: editFormData.maritalStatus || null,
        permanentAddress: editFormData.permanentAddress?.trim() || null,
        permanentPincode: editFormData.permanentPincode?.trim() || null,
        localAddress: editFormData.localAddress?.trim() || null,
        localPincode: editFormData.localPincode?.trim() || null,
        bankName: editFormData.bankName?.trim() || null,
        accountNumber: editFormData.accountNumber?.trim() || null,
        ifscCode: editFormData.ifscCode?.trim().toUpperCase() || null,
        branchName: editFormData.branchName?.trim() || null,
        fatherName: editFormData.fatherName?.trim() || null,
        motherName: editFormData.motherName?.trim() || null,
        spouseName: editFormData.spouseName?.trim() || null,
        numberOfChildren: editFormData.numberOfChildren ? parseInt(editFormData.numberOfChildren.toString()) : 0,
        emergencyContactName: editFormData.emergencyContactName?.trim() || null,
        emergencyContactPhone: editFormData.emergencyContactPhone?.trim() || null,
        emergencyContactRelation: editFormData.emergencyContactRelation?.trim() || null,
        nomineeName: editFormData.nomineeName?.trim() || null,
        nomineeRelation: editFormData.nomineeRelation?.trim() || null,
        pantSize: editFormData.pantSize || null,
        shirtSize: editFormData.shirtSize || null,
        capSize: editFormData.capSize || null,
        idCardIssued: editFormData.idCardIssued === true,
        westcoatIssued: editFormData.westcoatIssued === true,
        apronIssued: editFormData.apronIssued === true,
        salary: typeof editFormData.salary === 'string' ? parseFloat(editFormData.salary) : editFormData.salary,
      };

      const response = await axios.patch(`${API_URL}/employees/${selectedEmployeeForEdit._id}`, apiData);

      if (response.data.success) {
        setEmployees(prev => prev.map(emp => 
          emp._id === selectedEmployeeForEdit._id 
            ? { ...emp, ...apiData }
            : emp
        ));
        
        toast.success("Employee updated successfully!");
        setEditDialogOpen(false);
        setSelectedEmployeeForEdit(null);
        setEditFormData(null);
        
        calculateSiteDeploymentStatus();
        fetchEmployees();
      } else {
        toast.error(response.data.message || "Failed to update employee");
      }
    } catch (err: any) {
      console.error("Error updating employee:", err);
      toast.error(err.response?.data?.message || "Error updating employee");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle view history
  const handleViewHistory = (employee: ExtendedEmployee) => {
    setSelectedEmployeeForHistory(employee);
    setHistoryDialogOpen(true);
  };

  // Handle view documents
  const handleViewDocuments = (employee: ExtendedEmployee) => {
    setSelectedEmployeeForDocuments(employee);
    setDocumentsDialogOpen(true);
  };

  // Handle upload documents
  const handleOpenDocumentUpload = (employee: ExtendedEmployee) => {
    setSelectedEmployeeForDocumentUpload(employee);
    setDocumentUploadDialogOpen(true);
  };

  // Handle document uploaded
  const handleDocumentUploaded = () => {
    fetchEmployees();
    setRefreshDocuments(prev => !prev);
    toast.success('Documents refreshed');
  };

  // Handle EPF Form 11
  const handleOpenEPFForm11 = (employee: ExtendedEmployee) => {
    setSelectedEmployeeForEPF(employee);
    
    setEpfFormData({
      memberName: employee.name || "",
      fatherOrSpouseName: employee.fatherName || employee.spouseName || "",
      relationshipType: employee.fatherName ? "father" : "spouse",
      dateOfBirth: employee.dateOfBirth || "",
      gender: employee.gender || "",
      maritalStatus: employee.maritalStatus || "",
      email: employee.email || "",
      mobileNumber: employee.phone || "",
      previousEPFMember: false,
      previousPensionMember: false,
      previousUAN: employee.uanNumber || "",
      previousPFAccountNumber: "",
      dateOfExit: "",
      schemeCertificateNumber: "",
      pensionPaymentOrder: "",
      internationalWorker: false,
      countryOfOrigin: "",
      passportNumber: "",
      passportValidityFrom: "",
      passportValidityTo: "",
      bankAccountNumber: employee.accountNumber || "",
      ifscCode: employee.ifscCode || "",
      aadharNumber: employee.aadharNumber || "",
      panNumber: employee.panNumber || "",
      firstEPFMember: true,
      enrolledDate: employee.joinDate || new Date().toISOString().split("T")[0],
      firstEmploymentWages: employee.salary?.toString() || "0",
      epfMemberBeforeSep2014: false,
      epfAmountWithdrawn: false,
      epsAmountWithdrawn: false,
      epsAmountWithdrawnAfterSep2014: false,
      declarationDate: new Date().toISOString().split("T")[0],
      declarationPlace: "Mumbai",
      employerDeclarationDate: new Date().toISOString().split("T")[0],
      employerName: "SK ENTERPRISES",
      pfNumber: employee.uanNumber || "",
      kycStatus: "not_uploaded",
      transferRequestGenerated: false,
      physicalClaimFiled: false
    });
    
    setEpfForm11DialogOpen(true);
  };

  // Handle EPF form change
  const handleEPFFormChange = (field: keyof EPFForm11Data, value: any) => {
    setEpfFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save EPF form
  const handleSaveEPFForm = async () => {
    if (!epfFormData.memberName || !epfFormData.aadharNumber || !selectedEmployeeForEPF) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsSavingEPF(true);
      
      const response = await fetch(`${API_URL}/epf-forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...epfFormData,
          employeeId: selectedEmployeeForEPF._id,
          firstEmploymentWages: parseFloat(epfFormData.firstEmploymentWages) || 0,
          enrolledDate: new Date(epfFormData.enrolledDate || selectedEmployeeForEPF.joinDate),
          declarationDate: new Date(epfFormData.declarationDate),
          employerDeclarationDate: new Date(epfFormData.employerDeclarationDate)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save EPF Form");
      }

      if (data.success) {
        toast.success("EPF Form saved successfully!");
        setEpfForm11DialogOpen(false);
        setSelectedEmployeeForEPF(null);
      } else {
        toast.error(data.message || "Failed to save EPF Form");
      }
    } catch (error: any) {
      console.error("Error saving EPF Form:", error);
      toast.error(error.message || "Error saving EPF Form");
    } finally {
      setIsSavingEPF(false);
    }
  };

  // Handle print EPF form
  const handlePrintEPFForm = () => {
    if (!selectedEmployeeForEPF) {
      toast.error("No employee selected");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to print forms");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EPF Form 11 - ${epfFormData.memberName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .form-container { max-width: 800px; margin: 0 auto; border: 1px solid #000; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; }
            .section { margin-bottom: 20px; }
            .field-row { display: flex; margin-bottom: 8px; }
            .label { font-weight: bold; width: 200px; }
            .value { flex: 1; border-bottom: 1px solid #000; padding: 2px 5px; }
          </style>
        </head>
        <body>
          <div class="form-container">
            <div class="header">
              <h2>EPF Form 11 - Declaration Form</h2>
            </div>
            <div class="section">
              <div class="field-row">
                <div class="label">Name:</div>
                <div class="value">${epfFormData.memberName}</div>
              </div>
              <div class="field-row">
                <div class="label">Father/Spouse Name:</div>
                <div class="value">${epfFormData.fatherOrSpouseName}</div>
              </div>
              <div class="field-row">
                <div class="label">Date of Birth:</div>
                <div class="value">${epfFormData.dateOfBirth}</div>
              </div>
              <div class="field-row">
                <div class="label">Aadhar Number:</div>
                <div class="value">${epfFormData.aadharNumber}</div>
              </div>
            </div>
            <div class="signature-area">
              <div class="field-row">
                <div class="label">Date:</div>
                <div class="value">${epfFormData.declarationDate}</div>
              </div>
              <div class="field-row">
                <div class="label">Signature:</div>
                <div class="value"></div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate ID card
  const generateIDCard = (employee: ExtendedEmployee) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to generate ID card");
      return;
    }

    const photoUrl = getPhotoUrl(employee);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID Card - ${employee.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            .id-card {
              width: 350px;
              background: white;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              overflow: hidden;
              border: 2px solid #e11d48;
            }
            .header {
              background: linear-gradient(135deg, #e11d48, #be123c);
              color: white;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .photo-section {
              padding: 20px;
              text-align: center;
            }
            .employee-photo {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              border: 3px solid #e11d48;
              object-fit: cover;
              margin: 0 auto;
            }
            .details {
              padding: 20px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 4px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .label {
              font-weight: bold;
              color: #666;
              font-size: 12px;
            }
            .value {
              color: #333;
              font-size: 12px;
            }
            .footer {
              background: #f8f9fa;
              padding: 15px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="header">
              <h1>SK ENTERPRISES</h1>
              <div>ID CARD</div>
            </div>
            <div class="photo-section">
              ${photoUrl 
                ? `<img src="${photoUrl}" alt="Employee Photo" class="employee-photo" />`
                : '<div style="width:120px;height:120px;border-radius:50%;background:#ccc;margin:0 auto;display:flex;align-items:center;justify-content:center;">No Photo</div>'
              }
            </div>
            <div class="details">
              <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">${employee.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Employee ID:</span>
                <span class="value">${employee.employeeId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Department:</span>
                <span class="value">${employee.department}</span>
              </div>
              <div class="detail-row">
                <span class="label">Position:</span>
                <span class="value">${employee.position}</span>
              </div>
              <div class="detail-row">
                <span class="label">Join Date:</span>
                <span class="value">${employee.joinDate}</span>
              </div>
            </div>
            <div class="footer">
              <div>Authorized Signature</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download ID card
  const downloadIDCard = (employee: ExtendedEmployee) => {
    generateIDCard(employee);
    toast.success(`ID Card generated for ${employee.name}`);
  };

  // Download nominee form
  const downloadNomineeForm = (employee: ExtendedEmployee) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to generate forms");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nominee Form - ${employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .form-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; display: inline-block; width: 200px; }
          </style>
        </head>
        <body>
          <div class="form-container">
            <div class="header">
              <h2>SK ENTERPRISES</h2>
              <h3>Nomination Form</h3>
            </div>
            <div class="section">
              <div class="field"><span class="label">Name:</span> ${employee.name}</div>
              <div class="field"><span class="label">Employee ID:</span> ${employee.employeeId}</div>
            </div>
            <div class="section">
              <div class="field"><span class="label">Nominee Name:</span> ${employee.nomineeName || "________________"}</div>
              <div class="field"><span class="label">Relationship:</span> ${employee.nomineeRelation || "________________"}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(`Nominee Form generated for ${employee.name}`);
  };

  // Download PF form
  const downloadPFForm = (employee: ExtendedEmployee) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to generate forms");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PF Form - ${employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .form-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; display: inline-block; width: 250px; }
          </style>
        </head>
        <body>
          <div class="form-container">
            <div class="header">
              <h2>SK ENTERPRISES</h2>
              <h3>Provident Fund Declaration Form</h3>
            </div>
            <div class="section">
              <div class="field"><span class="label">Name:</span> ${employee.name}</div>
              <div class="field"><span class="label">Employee ID:</span> ${employee.employeeId}</div>
              <div class="field"><span class="label">UAN Number:</span> ${employee.uanNumber}</div>
              <div class="field"><span class="label">Date of Joining:</span> ${employee.joinDate}</div>
              <div class="field"><span class="label">Department:</span> ${employee.department}</div>
              <div class="field"><span class="label">Basic Salary:</span> ₹${employee.salary}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(`PF Form generated for ${employee.name}`);
  };

  // Download ESIC form
  const downloadESICForm = (employee: ExtendedEmployee) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to generate forms");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ESIC Form - ${employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .form-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; display: inline-block; width: 250px; }
          </style>
        </head>
        <body>
          <div class="form-container">
            <div class="header">
              <h2>SK ENTERPRISES</h2>
              <h3>ESIC Family Declaration Form</h3>
            </div>
            <div class="section">
              <div class="field"><span class="label">Name:</span> ${employee.name}</div>
              <div class="field"><span class="label">ESIC Number:</span> ${employee.esicNumber}</div>
              <div class="field"><span class="label">Employee ID:</span> ${employee.employeeId}</div>
            </div>
            <div class="section">
              <div class="field"><span class="label">Father's Name:</span> ${employee.fatherName || "________________"}</div>
              <div class="field"><span class="label">Mother's Name:</span> ${employee.motherName || "________________"}</div>
              <div class="field"><span class="label">Spouse Name:</span> ${employee.spouseName || "________________"}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(`ESIC Form generated for ${employee.name}`);
  };

  // Fetch tasks for a specific employee
  const fetchEmployeeTasks = async (employeeId: string) => {
    try {
      setTasksLoading(prev => new Map(prev).set(employeeId, true));
      
      const response = await axios.get(`${API_URL}/tasks`, {
        params: {
          assignedTo: employeeId,
          limit: 50
        }
      });
      
      let tasks: Task[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          tasks = response.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          tasks = response.data.data;
        } else if (response.data.tasks && Array.isArray(response.data.tasks)) {
          tasks = response.data.tasks;
        }
      }
      
      setEmployeeTasks(prev => new Map(prev).set(employeeId, tasks));
    } catch (error) {
      console.error(`Error fetching tasks for employee ${employeeId}:`, error);
    } finally {
      setTasksLoading(prev => new Map(prev).set(employeeId, false));
    }
  };

  const toggleEmployeeExpand = (employeeId: string) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null);
    } else {
      setExpandedEmployee(employeeId);
      if (!employeeTasks.has(employeeId)) {
        fetchEmployeeTasks(employeeId);
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(prev => ({ ...prev, initial: true }));
    await fetchAllSites();
    await fetchEmployees();
  };

  const handleExportEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees/export`, {
        responseType: 'blob',
        params: {
          department: selectedDepartmentFilter !== 'all' ? selectedDepartmentFilter : undefined,
          status: selectedStatusFilter !== 'all' ? selectedStatusFilter : undefined,
          siteName: supervisorSiteNames.length > 0 ? supervisorSiteNames.join(',') : undefined
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Employees exported successfully!");
    } catch (error: any) {
      console.error("Error exporting employees:", error);
      toast.error(error.response?.data?.message || "Failed to export employees");
    }
  };

  const getUniqueDepartments = () => {
    return Array.from(new Set(employees.map(e => e.department))).filter(Boolean);
  };

  const getUniqueSites = () => {
    return Array.from(new Set(employees.map(e => e.siteName))).filter(Boolean);
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500 text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500 text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-500 text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-xs flex items-center gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    inactive: employees.filter(e => e.status === "inactive").length,
    left: employees.filter(e => e.status === "left").length,
    sites: supervisorSites.length,
  };

  // Check if user is a supervisor
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please login to access this page</p>
          <Button onClick={() => navigate('/login')} className="mt-4">Go to Login</Button>
        </div>
      </div>
    );
  }

  if (currentUser.role !== "supervisor") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-4">This page is only accessible to supervisors</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        title="Employee Management"
        subtitle={supervisorSites.length > 0 
          ? `Showing employees from your ${stats.sites} task-assigned site(s)`
          : "No task-assigned sites found"}
        onMenuClick={onMenuClick}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Import Progress Bar */}
        {isImporting && importProgress.total > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">Importing to Database</h4>
                      <p className="text-sm text-muted-foreground">
                        Validating sites, checking capacity, and saving employees...
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="sm:ml-0 w-fit">
                    {importProgress.current}/{importProgress.total}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Progress value={(importProgress.current / importProgress.total) * 100} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supervisor Info Card */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold truncate">{currentUser.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="default" className="text-xs md:text-sm capitalize">
                    <Users className="h-3 w-3 mr-1" />
                    {currentUser.role}
                  </Badge>
                  {supervisorSites.length > 0 ? (
                    <Badge variant="outline" className="text-xs md:text-sm max-w-full">
                      <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        Task-Assigned Sites: {supervisorSites.map(s => s.name).join(', ')}
                      </span>
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs md:text-sm">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      No Task-Assigned Sites
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size={isMobileView ? "sm" : "default"}
                    onClick={() => setImportDialogOpen(true)}
                    disabled={isImporting || supervisorSites.length === 0}
                    className="text-xs"
                  >
                    {isImporting ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                    )}
                    {!isMobileView && "Import Excel"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size={isMobileView ? "sm" : "default"}
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs"
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {!isMobileView && "Debug"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size={isMobileView ? "sm" : "default"}
                    onClick={handleExportEmployees}
                    disabled={employees.length === 0}
                    className="text-xs"
                  >
                    <DownloadCloud className="h-3 w-3 mr-1" />
                    {!isMobileView && "Export"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size={isMobileView ? "sm" : "default"}
                    onClick={handleRefresh}
                    disabled={loading.employees || loading.sites}
                    className="text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${loading.employees ? 'animate-spin' : ''}`} />
                    {!isMobileView && "Refresh"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size={isMobileView ? "sm" : "default"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-xs"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    {!isMobileView && "Filters"}
                    {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {stats.total} employees • {stats.active} active • {stats.sites} site(s)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        {showDebug && debugInfo && (
          <Card className="bg-black/5 border-muted">
            <CardContent className="p-4 md:p-6">
              <h4 className="font-semibold mb-2">Debug Information</h4>
              <pre className="text-xs bg-black/10 p-3 md:p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Active</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.active}</p>
                </div>
                <UserCheck className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Inactive</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.inactive}</p>
                </div>
                <UserX className="h-6 w-6 md:h-8 md:w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Left</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.left}</p>
                </div>
                <UserMinus className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Sites</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.sites}</p>
                </div>
                <MapPin className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Site</label>
                  <Select value={selectedSiteFilter} onValueChange={setSelectedSiteFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {getUniqueSites().map(site => (
                        <SelectItem key={site} value={site} className="truncate">
                          {site}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Department</label>
                  <Select value={selectedDepartmentFilter} onValueChange={setSelectedDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {getUniqueDepartments().map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSiteFilter("all");
                    setSelectedDepartmentFilter("all");
                    setSelectedStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task-Assigned Sites Info */}
        {supervisorSites.length > 0 ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold">Sites from Your Task Assignments</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    You have tasks assigned at these sites. Showing employees from these sites only.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {supervisorSites.map(site => (
                      <Badge key={site._id} variant="outline" className="bg-white text-xs">
                        {site.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800">No Task-Assigned Sites Found</h4>
                  <p className="text-sm text-yellow-700">
                    You don't have any tasks assigned to you yet. No employees will be shown until you are assigned to tasks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* HRMS Tabs */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="employees" className="text-sm md:text-base">
                  Employees ({filteredEmployees.length})
                </TabsTrigger>
                <TabsTrigger value="onboarding" className="text-sm md:text-base">
                  Onboarding
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="employees" className="space-y-4 mt-4">
                {loading.initial ? (
                  <div className="text-center py-8 md:py-12">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm md:text-base text-muted-foreground mt-4">Loading your data...</p>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <Users className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm md:text-base text-muted-foreground">No employees found for your task-assigned sites</p>
                    {supervisorSites.length > 0 && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setImportDialogOpen(true)}
                          className="mr-2"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Import Employees
                        </Button>
                        <Button variant="outline" onClick={handleRefresh}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredEmployees.length} of {employees.length} employees
                      </p>
                      <div className="flex gap-2">
                        {!isMobileView && (
                          <>
                            <Button 
                              onClick={() => setImportDialogOpen(true)}
                              size="sm"
                              variant="outline"
                            >
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Import
                            </Button>
                            <Button 
                              onClick={() => {
                                setEditingEmployee(null);
                                form.reset();
                                setDialogOpen(true);
                              }}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Employee
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Mobile view - Cards */}
                    {isMobileView ? (
                      <div className="space-y-3">
                        {filteredEmployees.map((employee) => (
                          <MobileEmployeeCard
                            key={employee._id}
                            employee={employee}
                            isExpanded={expandedEmployee === employee._id}
                            onToggleExpand={toggleEmployeeExpand}
                            onEdit={handleEditEmployee}
                            onDelete={(id) => {
                              setEmployeeToDelete(id);
                              setDeleteDialogOpen(true);
                            }}
                            onToggleStatus={toggleEmployeeStatus}
                            onViewDocuments={handleViewDocuments}
                            onUploadDocuments={handleOpenDocumentUpload}
                            onViewHistory={handleViewHistory}
                            onGenerateIDCard={generateIDCard}
                            onDownloadIDCard={downloadIDCard}
                            onOpenEPFForm={handleOpenEPFForm11}
                            employeeTasks={employeeTasks.get(employee._id) || []}
                            isLoadingTasks={tasksLoading.get(employee._id) || false}
                            getPriorityBadge={getPriorityBadge}
                            getStatusBadge={getStatusBadge}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    ) : (
                      /* Desktop view - Table */
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8"></TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Department</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Site</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEmployees.map((employee) => {
                              const isExpanded = expandedEmployee === employee._id;
                              const employeeTaskList = employeeTasks.get(employee._id) || [];
                              const isLoadingTasks = tasksLoading.get(employee._id) || false;
                              
                              return (
                                <>
                                  <TableRow key={employee._id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => toggleEmployeeExpand(employee._id)}
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {employee.photo ? (
                                          <img 
                                            src={getPhotoUrl(employee)} 
                                            alt={employee.name}
                                            className="h-8 w-8 rounded-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                          </div>
                                        )}
                                        <div>
                                          <div className="font-medium">{employee.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            ID: {employee.employeeId}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="flex items-center gap-1 text-sm">
                                          <Mail className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate max-w-[150px]">{employee.email}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                          <Phone className="h-3 w-3 flex-shrink-0" />
                                          {employee.phone}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{employee.department}</TableCell>
                                    <TableCell>{employee.position}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="max-w-[150px] truncate">
                                        {employee.siteName || 'Not Assigned'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={employee.status === "active" ? "default" : 
                                                employee.status === "inactive" ? "secondary" : "destructive"}
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleEmployeeStatus(employee._id);
                                        }}
                                      >
                                        {employee.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                                              <Edit className="h-4 w-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleViewHistory(employee)}>
                                              <History className="h-4 w-4 mr-2" /> Site History
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleViewDocuments(employee)}>
                                              <Files className="h-4 w-4 mr-2" /> View Documents
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenDocumentUpload(employee)}>
                                              <Upload className="h-4 w-4 mr-2" /> Upload KYC
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => generateIDCard(employee)}>
                                              <Eye className="h-4 w-4 mr-2" /> View ID Card
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => downloadIDCard(employee)}>
                                              <Download className="h-4 w-4 mr-2" /> Download ID Card
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenEPFForm11(employee)}>
                                              <FileText className="h-4 w-4 mr-2" /> EPF Form 11
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleEmployeeStatus(employee._id)}>
                                              {employee.status === "active" ? (
                                                <UserX className="h-4 w-4 mr-2" />
                                              ) : (
                                                <UserCheck className="h-4 w-4 mr-2" />
                                              )}
                                              {employee.status === "active" ? "Mark as Left" : "Mark as Active"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                              setEmployeeToDelete(employee._id);
                                              setDeleteDialogOpen(true);
                                            }} className="text-red-600">
                                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  
                                  {/* Expanded row with tasks */}
                                  {isExpanded && (
                                    <TableRow className="bg-muted/30">
                                      <TableCell colSpan={8} className="p-4">
                                        <div className="space-y-4">
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-semibold flex items-center gap-2">
                                              <Briefcase className="h-4 w-4" />
                                              Assigned Tasks
                                            </h4>
                                            <Badge variant="outline">
                                              {employeeTaskList.length} task(s)
                                            </Badge>
                                          </div>
                                          
                                          {isLoadingTasks ? (
                                            <div className="text-center py-4">
                                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                              <p className="text-sm text-muted-foreground mt-2">Loading tasks...</p>
                                            </div>
                                          ) : employeeTaskList.length === 0 ? (
                                            <div className="text-center py-4 text-muted-foreground">
                                              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                              <p>No tasks assigned to this employee</p>
                                            </div>
                                          ) : (
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                              {employeeTaskList.map((task) => (
                                                <Card key={task._id} className="border-l-4" style={{
                                                  borderLeftColor: task.priority === 'high' ? '#ef4444' : 
                                                                  task.priority === 'medium' ? '#eab308' : 
                                                                  task.priority === 'low' ? '#22c55e' : '#6b7280'
                                                }}>
                                                  <CardContent className="p-4">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                          <h5 className="font-medium">{task.title}</h5>
                                                          {getPriorityBadge(task.priority)}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                          {task.description}
                                                        </p>
                                                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                                          <div className="flex items-center gap-1">
                                                            <Building className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate max-w-[150px]">{task.siteName}</span>
                                                          </div>
                                                          <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            Deadline: {formatDate(task.deadline)}
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-3">
                                                        {getStatusBadge(task.status)}
                                                      </div>
                                                    </div>
                                                  </CardContent>
                                                </Card>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="onboarding" className="space-y-4 mt-4">
                <SupervisorOnboardingTab 
                  employees={employees}
                  setEmployees={setEmployees}
                  salaryStructures={salaryStructures}
                  setSalaryStructures={setSalaryStructures}
                  sites={supervisorSites}
                  currentUser={currentUser}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Floating Add Button for Mobile */}
      {isMobileView && activeTab === "employees" && filteredEmployees.length > 0 && (
        <Button
          onClick={() => {
            setEditingEmployee(null);
            form.reset();
            setDialogOpen(true);
          }}
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Import Dialog */}
      <ExcelImportDialog 
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportEmployees}
        loading={isImporting}
      />

      {/* Add/Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter employee name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter employee email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="site"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supervisorSites.map(site => (
                          <SelectItem key={site._id} value={site.name}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Day">Day Shift</SelectItem>
                        <SelectItem value="Night">Night Shift</SelectItem>
                        <SelectItem value="Rotating">Rotating Shift</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter department" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Role *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter job role" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="flex-1">
                  {editingEmployee ? "Update Employee" : "Add Employee"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit className="h-5 w-5" />
              Edit Employee - {selectedEmployeeForEdit?.name}
            </DialogTitle>
            <DialogDescription>
              Make changes to employee information below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          {editFormData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  placeholder="Enter email address (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => handleEditFormChange('phone', e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-aadhar">Aadhar Number *</Label>
                <Input
                  id="edit-aadhar"
                  value={editFormData.aadharNumber}
                  onChange={(e) => handleEditFormChange('aadharNumber', e.target.value)}
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pan">PAN Number</Label>
                <Input
                  id="edit-pan"
                  value={editFormData.panNumber}
                  onChange={(e) => handleEditFormChange('panNumber', e.target.value.toUpperCase())}
                  placeholder="Enter PAN number"
                  className="uppercase"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-esic">ESIC Number</Label>
                <Input
                  id="edit-esic"
                  value={editFormData.esicNumber}
                  onChange={(e) => handleEditFormChange('esicNumber', e.target.value)}
                  placeholder="Enter ESIC number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-uan">UAN Number</Label>
                <Input
                  id="edit-uan"
                  value={editFormData.uanNumber}
                  onChange={(e) => handleEditFormChange('uanNumber', e.target.value)}
                  placeholder="Enter UAN number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dob">Date of Birth</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) => handleEditFormChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bloodGroup">Blood Group</Label>
                <Select 
                  value={editFormData.bloodGroup} 
                  onValueChange={(value) => handleEditFormChange('bloodGroup', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A +ve</SelectItem>
                    <SelectItem value="A-">A -ve</SelectItem>
                    <SelectItem value="B+">B +ve</SelectItem>
                    <SelectItem value="B-">B -ve</SelectItem>
                    <SelectItem value="O+">O +ve</SelectItem>
                    <SelectItem value="O-">O -ve</SelectItem>
                    <SelectItem value="AB+">AB +ve</SelectItem>
                    <SelectItem value="AB-">AB -ve</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Select 
                  value={editFormData.gender} 
                  onValueChange={(value) => handleEditFormChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Transgender">Transgender</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-maritalStatus">Marital Status</Label>
                <Select 
                  value={editFormData.maritalStatus} 
                  onValueChange={(value) => handleEditFormChange('maritalStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Widow">Widow</SelectItem>
                    <SelectItem value="Widower">Widower</SelectItem>
                    <SelectItem value="Divorcee">Divorcee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-department">Department *</Label>
                <Input
                  id="edit-department"
                  value={editFormData.department}
                  onChange={(e) => handleEditFormChange('department', e.target.value)}
                  placeholder="Enter department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-position">Position *</Label>
                <Input
                  id="edit-position"
                  value={editFormData.position}
                  onChange={(e) => handleEditFormChange('position', e.target.value)}
                  placeholder="Enter position"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-siteName">Site Name *</Label>
                <Select 
                  value={editFormData.siteName} 
                  onValueChange={(value) => handleEditFormChange('siteName', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisorSites.map(site => (
                      <SelectItem key={site._id} value={site.name}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salary (₹) *</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={editFormData.salary}
                  onChange={(e) => handleEditFormChange('salary', e.target.value)}
                  placeholder="Enter monthly salary"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editFormData.status} 
                  onValueChange={(value: "active" | "inactive" | "left") => handleEditFormChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-permanentAddress">Permanent Address</Label>
                <Textarea
                  id="edit-permanentAddress"
                  value={editFormData.permanentAddress}
                  onChange={(e) => handleEditFormChange('permanentAddress', e.target.value)}
                  placeholder="Enter permanent address"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-permanentPincode">Permanent Pin Code</Label>
                <Input
                  id="edit-permanentPincode"
                  value={editFormData.permanentPincode}
                  onChange={(e) => handleEditFormChange('permanentPincode', e.target.value)}
                  placeholder="Enter pin code"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-localAddress">Local Address</Label>
                <Textarea
                  id="edit-localAddress"
                  value={editFormData.localAddress}
                  onChange={(e) => handleEditFormChange('localAddress', e.target.value)}
                  placeholder="Enter local address"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-localPincode">Local Pin Code</Label>
                <Input
                  id="edit-localPincode"
                  value={editFormData.localPincode}
                  onChange={(e) => handleEditFormChange('localPincode', e.target.value)}
                  placeholder="Enter pin code"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bankName">Bank Name</Label>
                <Input
                  id="edit-bankName"
                  value={editFormData.bankName}
                  onChange={(e) => handleEditFormChange('bankName', e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-accountNumber">Account Number</Label>
                <Input
                  id="edit-accountNumber"
                  value={editFormData.accountNumber}
                  onChange={(e) => handleEditFormChange('accountNumber', e.target.value)}
                  placeholder="Enter account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ifscCode">IFSC Code</Label>
                <Input
                  id="edit-ifscCode"
                  value={editFormData.ifscCode}
                  onChange={(e) => handleEditFormChange('ifscCode', e.target.value.toUpperCase())}
                  placeholder="Enter IFSC code"
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-branchName">Branch Name</Label>
                <Input
                  id="edit-branchName"
                  value={editFormData.branchName}
                  onChange={(e) => handleEditFormChange('branchName', e.target.value)}
                  placeholder="Enter branch name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fatherName">Father's Name</Label>
                <Input
                  id="edit-fatherName"
                  value={editFormData.fatherName}
                  onChange={(e) => handleEditFormChange('fatherName', e.target.value)}
                  placeholder="Enter father's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-motherName">Mother's Name</Label>
                <Input
                  id="edit-motherName"
                  value={editFormData.motherName}
                  onChange={(e) => handleEditFormChange('motherName', e.target.value)}
                  placeholder="Enter mother's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-spouseName">Spouse Name</Label>
                <Input
                  id="edit-spouseName"
                  value={editFormData.spouseName}
                  onChange={(e) => handleEditFormChange('spouseName', e.target.value)}
                  placeholder="Enter spouse name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-numberOfChildren">Number of Children</Label>
                <Input
                  id="edit-numberOfChildren"
                  type="number"
                  value={editFormData.numberOfChildren}
                  onChange={(e) => handleEditFormChange('numberOfChildren', e.target.value)}
                  placeholder="Enter number of children"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-emergencyContactName">Emergency Contact Name</Label>
                <Input
                  id="edit-emergencyContactName"
                  value={editFormData.emergencyContactName}
                  onChange={(e) => handleEditFormChange('emergencyContactName', e.target.value)}
                  placeholder="Enter emergency contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-emergencyContactPhone">Emergency Contact Phone</Label>
                <Input
                  id="edit-emergencyContactPhone"
                  value={editFormData.emergencyContactPhone}
                  onChange={(e) => handleEditFormChange('emergencyContactPhone', e.target.value)}
                  placeholder="Enter emergency contact phone"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-emergencyContactRelation">Relation</Label>
                <Input
                  id="edit-emergencyContactRelation"
                  value={editFormData.emergencyContactRelation}
                  onChange={(e) => handleEditFormChange('emergencyContactRelation', e.target.value)}
                  placeholder="Enter relation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nomineeName">Nominee Name</Label>
                <Input
                  id="edit-nomineeName"
                  value={editFormData.nomineeName}
                  onChange={(e) => handleEditFormChange('nomineeName', e.target.value)}
                  placeholder="Enter nominee name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nomineeRelation">Nominee Relation</Label>
                <Input
                  id="edit-nomineeRelation"
                  value={editFormData.nomineeRelation}
                  onChange={(e) => handleEditFormChange('nomineeRelation', e.target.value)}
                  placeholder="Enter nominee relation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pantSize">Pant Size</Label>
                <Select 
                  value={editFormData.pantSize} 
                  onValueChange={(value) => handleEditFormChange('pantSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pant size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="28">28</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="32">32</SelectItem>
                    <SelectItem value="34">34</SelectItem>
                    <SelectItem value="36">36</SelectItem>
                    <SelectItem value="38">38</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-shirtSize">Shirt Size</Label>
                <Select 
                  value={editFormData.shirtSize} 
                  onValueChange={(value) => handleEditFormChange('shirtSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shirt size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                    <SelectItem value="XXL">XXL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-capSize">Cap Size</Label>
                <Select 
                  value={editFormData.capSize} 
                  onValueChange={(value) => handleEditFormChange('capSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cap size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-idCardIssued"
                      checked={editFormData.idCardIssued}
                      onChange={(e) => handleEditFormChange('idCardIssued', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="edit-idCardIssued">ID Card Issued</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-westcoatIssued"
                      checked={editFormData.westcoatIssued}
                      onChange={(e) => handleEditFormChange('westcoatIssued', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="edit-westcoatIssued">Westcoat Issued</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-apronIssued"
                      checked={editFormData.apronIssued}
                      onChange={(e) => handleEditFormChange('apronIssued', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="edit-apronIssued">Apron Issued</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="w-full sm:w-auto">
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Site History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Site Assignment History - {selectedEmployeeForHistory?.name}
            </DialogTitle>
            <DialogDescription>
              Employee ID: {selectedEmployeeForHistory?.employeeId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {selectedEmployeeForHistory?.siteHistory && selectedEmployeeForHistory.siteHistory.length > 0 ? (
              <div className="space-y-4">
                {selectedEmployeeForHistory.siteHistory.map((history, index) => {
                  const isLastEntry = index === selectedEmployeeForHistory.siteHistory.length - 1;
                  const hasLeftDate = history.leftDate !== undefined && history.leftDate !== null && history.leftDate !== '';
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">{history.siteName}</span>
                        {!hasLeftDate && isLastEntry && (
                          <Badge className="bg-green-100 text-green-800">Current Site</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Assigned Date:</span>
                          <div className="font-medium">
                            {history.assignedDate ? new Date(history.assignedDate).toLocaleDateString('en-IN') : 'Not specified'}
                          </div>
                        </div>
                        {hasLeftDate && (
                          <div>
                            <span className="text-muted-foreground">Left Date:</span>
                            <div className="font-medium">
                              {new Date(history.leftDate).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        )}
                        {hasLeftDate && history.daysWorked !== undefined && (
                          <div className="sm:col-span-2">
                            <span className="text-muted-foreground">Days Worked:</span>
                            <div className="font-medium text-green-600">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {history.daysWorked} days
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No site assignment history found for this employee.</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setHistoryDialogOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Documents - {selectedEmployeeForDocuments?.name} ({selectedEmployeeForDocuments?.employeeId})
            </DialogTitle>
          </DialogHeader>
          {selectedEmployeeForDocuments && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  KYC Documents
                </h4>
                {selectedEmployeeForDocuments.kycDocuments && selectedEmployeeForDocuments.kycDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedEmployeeForDocuments.kycDocuments.map((doc: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{doc.documentName}</p>
                              {doc.documentNumber && (
                                <p className="text-sm text-muted-foreground truncate">
                                  Number: {doc.documentNumber}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            {doc.verified ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600">
                                <XCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>No KYC documents uploaded for this employee</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setDocumentsDialogOpen(false);
                        setSelectedEmployeeForDocumentUpload(selectedEmployeeForDocuments);
                        setDocumentUploadDialogOpen(true);
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-4">Available Forms</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <h5 className="font-medium mb-2">ID Card</h5>
                    <p className="text-sm text-muted-foreground mb-3">Employee identification card</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        generateIDCard(selectedEmployeeForDocuments);
                        setDocumentsDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <h5 className="font-medium mb-2">Nominee Form</h5>
                    <p className="text-sm text-muted-foreground mb-3">PF nominee declaration</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        downloadNomineeForm(selectedEmployeeForDocuments);
                        setDocumentsDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <h5 className="font-medium mb-2">PF Form</h5>
                    <p className="text-sm text-muted-foreground mb-3">Provident fund declaration</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        downloadPFForm(selectedEmployeeForDocuments);
                        setDocumentsDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <h5 className="font-medium mb-2">ESIC Form</h5>
                    <p className="text-sm text-muted-foreground mb-3">Health insurance form</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        downloadESICForm(selectedEmployeeForDocuments);
                        setDocumentsDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <h5 className="font-medium mb-2">EPF Form 11</h5>
                    <p className="text-sm text-muted-foreground mb-3">Employee declaration form</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        handleOpenEPFForm11(selectedEmployeeForDocuments);
                        setDocumentsDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={documentUploadDialogOpen} onOpenChange={setDocumentUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-blue-600" />
              Upload KYC Documents - {selectedEmployeeForDocumentUpload?.name}
            </DialogTitle>
            <DialogDescription>
              Employee ID: {selectedEmployeeForDocumentUpload?.employeeId} | Department: {selectedEmployeeForDocumentUpload?.department}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployeeForDocumentUpload && (
            <DocumentUpload 
              employeeId={selectedEmployeeForDocumentUpload._id}
              employeeName={selectedEmployeeForDocumentUpload.name}
              existingDocuments={selectedEmployeeForDocumentUpload.kycDocuments || []}
              onDocumentUploaded={() => {
                handleDocumentUploaded();
                fetchEmployees();
              }}
              refreshTrigger={refreshDocuments}
            />
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setDocumentUploadDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EPF Form 11 Dialog */}
      <Dialog open={epfForm11DialogOpen} onOpenChange={setEpfForm11DialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              EPF Form 11 - Declaration Form
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              For Employee: <span className="font-semibold">{selectedEmployeeForEPF?.name}</span> 
              | Employee ID: <span className="font-semibold">{selectedEmployeeForEPF?.employeeId}</span>
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center border-b-2 border-black pb-4">
              <h2 className="text-xl font-bold">EPF Form 11 - Declaration Form</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">
                  1. Name of Member (Aadhar Name) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="memberName"
                  value={epfFormData.memberName}
                  onChange={(e) => handleEPFFormChange('memberName', e.target.value)}
                  placeholder="Enter full name as per Aadhar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherOrSpouseName">
                  2. Father's Name / Spouse's Name
                </Label>
                <Input
                  id="fatherOrSpouseName"
                  value={epfFormData.fatherOrSpouseName}
                  onChange={(e) => handleEPFFormChange('fatherOrSpouseName', e.target.value)}
                  placeholder="Enter father or spouse name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">3. Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={epfFormData.dateOfBirth}
                  onChange={(e) => handleEPFFormChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">4. Gender</Label>
                <Select value={epfFormData.gender} onValueChange={(value) => handleEPFFormChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Transgender">Transgender</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                <Input
                  id="aadharNumber"
                  value={epfFormData.aadharNumber}
                  onChange={(e) => handleEPFFormChange('aadharNumber', e.target.value)}
                  placeholder="Enter Aadhar number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number</Label>
                <Input
                  id="panNumber"
                  value={epfFormData.panNumber}
                  onChange={(e) => handleEPFFormChange('panNumber', e.target.value)}
                  placeholder="Enter PAN number"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 border-t">
              <Button onClick={handleSaveEPFForm} className="flex items-center gap-2 w-full sm:w-auto" disabled={isSavingEPF}>
                {isSavingEPF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSavingEPF ? "Saving..." : "Save Form"}
              </Button>
              <Button onClick={handlePrintEPFForm} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Print Form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => employeeToDelete && handleDeleteEmployee(employeeToDelete)} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupervisorEmployees;