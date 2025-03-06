import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../utils/markdown';

interface Props {
  posts: BlogPost[];
}

export default function BlogList({ posts }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Robot Vacuum Guides & Reviews
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map(post => (
          <article 
            key={post.slug}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
          >
            {post.featuredImage && (
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
            )}
            
            <div className="p-6 flex-grow flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {post.title}
              </h2>
              
              <time 
                dateTime={post.date}
                className="text-sm text-gray-500 mb-4 block"
              >
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              
              <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
                {post.excerpt}
              </p>
              
              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mt-auto"
              >
                Read More
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
