import { Resume, Job } from '../types';

// Mock AI service for demonstration
export class AIService {
  static async analyzeResume(file: File): Promise<Resume> {
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock resume analysis based on file name patterns
    const fileName = file.name.toLowerCase();
    let mockData;

    if (fileName.includes('senior') || fileName.includes('lead')) {
      mockData = {
        summary: "Experienced senior professional with strong leadership and technical skills. Demonstrated expertise in project management and team leadership.",
        skills: ["Leadership", "Project Management", "Strategic Planning", "Team Building", "JavaScript", "Python", "React", "Node.js"],
        experience: [
          "Senior Software Engineer at TechCorp (2018-2023)",
          "Software Engineer at StartupInc (2015-2018)",
          "Junior Developer at WebSolutions (2013-2015)"
        ],
        education: ["Master's in Computer Science", "Bachelor's in Software Engineering"],
        score: 92,
        feedback: ["Strong technical background", "Excellent leadership experience", "Well-structured career progression"],
        improvements: ["Consider adding more industry certifications", "Include specific project outcomes and metrics"]
      };
    } else if (fileName.includes('junior') || fileName.includes('entry')) {
      mockData = {
        summary: "Enthusiastic junior professional with solid foundational skills and eagerness to learn and grow in the technology industry.",
        skills: ["JavaScript", "HTML/CSS", "React", "Git", "Problem Solving", "Communication"],
        experience: [
          "Frontend Developer Intern at WebCorp (2022-2023)",
          "Part-time Developer at LocalBusiness (2021-2022)"
        ],
        education: ["Bachelor's in Computer Science", "Relevant Coursework in Web Development"],
        score: 78,
        feedback: ["Good foundational skills", "Shows potential for growth", "Relevant educational background"],
        improvements: ["Gain more professional experience", "Build a stronger portfolio", "Learn additional frameworks"]
      };
    } else {
      mockData = {
        summary: "Skilled professional with diverse experience and strong technical capabilities. Proven track record in software development and problem-solving.",
        skills: ["JavaScript", "React", "Node.js", "Python", "SQL", "AWS", "Git", "Agile"],
        experience: [
          "Software Developer at TechSolutions (2019-2023)",
          "Web Developer at DigitalAgency (2017-2019)"
        ],
        education: ["Bachelor's in Computer Science"],
        score: 85,
        feedback: ["Solid technical skills", "Good industry experience", "Versatile skill set"],
        improvements: ["Consider specializing in a specific domain", "Add more leadership experience"]
      };
    }

    return {
      id: `resume-${Date.now()}`,
      fileName: file.name,
      uploadDate: new Date(),
      ...mockData
    };
  }

  static async matchJobs(resume: Resume, jobs: Job[]): Promise<Job[]> {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    return jobs.map(job => {
      const jobSkills = this.extractSkillsFromJob(job);
      const matchedSkills = resume.skills.filter(skill => 
        jobSkills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(jobSkill.toLowerCase())
        )
      );

      const matchScore = Math.min(100, Math.round(
        (matchedSkills.length / Math.max(jobSkills.length, resume.skills.length)) * 100 +
        Math.random() * 20 - 10
      ));

      const relevanceReasons = this.generateRelevanceReasons(matchedSkills, job, resume);

      return {
        ...job,
        matchScore,
        matchedSkills,
        relevanceReasons
      };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  private static extractSkillsFromJob(job: Job): string[] {
    const text = `${job.title} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue',
      'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker',
      'kubernetes', 'git', 'agile', 'scrum', 'leadership', 'management',
      'communication', 'problem solving', 'teamwork', 'project management'
    ];

    return commonSkills.filter(skill => text.includes(skill));
  }

  private static generateRelevanceReasons(matchedSkills: string[], job: Job, resume: Resume): string[] {
    const reasons = [];
    
    if (matchedSkills.length > 3) {
      reasons.push(`Strong skill alignment with ${matchedSkills.length} matching technical skills`);
    }
    
    if (resume.experience.length >= 2) {
      reasons.push(`Relevant experience level matches job requirements`);
    }
    
    if (job.title.toLowerCase().includes('senior') && resume.score > 85) {
      reasons.push(`Senior-level qualifications align with position requirements`);
    }
    
    if (matchedSkills.some(skill => ['react', 'javascript', 'python'].includes(skill.toLowerCase()))) {
      reasons.push(`Core technology stack matches job requirements`);
    }

    return reasons.length > 0 ? reasons : ['General experience and skills are relevant to this position'];
  }

  static async generateFeedback(resume: Resume, job: Job): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const feedback = [];
    const matchScore = job.matchScore || 0;

    if (matchScore >= 80) {
      feedback.push("Excellent match! Your skills align very well with this position.");
      feedback.push("Your experience level is appropriate for this role.");
    } else if (matchScore >= 60) {
      feedback.push("Good match with room for improvement in specific areas.");
      feedback.push("Consider highlighting relevant projects that demonstrate required skills.");
    } else {
      feedback.push("Moderate match. Focus on developing skills mentioned in the job description.");
      feedback.push("Consider gaining experience in the key technologies mentioned.");
    }

    if (job.matchedSkills && job.matchedSkills.length > 0) {
      feedback.push(`Matching skills: ${job.matchedSkills.join(', ')}`);
    }

    return feedback;
  }
}