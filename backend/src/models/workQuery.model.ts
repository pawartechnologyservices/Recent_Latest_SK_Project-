import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkQuery extends Document {
  queryId: string;
  title: string;
  description: string;
  type: 'service' | 'task';
  serviceId?: string;
  serviceTitle?: string;
  serviceType?: string;
  serviceStaffId?: string;
  serviceStaffName?: string;
  employeeId?: string;
  employeeName?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  category: string;
  reportedBy: {
    userId: string;
    name: string;
    role: string;
  };
  assignedTo?: {
    userId: string;
    name: string;
    role: string;
  };
  supervisorId: string;
  supervisorName: string;
  superadminResponse?: string;
  responseDate?: Date;
  comments: Array<{
    userId: string;
    name: string;
    comment: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkQuerySchema = new Schema({
  queryId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['service', 'task'], 
    default: 'service' 
  },
  serviceId: { 
    type: String 
  },
  serviceTitle: { 
    type: String 
  },
  serviceType: { 
    type: String 
  },
  serviceStaffId: { 
    type: String 
  },
  serviceStaffName: { 
    type: String 
  },
  employeeId: { 
    type: String 
  },
  employeeName: { 
    type: String 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'resolved', 'rejected'], 
    default: 'pending' 
  },
  category: { 
    type: String, 
    required: true 
  },
  reportedBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: 'supervisor' }
  },
  assignedTo: {
    userId: { type: String },
    name: { type: String },
    role: { type: String }
  },
  supervisorId: { 
    type: String, 
    required: true 
  },
  supervisorName: { 
    type: String, 
    required: true 
  },
  superadminResponse: { 
    type: String 
  },
  responseDate: { 
    type: Date 
  },
  comments: [{
    userId: { type: String, required: true },
    name: { type: String, required: true },
    comment: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Create indexes for better query performance
WorkQuerySchema.index({ supervisorId: 1, createdAt: -1 });
WorkQuerySchema.index({ status: 1 });
WorkQuerySchema.index({ priority: 1 });
WorkQuerySchema.index({ category: 1 });
WorkQuerySchema.index({ 'reportedBy.userId': 1 });
WorkQuerySchema.index({ queryId: 1 }, { unique: true });

export const WorkQuery = mongoose.model<IWorkQuery>('WorkQuery', WorkQuerySchema);