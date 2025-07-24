const express = require('express');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { validateProfile, validatePagination } = require('../middleware/validation');
const { uploadAvatar, deleteFile } = require('../utils/fileUpload');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: user.getPublicProfile()
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, validateProfile, async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'profile.phone',
      'profile.location',
      'profile.website',
      'profile.linkedin',
      'profile.github',
      'profile.bio',
      'profile.skills',
      'preferences.jobTypes',
      'preferences.locations',
      'preferences.salaryRange',
      'preferences.remote',
      'preferences.notifications'
    ];

    const updateData = {};
    
    // Build update object with only allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = user.avatar.replace('/uploads/', 'uploads/');
      await deleteFile(oldAvatarPath).catch(() => {});
    }

    // Update user with new avatar
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    logger.info(`Avatar updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await deleteFile(req.file.path).catch(() => {});
    }

    logger.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar upload'
    });
  }
});

// @desc    Add work experience
// @route   POST /api/users/experience
// @access  Private
router.post('/experience', protect, async (req, res) => {
  try {
    const { title, company, location, startDate, endDate, current, description } = req.body;

    if (!title || !company) {
      return res.status(400).json({
        success: false,
        message: 'Title and company are required'
      });
    }

    const user = await User.findById(req.user.id);
    
    user.profile.experience.push({
      title,
      company,
      location,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      current: current || false,
      description
    });

    await user.save();

    logger.info(`Experience added: ${title} at ${company} for ${user.email}`);

    res.json({
      success: true,
      message: 'Experience added successfully',
      data: user.profile.experience
    });
  } catch (error) {
    logger.error('Add experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding experience'
    });
  }
});

// @desc    Update work experience
// @route   PUT /api/users/experience/:experienceId
// @access  Private
router.put('/experience/:experienceId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const experience = user.profile.experience.id(req.params.experienceId);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    // Update experience fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'startDate' || key === 'endDate') {
          experience[key] = new Date(req.body[key]);
        } else {
          experience[key] = req.body[key];
        }
      }
    });

    await user.save();

    logger.info(`Experience updated: ${experience.title} for ${user.email}`);

    res.json({
      success: true,
      message: 'Experience updated successfully',
      data: user.profile.experience
    });
  } catch (error) {
    logger.error('Update experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating experience'
    });
  }
});

// @desc    Delete work experience
// @route   DELETE /api/users/experience/:experienceId
// @access  Private
router.delete('/experience/:experienceId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const experience = user.profile.experience.id(req.params.experienceId);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }

    experience.remove();
    await user.save();

    logger.info(`Experience deleted: ${experience.title} for ${user.email}`);

    res.json({
      success: true,
      message: 'Experience deleted successfully',
      data: user.profile.experience
    });
  } catch (error) {
    logger.error('Delete experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting experience'
    });
  }
});

// @desc    Add education
// @route   POST /api/users/education
// @access  Private
router.post('/education', protect, async (req, res) => {
  try {
    const { degree, school, location, startDate, endDate, gpa, description } = req.body;

    if (!degree || !school) {
      return res.status(400).json({
        success: false,
        message: 'Degree and school are required'
      });
    }

    const user = await User.findById(req.user.id);
    
    user.profile.education.push({
      degree,
      school,
      location,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      gpa,
      description
    });

    await user.save();

    logger.info(`Education added: ${degree} at ${school} for ${user.email}`);

    res.json({
      success: true,
      message: 'Education added successfully',
      data: user.profile.education
    });
  } catch (error) {
    logger.error('Add education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding education'
    });
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', protect, admin, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      data: users
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin)
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @desc    Update user status (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private (Admin)
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User status updated: ${user.email} - ${isActive ? 'activated' : 'deactivated'} by ${req.user.email}`);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats/overview
// @access  Private (Admin)
router.get('/stats/overview', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Role breakdown
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Registration trend (last 6 months)
    const registrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          newThisMonth: newUsersThisMonth
        },
        roleBreakdown: roleStats,
        registrationTrend
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

module.exports = router;