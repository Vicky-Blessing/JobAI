const express = require('express');
const Resume = require('../models/Resume');
const { protect, checkOwnership } = require('../middleware/auth');
const { uploadResume, deleteFile } = require('../utils/fileUpload');
const { validateObjectId } = require('../middleware/validation');
const resumeProcessor = require('../services/resumeProcessor');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Upload and analyze resume
// @route   POST /api/resumes
// @access  Private
router.post('/', protect, uploadResume.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file'
      });
    }

    // Extract text from uploaded file
    const extractedText = await resumeProcessor.extractText(
      req.file.path,
      req.file.mimetype
    );

    if (!extractedText || extractedText.length < 100) {
      await deleteFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Could not extract sufficient text from resume. Please ensure the file is not corrupted.'
      });
    }

    // Create resume record with pending status
    const resume = await Resume.create({
      user: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
      processingStatus: 'processing',
      metadata: {
        uploadIp: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Process resume asynchronously
    processResumeAsync(resume._id, extractedText, req.file.originalname);

    logger.info(`Resume uploaded: ${req.file.originalname} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully. Analysis in progress.',
      data: {
        id: resume._id,
        fileName: resume.originalName,
        status: resume.processingStatus,
        uploadedAt: resume.createdAt
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await deleteFile(req.file.path).catch(() => {});
    }

    logger.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resume upload'
    });
  }
});

// Async function to process resume
async function processResumeAsync(resumeId, extractedText, fileName) {
  try {
    const startTime = Date.now();

    // Extract basic information
    const basicInfo = resumeProcessor.extractBasicInfo(extractedText);

    // Get AI analysis
    const aiAnalysis = await aiService.analyzeResume(extractedText, fileName);

    // Update resume with analysis
    await Resume.findByIdAndUpdate(resumeId, {
      analysis: {
        summary: aiAnalysis.summary,
        skills: basicInfo.skills.length > 0 ? basicInfo.skills : aiAnalysis.skills,
        experience: basicInfo.experience.length > 0 ? basicInfo.experience : aiAnalysis.experience,
        education: basicInfo.education.length > 0 ? basicInfo.education : aiAnalysis.education,
        certifications: [],
        languages: [],
        projects: []
      },
      aiAnalysis: {
        overallScore: aiAnalysis.overallScore,
        scores: aiAnalysis.scores,
        strengths: aiAnalysis.strengths,
        weaknesses: aiAnalysis.weaknesses,
        improvements: aiAnalysis.improvements,
        feedback: aiAnalysis.feedback,
        keywordDensity: [],
        readabilityScore: 75,
        atsCompatibility: aiAnalysis.atsCompatibility
      },
      processingStatus: 'completed',
      'metadata.processingTime': Date.now() - startTime,
      'metadata.aiModel': 'gpt-3.5-turbo',
      'metadata.apiVersion': '1.0'
    });

    logger.info(`Resume analysis completed for ID: ${resumeId}`);
  } catch (error) {
    logger.error(`Resume processing failed for ID: ${resumeId}`, error);
    
    await Resume.findByIdAndUpdate(resumeId, {
      processingStatus: 'failed',
      processingError: error.message
    });
  }
}

// @desc    Get user's resumes
// @route   GET /api/resumes
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const resumes = await Resume.find({ 
      user: req.user.id, 
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-extractedText') // Exclude large text field
      .lean();

    const total = await Resume.countDocuments({ 
      user: req.user.id, 
      isActive: true 
    });

    res.json({
      success: true,
      count: resumes.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      data: resumes
    });
  } catch (error) {
    logger.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching resumes'
    });
  }
});

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
router.get('/:id', protect, validateObjectId(), checkOwnership(Resume), async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.resource
    });
  } catch (error) {
    logger.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching resume'
    });
  }
});

// @desc    Get latest resume
// @route   GET /api/resumes/latest
// @access  Private
router.get('/latest', protect, async (req, res) => {
  try {
    const resume = await Resume.getLatestByUser(req.user.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    logger.error('Get latest resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching latest resume'
    });
  }
});

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
router.delete('/:id', protect, validateObjectId(), checkOwnership(Resume), async (req, res) => {
  try {
    const resume = req.resource;

    // Soft delete - mark as inactive
    resume.isActive = false;
    await resume.save();

    // Delete physical file
    await deleteFile(resume.filePath).catch(err => {
      logger.warn(`Failed to delete resume file: ${resume.filePath}`, err);
    });

    logger.info(`Resume deleted: ${resume.originalName} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    logger.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting resume'
    });
  }
});

// @desc    Get resume analysis status
// @route   GET /api/resumes/:id/status
// @access  Private
router.get('/:id/status', protect, validateObjectId(), checkOwnership(Resume), async (req, res) => {
  try {
    const resume = req.resource;

    res.json({
      success: true,
      data: {
        id: resume._id,
        status: resume.processingStatus,
        error: resume.processingError,
        progress: resume.processingStatus === 'completed' ? 100 : 
                 resume.processingStatus === 'processing' ? 50 : 0
      }
    });
  } catch (error) {
    logger.error('Get resume status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching resume status'
    });
  }
});

// @desc    Reprocess resume
// @route   POST /api/resumes/:id/reprocess
// @access  Private
router.post('/:id/reprocess', protect, validateObjectId(), checkOwnership(Resume), async (req, res) => {
  try {
    const resume = req.resource;

    if (resume.processingStatus === 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Resume is already being processed'
      });
    }

    // Reset status to processing
    resume.processingStatus = 'processing';
    resume.processingError = undefined;
    await resume.save();

    // Reprocess asynchronously
    processResumeAsync(resume._id, resume.extractedText, resume.originalName);

    logger.info(`Resume reprocessing initiated: ${resume.originalName} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Resume reprocessing initiated',
      data: {
        id: resume._id,
        status: resume.processingStatus
      }
    });
  } catch (error) {
    logger.error('Reprocess resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reprocessing resume'
    });
  }
});

// @desc    Get resume statistics
// @route   GET /api/resumes/stats/overview
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Resume.aggregate([
      { $match: { user: userId, isActive: true } },
      {
        $group: {
          _id: null,
          totalResumes: { $sum: 1 },
          avgScore: { $avg: '$aiAnalysis.overallScore' },
          completedAnalyses: {
            $sum: { $cond: [{ $eq: ['$processingStatus', 'completed'] }, 1, 0] }
          },
          failedAnalyses: {
            $sum: { $cond: [{ $eq: ['$processingStatus', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalResumes: 0,
      avgScore: 0,
      completedAnalyses: 0,
      failedAnalyses: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get resume stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching resume statistics'
    });
  }
});

module.exports = router;