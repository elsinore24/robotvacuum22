import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import slugify from 'slugify';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const HtmlUploader = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [metadata, setMetadata] = useState({
    title: '',
    slug: '',
    date: new Date().toISOString().split('T')[0],
    featuredImage: '',
    excerpt: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    if (selectedFile.type !== 'text/html' && !selectedFile.name.toLowerCase().endsWith('.html')) {
      setError('Please select a valid HTML file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const htmlContent = e.target?.result as string;

      // Convert HTML to Markdown
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced'
      });

      turndownService.addRule('images', {
        filter: 'img',
        replacement: (content, node) => {
          const alt = node.getAttribute('alt') || '';
          const src = node.getAttribute('src') || '';
          const title = node.getAttribute('title') ? ` "${node.getAttribute('title')}"` : '';
          return `![${alt}](${src}${title})`;
        }
      });

      const markdownContent = turndownService.turndown(htmlContent);
      setMarkdown(markdownContent);

      // Extract metadata
      const titleMatch = markdownContent.match(/^#\s*(.+)$/m);
      const excerptMatch = markdownContent.match(/^[^#\n]+/m);
      
      setMetadata(prev => ({
        ...prev,
        title: titleMatch ? titleMatch[1].trim() : '',
        slug: titleMatch ? slugify(titleMatch[1].toLowerCase()) : '',
        excerpt: excerptMatch ? excerptMatch[0].trim().slice(0, 200) : ''
      }));
    };

    reader.readAsText(selectedFile);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);

    try {
      // Validate inputs
      if (!metadata.title || !markdown) {
        throw new Error('Title and content are required');
      }

      // Generate slug
      const slug = slugify(metadata.title.toLowerCase());

      // Prepare payload
      const payload = {
        slug,
        title: metadata.title,
        date: metadata.date,
        excerpt: metadata.excerpt || markdown.slice(0, 200),
        featured_image: metadata.featuredImage || null,
        content: markdown,
        created_at: new Date().toISOString()
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(payload)
        .select();

      if (error) throw error;

      // Navigate to new post
      navigate(`/blog/${slug}`);

    } catch (err: any) {
      console.error('Deployment error:', err);
      setError(err.message || 'Failed to deploy blog post');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">HTML to Blog Post Converter</h2>
        
        <div className="mb-6">
          <input
            type="file"
            accept=".html"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            id="htmlUpload"
          />
          <div 
            onClick={triggerFileInput}
            className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition"
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {file ? file.name : 'Click to upload HTML file'}
            </p>
          </div>
        </div>

        {markdown && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({
                  ...prev,
                  title: e.target.value,
                  slug: slugify(e.target.value.toLowerCase())
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Markdown Content</label>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={10}
              />
            </div>

            {error && (
              <div className="mb-4 text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={handleDeploy}
              disabled={!metadata.title || !markdown || isDeploying}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isDeploying ? 'Deploying...' : 'Deploy Post'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default HtmlUploader;
