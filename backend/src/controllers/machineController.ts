import { Request, Response } from 'express';
import Machine, { IMachine, IMaintenanceRecord } from '../models/machineModel';

export class MachineController {
  // Get all machines with filters
  async getMachines(req: Request, res: Response) {
    try {
      const { assignedTo, status, department, location, search } = req.query;
      
      let query: any = {};
      
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
      if (status) {
        query.status = status;
      }
      if (department) {
        query.department = department;
      }
      if (location) {
        query.location = location;
      }
      if (search) {
        query.$text = { $search: search as string };
      }
      
      const machines = await Machine.find(query).sort({ createdAt: -1 });
      
      // Transform response to include 'model' field for frontend compatibility
      const transformedMachines = machines.map(machine => {
        const obj = machine.toJSON();
        return {
          ...obj,
          id: obj._id,
          model: obj.modelNumber,
          // Ensure serialNumber is properly handled
          serialNumber: obj.serialNumber || ''
        };
      });
      
      res.json(transformedMachines);
    } catch (error: any) {
      console.error('Error fetching machines:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get machine by ID
  async getMachineById(req: Request, res: Response) {
    try {
      const machine = await Machine.findById(req.params.id);
      if (!machine) {
        return res.status(404).json({ error: 'Machine not found' });
      }
      
      // Transform response to include 'model' field
      const obj = machine.toJSON();
      const transformedMachine = {
        ...obj,
        id: obj._id,
        model: obj.modelNumber,
        serialNumber: obj.serialNumber || ''
      };
      
      res.json(transformedMachine);
    } catch (error: any) {
      console.error('Error fetching machine:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Create new machine
  async createMachine(req: Request, res: Response) {
    try {
      const data = req.body;
      
      // Handle serialNumber - if empty string, set to undefined
      let serialNumber = data.serialNumber;
      if (serialNumber === '' || serialNumber === null || serialNumber === undefined) {
        serialNumber = undefined;
      }
      
      // Map frontend 'model' field to backend 'modelNumber'
      const machineData = {
        name: data.name,
        cost: Number(data.cost),
        purchaseDate: data.purchaseDate,
        quantity: Number(data.quantity) || 1,
        description: data.description || '',
        status: data.status || 'operational',
        location: data.location || '',
        manufacturer: data.manufacturer || '',
        modelNumber: data.model || data.modelNumber || '',
        serialNumber: serialNumber,  // Will be undefined if empty
        department: data.department || '',
        assignedTo: data.assignedTo || '',
        lastMaintenanceDate: data.lastMaintenanceDate || undefined,
        nextMaintenanceDate: data.nextMaintenanceDate || undefined,
        maintenanceHistory: []
      };
      
      console.log('Creating machine with data:', machineData);
      
      const machine = await Machine.create(machineData);
      
      // Transform response to include 'model' field for frontend compatibility
      const obj = machine.toJSON();
      const responseMachine = {
        ...obj,
        id: obj._id,
        model: obj.modelNumber,
        serialNumber: obj.serialNumber || ''
      };
      
      console.log('Machine created successfully:', responseMachine);
      
      res.status(201).json(responseMachine);
    } catch (error: any) {
      console.error('Error creating machine:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'serialNumber') {
          res.status(400).json({ 
            error: 'Duplicate serial number. Please use a unique serial number or leave it blank.' 
          });
        } else {
          res.status(400).json({ 
            error: `Duplicate value for ${field}. Please use a unique value.` 
          });
        }
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // Update machine
  async updateMachine(req: Request, res: Response) {
    try {
      const data = req.body;
      
      // Handle serialNumber - if empty string, set to undefined
      let serialNumber = data.serialNumber;
      if (serialNumber === '' || serialNumber === null || serialNumber === undefined) {
        serialNumber = undefined;
      }
      
      // Map frontend 'model' field to backend 'modelNumber'
      const updateData: any = { ...data };
      if (data.model !== undefined) {
        updateData.modelNumber = data.model;
        delete updateData.model;
      }
      if (serialNumber !== undefined) {
        updateData.serialNumber = serialNumber;
      } else if (data.serialNumber === '') {
        updateData.serialNumber = undefined;
      }
      
      // Remove any undefined fields from update
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      console.log(`Updating machine ${req.params.id} with data:`, updateData);
      
      const machine = await Machine.findByIdAndUpdate(
        req.params.id, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      if (!machine) {
        return res.status(404).json({ error: 'Machine not found' });
      }
      
      // Transform response to include 'model' field
      const obj = machine.toJSON();
      const responseMachine = {
        ...obj,
        id: obj._id,
        model: obj.modelNumber,
        serialNumber: obj.serialNumber || ''
      };
      
      res.json(responseMachine);
    } catch (error: any) {
      console.error('Error updating machine:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === 'serialNumber') {
          res.status(400).json({ 
            error: 'Duplicate serial number. Please use a unique serial number or leave it blank.' 
          });
        } else {
          res.status(400).json({ 
            error: `Duplicate value for ${field}. Please use a unique value.` 
          });
        }
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // Delete machine
  async deleteMachine(req: Request, res: Response) {
    try {
      const machine = await Machine.findByIdAndDelete(req.params.id);
      if (!machine) {
        return res.status(404).json({ error: 'Machine not found' });
      }
      res.json({ message: 'Machine deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting machine:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get machine statistics
  async getMachineStats(req: Request, res: Response) {
    try {
      const machines = await Machine.find({});
      
      const totalMachines = machines.length;
      const totalMachineValue = machines.reduce((sum, m) => sum + (m.cost * m.quantity), 0);
      const operationalMachines = machines.filter(m => m.status === 'operational').length;
      const maintenanceMachines = machines.filter(m => m.status === 'maintenance').length;
      const outOfServiceMachines = machines.filter(m => m.status === 'out-of-service').length;
      
      // Calculate average cost
      const averageMachineCost = totalMachines > 0 ? totalMachineValue / totalMachines : 0;
      
      // Group by department
      const machinesByDepartment = machines.reduce((acc, m) => {
        const dept = m.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Group by location
      const machinesByLocation = machines.reduce((acc, m) => {
        const loc = m.location || 'Unassigned';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Upcoming maintenance (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const today = new Date();
      
      const upcomingMaintenanceCount = machines.filter(machine => {
        if (!machine.nextMaintenanceDate) return false;
        const nextDate = new Date(machine.nextMaintenanceDate);
        return nextDate <= thirtyDaysFromNow && nextDate >= today;
      }).length;

      res.json({
        totalMachines,
        totalMachineValue,
        operationalMachines,
        maintenanceMachines,
        outOfServiceMachines,
        averageMachineCost,
        machinesByDepartment,
        machinesByLocation,
        upcomingMaintenanceCount
      });
    } catch (error: any) {
      console.error('Error fetching machine stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Search machines
  async searchMachines(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q) {
        const machines = await Machine.find({});
        const transformedMachines = machines.map(m => {
          const obj = m.toJSON();
          return {
            ...obj,
            id: obj._id,
            model: obj.modelNumber,
            serialNumber: obj.serialNumber || ''
          };
        });
        return res.json(transformedMachines);
      }
      
      const machines = await Machine.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { modelNumber: { $regex: q, $options: 'i' } },
          { location: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } }
        ]
      });
      
      const transformedMachines = machines.map(m => {
        const obj = m.toJSON();
        return {
          ...obj,
          id: obj._id,
          model: obj.modelNumber,
          serialNumber: obj.serialNumber || ''
        };
      });
      
      res.json(transformedMachines);
    } catch (error: any) {
      console.error('Error searching machines:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Add maintenance record
  async addMaintenanceRecord(req: Request, res: Response) {
    try {
      const machine = await Machine.findById(req.params.id);
      if (!machine) {
        return res.status(404).json({ error: 'Machine not found' });
      }

      const record = {
        ...req.body,
        date: new Date()
      };
      
      machine.maintenanceHistory = machine.maintenanceHistory || [];
      machine.maintenanceHistory.push(record);
      
      // Update last maintenance date
      machine.lastMaintenanceDate = new Date();
      
      // Update status if needed
      if (record.type === 'Emergency' || record.type === 'Corrective') {
        machine.status = 'maintenance';
      }
      
      await machine.save();
      
      // Transform response to include 'model' field
      const obj = machine.toJSON();
      const responseMachine = {
        ...obj,
        id: obj._id,
        model: obj.modelNumber,
        serialNumber: obj.serialNumber || ''
      };

      res.json(responseMachine);
    } catch (error: any) {
      console.error('Error adding maintenance record:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const machineController = new MachineController();