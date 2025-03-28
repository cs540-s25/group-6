import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const PostViewingPage = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await fetch(`/api/posts/${postId}`);
                if (!response.ok) {
                    throw new Error('Post not found');
                }
                const data = await response.json();

                // Process expiration date
                const expirationDate = new Date(data.expiration_date);
                const timeLeft = formatDistanceToNow(expirationDate, { addSuffix: true });

                setPost({
                    ...data,
                    timeLeft,
                    createdAgo: formatDistanceToNow(new Date(data.created_at), { addSuffix: true })
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    if (isLoading) {
        return <div className="text-center p-8">Loading post...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <div className="text-red-500 mb-4">{error}</div>
                <Link to="/home" className="text-blue-500 hover:underline">
                    Return to main page
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="mb-4">
                <Link to="/home" className="text-blue-500 hover:underline">
                    &larr; Back to posts
                </Link>
            </div>

            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center gap-2 mb-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {post.post_type}
                    </span>
                    <span className="text-gray-500">
                        Posted by {post.author} • {post.createdAgo}
                    </span>
                </div>

                <p className="mb-6 text-gray-700 whitespace-pre-wrap">{post.content}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded">
                        <label className="text-gray-600 block mb-1">Quantity Available</label>
                        <p className="font-medium text-lg">{post.quantity}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                        <label className="text-gray-600 block mb-1">Expiration</label>
                        <p className="font-medium text-lg">{post.timeLeft}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition">
                        I want to take!
                    </button>
                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded transition">
                        Send Message
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostViewingPage;