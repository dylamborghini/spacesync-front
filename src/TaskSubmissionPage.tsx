import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from './services/api';

interface Task {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  code: string;
  fileName?: string;
  estimatedCompletionTime?: string;
  result?: any;
  createdAt: string;
}

interface PhoneStatus {
  availablePhones: number;
  busyPhones: number;
  averageProcessingTime?: number; // in milliseconds
}

const TaskSubmissionPage: React.FC = () => {
  const { userToken, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB file size limit

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch phone status and user tasks
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStatusAndTasks = async () => {
      try {
        // Fetch phone network status using REST API
        const statusData = await apiService.getStatus();
        setPhoneStatus(statusData);
        
        // Fetch user's tasks using REST API
        const tasksData = await apiService.getTasks();
        setUserTasks(tasksData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to connect to the service. Please try again later.');
      }
    };
    
    fetchStatusAndTasks();
    
    // Set up polling for updates every 10s
    const intervalId = setInterval(fetchStatusAndTasks, 10000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, logout, navigate]);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the maximum limit of ${MAX_FILE_SIZE/1024/1024}MB`);
      return;
    }
    
    // Check if it's a JavaScript file or other allowed formats
    const allowedTypes = ['text/javascript', 'application/javascript', 'application/json', 'text/plain'];
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.js')) {
      setError('Please upload a JavaScript file (.js) or JSON data file');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  // Submit task to the API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim() && !file) {
      setError('Please provide JavaScript code or attach a file');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use REST API instead of mock
      const taskData = await apiService.submitTask(code, file);
      
      setUserTasks(prev => [taskData, ...prev]);
      
      // Clear form after successful submission
      setCode('');
      setFile(null);
      
      // Optional: scroll to tasks list to see the new task
      document.getElementById('tasks-list')?.scrollIntoView({ behavior: 'smooth' });
      
    } catch (err: any) {
      console.error('Error submitting task:', err);
      setError(err.message || 'Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format the estimated time in a user-friendly way
  const formatEstimatedTime = (task: Task) => {
    if (!task.estimatedCompletionTime) return 'Unknown';
    
    const estimatedDate = new Date(task.estimatedCompletionTime);
    const now = new Date();
    
    if (estimatedDate < now) {
      return 'Processing is taking longer than expected';
    }
    
    const diffMs = estimatedDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Less than a minute';
    if (diffMins === 1) return '1 minute';
    if (diffMins < 60) return `${diffMins} minutes`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : ''}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container mx-auto px-8 py-8 max-w-4xl">
      <div className="flex flex-col items-center mb-6">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Logout
        </button>
        <h1 className="text-3xl font-bold">SpaceSync-Cloud</h1>
      </div>
      
      {/* Phone Network Status */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Network Status</h2>
        {phoneStatus ? (
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-gray-700">Available Phones</p>
              <p className="text-2xl font-bold text-green-600">{phoneStatus.availablePhones}</p>
            </div>
            <div>
              <p className="text-gray-700">Busy Phones</p>
              <p className="text-2xl font-bold text-blue-600">{phoneStatus.busyPhones}</p>
            </div>
            {phoneStatus.averageProcessingTime && (
              <div>
                <p className="text-gray-700">Avg. Processing Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(phoneStatus.averageProcessingTime / 1000)}s
                </p>
              </div>
            )}
          </div>
        ) : (
          <p>Loading status...</p>
        )}
      </div>
      
      {/* Task Submission Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Submit JavaScript Task</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="code" className="block text-gray-700 mb-2">
              JavaScript Code
            </label>
            <textarea
              id="code"
              className="w-full h-64 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Enter your JavaScript code here&#10;function compute() {&#10;  // Your computation logic&#10;  return result;&#10;}"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="file" className="block text-gray-700 mb-2">
              Or Upload JavaScript File (Max 5MB)
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className="w-full text-gray-700 border rounded-lg focus:outline-none p-2"
              accept=".js,.json,.txt"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Task'}
          </button>
        </form>
      </div>
      
      {/* Tasks List */}
      <div id="tasks-list" className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
        
        {userTasks.length === 0 ? (
          <p className="text-gray-500">No tasks submitted yet</p>
        ) : (
          <div className="space-y-4">
            {userTasks.map(task => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Task #{task.id.substring(0, 8)}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'failed' ? 'bg-red-100 text-red-800' :
                    task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700">
                  <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                  {task.fileName && <p>File: {task.fileName}</p>}
                  {task.status === 'processing' && task.estimatedCompletionTime && (
                    <p>Estimated completion: {formatEstimatedTime(task)}</p>
                  )}
                </div>
                
                {task.status === 'completed' && task.result && (
                  <div className="mt-2">
                    <h4 className="font-medium mb-1">Result:</h4>
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-sm">
                      {typeof task.result === 'object' 
                        ? JSON.stringify(task.result, null, 2) 
                        : task.result.toString()}
                    </pre>
                  </div>
                )}
                
                {task.status === 'failed' && (
                  <div className="mt-2 text-red-600">
                    <p>Error: {task.result?.error || 'Task execution failed'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSubmissionPage;