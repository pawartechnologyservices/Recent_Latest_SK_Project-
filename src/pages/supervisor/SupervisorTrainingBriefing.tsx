// components/SupervisorTrainingBriefingSection.tsx
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Calendar, Clock, Users, Image as ImageIcon, Video, File, CheckCircle, XCircle, 
  Plus, Search, Filter, Download, Eye, Edit, Trash2, Upload, CalendarDays,
  User, Building, Target, MessageSquare, AlertCircle, ChevronRight, ChevronLeft,
  CheckSquare, Square, X, RefreshCw, MoreVertical, ChevronDown, ChevronUp, List,
  UserCheck, UserCog, Loader2, ExternalLink, Download as DownloadIcon,
  Menu
} from "lucide-react";
import { format } from 'date-fns';
import { useRole } from "@/context/RoleContext";
import { trainingApi } from '@/api/trainingApi';
import { briefingApi } from '@/api/briefingApi';
import { siteService, Site } from '@/services/SiteService';
import assignTaskService, { AssignTask } from '@/services/assignTaskService';
import axios from "axios";
import { useOutletContext } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || `https://${window.location.hostname}:5001/api`;

// Types
interface TrainingSession {
  _id: string;
  id: string;
  title: string;
  description: string;
  type: 'safety' | 'technical' | 'soft_skills' | 'compliance' | 'other';
  date: string;
  time: string;
  duration: string;
  trainer: string;
  supervisor: string;
  site: string;
  department: string;
  attendees: string[];
  maxAttendees: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attachments: Attachment[];
  feedback: Feedback[];
  location: string;
  objectives: string[];
  supervisors?: Array<{ id: string; name: string }>;
  managers?: Array<{ id: string; name: string }>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffBriefing {
  _id: string;
  id: string;
  date: string;
  time: string;
  conductedBy: string;
  site: string;
  department: string;
  attendeesCount: number;
  topics: string[];
  keyPoints: string[];
  actionItems: ActionItem[];
  attachments: Attachment[];
  notes: string;
  shift: 'morning' | 'evening' | 'night';
  supervisors?: Array<{ id: string; name: string }>;
  managers?: Array<{ id: string; name: string }>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  _id?: string;
  id?: string;
  name: string;
  type: 'image' | 'document' | 'video';
  url: string;
  size: string;
  uploadedAt: string;
  isNew?: boolean;
  file?: File;
}

interface Feedback {
  _id?: string;
  id?: string;
  employeeId: string;
  employeeName: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

interface ActionItem {
  _id?: string;
  id?: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface Supervisor {
  _id: string;
  name: string;
  email: string;
  role: 'supervisor';
  department?: string;
  site?: string;
  assignedSites?: string[];
}

interface Manager {
  _id: string;
  name: string;
  email: string;
  role: 'manager';
  department?: string;
  site?: string;
  assignedSites?: string[];
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  designation?: string;
  status: "active" | "inactive" | "left";
  siteName?: string;
  assignedSites?: string[];
}

interface ExistingAttachment {
  _id?: string;
  name: string;
  type: string;
  url: string;
  size: string;
  uploadedAt?: string;
  isNew?: boolean;
  file?: File;
}

const departments = ['All Departments', 'Housekeeping', 'Security', 'Maintenance', 'Operations', 'Front Desk', 'Administration', 'IT Support'];
const trainingTypes = [
  { value: 'safety', label: 'Safety Training', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  { value: 'technical', label: 'Technical Training', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'soft_skills', label: 'Soft Skills', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'compliance', label: 'Compliance', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
];
const shifts = ['morning', 'evening', 'night'];
const priorities = ['low', 'medium', 'high'];

// Memoized Attachment Viewer Component to prevent unnecessary re-renders
const AttachmentViewer = memo(({ attachment, onClose }: { attachment: any; onClose: () => void }) => {
  const isImage = attachment.type === 'image' || attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = attachment.type === 'video' || attachment.url?.match(/\.(mp4|mov|avi|webm)$/i);
  const isPDF = attachment.url?.match(/\.pdf$/i);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{attachment.name}</DialogTitle>
          <DialogDescription>File size: {attachment.size}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {isImage && (
            <img src={attachment.url} alt={attachment.name} className="max-w-full h-auto rounded-lg" />
          )}
          {isVideo && (
            <video controls className="w-full rounded-lg">
              <source src={attachment.url} />
              Your browser does not support the video tag.
            </video>
          )}
          {isPDF && (
            <iframe src={attachment.url} className="w-full h-[70vh] rounded-lg" title={attachment.name} />
          )}
          {!isImage && !isVideo && !isPDF && (
            <div className="text-center py-12">
              <File className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                <DownloadIcon className="h-4 w-4" />
                Download File
              </a>
            </div>
          )}
        </div>
        <DialogFooter>
          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </a>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AttachmentViewer.displayName = 'AttachmentViewer';

// Memoized Training Detail Dialog
const TrainingDetailDialog = memo(({ training, open, onClose, onEdit, onUpdateStatus, getStatusBadge, getTypeColor, formatDate, trainingTypes }: any) => {
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  if (!training) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Calendar className="h-5 w-5" />
              Training Session Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                <div>
                  <h2 className="text-xl font-bold">{training.title}</h2>
                  <p className="text-gray-600 mt-1">{training.description}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getTypeColor(training.type)}>
                    {trainingTypes.find((t: any) => t.value === training.type)?.label || training.type}
                  </Badge>
                  <Badge className={getStatusBadge(training.status)}>
                    {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Date & Time</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Calendar className="h-4 w-4 text-gray-400" /><span>{formatDate(training.date)} at {training.time}</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Duration</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Clock className="h-4 w-4 text-gray-400" /><span>{training.duration}</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Trainer</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><User className="h-4 w-4 text-gray-400" /><span>{training.trainer}</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Location</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Target className="h-4 w-4 text-gray-400" /><span>{training.location}</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Site</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Building className="h-4 w-4 text-gray-400" /><span>{training.site}</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Department</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Users className="h-4 w-4 text-gray-400" /><span>{training.department}</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Max Attendees</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Users className="h-4 w-4 text-gray-400" /><span>{training.maxAttendees}</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Current Attendees</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Users className="h-4 w-4 text-gray-400" /><span>{training.attendees?.length || 0}</span></div></div>
            </div>

            {(training.supervisors && training.supervisors.length > 0) && (
              <div><h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><UserCheck className="h-4 w-4" />Supervisors</h4><div className="flex flex-wrap gap-2">{training.supervisors.map((sup: any, idx: number) => (<Badge key={idx} variant="outline" className="flex items-center gap-1"><User className="h-3 w-3" />{sup.name}</Badge>))}</div></div>
            )}

            {(training.managers && training.managers.length > 0) && (
              <div><h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><UserCog className="h-4 w-4" />Managers</h4><div className="flex flex-wrap gap-2">{training.managers.map((mgr: any, idx: number) => (<Badge key={idx} variant="outline" className="flex items-center gap-1"><UserCog className="h-3 w-3" />{mgr.name}</Badge>))}</div></div>
            )}

            {training.objectives && training.objectives.length > 0 && (
              <div><h4 className="font-semibold text-sm mb-2">Training Objectives</h4><ul className="list-disc pl-5 space-y-1">{training.objectives.map((obj: string, idx: number) => (<li key={idx} className="text-sm text-gray-600">{obj}</li>))}</ul></div>
            )}

            {training.attachments && training.attachments.length > 0 && (
              <div><h4 className="font-semibold text-sm mb-2">Attachments</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{training.attachments.map((att: any, idx: number) => (<div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => setSelectedAttachment(att)}><div className="flex items-center gap-2">{att.type === 'image' ? <ImageIcon className="h-4 w-4 text-blue-500" /> : att.type === 'video' ? <Video className="h-4 w-4 text-red-500" /> : <File className="h-4 w-4 text-gray-500" />}<span className="text-sm truncate max-w-[150px]">{att.name}</span></div><Eye className="h-4 w-4 text-gray-400" /></div>))}</div></div>
            )}

            <div className="border-t pt-4 text-xs text-gray-500"><div className="flex justify-between"><span>Created: {formatDate(training.createdAt)}</span><span>Last Updated: {formatDate(training.updatedAt)}</span></div>{training.createdBy && <div className="mt-1">Created By: {training.createdBy}</div>}</div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => { onClose(); onEdit(training); }} className="flex-1"><Edit className="h-4 w-4 mr-2" />Edit Training</Button>
              <Select value={training.status} onValueChange={(value) => onUpdateStatus(training._id, value)}><SelectTrigger className="flex-1"><SelectValue placeholder="Update Status" /></SelectTrigger><SelectContent><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="ongoing">Ongoing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {selectedAttachment && <AttachmentViewer attachment={selectedAttachment} onClose={() => setSelectedAttachment(null)} />}
    </>
  );
});

TrainingDetailDialog.displayName = 'TrainingDetailDialog';

// Memoized Briefing Detail Dialog
const BriefingDetailDialog = memo(({ briefing, open, onClose, onEdit, onUpdateAction, getShiftBadge, getPriorityBadge, formatDate }: any) => {
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  if (!briefing) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg md:text-xl"><MessageSquare className="h-5 w-5" />Staff Briefing Details</DialogTitle></DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4">
              <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                <div><h2 className="text-xl font-bold">{briefing.site}</h2><p className="text-gray-600 mt-1">Conducted by: {briefing.conductedBy}</p></div>
                <Badge className={getShiftBadge(briefing.shift)}>{briefing.shift.charAt(0).toUpperCase() + briefing.shift.slice(1)} Shift</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Date & Time</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Calendar className="h-4 w-4 text-gray-400" /><span>{formatDate(briefing.date)} at {briefing.time}</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Attendees</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Users className="h-4 w-4 text-gray-400" /><span>{briefing.attendeesCount} staff members</span></div></div>
              <div className="space-y-2"><label className="text-xs font-medium text-gray-500">Department</label><div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Building className="h-4 w-4 text-gray-400" /><span>{briefing.department}</span></div></div>
            </div>

            {(briefing.supervisors && briefing.supervisors.length > 0) && (
              <div><h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><UserCheck className="h-4 w-4" />Supervisors</h4><div className="flex flex-wrap gap-2">{briefing.supervisors.map((sup: any, idx: number) => (<Badge key={idx} variant="outline" className="flex items-center gap-1"><User className="h-3 w-3" />{sup.name}</Badge>))}</div></div>
            )}

            {(briefing.managers && briefing.managers.length > 0) && (
              <div><h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><UserCog className="h-4 w-4" />Managers</h4><div className="flex flex-wrap gap-2">{briefing.managers.map((mgr: any, idx: number) => (<Badge key={idx} variant="outline" className="flex items-center gap-1"><UserCog className="h-3 w-3" />{mgr.name}</Badge>))}</div></div>
            )}

            {briefing.topics && briefing.topics.length > 0 && (<div><h4 className="font-semibold text-sm mb-2">Topics Discussed</h4><div className="flex flex-wrap gap-2">{briefing.topics.map((topic: string, idx: number) => (<Badge key={idx} variant="outline">{topic}</Badge>))}</div></div>)}
            {briefing.keyPoints && briefing.keyPoints.length > 0 && (<div><h4 className="font-semibold text-sm mb-2">Key Points</h4><ul className="list-disc pl-5 space-y-1">{briefing.keyPoints.map((point: string, idx: number) => (<li key={idx} className="text-sm text-gray-600">{point}</li>))}</ul></div>)}
            
            {briefing.actionItems && briefing.actionItems.length > 0 && (
              <div><h4 className="font-semibold text-sm mb-2">Action Items</h4><div className="space-y-2">{briefing.actionItems.map((item: any, idx: number) => (<div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded"><Button variant="ghost" size="icon" className="h-6 w-6 mt-1" onClick={() => onUpdateAction(briefing._id, item._id || item.id || '', item.status === 'completed' ? 'pending' : 'completed')}>{item.status === 'completed' ? <CheckSquare className="h-4 w-4 text-green-500" /> : <Square className="h-4 w-4 text-gray-400" />}</Button><div className="flex-1"><p className="font-medium text-sm">{item.description}</p><div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1"><span>Assigned to: {item.assignedTo}</span><span>Due: {formatDate(item.dueDate)}</span></div></div><Badge className={getPriorityBadge(item.priority)}>{item.priority.toUpperCase()}</Badge></div>))}</div></div>
            )}
            {briefing.notes && (<div><h4 className="font-semibold text-sm mb-2">Notes</h4><div className="p-3 bg-gray-50 rounded"><p className="text-sm text-gray-600">{briefing.notes}</p></div></div>)}
            {briefing.attachments && briefing.attachments.length > 0 && (<div><h4 className="font-semibold text-sm mb-2">Attachments</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{briefing.attachments.map((att: any, idx: number) => (<div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => setSelectedAttachment(att)}><div className="flex items-center gap-2">{att.type === 'image' ? <ImageIcon className="h-4 w-4 text-blue-500" /> : att.type === 'video' ? <Video className="h-4 w-4 text-red-500" /> : <File className="h-4 w-4 text-gray-500" />}<span className="text-sm truncate max-w-[150px]">{att.name}</span></div><Eye className="h-4 w-4 text-gray-400" /></div>))}</div></div>)}

            <div className="border-t pt-4 text-xs text-gray-500"><div className="flex justify-between"><span>Created: {formatDate(briefing.createdAt)}</span><span>Last Updated: {formatDate(briefing.updatedAt)}</span></div>{briefing.createdBy && <div className="mt-1">Created By: {briefing.createdBy}</div>}</div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => { onClose(); onEdit(briefing); }} className="flex-1"><Edit className="h-4 w-4 mr-2" />Edit Briefing</Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {selectedAttachment && <AttachmentViewer attachment={selectedAttachment} onClose={() => setSelectedAttachment(null)} />}
    </>
  );
});

BriefingDetailDialog.displayName = 'BriefingDetailDialog';

// Memoized Mobile responsive supervisor selection card
const MobileSupervisorCard = memo(({ supervisor, selected, onToggle }: { supervisor: Supervisor; selected: boolean; onToggle: (id: string) => void }) => (
  <div onClick={() => onToggle(supervisor._id)} className={`p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/20'}`}>
    <div className="flex items-center gap-3"><div className={`flex items-center justify-center h-5 w-5 rounded border ${selected ? 'bg-primary border-primary' : 'border-gray-300'}`}>{selected && <Check className="h-3 w-3 text-primary-foreground" />}</div><div className="flex-1"><div className="flex items-center justify-between"><h4 className="font-medium text-sm">{supervisor.name}</h4></div><p className="text-xs text-muted-foreground mt-1">{supervisor.department}</p></div></div>
  </div>
));

MobileSupervisorCard.displayName = 'MobileSupervisorCard';

// Memoized Mobile responsive manager selection card
const MobileManagerCard = memo(({ manager, selected, onToggle }: { manager: Manager; selected: boolean; onToggle: (id: string) => void }) => (
  <div onClick={() => onToggle(manager._id)} className={`p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/20'}`}>
    <div className="flex items-center gap-3"><div className={`flex items-center justify-center h-5 w-5 rounded border ${selected ? 'bg-primary border-primary' : 'border-gray-300'}`}>{selected && <Check className="h-3 w-3 text-primary-foreground" />}</div><div className="flex-1"><div className="flex items-center justify-between"><h4 className="font-medium text-sm">{manager.name}</h4></div><p className="text-xs text-muted-foreground mt-1">{manager.department}</p></div></div>
  </div>
));

MobileManagerCard.displayName = 'MobileManagerCard';

// Memoized Mobile responsive employee selection card
const MobileEmployeeCard = memo(({ employee, selected, onToggle }: { employee: Employee; selected: boolean; onToggle: (id: string) => void }) => (
  <div onClick={() => onToggle(employee._id)} className={`p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/20'}`}>
    <div className="flex items-center gap-3"><div className={`flex items-center justify-center h-5 w-5 rounded border ${selected ? 'bg-primary border-primary' : 'border-gray-300'}`}>{selected && <Check className="h-3 w-3 text-primary-foreground" />}</div><div className="flex-1"><div className="flex items-center justify-between"><h4 className="font-medium text-sm">{employee.name}</h4><Badge variant="outline" className="text-xs">{employee.employeeId}</Badge></div><p className="text-xs text-muted-foreground mt-1">{employee.position}</p></div></div>
  </div>
));

MobileEmployeeCard.displayName = 'MobileEmployeeCard';

// Memoized Mobile responsive training card
const MobileTrainingCard = memo(({ session, onView, onUpdateStatus, onDelete, getTypeColor, getStatusBadge, formatDate, trainingTypes, loading, canEdit }: any) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="mb-3 overflow-hidden"><CardContent className="p-4">
      <div className="flex items-start justify-between mb-2"><div className="flex-1"><h3 className="font-semibold text-base">{session.title}</h3><p className="text-xs text-muted-foreground mt-1">Trainer: {session.trainer}</p></div><div className="flex items-center gap-1"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onView(session)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>{canEdit && (<><DropdownMenuItem onClick={() => onUpdateStatus(session._id, 'scheduled')}><Calendar className="h-4 w-4 mr-2" /> Scheduled</DropdownMenuItem><DropdownMenuItem onClick={() => onUpdateStatus(session._id, 'ongoing')}><Clock className="h-4 w-4 mr-2" /> Ongoing</DropdownMenuItem><DropdownMenuItem onClick={() => onUpdateStatus(session._id, 'completed')}><CheckCircle className="h-4 w-4 mr-2" /> Completed</DropdownMenuItem><DropdownMenuItem onClick={() => onUpdateStatus(session._id, 'cancelled')}><XCircle className="h-4 w-4 mr-2" /> Cancelled</DropdownMenuItem><DropdownMenuItem onClick={() => onDelete(session._id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem></>)}</DropdownMenuContent></DropdownMenu><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button></div></div>
      <div className="flex items-center gap-2 mb-2 flex-wrap"><Badge className={getTypeColor(session.type)}>{trainingTypes.find((t: any) => t.value === session.type)?.label || session.type}</Badge><Badge className={getStatusBadge(session.status)}>{session.status.charAt(0).toUpperCase() + session.status.slice(1)}</Badge></div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-2"><div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{formatDate(session.date)}</span></div><div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{session.time} ({session.duration})</span></div><div className="flex items-center gap-1"><Building className="h-3 w-3 text-muted-foreground" /><span className="text-xs truncate">{session.site}</span></div><div className="flex items-center gap-1"><Users className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{session.attendees?.length || 0}/{session.maxAttendees}</span></div></div>
      {expanded && (<div className="mt-3 pt-3 border-t space-y-3"><div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{session.description}</p></div><div><p className="text-xs text-muted-foreground">Location</p><p className="text-sm">{session.location}</p></div><div><p className="text-xs text-muted-foreground">Department</p><p className="text-sm">{session.department}</p></div>{session.objectives && session.objectives.length > 0 && (<div><p className="text-xs text-muted-foreground">Objectives</p><ul className="list-disc pl-4 text-sm">{session.objectives.slice(0, 3).map((obj: string, idx: number) => (<li key={idx} className="text-xs">{obj}</li>))}{session.objectives.length > 3 && (<li className="text-xs text-muted-foreground">+{session.objectives.length - 3} more</li>)}</ul></div>)}</div>)}
    </CardContent></Card>
  );
});

MobileTrainingCard.displayName = 'MobileTrainingCard';

// Memoized Mobile responsive briefing card
const MobileBriefingCard = memo(({ briefing, onView, onDelete, onUpdateAction, getShiftBadge, getPriorityBadge, formatDate, loading, canEdit }: any) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="mb-3 overflow-hidden"><CardContent className="p-4">
      <div className="flex items-start justify-between mb-2"><div className="flex-1"><h3 className="font-semibold text-base">{briefing.site}</h3><p className="text-xs text-muted-foreground">Conducted by: {briefing.conductedBy}</p></div><div className="flex items-center gap-1"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onView(briefing)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>{canEdit && (<DropdownMenuItem onClick={() => onDelete(briefing._id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button></div></div>
      <div className="flex items-center gap-2 mb-2"><Badge className={getShiftBadge(briefing.shift)}>{briefing.shift.charAt(0).toUpperCase() + briefing.shift.slice(1)} Shift</Badge><Badge variant="outline" className="bg-blue-50">{briefing.department}</Badge></div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-2"><div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{formatDate(briefing.date)}</span></div><div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{briefing.time}</span></div><div className="flex items-center gap-1"><Users className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{briefing.attendeesCount} attendees</span></div></div>
      {briefing.topics && briefing.topics.length > 0 && (<div className="flex flex-wrap gap-1 mb-2">{briefing.topics.slice(0, 2).map((topic: string, idx: number) => (<Badge key={idx} variant="outline" className="text-xs">{topic}</Badge>))}{briefing.topics.length > 2 && (<Badge variant="outline" className="text-xs">+{briefing.topics.length - 2}</Badge>)}</div>)}
      {expanded && (<div className="mt-3 pt-3 border-t space-y-3">{briefing.supervisors && briefing.supervisors.length > 0 && (<div><p className="text-xs text-muted-foreground">Supervisors</p><div className="flex flex-wrap gap-1 mt-1">{briefing.supervisors.map((sup: any, idx: number) => (<Badge key={idx} variant="outline" className="text-xs"><User className="h-3 w-3 mr-1" />{sup.name}</Badge>))}</div></div>)}{briefing.managers && briefing.managers.length > 0 && (<div><p className="text-xs text-muted-foreground">Managers</p><div className="flex flex-wrap gap-1 mt-1">{briefing.managers.map((mgr: any, idx: number) => (<Badge key={idx} variant="outline" className="text-xs"><UserCog className="h-3 w-3 mr-1" />{mgr.name}</Badge>))}</div></div>)}{briefing.keyPoints && briefing.keyPoints.length > 0 && (<div><p className="text-xs text-muted-foreground">Key Points</p><ul className="list-disc pl-4 text-sm">{briefing.keyPoints.map((point: string, idx: number) => (<li key={idx} className="text-xs">{point}</li>))}</ul></div>)}{briefing.actionItems && briefing.actionItems.length > 0 && (<div><p className="text-xs text-muted-foreground mb-2">Action Items</p><div className="space-y-2">{briefing.actionItems.slice(0, 3).map((item: any) => (<div key={item._id || item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdateAction(briefing._id, item._id || item.id || '', item.status === 'completed' ? 'pending' : 'completed')}>{item.status === 'completed' ? <CheckSquare className="h-4 w-4 text-green-500" /> : <Square className="h-4 w-4 text-gray-400" />}</Button><div className="flex-1"><p className="text-xs font-medium">{item.description}</p><div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{item.assignedTo}</span><span>•</span><span>Due: {formatDate(item.dueDate)}</span></div></div><Badge className={getPriorityBadge(item.priority)}>{item.priority}</Badge></div>))}{briefing.actionItems.length > 3 && (<p className="text-xs text-muted-foreground text-center">+{briefing.actionItems.length - 3} more items</p>)}</div></div>)}{briefing.notes && (<div><p className="text-xs text-muted-foreground">Notes</p><p className="text-sm bg-gray-50 p-2 rounded">{briefing.notes}</p></div>)}</div>)}
    </CardContent></Card>
  );
});

MobileBriefingCard.displayName = 'MobileBriefingCard';

// Memoized Stat Card
const MobileStatCard = memo(({ title, value, subValue, icon: Icon, color = "blue" }: any) => {
  const colorClasses: any = { blue: "bg-blue-100 text-blue-600", green: "bg-green-100 text-green-600", purple: "bg-purple-100 text-purple-600", red: "bg-red-100 text-red-600" };
  return (<Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{title}</p><p className="text-xl font-bold mt-1">{value}</p>{subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}</div><div className={`p-3 rounded-lg ${colorClasses[color]}`}><Icon className="h-5 w-5" /></div></div></CardContent></Card>);
});

MobileStatCard.displayName = 'MobileStatCard';

// Form Components defined outside to prevent recreation on each render

// Attachments Section Component
const AttachmentsSection = memo(({ attachments, onUpload, onRemove, fileInputRef, title = "Attachments" }: any) => (
  <div className="py-4 border-t"><div className="flex justify-between items-center mb-4"><div><h3 className="text-lg font-semibold">{title}</h3><p className="text-xs text-gray-500">Upload files</p></div><div><input type="file" ref={fileInputRef} multiple onChange={onUpload} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" /><Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Upload</Button></div></div>
    {attachments.length > 0 && (<div className="space-y-2 max-h-40 overflow-y-auto">{attachments.map((file: any, idx: number) => (<div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-3 flex-1">{file.type?.startsWith('image/') || file.type === 'image' ? <ImageIcon className="h-5 w-5 text-blue-500" /> : file.type?.startsWith('video/') || file.type === 'video' ? <Video className="h-5 w-5 text-red-500" /> : <File className="h-5 w-5 text-gray-500" />}<div><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-gray-500">{file.size}</p></div></div><Button variant="ghost" size="sm" onClick={() => onRemove(idx)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>))}</div>)}
  </div>
));

AttachmentsSection.displayName = 'AttachmentsSection';

// Supervisors MultiSelect Component
const SupervisorsMultiSelect = memo(({ selected, onToggle, searchQuery, setSearchQuery, disabled, filteredSupervisorsList }: any) => (
  <div className="py-4 border-t"><div className="mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5" />Supervisors *</h3><p className="text-xs text-gray-500">Select supervisors assigned to this site</p></div>
    <div className="space-y-2"><Input placeholder="Search supervisors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9" disabled={disabled} />
      <div className="border rounded-lg max-h-40 overflow-y-auto p-2">{filteredSupervisorsList.length > 0 ? filteredSupervisorsList.map((sup: Supervisor) => (<MobileSupervisorCard key={sup._id} supervisor={sup} selected={selected.includes(sup._id)} onToggle={onToggle} />)) : (<div className="text-center py-4 text-muted-foreground">{disabled ? "Select a site first" : "No supervisors available"}</div>)}</div>
      {selected.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">{selected.map((id: string) => { const sup = filteredSupervisorsList.find((s: Supervisor) => s._id === id); return sup ? (<Badge key={id} variant="secondary" className="flex items-center gap-1 text-xs">{sup.name}<X className="h-3 w-3 cursor-pointer" onClick={() => onToggle(id)} /></Badge>) : null; })}</div>)}
    </div>
  </div>
));

SupervisorsMultiSelect.displayName = 'SupervisorsMultiSelect';

// Managers MultiSelect Component
const ManagersMultiSelect = memo(({ selected, onToggle, searchQuery, setSearchQuery, disabled, filteredManagersList }: any) => (
  <div className="py-4 border-t"><div className="mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><UserCog className="h-5 w-5" />Managers *</h3><p className="text-xs text-gray-500">Select managers assigned to this site</p></div>
    <div className="space-y-2"><Input placeholder="Search managers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9" disabled={disabled} />
      <div className="border rounded-lg max-h-40 overflow-y-auto p-2">{filteredManagersList.length > 0 ? filteredManagersList.map((mgr: Manager) => (<MobileManagerCard key={mgr._id} manager={mgr} selected={selected.includes(mgr._id)} onToggle={onToggle} />)) : (<div className="text-center py-4 text-muted-foreground">{disabled ? "Select a site first" : "No managers available"}</div>)}</div>
      {selected.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">{selected.map((id: string) => { const mgr = filteredManagersList.find((m: Manager) => m._id === id); return mgr ? (<Badge key={id} variant="secondary" className="flex items-center gap-1 text-xs">{mgr.name}<X className="h-3 w-3 cursor-pointer" onClick={() => onToggle(id)} /></Badge>) : null; })}</div>)}
    </div>
  </div>
));

ManagersMultiSelect.displayName = 'ManagersMultiSelect';

// Employees MultiSelect Component
const EmployeesMultiSelect = memo(({ selected, onToggle, searchQuery, setSearchQuery, disabled, filteredEmployeesList }: any) => (
  <div className="py-4 border-t"><div className="mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" />Employees</h3><p className="text-xs text-gray-500">Select employees to assign</p></div>
    <div className="space-y-2"><Input placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9" disabled={disabled} />
      <div className="border rounded-lg max-h-40 overflow-y-auto p-2">{filteredEmployeesList.length > 0 ? filteredEmployeesList.filter((e: Employee) => e.status === "active").map((emp: Employee) => (<MobileEmployeeCard key={emp._id} employee={emp} selected={selected.includes(emp._id)} onToggle={onToggle} />)) : (<div className="text-center py-4 text-muted-foreground">No employees available</div>)}</div>
      {selected.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">{selected.map((id: string) => { const emp = filteredEmployeesList.find((e: Employee) => e._id === id); return emp ? (<Badge key={id} variant="secondary" className="flex items-center gap-1 text-xs">{emp.name}<X className="h-3 w-3 cursor-pointer" onClick={() => onToggle(id)} /></Badge>) : null; })}</div>)}
    </div>
  </div>
));

EmployeesMultiSelect.displayName = 'EmployeesMultiSelect';

// Action Items Section Component
const ActionItemsSection = memo(({ actionItems, onAdd, onRemove, onUpdate }: any) => (
  <div className="py-4 border-t"><div className="flex justify-between items-center mb-4"><div><h3 className="text-lg font-semibold">Action Items</h3><p className="text-xs text-gray-500">Add tasks assigned during briefing</p></div><Button variant="outline" onClick={onAdd}><Plus className="h-4 w-4 mr-2" />Add Item</Button></div>
    {actionItems.map((item: any, idx: number) => (<div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded mb-3"><div className="sm:col-span-2"><label className="text-xs font-medium">Description</label><Input value={item.description} onChange={(e) => onUpdate(idx, 'description', e.target.value)} /></div><div><label className="text-xs font-medium">Assigned To</label><Input value={item.assignedTo} onChange={(e) => onUpdate(idx, 'assignedTo', e.target.value)} /></div><div><label className="text-xs font-medium">Due Date</label><Input type="date" value={item.dueDate} onChange={(e) => onUpdate(idx, 'dueDate', e.target.value)} /></div><div className="flex items-end gap-2"><div className="flex-1"><label className="text-xs font-medium">Priority</label><Select value={item.priority} onValueChange={(v) => onUpdate(idx, 'priority', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorities.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select></div><Button variant="ghost" size="sm" onClick={() => onRemove(idx)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></div>))}
  </div>
));

ActionItemsSection.displayName = 'ActionItemsSection';

// Add Training Form Component
const AddTrainingFormComponent = memo(({ trainingForm, setTrainingForm, addObjective, removeObjective, updateObjective, sites }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
    <div className="space-y-4">
      <div><label className="text-sm font-medium">Title *</label><Input value={trainingForm.title} onChange={(e) => setTrainingForm((prev: any) => ({ ...prev, title: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Type</label><Select value={trainingForm.type} onValueChange={(v: any) => setTrainingForm((prev: any) => ({ ...prev, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{trainingTypes.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Date *</label><Input type="date" value={trainingForm.date} onChange={(e) => setTrainingForm((prev: any) => ({ ...prev, date: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Time</label><Input type="time" value={trainingForm.time} onChange={(e) => setTrainingForm((prev: any) => ({ ...prev, time: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Duration</label><Input placeholder="e.g., 2 hours" value={trainingForm.duration} onChange={(e) => setTrainingForm((prev: any) => ({ ...prev, duration: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Trainer *</label><Input value={trainingForm.trainer} onChange={(e) => setTrainingForm((prev: any) => ({ ...prev, trainer: e.target.value }))} /></div>
    </div>
    <div className="space-y-4">
      <div><label className="text-sm font-medium">Site *</label><Select value={trainingForm.site} onValueChange={(v) => setTrainingForm((prev: any) => ({ ...prev, site: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sites.map((s: Site) => (<SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Department</label><Select value={trainingForm.department} onValueChange={(v) => setTrainingForm((prev: any) => ({ ...prev, department: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{departments.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Max Attendees</label><Input type="number" value={trainingForm.maxAttendees} onChange={(e) => setTrainingForm((prev: any) => ({ ...prev, maxAttendees: parseInt(e.target.value) || 1 }))} /></div>
      <div><label className="text-sm font-medium">Location</label><Input value={trainingForm.location} onChange={(e) => setTrainingForm((prev: any) => ({ ...prev, location: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Objectives</label><div className="space-y-2">{trainingForm.objectives.map((obj: string, idx: number) => (<div key={idx} className="flex gap-2"><Input 
        placeholder={`Objective ${idx + 1}`} 
        value={obj} 
        onChange={(e) => updateObjective(idx, e.target.value)} 
      /><Button variant="ghost" size="sm" onClick={() => removeObjective(idx)}><X className="h-4 w-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={addObjective}><Plus className="h-4 w-4 mr-2" />Add Objective</Button></div></div>
      <div><label className="text-sm font-medium">Description</label><Textarea value={trainingForm.description} onChange={(e) => setTrainingForm((prev: any) => ({ ...prev, description: e.target.value }))} rows={3} /></div>
    </div>
  </div>
));

AddTrainingFormComponent.displayName = 'AddTrainingFormComponent';

// Add Briefing Form Component
const AddBriefingFormComponent = memo(({ briefingForm, setBriefingForm, addTopic, removeTopic, updateTopic, addKeyPoint, removeKeyPoint, updateKeyPoint, sites }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
    <div className="space-y-4">
      <div><label className="text-sm font-medium">Date *</label><Input type="date" value={briefingForm.date} onChange={(e) => setBriefingForm((prev: any) => ({ ...prev, date: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Time</label><Input type="time" value={briefingForm.time} onChange={(e) => setBriefingForm((prev: any) => ({ ...prev, time: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Shift</label><Select value={briefingForm.shift} onValueChange={(v: any) => setBriefingForm((prev: any) => ({ ...prev, shift: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{shifts.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Conducted By *</label><Input value={briefingForm.conductedBy} onChange={(e) => setBriefingForm((prev: any) => ({ ...prev, conductedBy: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Site *</label><Select value={briefingForm.site} onValueChange={(v) => setBriefingForm((prev: any) => ({ ...prev, site: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sites.map((s: Site) => (<SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Department</label><Select value={briefingForm.department} onValueChange={(v) => setBriefingForm((prev: any) => ({ ...prev, department: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{departments.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Attendees Count</label><Input type="number" value={briefingForm.attendeesCount} onChange={(e) => setBriefingForm((prev: any) => ({ ...prev, attendeesCount: parseInt(e.target.value) || 0 }))} /></div>
    </div>
    <div className="space-y-4">
      <div><label className="text-sm font-medium">Topics</label><div className="space-y-2">{briefingForm.topics.map((topic: string, idx: number) => (<div key={idx} className="flex gap-2"><Input 
        placeholder={`Topic ${idx + 1}`} 
        value={topic} 
        onChange={(e) => updateTopic(idx, e.target.value)} 
      /><Button variant="ghost" size="sm" onClick={() => removeTopic(idx)}><X className="h-4 w-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={addTopic}><Plus className="h-4 w-4 mr-2" />Add Topic</Button></div></div>
      <div><label className="text-sm font-medium">Key Points</label><div className="space-y-2">{briefingForm.keyPoints.map((point: string, idx: number) => (<div key={idx} className="flex gap-2"><Input 
        placeholder={`Key point ${idx + 1}`} 
        value={point} 
        onChange={(e) => updateKeyPoint(idx, e.target.value)} 
      /><Button variant="ghost" size="sm" onClick={() => removeKeyPoint(idx)}><X className="h-4 w-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={addKeyPoint}><Plus className="h-4 w-4 mr-2" />Add Key Point</Button></div></div>
      <div><label className="text-sm font-medium">Notes</label><Textarea value={briefingForm.notes} onChange={(e) => setBriefingForm((prev: any) => ({ ...prev, notes: e.target.value }))} rows={3} /></div>
    </div>
  </div>
));

AddBriefingFormComponent.displayName = 'AddBriefingFormComponent';

// Edit Training Form Component
const EditTrainingFormComponent = memo(({ editTrainingForm, setEditTrainingForm, addEditObjective, removeEditObjective, updateEditObjective, sites }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
    <div className="space-y-4">
      <div><label className="text-sm font-medium">Title *</label><Input value={editTrainingForm.title} onChange={(e) => setEditTrainingForm((prev: any) => ({ ...prev, title: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Type</label><Select value={editTrainingForm.type} onValueChange={(v: any) => setEditTrainingForm((prev: any) => ({ ...prev, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{trainingTypes.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Date *</label><Input type="date" value={editTrainingForm.date} onChange={(e) => setEditTrainingForm((prev: any) => ({ ...prev, date: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Time</label><Input type="time" value={editTrainingForm.time} onChange={(e) => setEditTrainingForm((prev: any) => ({ ...prev, time: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Duration</label><Input value={editTrainingForm.duration} onChange={(e) => setEditTrainingForm((prev: any) => ({ ...prev, duration: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Trainer *</label><Input value={editTrainingForm.trainer} onChange={(e) => setEditTrainingForm((prev: any) => ({ ...prev, trainer: e.target.value }))} /></div>
    </div>
    <div className="space-y-4">
      <div><label className="text-sm font-medium">Site *</label><Select value={editTrainingForm.site} onValueChange={(v) => setEditTrainingForm((prev: any) => ({ ...prev, site: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sites.map((s: Site) => (<SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Department</label><Select value={editTrainingForm.department} onValueChange={(v) => setEditTrainingForm((prev: any) => ({ ...prev, department: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{departments.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Max Attendees</label><Input type="number" value={editTrainingForm.maxAttendees} onChange={(e) => setEditTrainingForm((prev: any) => ({ ...prev, maxAttendees: parseInt(e.target.value) || 1 }))} /></div>
      <div><label className="text-sm font-medium">Location</label><Input value={editTrainingForm.location} onChange={(e) => setEditTrainingForm((prev: any) => ({ ...prev, location: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Objectives</label><div className="space-y-2">{editTrainingForm.objectives.map((obj: string, idx: number) => (<div key={idx} className="flex gap-2"><Input 
        placeholder={`Objective ${idx + 1}`} 
        value={obj} 
        onChange={(e) => updateEditObjective(idx, e.target.value)} 
      /><Button variant="ghost" size="sm" onClick={() => removeEditObjective(idx)}><X className="h-4 w-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={addEditObjective}><Plus className="h-4 w-4 mr-2" />Add Objective</Button></div></div>
      <div><label className="text-sm font-medium">Description</label><Textarea value={editTrainingForm.description} onChange={(e) => setEditTrainingForm((prev: any) => ({ ...prev, description: e.target.value }))} rows={3} /></div>
    </div>
  </div>
));

EditTrainingFormComponent.displayName = 'EditTrainingFormComponent';

// Edit Briefing Form Component
const EditBriefingFormComponent = memo(({ editBriefingForm, setEditBriefingForm, addEditTopic, removeEditTopic, updateEditTopic, addEditKeyPoint, removeEditKeyPoint, updateEditKeyPoint, sites }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
    <div className="space-y-4">
      <div><label className="text-sm font-medium">Date *</label><Input type="date" value={editBriefingForm.date} onChange={(e) => setEditBriefingForm((prev: any) => ({ ...prev, date: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Time</label><Input type="time" value={editBriefingForm.time} onChange={(e) => setEditBriefingForm((prev: any) => ({ ...prev, time: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Shift</label><Select value={editBriefingForm.shift} onValueChange={(v: any) => setEditBriefingForm((prev: any) => ({ ...prev, shift: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{shifts.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Conducted By *</label><Input value={editBriefingForm.conductedBy} onChange={(e) => setEditBriefingForm((prev: any) => ({ ...prev, conductedBy: e.target.value }))} /></div>
      <div><label className="text-sm font-medium">Site *</label><Select value={editBriefingForm.site} onValueChange={(v) => setEditBriefingForm((prev: any) => ({ ...prev, site: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sites.map((s: Site) => (<SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Department</label><Select value={editBriefingForm.department} onValueChange={(v) => setEditBriefingForm((prev: any) => ({ ...prev, department: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{departments.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent></Select></div>
      <div><label className="text-sm font-medium">Attendees Count</label><Input type="number" value={editBriefingForm.attendeesCount} onChange={(e) => setEditBriefingForm((prev: any) => ({ ...prev, attendeesCount: parseInt(e.target.value) || 0 }))} /></div>
    </div>
    <div className="space-y-4">
      <div><label className="text-sm font-medium">Topics</label><div className="space-y-2">{editBriefingForm.topics.map((topic: string, idx: number) => (<div key={idx} className="flex gap-2"><Input 
        placeholder={`Topic ${idx + 1}`} 
        value={topic} 
        onChange={(e) => updateEditTopic(idx, e.target.value)} 
      /><Button variant="ghost" size="sm" onClick={() => removeEditTopic(idx)}><X className="h-4 w-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={addEditTopic}><Plus className="h-4 w-4 mr-2" />Add Topic</Button></div></div>
      <div><label className="text-sm font-medium">Key Points</label><div className="space-y-2">{editBriefingForm.keyPoints.map((point: string, idx: number) => (<div key={idx} className="flex gap-2"><Input 
        placeholder={`Key point ${idx + 1}`} 
        value={point} 
        onChange={(e) => updateEditKeyPoint(idx, e.target.value)} 
      /><Button variant="ghost" size="sm" onClick={() => removeEditKeyPoint(idx)}><X className="h-4 w-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={addEditKeyPoint}><Plus className="h-4 w-4 mr-2" />Add Key Point</Button></div></div>
      <div><label className="text-sm font-medium">Notes</label><Textarea value={editBriefingForm.notes} onChange={(e) => setEditBriefingForm((prev: any) => ({ ...prev, notes: e.target.value }))} rows={3} /></div>
    </div>
  </div>
));

EditBriefingFormComponent.displayName = 'EditBriefingFormComponent';

// Main Component
const SupervisorTrainingBriefingSection: React.FC = () => {
  const { user: authUser, isAuthenticated } = useRole();
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [activeTab, setActiveTab] = useState<'training' | 'briefing'>('training');
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [staffBriefings, setStaffBriefings] = useState<StaffBriefing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [showAddBriefing, setShowAddBriefing] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<TrainingSession | null>(null);
  const [selectedBriefing, setSelectedBriefing] = useState<StaffBriefing | null>(null);
  const [editingTraining, setEditingTraining] = useState<TrainingSession | null>(null);
  const [editingBriefing, setEditingBriefing] = useState<StaffBriefing | null>(null);
  const [showEditTrainingDialog, setShowEditTrainingDialog] = useState(false);
  const [showEditBriefingDialog, setShowEditBriefingDialog] = useState(false);
  const [trainingAttachments, setTrainingAttachments] = useState<File[]>([]);
  const [briefingAttachments, setBriefingAttachments] = useState<File[]>([]);
  const [editTrainingAttachments, setEditTrainingAttachments] = useState<ExistingAttachment[]>([]);
  const [editBriefingAttachments, setEditBriefingAttachments] = useState<ExistingAttachment[]>([]);
  const [editTrainingNewFiles, setEditTrainingNewFiles] = useState<File[]>([]);
  const [editBriefingNewFiles, setEditBriefingNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editTrainingFileInputRef = useRef<HTMLInputElement>(null);
  const editBriefingFileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState({ sites: true, supervisors: true, managers: true, employees: true, trainings: true, briefings: true });
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Data states
  const [sites, setSites] = useState<Site[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Supervisor's assigned sites
  const supervisorId = authUser?._id || authUser?.id || "";
  const supervisorName = authUser?.name || "Supervisor";
  const [supervisorAssignedSites, setSupervisorAssignedSites] = useState<string[]>([]);
  const [supervisorAssignedSiteNames, setSupervisorAssignedSiteNames] = useState<string[]>([]);
  
  // Filtered states
  const [filteredSupervisors, setFilteredSupervisors] = useState<Supervisor[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  
  // Multi-select states
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [supervisorSearchQuery, setSupervisorSearchQuery] = useState("");
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  
  // Edit mode multi-select states
  const [editSelectedSupervisors, setEditSelectedSupervisors] = useState<string[]>([]);
  const [editSelectedManagers, setEditSelectedManagers] = useState<string[]>([]);
  const [editSupervisorSearchQuery, setEditSupervisorSearchQuery] = useState("");
  const [editManagerSearchQuery, setEditManagerSearchQuery] = useState("");
  
  // Training form
  const [trainingForm, setTrainingForm] = useState({
    title: '', description: '', type: 'safety' as const, date: '', time: '', duration: '', trainer: '', site: '', department: 'All Departments', maxAttendees: 20, location: '', objectives: [] as string[]
  });
  
  // Edit training form
  const [editTrainingForm, setEditTrainingForm] = useState({
    title: '', description: '', type: 'safety' as const, date: '', time: '', duration: '', trainer: '', site: '', department: 'All Departments', maxAttendees: 20, location: '', objectives: [] as string[]
  });
  
  // Briefing form
  const [briefingForm, setBriefingForm] = useState({
    date: '', time: '', conductedBy: '', site: '', department: '', attendeesCount: 0, topics: [] as string[], keyPoints: [] as string[], actionItems: [] as any[], notes: '', shift: 'morning' as const
  });
  
  // Edit briefing form
  const [editBriefingForm, setEditBriefingForm] = useState({
    date: '', time: '', conductedBy: '', site: '', department: '', attendeesCount: 0, topics: [] as string[], keyPoints: [] as string[], actionItems: [] as ActionItem[], notes: '', shift: 'morning' as const
  });

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get supervisor's assigned sites from tasks
  const fetchSupervisorAssignedSites = useCallback(async () => {
    if (!supervisorId) return;
    try {
      const allTasks = await assignTaskService.getAllAssignTasks();
      const assignedSitesSet = new Set<string>();
      const assignedSiteNamesSet = new Set<string>();
      allTasks.forEach((task: AssignTask) => {
        const isSupervisorAssigned = task.assignedSupervisors?.some(sup => sup.userId === supervisorId);
        if (isSupervisorAssigned && task.siteId) {
          assignedSitesSet.add(task.siteId);
          if (task.siteName) assignedSiteNamesSet.add(task.siteName);
        }
      });
      setSupervisorAssignedSites(Array.from(assignedSitesSet));
      setSupervisorAssignedSiteNames(Array.from(assignedSiteNamesSet));
    } catch (error) { console.error("Error fetching supervisor assigned sites:", error); toast.error("Failed to load your assigned sites"); }
  }, [supervisorId]);

  useEffect(() => {
    if (supervisorId && isAuthenticated) fetchSupervisorAssignedSites();
  }, [supervisorId, isAuthenticated, fetchSupervisorAssignedSites]);

  useEffect(() => {
    if (supervisorAssignedSites.length > 0) fetchAllData();
  }, [supervisorAssignedSites]);

  useEffect(() => {
    if (supervisorAssignedSites.length > 0) { fetchTrainings(); fetchBriefings(); }
  }, [searchTerm, filterDepartment, filterStatus, supervisorAssignedSites]);

  useEffect(() => {
    if (trainingForm.site) filterDataBySite(trainingForm.site);
    else if (briefingForm.site) filterDataBySite(briefingForm.site);
  }, [trainingForm.site, briefingForm.site, supervisors, managers, employees]);

  useEffect(() => {
    if (editTrainingForm.site) filterDataBySiteForEdit(editTrainingForm.site);
    else if (editBriefingForm.site) filterDataBySiteForEdit(editBriefingForm.site);
  }, [editTrainingForm.site, editBriefingForm.site, supervisors, managers, employees]);

  const filterDataBySiteForEdit = (siteName: string) => {
    const selectedSite = sites.find(site => site.name === siteName);
    if (!selectedSite) { setFilteredSupervisors([]); setFilteredManagers([]); setFilteredEmployees([]); return; }
    setFilteredSupervisors(supervisors.filter(sup => sup.assignedSites?.includes(selectedSite._id) || sup.site === siteName));
    setFilteredManagers(managers.filter(mgr => mgr.assignedSites?.includes(selectedSite._id) || mgr.site === siteName));
    setFilteredEmployees(employees.filter(emp => emp.siteName === siteName || emp.assignedSites?.includes(selectedSite._id)));
  };

  const fetchAllData = async () => {
    try {
      setLoadingData({ sites: true, supervisors: true, managers: true, employees: true, trainings: true, briefings: true });
      await Promise.all([fetchSites(), fetchSupervisorsAndManagers(), fetchEmployees(), fetchTrainings(), fetchBriefings()]);
    } catch (error) { console.error("Error fetching data:", error); toast.error("Failed to load data"); }
    finally { setLoadingData({ sites: false, supervisors: false, managers: false, employees: false, trainings: false, briefings: false }); }
  };

  const fetchSites = async () => {
    try {
      const data = await siteService.getAllSites();
      setSites(data.filter(site => supervisorAssignedSites.includes(site._id)));
    } catch (error) { console.error("Error fetching sites:", error); toast.error("Failed to load sites"); }
  };

  const fetchSupervisorsAndManagers = async () => {
    try {
      const tasksData = await assignTaskService.getAllAssignTasks();
      const supervisorMap = new Map<string, Supervisor>();
      const managerMap = new Map<string, Manager>();
      tasksData.forEach((task: AssignTask) => {
        if (supervisorAssignedSites.includes(task.siteId)) {
          task.assignedSupervisors?.forEach(user => {
            if (!supervisorMap.has(user.userId)) supervisorMap.set(user.userId, { _id: user.userId, name: user.name, email: '', role: 'supervisor', department: task.taskType || 'General', site: task.siteName, assignedSites: [task.siteId] });
            else { const existing = supervisorMap.get(user.userId); if (existing && !existing.assignedSites?.includes(task.siteId)) existing.assignedSites = [...(existing.assignedSites || []), task.siteId]; }
          });
          task.assignedManagers?.forEach(user => {
            if (!managerMap.has(user.userId)) managerMap.set(user.userId, { _id: user.userId, name: user.name, email: '', role: 'manager', department: task.taskType || 'General', site: task.siteName, assignedSites: [task.siteId] });
            else { const existing = managerMap.get(user.userId); if (existing && !existing.assignedSites?.includes(task.siteId)) existing.assignedSites = [...(existing.assignedSites || []), task.siteId]; }
          });
        }
      });
      setSupervisors(Array.from(supervisorMap.values()));
      setManagers(Array.from(managerMap.values()));
    } catch (error) { console.error("Error fetching supervisors and managers:", error); toast.error("Failed to load supervisors and managers"); }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      if (response.data.success) {
        const employeesData = response.data.data || [];
        const filtered = employeesData.filter((emp: Employee) => (emp.siteName && supervisorAssignedSiteNames.includes(emp.siteName)) || (emp.assignedSites && emp.assignedSites.some(site => supervisorAssignedSites.includes(site))));
        setEmployees(Array.from(new Map(filtered.map((emp: Employee) => [emp._id, emp])).values()).filter(emp => emp.status === "active"));
      }
    } catch (error) { console.error("Error fetching employees:", error); toast.error("Failed to load employees"); }
  };

  const fetchTrainings = async () => {
    try {
      setLoadingData(prev => ({ ...prev, trainings: true }));
      const response = await trainingApi.getAllTrainings({ search: searchTerm, department: filterDepartment === 'all' ? '' : filterDepartment, status: filterStatus === 'all' ? '' : filterStatus });
      if (response.success) setTrainingSessions(response.trainings.filter((t: TrainingSession) => supervisorAssignedSiteNames.includes(t.site)));
    } catch (error) { console.error("Error fetching trainings:", error); toast.error("Failed to load trainings"); }
    finally { setLoadingData(prev => ({ ...prev, trainings: false })); }
  };

  const fetchBriefings = async () => {
    try {
      setLoadingData(prev => ({ ...prev, briefings: true }));
      const response = await briefingApi.getAllBriefings({ search: searchTerm, department: filterDepartment === 'all' ? '' : filterDepartment });
      if (response.success) setStaffBriefings(response.briefings.filter((b: StaffBriefing) => supervisorAssignedSiteNames.includes(b.site)));
    } catch (error) { console.error("Error fetching briefings:", error); toast.error("Failed to load briefings"); }
    finally { setLoadingData(prev => ({ ...prev, briefings: false })); }
  };

  const filterDataBySite = (siteName: string) => {
    const selectedSite = sites.find(site => site.name === siteName);
    if (!selectedSite) { setFilteredSupervisors([]); setFilteredManagers([]); setFilteredEmployees([]); return; }
    setFilteredSupervisors(supervisors.filter(sup => sup.assignedSites?.includes(selectedSite._id) || sup.site === siteName));
    setFilteredManagers(managers.filter(mgr => mgr.assignedSites?.includes(selectedSite._id) || mgr.site === siteName));
    setFilteredEmployees(employees.filter(emp => emp.siteName === siteName || emp.assignedSites?.includes(selectedSite._id)));
  };

  const handleTrainingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { setTrainingAttachments(prev => [...prev, ...Array.from(e.target.files || [])]); toast.success(`${e.target.files?.length} file(s) added`); };
  const handleBriefingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { setBriefingAttachments(prev => [...prev, ...Array.from(e.target.files || [])]); toast.success(`${e.target.files?.length} file(s) added`); };
  const handleEditTrainingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({ name: file.name, type: file.type.startsWith('image/') ? 'image' as const : file.type.startsWith('video/') ? 'video' as const : 'document' as const, url: URL.createObjectURL(file), size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`, isNew: true, file }));
    setEditTrainingAttachments(prev => [...prev, ...newAttachments]);
    setEditTrainingNewFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) added`);
  };
  const handleEditBriefingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({ name: file.name, type: file.type.startsWith('image/') ? 'image' as const : file.type.startsWith('video/') ? 'video' as const : 'document' as const, url: URL.createObjectURL(file), size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`, isNew: true, file }));
    setEditBriefingAttachments(prev => [...prev, ...newAttachments]);
    setEditBriefingNewFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) added`);
  };
  const removeTrainingAttachment = (index: number) => { setTrainingAttachments(prev => prev.filter((_, i) => i !== index)); toast.info('File removed'); };
  const removeBriefingAttachment = (index: number) => { setBriefingAttachments(prev => prev.filter((_, i) => i !== index)); toast.info('File removed'); };
  const removeEditTrainingAttachment = (index: number) => {
    const att = editTrainingAttachments[index];
    if (att.isNew && att.url) URL.revokeObjectURL(att.url);
    setEditTrainingAttachments(prev => prev.filter((_, i) => i !== index));
    if (att.isNew && att.file) setEditTrainingNewFiles(prev => prev.filter(f => f !== att.file));
    toast.info('File removed');
  };
  const removeEditBriefingAttachment = (index: number) => {
    const att = editBriefingAttachments[index];
    if (att.isNew && att.url) URL.revokeObjectURL(att.url);
    setEditBriefingAttachments(prev => prev.filter((_, i) => i !== index));
    if (att.isNew && att.file) setEditBriefingNewFiles(prev => prev.filter(f => f !== att.file));
    toast.info('File removed');
  };

  const handleSupervisorToggle = (id: string) => setSelectedSupervisors(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleManagerToggle = (id: string) => setSelectedManagers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleEmployeeToggle = (id: string) => setSelectedEmployees(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleEditSupervisorToggle = (id: string) => setEditSelectedSupervisors(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleEditManagerToggle = (id: string) => setEditSelectedManagers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  // Fixed array handler functions - using functional updates with map
  const addObjective = () => setTrainingForm(prev => ({ ...prev, objectives: [...prev.objectives, ''] }));
  const removeObjective = (index: number) => setTrainingForm(prev => ({ ...prev, objectives: prev.objectives.filter((_, i) => i !== index) }));
  const updateObjective = (index: number, value: string) => {
    setTrainingForm(prev => {
      const newObjectives = [...prev.objectives];
      newObjectives[index] = value;
      return { ...prev, objectives: newObjectives };
    });
  };
  
  const addEditObjective = () => setEditTrainingForm(prev => ({ ...prev, objectives: [...prev.objectives, ''] }));
  const removeEditObjective = (index: number) => setEditTrainingForm(prev => ({ ...prev, objectives: prev.objectives.filter((_, i) => i !== index) }));
  const updateEditObjective = (index: number, value: string) => {
    setEditTrainingForm(prev => {
      const newObjectives = [...prev.objectives];
      newObjectives[index] = value;
      return { ...prev, objectives: newObjectives };
    });
  };
  
  const addTopic = () => setBriefingForm(prev => ({ ...prev, topics: [...prev.topics, ''] }));
  const removeTopic = (index: number) => setBriefingForm(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }));
  const updateTopic = (index: number, value: string) => {
    setBriefingForm(prev => {
      const newTopics = [...prev.topics];
      newTopics[index] = value;
      return { ...prev, topics: newTopics };
    });
  };
  
  const addEditTopic = () => setEditBriefingForm(prev => ({ ...prev, topics: [...prev.topics, ''] }));
  const removeEditTopic = (index: number) => setEditBriefingForm(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }));
  const updateEditTopic = (index: number, value: string) => {
    setEditBriefingForm(prev => {
      const newTopics = [...prev.topics];
      newTopics[index] = value;
      return { ...prev, topics: newTopics };
    });
  };
  
  const addKeyPoint = () => setBriefingForm(prev => ({ ...prev, keyPoints: [...prev.keyPoints, ''] }));
  const removeKeyPoint = (index: number) => setBriefingForm(prev => ({ ...prev, keyPoints: prev.keyPoints.filter((_, i) => i !== index) }));
  const updateKeyPoint = (index: number, value: string) => {
    setBriefingForm(prev => {
      const newPoints = [...prev.keyPoints];
      newPoints[index] = value;
      return { ...prev, keyPoints: newPoints };
    });
  };
  
  const addEditKeyPoint = () => setEditBriefingForm(prev => ({ ...prev, keyPoints: [...prev.keyPoints, ''] }));
  const removeEditKeyPoint = (index: number) => setEditBriefingForm(prev => ({ ...prev, keyPoints: prev.keyPoints.filter((_, i) => i !== index) }));
  const updateEditKeyPoint = (index: number, value: string) => {
    setEditBriefingForm(prev => {
      const newPoints = [...prev.keyPoints];
      newPoints[index] = value;
      return { ...prev, keyPoints: newPoints };
    });
  };
  
  const addActionItem = () => setBriefingForm(prev => ({ ...prev, actionItems: [...prev.actionItems, { description: '', assignedTo: '', dueDate: '', status: 'pending', priority: 'medium' }] }));
  const removeActionItem = (index: number) => setBriefingForm(prev => ({ ...prev, actionItems: prev.actionItems.filter((_, i) => i !== index) }));
  const updateActionItem = (index: number, field: string, value: string) => {
    setBriefingForm(prev => {
      const newItems = [...prev.actionItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, actionItems: newItems };
    });
  };
  
  const addEditActionItem = () => setEditBriefingForm(prev => ({ ...prev, actionItems: [...prev.actionItems, { description: '', assignedTo: '', dueDate: '', status: 'pending', priority: 'medium' }] }));
  const removeEditActionItem = (index: number) => setEditBriefingForm(prev => ({ ...prev, actionItems: prev.actionItems.filter((_, i) => i !== index) }));
  const updateEditActionItem = (index: number, field: string, value: string) => {
    setEditBriefingForm(prev => {
      const newItems = [...prev.actionItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, actionItems: newItems };
    });
  };

  const handleAddTraining = async () => {
    if (!trainingForm.title || !trainingForm.date || !trainingForm.trainer) { toast.error('Please fill in all required fields'); return; }
    if (selectedSupervisors.length === 0) { toast.error('Please select at least one supervisor'); return; }
    if (selectedManagers.length === 0) { toast.error('Please select at least one manager'); return; }
    try {
      setLoading(true);
      const supervisorsList = selectedSupervisors.map(id => { const s = filteredSupervisors.find(sup => sup._id === id); return s ? { id: s._id, name: s.name } : null; }).filter(Boolean);
      const managersList = selectedManagers.map(id => { const m = filteredManagers.find(mgr => mgr._id === id); return m ? { id: m._id, name: m.name } : null; }).filter(Boolean);
      const response = await trainingApi.createTraining({
        title: trainingForm.title, description: trainingForm.description, type: trainingForm.type, date: trainingForm.date, time: trainingForm.time,
        duration: trainingForm.duration, trainer: trainingForm.trainer, site: trainingForm.site, department: trainingForm.department,
        maxAttendees: trainingForm.maxAttendees, location: trainingForm.location, objectives: trainingForm.objectives.filter(o => o.trim() !== ''),
        supervisors: supervisorsList, managers: managersList, attendees: selectedEmployees
      }, trainingAttachments);
      if (response.success) { toast.success('Training added successfully'); await fetchTrainings(); resetTrainingForm(); setTrainingAttachments([]); setShowAddTraining(false); }
      else throw new Error(response.message);
    } catch (error: any) { toast.error(error.response?.data?.message || error.message || 'Error adding training'); }
    finally { setLoading(false); }
  };

  const handleAddBriefing = async () => {
    if (!briefingForm.date || !briefingForm.conductedBy || !briefingForm.site) { toast.error('Please fill in all required fields'); return; }
    if (selectedSupervisors.length === 0) { toast.error('Please select at least one supervisor'); return; }
    if (selectedManagers.length === 0) { toast.error('Please select at least one manager'); return; }
    try {
      setLoading(true);
      const supervisorsList = selectedSupervisors.map(id => { const s = filteredSupervisors.find(sup => sup._id === id); return s ? { id: s._id, name: s.name } : null; }).filter(Boolean);
      const managersList = selectedManagers.map(id => { const m = filteredManagers.find(mgr => mgr._id === id); return m ? { id: m._id, name: m.name } : null; }).filter(Boolean);
      const actionItems = briefingForm.actionItems.map((item: any) => ({ description: item.description, assignedTo: item.assignedTo, dueDate: item.dueDate, status: item.status || 'pending', priority: item.priority || 'medium' }));
      const response = await briefingApi.createBriefing({
        date: briefingForm.date, time: briefingForm.time, conductedBy: briefingForm.conductedBy, site: briefingForm.site, department: briefingForm.department,
        attendeesCount: briefingForm.attendeesCount, topics: briefingForm.topics.filter(t => t.trim() !== ''), keyPoints: briefingForm.keyPoints.filter(k => k.trim() !== ''),
        actionItems: actionItems, notes: briefingForm.notes, shift: briefingForm.shift, supervisors: supervisorsList, managers: managersList
      }, briefingAttachments);
      if (response.success) { toast.success('Briefing added successfully'); await fetchBriefings(); resetBriefingForm(); setBriefingAttachments([]); setShowAddBriefing(false); }
      else throw new Error(response.message);
    } catch (error: any) { toast.error(error.response?.data?.message || error.message || 'Error adding briefing'); }
    finally { setLoading(false); }
  };

  const handleUpdateTraining = async () => {
    if (!editingTraining) return;
    try {
      setLoading(true);
      const supervisorsList = editSelectedSupervisors.map(id => { const s = filteredSupervisors.find(sup => sup._id === id); return s ? { id: s._id, name: s.name } : null; }).filter(Boolean);
      const managersList = editSelectedManagers.map(id => { const m = filteredManagers.find(mgr => mgr._id === id); return m ? { id: m._id, name: m.name } : null; }).filter(Boolean);
      const existingAttachments = editTrainingAttachments.filter(att => !att.isNew).map(({ isNew, file, ...rest }) => rest);
      const response = await trainingApi.updateTraining(editingTraining._id, {
        title: editTrainingForm.title, description: editTrainingForm.description, type: editTrainingForm.type, date: editTrainingForm.date,
        time: editTrainingForm.time, duration: editTrainingForm.duration, trainer: editTrainingForm.trainer, site: editTrainingForm.site,
        department: editTrainingForm.department, maxAttendees: editTrainingForm.maxAttendees, location: editTrainingForm.location,
        objectives: editTrainingForm.objectives.filter(o => o.trim() !== ''), supervisors: supervisorsList, managers: managersList, attachments: existingAttachments
      }, editTrainingNewFiles);
      if (response.success) { toast.success('Training updated successfully'); await fetchTrainings(); setShowEditTrainingDialog(false); setEditingTraining(null); resetEditTrainingForm(); setEditTrainingAttachments([]); setEditTrainingNewFiles([]); }
      else throw new Error(response.message);
    } catch (error: any) { toast.error(error.response?.data?.message || error.message || 'Error updating training'); }
    finally { setLoading(false); }
  };

  const handleUpdateBriefing = async () => {
    if (!editingBriefing) return;
    try {
      setLoading(true);
      const supervisorsList = editSelectedSupervisors.map(id => { const s = filteredSupervisors.find(sup => sup._id === id); return s ? { id: s._id, name: s.name } : null; }).filter(Boolean);
      const managersList = editSelectedManagers.map(id => { const m = filteredManagers.find(mgr => mgr._id === id); return m ? { id: m._id, name: m.name } : null; }).filter(Boolean);
      const actionItems = editBriefingForm.actionItems.map(item => ({ description: item.description, assignedTo: item.assignedTo, dueDate: item.dueDate, status: item.status || 'pending', priority: item.priority || 'medium' }));
      const existingAttachments = editBriefingAttachments.filter(att => !att.isNew).map(({ isNew, file, ...rest }) => rest);
      const response = await briefingApi.updateBriefing(editingBriefing._id, {
        date: editBriefingForm.date, time: editBriefingForm.time, conductedBy: editBriefingForm.conductedBy, site: editBriefingForm.site,
        department: editBriefingForm.department, attendeesCount: editBriefingForm.attendeesCount, topics: editBriefingForm.topics.filter(t => t.trim() !== ''),
        keyPoints: editBriefingForm.keyPoints.filter(k => k.trim() !== ''), actionItems: actionItems, notes: editBriefingForm.notes, shift: editBriefingForm.shift,
        supervisors: supervisorsList, managers: managersList, attachments: existingAttachments
      }, editBriefingNewFiles);
      if (response.success) { toast.success('Briefing updated successfully'); await fetchBriefings(); setShowEditBriefingDialog(false); setEditingBriefing(null); resetEditBriefingForm(); setEditBriefingAttachments([]); setEditBriefingNewFiles([]); }
      else throw new Error(response.message);
    } catch (error: any) { toast.error(error.response?.data?.message || error.message || 'Error updating briefing'); }
    finally { setLoading(false); }
  };

  const deleteTraining = async (id: string) => { try { await trainingApi.deleteTraining(id); await fetchTrainings(); toast.success('Training deleted'); } catch (error: any) { toast.error('Error deleting training'); } };
  const deleteBriefing = async (id: string) => { try { await briefingApi.deleteBriefing(id); await fetchBriefings(); toast.success('Briefing deleted'); } catch (error: any) { toast.error('Error deleting briefing'); } };
  const updateTrainingStatus = async (id: string, status: string) => { try { await trainingApi.updateTrainingStatus(id, status); await fetchTrainings(); toast.success(`Status updated to ${status}`); } catch (error: any) { toast.error('Error updating status'); } };
  const updateActionItemStatus = async (briefingId: string, actionId: string, status: string) => { try { await briefingApi.updateActionItemStatus(briefingId, actionId, status); await fetchBriefings(); toast.success('Action item updated'); } catch (error: any) { toast.error('Error updating action item'); } };

  const resetTrainingForm = () => {
    setTrainingForm({ title: '', description: '', type: 'safety', date: '', time: '', duration: '', trainer: '', site: '', department: 'All Departments', maxAttendees: 20, location: '', objectives: [] });
    setSelectedSupervisors([]); setSelectedManagers([]); setSelectedEmployees([]);
    setSupervisorSearchQuery(""); setManagerSearchQuery(""); setEmployeeSearchQuery("");
  };
  const resetBriefingForm = () => {
    setBriefingForm({ date: '', time: '', conductedBy: '', site: '', department: '', attendeesCount: 0, topics: [], keyPoints: [], actionItems: [], notes: '', shift: 'morning' });
    setSelectedSupervisors([]); setSelectedManagers([]);
    setSupervisorSearchQuery(""); setManagerSearchQuery("");
  };
  const resetEditTrainingForm = () => {
    setEditTrainingForm({ title: '', description: '', type: 'safety', date: '', time: '', duration: '', trainer: '', site: '', department: 'All Departments', maxAttendees: 20, location: '', objectives: [] });
    setEditSelectedSupervisors([]); setEditSelectedManagers([]);
  };
  const resetEditBriefingForm = () => {
    setEditBriefingForm({ date: '', time: '', conductedBy: '', site: '', department: '', attendeesCount: 0, topics: [], keyPoints: [], actionItems: [], notes: '', shift: 'morning' });
    setEditSelectedSupervisors([]); setEditSelectedManagers([]);
  };

  const openEditTrainingDialog = (training: TrainingSession) => {
    setEditingTraining(training);
    setEditTrainingForm({ title: training.title, description: training.description, type: training.type, date: training.date, time: training.time, duration: training.duration, trainer: training.trainer, site: training.site, department: training.department, maxAttendees: training.maxAttendees, location: training.location, objectives: training.objectives || [] });
    setEditSelectedSupervisors(training.supervisors?.map(s => s.id) || []);
    setEditSelectedManagers(training.managers?.map(m => m.id) || []);
    setEditTrainingAttachments((training.attachments || []).map(att => ({ ...att, isNew: false })));
    setEditTrainingNewFiles([]);
    setShowEditTrainingDialog(true);
  };
  const openEditBriefingDialog = (briefing: StaffBriefing) => {
    setEditingBriefing(briefing);
    setEditBriefingForm({ date: briefing.date, time: briefing.time, conductedBy: briefing.conductedBy, site: briefing.site, department: briefing.department, attendeesCount: briefing.attendeesCount, topics: briefing.topics || [], keyPoints: briefing.keyPoints || [], actionItems: briefing.actionItems || [], notes: briefing.notes, shift: briefing.shift });
    setEditSelectedSupervisors(briefing.supervisors?.map(s => s.id) || []);
    setEditSelectedManagers(briefing.managers?.map(m => m.id) || []);
    setEditBriefingAttachments((briefing.attachments || []).map(att => ({ ...att, isNew: false })));
    setEditBriefingNewFiles([]);
    setShowEditBriefingDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  const getShiftBadge = (shift: string) => {
    switch (shift) {
      case 'morning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'evening': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'night': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  const getTypeColor = (type: string) => { const found = trainingTypes.find(t => t.value === type); return found?.color || 'bg-gray-100 text-gray-800'; };
  const formatDate = (dateString: string) => { try { const date = new Date(dateString); if (isNaN(date.getTime())) return dateString; return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }); } catch { return dateString; } };
  const nextMonth = () => setCurrentMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; });
  const prevMonth = () => setCurrentMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; });
  const getCalendarEvents = () => {
    const events: any[] = [];
    trainingSessions.forEach(s => events.push({ id: s._id, title: s.title, date: s.date, type: 'training', color: 'bg-blue-500', session: s }));
    staffBriefings.forEach(b => events.push({ id: b._id, title: `Briefing - ${b.department}`, date: b.date, type: 'briefing', color: 'bg-green-500', briefing: b }));
    return events;
  };
  const calendarEvents = getCalendarEvents();
  const handleRefresh = () => { fetchTrainings(); fetchBriefings(); toast.success('Data refreshed'); };

  // Compute filtered lists for multi-select components
  const filteredSupervisorsList = filteredSupervisors.filter(sup => sup.name.toLowerCase().includes(supervisorSearchQuery.toLowerCase()) || (sup.department && sup.department.toLowerCase().includes(supervisorSearchQuery.toLowerCase())));
  const filteredManagersList = filteredManagers.filter(mgr => mgr.name.toLowerCase().includes(managerSearchQuery.toLowerCase()) || (mgr.department && mgr.department.toLowerCase().includes(managerSearchQuery.toLowerCase())));
  const filteredEmployeesList = filteredEmployees.filter(emp => emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) || emp.employeeId.toLowerCase().includes(employeeSearchQuery.toLowerCase()) || (emp.position && emp.position.toLowerCase().includes(employeeSearchQuery.toLowerCase())));
  const filteredEditSupervisorsList = filteredSupervisors.filter(sup => sup.name.toLowerCase().includes(editSupervisorSearchQuery.toLowerCase()) || (sup.department && sup.department.toLowerCase().includes(editSupervisorSearchQuery.toLowerCase())));
  const filteredEditManagersList = filteredManagers.filter(mgr => mgr.name.toLowerCase().includes(editManagerSearchQuery.toLowerCase()) || (mgr.department && mgr.department.toLowerCase().includes(editManagerSearchQuery.toLowerCase())));

  const totalTrainings = trainingSessions.length;
  const totalBriefings = staffBriefings.length;
  const completedTrainings = trainingSessions.filter(t => t.status === 'completed').length;
  const pendingActions = staffBriefings.reduce((acc, b) => acc + b.actionItems.filter(a => a.status === 'pending').length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Hamburger Menu */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border-b border-border px-4 md:px-6 py-4 sticky top-0 z-40"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Training & Staff Briefing</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Manage training sessions and daily staff briefings for your assigned sites
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="p-3 sm:p-4 md:p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-50"><Building className="h-3 w-3 mr-1" />Your Sites: {supervisorAssignedSiteNames.length > 0 ? supervisorAssignedSiteNames.join(', ') : 'Loading...'}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}><CalendarDays className="h-4 w-4 mr-2" />{viewMode === 'list' ? 'Calendar' : 'List'}</Button>
              <Button variant="outline" onClick={handleRefresh}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
              <Dialog open={showAddTraining} onOpenChange={setShowAddTraining}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Training</Button></DialogTrigger>
                <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Add New Training Session</DialogTitle><DialogDescription>Schedule a new training session</DialogDescription></DialogHeader>
                  <AddTrainingFormComponent trainingForm={trainingForm} setTrainingForm={setTrainingForm} addObjective={addObjective} removeObjective={removeObjective} updateObjective={updateObjective} sites={sites} />
                  <SupervisorsMultiSelect selected={selectedSupervisors} onToggle={handleSupervisorToggle} searchQuery={supervisorSearchQuery} setSearchQuery={setSupervisorSearchQuery} disabled={!trainingForm.site} filteredSupervisorsList={filteredSupervisorsList} />
                  <ManagersMultiSelect selected={selectedManagers} onToggle={handleManagerToggle} searchQuery={managerSearchQuery} setSearchQuery={setManagerSearchQuery} disabled={!trainingForm.site} filteredManagersList={filteredManagersList} />
                  <EmployeesMultiSelect selected={selectedEmployees} onToggle={handleEmployeeToggle} searchQuery={employeeSearchQuery} setSearchQuery={setEmployeeSearchQuery} disabled={!trainingForm.site} filteredEmployeesList={filteredEmployeesList} />
                  <AttachmentsSection attachments={trainingAttachments} onUpload={handleTrainingFileUpload} onRemove={removeTrainingAttachment} fileInputRef={fileInputRef} title="Training Attachments" />
                  <DialogFooter><Button onClick={handleAddTraining}>Add Training</Button><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose></DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={showAddBriefing} onOpenChange={setShowAddBriefing}><DialogTrigger asChild><Button variant="secondary"><Plus className="h-4 w-4 mr-2" />Add Briefing</Button></DialogTrigger>
                <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Add New Staff Briefing</DialogTitle><DialogDescription>Record daily staff briefing details</DialogDescription></DialogHeader>
                  <AddBriefingFormComponent briefingForm={briefingForm} setBriefingForm={setBriefingForm} addTopic={addTopic} removeTopic={removeTopic} updateTopic={updateTopic} addKeyPoint={addKeyPoint} removeKeyPoint={removeKeyPoint} updateKeyPoint={updateKeyPoint} sites={sites} />
                  <SupervisorsMultiSelect selected={selectedSupervisors} onToggle={handleSupervisorToggle} searchQuery={supervisorSearchQuery} setSearchQuery={setSupervisorSearchQuery} disabled={!briefingForm.site} filteredSupervisorsList={filteredSupervisorsList} />
                  <ManagersMultiSelect selected={selectedManagers} onToggle={handleManagerToggle} searchQuery={managerSearchQuery} setSearchQuery={setManagerSearchQuery} disabled={!briefingForm.site} filteredManagersList={filteredManagersList} />
                  <ActionItemsSection actionItems={briefingForm.actionItems} onAdd={addActionItem} onRemove={removeActionItem} onUpdate={updateActionItem} />
                  <AttachmentsSection attachments={briefingAttachments} onUpload={handleBriefingFileUpload} onRemove={removeBriefingAttachment} fileInputRef={fileInputRef} title="Briefing Attachments" />
                  <DialogFooter><Button onClick={handleAddBriefing}>Add Briefing</Button><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MobileStatCard title="Total Trainings" value={totalTrainings} icon={Calendar} color="blue" />
            <MobileStatCard title="Staff Briefings" value={totalBriefings} icon={Users} color="green" />
            <MobileStatCard title="Completed" value={completedTrainings} icon={CheckCircle} color="purple" />
            <MobileStatCard title="Pending Actions" value={pendingActions} icon={AlertCircle} color="red" />
          </div>
        </motion.div>

        {loadingData.trainings && loadingData.briefings ? (<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>) : viewMode === 'list' ? (
          <>
            <Tabs defaultValue="training" onValueChange={(v: any) => setActiveTab(v)}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="training">Training</TabsTrigger><TabsTrigger value="briefing">Briefings</TabsTrigger></TabsList></Tabs>
            <Card className="mt-4"><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-3"><div className="flex items-center gap-2 flex-1"><Search className="h-4 w-4" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><div className="flex gap-2"><Select value={filterDepartment} onValueChange={setFilterDepartment}><SelectTrigger className="w-32"><SelectValue placeholder="Department" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{departments.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent></Select>{activeTab === 'training' && (<Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="ongoing">Ongoing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>)}</div></div></CardContent></Card>
            <AnimatePresence mode="wait">{activeTab === 'training' ? (
              <motion.div key="training"><Card className="mt-4"><CardHeader><CardTitle>Training Sessions</CardTitle></CardHeader><CardContent>{trainingSessions.length === 0 ? (<div className="text-center py-12"><Calendar className="h-12 w-12 mx-auto text-gray-300" /><p>No training sessions found</p><Button onClick={() => setShowAddTraining(true)} className="mt-4">Add Training</Button></div>) : isMobileView ? (<div className="space-y-3">{trainingSessions.map(s => (<MobileTrainingCard key={s._id} session={s} onView={setSelectedTraining} onUpdateStatus={updateTrainingStatus} onDelete={deleteTraining} getTypeColor={getTypeColor} getStatusBadge={getStatusBadge} formatDate={formatDate} trainingTypes={trainingTypes} loading={loading} canEdit={s.createdBy === supervisorId} />))}</div>) : (<div className="space-y-4">{trainingSessions.map(s => (<Card key={s._id}><CardContent className="p-4"><div className="flex justify-between"><div><h3 className="font-semibold">{s.title}</h3><p className="text-sm text-gray-600">{s.trainer}</p></div><div className="flex gap-2"><Badge className={getTypeColor(s.type)}>{trainingTypes.find(t => t.value === s.type)?.label}</Badge><Badge className={getStatusBadge(s.status)}>{s.status}</Badge></div></div><div className="grid grid-cols-4 gap-4 mt-4"><div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span className="text-xs">{formatDate(s.date)}</span></div><div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span className="text-xs">{s.time}</span></div><div className="flex items-center gap-1"><Building className="h-3 w-3" /><span className="text-xs">{s.site}</span></div><div className="flex items-center gap-1"><Users className="h-3 w-3" /><span className="text-xs">{s.attendees?.length}/{s.maxAttendees}</span></div></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" size="sm" onClick={() => setSelectedTraining(s)}><Eye className="h-4 w-4 mr-1" />View</Button>{s.createdBy === supervisorId && (<><Button variant="outline" size="sm" onClick={() => openEditTrainingDialog(s)}><Edit className="h-4 w-4 mr-1" />Edit</Button><Button variant="destructive" size="sm" onClick={() => deleteTraining(s._id)}><Trash2 className="h-4 w-4" /></Button></>)}</div></CardContent></Card>))}</div>)}</CardContent></Card></motion.div>
            ) : (
              <motion.div key="briefing"><Card className="mt-4"><CardHeader><CardTitle>Staff Briefings</CardTitle></CardHeader><CardContent>{staffBriefings.length === 0 ? (<div className="text-center py-12"><MessageSquare className="h-12 w-12 mx-auto text-gray-300" /><p>No staff briefings found</p><Button onClick={() => setShowAddBriefing(true)} className="mt-4">Add Briefing</Button></div>) : isMobileView ? (<div className="space-y-3">{staffBriefings.map(b => (<MobileBriefingCard key={b._id} briefing={b} onView={setSelectedBriefing} onDelete={deleteBriefing} onUpdateAction={updateActionItemStatus} getShiftBadge={getShiftBadge} getPriorityBadge={getPriorityBadge} formatDate={formatDate} loading={loading} canEdit={b.createdBy === supervisorId} />))}</div>) : (<div className="space-y-4">{staffBriefings.map(b => (<Card key={b._id}><CardContent className="p-4"><div className="flex justify-between"><div><h3 className="font-semibold">{b.site}</h3><p className="text-sm text-gray-600">by {b.conductedBy}</p></div><Badge className={getShiftBadge(b.shift)}>{b.shift}</Badge></div><div className="grid grid-cols-3 gap-4 mt-4"><div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span className="text-xs">{formatDate(b.date)}</span></div><div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span className="text-xs">{b.time}</span></div><div className="flex items-center gap-1"><Users className="h-3 w-3" /><span className="text-xs">{b.attendeesCount} attendees</span></div></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" size="sm" onClick={() => setSelectedBriefing(b)}><Eye className="h-4 w-4 mr-1" />View</Button>{b.createdBy === supervisorId && (<><Button variant="outline" size="sm" onClick={() => openEditBriefingDialog(b)}><Edit className="h-4 w-4 mr-1" />Edit</Button><Button variant="destructive" size="sm" onClick={() => deleteBriefing(b._id)}><Trash2 className="h-4 w-4" /></Button></>)}</div></CardContent></Card>))}</div>)}</CardContent></Card></motion.div>
            )}</AnimatePresence>
          </>
        ) : (
          <Card><CardHeader><CardTitle>Calendar View</CardTitle></CardHeader><CardContent><div className="grid grid-cols-7 gap-1 mb-4">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (<div key={i} className="text-center font-medium py-2 text-xs">{d}</div>))}{[...Array(35)].map((_, i) => (<div key={i} className="aspect-square border rounded p-1 text-xs hover:bg-gray-50 cursor-pointer"><div className="text-right text-gray-600">{i + 1}</div></div>))}</div><div className="space-y-3"><h4 className="font-semibold">Upcoming Events</h4>{calendarEvents.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5).map(e => (<div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded"><div className={`h-2 w-2 rounded-full ${e.color}`}></div><div><p className="text-sm font-medium">{e.title}</p><p className="text-xs text-gray-600">{formatDate(e.date)} • {e.type === 'training' ? 'Training' : 'Briefing'}</p></div><Button variant="ghost" size="sm" className="ml-auto" onClick={() => e.type === 'training' ? setSelectedTraining(e.session) : setSelectedBriefing(e.briefing)}>View</Button></div>))}</div></CardContent></Card>
        )}

        <TrainingDetailDialog training={selectedTraining} open={!!selectedTraining} onClose={() => setSelectedTraining(null)} onEdit={openEditTrainingDialog} onUpdateStatus={updateTrainingStatus} getStatusBadge={getStatusBadge} getTypeColor={getTypeColor} formatDate={formatDate} trainingTypes={trainingTypes} />
        <BriefingDetailDialog briefing={selectedBriefing} open={!!selectedBriefing} onClose={() => setSelectedBriefing(null)} onEdit={openEditBriefingDialog} onUpdateAction={updateActionItemStatus} getShiftBadge={getShiftBadge} getPriorityBadge={getPriorityBadge} formatDate={formatDate} />
        
        <Dialog open={showEditTrainingDialog} onOpenChange={setShowEditTrainingDialog}><DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit Training Session</DialogTitle></DialogHeader><EditTrainingFormComponent editTrainingForm={editTrainingForm} setEditTrainingForm={setEditTrainingForm} addEditObjective={addEditObjective} removeEditObjective={removeEditObjective} updateEditObjective={updateEditObjective} sites={sites} /><SupervisorsMultiSelect selected={editSelectedSupervisors} onToggle={handleEditSupervisorToggle} searchQuery={editSupervisorSearchQuery} setSearchQuery={setEditSupervisorSearchQuery} disabled={!editTrainingForm.site} filteredSupervisorsList={filteredEditSupervisorsList} /><ManagersMultiSelect selected={editSelectedManagers} onToggle={handleEditManagerToggle} searchQuery={editManagerSearchQuery} setSearchQuery={setEditManagerSearchQuery} disabled={!editTrainingForm.site} filteredManagersList={filteredEditManagersList} /><AttachmentsSection attachments={editTrainingAttachments} onUpload={handleEditTrainingFileUpload} onRemove={removeEditTrainingAttachment} fileInputRef={editTrainingFileInputRef} title="Attachments" /><DialogFooter><Button onClick={handleUpdateTraining}>Update Training</Button><Button variant="outline" onClick={() => setShowEditTrainingDialog(false)}>Cancel</Button></DialogFooter></DialogContent></Dialog>
        
        <Dialog open={showEditBriefingDialog} onOpenChange={setShowEditBriefingDialog}><DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit Staff Briefing</DialogTitle></DialogHeader><EditBriefingFormComponent editBriefingForm={editBriefingForm} setEditBriefingForm={setEditBriefingForm} addEditTopic={addEditTopic} removeEditTopic={removeEditTopic} updateEditTopic={updateEditTopic} addEditKeyPoint={addEditKeyPoint} removeEditKeyPoint={removeEditKeyPoint} updateEditKeyPoint={updateEditKeyPoint} sites={sites} /><SupervisorsMultiSelect selected={editSelectedSupervisors} onToggle={handleEditSupervisorToggle} searchQuery={editSupervisorSearchQuery} setSearchQuery={setEditSupervisorSearchQuery} disabled={!editBriefingForm.site} filteredSupervisorsList={filteredEditSupervisorsList} /><ManagersMultiSelect selected={editSelectedManagers} onToggle={handleEditManagerToggle} searchQuery={editManagerSearchQuery} setSearchQuery={setEditManagerSearchQuery} disabled={!editBriefingForm.site} filteredManagersList={filteredEditManagersList} /><ActionItemsSection actionItems={editBriefingForm.actionItems} onAdd={addEditActionItem} onRemove={removeEditActionItem} onUpdate={updateEditActionItem} /><AttachmentsSection attachments={editBriefingAttachments} onUpload={handleEditBriefingFileUpload} onRemove={removeEditBriefingAttachment} fileInputRef={editBriefingFileInputRef} title="Attachments" /><DialogFooter><Button onClick={handleUpdateBriefing}>Update Briefing</Button><Button variant="outline" onClick={() => setShowEditBriefingDialog(false)}>Cancel</Button></DialogFooter></DialogContent></Dialog>
      </div>
    </div>
  );
};

const Check = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg xmlns="https://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
);

export default SupervisorTrainingBriefingSection;