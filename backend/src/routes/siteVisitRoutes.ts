// backend/routes/siteVisits.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SiteVisit } from '../models/SiteVisit';
import Task from '../models/Task';

const router = express.Router();

// Configure multer for file uploads with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/site-visits');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `site-visit-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

// ==================== MANAGER ROUTES ====================

// Get all sites assigned to a manager (Improved version)
router.get('/manager/:managerId/sites', async (req, res) => {
  try {
    const { managerId } = req.params;
    console.log(`🔍 Fetching sites for manager: ${managerId}`);
    
    // Get all tasks where this manager is assigned
    const tasks = await Task.find({
      'assignedUsers.userId': managerId,
      'assignedUsers.role': 'manager'
    });
    
    console.log(`📋 Found ${tasks.length} tasks for manager ${managerId}`);
    
    // Get unique sites from tasks
    const siteMap = new Map();
    
    for (const task of tasks) {
      if (!siteMap.has(task.siteId)) {
        console.log(`📍 Adding site: ${task.siteId} - ${task.siteName}`);
        siteMap.set(task.siteId, {
          _id: task.siteId,
          name: task.siteName,
          clientName: task.clientName,
          location: '', // Location is not in Task model, leave empty
          status: task.status || 'active',
          lastVisited: null,
          visitCount: 0,
          taskId: task._id,
          taskTitle: task.title
        });
      }
    }
    
    // Get visit history for each site - Count ALL reports, not just approved
    for (const [siteId, site] of siteMap) {
      const allVisits = await SiteVisit.find({ 
        siteId, 
        managerId
      }).sort({ visitDate: -1 });
      
      if (allVisits.length > 0) {
        site.lastVisited = allVisits[0].visitDate;
        site.visitCount = allVisits.length; // Count ALL reports
      }
    }
    
    const result = Array.from(siteMap.values());
    console.log(`✅ Returning ${result.length} sites for manager ${managerId}`);
    
    res.json({
      success: true,
      data: result,
      total: result.length
    });
  } catch (error: any) {
    console.error('Error fetching manager sites:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get manager's site visit reports - Return ALL reports
router.get('/manager/:managerId/reports', async (req, res) => {
  try {
    const { managerId } = req.params;
    const { siteId, startDate, endDate, status } = req.query;
    
    const query: any = { managerId };
    
    if (siteId) query.siteId = siteId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate as string);
      if (endDate) query.visitDate.$lte = new Date(endDate as string);
    }
    
    const reports = await SiteVisit.find(query)
      .sort({ visitDate: -1 });
    
    console.log(`📋 Found ${reports.length} reports for manager ${managerId}`);
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error: any) {
    console.error('Error fetching manager reports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a site visit report with proper file URLs
router.post('/reports', upload.array('photos', 10), async (req, res) => {
  try {
    const { data } = req.body;
    const reportData = JSON.parse(data);
    const files = req.files as Express.Multer.File[];
    
    console.log('📝 Creating site visit report:', reportData);
    console.log('📸 Files received:', files?.length || 0);
    
    // Get base URL from request
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    // Process photos with proper URLs
    const photos = files?.map(file => ({
      url: `${baseUrl}/uploads/site-visits/${file.filename}`,
      filename: file.originalname,
      uploadedAt: new Date(),
      size: file.size
    })) || [];
    
    console.log('📸 Processed photos:', photos);
    
    // Create the report
    const report = new SiteVisit({
      siteId: reportData.siteId,
      siteName: reportData.siteName,
      managerId: reportData.managerId,
      managerName: reportData.managerName,
      visitDate: new Date(),
      photos,
      workQueries: reportData.workQueries || [],
      updates: [{
        content: `Site visit started`,
        type: 'general',
        timestamp: new Date()
      }],
      status: 'submitted'
    });
    
    await report.save();
    console.log('✅ Report saved:', report._id);
    
    // Update task visit history
    const tasks = await Task.find({ 
      siteId: reportData.siteId,
      'assignedUsers.userId': reportData.managerId
    });
    
    for (const task of tasks) {
      console.log(`📝 Updating task ${task._id} with visit`);
      // Check if task has recordVisit method
      if (typeof task.recordVisit === 'function') {
        await task.recordVisit(reportData.managerId, reportData.managerName, `Site visit report created`);
      } else {
        // Manual update if method doesn't exist
        task.lastVisitedAt = new Date();
        task.visitedBy = reportData.managerId;
        task.visitCount = (task.visitCount || 0) + 1;
        if (!task.visitHistory) task.visitHistory = [];
        task.visitHistory.push({
          visitedBy: reportData.managerId,
          visitedByName: reportData.managerName,
          visitedAt: new Date(),
          notes: `Site visit report created`
        });
        await task.save();
      }
    }
    
    res.json({
      success: true,
      data: report,
      message: 'Site visit report created successfully'
    });
  } catch (error: any) {
    console.error('Error creating site visit report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a debug endpoint to check manager assignments
router.get('/debug/manager/:managerId/assignments', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Find all tasks where this manager is assigned
    const tasks = await Task.find({
      'assignedUsers.userId': managerId
    }).select('title siteId siteName clientName assignedUsers');
    
    console.log(`📋 Debug: Found ${tasks.length} tasks for manager ${managerId}`);
    
    // Get detailed information about each task
    const taskDetails = tasks.map(task => ({
      _id: task._id,
      title: task.title,
      siteId: task.siteId,
      siteName: task.siteName,
      clientName: task.clientName,
      assignedUsers: task.assignedUsers
    }));
    
    res.json({
      success: true,
      managerId,
      totalTasks: tasks.length,
      tasks: taskDetails
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to check photos for a report
router.get('/debug/report/:reportId/photos', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await SiteVisit.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    res.json({
      success: true,
      reportId: report._id,
      siteName: report.siteName,
      photosCount: report.photos.length,
      photos: report.photos,
      status: report.status
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get monthly site visit reports
router.get('/reports/monthly', async (req, res) => {
  try {
    const { year, month, managerId, siteId, status } = req.query;
    
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    
    const query: any = {
      visitDate: { $gte: startDate, $lte: endDate }
    };
    
    if (managerId) query.managerId = managerId;
    if (siteId) query.siteId = siteId;
    if (status) query.status = status;
    
    const reports = await SiteVisit.find(query)
      .sort({ visitDate: -1 });
    
    const stats = {
      totalReports: reports.length,
      approvedReports: reports.filter(r => r.status === 'approved').length,
      pendingReports: reports.filter(r => r.status === 'submitted').length,
      rejectedReports: reports.filter(r => r.status === 'rejected').length,
      uniqueManagers: new Set(reports.map(r => r.managerId)).size,
      uniqueSites: new Set(reports.map(r => r.siteId)).size,
      byDate: reports.reduce((acc, report) => {
        const date = report.visitDate.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = 0;
        acc[date]++;
        return acc;
      }, {} as Record<string, number>)
    };
    
    res.json({
      success: true,
      data: reports,
      stats,
      month: Number(month),
      year: Number(year)
    });
  } catch (error: any) {
    console.error('Error fetching monthly reports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all managers with their visit history
router.get('/managers/visits', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let dateFilter = {};
    if (year && month) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      dateFilter = { visitDate: { $gte: startDate, $lte: endDate } };
    }
    
    const managerVisits = await SiteVisit.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            managerId: '$managerId',
            managerName: '$managerName'
          },
          totalVisits: { $sum: 1 },
          sites: { $addToSet: '$siteId' },
          reports: { $push: '$$ROOT' },
          lastVisit: { $max: '$visitDate' },
          firstVisit: { $min: '$visitDate' }
        }
      },
      {
        $project: {
          managerId: '$_id.managerId',
          managerName: '$_id.managerName',
          totalVisits: 1,
          uniqueSites: { $size: '$sites' },
          reports: { $slice: ['$reports', 10] },
          lastVisit: 1,
          firstVisit: 1
        }
      },
      { $sort: { totalVisits: -1 } }
    ]);
    
    const siteVisits = await SiteVisit.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            siteId: '$siteId',
            siteName: '$siteName'
          },
          totalVisits: { $sum: 1 },
          uniqueManagers: { $addToSet: '$managerId' },
          lastVisit: { $max: '$visitDate' }
        }
      },
      {
        $project: {
          siteId: '$_id.siteId',
          siteName: '$_id.siteName',
          totalVisits: 1,
          uniqueManagerCount: { $size: '$uniqueManagers' },
          lastVisit: 1
        }
      },
      { $sort: { totalVisits: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        managers: managerVisits,
        sites: siteVisits,
        totalVisits: await SiteVisit.countDocuments(dateFilter)
      }
    });
  } catch (error: any) {
    console.error('Error fetching manager visits:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get site visit statistics
router.get('/statistics', async (req, res) => {
  try {
    const { year, month, managerId } = req.query;
    
    let dateFilter = {};
    if (year && month !== undefined) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      dateFilter = { visitDate: { $gte: startDate, $lte: endDate } };
    }
    
    if (managerId) {
      dateFilter = { ...dateFilter, managerId };
    }
    
    const dailyVisits = await SiteVisit.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const statusBreakdown = await SiteVisit.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const managerPerformance = await SiteVisit.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            managerId: '$managerId',
            managerName: '$managerName'
          },
          totalVisits: { $sum: 1 },
          uniqueSites: { $addToSet: '$siteId' },
          workQueriesCreated: { $sum: { $size: '$workQueries' } }
        }
      },
      {
        $project: {
          managerId: '$_id.managerId',
          managerName: '$_id.managerName',
          totalVisits: 1,
          uniqueSiteCount: { $size: '$uniqueSites' },
          workQueriesCreated: 1
        }
      },
      { $sort: { totalVisits: -1 } },
      { $limit: 10 }
    ]);
    
    const sitePopularity = await SiteVisit.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            siteId: '$siteId',
            siteName: '$siteName'
          },
          visitCount: { $sum: 1 },
          uniqueManagers: { $addToSet: '$managerId' },
          lastVisit: { $max: '$visitDate' }
        }
      },
      {
        $project: {
          siteId: '$_id.siteId',
          siteName: '$_id.siteName',
          visitCount: 1,
          uniqueManagerCount: { $size: '$uniqueManagers' },
          lastVisit: 1
        }
      },
      { $sort: { visitCount: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        dailyVisits,
        statusBreakdown,
        managerPerformance,
        sitePopularity,
        totalVisits: await SiteVisit.countDocuments(dateFilter),
        dateRange: dateFilter
      }
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve site report
router.patch('/reports/:reportId/approve', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { approvedBy } = req.body;
    
    const report = await SiteVisit.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    report.status = 'approved';
    report.approvedBy = approvedBy;
    report.approvedAt = new Date();
    
    report.updates.push({
      content: `Report approved by ${approvedBy}`,
      type: 'general',
      timestamp: new Date()
    });
    
    await report.save();
    
    res.json({
      success: true,
      data: report,
      message: 'Report approved successfully'
    });
  } catch (error: any) {
    console.error('Error approving report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject site report
router.patch('/reports/:reportId/reject', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { rejectionReason } = req.body;
    
    const report = await SiteVisit.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    report.status = 'rejected';
    report.rejectionReason = rejectionReason;
    
    report.updates.push({
      content: `Report rejected: ${rejectionReason}`,
      type: 'general',
      timestamp: new Date()
    });
    
    await report.save();
    
    res.json({
      success: true,
      data: report,
      message: 'Report rejected'
    });
  } catch (error: any) {
    console.error('Error rejecting report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;