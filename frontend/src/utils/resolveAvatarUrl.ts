export const resolveAvatarUrl = (avatar: string | null | undefined): string | undefined => {
  if (!avatar) return undefined;
  
  // If it's already a full URL (starts with http/https), return as-is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a relative path (starts with /), prepend the API URL
  if (avatar.startsWith('/')) {
    const apiUrl = import.meta.env.VITE_API_URL;
    return `${apiUrl}${avatar}`;
  }
  
  // Otherwise return as-is
  return avatar;
};
