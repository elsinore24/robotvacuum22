import React, { useState, useEffect } from 'react';
import { 
  Upload as UploadIcon, 
  FileText, 
  Trash2, 
  Edit, 
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import SignIn from '../components/SignIn';
import AdminUploader from '../components/AdminUploader';
import ErrorLog from '../components/ErrorLog';
import HtmlUploader from '../components/HtmlUploader';
import ConnectionTest from '../components/ConnectionTest';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  featured_image?: string;
  created_at: string;
}

interface ErrorLogEntry { 
  message: string;
  type: 'info' | 'error' | 'warning';
  timestamp: string;
  context?: Record<string, any>;
}

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  
  const [showSection, setShowSection] = useState<
    'deals' | 
    'uploader' | 
    'logs' | 
    'htmlUpload' | 
    'blogManagement' |
    'connectionTest'
  >('blogManagement');
  
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Fetch blog posts
  const fetchBlogPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (err: any) {
      console.error('Error fetching blog posts:', err);
      addLogEntry(`Failed to fetch blog posts: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchBlogPosts();
    }
  }, [isAuthenticated]);

  // Add log entry
  const addLogEntry = (message: string, type: 'info' | 'error' | 'warning' = 'info', context?: Record<string, any>) => {
    setErrorLogs(prev => [{
      message,
      type,
      timestamp: new Date().toISOString(),
      context
    }, ...prev]);
  };

  // Delete blog post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Remove from local state
      setBlogPosts(prev => prev.filter(post => post.id !== postId));
      
      addLogEntry(`Blog post deleted successfully`, 'info');
    } catch (err: any) {
      console.error('Error deleting blog post:', err);
      addLogEntry(`Failed to delete blog post: ${err.message}`, 'error');
    }
  };

  // Edit blog post (placeholder)
  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    alert('Edit functionality coming soon!');
  };

  // Clear logs
  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      setErrorLogs([]);
      addLogEntry('Logs cleared', 'info');
    }
  };

  if (!isAuthenticated) {
    return <SignIn onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="space-x-2 flex items-center">
              {/* Dashboard Navigation Buttons */}
              <button
                onClick={() => setShowSection('deals')}
                className={`px-4 py-2 rounded transition-colors ${
                  showSection === 'deals' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Deals
              </button>
              <button
                onClick={() => setShowSection('uploader')}
                className={`px-4 py-2 rounded transition-colors ${
                  showSection === 'uploader' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Plus className="h-4 w-4 inline-block mr-1" />
                Upload
              </button>
              <button
                onClick={() => setShowSection('htmlUpload')}
                className={`px-4 py-2 rounded transition-colors ${
                  showSection === 'htmlUpload' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 inline-block mr-1" />
                HTML Upload
              </button>
              <button
                onClick={() => setShowSection('blogManagement')}
                className={`px-4 py-2 rounded transition-colors ${
                  showSection === 'blogManagement' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Blog Posts
              </button>
              <button
                onClick={() => setShowSection('connectionTest')}
                className={`px-4 py-2 rounded transition-colors ${
                  showSection === 'connectionTest' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Connection Test
              </button>
              <button
                onClick={() => setShowSection('logs')}
                className={`px-4 py-2 rounded transition-colors ${
                  showSection === 'logs' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Logs
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_authenticated');
                  setIsAuthenticated(false);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Blog Post Management Section */}
          {showSection === 'blogManagement' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Manage Blog Posts</h2>
                <button
                  onClick={fetchBlogPosts}
                  className="flex items-center text-sm text-gray-600 hover:text-blue-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-4">Loading blog posts...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Title</th>
                        <th className="px-4 py-2 text-left">Slug</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogPosts.map((post) => (
                        <tr key={post.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              {post.featured_image && (
                                <img 
                                  src={post.featured_image} 
                                  alt={post.title} 
                                  className="w-10 h-10 object-cover rounded mr-3"
                                />
                              )}
                              <span className="font-medium">{post.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">{post.slug}</td>
                          <td className="px-4 py-2">
                            {new Date(post.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditPost(post)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Other Sections */}
          {showSection === 'deals' && (
            <div className="text-center text-gray-500 py-8">
              Deals section coming soon
            </div>
          )}

          {showSection === 'uploader' && (
            <AdminUploader 
              affiliateId="ndmlabs-20"
              onUploadSuccess={(message) => addLogEntry(message, 'info')}
              onError={(error) => addLogEntry(error, 'error')}
            />
          )}

          {showSection === 'htmlUpload' && (
            <div className="max-w-4xl mx-auto">
              <HtmlUploader />
            </div>
          )}

          {showSection === 'connectionTest' && (
            <ConnectionTest />
          )}

          {showSection === 'logs' && (
            <ErrorLog
              logs={errorLogs}
              onClear={clearLogs}
              onRefresh={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
