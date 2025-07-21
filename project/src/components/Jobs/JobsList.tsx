import React, { useState, useEffect } from 'react';
import { JobService } from '../../services/jobService';
import { AIService } from '../../services/aiService';
import { Job, Resume } from '../../types';
import { Modal } from '../Layout/Modal';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Star, 
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  Building,
  Clock,
  Zap,
  Target,
  Send,
  CheckCircle
} from 'lucide-react';

interface JobsListProps {
  initialData?: { selectedJob?: Job };
}

export const JobsList: React.FC<JobsListProps> = ({ initialData }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(initialData?.selectedJob || null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(!!initialData?.selectedJob);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    location: '',
    minMatchScore: 0
  });
  const [isApplying, setIsApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
    loadResume();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, filters]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const jobsData = await JobService.getAllJobs();
      
      const resumeData = localStorage.getItem('resume');
      if (resumeData) {
        const resume = JSON.parse(resumeData);
        const matchedJobs = await AIService.matchJobs(resume, jobsData);
        setJobs(matchedJobs);
      } else {
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadResume = () => {
    const resumeData = localStorage.getItem('resume');
    if (resumeData) {
      setResume(JSON.parse(resumeData));
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (filters.search) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.company.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.location.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(job => job.type === filters.type);
    }

    if (filters.location) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.minMatchScore > 0) {
      filtered = filtered.filter(job => (job.matchScore || 0) >= filters.minMatchScore);
    }

    // Sort by match score (highest first), then by date
    filtered.sort((a, b) => {
      const scoreA = a.matchScore || 0;
      const scoreB = b.matchScore || 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });

    setFilteredJobs(filtered);
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
    setApplicationStatus(null);
  };

  const handleScrapeJobs = async () => {
    setIsLoading(true);
    try {
      const newJobs = await JobService.scrapeJobs();
      
      if (resume) {
        const matchedJobs = await AIService.matchJobs(resume, newJobs);
        setJobs(matchedJobs);
      } else {
        setJobs(newJobs);
      }
    } catch (error) {
      console.error('Error scraping jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    
    setIsApplying(true);
    try {
      // Simulate application process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setApplicationStatus('success');
      
      // Store application locally
      const applications = JSON.parse(localStorage.getItem('applications') || '[]');
      applications.push({
        id: `app-${Date.now()}`,
        jobId: selectedJob.id,
        appliedAt: new Date().toISOString(),
        status: 'pending'
      });
      localStorage.setItem('applications', JSON.stringify(applications));
      
    } catch (error) {
      console.error('Application error:', error);
      setApplicationStatus('error');
    } finally {
      setIsApplying(false);
    }
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  };

  const JobCard: React.FC<{ job: Job }> = ({ job }) => (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-100 dark:border-gray-700 p-6 cursor-pointer transition-all duration-200 transform hover:-translate-y-1"
      onClick={() => handleJobClick(job)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img 
            src={job.logo || 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=48&h=48'} 
            alt={job.company} 
            className="w-12 h-12 rounded-lg object-cover shadow-md"
          />
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{job.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">{job.company}</p>
          </div>
        </div>
        {job.matchScore && (
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchScoreColor(job.matchScore)} flex items-center`}>
            <Star className="w-3 h-3 mr-1" />
            {job.matchScore}%
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
          <MapPin className="w-4 h-4 mr-2" />
          {job.location}
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
          <DollarSign className="w-4 h-4 mr-2" />
          {job.salary}
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(job.postedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            job.type === 'full-time' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
            job.type === 'part-time' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
            job.type === 'contract' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
            'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
          }`}>
            {job.type}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            job.source === 'linkedin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
            job.source === 'indeed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {job.source}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-1" />
          {Math.floor(Math.random() * 7) + 1}d ago
        </div>
      </div>

      {job.matchedSkills && job.matchedSkills.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {job.matchedSkills.slice(0, 3).map((skill, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md font-medium">
                {skill}
              </span>
            ))}
            {job.matchedSkills.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
                +{job.matchedSkills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Job Opportunities</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredJobs.length} jobs found {resume && '• AI-matched based on your resume'}
          </p>
        </div>
        <button
          onClick={handleScrapeJobs}
          disabled={isLoading}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:scale-100 shadow-lg hover:shadow-xl"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Scraping...' : 'Refresh Jobs'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Job title, company..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, state..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Match Score
            </label>
            <select
              value={filters.minMatchScore}
              onChange={(e) => setFilters(prev => ({ ...prev, minMatchScore: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={0}>Any Score</option>
              <option value={60}>60% or higher</option>
              <option value={70}>70% or higher</option>
              <option value={80}>80% or higher</option>
              <option value={90}>90% or higher</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading job opportunities...</p>
          </div>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No jobs found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your filters or refresh to get new opportunities
          </p>
          <button
            onClick={handleScrapeJobs}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Refresh Jobs
          </button>
        </div>
      )}

      {/* Job Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedJob?.title || ''}
        size="xl"
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Job Header */}
            <div className="flex items-center space-x-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <img 
                src={selectedJob.logo || 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=64&h=64'} 
                alt={selectedJob.company} 
                className="w-16 h-16 rounded-lg object-cover shadow-lg"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {selectedJob.title}
                </h2>
                <div className="flex items-center text-gray-600 dark:text-gray-400 space-x-4">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {selectedJob.company}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedJob.location}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {selectedJob.salary}
                  </div>
                </div>
              </div>
              {selectedJob.matchScore && (
                <div className={`px-4 py-2 rounded-xl text-lg font-bold ${getMatchScoreColor(selectedJob.matchScore)} flex items-center`}>
                  <Star className="w-4 h-4 mr-2" />
                  {selectedJob.matchScore}% Match
                </div>
              )}
            </div>

            {/* AI Analysis */}
            {resume && selectedJob.matchScore && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center mb-4">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Match Analysis</h3>
                </div>
                
                {selectedJob.matchedSkills && selectedJob.matchedSkills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Matched Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.matchedSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.relevanceReasons && selectedJob.relevanceReasons.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Why This Job Matches:</h4>
                    <ul className="space-y-1">
                      {selectedJob.relevanceReasons.map((reason, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                          <Target className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Job Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Job Description</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index} className="flex items-start text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Benefits & Perks</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedJob.benefits.map((benefit, index) => (
                  <span key={index} className="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium text-center">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              {applicationStatus === 'success' ? (
                <div className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-6 py-3 rounded-xl font-semibold text-center flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Application Submitted Successfully!
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:scale-100"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Apply Now</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => window.open(`https://${selectedJob.source}.com`, '_blank')}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200"
              >
                <ExternalLink className="w-5 h-5" />
                <span>View on {selectedJob.source}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};