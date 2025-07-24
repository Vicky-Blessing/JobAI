const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    this.baseURL = 'https://api.openai.com/v1';
  }

  // Analyze resume text and extract information
  async analyzeResume(resumeText, fileName) {
    try {
      const prompt = this.createResumeAnalysisPrompt(resumeText);
      
      const response = await this.callOpenAI(prompt);
      const analysis = this.parseResumeAnalysis(response);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(analysis);
      
      return {
        ...analysis,
        overallScore,
        fileName,
        processingTime: Date.now()
      };
    } catch (error) {
      logger.error('Resume analysis failed:', error);
      // Return fallback analysis
      return this.getFallbackResumeAnalysis(resumeText, fileName);
    }
  }

  // Match resume with job
  async matchResumeWithJob(resume, job) {
    try {
      const prompt = this.createJobMatchingPrompt(resume, job);
      
      const response = await this.callOpenAI(prompt);
      const matchResult = this.parseJobMatchResult(response);
      
      return {
        ...matchResult,
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Job matching failed:', error);
      // Return fallback matching
      return this.getFallbackJobMatch(resume, job);
    }
  }

  // Generate improvement suggestions
  async generateImprovements(resume, targetJob = null) {
    try {
      const prompt = this.createImprovementPrompt(resume, targetJob);
      
      const response = await this.callOpenAI(prompt);
      return this.parseImprovements(response);
    } catch (error) {
      logger.error('Improvement generation failed:', error);
      return this.getFallbackImprovements(resume);
    }
  }

  // Call OpenAI API
  async callOpenAI(prompt, maxTokens = 1500) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional and resume analyst. Provide detailed, actionable feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  }

  // Create resume analysis prompt
  createResumeAnalysisPrompt(resumeText) {
    return `
Analyze the following resume and provide a detailed assessment in JSON format:

Resume Text:
${resumeText}

Please provide analysis in the following JSON structure:
{
  "summary": "Brief professional summary",
  "skills": [
    {
      "name": "skill name",
      "category": "technical|soft|language|certification|other",
      "confidence": 0.8
    }
  ],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "duration",
      "description": "brief description"
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "institution": "school name",
      "graduationDate": "date or null"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "feedback": ["feedback 1", "feedback 2"],
  "scores": {
    "formatting": 85,
    "content": 90,
    "skills": 80,
    "experience": 85,
    "education": 75,
    "keywords": 70
  },
  "atsCompatibility": {
    "score": 85,
    "issues": ["issue 1"],
    "recommendations": ["recommendation 1"]
  }
}
`;
  }

  // Create job matching prompt
  createJobMatchingPrompt(resume, job) {
    return `
Match the following resume with the job posting and provide a detailed analysis:

Resume Summary: ${resume.analysis.summary}
Resume Skills: ${resume.analysis.skills.map(s => s.name).join(', ')}
Resume Experience: ${resume.analysis.experience.map(e => `${e.title} at ${e.company}`).join(', ')}

Job Title: ${job.title}
Job Description: ${job.description}
Job Requirements: ${job.requirements.join(', ')}
Job Skills: ${job.skills.map(s => s.name).join(', ')}

Provide analysis in JSON format:
{
  "matchScore": 85,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "relevanceReasons": [
    "Strong technical skill alignment",
    "Relevant experience level"
  ],
  "recommendations": [
    "Highlight specific project experience",
    "Emphasize leadership skills"
  ]
}
`;
  }

  // Create improvement prompt
  createImprovementPrompt(resume, targetJob) {
    const jobContext = targetJob ? 
      `Target Job: ${targetJob.title} at ${targetJob.company}
       Job Requirements: ${targetJob.requirements.join(', ')}` : 
      'General career improvement';

    return `
Provide specific improvement suggestions for this resume:

Resume Summary: ${resume.analysis.summary}
Current Score: ${resume.aiAnalysis.overallScore}
${jobContext}

Provide suggestions in JSON format:
{
  "improvements": [
    "Specific improvement 1",
    "Specific improvement 2"
  ],
  "skillGaps": ["skill1", "skill2"],
  "formatSuggestions": ["format tip 1"],
  "contentSuggestions": ["content tip 1"]
}
`;
  }

  // Parse resume analysis response
  parseResumeAnalysis(response) {
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.warn('Failed to parse AI response, using fallback');
      return this.getFallbackResumeAnalysis();
    }
  }

  // Parse job match result
  parseJobMatchResult(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.warn('Failed to parse job match response, using fallback');
      return { matchScore: 70, matchedSkills: [], missingSkills: [], relevanceReasons: [] };
    }
  }

  // Parse improvements
  parseImprovements(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.warn('Failed to parse improvements response, using fallback');
      return { improvements: [], skillGaps: [], formatSuggestions: [], contentSuggestions: [] };
    }
  }

  // Calculate overall score
  calculateOverallScore(analysis) {
    if (analysis.scores) {
      const scores = Object.values(analysis.scores);
      return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    return 75; // Default score
  }

  // Fallback resume analysis (when AI is not available)
  getFallbackResumeAnalysis(resumeText = '', fileName = '') {
    const words = resumeText.toLowerCase().split(/\s+/);
    const skillKeywords = ['javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'docker', 'git'];
    const foundSkills = skillKeywords.filter(skill => 
      words.some(word => word.includes(skill.replace('.', '')))
    );

    return {
      summary: 'Professional with diverse experience and technical skills.',
      skills: foundSkills.map(skill => ({
        name: skill,
        category: 'technical',
        confidence: 0.7
      })),
      experience: [{
        title: 'Software Developer',
        company: 'Technology Company',
        duration: '2+ years',
        description: 'Software development experience'
      }],
      education: [{
        degree: 'Bachelor\'s Degree',
        institution: 'University',
        graduationDate: null
      }],
      strengths: ['Technical skills', 'Problem solving'],
      weaknesses: ['Could improve presentation'],
      improvements: ['Add more specific achievements', 'Include quantifiable results'],
      feedback: ['Good technical foundation', 'Consider adding more details'],
      scores: {
        formatting: 75,
        content: 80,
        skills: 85,
        experience: 75,
        education: 70,
        keywords: 65
      },
      atsCompatibility: {
        score: 75,
        issues: ['Could improve keyword density'],
        recommendations: ['Use more industry-specific terms']
      },
      overallScore: 75,
      fileName,
      processingTime: Date.now()
    };
  }

  // Fallback job matching
  getFallbackJobMatch(resume, job) {
    const resumeSkills = resume.analysis.skills.map(s => s.name.toLowerCase());
    const jobSkills = job.skills.map(s => s.name.toLowerCase());
    
    const matchedSkills = resumeSkills.filter(skill => 
      jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
    );
    
    const matchScore = Math.min(100, Math.round((matchedSkills.length / Math.max(jobSkills.length, 1)) * 100));
    
    return {
      matchScore,
      matchedSkills,
      missingSkills: jobSkills.filter(skill => !matchedSkills.includes(skill)),
      relevanceReasons: ['Skills alignment with job requirements'],
      recommendations: ['Highlight relevant experience']
    };
  }

  // Fallback improvements
  getFallbackImprovements(resume) {
    return {
      improvements: [
        'Add more specific achievements with quantifiable results',
        'Include relevant keywords from target job descriptions',
        'Improve formatting and visual presentation'
      ],
      skillGaps: ['Consider learning trending technologies'],
      formatSuggestions: ['Use consistent formatting throughout'],
      contentSuggestions: ['Add more detailed project descriptions']
    };
  }
}

module.exports = new AIService();