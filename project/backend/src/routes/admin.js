const express = require('express');
const User = require('../models/User');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const Application = require('../models/Application');
const { protect, admin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require admin access
router.use(protect, admin);

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    const newUsersLastMonth = await User.countDocuments({ 
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
    });

    // Job statistics
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    const newJobsThisMonth = await Job.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    const featuredJobs = await Job.countDocuments({ featured: true });

    // Resume statistics
    const totalResumes = await Resume.countDocuments({ isActive: true });
    const processedResumes = await Resume.countDocuments({ 
      processingStatus: 'completed',
      isActive: true 
    });
    const newResumesThisMonth = await Resume.countDocuments({ 
      createdAt: { $gte: startOfMonth },
      isActive: true 
    });

    // Application statistics
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ 
      status: { $in: ['pending', 'reviewing'] } 
    });
    const newApplicationsThisMonth = await Application.countDocuments({ 
      appliedAt: { $gte: startOfMonth } 
    });

    // Calculate growth rates
    const userGrowthRate = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : 0;

    // Recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt role');

    const recentJobs = await Job.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title company createdAt applications views')
      .populate('postedBy', 'name');

    const recentApplications = await Application.find()
      .sort({ appliedAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('job', 'title company')
      .select('appliedAt status matchScore');

    // System health metrics
    const systemHealth = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    };

    res.json({
      success: true,
      data: {
        overview: {
          users: {
            total: totalUsers,
            active: activeUsers,
            newThisMonth: newUsersThisMonth,
            growthRate: userGrowthRate
          },
          jobs: {
            total: totalJobs,
            active: activeJobs,
            featured: featuredJobs,
            newThisMonth: newJobsThisMonth
          },
          resumes: {
            total: totalResumes,
            processed: processedResumes,
            newThisMonth: newResumesThisMonth,
            processingRate: totalResumes > 0 ? (processedResumes / totalResumes * 100).toFixed(1) : 0
          },
          applications: {
            total: totalApplications,
            pending: pendingApplications,
            newThisMonth: newApplicationsThisMonth
          }
        },
        recentActivity: {
          users: recentUsers,
          jobs: recentJobs,
          applications: recentApplications
        },
        systemHealth
      }
    });
  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // User registration trend
    const userTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Job posting trend
    const jobTrend = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Application trend
    const applicationTrend = await Application.aggregate([
      {
        $match: {
          appliedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Job category distribution
    const categoryDistribution = await Job.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Application status distribution
    const applicationStatusDistribution = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top performing jobs
    const topJobs = await Job.find({ status: 'active' })
      .sort({ applications: -1, views: -1 })
      .limit(10)
      .select('title company applications views createdAt')
      .populate('postedBy', 'name');

    // User engagement metrics
    const engagementMetrics = await User.aggregate([
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'user',
          as: 'applications'
        }
      },
      {
        $lookup: {
          from: 'resumes',
          localField: '_id',
          foreignField: 'user',
          as: 'resumes'
        }
      },
      {
        $group: {
          _id: null,
          avgApplicationsPerUser: { $avg: { $size: '$applications' } },
          avgResumesPerUser: { $avg: { $size: '$resumes' } },
          usersWithApplications: {
            $sum: { $cond: [{ $gt: [{ $size: '$applications' }, 0] }, 1, 0] }
          },
          usersWithResumes: {
            $sum: { $cond: [{ $gt: [{ $size: '$resumes' }, 0] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        trends: {
          users: userTrend,
          jobs: jobTrend,
          applications: applicationTrend
        },
        distributions: {
          categories: categoryDistribution,
          applicationStatus: applicationStatusDistribution
        },
        topPerformers: {
          jobs: topJobs
        },
        engagement: engagementMetrics[0] || {
          avgApplicationsPerUser: 0,
          avgResumesPerUser: 0,
          usersWithApplications: 0,
          usersWithResumes: 0
        }
      }
    });
  } catch (error) {
    logger.error('Get admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics data'
    });
  }
});

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
router.get('/logs', async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // This is a simplified implementation
    // In production, you'd want to read from actual log files
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'System running normally',
        service: 'api'
      },
      {
        timestamp: new Date(Date.now() - 60000),
        level: 'info',
        message: 'User logged in successfully',
        service: 'auth'
      },
      {
        timestamp: new Date(Date.now() - 120000),
        level: 'warn',
        message: 'High memory usage detected',
        service: 'system'
      }
    ];

    res.json({
      success: true,
      data: logs.slice(0, parseInt(limit))
    });
  } catch (error) {
    logger.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching logs'
    });
  }
});

// @desc    Bulk operations
// @route   POST /api/admin/bulk/:action
// @access  Private (Admin)
router.post('/bulk/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const { ids, data } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of IDs'
      });
    }

    let result;

    switch (action) {
      case 'activate-users':
        result = await User.updateMany(
          { _id: { $in: ids } },
          { isActive: true }
        );
        logger.info(`Bulk user activation: ${result.modifiedCount} users activated by ${req.user.email}`);
        break;

      case 'deactivate-users':
        result = await User.updateMany(
          { _id: { $in: ids } },
          { isActive: false }
        );
        logger.info(`Bulk user deactivation: ${result.modifiedCount} users deactivated by ${req.user.email}`);
        break;

      case 'feature-jobs':
        result = await Job.updateMany(
          { _id: { $in: ids } },
          { featured: true }
        );
        logger.info(`Bulk job featuring: ${result.modifiedCount} jobs featured by ${req.user.email}`);
        break;

      case 'unfeature-jobs':
        result = await Job.updateMany(
          { _id: { $in: ids } },
          { featured: false }
        );
        logger.info(`Bulk job unfeaturing: ${result.modifiedCount} jobs unfeatured by ${req.user.email}`);
        break;

      case 'update-application-status':
        if (!data.status) {
          return res.status(400).json({
            success: false,
            message: 'Status is required for application updates'
          });
        }
        result = await Application.updateMany(
          { _id: { $in: ids } },
          { status: data.status }
        );
        logger.info(`Bulk application status update: ${result.modifiedCount} applications updated to ${data.status} by ${req.user.email}`);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid bulk action'
        });
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    logger.error('Bulk operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk operation'
    });
  }
});

// @desc    Export data
// @route   GET /api/admin/export/:type
// @access  Private (Admin)
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data;
    let filename;

    switch (type) {
      case 'users':
        data = await User.find().select('-password').lean();
        filename = `users-export-${Date.now()}.${format}`;
        break;

      case 'jobs':
        data = await Job.find().populate('postedBy', 'name email').lean();
        filename = `jobs-export-${Date.now()}.${format}`;
        break;

      case 'applications':
        data = await Application.find()
          .populate('user', 'name email')
          .populate('job', 'title company')
          .lean();
        filename = `applications-export-${Date.now()}.${format}`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Convert to CSV (simplified implementation)
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json({
        success: true,
        data,
        exportedAt: new Date(),
        count: data.length
      });
    }

    logger.info(`Data export: ${type} exported by ${req.user.email}`);
  } catch (error) {
    logger.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during data export'
    });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;