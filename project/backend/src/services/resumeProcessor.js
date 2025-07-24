const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

class ResumeProcessor {
  // Extract text from uploaded resume file
  async extractText(filePath, mimeType) {
    try {
      const buffer = await fs.readFile(filePath);
      
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer);
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromWord(buffer);
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      logger.error('Text extraction failed:', error);
      throw new Error('Failed to extract text from resume');
    }
  }

  // Extract text from PDF
  async extractFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return this.cleanText(data.text);
    } catch (error) {
      logger.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Extract text from Word document
  async extractFromWord(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    } catch (error) {
      logger.error('Word extraction failed:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  // Clean and normalize extracted text
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Extract basic information using regex patterns
  extractBasicInfo(text) {
    const info = {
      emails: this.extractEmails(text),
      phones: this.extractPhones(text),
      urls: this.extractUrls(text),
      skills: this.extractSkills(text),
      education: this.extractEducation(text),
      experience: this.extractExperience(text)
    };

    return info;
  }

  // Extract email addresses
  extractEmails(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  // Extract phone numbers
  extractPhones(text) {
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    return text.match(phoneRegex) || [];
  }

  // Extract URLs
  extractUrls(text) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return text.match(urlRegex) || [];
  }

  // Extract skills using keyword matching
  extractSkills(text) {
    const skillKeywords = [
      // Programming Languages
      'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
      'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
      
      // Web Technologies
      'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
      'spring', 'laravel', 'rails', 'asp.net', 'jquery', 'bootstrap', 'sass', 'less',
      
      // Databases
      'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
      'cassandra', 'dynamodb', 'firebase',
      
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github',
      'terraform', 'ansible', 'chef', 'puppet', 'vagrant',
      
      // Tools & Frameworks
      'git', 'svn', 'jira', 'confluence', 'slack', 'trello', 'asana', 'figma', 'sketch',
      'photoshop', 'illustrator', 'indesign',
      
      // Soft Skills
      'leadership', 'management', 'communication', 'teamwork', 'problem solving',
      'analytical', 'creative', 'organized', 'detail oriented', 'time management',
      
      // Methodologies
      'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'six sigma', 'devops', 'ci/cd'
    ];

    const textLower = text.toLowerCase();
    const foundSkills = [];

    skillKeywords.forEach(skill => {
      if (textLower.includes(skill)) {
        foundSkills.push({
          name: skill,
          category: this.categorizeSkill(skill),
          confidence: this.calculateSkillConfidence(textLower, skill)
        });
      }
    });

    return foundSkills;
  }

  // Categorize skill type
  categorizeSkill(skill) {
    const categories = {
      technical: ['javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker'],
      soft: ['leadership', 'communication', 'teamwork', 'problem solving', 'management'],
      language: ['english', 'spanish', 'french', 'german', 'chinese', 'japanese'],
      certification: ['aws certified', 'pmp', 'cissp', 'comptia'],
      other: []
    };

    for (const [category, skills] of Object.entries(categories)) {
      if (skills.some(s => skill.toLowerCase().includes(s))) {
        return category;
      }
    }

    return 'other';
  }

  // Calculate skill confidence based on context
  calculateSkillConfidence(text, skill) {
    const skillOccurrences = (text.match(new RegExp(skill, 'gi')) || []).length;
    const contextWords = ['experience', 'proficient', 'expert', 'advanced', 'years'];
    
    let confidence = Math.min(0.9, 0.3 + (skillOccurrences * 0.1));
    
    contextWords.forEach(word => {
      if (text.includes(`${word} ${skill}`) || text.includes(`${skill} ${word}`)) {
        confidence += 0.1;
      }
    });

    return Math.min(1.0, confidence);
  }

  // Extract education information
  extractEducation(text) {
    const educationKeywords = [
      'bachelor', 'master', 'phd', 'doctorate', 'associate', 'diploma', 'certificate',
      'university', 'college', 'institute', 'school', 'degree'
    ];

    const educationSections = [];
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      if (educationKeywords.some(keyword => lineLower.includes(keyword))) {
        educationSections.push({
          degree: this.extractDegree(line),
          institution: this.extractInstitution(line, lines, index),
          graduationDate: this.extractDate(line)
        });
      }
    });

    return educationSections;
  }

  // Extract work experience
  extractExperience(text) {
    const experienceKeywords = [
      'experience', 'employment', 'work history', 'professional experience',
      'career', 'positions', 'roles'
    ];

    const jobTitles = [
      'developer', 'engineer', 'manager', 'analyst', 'consultant', 'specialist',
      'coordinator', 'assistant', 'director', 'lead', 'senior', 'junior'
    ];

    const experiences = [];
    const lines = text.split('\n');

    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      if (jobTitles.some(title => lineLower.includes(title))) {
        experiences.push({
          title: this.extractJobTitle(line),
          company: this.extractCompany(line, lines, index),
          duration: this.extractDuration(line, lines, index),
          description: this.extractJobDescription(lines, index)
        });
      }
    });

    return experiences;
  }

  // Helper methods for extraction
  extractDegree(line) {
    const degreePatterns = [
      /bachelor[s]?\s+(?:of\s+)?(?:science|arts|engineering|business)/i,
      /master[s]?\s+(?:of\s+)?(?:science|arts|engineering|business)/i,
      /phd|doctorate/i,
      /associate[s]?\s+degree/i
    ];

    for (const pattern of degreePatterns) {
      const match = line.match(pattern);
      if (match) return match[0];
    }

    return line.trim();
  }

  extractInstitution(line, lines, index) {
    // Look for university/college names in current and next lines
    const institutionKeywords = ['university', 'college', 'institute', 'school'];
    
    for (let i = index; i < Math.min(index + 3, lines.length); i++) {
      const currentLine = lines[i].toLowerCase();
      if (institutionKeywords.some(keyword => currentLine.includes(keyword))) {
        return lines[i].trim();
      }
    }

    return null;
  }

  extractDate(text) {
    const datePatterns = [
      /\b(19|20)\d{2}\b/g,
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/(19|20)\d{2}\b/g
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }

    return null;
  }

  extractJobTitle(line) {
    return line.trim();
  }

  extractCompany(line, lines, index) {
    // Look for company name in current and next lines
    for (let i = index; i < Math.min(index + 2, lines.length); i++) {
      const currentLine = lines[i];
      if (currentLine.includes('Inc') || currentLine.includes('LLC') || 
          currentLine.includes('Corp') || currentLine.includes('Ltd')) {
        return currentLine.trim();
      }
    }

    return null;
  }

  extractDuration(line, lines, index) {
    const durationPatterns = [
      /\b(19|20)\d{2}\s*-\s*(19|20)\d{2}\b/,
      /\b(19|20)\d{2}\s*-\s*present\b/i,
      /\b\d+\s+years?\b/i,
      /\b\d+\s+months?\b/i
    ];

    for (let i = index; i < Math.min(index + 3, lines.length); i++) {
      const currentLine = lines[i];
      for (const pattern of durationPatterns) {
        const match = currentLine.match(pattern);
        if (match) return match[0];
      }
    }

    return null;
  }

  extractJobDescription(lines, index) {
    // Get next few lines as job description
    const descriptionLines = [];
    for (let i = index + 1; i < Math.min(index + 5, lines.length); i++) {
      const line = lines[i].trim();
      if (line && !this.isLikelyNewSection(line)) {
        descriptionLines.push(line);
      } else {
        break;
      }
    }

    return descriptionLines.join(' ');
  }

  isLikelyNewSection(line) {
    const sectionKeywords = [
      'education', 'experience', 'skills', 'projects', 'certifications',
      'awards', 'publications', 'references'
    ];

    return sectionKeywords.some(keyword => 
      line.toLowerCase().includes(keyword)
    );
  }
}

module.exports = new ResumeProcessor();