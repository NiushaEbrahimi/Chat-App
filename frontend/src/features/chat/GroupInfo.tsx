import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import UserAvatar from '../../shared/UserAvatar';
import { useDispatch, useSelector } from 'react-redux';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import type { RootState } from '../../store';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { closePanel } from '../../store/slices/uiSlice';
import { useAuth } from '../../hooks/useAuth';
import { updateRoom, deleteRoom } from '../../api/chat';
import { setActiveRoom } from '../../store/slices/chatSlice';
import AddMemberModal from './components/AddMemberModal';

export default function GroupInfo() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const activeRoom = useSelector((s: RootState) => s.chat.activeRoom);

  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(activeRoom.meta?.name ?? 'Unnamed Group');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const members = activeRoom.meta?.members ?? [];
  const groupAvatar = resolveAvatarUrl(avatarPreview ?? activeRoom.meta?.avatar_url ?? undefined);
  const originalName = activeRoom.meta?.name ?? 'Unnamed Group';

  const isCreator = members.length > 0 && members[0].id === user?.id;

  const updateMutation = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      if (selectedFile) {
        data.append('avatar', selectedFile);
      }
      if (groupName !== originalName) {
        data.append('name', groupName);
      }
      await updateRoom(activeRoom.roomId!, data);
    },
    onSuccess: () => {
      setSuccessMessage('Group updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditing(false);
      setSelectedFile(null);
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: any) => {
      console.error('Update failed:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoom(activeRoom.roomId!),
    onSuccess: () => {
      dispatch(setActiveRoom({ roomId: null, roomType: 'user' }));
      dispatch(closePanel());
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: any) => {
      console.error('Delete failed:', error);
    },
  });

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
    }
  };

  const handleSave = () => {
    updateMutation.mutate();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setGroupName(originalName);
    setSelectedFile(null);
    setAvatarPreview(null);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className='w-full h-full flex flex-col rounded-[28px] bg-(--surface) p-8 overflow-y-auto'>
      <div className='flex items-center mb-6 text-(--primary)'>
        <ArrowLeft className='mr-2 cursor-pointer' onClick={() => dispatch(closePanel())} />
        <h2 className='text-2xl font-semibold'>Group Info</h2>
      </div>

      {successMessage && (
        <div className='mb-4 p-3 rounded-[14px] bg-green-100 text-green-700 text-sm font-medium'>
          {successMessage}
        </div>
      )}

      <div className='flex flex-col items-center gap-4 mb-8'>
        <div className='relative group'>
          <UserAvatar avatar={groupAvatar} inputSize={100} username={groupName} />
          {isEditing && (
            <>
              <button
                type='button'
                onClick={handleAvatarClick}
                className='absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold'
              >
                Change
              </button>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                className='hidden'
                aria-label='Upload avatar'
              />
            </>
          )}
        </div>

        {isEditing ? (
          <div className='flex flex-col items-center gap-2'>
            <input
              type='text'
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className='px-4 py-2 rounded-[14px] border-2 border-(--primary) text-center text-xl font-semibold text-(--primary) focus:outline-none'
            />
            <div className='flex gap-2 mt-2'>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className='px-4 py-2 rounded-[14px] bg-(--primary) text-white text-sm font-semibold transition hover:bg-(--secondary) disabled:opacity-50'
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className='px-4 py-2 rounded-[14px] border border-gray-300 text-gray-600 text-sm font-semibold transition hover:bg-gray-100'
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-2'>
            <h3 className='text-xl font-semibold text-(--primary)'>{groupName}</h3>
            {isCreator && (
              <button
                onClick={() => setIsEditing(true)}
                className='p-1.5 rounded-full hover:bg-(--primary-faded) transition text-(--primary)'
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
        )}

        <p className='text-sm text-gray-500'>{members.length} members</p>
      </div>

      <div className='flex-1 flex flex-col gap-2'>
        <div className='flex items-center justify-between mb-2'>
          <h4 className='text-sm font-semibold text-(--primary) uppercase tracking-wide'>Members</h4>
          {isCreator && (
            <button
              onClick={() => setShowAddMember(true)}
              className='flex items-center gap-1 text-sm border border-(--primary) text-(--primary) px-3 py-1.5 rounded-full transition hover:bg-(--primary) hover:text-white cursor-pointer'
            >
              <Plus size={14} />
              Add Member
            </button>
          )}
        </div>

        <div className='flex flex-col gap-2 overflow-y-auto'>
          {members.map((member) => (
            <div
              key={member.id}
              className='flex items-center justify-between p-3 rounded-[14px] border border-(--primary-faded) hover:bg-(--primary-faded) transition'
            >
              <div className='flex items-center gap-3'>
                <UserAvatar avatar={member.avatar} inputSize={40} username={member.username} />
                <div>
                  <p className='font-medium text-gray-900'>{member.username}</p>
                  {member.id === user?.id && (
                    <p className='text-xs text-gray-400'>(You)</p>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <span className={`w-2.5 h-2.5 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className='text-xs text-gray-500'>{member.is_online ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-6 pt-4 border-t border-(--border)'>
        <button
          onClick={handleDelete}
          className='w-full flex items-center justify-center gap-2 py-3 rounded-[14px] border border-red-300 text-red-500 font-semibold transition hover:bg-red-50 cursor-pointer'
        >
          <Trash2 size={18} />
          Delete Chat
        </button>
      </div>

      {showAddMember && (
        <AddMemberModal
          roomId={activeRoom.roomId!}
          currentMemberIds={members.map(m => m.id)}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}
