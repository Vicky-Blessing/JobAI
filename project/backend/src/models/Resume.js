const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  extractedText: {
    type: String,
    required: [true, 'Extracted text is required']
  },
  analysis: {
    summary: String,
    skills: [{
      name: String,
      category: {
        type: String,
        enum: ['technical', 'soft', 'language', 'certification', 'other'],
        default: 'other'
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      }
    }],
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String,
      startDate: Date,
      endDate: Date,
      current: Boolean
    }],
    education: [{
      degree: String,
      institution: String,
      graduationDate: Date,
      gpa: String,
      major: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String
    }],
    languages: [{
      name: String,
      proficiency: {
        type: String,
        enum: ['basic', 'conversational', 'fluent', 'native'],
        default: 'conversational'
      }
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String
    }]
  },
  aiAnalysis: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    scores: {
      formatting: { type: Number, min: 0, max: 100 },
      content: { type: Number, min: 0, max: 100 },
      skills: { type: Number, min: 0, max: 100 },
      experience: { type: Number, min: 0, max: 100 },
      education: { type: Number, min: 0, max: 100 },
      keywords: { type: Number, min: 0, max: 100 }
    },
    strengths: [String],
    weaknesses: [String],
    improvements: [String],
    feedback: [String],
    keywordDensity: [{
      keyword: String,
      count: Number,
      density: Number
    }],
    readabilityScore: Number,
    atsCompatibility: {
      score: { type: Number, min: 0, max: 100 },
      issues: [String],
      recommendations: [String]
    }
  },
  jobMatches: [{
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    matchedSkills: [String],
    missingSkills: [String],
    relevanceReasons: [String],
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: String,
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  metadata: {
    uploadIp: String,
    userAgent: String,
    processingTime: Number,
    aiModel: String,
    apiVersion: String
  }
}, {
  timestamps: true
});

// Indexes
resumeSchema.index({ user: 1 });
resumeSchema.index({ processingStatus: 1 });
resumeSchema.index({ isActive: 1 });
resumeSchema.index({ createdAt: -1 });
resumeSchema.index({ 'analysis.skills.name': 1 });

// Virtual for file URL
resumeSchema.virtual('fileUrl').get(function() {
  return `/uploads/resumes/${this.fileName}`;
});

// Method to calculate match score with a job
resumeSchema.methods.calculateJobMatch = function(job) {
  const resumeSkills = this.analysis.skills.map(skill => skill.name.toLowerCase());
  const jobSkills = job.skills.map(skill => skill.name.toLowerCase());
  
  const matchedSkills = resumeSkills.filter(skill => 
    jobSkills.some(jobSkill => 
      jobSkill.includes(skill) || skill.includes(jobSkill)
    )
  );
  
  const missingSkills = jobSkills.filter(skill => 
    !resumeSkills.some(resumeSkill => 
      resumeSkill.includes(skill) || skill.includes(resumeSkill)
    )
  );
  
  // Calculate base match score
  let matchScore = 0;
  if (jobSkills.length > 0) {
    matchScore = (matchedSkills.length / jobSkills.length) * 100;
  }
  
  // Adjust score based on experience level
  const experienceYears = this.analysis.experience.length;
  const jobLevel = job.level;
  
  const levelAdjustment = {
    'entry': experienceYears >= 0 ? 10 : -10,
    'junior': experienceYears >= 1 ? 10 : -5,
    'mid': experienceYears >= 3 ? 10 : -5,
    'senior': experienceYears >= 5 ? 10 : -10,
    'lead': experienceYears >= 7 ? 10 : -15,
    'executive': experienceYears >= 10 ? 10 : -20
  };
  
  matchScore += levelAdjustment[jobLevel] || 0;
  
  // Ensure score is within bounds
  matchScore = Math.max(0, Math.min(100, matchScore));
  
  return {
    matchScore: Math.round(matchScore),
    matchedSkills,
    missingSkills,
    relevanceReasons: this.generateRelevanceReasons(matchedSkills, job)
  };
};

// Method to generate relevance reasons
resumeSchema.methods.generateRelevanceReasons = function(matchedSkills, job) {
  const reasons = [];
  
  if (matchedSkills.length > 3) {
    reasons.push(`Strong skill alignment with ${matchedSkills.length} matching technical skills`);
  }
  
  if (this.analysis.experience.length >= 2) {
    reasons.push('Relevant experience level matches job requirements');
  }
  
  if (job.level === 'senior' && this.aiAnalysis.overallScore > 85) {
    reasons.push('Senior-level qualifications align with position requirements');
  }
  
  const techSkills = ['javascript', 'python', 'react', 'node.js', 'java', 'sql'];
  const hasTechSkills = matchedSkills.some(skill => 
    techSkills.some(tech => skill.toLowerCase().includes(tech))
  );
  
  if (hasTechSkills) {
    reasons.push('Core technology stack matches job requirements');
  }
  
  return reasons.length > 0 ? reasons : ['General experience and skills are relevant to this position'];
};

// Static method to get user's latest resume
resumeSchema.statics.getLatestByUser = function(userId) {
  return this.findOne({ user: userId, isActive: true })
    .sort({ createdAt: -1 })
    .populate('user', 'name email');
};

module.exports = mongoose.model('Resume', resumeSchema);