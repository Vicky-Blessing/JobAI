# JobAI Backend API

A comprehensive backend API for the JobAI platform - an AI-powered job matching system that connects job seekers with relevant opportunities through intelligent resume analysis and job matching algorithms.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Resume Processing** - AI-powered resume analysis with text extraction from PDF/DOC files
- **Job Management** - Complete CRUD operations for job listings with advanced search
- **Application System** - Job application workflow with status tracking
- **AI Integration** - OpenAI integration for resume analysis and job matching
- **Admin Dashboard** - Comprehensive admin panel with analytics and bulk operations

### Technical Features
- **RESTful API** - Well-structured REST endpoints with proper HTTP methods
- **Database Integration** - MongoDB with Mongoose ODM for data modeling
- **File Upload** - Secure file handling with validation and storage
- **Rate Limiting** - Protection against abuse with configurable limits
- **Logging** - Comprehensive logging with Winston for monitoring
- **Validation** - Input validation with express-validator
- **Error Handling** - Centralized error handling with detailed responses
- **Security** - Helmet, CORS, and other security best practices

## 🛠️ Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Multer, PDF-Parse, Mammoth
- **AI Integration**: OpenAI API
- **Validation**: Express-validator
- **Security**: Helmet, bcryptjs, CORS
- **Logging**: Winston
- **Development**: Nodemon, Jest (testing)

## 📋 Prerequisites

- Node.js 16.0 or higher
- MongoDB 4.4 or higher
- OpenAI API key (optional, fallback available)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jobai-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/jobai
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   OPENAI_API_KEY=your-openai-api-key-here
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Job Endpoints

#### Get All Jobs
```http
GET /api/jobs?q=developer&location=remote&type=full-time&page=1&limit=20
```

#### Get Single Job
```http
GET /api/jobs/:id
```

#### Create Job (Admin only)
```http
POST /api/jobs
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Senior Developer",
  "company": "TechCorp",
  "description": "Job description...",
  "requirements": ["React", "Node.js"],
  "benefits": ["Health insurance", "Remote work"],
  "location": "San Francisco, CA",
  "type": "full-time",
  "category": "technology",
  "salary": {
    "min": 100000,
    "max": 150000,
    "currency": "USD",
    "period": "yearly"
  }
}
```

### Resume Endpoints

#### Upload Resume
```http
POST /api/resumes
Authorization: Bearer <token>
Content-Type: multipart/form-data

resume: <file>
```

#### Get User Resumes
```http
GET /api/resumes
Authorization: Bearer <token>
```

#### Get Resume Analysis
```http
GET /api/resumes/:id
Authorization: Bearer <token>
```

### Application Endpoints

#### Apply for Job
```http
POST /api/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job-id-here",
  "coverLetter": "Cover letter text...",
  "customAnswers": [
    {
      "question": "Why do you want this job?",
      "answer": "Because..."
    }
  ]
}
```

#### Get User Applications
```http
GET /api/applications?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

### User Profile Endpoints

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "profile": {
    "bio": "Updated bio...",
    "location": "New York, NY",
    "skills": ["JavaScript", "React", "Node.js"]
  }
}
```

#### Upload Avatar
```http
POST /api/users/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <image-file>
```

### Admin Endpoints

#### Get Dashboard Stats
```http
GET /api/admin/dashboard
Authorization: Bearer <admin-token>
```

#### Get Analytics
```http
GET /api/admin/analytics?period=30d
Authorization: Bearer <admin-token>
```

#### Bulk Operations
```http
POST /api/admin/bulk/activate-users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "ids": ["user-id-1", "user-id-2"]
}
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'admin',
  avatar: String,
  profile: {
    phone: String,
    location: String,
    bio: String,
    skills: [String],
    experience: [ExperienceSchema],
    education: [EducationSchema]
  },
  preferences: {
    jobTypes: [String],
    locations: [String],
    salaryRange: { min: Number, max: Number },
    remote: Boolean
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Job Model
```javascript
{
  title: String,
  company: String,
  description: String,
  requirements: [String],
  benefits: [String],
  location: String,
  remote: Boolean,
  type: 'full-time' | 'part-time' | 'contract' | 'internship',
  level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead',
  salary: {
    min: Number,
    max: Number,
    currency: String,
    period: 'hourly' | 'monthly' | 'yearly'
  },
  skills: [{
    name: String,
    required: Boolean,
    level: 'beginner' | 'intermediate' | 'advanced'
  }],
  category: String,
  status: 'active' | 'paused' | 'closed',
  featured: Boolean,
  views: Number,
  applications: Number,
  postedBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Resume Model
```javascript
{
  user: ObjectId (User),
  fileName: String,
  filePath: String,
  extractedText: String,
  analysis: {
    summary: String,
    skills: [SkillSchema],
    experience: [ExperienceSchema],
    education: [EducationSchema]
  },
  aiAnalysis: {
    overallScore: Number,
    scores: {
      formatting: Number,
      content: Number,
      skills: Number,
      experience: Number
    },
    strengths: [String],
    weaknesses: [String],
    improvements: [String],
    feedback: [String]
  },
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed',
  createdAt: Date,
  updatedAt: Date
}
```

### Application Model
```javascript
{
  user: ObjectId (User),
  job: ObjectId (Job),
  resume: ObjectId (Resume),
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'offer' | 'rejected',
  coverLetter: String,
  matchScore: Number,
  appliedAt: Date,
  statusHistory: [StatusHistorySchema],
  interviews: [InterviewSchema],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/jobai |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `MAX_FILE_SIZE` | Max upload file size | 10485760 (10MB) |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | 15 |
| `RATE_LIMIT_MAX` | Max requests per window | 100 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

### File Upload Configuration

- **Resume files**: PDF, DOC, DOCX up to 10MB
- **Avatar images**: JPEG, PNG, GIF up to 2MB
- **Storage**: Local filesystem in `uploads/` directory
- **Processing**: Automatic text extraction and AI analysis

### AI Service Configuration

The system supports OpenAI integration for advanced resume analysis:

- **Model**: GPT-3.5-turbo (configurable)
- **Fallback**: Local analysis when API unavailable
- **Features**: Resume scoring, skill extraction, job matching
- **Rate limiting**: Automatic retry with exponential backoff

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/
│   ├── auth.test.js
│   ├── jobs.test.js
│   └── resumes.test.js
└── fixtures/
    ├── users.js
    └── jobs.js
```

## 📊 Monitoring & Logging

### Logging Levels
- **Error**: System errors, failed operations
- **Warn**: Non-critical issues, deprecated usage
- **Info**: General information, user actions
- **Debug**: Detailed debugging information

### Log Files
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs
- Console output in development mode

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-production-secret
   ```

2. **Build and Start**
   ```bash
   npm install --production
   npm start
   ```

3. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/server.js --name jobai-api
   pm2 startup
   pm2 save
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t jobai-backend .
docker run -p 5000:5000 --env-file .env jobai-backend
```

### Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI and login
heroku create jobai-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```

#### AWS EC2
1. Launch EC2 instance with Node.js
2. Install dependencies and clone repository
3. Configure environment variables
4. Set up reverse proxy with Nginx
5. Configure SSL with Let's Encrypt

## 🔒 Security

### Authentication & Authorization
- JWT tokens with configurable expiration
- Role-based access control (user/admin)
- Password hashing with bcrypt (12 rounds)
- Rate limiting on sensitive endpoints

### Data Protection
- Input validation and sanitization
- SQL injection prevention with Mongoose
- XSS protection with Helmet
- CORS configuration for frontend integration
- File upload validation and size limits

### Best Practices
- Environment variable configuration
- Secure HTTP headers with Helmet
- Request logging for audit trails
- Error handling without information leakage
- Regular dependency updates

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure all tests pass

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "count": 10,
  "total": 100,
  "pagination": {
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/jobai
```

#### File Upload Errors
```bash
# Check upload directory permissions
chmod 755 uploads/
mkdir -p uploads/resumes uploads/avatars

# Check file size limits in .env
MAX_FILE_SIZE=10485760
```

#### JWT Token Issues
```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check token expiration
JWT_EXPIRE=7d
```

#### OpenAI API Errors
- Verify API key is valid
- Check rate limits and quotas
- Fallback analysis will be used if API fails

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoints and examples

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Node.js, Express, and MongoDB**