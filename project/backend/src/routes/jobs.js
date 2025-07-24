const express = require('express');
const Job = require('../models/Job');
const { protect, admin, optionalAuth } = require('../middleware/auth');
const { validateJob, validateJobSearch, validateObjectId } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get all jobs with search and filters
// @route   GET /api/jobs
// @access  Public
router.get('/', validateJobSearch, async (req, res) => {
  try {
    const {
      q,
      location,
      type,
      category,
      level,
      remote,
      company,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { status: 'active' };

    if (q) {
      query.$text = { $search: q };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (level) {
      query.level = level;
    }

    if (remote !== undefined) {
      query.remote = remote === 'true';
    }

    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      data: jobs
    });
  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs'
    });
  }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    await job.incrementViews();

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job'
    });
  }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Admin only)
router.post('/', protect, admin, validateJob, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user.id
    };

    const job = await Job.create(jobData);
    await job.populate('postedBy', 'name email');

    logger.info(`New job created: ${job.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating job'
    });
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Admin only)
router.put('/:id', protect, admin, validateObjectId(), validateJob, async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Update job
    job = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, 'metadata.lastUpdated': new Date() },
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email');

    logger.info(`Job updated: ${job.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating job'
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Admin only)
router.delete('/:id', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    logger.info(`Job deleted: ${job.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting job'
    });
  }
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats/overview
// @access  Private (Admin only)
router.get('/stats/overview', protect, admin, async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgViews: { $avg: '$views' },
          avgApplications: { $avg: '$applications' }
        }
      }
    ]);

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    const featuredJobs = await Job.countDocuments({ featured: true });

    // Category breakdown
    const categoryStats = await Job.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Type breakdown
    const typeStats = await Job.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalJobs,
          active: activeJobs,
          featured: featuredJobs
        },
        statusBreakdown: stats,
        categoryBreakdown: categoryStats,
        typeBreakdown: typeStats
      }
    });
  } catch (error) {
    logger.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job statistics'
    });
  }
});

// @desc    Get trending jobs
// @route   GET /api/jobs/trending
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const trendingJobs = await Job.find({ status: 'active' })
      .sort({ views: -1, applications: -1, createdAt: -1 })
      .limit(10)
      .populate('postedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: trendingJobs
    });
  } catch (error) {
    logger.error('Get trending jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending jobs'
    });
  }
});

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredJobs = await Job.find({ 
      status: 'active', 
      featured: true 
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('postedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: featuredJobs
    });
  } catch (error) {
    logger.error('Get featured jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured jobs'
    });
  }
});

// @desc    Toggle job featured status
// @route   PATCH /api/jobs/:id/featured
// @access  Private (Admin only)
router.patch('/:id/featured', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.featured = !job.featured;
    await job.save();

    logger.info(`Job featured status toggled: ${job.title} - ${job.featured}`);

    res.json({
      success: true,
      message: `Job ${job.featured ? 'featured' : 'unfeatured'} successfully`,
      data: job
    });
  } catch (error) {
    logger.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating featured status'
    });
  }
});

module.exports = router;