export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: Date;
  source: 'linkedin' | 'indeed' | 'manual';
  logo?: string;
  matchScore?: number;
  matchedSkills?: string[];
  relevanceReasons?: string[];
}

export interface Resume {
  id: string;
  fileName: string;
  uploadDate: Date;
  summary: string;
  skills: string[];
  experience: string[];
  education: string[];
  score: number;
  feedback: string[];
  improvements: string[];
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'accepted';
  appliedAt: Date;
  coverLetter?: string;
}