import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { updateMe, getMe } from '../../api/auth';
import UserAvatar from '../../shared/UserAvatar';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';

export default function ProfileEdit() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Only update if something changed
      if (!selectedFile && formData.username === user?.username) {
        throw new Error('No changes to save');
      }

      // Use FormData only when we have a file
      if (selectedFile) {
        const data = new FormData();
        data.append('avatar', selectedFile);
        if (formData.username !== user?.username) {
          data.append('username', formData.username);
        }
        await updateMe(data);
      } else if (formData.username !== user?.username) {
        // For username-only changes, send as JSON
        await updateMe({ username: formData.username });
      }

      const response = await getMe();
      return response.data;
    },
    onSuccess: (userData) => {
      const { refresh: refreshToken } = JSON.parse(localStorage.getItem('authTokens') || '{}');
      const token = localStorage.getItem('access_token');
      
      dispatch(login({
        user: userData,
        token: token || '',
        refreshToken: refreshToken || '',
      }));

      setSelectedFile(null);
      setAvatarPreview(null);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: any) => {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      console.error('Update failed:', error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, avatar: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    updateMutation.mutate();
  };

  return (
    <div className='w-full h-full flex flex-col rounded-[28px] bg-(--surface) p-8'>
      <h2 className='text-2xl font-semibold text-(--primary) mb-6'>Edit Profile</h2>

      {successMessage && (
        <div className='mb-4 p-3 rounded-[14px] bg-(--primary-faded) text-(--primary) text-sm font-medium'>
          ✓ {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        {/* Avatar Section */}
        <div className='flex flex-col items-center gap-4 p-6 rounded-[20px] bg-(--primary-faded)'>
          <button
            type='button'
            onClick={handleAvatarClick}
            className='relative group'
            title='Click to change avatar'
          >
            <UserAvatar
              avatar={resolveAvatarUrl(avatarPreview || user?.avatar || undefined)}
              inputSize={100}
              username={user?.username}
            />
            <div className='absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold'>
              Change
            </div>
          </button>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            className='hidden'
            aria-label='Upload avatar'
          />
          {errors.avatar && <span className='text-red-500 text-sm font-medium'>{errors.avatar}</span>}
        </div>
        <div className='flex flex-col gap-4 px-20'>
            {/* Username Field */}
            <div className='flex flex-col gap-2'>
            <label htmlFor='username' className='text-sm font-semibold text-(--primary) uppercase tracking-wide'>
                Username
            </label>
            <input
                id='username'
                type='text'
                name='username'
                value={formData.username}
                onChange={handleInputChange}
                className={`px-4 py-3 rounded-[14px] border-2 bg-white text-(--primary) placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-(--primary-faded) ${
                errors.username ? 'border-red-500 bg-red-50' : 'border-(--border) focus:border-(--primary)'
                }`}
                placeholder='Enter your username'
            />
            {errors.username && <span className='text-red-500 text-sm font-medium'>{errors.username}</span>}
            </div>

            {/* Email Field (Read-only) */}
            <div className='flex flex-col gap-2'>
            <label htmlFor='email' className='text-sm font-semibold text-(--primary) uppercase tracking-wide'>
                Email
            </label>
            <input
                id='email'
                type='email'
                value={user?.email || ''}
                disabled
                className='px-4 py-3 rounded-[14px] border-2 border-(--border) bg-gray-100 text-gray-600 cursor-not-allowed'
            />
            <small className='text-xs text-gray-500 italic'>Email cannot be changed</small>
            </div>

            {/* Submit Button */}
            <div className='w-full flex justify-center'>
            <button
            type='submit'
            disabled={updateMutation.isPending}
            className='mt-4 px-6 py-3 rounded-[14px] bg-(--primary) text-white font-semibold uppercase tracking-wide transition hover:bg-(--secondary) disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]'
            >
            {updateMutation.isPending ? (
                <>
                <span className='border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin'></span>
                Saving...
                </>
            ) : (
                'Save Changes'
            )}
            </button>
            </div>
        </div>
        </form>
    </div>
  );
}