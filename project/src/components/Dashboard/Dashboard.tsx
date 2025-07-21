import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { JobService } from '../../services/jobService';
import { Job, Resume } from '../../types';
import { 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Target, 
  Star,
  Clock,
  MapPin,
  Building,
  DollarSign
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    matchedJobs: 0,
    applications: 0,
    avgMatchScore: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const jobsData = await JobService.getAllJobs();
      setJobs(jobsData.slice(0, 5)); // Show top 5 for dashboard

      const resumeData = localStorage.getItem('resume');
      if (resumeData) {
        setResume(JSON.parse(resumeData));
      }

      // Calculate stats
      const matchedJobs = jobsData.filter(job => (job.matchScore || 0) > 60);
      const avgScore = jobsData.reduce((sum, job) => sum + (job.matchScore || 0), 0) / jobsData.length || 0;

      setStats({
        totalJobs: jobsData.length,
        matchedJobs: matchedJobs.length,
        applications: Math.floor(Math.random() * 5) + 1, // Mock applications
        avgMatchScore: Math.round(avgScore)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    change?: string;
  }> = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const JobCard: React.FC<{ job: Job }> = ({ job }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer"
         onClick={() => onNavigate('jobs', { selectedJob: job })}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img 
            src={job.logo || 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=40&h=40'} 
            alt={job.company} 
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{job.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs">{job.company}</p>
          </div>
        </div>
        {job.matchScore && (
          <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
            <Star className="w-3 h-3 mr-1" />
            {job.matchScore}%
          </div>
        )}
      </div>
      
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
        <div className="flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          {job.location}
        </div>
        <div className="flex items-center">
          <DollarSign className="w-3 h-3 mr-1" />
          {job.salary}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your job search overview and recommendations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={Briefcase}
          color="bg-blue-500"
          change="+12 this week"
        />
        <StatCard
          title="Matched Jobs"
          value={stats.matchedJobs}
          icon={Target}
          color="bg-green-500"
          change="+5 new matches"
        />
        <StatCard
          title="Applications"
          value={stats.applications}
          icon={FileText}
          color="bg-purple-500"
          change="2 pending"
        />
        <StatCard
          title="Avg Match Score"
          value={`${stats.avgMatchScore}%`}
          icon={TrendingUp}
          color="bg-orange-500"
          change="+3% this month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Matched Jobs */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Top Job Matches
                </h2>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {jobs.length > 0 ? (
                jobs.map(job => <JobCard key={job.id} job={job} />)
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No jobs found</p>
                  <button
                    onClick={() => onNavigate('jobs')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse Jobs
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resume Status & Quick Actions */}
        <div className="space-y-6">
          {/* Resume Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resume Status
            </h3>
            {resume ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{resume.score}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${resume.score}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last updated: {new Date(resume.uploadDate).toLocaleDateString()}
                </p>
                <button
                  onClick={() => onNavigate('resume')}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  View Details
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-3">No resume uploaded</p>
                <button
                  onClick={() => onNavigate('resume')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  Upload Resume
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('jobs')}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
              >
                <Briefcase className="w-4 h-4" />
                <span>Browse Jobs</span>
              </button>
              <button
                onClick={() => onNavigate('resume')}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                <span>Manage Resume</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Resume analyzed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">New job matches found</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};