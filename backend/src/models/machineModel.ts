import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaintenanceRecord {
  type: string;
  description: string;
  cost: number;
  performedBy: string;
  date: Date;
}

export interface IMachine extends Document {
  name: string;
  cost: number;
  purchaseDate: Date;
  quantity: number;
  description?: string;
  status: 'operational' | 'maintenance' | 'out-of-service';
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  location?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  department?: string;
  assignedTo?: string;
  maintenanceHistory: IMaintenanceRecord[];
}

const MaintenanceSchema: Schema<IMaintenanceRecord> = new Schema(
  {
    type: { type: String, required: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true },
    performedBy: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MachineSchema: Schema<IMachine> = new Schema(
  {
    name: { type: String, required: true },
    cost: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    quantity: { type: Number, required: true, default: 1 },
    description: { type: String },
    status: {
      type: String,
      enum: ['operational', 'maintenance', 'out-of-service'],
      default: 'operational',
    },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    location: { type: String },
    manufacturer: { type: String },
    modelNumber: { type: String },
    // IMPORTANT: Remove unique constraint or use sparse + unique with filter
    serialNumber: { 
      type: String, 
      unique: true, 
      sparse: true,  // This allows multiple null/undefined values
      index: true 
    },
    department: { type: String },
    assignedTo: { type: String },
    maintenanceHistory: { type: [MaintenanceSchema], default: [] },
  },
  { timestamps: true }
);

// Create text index for search
MachineSchema.index({ name: 'text', modelNumber: 'text', location: 'text', department: 'text' });

// Add a pre-save middleware to handle empty serial numbers
MachineSchema.pre('save', function(next) {
  // If serialNumber is empty string or null/undefined, set to undefined to avoid unique constraint issues
  if (this.serialNumber === '' || this.serialNumber === null) {
    this.serialNumber = undefined;
  }
  next();
});

// Also handle update operations
MachineSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update.serialNumber === '' || update.serialNumber === null) {
    update.serialNumber = undefined;
  }
  next();
});

const Machine: Model<IMachine> =
  mongoose.models.Machine || mongoose.model<IMachine>('Machine', MachineSchema);

export default Machine;