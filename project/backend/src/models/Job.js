const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: [{
    type: String,
    maxlength: [500, 'Requirement cannot exceed 500 characters']
  }],
  responsibilities: [{
    type: String,
    maxlength: [500, 'Responsibility cannot exceed 500 characters']
  }],
  benefits: [{
    type: String,
    maxlength: [200, 'Benefit cannot exceed 200 characters']
  }],
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: [true, 'Job type is required']
  },
  level: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
    default: 'mid'
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  skills: [{
    name: String,
    required: {
      type: Boolean,
      default: false
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    }
  }],
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: [
      'technology',
      'marketing',
      'sales',
      'design',
      'finance',
      'operations',
      'hr',
      'customer-service',
      'healthcare',
      'education',
      'other'
    ]
  },
  industry: String,
  companySize: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise']
  },
  companyLogo: String,
  companyWebsite: String,
  applicationDeadline: Date,
  startDate: Date,
  source: {
    type: String,
    enum: ['manual', 'linkedin', 'indeed', 'glassdoor', 'other'],
    default: 'manual'
  },
  sourceUrl: String,
  externalId: String,
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  metadata: {
    scrapedAt: Date,
    lastUpdated: Date,
    aiProcessed: {
      type: Boolean,
      default: false
    },
    aiSkillsExtracted: [String],
    aiSummary: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ featured: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ 'skills.name': 1 });
jobSchema.index({ source: 1 });

// Virtual for salary display
jobSchema.virtual('salaryDisplay').get(function() {
  if (!this.salary || (!this.salary.min && !this.salary.max)) {
    return 'Salary not specified';
  }
  
  const currency = this.salary.currency || 'USD';
  const period = this.salary.period || 'yearly';
  
  if (this.salary.min && this.salary.max) {
    return `${currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()} ${period}`;
  } else if (this.salary.min) {
    return `${currency} ${this.salary.min.toLocaleString()}+ ${period}`;
  } else {
    return `Up to ${currency} ${this.salary.max.toLocaleString()} ${period}`;
  }
});

// Method to increment views
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to increment applications
jobSchema.methods.incrementApplications = function() {
  this.applications += 1;
  return this.save({ validateBeforeSave: false });
};

// Static method to get active jobs
jobSchema.statics.getActiveJobs = function(filters = {}) {
  return this.find({ status: 'active', ...filters })
    .populate('postedBy', 'name email')
    .sort({ featured: -1, createdAt: -1 });
};

// Static method for search
jobSchema.statics.searchJobs = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    ...filters
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery)
    .populate('postedBy', 'name email')
    .sort({ featured: -1, score: { $meta: 'textScore' }, createdAt: -1 });
};

module.exports = mongoose.model('Job', jobSchema);