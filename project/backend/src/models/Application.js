const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  customAnswers: [{
    question: String,
    answer: String
  }],
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  interviews: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person', 'technical'],
      required: true
    },
    scheduledAt: Date,
    duration: Number, // in minutes
    interviewer: String,
    notes: String,
    feedback: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    }
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    strengths: [String],
    improvements: [String]
  },
  salary: {
    offered: Number,
    negotiated: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  metadata: {
    source: String,
    referrer: String,
    userAgent: String,
    ipAddress: String,
    applicationTime: Number // time spent on application in seconds
  },
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    smsNotified: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Compound indexes
applicationSchema.index({ user: 1, job: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ appliedAt: -1 });
applicationSchema.index({ status: 1, appliedAt: -1 });

// Virtual for application age
applicationSchema.virtual('applicationAge').get(function() {
  return Math.floor((Date.now() - this.appliedAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to update status
applicationSchema.methods.updateStatus = function(newStatus, changedBy, notes) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    notes,
    changedAt: new Date()
  });
  return this.save();
};

// Method to schedule interview
applicationSchema.methods.scheduleInterview = function(interviewData) {
  this.interviews.push(interviewData);
  if (this.status === 'pending' || this.status === 'reviewing') {
    this.status = 'interview';
  }
  return this.save();
};

// Static method to get user applications
applicationSchema.statics.getUserApplications = function(userId, filters = {}) {
  return this.find({ user: userId, ...filters })
    .populate('job', 'title company location type salary status')
    .populate('resume', 'fileName aiAnalysis.overallScore')
    .sort({ appliedAt: -1 });
};

// Static method to get job applications
applicationSchema.statics.getJobApplications = function(jobId, filters = {}) {
  return this.find({ job: jobId, ...filters })
    .populate('user', 'name email profile.phone profile.location')
    .populate('resume', 'fileName aiAnalysis.overallScore analysis.skills')
    .sort({ appliedAt: -1 });
};

// Static method for analytics
applicationSchema.statics.getAnalytics = function(filters = {}) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgMatchScore: { $avg: '$matchScore' }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            avgMatchScore: '$avgMatchScore'
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to add initial status to history
applicationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: this.appliedAt
    });
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);