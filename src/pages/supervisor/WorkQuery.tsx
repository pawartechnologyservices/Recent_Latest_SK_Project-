// WorkQueryPage.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Plus, 
  X, 
  Eye, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  MessageCircle, 
  User, 
  Trash2,
  RefreshCw,
  Building2,
  Loader2,
  Mail,
  MapPin,
  HardHat,
  Shield,
  Car,
  Sparkles,
  Truck,
  Info,
  Menu,
  Home,
  Users,
  BarChart3,
  LogOut,
  Settings,
  ClipboardList,
  Camera,
  Image as ImageIcon,
  Upload,
  Trash,
  ZoomIn,
  RotateCw
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkQuery } from "@/hooks/useWorkQuery";
import { format } from "date-fns";
import { useRole } from "@/context/RoleContext";

// Dashboard Header Component
interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

const DashboardHeader = ({ title, subtitle, onMenuClick, showMenu = true }: DashboardHeaderProps) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 sticky top-0 z-40 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Work Query Management</h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

// Mobile Navigation Drawer Component
interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  userName: string;
  userRole: string;
  userDepartment?: string;
  userSite?: string;
}

const MobileNavDrawer = ({ isOpen, onClose, onNavigate, userName, userRole, userDepartment, userSite }: MobileNavDrawerProps) => {
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/supervisor' },
    { icon: Users, label: 'Employees', path: '/supervisor/employees' },
    { icon: ClipboardList, label: 'Tasks', path: '/supervisor/tasks' },
    { icon: MessageCircle, label: 'Work Queries', path: '/supervisor/work-queries' },
    { icon: User, label: 'Profile', path: '/supervisor/profile' },
    { icon: BarChart3, label: 'Reports', path: '/supervisor/reports' },
    { icon: Settings, label: 'Settings', path: '/supervisor/settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />
          
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {userName?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {userRole}
                      </p>
                    </div>
                  </div>
                  {(userDepartment || userSite) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      {userDepartment && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {userDepartment}
                        </p>
                      )}
                      {userSite && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {userSite}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        onNavigate(item.path);
                        onClose();
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </nav>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    localStorage.removeItem('sk_user');
                    window.location.href = '/login';
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Types
interface WorkQuery {
  _id: string;
  queryId: string;
  title: string;
  description: string;
  serviceId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  category: string;
  reportedBy: {
    userId: string;
    name: string;
    role: string;
  };
  supervisorId: string;
  supervisorName: string;
  superadminResponse?: string;
  responseDate?: string;
  comments: Array<{
    userId: string;
    name: string;
    comment: string;
    timestamp: string;
  }>;
  images?: Array<{
    url: string;
    publicId: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Image File with Preview
interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

// Reusable Components
const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200"
  };

  const icons = {
    low: <CheckCircle className="h-3 w-3" />,
    medium: <Clock className="h-3 w-3" />,
    high: <AlertCircle className="h-3 w-3" />,
    critical: <AlertCircle className="h-3 w-3" />
  };

  return (
    <Badge variant="outline" className={`${styles[priority as keyof typeof styles]} flex items-center gap-1`}>
      {icons[priority as keyof typeof icons]}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200"
  };

  const icons = {
    pending: <Clock className="h-3 w-3" />,
    "in-progress": <AlertCircle className="h-3 w-3" />,
    resolved: <CheckCircle className="h-3 w-3" />,
    rejected: <X className="h-3 w-3" />
  };

  return (
    <Badge variant="outline" className={`${styles[status as keyof typeof styles]} flex items-center gap-1`}>
      {icons[status as keyof typeof icons]}
      {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </Badge>
  );
};

const ServiceIcon = ({ type }: { type: string }) => {
  const icons = {
    cleaning: <Sparkles className="h-4 w-4" />,
    "waste-management": <Trash2 className="h-4 w-4" />,
    "parking-management": <Car className="h-4 w-4" />,
    security: <Shield className="h-4 w-4" />,
    maintenance: <HardHat className="h-4 w-4" />,
    default: <Truck className="h-4 w-4" />
  };

  return icons[type as keyof typeof icons] || icons.default;
};

// Camera Modal Component
interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal = ({ isOpen, onClose, onCapture }: CameraModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facingMode } }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (fallbackErr) {
        console.error('Error accessing camera:', fallbackErr);
        setError('Unable to access camera. Please check permissions.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Take Photo</DialogTitle>
          <DialogDescription>
            Position the camera and click capture
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
              <Button onClick={startCamera} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-[60vh] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="rounded-full h-12 w-12"
                  onClick={switchCamera}
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
                
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="rounded-full h-16 w-16 bg-white hover:bg-gray-200"
                  onClick={capturePhoto}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-white" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Photo Upload Component
interface PhotoUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const PhotoUpload = ({ images, onImagesChange, maxImages = 5, disabled = false }: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageForView, setSelectedImageForView] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    const newImages: ImageFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));

    onImagesChange([...images, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = (file: File) => {
    if (images.length + 1 > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }
    
    const newImage: ImageFile = {
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    };
    
    onImagesChange([...images, newImage]);
    toast.success('Photo captured successfully');
  };

  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm">Photos (Optional)</Label>
      <p className="text-xs text-muted-foreground">
        Take photos or upload images to document the issue (Max {maxImages} images)
      </p>
      
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div 
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer"
                onClick={() => setSelectedImageForView(image.preview)}
              >
                <img 
                  src={image.preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageForView(image.preview);
                    }}
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image.id);
                    }}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {images.length < maxImages && !disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCameraOpen(true)}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload from Gallery
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled}
          />
        </div>
      )}
      
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
      
      <Dialog open={!!selectedImageForView} onOpenChange={() => setSelectedImageForView(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-black">
            {selectedImageForView && (
              <img 
                src={selectedImageForView} 
                alt="Full size preview" 
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70"
              onClick={() => setSelectedImageForView(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Service Examples
const SERVICE_EXAMPLES = [
  { id: "CLEAN001", name: "Office Cleaning Service", type: "cleaning" },
  { id: "WASTE001", name: "Biomedical Waste Collection", type: "waste-management" },
  { id: "PARK001", name: "Parking Lot Management", type: "parking-management" },
  { id: "SEC001", name: "Security Patrol Service", type: "security" },
  { id: "MAINT001", name: "HVAC Maintenance", type: "maintenance" },
];

// Main Component
const WorkQueryPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext<{ onMenuClick?: () => void }>();
  const { user: authUser, role, isAuthenticated, loading: authLoading } = useRole();
  
  const [currentSupervisor, setCurrentSupervisor] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    department?: string;
    site?: string;
  }>({
    id: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    site: ""
  });
  
  const [loadingSupervisor, setLoadingSupervisor] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  
  const {
    workQueries,
    statistics,
    categories,
    priorities,
    statuses,
    loading: workQueryLoading,
    createWorkQuery,
    deleteWorkQuery,
    fetchWorkQueries,
    fetchStatistics,
    pagination,
    changePage,
    changeLimit
  } = useWorkQuery({
    supervisorId: currentSupervisor.id,
    autoFetch: currentSupervisor.id !== "",
    initialFilters: {
      page: 1,
      limit: 10
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedQueryForView, setSelectedQueryForView] = useState<WorkQuery | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedImageForView, setSelectedImageForView] = useState<string | null>(null);

  const [newQuery, setNewQuery] = useState({
    title: "",
    description: "",
    serviceId: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    category: "service-quality",
    supervisorId: "",
    supervisorName: ""
  });

  const [queryImages, setQueryImages] = useState<ImageFile[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("other");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      queryImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [queryImages]);

  const serviceTypes = [
    { value: "cleaning", label: "Cleaning", icon: <Sparkles className="h-4 w-4" /> },
    { value: "waste-management", label: "Waste Management", icon: <Trash2 className="h-4 w-4" /> },
    { value: "parking-management", label: "Parking Management", icon: <Car className="h-4 w-4" /> },
    { value: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
    { value: "maintenance", label: "Maintenance", icon: <HardHat className="h-4 w-4" /> },
    { value: "other", label: "Other", icon: <Truck className="h-4 w-4" /> }
  ];

  useEffect(() => {
    const fetchCurrentSupervisor = async () => {
      try {
        setLoadingSupervisor(true);
        
        if (!authUser || !isAuthenticated) {
          throw new Error("User not authenticated");
        }
        
        setCurrentSupervisor({
          id: authUser._id || authUser.id || "",
          name: authUser.name || "Supervisor",
          email: authUser.email || "",
          phone: authUser.phone || "",
          department: authUser.department || "",
          site: authUser.site || ""
        });
        
        setNewQuery(prev => ({
          ...prev,
          supervisorId: authUser._id || authUser.id || "",
          supervisorName: authUser.name || "Supervisor"
        }));
        
      } catch (error: any) {
        console.error("Error fetching supervisor data:", error);
        
        try {
          const storedUser = localStorage.getItem('sk_user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setCurrentSupervisor({
              id: parsedUser._id || parsedUser.id || "SUP001",
              name: parsedUser.name || "Supervisor User",
              email: parsedUser.email || "",
              phone: parsedUser.phone || "",
              department: parsedUser.department || "",
              site: parsedUser.site || ""
            });
            
            setNewQuery(prev => ({
              ...prev,
              supervisorId: parsedUser._id || parsedUser.id || "SUP001",
              supervisorName: parsedUser.name || "Supervisor User"
            }));
          }
        } catch (localError) {
          console.error("Error getting user from localStorage:", localError);
          toast.error("Failed to load user data. Please log in again.");
        }
      } finally {
        setLoadingSupervisor(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      fetchCurrentSupervisor();
    }
  }, [authUser, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!authLoading && !loadingSupervisor && (!isAuthenticated || role !== 'supervisor')) {
      toast.error("Access denied. Only supervisors can access this page.");
    }
  }, [isAuthenticated, role, authLoading, loadingSupervisor]);

  const handleMenuClick = () => {
    if (outletContext?.onMenuClick) {
      outletContext.onMenuClick();
    } else {
      setMobileMenuOpen(true);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const filteredQueries = workQueries.filter(query => {
    const matchesSearch = 
      query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.queryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || query.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || query.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    queryImages.forEach(image => {
      URL.revokeObjectURL(image.preview);
    });
    setTimeout(() => {
      setNewQuery({
        title: "",
        description: "",
        serviceId: "",
        priority: "medium",
        category: "service-quality",
        supervisorId: currentSupervisor.id,
        supervisorName: currentSupervisor.name
      });
      setQueryImages([]);
      setSelectedServiceType("other");
    }, 300);
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || role !== 'supervisor') {
      toast.error("You must be logged in as a supervisor to create a work query");
      return;
    }

    if (!newQuery.title.trim()) {
      toast.error("Please enter a query title");
      return;
    }

    if (!newQuery.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!newQuery.serviceId.trim()) {
      toast.error("Please enter a Service ID or Name");
      return;
    }

    if (!currentSupervisor.id || !currentSupervisor.name) {
      toast.error("Supervisor information is missing");
      return;
    }

    try {
      let serviceId = newQuery.serviceId;
      let serviceTitle = newQuery.serviceId;
      
      if (serviceId.includes(" - ")) {
        const parts = serviceId.split(" - ");
        serviceId = parts[0];
        serviceTitle = parts.slice(1).join(" - ");
      }
      
      serviceId = serviceId.trim().toUpperCase();
      
      const files = queryImages.map(img => img.file);
      
      const result = await createWorkQuery({
        title: newQuery.title,
        description: newQuery.description,
        serviceId: serviceId,
        priority: newQuery.priority,
        category: newQuery.category,
        supervisorId: currentSupervisor.id,
        supervisorName: currentSupervisor.name,
        serviceTitle: serviceTitle,
        serviceType: selectedServiceType
      }, files);
      
      if (result.success) {
        toast.success(`Work query created successfully${files.length > 0 ? ` with ${files.length} photo(s)` : ''}`);
        handleDialogClose();
      } else {
        toast.error(result.error || "Failed to create work query");
      }
    } catch (error) {
      console.error("Error creating work query:", error);
      toast.error("Failed to create work query. Please try again.");
    }
  };

  const handleDeleteQuery = async (queryId: string, queryTitle: string) => {
    try {
      const result = await deleteWorkQuery(queryId);
      
      if (result.success) {
        toast.success(`Work query "${queryTitle}" deleted successfully`);
        fetchWorkQueries();
      } else {
        toast.error(result.error || "Failed to delete work query");
      }
    } catch (error) {
      console.error("Error deleting work query:", error);
      toast.error("Failed to delete work query. Please try again.");
    }
  };

  const handleViewQuery = (query: WorkQuery) => {
    setSelectedQueryForView(query);
    setIsViewDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchWorkQueries();
    fetchStatistics();
    toast.success("Data refreshed successfully");
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  if (authLoading || loadingSupervisor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading supervisor data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'supervisor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Only supervisors can access the Work Query Management page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              Please log in with a supervisor account to continue.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Work Query Management" 
        subtitle={`Report and track issues with facility services`}
        onMenuClick={handleMenuClick}
      />
      
      <MobileNavDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={handleNavigate}
        userName={currentSupervisor.name}
        userRole="Supervisor"
        userDepartment={currentSupervisor.department}
        userSite={currentSupervisor.site}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 md:p-6 space-y-4 md:space-y-6"
      >
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-white">
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
                Total Queries
                <MessageCircle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-lg md:text-2xl font-bold">
                {workQueryLoading.statistics ? "..." : statistics?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All queries</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
                Pending
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-yellow-600">
                {workQueryLoading.statistics ? "..." : statistics?.statusCounts?.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
                In Progress
                <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-blue-600">
                {workQueryLoading.statistics ? "..." : statistics?.statusCounts?.['in-progress'] || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In Progress</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
                Resolved
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-green-600">
                {workQueryLoading.statistics ? "..." : statistics?.statusCounts?.resolved || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Supervisor Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                  {currentSupervisor.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="font-medium text-sm md:text-base text-blue-900">{currentSupervisor.name}</div>
                  <div className="text-xs text-blue-700">Supervisor</div>
                </div>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                {currentSupervisor.department && (
                  <div className="flex items-center gap-1 text-blue-700">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{currentSupervisor.department}</span>
                  </div>
                )}
                {currentSupervisor.site && (
                  <div className="flex items-center gap-1 text-blue-700">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{currentSupervisor.site}</span>
                  </div>
                )}
                {currentSupervisor.email && (
                  <div className="flex items-center gap-1 text-blue-700">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{currentSupervisor.email}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">Work Queries</CardTitle>
                <CardDescription className="text-sm">
                  Manage and track issues with facility services
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleRefresh} disabled={workQueryLoading.queries} size={isMobileView ? "sm" : "default"} className="flex-1 sm:flex-none">
                  <RefreshCw className={`h-4 w-4 mr-2 ${workQueryLoading.queries ? 'animate-spin' : ''}`} />
                  <span className="sm:inline">Refresh</span>
                </Button>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 sm:flex-none" size={isMobileView ? "sm" : "default"}>
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="sm:inline">New Query</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                    <DialogHeader>
                      <DialogTitle>Create New Work Query</DialogTitle>
                      <DialogDescription>
                        Report an issue with a facility service
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmitQuery} className="space-y-4 md:space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Query Title *</Label>
                          <Input
                            id="title"
                            value={newQuery.title}
                            onChange={(e) => setNewQuery(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Brief description of the issue"
                            required
                            disabled={workQueryLoading.creating}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Detailed Description *</Label>
                          <Textarea
                            id="description"
                            value={newQuery.description}
                            onChange={(e) => setNewQuery(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Provide detailed information about the issue..."
                            rows={4}
                            required
                            disabled={workQueryLoading.creating}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="serviceId">Service ID/Name *</Label>
                            <Input
                              id="serviceId"
                              value={newQuery.serviceId}
                              onChange={(e) => setNewQuery(prev => ({ ...prev, serviceId: e.target.value }))}
                              placeholder="Enter Service ID or Name"
                              required
                              disabled={workQueryLoading.creating}
                            />
                            <div className="text-xs text-muted-foreground flex items-start gap-1">
                              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>Enter the Service ID or Name you want to report an issue for</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select 
                              value={newQuery.category} 
                              onValueChange={(value) => setNewQuery(prev => ({ ...prev, category: value }))}
                              disabled={workQueryLoading.creating}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.value} value={category.value}>
                                    <div className="flex flex-col">
                                      <span>{category.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {category.description}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Service Type (Optional)</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Select the type of service you're reporting an issue for
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {serviceTypes.map((serviceType) => (
                              <Button
                                key={serviceType.value}
                                type="button"
                                variant={selectedServiceType === serviceType.value ? "default" : "outline"}
                                className="justify-start h-auto py-2"
                                onClick={() => setSelectedServiceType(serviceType.value)}
                              >
                                <div className="flex items-center gap-2">
                                  {serviceType.icon}
                                  <span className="truncate">{serviceType.label}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority Level *</Label>
                          <Select 
                            value={newQuery.priority} 
                            onValueChange={(value) => setNewQuery(prev => ({ ...prev, priority: value as any }))}
                            disabled={workQueryLoading.creating}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              {priorities.map(priority => (
                                <SelectItem key={priority.value} value={priority.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      priority.value === 'low' ? 'bg-green-500' :
                                      priority.value === 'medium' ? 'bg-yellow-500' :
                                      priority.value === 'high' ? 'bg-orange-500' : 'bg-red-500'
                                    }`} />
                                    <div className="flex flex-col">
                                      <span>{priority.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {priority.description}
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <PhotoUpload 
                        images={queryImages}
                        onImagesChange={setQueryImages}
                        maxImages={5}
                        disabled={workQueryLoading.creating}
                      />

                      <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <Label className="font-medium text-gray-900">Service Examples</Label>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          Here are some examples of service IDs/Names you can use:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {SERVICE_EXAMPLES.map((service, index) => (
                            <div 
                              key={index}
                              className="text-xs p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setNewQuery(prev => ({ 
                                  ...prev, 
                                  serviceId: `${service.id} - ${service.name}` 
                                }));
                                setSelectedServiceType(service.type);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <ServiceIcon type={service.type} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{service.id}</div>
                                  <div className="text-muted-foreground truncate">{service.name}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Tip: Click on any example to auto-fill the Service field
                        </p>
                      </div>

                      <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <Label className="font-semibold text-blue-900">Supervisor Information</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                          <div>
                            <div className="text-blue-800 font-medium">Name</div>
                            <div className="truncate">{currentSupervisor.name}</div>
                          </div>
                          <div>
                            <div className="text-blue-800 font-medium">ID</div>
                            <div className="font-mono text-xs truncate">{currentSupervisor.id}</div>
                          </div>
                          {currentSupervisor.department && (
                            <div>
                              <div className="text-blue-800 font-medium">Department</div>
                              <div className="truncate">{currentSupervisor.department}</div>
                            </div>
                          )}
                          {currentSupervisor.site && (
                            <div>
                              <div className="text-blue-800 font-medium">Site</div>
                              <div className="truncate">{currentSupervisor.site}</div>
                            </div>
                          )}
                        </div>
                        {currentSupervisor.email && (
                          <div className="mt-2 text-xs text-blue-700 flex items-center gap-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{currentSupervisor.email}</span>
                          </div>
                        )}
                      </div>

                      <DialogFooter className="gap-2 flex-col sm:flex-row">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleDialogClose}
                          disabled={workQueryLoading.creating}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={workQueryLoading.creating}
                          className="w-full sm:w-auto"
                        >
                          {workQueryLoading.creating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : "Submit Query"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="space-y-1 md:space-y-2">
                <Label className="text-xs md:text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <Label className="text-xs md:text-sm">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            status.value === 'pending' ? 'bg-yellow-500' :
                            status.value === 'in-progress' ? 'bg-blue-500' :
                            status.value === 'resolved' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <Label className="text-xs md:text-sm">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            priority.value === 'low' ? 'bg-green-500' :
                            priority.value === 'medium' ? 'bg-yellow-500' :
                            priority.value === 'high' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          <span>{priority.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Queries Table */}
            {workQueryLoading.queries ? (
              <div className="text-center py-8 md:py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading work queries...</p>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="text-center py-8 md:py-12 border rounded-lg">
                <MessageCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base md:text-lg font-medium">No queries found</h3>
                <p className="text-sm text-muted-foreground px-4">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? "No work queries match your current filters." 
                    : "No work queries have been created yet."}
                </p>
              </div>
            ) : (
              <>
                {isMobileView ? (
                  <div className="space-y-3">
                    {filteredQueries.map((query) => (
                      <Card key={query._id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-mono text-xs text-gray-500">{query.queryId}</div>
                                <div className="font-medium text-sm mt-1">{query.title}</div>
                              </div>
                              <PriorityBadge priority={query.priority} />
                            </div>

                            <div className="text-xs text-gray-600 line-clamp-2">
                              {query.description}
                            </div>

                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{query.serviceId}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <StatusBadge status={query.status} />
                              <span className="text-xs text-gray-500">{formatDate(query.createdAt)}</span>
                            </div>

                            {/* Display photos count */}
                            {query.images && query.images.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <ImageIcon className="h-3 w-3" />
                                <span>{query.images.length} photo(s)</span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewQuery(query)}
                                className="w-full"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    disabled={
                                      (query.status === 'in-progress' || query.status === 'resolved') ||
                                      workQueryLoading.deleting
                                    }
                                    className="w-full"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Work Query</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this work query? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDeleteQuery(query._id, query.title)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Photos</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQueries.map((query) => (
                          <TableRow key={query._id}>
                            <TableCell className="font-mono text-sm">
                              {query.queryId}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <div className="font-medium truncate">{query.title}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {query.description.substring(0, 50)}...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <div className="font-medium text-sm truncate">{query.serviceId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <PriorityBadge priority={query.priority} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={query.status} />
                            </TableCell>
                            <TableCell>
                              {query.images && query.images.length > 0 ? (
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleViewQuery(query)}>
                                  <ImageIcon className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm">{query.images.length}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No photos</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm whitespace-nowrap">
                                {formatDate(query.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleViewQuery(query)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      disabled={
                                        (query.status === 'in-progress' || query.status === 'resolved') ||
                                        workQueryLoading.deleting
                                      }
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Work Query</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this work query? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => handleDeleteQuery(query._id, query.title)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* View Query Details Dialog with Images */}
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedQueryForView && (
                      <>
                        <DialogHeader>
                          <DialogTitle>Query Details - {selectedQueryForView.queryId}</DialogTitle>
                          <DialogDescription>
                            View complete information about this work query
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold">Title</Label>
                              <p className="mt-1 text-sm">{selectedQueryForView.title}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Service</Label>
                              <p className="mt-1 text-sm">{selectedQueryForView.serviceId}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Priority</Label>
                              <div className="mt-1">
                                <PriorityBadge priority={selectedQueryForView.priority} />
                              </div>
                            </div>
                            <div>
                              <Label className="font-semibold">Status</Label>
                              <div className="mt-1">
                                <StatusBadge status={selectedQueryForView.status} />
                              </div>
                            </div>
                            <div>
                              <Label className="font-semibold">Category</Label>
                              <p className="mt-1 text-sm">
                                {categories.find(c => c.value === selectedQueryForView.category)?.label || selectedQueryForView.category}
                              </p>
                            </div>
                            <div>
                              <Label className="font-semibold">Created</Label>
                              <p className="mt-1 text-sm">{formatDate(selectedQueryForView.createdAt)}</p>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <Label className="font-semibold text-blue-900">Reported By</Label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-blue-800 font-medium">Supervisor</div>
                                <div className="text-sm">{selectedQueryForView.reportedBy?.name || selectedQueryForView.supervisorName}</div>
                              </div>
                              <div>
                                <div className="text-xs text-blue-800 font-medium">Role</div>
                                <div className="text-sm">{selectedQueryForView.reportedBy?.role || 'Supervisor'}</div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="font-semibold">Description</Label>
                            <p className="mt-1 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                              {selectedQueryForView.description}
                            </p>
                          </div>

                          {/* Display Images in View Dialog */}
                          {selectedQueryForView.images && selectedQueryForView.images.length > 0 && (
                            <div>
                              <Label className="font-semibold mb-2 block">Photos ({selectedQueryForView.images.length})</Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {selectedQueryForView.images.map((image, index) => (
                                  <div
                                    key={index}
                                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer group"
                                    onClick={() => setSelectedImageForView(image.url)}
                                  >
                                    <img
                                      src={image.url}
                                      alt={`Query photo ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ZoomIn className="h-6 w-6 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedQueryForView.superadminResponse && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <Label className="font-semibold text-green-900">Superadmin Response</Label>
                              <p className="mt-1 text-sm text-green-800 whitespace-pre-wrap">
                                {selectedQueryForView.superadminResponse}
                              </p>
                              {selectedQueryForView.responseDate && (
                                <div className="text-xs text-green-600 mt-2">
                                  Responded on: {formatDate(selectedQueryForView.responseDate)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Full Screen Image Viewer */}
                <Dialog open={!!selectedImageForView} onOpenChange={() => setSelectedImageForView(null)}>
                  <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
                    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-black">
                      {selectedImageForView && (
                        <img 
                          src={selectedImageForView} 
                          alt="Full size" 
                          className="max-w-full max-h-[85vh] object-contain"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70"
                        onClick={() => setSelectedImageForView(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                    <div className="text-sm text-muted-foreground order-2 sm:order-1">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </div>
                    <div className="flex items-center gap-2 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 2) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 1) {
                            pageNum = pagination.totalPages - 2 + i;
                          } else {
                            pageNum = pagination.page - 1 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => changePage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WorkQueryPage;