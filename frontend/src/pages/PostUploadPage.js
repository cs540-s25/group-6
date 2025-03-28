import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PostUploadPage = () => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        post_type: 'Fruit',
        quantity: 1,
        expiration_days: 3
    });

    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.token}`
                },
                body: JSON.stringify({
                    ...formData,
                    expiration_days: parseInt(formData.expiration_days)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create post');
            }

            const createdPost = await response.json();
            navigate(`/posts/${createdPost.id}`);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Create New Post</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2">Title</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2">Description</label>
                    <textarea
                        className="w-full p-2 border rounded h-32"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2">Category</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={formData.post_type}
                        onChange={(e) => setFormData({ ...formData, post_type: e.target.value })}
                    >
                        <option>Fruit</option>
                        <option>Vegetable</option>
                        <option>Dairy</option>
                        <option>Bakery</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-2">Quantity</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        min="1"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2">Expires in (days)</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={formData.expiration_days}
                        onChange={(e) => setFormData({ ...formData, expiration_days: e.target.value })}
                        min="1"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                >
                    Submit Post
                </button>
            </form>
        </div>
    );
};

export default PostUploadPage;