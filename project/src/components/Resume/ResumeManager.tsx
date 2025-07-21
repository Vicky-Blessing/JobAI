import React, { useState, useEffect } from 'react';
import { AIService } from '../../services/aiService';
import { Resume } from '../../types';
import { 
  Upload, 
  FileText, 
  Star, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

export const ResumeManager: React.FC = () => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadResume();
  }, []);

  const loadResume = () => {
    const storedResume = localStorage.getItem('resume');
    if (storedResume) {
      setResume(JSON.parse(storedResume));
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    uploadResume(file);
  };

  const uploadResume = async (file: File) => {
    setIsUploading(true);
    setIsAnalyzing(true);
    setError('');

    try {
      const analyzedResume = await AIService.analyzeResume(file);
      setResume(analyzedResume);
      localStorage.setItem('resume', JSON.stringify(analyzedResume));
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const ScoreCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string; description?: string }> = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    description 
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Resume Manager</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your resume for AI-powered analysis and job matching
        </p>
      </div>

      {!resume ? (
        /* Upload Section */
        <div className="max-w-2xl mx-auto">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {isAnalyzing ? 'Analyzing your resume...' : 'Uploading...'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our AI is extracting insights from your resume
                  </p>
                  <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs mx-auto">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Upload Your Resume
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supports PDF, DOC, and DOCX files up to 10MB
                  </p>
                </div>
                <label className="inline-block">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInputChange}
                  />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Choose File
                  </span>
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Resume Analysis Results */
        <div className="space-y-8">
          {/* Resume Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resume Analysis</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {resume.fileName} • Uploaded {new Date(resume.uploadDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(resume.score)} mb-1`}>
                  {resume.score}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overall Score</p>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full bg-gradient-to-r ${getScoreBgColor(resume.score)} transition-all duration-1000 ease-out shadow-lg`}
                  style={{ width: `${resume.score}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">AI Summary</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{resume.summary}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScoreCard
              title="Technical Skills"
              value={resume.skills.length}
              icon={Target}
              color="bg-blue-500"
              description="Identified skills"
            />
            <ScoreCard
              title="Experience"
              value={resume.experience.length}
              icon={TrendingUp}
              color="bg-green-500"
              description="Work experiences"
            />
            <ScoreCard
              title="Education"
              value={resume.education.length}
              icon={CheckCircle}
              color="bg-purple-500"
              description="Educational background"
            />
            <ScoreCard
              title="Feedback Points"
              value={resume.feedback.length + resume.improvements.length}
              icon={Star}
              color="bg-orange-500"
              description="AI insights"
            />
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skills */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Identified Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Experience
              </h3>
              <div className="space-y-3">
                {resume.experience.map((exp, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{exp}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Education
              </h3>
              <div className="space-y-3">
                {resume.education.map((edu, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{edu}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                AI Feedback
              </h3>
              <div className="space-y-3">
                {resume.feedback.map((feedback, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Improvements */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
              Suggested Improvements
            </h3>
            <div className="space-y-3">
              {resume.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{improvement}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setResume(null);
                localStorage.removeItem('resume');
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Upload className="w-5 h-5" />
              <span>Upload New Resume</span>
            </button>
            
            <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200">
              <Download className="w-5 h-5" />
              <span>Export Analysis</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};