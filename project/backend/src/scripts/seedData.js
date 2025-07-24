const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Job = require('../models/Job');
const logger = require('../utils/logger');

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@jobai.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    profile: {
      bio: 'Platform administrator with extensive experience in HR technology.',
      location: 'San Francisco, CA',
      skills: ['Management', 'HR Technology', 'Data Analysis']
    }
  },
  {
    name: 'John Developer',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    profile: {
      bio: 'Full-stack developer with 5 years of experience in React and Node.js.',
      location: 'New York, NY',
      phone: '+1-555-0123',
      linkedin: 'https://linkedin.com/in/johndeveloper',
      github: 'https://github.com/johndeveloper',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'TechCorp Inc.',
          location: 'New York, NY',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-12-31'),
          current: false,
          description: 'Led development of web applications using React and Node.js'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          school: 'New York University',
          location: 'New York, NY',
          startDate: new Date('2015-09-01'),
          endDate: new Date('2019-05-31'),
          gpa: '3.8'
        }
      ]
    },
    preferences: {
      jobTypes: ['full-time'],
      locations: ['New York, NY', 'Remote'],
      salaryRange: { min: 80000, max: 120000 },
      remote: true
    }
  },
  {
    name: 'Sarah Designer',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    profile: {
      bio: 'Creative UI/UX designer passionate about user-centered design.',
      location: 'Los Angeles, CA',
      phone: '+1-555-0124',
      website: 'https://sarahdesigner.com',
      skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'],
      experience: [
        {
          title: 'UX Designer',
          company: 'Design Studio',
          location: 'Los Angeles, CA',
          startDate: new Date('2021-03-01'),
          current: true,
          description: 'Design user interfaces and experiences for mobile and web applications'
        }
      ]
    }
  }
];

const sampleJobs = [
  {
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    description: 'We are seeking a Senior Frontend Developer to join our growing team. You will be responsible for developing user-facing applications using modern JavaScript frameworks and ensuring excellent user experience.',
    requirements: [
      '5+ years of experience with React.js',
      'Strong knowledge of JavaScript ES6+',
      'Experience with TypeScript',
      'Familiarity with modern CSS frameworks',
      'Experience with REST API integration',
      'Knowledge of Git version control'
    ],
    responsibilities: [
      'Develop and maintain frontend applications',
      'Collaborate with design and backend teams',
      'Optimize applications for performance',
      'Write clean, maintainable code',
      'Participate in code reviews'
    ],
    benefits: [
      'Health insurance',
      '401k matching',
      'Flexible work hours',
      'Remote work options',
      'Professional development budget'
    ],
    location: 'San Francisco, CA',
    remote: true,
    type: 'full-time',
    level: 'senior',
    salary: {
      min: 120000,
      max: 160000,
      currency: 'USD',
      period: 'yearly'
    },
    skills: [
      { name: 'React', required: true, level: 'advanced' },
      { name: 'JavaScript', required: true, level: 'advanced' },
      { name: 'TypeScript', required: true, level: 'intermediate' },
      { name: 'CSS', required: true, level: 'intermediate' },
      { name: 'HTML', required: true, level: 'advanced' }
    ],
    category: 'technology',
    industry: 'Software',
    companySize: 'large',
    companyLogo: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    companyWebsite: 'https://techcorp.com',
    featured: true,
    tags: ['react', 'frontend', 'javascript', 'remote']
  },
  {
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    description: 'Join our innovative startup as a Full Stack Engineer. Work on cutting-edge projects using modern web technologies and help shape the future of our platform.',
    requirements: [
      'Experience with JavaScript/TypeScript',
      'Knowledge of React or Vue.js',
      'Backend experience with Node.js',
      'Database design and optimization',
      'API development and integration',
      'Agile development experience'
    ],
    responsibilities: [
      'Develop full-stack web applications',
      'Design and implement APIs',
      'Work with databases and data modeling',
      'Collaborate in an agile environment',
      'Contribute to technical decisions'
    ],
    benefits: [
      'Equity package',
      'Health insurance',
      'Learning budget',
      'Flexible PTO',
      'Startup environment'
    ],
    location: 'New York, NY',
    remote: false,
    type: 'full-time',
    level: 'mid',
    salary: {
      min: 95000,
      max: 130000,
      currency: 'USD',
      period: 'yearly'
    },
    skills: [
      { name: 'JavaScript', required: true, level: 'advanced' },
      { name: 'Node.js', required: true, level: 'intermediate' },
      { name: 'React', required: false, level: 'intermediate' },
      { name: 'MongoDB', required: false, level: 'beginner' }
    ],
    category: 'technology',
    industry: 'Startup',
    companySize: 'startup',
    companyLogo: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    tags: ['fullstack', 'startup', 'javascript', 'node.js']
  },
  {
    title: 'Python Developer',
    company: 'DataSolutions LLC',
    description: 'Looking for a Python Developer to work on data processing and analysis applications. Experience with machine learning is a plus.',
    requirements: [
      'Strong Python programming skills',
      'Experience with Django or Flask',
      'Knowledge of SQL databases',
      'Familiarity with data analysis libraries',
      'Version control with Git',
      'Problem-solving skills'
    ],
    responsibilities: [
      'Develop Python applications',
      'Work with data processing pipelines',
      'Implement web APIs',
      'Optimize database queries',
      'Write unit tests'
    ],
    benefits: [
      'Health & dental insurance',
      'Retirement plan',
      'Professional development',
      'Work from home options',
      'Conference attendance'
    ],
    location: 'Austin, TX',
    remote: true,
    type: 'full-time',
    level: 'mid',
    salary: {
      min: 105000,
      max: 140000,
      currency: 'USD',
      period: 'yearly'
    },
    skills: [
      { name: 'Python', required: true, level: 'advanced' },
      { name: 'Django', required: false, level: 'intermediate' },
      { name: 'SQL', required: true, level: 'intermediate' },
      { name: 'Machine Learning', required: false, level: 'beginner' }
    ],
    category: 'technology',
    industry: 'Data Analytics',
    companySize: 'medium',
    companyLogo: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    tags: ['python', 'data', 'backend', 'remote']
  },
  {
    title: 'Junior Software Developer',
    company: 'WebSolutions Co.',
    description: 'Great opportunity for a junior developer to grow their skills in a supportive environment. We work with modern web technologies and provide mentorship.',
    requirements: [
      'Basic knowledge of HTML/CSS/JavaScript',
      'Familiarity with React or similar framework',
      'Understanding of Git version control',
      'Problem-solving mindset',
      'Eagerness to learn',
      'Computer Science degree or equivalent'
    ],
    responsibilities: [
      'Assist in web application development',
      'Learn from senior developers',
      'Write and maintain code',
      'Participate in team meetings',
      'Contribute to testing efforts'
    ],
    benefits: [
      'Remote work flexibility',
      'Mentorship program',
      'Health insurance',
      'Career growth opportunities',
      'Learning resources'
    ],
    location: 'Remote',
    remote: true,
    type: 'full-time',
    level: 'junior',
    salary: {
      min: 65000,
      max: 85000,
      currency: 'USD',
      period: 'yearly'
    },
    skills: [
      { name: 'JavaScript', required: true, level: 'beginner' },
      { name: 'HTML', required: true, level: 'intermediate' },
      { name: 'CSS', required: true, level: 'intermediate' },
      { name: 'React', required: false, level: 'beginner' }
    ],
    category: 'technology',
    industry: 'Web Development',
    companySize: 'small',
    companyLogo: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    tags: ['junior', 'remote', 'mentorship', 'web-development']
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudTech Solutions',
    description: 'Seeking a DevOps Engineer to manage our cloud infrastructure and implement CI/CD pipelines. Experience with AWS and containerization required.',
    requirements: [
      'Experience with AWS or Azure',
      'Knowledge of Docker and Kubernetes',
      'CI/CD pipeline implementation',
      'Infrastructure as Code (Terraform)',
      'Monitoring and logging tools',
      'Linux system administration'
    ],
    responsibilities: [
      'Manage cloud infrastructure',
      'Implement CI/CD pipelines',
      'Monitor system performance',
      'Automate deployment processes',
      'Ensure security best practices'
    ],
    benefits: [
      'Stock options',
      'Comprehensive health benefits',
      'Conference attendance budget',
      'Flexible schedule',
      'Remote work options'
    ],
    location: 'Seattle, WA',
    remote: true,
    type: 'full-time',
    level: 'senior',
    salary: {
      min: 110000,
      max: 150000,
      currency: 'USD',
      period: 'yearly'
    },
    skills: [
      { name: 'AWS', required: true, level: 'advanced' },
      { name: 'Docker', required: true, level: 'intermediate' },
      { name: 'Kubernetes', required: true, level: 'intermediate' },
      { name: 'Terraform', required: false, level: 'intermediate' }
    ],
    category: 'technology',
    industry: 'Cloud Computing',
    companySize: 'large',
    companyLogo: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    tags: ['devops', 'aws', 'kubernetes', 'remote']
  },
  {
    title: 'UX/UI Designer',
    company: 'Design Studio Pro',
    description: 'Creative UX/UI Designer needed to join our design team. Work on exciting projects for various clients and help create amazing user experiences.',
    requirements: [
      'Portfolio demonstrating UX/UI skills',
      'Proficiency in Figma and Adobe Creative Suite',
      'Understanding of user-centered design principles',
      'Experience with prototyping tools',
      'Knowledge of web and mobile design patterns',
      'Strong communication skills'
    ],
    responsibilities: [
      'Create user interface designs',
      'Conduct user research and testing',
      'Develop wireframes and prototypes',
      'Collaborate with development teams',
      'Present design concepts to clients'
    ],
    benefits: [
      'Creative work environment',
      'Health insurance',
      'Professional development budget',
      'Flexible hours',
      'Modern design tools'
    ],
    location: 'Los Angeles, CA',
    remote: false,
    type: 'full-time',
    level: 'mid',
    salary: {
      min: 75000,
      max: 95000,
      currency: 'USD',
      period: 'yearly'
    },
    skills: [
      { name: 'Figma', required: true, level: 'advanced' },
      { name: 'Adobe Creative Suite', required: true, level: 'intermediate' },
      { name: 'Prototyping', required: true, level: 'intermediate' },
      { name: 'User Research', required: false, level: 'beginner' }
    ],
    category: 'design',
    industry: 'Design Agency',
    companySize: 'small',
    companyLogo: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    tags: ['design', 'ux', 'ui', 'figma']
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB Connected for seeding');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    logger.info('Cleared existing users');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      users.push({
        ...userData,
        password: hashedPassword,
        emailVerified: true,
        isActive: true
      });
    }

    const createdUsers = await User.insertMany(users);
    logger.info(`Created ${createdUsers.length} users`);
    
    return createdUsers;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};

// Seed jobs
const seedJobs = async (users) => {
  try {
    // Clear existing jobs
    await Job.deleteMany({});
    logger.info('Cleared existing jobs');

    // Find admin user to assign as job poster
    const adminUser = users.find(user => user.role === 'admin');
    
    // Create jobs
    const jobs = sampleJobs.map(jobData => ({
      ...jobData,
      postedBy: adminUser._id,
      status: 'active',
      views: Math.floor(Math.random() * 100) + 10,
      applications: Math.floor(Math.random() * 20),
      metadata: {
        aiProcessed: true,
        aiSkillsExtracted: jobData.skills.map(s => s.name),
        aiSummary: `AI-generated summary for ${jobData.title} position`
      }
    }));

    const createdJobs = await Job.insertMany(jobs);
    logger.info(`Created ${createdJobs.length} jobs`);
    
    return createdJobs;
  } catch (error) {
    logger.error('Error seeding jobs:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    logger.info('Starting database seeding...');
    
    const users = await seedUsers();
    const jobs = await seedJobs(users);
    
    logger.info('Database seeding completed successfully!');
    logger.info(`Created ${users.length} users and ${jobs.length} jobs`);
    
    // Log admin credentials
    logger.info('Admin credentials:');
    logger.info('Email: admin@jobai.com');
    logger.info('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleUsers, sampleJobs };