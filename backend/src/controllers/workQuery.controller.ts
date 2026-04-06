import { Request, Response } from 'express';
import { workQueryService } from '../services/workQuery.service';

export class WorkQueryController {
  // Create work query for service
  async createWorkQuery(req: Request, res: Response) {
    try {
      console.log('📝 Creating work query...');
      
      // Extract form data from request body
      const {
        title,
        description,
        serviceId,
        priority = 'medium',
        category = 'service-quality',
        supervisorId,
        supervisorName,
        serviceTitle,
        serviceType
      } = req.body;

      console.log('✅ Extracted data:', { 
        title, 
        description, 
        serviceId, 
        priority, 
        category, 
        supervisorId, 
        supervisorName,
        serviceTitle,
        serviceType
      });

      // Basic validation
      if (!title || !description || !serviceId || !supervisorId || !supervisorName) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided'
        });
      }

      // Create work query data (no files)
      const workQueryData = {
        title,
        description,
        serviceId,
        priority,
        category,
        reportedBy: {
          userId: supervisorId,
          name: supervisorName,
          role: 'supervisor'
        },
        supervisorId,
        supervisorName,
        serviceTitle: serviceTitle || serviceId, // Use provided serviceTitle or fallback to serviceId
        serviceType: serviceType || 'other' // Use provided serviceType or default to 'other'
      };

      console.log('🚀 Calling service with data:', workQueryData);
      // Fix: Only pass one argument (no empty array)
      const workQuery = await workQueryService.createWorkQuery(workQueryData);
      
      console.log('✅ Work query created successfully:', workQuery.queryId);
      
      res.status(201).json({
        success: true,
        data: workQuery,
        message: 'Work query created successfully'
      });
    } catch (error: any) {
      console.error('❌ Error creating work query:', error);
      
      if (error.message && error.message.includes('Service not found')) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create work query'
      });
    }
  }

  // Get all work queries
  async getAllWorkQueries(req: Request, res: Response) {
    try {
      const {
        search = '',
        status = 'all',
        priority = 'all',
        serviceType = 'all',
        supervisorId,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        search: search as string,
        status: status as string,
        priority: priority as string,
        serviceType: serviceType as string,
        supervisorId: supervisorId as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      if (!filters.supervisorId) {
        return res.status(400).json({
          success: false,
          message: 'Supervisor ID is required'
        });
      }

      const result = await workQueryService.getWorkQueriesForUser(
        filters.supervisorId,
        'supervisor',
        filters
      );
      
      res.status(200).json({
        success: true,
        data: result.queries,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit)
        }
      });
    } catch (error: any) {
      console.error('❌ Error fetching work queries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch work queries'
      });
    }
  }

  // Get work query by ID
  async getWorkQueryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Query ID is required'
        });
      }

      const query = await workQueryService.getWorkQueryById(id);
      
      if (!query) {
        return res.status(404).json({
          success: false,
          message: 'Work query not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: query
      });
    } catch (error: any) {
      console.error('❌ Error fetching work query by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch work query'
      });
    }
  }

  // Get work query by queryId
  async getWorkQueryByQueryId(req: Request, res: Response) {
    try {
      const { queryId } = req.params;
      
      if (!queryId) {
        return res.status(400).json({
          success: false,
          message: 'Query ID is required'
        });
      }

      const query = await workQueryService.getWorkQueryByQueryId(queryId);
      
      if (!query) {
        return res.status(404).json({
          success: false,
          message: 'Work query not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: query
      });
    } catch (error: any) {
      console.error('❌ Error fetching work query by queryId:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch work query'
      });
    }
  }

  // Update work query status
  async updateWorkQueryStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, superadminResponse } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Query ID is required'
        });
      }
      
      if (!status || !['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required'
        });
      }
      
      if (status === 'resolved' && !superadminResponse) {
        return res.status(400).json({
          success: false,
          message: 'Superadmin response is required when resolving a query'
        });
      }

      const query = await workQueryService.updateQueryStatus(
        id,
        status,
        superadminResponse
      );
      
      if (!query) {
        return res.status(404).json({
          success: false,
          message: 'Work query not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: query,
        message: `Work query status updated to ${status}`
      });
    } catch (error: any) {
      console.error('❌ Error updating work query status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update work query status'
      });
    }
  }

  // Delete work query
  async deleteWorkQuery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Query ID is required'
        });
      }

      const deletedQuery = await workQueryService.deleteWorkQuery(id);
      
      if (!deletedQuery) {
        return res.status(404).json({
          success: false,
          message: 'Work query not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Work query deleted successfully',
        data: deletedQuery
      });
    } catch (error: any) {
      console.error('❌ Error deleting work query:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete work query'
      });
    }
  }

  // Get statistics
  async getStatistics(req: Request, res: Response) {
    try {
      const { supervisorId } = req.query;
      
      if (!supervisorId) {
        return res.status(400).json({
          success: false,
          message: 'Supervisor ID is required'
        });
      }

      const statistics = await workQueryService.getStatistics(
        supervisorId as string,
        'supervisor'
      );
      
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error: any) {
      console.error('❌ Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  }

  // Get categories
  async getCategories(req: Request, res: Response) {
    const categories = [
      {
        value: "service-quality",
        label: "Service Quality Issue",
        description: "Issues with the quality of service provided"
      },
      {
        value: "service-delay",
        label: "Service Delay",
        description: "Services not completed on time"
      },
      {
        value: "safety-issue",
        label: "Safety Issue",
        description: "Safety concerns or violations"
      },
      {
        value: "equipment-failure",
        label: "Equipment Failure",
        description: "Equipment not working properly"
      },
      {
        value: "staff-behavior",
        label: "Staff Behavior",
        description: "Issues with staff conduct or behavior"
      },
      {
        value: "cleanliness",
        label: "Cleanliness Issue",
        description: "Poor cleaning or maintenance"
      },
      {
        value: "communication",
        label: "Communication Issue",
        description: "Poor communication from service staff"
      },
      {
        value: "other",
        label: "Other",
        description: "Other types of issues"
      }
    ];

    res.status(200).json({
      success: true,
      data: categories
    });
  }

  // Get priorities
  async getPriorities(req: Request, res: Response) {
    const priorities = [
      {
        value: "low",
        label: "Low Priority",
        description: "Minor issue, can be addressed later",
        color: "green"
      },
      {
        value: "medium",
        label: "Medium Priority",
        description: "Standard issue, address within 24-48 hours",
        color: "yellow"
      },
      {
        value: "high",
        label: "High Priority",
        description: "Urgent issue, address within 24 hours",
        color: "orange"
      },
      {
        value: "critical",
        label: "Critical Priority",
        description: "Critical issue, address immediately",
        color: "red"
      }
    ];

    res.status(200).json({
      success: true,
      data: priorities
    });
  }

  // Get statuses
  async getStatuses(req: Request, res: Response) {
    const statuses = [
      {
        value: "pending",
        label: "Pending",
        description: "Query submitted, awaiting review",
        color: "yellow"
      },
      {
        value: "in-progress",
        label: "In Progress",
        description: "Query is being investigated",
        color: "blue"
      },
      {
        value: "resolved",
        label: "Resolved",
        description: "Query has been resolved",
        color: "green"
      },
      {
        value: "rejected",
        label: "Rejected",
        description: "Query was rejected",
        color: "red"
      }
    ];

    res.status(200).json({
      success: true,
      data: statuses
    });
  }

  // Get recent work queries for dashboard
  async getRecentWorkQueries(req: Request, res: Response) {
    try {
      const { supervisorId, limit = '5' } = req.query;
      
      if (!supervisorId) {
        return res.status(400).json({
          success: false,
          message: 'Supervisor ID is required'
        });
      }

      const filters = {
        supervisorId: supervisorId as string,
        limit: parseInt(limit as string, 10),
        page: 1,
        search: '',
        status: 'all',
        priority: 'all',
        serviceType: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc' as 'asc' | 'desc'
      };
      
      const result = await workQueryService.getWorkQueriesForUser(
        supervisorId as string,
        'supervisor',
        filters
      );
      
      res.status(200).json({
        success: true,
        data: result.queries.slice(0, parseInt(limit as string, 10))
      });
    } catch (error: any) {
      console.error('❌ Error fetching recent work queries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent work queries'
      });
    }
  }

  // Add comment to work query
  async addComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId, name, comment } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Query ID is required'
        });
      }
      
      if (!userId || !name || !comment) {
        return res.status(400).json({
          success: false,
          message: 'User ID, name, and comment are required'
        });
      }

      const updatedQuery = await workQueryService.addComment(id, {
        userId,
        name,
        comment
      });

      if (!updatedQuery) {
        return res.status(404).json({
          success: false,
          message: 'Work query not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedQuery,
        message: 'Comment added successfully'
      });
    } catch (error: any) {
      console.error('❌ Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  }

  // Assign work query
  async assignQuery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId, name, role = 'staff' } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Query ID is required'
        });
      }
      
      if (!userId || !name) {
        return res.status(400).json({
          success: false,
          message: 'User ID and name are required'
        });
      }

      const updatedQuery = await workQueryService.assignQuery(id, {
        userId,
        name,
        role
      });

      if (!updatedQuery) {
        return res.status(404).json({
          success: false,
          message: 'Work query not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedQuery,
        message: 'Query assigned successfully'
      });
    } catch (error: any) {
      console.error('❌ Error assigning query:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign query'
      });
    }
  }

  // Get service types
  async getServiceTypes(req: Request, res: Response) {
    const serviceTypes = [
      {
        value: "cleaning",
        label: "Cleaning Service",
        icon: "sparkles",
        color: "blue"
      },
      {
        value: "waste-management",
        label: "Waste Management",
        icon: "trash-2",
        color: "green"
      },
      {
        value: "parking-management",
        label: "Parking Management",
        icon: "car",
        color: "purple"
      },
      {
        value: "security",
        label: "Security Service",
        icon: "shield",
        color: "orange"
      },
      {
        value: "maintenance",
        label: "Maintenance",
        icon: "wrench",
        color: "red"
      }
    ];

    res.status(200).json({
      success: true,
      data: serviceTypes
    });
  }
}

export const workQueryController = new WorkQueryController();