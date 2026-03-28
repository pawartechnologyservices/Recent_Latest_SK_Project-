// src/components/Manager/ManagerSites.tsx (Updated with Camera)
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, MapPin, Camera, Upload, Plus, Eye, Calendar, 
  Loader2, AlertCircle, CheckCircle, XCircle, Clock,
  Image, FileText, ChevronRight, Search, Filter, Users,
  Briefcase, User, RefreshCw, Trash2, Download
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRole } from "@/context/RoleContext";
import taskService from "@/services/TaskService";
import siteVisitService, { Site, SiteVisitReport, WorkQuery } from "../../../services/SiteVisitService";

// Camera Component
interface CameraComponentProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraComponent: React.FC<CameraComponentProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCameraDevices();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraDevices = async () => {
    try {
      setIsLoading(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length === 0) {
        setError('No camera found on this device');
        setHasPermission(false);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
      
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      stopCamera();
      
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsLoading(false);
        };
      }
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setError(`Failed to start camera: ${err.message}`);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
        stopCamera();
      } else {
        setError('Video not ready. Please wait a moment.');
      }
    }
  };

  useEffect(() => {
    if (hasPermission && selectedDeviceId) {
      startCamera();
    }
  }, [hasPermission, selectedDeviceId]);

  if (isLoading && hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-2 text-sm text-gray-500">Checking camera...</p>
      </div>
    );
  }

  if (!hasPermission || error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-center text-red-600 mb-4">{error || 'Camera access required'}</p>
        <Button onClick={checkCameraDevices} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devices.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Camera</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '320px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto max-h-96 object-cover"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button onClick={capturePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Camera className="h-4 w-4 mr-2" />
          Capture Photo
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const ManagerSites = () => {
  const { user: authUser, isAuthenticated } = useRole();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [reports, setReports] = useState<SiteVisitReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [viewReportDialogOpen, setViewReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SiteVisitReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Camera states
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Form states
  const [photos, setPhotos] = useState<File[]>([]);
  const [workQueries, setWorkQueries] = useState<WorkQuery[]>([]);
  const [currentQuery, setCurrentQuery] = useState<Partial<WorkQuery>>({});
  
  // Upload states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  
  // Get current user info
  const managerId = authUser?._id || authUser?.id || "";
  const managerName = authUser?.name || "Manager";
  
  // Fetch assigned sites
  const fetchAssignedSites = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get all tasks to find sites where this manager is assigned
      const allTasks = await taskService.getAllTasks();
      
      // Filter tasks where manager is assigned
      const managerTasks = allTasks.filter(task => 
        task.assignedUsers?.some(user => 
          user.userId === managerId && user.role === 'manager'
        )
      );
      
      // Get unique sites from tasks
      const uniqueSites = new Map();
      managerTasks.forEach(task => {
        if (!uniqueSites.has(task.siteId)) {
          uniqueSites.set(task.siteId, {
            _id: task.siteId,
            name: task.siteName,
            clientName: task.clientName,
            location: task.location || "",
            status: task.status || "active",
            lastVisited: null,
            visitCount: 0,
            taskId: task._id,
            taskTitle: task.title,
            managerCount: 0,
            supervisorCount: 0
          });
        }
      });
      
      // Get visit history for each site
      for (const [siteId, site] of uniqueSites) {
        try {
          const reportsData = await siteVisitService.getManagerReports(managerId, { siteId });
          const approvedReports = reportsData.filter(r => r.status === 'approved');
          
          if (approvedReports.length > 0) {
            const lastVisit = approvedReports.sort((a, b) => 
              new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
            )[0];
            site.lastVisited = lastVisit.visitDate;
            site.visitCount = approvedReports.length;
          }
        } catch (error) {
          console.error(`Error fetching visits for site ${siteId}:`, error);
        }
      }
      
      setSites(Array.from(uniqueSites.values()));
    } catch (error: any) {
      console.error("Error fetching assigned sites:", error);
      toast.error(error.message || "Failed to load assigned sites");
    } finally {
      setIsLoading(false);
    }
  }, [managerId]);
  
  // Fetch manager's reports
  const fetchReports = useCallback(async () => {
    try {
      const reportsData = await siteVisitService.getManagerReports(managerId);
      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  }, [managerId]);
  
  useEffect(() => {
    if (managerId && isAuthenticated) {
      fetchAssignedSites();
      fetchReports();
    }
  }, [managerId, isAuthenticated, fetchAssignedSites, fetchReports]);
  
  // Filter sites based on search and status
  const filteredSites = sites.filter(site => {
    const matchesSearch = searchQuery === "" || 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "visited" && site.visitCount > 0) ||
      (filterStatus === "not-visited" && site.visitCount === 0);
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle photo selection from file upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files]);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };
  
  // Handle captured photo from camera
  const handleCapturePhoto = (imageData: string) => {
    setCapturedImage(imageData);
    // Convert base64 to file
    fetch(imageData)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotos(prev => [...prev, file]);
        const preview = URL.createObjectURL(blob);
        setPhotoPreviews(prev => [...prev, preview]);
        setCapturedImage(null);
        setShowCameraDialog(false);
        toast.success("Photo captured successfully!");
      })
      .catch(error => {
        console.error("Error processing captured photo:", error);
        toast.error("Failed to process captured photo");
      });
  };
  
  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // Add work query
  const addWorkQuery = () => {
    if (!currentQuery.title?.trim()) {
      toast.error("Please enter a query title");
      return;
    }
    
    if (!currentQuery.description?.trim()) {
      toast.error("Please enter a query description");
      return;
    }
    
    setWorkQueries(prev => [...prev, {
      title: currentQuery.title!,
      description: currentQuery.description!,
      priority: currentQuery.priority || 'medium',
      status: 'pending'
    }]);
    
    setCurrentQuery({});
  };
  
  // Remove work query
  const removeWorkQuery = (index: number) => {
    setWorkQueries(prev => prev.filter((_, i) => i !== index));
  };
  
  // Submit site visit report
  const submitReport = async () => {
    if (!selectedSite) {
      toast.error("No site selected");
      return;
    }
    
    if (photos.length === 0) {
      toast.error("Please take at least one photo");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reportData = {
        siteId: selectedSite._id,
        siteName: selectedSite.name,
        managerId: managerId,
        managerName: managerName,
        workQueries: workQueries,
        visitDate: new Date(),
        photos: [],
        updates: []
      };
      
      const result = await siteVisitService.createReport(reportData, photos);
      
      toast.success("Site visit report submitted successfully!");
      setReportDialogOpen(false);
      setPhotos([]);
      setPhotoPreviews([]);
      setWorkQueries([]);
      await fetchAssignedSites();
      await fetchReports();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get status badge
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
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground">Please log in to view your assigned sites.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your assigned sites...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned Sites</p>
                <p className="text-2xl font-bold">{sites.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visited Sites</p>
                <p className="text-2xl font-bold">{sites.filter(s => s.visitCount > 0).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{sites.reduce((sum, s) => sum + s.visitCount, 0)}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by site name or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Sites</option>
            <option value="visited">Visited Sites</option>
            <option value="not-visited">Not Visited Yet</option>
          </select>
        </div>
      </div>
      
      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sites Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all" 
                ? "No sites match your search criteria." 
                : "You haven't been assigned to any sites yet. Contact your supervisor for assignments."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => (
            <Card key={site._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg truncate">{site.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{site.clientName}</p>
                  </div>
                  <Badge variant={site.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {site.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  {site.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{site.location}</span>
                    </div>
                  )}
                  {site.lastVisited ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>Last visited: {format(new Date(site.lastVisited), 'dd MMM yyyy')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Not visited yet</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>Total visits: {site.visitCount}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setSelectedSite(site);
                      setReportDialogOpen(true);
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Visit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      // View site reports - could show reports for this specific site
                      const siteReports = reports.filter(r => r.siteId === site._id);
                      if (siteReports.length > 0) {
                        setSelectedReport(siteReports[0]);
                        setViewReportDialogOpen(true);
                      } else {
                        toast.info("No reports found for this site");
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* My Reports Section */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <Card 
                  key={report._id} 
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => {
                    setSelectedReport(report);
                    setViewReportDialogOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="h-4 w-4" />
                          <h3 className="font-medium">{report.siteName}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{format(new Date(report.visitDate), 'dd MMM yyyy, hh:mm a')}</span>
                          <span>📸 {report.photos?.length || 0} photos</span>
                          <span>📝 {report.workQueries?.length || 0} queries</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Start Visit Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Site Visit Report - {selectedSite?.name}
            </DialogTitle>
            <DialogDescription>
              Document your site visit with photos and work queries. Your report will be reviewed by Super Admin.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="photos" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="photos">
                <Camera className="h-4 w-4 mr-2" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="queries">
                <AlertCircle className="h-4 w-4 mr-2" />
                Work Queries
              </TabsTrigger>
              <TabsTrigger value="review">
                <CheckCircle className="h-4 w-4 mr-2" />
                Review & Submit
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="photos" className="space-y-4 mt-4">
              {/* Camera Button */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowCameraDialog(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo with Camera
                </Button>
                <label className="flex-1">
                  <Button variant="outline" asChild className="w-full">
                    <div className="flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Upload from Gallery
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                    </div>
                  </Button>
                </label>
              </div>
              
              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Site photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {photos.length === 0 && (
                <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Please add at least one photo before submitting
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="queries" className="space-y-4 mt-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Add Work Query</h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Query title"
                    value={currentQuery.title || ''}
                    onChange={(e) => setCurrentQuery({ ...currentQuery, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Describe the issue or work needed"
                    rows={3}
                    value={currentQuery.description || ''}
                    onChange={(e) => setCurrentQuery({ ...currentQuery, description: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={currentQuery.priority || 'medium'}
                      onChange={(e) => setCurrentQuery({ ...currentQuery, priority: e.target.value as any })}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <Button onClick={addWorkQuery}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              
              {workQueries.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Work Queries ({workQueries.length})</h4>
                  {workQueries.map((query, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{query.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">{query.description}</div>
                          <Badge variant={
                            query.priority === 'high' ? 'destructive' :
                            query.priority === 'medium' ? 'default' : 'secondary'
                          } className="mt-2">
                            {query.priority} priority
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorkQuery(index)}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="review" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Site:</span>
                  <span>{selectedSite?.name}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Photos:</span>
                  <span>{photos.length} photo(s)</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Work Queries:</span>
                  <span>{workQueries.length} query(s)</span>
                </div>
                
                {photos.length === 0 && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Please add at least one photo before submitting
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full" 
                onClick={submitReport}
                disabled={photos.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Report for Review
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Camera Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={(open) => {
        if (!open) {
          setCapturedImage(null);
        }
        setShowCameraDialog(open);
      }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5" />
              Take Photo for Site Visit
            </DialogTitle>
            <DialogDescription>
              Capture a photo of the site condition. Ensure good lighting for clear photos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-4 pb-4">
            {!capturedImage ? (
              <CameraComponent 
                onCapture={handleCapturePhoto}
                onClose={() => setShowCameraDialog(false)}
              />
            ) : (
              <>
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-80 object-contain"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => {
                      fetch(capturedImage)
                        .then(res => res.blob())
                        .then(blob => {
                          const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
                          setPhotos(prev => [...prev, file]);
                          const preview = URL.createObjectURL(blob);
                          setPhotoPreviews(prev => [...prev, preview]);
                          setCapturedImage(null);
                          setShowCameraDialog(false);
                          toast.success("Photo captured successfully!");
                        });
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Use This Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCapturedImage(null);
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
            <span className="font-semibold">Tip:</span> Ensure good lighting and capture the site condition clearly.
          </div>
        </DialogContent>
      </Dialog>
      
      {/* View Report Dialog */}
      <Dialog open={viewReportDialogOpen} onOpenChange={setViewReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Site Visit Report - {selectedReport?.siteName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(selectedReport.visitDate), 'dd MMM yyyy, hh:mm a')}</span>
                </div>
                {getStatusBadge(selectedReport.status)}
              </div>
              
              {/* Photos Section */}
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Site Photos ({selectedReport.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedReport.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Site photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                          {new Date(photo.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Work Queries Section */}
              {selectedReport.workQueries && selectedReport.workQueries.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Work Queries ({selectedReport.workQueries.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedReport.workQueries.map((query) => (
                      <Card key={query._id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{query.title}</h4>
                            <Badge variant={
                              query.priority === 'high' ? 'destructive' :
                              query.priority === 'medium' ? 'default' : 'secondary'
                            }>
                              {query.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{query.description}</p>
                          <div className="flex justify-between items-center text-sm">
                            <Badge variant={
                              query.status === 'completed' ? 'default' :
                              query.status === 'in-progress' ? 'secondary' : 'outline'
                            }>
                              {query.status}
                            </Badge>
                            {query.createdAt && (
                              <span className="text-xs text-muted-foreground">
                                Created: {format(new Date(query.createdAt), 'dd MMM yyyy')}
                              </span>
                            )}
                          </div>
                          {query.resolution && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-sm">
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
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Activity Timeline
                  </h3>
                  <div className="space-y-2">
                    {selectedReport.updates.map((update, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-primary">
                        <div className="text-xs text-muted-foreground min-w-[100px]">
                          {format(new Date(update.timestamp), 'dd MMM, hh:mm a')}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{update.content}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-1">Rejection Reason</h4>
                  <p className="text-sm text-red-700">{selectedReport.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerSites;