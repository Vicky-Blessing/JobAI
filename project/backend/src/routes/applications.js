const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const { protect, admin, checkOwnership } = require('../middleware/auth');
const { validateApplication, validateObjectId, validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private
router.post('/', protect, validateApplication, async (req, res) => {
  try {
    const { jobId, coverLetter, customAnswers } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer active'
      });
    }

    // Get user's latest resume
    const resume = await Resume.getLatestByUser(req.user.id);
    if (!resume || resume.processingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Please upload and complete resume analysis before applying'
      });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      user: req.user.id,
      job: jobId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Calculate match score
    const matchResult = resume.calculateJobMatch(job);

    // Create application
    const application = await Application.create({
      user: req.user.id,
      job: jobId,
      resume: resume._id,
      coverLetter,
      customAnswers,
      matchScore: matchResult.matchScore,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        applicationTime: req.body.applicationTime || 0
      }
    });

    // Increment job application count
    await job.incrementApplications();

    // Populate the application
    await application.populate([
      { path: 'job', select: 'title company location type salary' },
      { path: 'resume', select: 'fileName aiAnalysis.overallScore' }
    ]);

    logger.info(`New application: ${req.user.email} applied for ${job.title} at ${job.company}`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    logger.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during application submission'
    });
  }
});

// @desc    Get user's applications
// @route   GET /api/applications
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filters = {};
    if (status) {
      filters.status = status;
    }

    const applications = await Application.find({ 
      user: req.user.id, 
      ...filters 
    })
      .populate('job', 'title company location type salary status')
      .populate('resume', 'fileName aiAnalysis.overallScore')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Application.countDocuments({ 
      user: req.user.id, 
      ...filters 
    });

    res.json({
      success: true,
      count: applications.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      data: applications
    });
  } catch (error) {
    logger.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications'
    });
  }
});

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
router.get('/:id', protect, validateObjectId(), checkOwnership(Application), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('resume')
      .populate('user', 'name email profile');

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application'
    });
  }
});

// @desc    Update application status (Admin only)
// @route   PATCH /api/applications/:id/status
// @access  Private (Admin)
router.patch('/:id/status', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'reviewing', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await application.updateStatus(status, req.user.id, notes);

    logger.info(`Application status updated: ${application._id} to ${status} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    logger.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application status'
    });
  }
});

// @desc    Withdraw application
// @route   PATCH /api/applications/:id/withdraw
// @access  Private
router.patch('/:id/withdraw', protect, validateObjectId(), checkOwnership(Application), async (req, res) => {
  try {
    const application = req.resource;

    if (application.status === 'withdrawn') {
      return res.status(400).json({
        success: false,
        message: 'Application is already withdrawn'
      });
    }

    if (['offer', 'rejected'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application at this stage'
      });
    }

    await application.updateStatus('withdrawn', req.user.id, 'Withdrawn by applicant');

    logger.info(`Application withdrawn: ${application._id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: application
    });
  } catch (error) {
    logger.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while withdrawing application'
    });
  }
});

// @desc    Get applications for a job (Admin only)
// @route   GET /api/applications/job/:jobId
// @access  Private (Admin)
router.get('/job/:jobId', protect, admin, validateObjectId('jobId'), validatePagination, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filters = { job: req.params.jobId };
    if (status) {
      filters.status = status;
    }

    const applications = await Application.find(filters)
      .populate('user', 'name email profile.phone profile.location')
      .populate('resume', 'fileName aiAnalysis.overallScore analysis.skills')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Application.countDocuments(filters);

    res.json({
      success: true,
      count: applications.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      data: applications
    });
  } catch (error) {
    logger.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job applications'
    });
  }
});

// @desc    Schedule interview
// @route   POST /api/applications/:id/interview
// @access  Private (Admin)
router.post('/:id/interview', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const { type, scheduledAt, duration, interviewer, notes } = req.body;

    if (!type || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Interview type and scheduled time are required'
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const interviewData = {
      type,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      interviewer,
      notes
    };

    await application.scheduleInterview(interviewData);

    logger.info(`Interview scheduled for application: ${application._id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: application
    });
  } catch (error) {
    logger.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while scheduling interview'
    });
  }
});

// @desc    Get application analytics
// @route   GET /api/applications/analytics/overview
// @access  Private (Admin)
router.get('/analytics/overview', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchFilter = {};
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.appliedAt = dateFilter;
    }

    const analytics = await Application.getAnalytics(matchFilter);

    // Additional metrics
    const totalApplications = await Application.countDocuments(matchFilter);
    const uniqueApplicants = await Application.distinct('user', matchFilter);
    const uniqueJobs = await Application.distinct('job', matchFilter);

    // Average time to hire (mock data for now)
    const avgTimeToHire = 14; // days

    res.json({
      success: true,
      data: {
        overview: {
          totalApplications,
          uniqueApplicants: uniqueApplicants.length,
          uniqueJobs: uniqueJobs.length,
          avgTimeToHire
        },
        analytics: analytics[0] || { total: 0, statusBreakdown: [] }
      }
    });
  } catch (error) {
    logger.error('Get application analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application analytics'
    });
  }
});

// @desc    Get user application statistics
// @route   GET /api/applications/stats/user
// @access  Private
router.get('/stats/user', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Application.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgMatchScore: { $avg: '$matchScore' }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments({ user: userId });
    const pendingApplications = await Application.countDocuments({ 
      user: userId, 
      status: { $in: ['pending', 'reviewing', 'shortlisted', 'interview'] }
    });

    res.json({
      success: true,
      data: {
        total: totalApplications,
        pending: pendingApplications,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    logger.error('Get user application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user application statistics'
    });
  }
});

module.exports = router;