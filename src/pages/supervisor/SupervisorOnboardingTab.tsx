import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Upload, Trash2, Camera, X, Save, Edit, Download, Loader2, UserCheck, User, Building, MapPin, Users, Check, Search, ChevronDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

// Define the API Base URL
const API_URL = process.env.NODE_ENV === 'development' 
  ? `https://${window.location.hostname}:5001/api` 
  : '/api';

// Types
interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  aadharNumber: string;
  department: string;
  position: string;
  joinDate?: string;
  dateOfJoining?: string;
  status: "active" | "inactive" | "left";
  salary: number | string;
  uanNumber?: string;
  uan?: string;
  esicNumber?: string;
  panNumber?: string;
  photo?: string;
  photoPublicId?: string;
  siteName?: string;
  dateOfBirth?: string;
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
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  numberOfChildren?: string | number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  pantSize?: string;
  shirtSize?: string;
  capSize?: string;
  idCardIssued?: boolean;
  westcoatIssued?: boolean;
  apronIssued?: boolean;
  employeeSignature?: string;
  authorizedSignature?: string;
  createdAt?: string;
  updatedAt?: string;
  isManager?: boolean;
  isSupervisor?: boolean;
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

interface Site {
  _id: string;
  name: string;
  clientName?: string;
  location?: string;
  status?: string;
  managerCount?: number;
  supervisorCount?: number;
  staffDeployment?: Array<{ role: string; count: number }>;
  totalStaff?: number;
  currentManagerCount?: number;
  currentSupervisorCount?: number;
  currentStaffCount?: number;
}

interface NewEmployeeForm {
  name: string;
  email: string;
  phone: string;
  aadharNumber: string;
  panNumber: string;
  esicNumber: string;
  uanNumber: string;
  siteName: string;
  dateOfBirth: string;
  dateOfJoining: string;
  dateOfExit: string;
  bloodGroup: string;
  gender?: string;
  maritalStatus?: string;
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
  salary: string;
  photo: File | string | null;
  employeeSignature: File | null;
  authorizedSignature: File | null;
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
  kycStatus?: "not_uploaded" | "uploaded_not_approved" | "uploaded_approved";
  transferRequestGenerated?: boolean;
  physicalClaimFiled?: boolean;
}

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
}

interface OnboardingTabProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  salaryStructures: SalaryStructure[];
  setSalaryStructures: React.Dispatch<React.SetStateAction<SalaryStructure[]>>;
  sites?: Site[];
  newJoinees?: Employee[];
  setNewJoinees?: React.Dispatch<React.SetStateAction<Employee[]>>;
  leftEmployees?: Employee[];
  setLeftEmployees?: React.Dispatch<React.SetStateAction<Employee[]>>;
  currentUser?: User;
}

// Departments array
const departments = [
  "Housekeeping", 
  "Security", 
  "Parking Management", 
  "Waste Management", 
  "STP Tank Cleaning", 
  "Consumables Management",
  "Administration",
  "HR",
  "Finance",
  "IT",
  "Operations",
  "Maintenance"
];

// FormField Component
const FormField = ({ 
  label, 
  id, 
  children, 
  required = false 
}: { 
  label: string; 
  id?: string; 
  children: React.ReactNode; 
  required?: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
  </div>
);

// Reset form function
const resetNewEmployeeForm = () => ({
  name: "",
  email: "",
  phone: "",
  aadharNumber: "",
  panNumber: "",
  esicNumber: "",
  uanNumber: "",
  siteName: "",
  dateOfBirth: "",
  dateOfJoining: new Date().toISOString().split("T")[0],
  dateOfExit: "",
  bloodGroup: "",
  permanentAddress: "",
  permanentPincode: "",
  localAddress: "",
  localPincode: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  fatherName: "",
  motherName: "",
  spouseName: "",
  numberOfChildren: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  nomineeName: "",
  nomineeRelation: "",
  pantSize: "",
  shirtSize: "",
  capSize: "",
  idCardIssued: false,
  westcoatIssued: false,
  apronIssued: false,
  department: "",
  position: "",
  salary: "",
  photo: null,
  employeeSignature: null,
  authorizedSignature: null
});

const SupervisorOnboardingTab = ({ 
  employees, 
  setEmployees, 
  salaryStructures, 
  setSalaryStructures,
  sites = [],
  newJoinees = [],
  setNewJoinees,
  leftEmployees,
  setLeftEmployees,
  currentUser
}: OnboardingTabProps) => {
  const [loading, setLoading] = useState(false);
  const [isSavingEPF, setIsSavingEPF] = useState(false);
  const [activeTab, setActiveTab] = useState("onboarding");
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>(resetNewEmployeeForm());
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [createdEmployeeData, setCreatedEmployeeData] = useState<Employee | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Site dropdown states
  const [siteSearch, setSiteSearch] = useState("");
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [filteredSites, setFilteredSites] = useState<Site[]>(sites);
  const [selectedSiteDetails, setSelectedSiteDetails] = useState<Site | null>(null);
  const [currentSiteStaffCount, setCurrentSiteStaffCount] = useState<number>(0);
  const [availableStaffPositions, setAvailableStaffPositions] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureEmployeeRef = useRef<HTMLInputElement>(null);
  const signatureAuthorizedRef = useRef<HTMLInputElement>(null);
  const documentUploadRef = useRef<HTMLInputElement>(null);
  const siteSearchRef = useRef<HTMLInputElement>(null);
  
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
    kycStatus: "not_uploaded",
    transferRequestGenerated: false,
    physicalClaimFiled: false
  });

  // Filter sites based on search
  useEffect(() => {
    if (!siteSearch.trim()) {
      setFilteredSites(sites);
      return;
    }

    const searchTerm = siteSearch.toLowerCase();
    const filtered = sites.filter(site => 
      site.name.toLowerCase().includes(searchTerm) ||
      (site.clientName && site.clientName.toLowerCase().includes(searchTerm)) ||
      (site.location && site.location.toLowerCase().includes(searchTerm))
    );
    setFilteredSites(filtered);
  }, [siteSearch, sites]);

  // Calculate regular staff count for a site
  const calculateRegularStaffCount = (site: Site | null): number => {
    if (!site) return 0;
    
    if (site.staffDeployment && Array.isArray(site.staffDeployment)) {
      const totalStaff = site.staffDeployment.reduce((sum, item) => sum + (item.count || 0), 0);
      const managerCount = site.staffDeployment.find(item => item.role?.toLowerCase() === "manager")?.count || 0;
      const supervisorCount = site.staffDeployment.find(item => item.role?.toLowerCase() === "supervisor")?.count || 0;
      return totalStaff - managerCount - supervisorCount;
    }
    
    const totalStaff = site.totalStaff || 0;
    const managerCount = site.managerCount || 0;
    const supervisorCount = site.supervisorCount || 0;
    return totalStaff - managerCount - supervisorCount;
  };

  // Calculate current staff count for selected site
  useEffect(() => {
    if (newEmployee.siteName && sites.length > 0) {
      const site = sites.find(s => s.name === newEmployee.siteName);
      setSelectedSiteDetails(site || null);
      
      if (site) {
        const siteEmployees = employees.filter(emp => 
          emp.siteName === site.name && 
          emp.status === "active"
        );
        setCurrentSiteStaffCount(siteEmployees.length);
        
        const regularStaffCount = calculateRegularStaffCount(site);
        setAvailableStaffPositions(regularStaffCount);
      }
    } else {
      setSelectedSiteDetails(null);
      setCurrentSiteStaffCount(0);
      setAvailableStaffPositions(0);
    }
  }, [newEmployee.siteName, sites, employees]);

  // Check if site has available positions
  const hasAvailablePositions = (site: Site | null): boolean => {
    if (!site) return false;
    const regularStaffCount = calculateRegularStaffCount(site);
    const siteEmployees = employees.filter(emp => 
      emp.siteName === site.name && 
      emp.status === "active"
    );
    return siteEmployees.length < regularStaffCount;
  };

  // Handle site selection
  const handleSiteSelect = (site: Site) => {
    if (!hasAvailablePositions(site)) {
      toast.error(`Cannot select "${site.name}": Site has reached its regular staff capacity.`);
      return;
    }
    setNewEmployee(prev => ({ ...prev, siteName: site.name }));
    setShowSiteDropdown(false);
    setSiteSearch("");
    toast.success(`Selected site: ${site.name}`);
  };

  // Clear site selection
  const handleClearSite = () => {
    setNewEmployee(prev => ({ ...prev, siteName: "" }));
    setSiteSearch("");
  };

  // Get available positions count
  const getAvailablePositions = (site: Site | null): number => {
    if (!site) return 0;
    const regularStaffCount = calculateRegularStaffCount(site);
    const siteEmployees = employees.filter(emp => 
      emp.siteName === site.name && 
      emp.status === "active"
    );
    return Math.max(0, regularStaffCount - siteEmployees.length);
  };

  // Site Dropdown Component
  const SiteDropdown = () => (
    <div className="relative w-full">
      <div className="relative">
        <div 
          className={`flex items-center justify-between w-full px-3 py-2.5 text-sm border rounded-md cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
            newEmployee.siteName && selectedSiteDetails && !hasAvailablePositions(selectedSiteDetails) ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
          }`}
          onClick={() => {
            setShowSiteDropdown(!showSiteDropdown);
            if (!showSiteDropdown) {
              setTimeout(() => siteSearchRef.current?.focus(), 100);
            }
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {newEmployee.siteName ? (
              <>
                <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="truncate font-medium text-gray-900">
                  {newEmployee.siteName}
                </span>
              </>
            ) : (
              <span className="text-gray-500 truncate">Select a site...</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {newEmployee.siteName && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSite();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showSiteDropdown ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        {showSiteDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search Header */}
            <div className="sticky top-0 bg-white border-b p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={siteSearchRef}
                  type="text"
                  placeholder="Search sites..."
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  className="pl-9 w-full text-sm h-9"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Sites List */}
            <div className="overflow-y-auto max-h-64">
              {filteredSites.length === 0 ? (
                <div className="p-6 text-center">
                  <Search className="h-8 w-8 mx-auto text-gray-300" />
                  <p className="text-sm font-medium text-gray-700 mt-2">No sites found</p>
                </div>
              ) : (
                filteredSites.map((site) => {
                  const availablePositions = getAvailablePositions(site);
                  const isFull = availablePositions <= 0;
                  const siteEmployees = employees.filter(emp => 
                    emp.siteName === site.name && 
                    emp.status === "active"
                  );
                  const regularStaffCount = calculateRegularStaffCount(site);
                  
                  return (
                    <div
                      key={site._id}
                      className={`px-3 py-3 text-sm cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        newEmployee.siteName === site.name ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      } ${isFull ? 'opacity-60' : ''}`}
                      onClick={() => !isFull && handleSiteSelect(site)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${site.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={`font-medium truncate ${newEmployee.siteName === site.name ? 'text-blue-700' : 'text-gray-900'}`}>
                              {site.name}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Building className="h-3 w-3" />
                              <span className="truncate">Client: {site.clientName || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{site.location || 'Location not specified'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Users className="h-3 w-3" />
                              <span>Regular Staff: {regularStaffCount}</span>
                              <span className="text-gray-400 mx-1">|</span>
                              <span className={isFull ? 'text-red-600 font-medium' : 'text-green-600'}>
                                Available: {availablePositions}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Current: {siteEmployees.length}</span>
                              <span className="text-gray-300">|</span>
                              <span>Capacity: {regularStaffCount}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-2 flex-shrink-0">
                          <Badge 
                            variant={site.status === 'active' ? "default" : "secondary"}
                            className={`text-xs ${site.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {site.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                          {isFull && (
                            <Badge variant="destructive" className="text-xs mt-1 block text-center">
                              Full
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {isFull && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-1 rounded">
                          No regular staff positions available
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Click outside to close dropdown */}
      {showSiteDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSiteDropdown(false)}
        />
      )}
      
      {/* Site Status Display */}
      {newEmployee.siteName && selectedSiteDetails && (
        <div className="mt-2 space-y-2">
          <div className={`p-3 rounded-md ${
            currentSiteStaffCount >= availableStaffPositions 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Staff Status:</span>
              <Badge variant={currentSiteStaffCount >= availableStaffPositions ? "destructive" : "default"}>
                {currentSiteStaffCount}/{availableStaffPositions} Staff
              </Badge>
            </div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Regular Staff Capacity:</span>
                <span className="font-medium">{availableStaffPositions}</span>
              </div>
              <div className="flex justify-between">
                <span>Currently Onboarded:</span>
                <span className="font-medium">{currentSiteStaffCount}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Available Positions:</span>
                <span className={availableStaffPositions - currentSiteStaffCount <= 0 ? 'text-red-600' : 'text-green-600'}>
                  {Math.max(0, availableStaffPositions - currentSiteStaffCount)}
                </span>
              </div>
            </div>
          </div>
          
          {currentSiteStaffCount >= availableStaffPositions && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              ⚠️ This site has reached its regular staff capacity. No more regular staff can be onboarded.
            </div>
          )}
        </div>
      )}
      
      {!newEmployee.siteName && (
        <div className="text-xs text-amber-600 mt-1">
          Required field. Select from available sites.
        </div>
      )}
    </div>
  );

  // Camera functions - FIXED
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(error => {
            console.error("Error playing video:", error);
          });
        };
      }
      
      setShowCamera(true);
      setCapturedImage(null);
      toast.success("Camera started successfully");
      
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      if (error.name === 'NotAllowedError') {
        toast.error("Camera permission denied. Please allow camera access.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No camera found on this device.");
      } else {
        toast.error("Cannot access camera. Please check permissions.");
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
        toast.success("Photo captured successfully!");
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const useCapturedPhoto = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `employee-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setNewEmployee({...newEmployee, photo: file});
          const previewUrl = URL.createObjectURL(file);
          setPhotoPreview(previewUrl);
          toast.success("Photo added successfully!");
          setShowCamera(false);
          setCapturedImage(null);
        })
        .catch(error => {
          console.error("Error converting photo:", error);
          toast.error("Error processing photo. Please try again.");
        });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setNewEmployee({...newEmployee, photo: file});
      toast.success("Photo selected successfully!");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setNewEmployee({...newEmployee, photo: null});
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleAddEmployee = async () => {
    // Validate required fields (email is optional)
    const requiredFields = [
      { field: newEmployee.name, name: 'Name' },
      { field: newEmployee.aadharNumber, name: 'Aadhar Number' },
      { field: newEmployee.position, name: 'Position' },
      { field: newEmployee.department, name: 'Department' },
      { field: newEmployee.siteName, name: 'Site Name' },
      { field: newEmployee.salary, name: 'Salary' }
    ];

    const missingFields = requiredFields
      .filter(item => !item.field || item.field.trim() === '')
      .map(item => item.name);

    if (missingFields.length > 0) {
      toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Generate email if not provided
    let finalEmail = newEmployee.email?.trim() || '';
    if (!finalEmail && newEmployee.name) {
      const nameParts = newEmployee.name.toLowerCase().split(' ');
      const firstName = nameParts[0]?.replace(/[^a-z]/g, '') || 'employee';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].replace(/[^a-z]/g, '') : '';
      const randomNum = Math.floor(100 + Math.random() * 900);
      finalEmail = `${firstName}${lastName ? '.' + lastName : ''}${randomNum}@skenterprises.com`.toLowerCase();
    } else if (!finalEmail) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      finalEmail = `employee${randomNum}@skenterprises.com`.toLowerCase();
    }

    // Validate email format if provided
    if (finalEmail && finalEmail.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    // Validate phone number - optional
    if (newEmployee.phone && !/^\d{10}$/.test(newEmployee.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    // Validate Aadhar number
    if (!/^\d{12}$/.test(newEmployee.aadharNumber)) {
      toast.error("Please enter a valid 12-digit Aadhar number");
      return;
    }

    // Validate PAN number if provided
    if (newEmployee.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(newEmployee.panNumber.toUpperCase())) {
      toast.error("Please enter a valid PAN number (format: ABCDE1234F)");
      return;
    }

    // Validate salary
    const salaryValue = parseFloat(newEmployee.salary);
    if (isNaN(salaryValue) || salaryValue <= 0) {
      toast.error("Please enter a valid salary amount greater than 0");
      return;
    }

    // Validate site capacity
    if (selectedSiteDetails) {
      const regularStaffCount = calculateRegularStaffCount(selectedSiteDetails);
      const siteEmployees = employees.filter(emp => 
        emp.siteName === selectedSiteDetails.name && 
        emp.status === "active"
      );
      
      if (siteEmployees.length >= regularStaffCount) {
        toast.error(`Cannot onboard employee: Site "${selectedSiteDetails.name}" has reached its regular staff capacity (${regularStaffCount} staff).`);
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();

      if (newEmployee.photo instanceof File) {
        formData.append('photo', newEmployee.photo);
      }

      if (newEmployee.employeeSignature instanceof File) {
        formData.append('employeeSignature', newEmployee.employeeSignature);
      }

      if (newEmployee.authorizedSignature instanceof File) {
        formData.append('authorizedSignature', newEmployee.authorizedSignature);
      }

      const employeeDataToSend = {
        name: newEmployee.name.trim(),
        email: finalEmail,
        phone: newEmployee.phone?.trim() || '',
        aadharNumber: newEmployee.aadharNumber.replace(/\s/g, ''),
        panNumber: newEmployee.panNumber?.toUpperCase().replace(/\s/g, '') || '',
        esicNumber: newEmployee.esicNumber?.trim() || '',
        uanNumber: newEmployee.uanNumber?.trim() || '',
        siteName: newEmployee.siteName.trim(),
        dateOfBirth: newEmployee.dateOfBirth || '',
        dateOfJoining: newEmployee.dateOfJoining || new Date().toISOString().split("T")[0],
        dateOfExit: newEmployee.dateOfExit || '',
        bloodGroup: newEmployee.bloodGroup || '',
        gender: newEmployee.gender || '',
        maritalStatus: newEmployee.maritalStatus || '',
        permanentAddress: newEmployee.permanentAddress?.trim() || '',
        permanentPincode: newEmployee.permanentPincode?.trim() || '',
        localAddress: newEmployee.localAddress?.trim() || '',
        localPincode: newEmployee.localPincode?.trim() || '',
        bankName: newEmployee.bankName?.trim() || '',
        accountNumber: newEmployee.accountNumber?.replace(/\s/g, '') || '',
        ifscCode: newEmployee.ifscCode?.toUpperCase().replace(/\s/g, '') || '',
        branchName: newEmployee.branchName?.trim() || '',
        fatherName: newEmployee.fatherName?.trim() || '',
        motherName: newEmployee.motherName?.trim() || '',
        spouseName: newEmployee.spouseName?.trim() || '',
        numberOfChildren: newEmployee.numberOfChildren?.trim() || '',
        emergencyContactName: newEmployee.emergencyContactName?.trim() || '',
        emergencyContactPhone: newEmployee.emergencyContactPhone?.trim() || '',
        emergencyContactRelation: newEmployee.emergencyContactRelation?.trim() || '',
        nomineeName: newEmployee.nomineeName?.trim() || '',
        nomineeRelation: newEmployee.nomineeRelation?.trim() || '',
        pantSize: newEmployee.pantSize || '',
        shirtSize: newEmployee.shirtSize || '',
        capSize: newEmployee.capSize || '',
        idCardIssued: newEmployee.idCardIssued,
        westcoatIssued: newEmployee.westcoatIssued,
        apronIssued: newEmployee.apronIssued,
        department: newEmployee.department.trim(),
        position: newEmployee.position.trim(),
        salary: salaryValue.toString()
      };

      Object.entries(employeeDataToSend).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_URL}/employees`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to create employee");
      }

      toast.success("Employee created successfully!");
      
      const createdEmployee = data.employee || data.data || data;
      
      if (!createdEmployee) {
        throw new Error('No employee data returned from server');
      }
      
      const processedEmployee: Employee = {
        _id: createdEmployee._id,
        employeeId: createdEmployee.employeeId,
        name: createdEmployee.name,
        email: createdEmployee.email,
        phone: createdEmployee.phone,
        aadharNumber: createdEmployee.aadharNumber,
        department: createdEmployee.department,
        position: createdEmployee.position,
        joinDate: createdEmployee.joinDate || createdEmployee.dateOfJoining,
        dateOfJoining: createdEmployee.dateOfJoining,
        status: createdEmployee.status || 'active',
        salary: createdEmployee.salary || 0,
        uanNumber: createdEmployee.uanNumber,
        uan: createdEmployee.uan,
        esicNumber: createdEmployee.esicNumber,
        panNumber: createdEmployee.panNumber,
        photo: createdEmployee.photo,
        photoPublicId: createdEmployee.photoPublicId,
        siteName: createdEmployee.siteName,
        dateOfBirth: createdEmployee.dateOfBirth,
        bloodGroup: createdEmployee.bloodGroup,
        gender: createdEmployee.gender,
        maritalStatus: createdEmployee.maritalStatus,
        permanentAddress: createdEmployee.permanentAddress,
        permanentPincode: createdEmployee.permanentPincode,
        localAddress: createdEmployee.localAddress,
        localPincode: createdEmployee.localPincode,
        bankName: createdEmployee.bankName,
        accountNumber: createdEmployee.accountNumber,
        ifscCode: createdEmployee.ifscCode,
        branchName: createdEmployee.branchName,
        fatherName: createdEmployee.fatherName,
        motherName: createdEmployee.motherName,
        spouseName: createdEmployee.spouseName,
        numberOfChildren: createdEmployee.numberOfChildren,
        emergencyContactName: createdEmployee.emergencyContactName,
        emergencyContactPhone: createdEmployee.emergencyContactPhone,
        emergencyContactRelation: createdEmployee.emergencyContactRelation,
        nomineeName: createdEmployee.nomineeName,
        nomineeRelation: createdEmployee.nomineeRelation,
        pantSize: createdEmployee.pantSize,
        shirtSize: createdEmployee.shirtSize,
        capSize: createdEmployee.capSize,
        idCardIssued: createdEmployee.idCardIssued || false,
        westcoatIssued: createdEmployee.westcoatIssued || false,
        apronIssued: createdEmployee.apronIssued || false,
        employeeSignature: createdEmployee.employeeSignature,
        authorizedSignature: createdEmployee.authorizedSignature,
        createdAt: createdEmployee.createdAt,
        updatedAt: createdEmployee.updatedAt
      };
      
      setEmployees(prev => [...prev, processedEmployee]);
      
      setNewEmployee(resetNewEmployeeForm());
      setUploadedDocuments([]);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
      
      initializeEPFForm(processedEmployee);

    } catch (error: any) {
      console.error("Error creating employee:", error);
      toast.error(error.message || "Error creating employee. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializeEPFForm = (employee: Employee) => {
    setCreatedEmployeeData(employee);
    
    const today = new Date().toISOString().split("T")[0];
    
    let salaryValue = 0;
    if (employee.salary) {
      salaryValue = typeof employee.salary === 'string' 
        ? parseFloat(employee.salary) 
        : Number(employee.salary) || 0;
    }
    
    const epfData: EPFForm11Data = {
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
      previousUAN: employee.uanNumber || employee.uan || "",
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
      enrolledDate: employee.joinDate || employee.dateOfJoining || today,
      firstEmploymentWages: salaryValue.toString() || "0",
      epfMemberBeforeSep2014: false,
      epfAmountWithdrawn: false,
      epsAmountWithdrawn: false,
      epsAmountWithdrawnAfterSep2014: false,
      declarationDate: today,
      declarationPlace: "Mumbai",
      employerDeclarationDate: today,
      kycStatus: "not_uploaded",
      transferRequestGenerated: false,
      physicalClaimFiled: false
    };
    
    setEpfFormData(epfData);
    setActiveTab("epf-form");
    toast.success("Employee created successfully! Please fill EPF Form 11.");
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newDocuments = Array.from(files);
      setUploadedDocuments(prev => [...prev, ...newDocuments]);
      toast.success(`${newDocuments.length} document(s) uploaded successfully!`);
    }
  };

  const handleRemoveDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSignatureUpload = (type: 'employee' | 'authorized', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'employee') {
        setNewEmployee({...newEmployee, employeeSignature: file});
      } else {
        setNewEmployee({...newEmployee, authorizedSignature: file});
      }
      toast.success(`${type === 'employee' ? 'Employee' : 'Authorized'} signature uploaded successfully!`);
    }
  };

  const handleEPFFormChange = (field: keyof EPFForm11Data, value: any) => {
    setEpfFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEPFForm = async () => {
    if (!epfFormData.memberName || !epfFormData.aadharNumber || !createdEmployeeData) {
      toast.error("Please fill all required fields and select an employee");
      return;
    }

    if (!/^\d{12}$/.test(epfFormData.aadharNumber)) {
      toast.error("Please enter a valid 12-digit Aadhar number");
      return;
    }

    if (epfFormData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(epfFormData.panNumber)) {
      toast.error("Please enter a valid PAN number (format: ABCDE1234F)");
      return;
    }

    try {
      setIsSavingEPF(true);
      
      const employeeId = createdEmployeeData._id;
      
      if (!employeeId) {
        toast.error("Invalid employee data - missing ID");
        return;
      }
      
      const response = await fetch(`${API_URL}/epf-forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...epfFormData,
          employeeId: employeeId,
          employeeNumber: createdEmployeeData.employeeId,
          firstEmploymentWages: parseFloat(epfFormData.firstEmploymentWages) || 0,
          enrolledDate: epfFormData.enrolledDate || createdEmployeeData.joinDate || createdEmployeeData.dateOfJoining || new Date().toISOString().split('T')[0],
          declarationDate: epfFormData.declarationDate || new Date().toISOString().split('T')[0],
          employerDeclarationDate: epfFormData.employerDeclarationDate || new Date().toISOString().split('T')[0]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save EPF Form");
      }

      if (data.success) {
        toast.success("EPF Form saved successfully!");
        setActiveTab("onboarding");
        setCreatedEmployeeData(null);
        setEpfFormData({
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
          employerDeclarationDate: new Date().toISOString().split("T")[0]
        });
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

  const handlePrintEPFForm = () => {
    if (!createdEmployeeData) return;
    
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
            .section-title { background: #f0f0f0; padding: 8px; font-weight: bold; }
            .field-row { display: flex; margin-bottom: 8px; }
            .label { font-weight: bold; width: 200px; }
            .value { flex: 1; border-bottom: 1px solid #000; padding: 2px 5px; }
            .signature-area { margin-top: 30px; border-top: 1px solid #000; padding-top: 15px; }
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
                <div class="label">Place:</div>
                <div class="value">${epfFormData.declarationPlace}</div>
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

  // Calculate onboarding stats
  const totalSites = sites.length;
  const sitesWithCapacity = sites.filter(site => getAvailablePositions(site) > 0).length;
  const totalAvailablePositions = sites.reduce((sum, site) => sum + getAvailablePositions(site), 0);
  const totalOnboarded = employees.filter(emp => emp.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Capture Employee Photo</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { 
                  setShowCamera(false); 
                  stopCamera(); 
                  setCapturedImage(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              {!capturedImage ? (
                <>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={capturePhoto} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { 
                        setShowCamera(false); 
                        stopCamera(); 
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={capturedImage} 
                      alt="Captured" 
                      className="w-full h-64 object-contain"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={useCapturedPhoto} 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Use This Photo
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={retakePhoto}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Retake
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Stats Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{totalSites}</div>
              <div className="text-sm text-muted-foreground">Your Sites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{sitesWithCapacity}</div>
              <div className="text-sm text-muted-foreground">Sites with Openings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-700">{totalAvailablePositions}</div>
              <div className="text-sm text-muted-foreground">Available Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">{totalOnboarded}</div>
              <div className="text-sm text-muted-foreground">Total Onboarded</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Employee Onboarding
          </TabsTrigger>
          <TabsTrigger value="epf-form" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            EPF Form 11
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Digital Onboarding & Document Verification</span>
                <Badge variant="outline" className="text-sm">
                  {sitesWithCapacity} sites available for onboarding
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-gray-300 p-4 md:p-6 mb-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-center mb-4">
                      <div className="text-xl md:text-2xl font-bold">SK ENTERPRISES</div>
                      <div className="text-xs md:text-sm text-muted-foreground">Housekeeping • Parking • Waste Management</div>
                      <div className="text-lg font-semibold mt-2">Employee Joining Form</div>
                    </div>
                    
                    <div className="flex justify-between items-start flex-col md:flex-row gap-4">
                      <div className="border-2 border-dashed border-gray-400 w-20 h-24 md:w-24 md:h-32 flex items-center justify-center text-xs text-muted-foreground text-center p-2 mx-auto md:mx-0">
                        {photoPreview || (newEmployee.photo && typeof newEmployee.photo === 'string') ? (
                          <img 
                            src={photoPreview || newEmployee.photo as string} 
                            alt="Employee" 
                            className="w-full h-full object-cover"
                          />
                        ) : newEmployee.photo instanceof File ? (
                          <img 
                            src={URL.createObjectURL(newEmployee.photo)} 
                            alt="Employee" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "Photo"
                        )}
                      </div>
                      
                      <div className="text-center md:text-right space-y-2 w-full md:w-auto">
                        <div className="text-sm font-semibold">New Joining</div>
                        <div className="text-sm">
                          Code No. / Ref No.: <span className="border-b border-gray-400 inline-block min-w-[100px]">Auto-generated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Employee Details</h3>
                  
                  <div className="space-y-4">
                    <Label>Employee Photo</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={startCamera}
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Take Photo
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Photo
                      </Button>
                      
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    
                    {newEmployee.photo && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-green-600">Photo selected</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePhoto}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Site Name" id="siteName" required>
                      <SiteDropdown />
                      {sites.length === 0 && (
                        <div className="text-xs text-amber-600 mt-1">
                          No sites are assigned to you. Please contact administrator.
                        </div>
                      )}
                      {sites.length > 0 && sitesWithCapacity === 0 && (
                        <div className="text-xs text-amber-600 mt-1">
                          All sites have reached their regular staff capacity.
                        </div>
                      )}
                    </FormField>
                    
                    <FormField label="Name" id="name" required>
                      <Input
                        id="name"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                        placeholder="Enter full name"
                        required
                      />
                    </FormField>
                    
                    <FormField label="Date of Birth" id="dateOfBirth">
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newEmployee.dateOfBirth}
                        onChange={(e) => setNewEmployee({...newEmployee, dateOfBirth: e.target.value})}
                      />
                    </FormField>
                    
                    <FormField label="Date of Joining" id="dateOfJoining">
                      <Input
                        id="dateOfJoining"
                        type="date"
                        value={newEmployee.dateOfJoining}
                        onChange={(e) => setNewEmployee({...newEmployee, dateOfJoining: e.target.value})}
                      />
                    </FormField>
                    
                    <FormField label="Date of Exit" id="dateOfExit">
                      <Input
                        id="dateOfExit"
                        type="date"
                        value={newEmployee.dateOfExit}
                        onChange={(e) => setNewEmployee({...newEmployee, dateOfExit: e.target.value})}
                      />
                    </FormField>
                    
                    <FormField label="Contact No." id="phone">
                      <Input
                        id="phone"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        placeholder="Enter 10-digit phone number (optional)"
                        maxLength={10}
                      />
                    </FormField>

                    <FormField label="Blood Group" id="bloodGroup">
                      <Select 
                        value={newEmployee.bloodGroup || ""} 
                        onValueChange={(value) => setNewEmployee({...newEmployee, bloodGroup: value === "" ? null : value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group (optional)" />
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
                    </FormField>
                    
                    <FormField label="Email" id="email">
                      <Input
                        id="email"
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        placeholder="Enter email address (optional)"
                      />
                    </FormField>
                    
                    <FormField label="Aadhar Number" id="aadharNumber" required>
                      <Input
                        id="aadharNumber"
                        value={newEmployee.aadharNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, aadharNumber: e.target.value})}
                        placeholder="Enter 12-digit Aadhar number"
                        required
                        maxLength={12}
                      />
                    </FormField>
                    
                    <FormField label="PAN Number" id="panNumber">
                      <Input
                        id="panNumber"
                        value={newEmployee.panNumber}
                        onChange={(e) => setNewEmployee({ ...newEmployee, panNumber: e.target.value.toUpperCase() })}
                        placeholder="Enter PAN number (Optional)"
                        maxLength={10}
                        className="uppercase"
                      />
                    </FormField>
                    
                    <FormField label="ESIC Number" id="esicNumber">
                      <Input
                        id="esicNumber"
                        value={newEmployee.esicNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, esicNumber: e.target.value})}
                        placeholder="Enter ESIC number"
                      />
                    </FormField>

                    <FormField label="PF Number / UAN" id="uanNumber">
                      <Input
                        id="uanNumber"
                        value={newEmployee.uanNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, uanNumber: e.target.value})}
                        placeholder="Enter PF number or UAN"
                      />
                    </FormField>

                    <FormField label="Gender" id="gender">
                      <Select 
                        value={newEmployee.gender} 
                        onValueChange={(value) => setNewEmployee({...newEmployee, gender: value})}
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
                    </FormField>

                    <FormField label="Marital Status" id="maritalStatus">
                      <Select 
                        value={newEmployee.maritalStatus} 
                        onValueChange={(value) => setNewEmployee({...newEmployee, maritalStatus: value})}
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
                    </FormField>
                  </div>
                  
                  <FormField label="Permanent Address" id="permanentAddress">
                    <Textarea
                      id="permanentAddress"
                      value={newEmployee.permanentAddress}
                      onChange={(e) => setNewEmployee({...newEmployee, permanentAddress: e.target.value})}
                      placeholder="Enter permanent address"
                      rows={3}
                    />
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Pin Code" id="permanentPincode">
                      <Input
                        id="permanentPincode"
                        value={newEmployee.permanentPincode}
                        onChange={(e) => setNewEmployee({...newEmployee, permanentPincode: e.target.value})}
                        placeholder="Enter pin code"
                        maxLength={6}
                      />
                    </FormField>
                  </div>
                  
                  <FormField label="Local Address" id="localAddress">
                    <Textarea
                      id="localAddress"
                      value={newEmployee.localAddress}
                      onChange={(e) => setNewEmployee({...newEmployee, localAddress: e.target.value})}
                      placeholder="Enter local address"
                      rows={3}
                    />
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Pin Code" id="localPincode">
                      <Input
                        id="localPincode"
                        value={newEmployee.localPincode}
                        onChange={(e) => setNewEmployee({...newEmployee, localPincode: e.target.value})}
                        placeholder="Enter pin code"
                        maxLength={6}
                      />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Bank Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Bank Name" id="bankName">
                      <Input
                        id="bankName"
                        value={newEmployee.bankName}
                        onChange={(e) => setNewEmployee({...newEmployee, bankName: e.target.value})}
                        placeholder="Enter bank name"
                      />
                    </FormField>
                    
                    <FormField label="Account Number" id="accountNumber">
                      <Input
                        id="accountNumber"
                        value={newEmployee.accountNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, accountNumber: e.target.value})}
                        placeholder="Enter account number"
                      />
                    </FormField>
                    
                    <FormField label="IFSC Code" id="ifscCode">
                      <Input
                        id="ifscCode"
                        value={newEmployee.ifscCode}
                        onChange={(e) => setNewEmployee({ ...newEmployee, ifscCode: e.target.value.toUpperCase() })}
                        placeholder="Enter IFSC code (Optional)"
                        className="uppercase"
                      />
                    </FormField>
                    
                    <FormField label="Branch Name" id="branchName">
                      <Input
                        id="branchName"
                        value={newEmployee.branchName}
                        onChange={(e) => setNewEmployee({...newEmployee, branchName: e.target.value})}
                        placeholder="Enter branch name"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Family Details for ESIC</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Father's Name" id="fatherName">
                      <Input
                        id="fatherName"
                        value={newEmployee.fatherName}
                        onChange={(e) => setNewEmployee({...newEmployee, fatherName: e.target.value})}
                        placeholder="Enter father's name"
                      />
                    </FormField>
                    
                    <FormField label="Mother's Name" id="motherName">
                      <Input
                        id="motherName"
                        value={newEmployee.motherName}
                        onChange={(e) => setNewEmployee({...newEmployee, motherName: e.target.value})}
                        placeholder="Enter mother's name"
                      />
                    </FormField>
                    
                    <FormField label="Spouse Name" id="spouseName">
                      <Input
                        id="spouseName"
                        value={newEmployee.spouseName}
                        onChange={(e) => setNewEmployee({...newEmployee, spouseName: e.target.value})}
                        placeholder="Enter spouse name"
                      />
                    </FormField>
                    
                    <FormField label="Number of Children" id="numberOfChildren">
                      <Input
                        id="numberOfChildren"
                        type="number"
                        value={newEmployee.numberOfChildren}
                        onChange={(e) => setNewEmployee({...newEmployee, numberOfChildren: e.target.value})}
                        placeholder="Enter number of children"
                        min="0"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Emergency Contact Name" id="emergencyContactName">
                      <Input
                        id="emergencyContactName"
                        value={newEmployee.emergencyContactName}
                        onChange={(e) => setNewEmployee({...newEmployee, emergencyContactName: e.target.value})}
                        placeholder="Enter emergency contact name"
                      />
                    </FormField>
                    
                    <FormField label="Emergency Contact Phone" id="emergencyContactPhone">
                      <Input
                        id="emergencyContactPhone"
                        value={newEmployee.emergencyContactPhone}
                        onChange={(e) => setNewEmployee({...newEmployee, emergencyContactPhone: e.target.value})}
                        placeholder="Enter emergency contact phone"
                        maxLength={10}
                      />
                    </FormField>
                    
                    <FormField label="Relation" id="emergencyContactRelation">
                      <Input
                        id="emergencyContactRelation"
                        value={newEmployee.emergencyContactRelation}
                        onChange={(e) => setNewEmployee({...newEmployee, emergencyContactRelation: e.target.value})}
                        placeholder="Enter relation"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Nominee Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Nominee Name" id="nomineeName">
                      <Input
                        id="nomineeName"
                        value={newEmployee.nomineeName}
                        onChange={(e) => setNewEmployee({...newEmployee, nomineeName: e.target.value})}
                        placeholder="Enter nominee name"
                      />
                    </FormField>
                    
                    <FormField label="Nominee Relation" id="nomineeRelation">
                      <Input
                        id="nomineeRelation"
                        value={newEmployee.nomineeRelation}
                        onChange={(e) => setNewEmployee({...newEmployee, nomineeRelation: e.target.value})}
                        placeholder="Enter nominee relation"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Uniform Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Pant Size" id="pantSize">
                      <Select value={newEmployee.pantSize} onValueChange={(value) => setNewEmployee({...newEmployee, pantSize: value})}>
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
                    </FormField>
                    
                    <FormField label="Shirt Size" id="shirtSize">
                      <Select value={newEmployee.shirtSize} onValueChange={(value) => setNewEmployee({...newEmployee, shirtSize: value})}>
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
                    </FormField>
                    
                    <FormField label="Cap Size" id="capSize">
                      <Select value={newEmployee.capSize} onValueChange={(value) => setNewEmployee({...newEmployee, capSize: value})}>
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
                    </FormField>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="idCardIssued"
                        checked={newEmployee.idCardIssued}
                        onChange={(e) => setNewEmployee({...newEmployee, idCardIssued: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="idCardIssued">ID Card Issued</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="westcoatIssued"
                        checked={newEmployee.westcoatIssued}
                        onChange={(e) => setNewEmployee({...newEmployee, westcoatIssued: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="westcoatIssued">Westcoat Issued</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="apronIssued"
                        checked={newEmployee.apronIssued}
                        onChange={(e) => setNewEmployee({...newEmployee, apronIssued: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="apronIssued">Apron Issued</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Employment Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <FormField label="Department" id="department" required>
                      <Select 
                        value={newEmployee.department} 
                        onValueChange={(value) => setNewEmployee({...newEmployee, department: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    
                    <FormField label="Position" id="position" required>
                      <Input
                        id="position"
                        value={newEmployee.position}
                        onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                        placeholder="Enter position"
                        required
                      />
                    </FormField>
                    
                    <FormField label="Monthly Salary (₹)" id="salary" required>
                      <Input
                        id="salary"
                        type="number"
                        value={newEmployee.salary}
                        onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                        placeholder="Enter monthly salary"
                        required
                        min="0"
                        step="0.01"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Signatures</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-4">
                      <FormField label="Employee Signature" id="employeeSignature">
                        <div className="border-2 border-dashed rounded-lg p-4 md:p-6 text-center">
                          <FileText className="mx-auto h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload employee signature
                          </p>
                          <Input
                            ref={signatureEmployeeRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSignatureUpload('employee', e)}
                            className="hidden"
                            id="employee-signature-upload"
                          />
                          <Label htmlFor="employee-signature-upload">
                            <Button 
                              variant="outline" 
                              className="mt-4" 
                              onClick={() => signatureEmployeeRef.current?.click()}
                            >
                              Upload Signature
                            </Button>
                          </Label>
                          {newEmployee.employeeSignature && (
                            <p className="mt-2 text-sm text-green-600">
                              Signature uploaded
                            </p>
                          )}
                        </div>
                      </FormField>
                    </div>
                    
                    <div className="space-y-4">
                      <FormField label="Authorized Signature" id="authorizedSignature">
                        <div className="border-2 border-dashed rounded-lg p-4 md:p-6 text-center">
                          <FileText className="mx-auto h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload authorized signature
                          </p>
                          <Input
                            ref={signatureAuthorizedRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSignatureUpload('authorized', e)}
                            className="hidden"
                            id="authorized-signature-upload"
                          />
                          <Label htmlFor="authorized-signature-upload">
                            <Button 
                              variant="outline" 
                              className="mt-4" 
                              onClick={() => signatureAuthorizedRef.current?.click()}
                            >
                              Upload Signature
                            </Button>
                          </Label>
                          {newEmployee.authorizedSignature && (
                            <p className="mt-2 text-sm text-green-600">
                              Signature uploaded
                            </p>
                          )}
                        </div>
                      </FormField>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Document Upload</h3>
                  
                  <div className="border-2 border-dashed rounded-lg p-4 md:p-6 text-center">
                    <Upload className="mx-auto h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop documents here or click to browse
                    </p>
                    <Input
                      ref={documentUploadRef}
                      type="file"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <Label htmlFor="document-upload">
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => documentUploadRef.current?.click()}
                      >
                        Browse Files
                      </Button>
                    </Label>
                  </div>
                  
                  {uploadedDocuments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Documents</Label>
                      <div className="space-y-2">
                        {uploadedDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{doc.name}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveDocument(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Required Documents</Label>
                    <div className="text-sm text-muted-foreground space-y-1 grid grid-cols-1 md:grid-cols-2 gap-1">
                      <div>• Aadhar Card</div>
                      <div>• PAN Card</div>
                      <div>• Educational Certificates</div>
                      <div>• Experience Letters</div>
                      <div>• Bank Details</div>
                      <div>• Passport Size Photo</div>
                      <div>• ESIC Family Details</div>
                      <div>• PF/ESIC Documents</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleAddEmployee} className="flex-1" size="lg" disabled={loading || !newEmployee.siteName || sitesWithCapacity === 0}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Employee...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Employee & Fill EPF Form
                      </>
                    )}
                  </Button>
                </div>
                
                {sitesWithCapacity === 0 && sites.length > 0 && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    All sites have reached their regular staff capacity. No more employees can be onboarded.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="epf-form">
          {createdEmployeeData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  EPF Form 11 - Declaration Form
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  For Employee: <span className="font-semibold">{createdEmployeeData.name}</span> 
                  | Employee ID: <span className="font-semibold">{createdEmployeeData.employeeId}</span>
                  | Department: <span className="font-semibold">{createdEmployeeData.department}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center border-b-2 border-black pb-4">
                    <h2 className="text-xl font-bold">New Form : 11 - Declaration Form</h2>
                    <p className="text-sm">(To be retained by the employer for future reference)</p>
                    <p className="text-xs font-semibold">EMPLOYEES' PROVIDENT FUND ORGANISATION</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Auto-filled from Employee Record</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Fields marked with <span className="font-semibold">(Auto-filled)</span> are automatically populated from the employee's onboarding data.</p>
                          <p className="mt-1">Please review all information before saving.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="1. Name of Member (Aadhar Name)" required>
                      <div className="relative">
                        <Input
                          value={epfFormData.memberName}
                          onChange={(e) => handleEPFFormChange('memberName', e.target.value)}
                          placeholder="Enter full name as per Aadhar"
                          className="bg-gray-50"
                        />
                        <div className="absolute right-2 top-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-filled</span>
                        </div>
                      </div>
                    </FormField>

                    <FormField label="2. Father's Name / Spouse's Name">
                      <div className="relative">
                        <Input
                          value={epfFormData.fatherOrSpouseName}
                          onChange={(e) => handleEPFFormChange('fatherOrSpouseName', e.target.value)}
                          placeholder="Enter father or spouse name"
                          className="bg-gray-50"
                        />
                        <div className="absolute right-2 top-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-filled</span>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="father"
                            name="relationshipType"
                            checked={epfFormData.relationshipType === "father"}
                            onChange={() => handleEPFFormChange('relationshipType', 'father')}
                          />
                          <Label htmlFor="father" className="text-sm">Father</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="spouse"
                            name="relationshipType"
                            checked={epfFormData.relationshipType === "spouse"}
                            onChange={() => handleEPFFormChange('relationshipType', 'spouse')}
                          />
                          <Label htmlFor="spouse" className="text-sm">Spouse</Label>
                        </div>
                      </div>
                    </FormField>

                    <FormField label="3. Date of Birth">
                      <div className="relative">
                        <Input
                          type="date"
                          value={epfFormData.dateOfBirth}
                          onChange={(e) => handleEPFFormChange('dateOfBirth', e.target.value)}
                          className="bg-gray-50"
                        />
                        <div className="absolute right-2 top-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-filled</span>
                        </div>
                      </div>
                    </FormField>

                    <FormField label="4. Gender">
                      <div className="relative">
                        <Select value={epfFormData.gender} onValueChange={(value) => handleEPFFormChange('gender', value)}>
                          <SelectTrigger className="bg-gray-50">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Transgender">Transgender</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="absolute right-2 top-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-filled</span>
                        </div>
                      </div>
                    </FormField>

                    <FormField label="5. Marital Status">
                      <div className="relative">
                        <Select value={epfFormData.maritalStatus} onValueChange={(value) => handleEPFFormChange('maritalStatus', value)}>
                          <SelectTrigger className="bg-gray-50">
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
                        <div className="absolute right-2 top-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-filled</span>
                        </div>
                      </div>
                    </FormField>

                    <FormField label="6. (a) Email ID">
                      <div className="relative">
                        <Input
                          type="email"
                          value={epfFormData.email}
                          onChange={(e) => handleEPFFormChange('email', e.target.value)}
                          placeholder="Enter email address"
                          className="bg-gray-50"
                        />
                        <div className="absolute right-2 top-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-filled</span>
                        </div>
                      </div>
                    </FormField>

                    <FormField label="6. (b) Mobile No (Aadhar Registered)">
                      <div className="relative">
                        <Input
                          value={epfFormData.mobileNumber}
                          onChange={(e) => handleEPFFormChange('mobileNumber', e.target.value)}
                          placeholder="Enter mobile number"
                          className="bg-gray-50"
                        />
                        <div className="absolute right-2 top-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-filled</span>
                        </div>
                      </div>
                    </FormField>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold border-b pb-2">Previous Membership Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>7. Whether earlier member of EPF Scheme, 1952 ?</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={epfFormData.previousEPFMember}
                              onChange={(e) => handleEPFFormChange('previousEPFMember', e.target.checked)}
                            />
                            <Label>Yes</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!epfFormData.previousEPFMember}
                              onChange={(e) => handleEPFFormChange('previousEPFMember', !e.target.checked)}
                            />
                            <Label>No</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>8. Whether earlier member of EPS, 1995 ?</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={epfFormData.previousPensionMember}
                              onChange={(e) => handleEPFFormChange('previousPensionMember', e.target.checked)}
                            />
                            <Label>Yes</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!epfFormData.previousPensionMember}
                              onChange={(e) => handleEPFFormChange('previousPensionMember', !e.target.checked)}
                            />
                            <Label>No</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end pt-4 border-t">
                    <Button onClick={handleSaveEPFForm} className="flex items-center gap-2" disabled={isSavingEPF}>
                      {isSavingEPF ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSavingEPF ? "Saving..." : "Save Form"}
                    </Button>
                    <Button onClick={handlePrintEPFForm} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Print Form
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Employee Selected</h3>
                  <p className="text-muted-foreground mb-6">
                    Please create an employee first to fill the EPF Form 11.
                  </p>
                  <Button onClick={() => setActiveTab("onboarding")}>
                    Go to Onboarding
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupervisorOnboardingTab;