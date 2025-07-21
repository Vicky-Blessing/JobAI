import { Job } from '../types';

export class JobService {
  private static mockJobs: Job[] = [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'full-time',
      salary: '$120,000 - $160,000',
      description: 'We are seeking a Senior Frontend Developer to join our growing team. You will be responsible for developing user-facing applications using modern JavaScript frameworks.',
      requirements: ['5+ years React experience', 'TypeScript proficiency', 'Modern CSS frameworks', 'REST API integration'],
      benefits: ['Health insurance', '401k matching', 'Flexible work hours', 'Remote work options'],
      postedAt: new Date('2024-01-15'),
      source: 'linkedin',
      logo: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
    },
    {
      id: '2',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'New York, NY',
      type: 'full-time',
      salary: '$95,000 - $130,000',
      description: 'Join our innovative startup as a Full Stack Engineer. Work on cutting-edge projects using modern web technologies.',
      requirements: ['JavaScript/TypeScript', 'React or Vue.js', 'Node.js', 'Database design', 'API development'],
      benefits: ['Equity package', 'Health insurance', 'Learning budget', 'Flexible PTO'],
      postedAt: new Date('2024-01-12'),
      source: 'indeed',
      logo: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
    },
    {
      id: '3',
      title: 'Python Developer',
      company: 'DataSolutions LLC',
      location: 'Austin, TX',
      type: 'full-time',
      salary: '$105,000 - $140,000',
      description: 'Looking for a Python Developer to work on data processing and analysis applications. Experience with machine learning is a plus.',
      requirements: ['Python 3.x', 'Django or Flask', 'SQL databases', 'Data analysis libraries', 'Version control (Git)'],
      benefits: ['Health & dental', 'Retirement plan', 'Professional development', 'Work from home options'],
      postedAt: new Date('2024-01-10'),
      source: 'linkedin',
      logo: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
    },
    {
      id: '4',
      title: 'Junior Software Developer',
      company: 'WebSolutions Co.',
      location: 'Remote',
      type: 'full-time',
      salary: '$65,000 - $85,000',
      description: 'Great opportunity for a junior developer to grow their skills in a supportive environment. We work with modern web technologies.',
      requirements: ['HTML/CSS/JavaScript', 'Basic React knowledge', 'Git version control', 'Problem-solving skills'],
      benefits: ['Remote work', 'Mentorship program', 'Health insurance', 'Career growth opportunities'],
      postedAt: new Date('2024-01-08'),
      source: 'indeed',
      logo: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
    },
    {
      id: '5',
      title: 'DevOps Engineer',
      company: 'CloudTech Solutions',
      location: 'Seattle, WA',
      type: 'full-time',
      salary: '$110,000 - $150,000',
      description: 'Seeking a DevOps Engineer to manage our cloud infrastructure and implement CI/CD pipelines.',
      requirements: ['AWS/Azure experience', 'Docker & Kubernetes', 'CI/CD pipelines', 'Infrastructure as Code', 'Monitoring tools'],
      benefits: ['Stock options', 'Health benefits', 'Conference attendance', 'Flexible schedule'],
      postedAt: new Date('2024-01-05'),
      source: 'manual',
      logo: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
    }
  ];

  static async scrapeJobs(): Promise<Job[]> {
    // Simulate web scraping delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, this would scrape from actual job sites
    const newJobs: Job[] = [
      {
        id: `scraped-${Date.now()}-1`,
        title: 'React Developer',
        company: 'Innovation Labs',
        location: 'Boston, MA',
        type: 'contract',
        salary: '$80/hour - $120/hour',
        description: 'Contract position for React Developer to work on exciting fintech projects.',
        requirements: ['React.js', 'Redux', 'TypeScript', 'REST APIs'],
        benefits: ['Competitive hourly rate', 'Flexible hours', 'Potential for extension'],
        postedAt: new Date(),
        source: 'linkedin',
        logo: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
      },
      {
        id: `scraped-${Date.now()}-2`,
        title: 'Backend Engineer',
        company: 'FinanceApp Inc.',
        location: 'Chicago, IL',
        type: 'full-time',
        salary: '$100,000 - $135,000',
        description: 'Backend Engineer role focusing on scalable financial applications.',
        requirements: ['Node.js', 'PostgreSQL', 'Microservices', 'AWS'],
        benefits: ['Health insurance', '401k', 'Bonus potential', 'Remote friendly'],
        postedAt: new Date(),
        source: 'indeed',
        logo: 'https://images.pexels.com/photos/3184397/pexels-photo-3184397.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
      }
    ];

    return [...this.mockJobs, ...newJobs];
  }

  static async getAllJobs(): Promise<Job[]> {
    const stored = localStorage.getItem('jobs');
    if (stored) {
      const jobs = JSON.parse(stored);
      return jobs.map((job: any) => ({
        ...job,
        postedAt: new Date(job.postedAt)
      }));
    }
    
    const jobs = await this.scrapeJobs();
    localStorage.setItem('jobs', JSON.stringify(jobs));
    return jobs;
  }

  static async addJob(job: Omit<Job, 'id' | 'postedAt'>): Promise<Job> {
    const newJob: Job = {
      ...job,
      id: `manual-${Date.now()}`,
      postedAt: new Date(),
      source: 'manual'
    };

    const existingJobs = await this.getAllJobs();
    const updatedJobs = [...existingJobs, newJob];
    localStorage.setItem('jobs', JSON.stringify(updatedJobs));
    
    return newJob;
  }

  static async deleteJob(jobId: string): Promise<void> {
    const jobs = await this.getAllJobs();
    const filteredJobs = jobs.filter(job => job.id !== jobId);
    localStorage.setItem('jobs', JSON.stringify(filteredJobs));
  }
}