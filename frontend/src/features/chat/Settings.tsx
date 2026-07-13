import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../api/auth';
import UserAvatar from '../../shared/UserAvatar';
import { LogOut, Settings as SettingsIcon, Bell, Palette, TextIcon, Globe, Database } from 'lucide-react';
import { setTextSize, setColorTheme, setNotificationsEnabled, setLanguage } from '../../store/slices/uiSlice';
import { useTranslate } from '../../utils/i18n';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import type { RootState } from '../../store';
import type { ColorTheme, TextSize, Language } from '../../store/slices/uiSlice';

const COLOR_THEMES = [
  { id: 'purple', name: 'purple_mist', colors: ['#b38ddc', '#a9c2eb'] },
  { id: 'blue', name: 'ocean_blue', colors: ['#60a5fa', '#3b82f6'] },
  { id: 'pink', name: 'rose_pink', colors: ['#ec4899', '#f43f5e'] },
  { id: 'green', name: 'emerald_green', colors: ['#10b981', '#34d399'] },
  { id: 'orange', name: 'sunset_orange', colors: ['#f97316', '#fb923c'] },
  { id: 'indigo', name: 'deep_indigo', colors: ['#6366f1', '#4f46e5'] },
] as const;

const TEXT_SIZES = [
  { id: 'small', label: 'small', value: 'text-sm' },
  { id: 'medium', label: 'medium', value: 'text-base' },
  { id: 'large', label: 'large', value: 'text-lg' },
] as const;

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
  { id: 'de', name: 'Deutsch' },
] as const;

export default function Settings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout, refreshToken } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Get settings from Redux
  const messageTextSize = useSelector((state: RootState) => state.ui.textSize);
  const colorTheme = useSelector((state: RootState) => state.ui.colorTheme);
  const notificationsEnabled = useSelector((state: RootState) => state.ui.notificationsEnabled);
  const language = useSelector((state: RootState) => state.ui.language);

  const t = useTranslate(language);

  const handleTextSizeChange = (size: TextSize) => {
    dispatch(setTextSize(size));
  };

  const handleThemeChange = (theme: ColorTheme) => {
    dispatch(setColorTheme(theme));
  };

  const handleNotificationsChange = (enabled: boolean) => {
    dispatch(setNotificationsEnabled(enabled));
  };

  const handleLanguageChange = (lang: Language) => {
    dispatch(setLanguage(lang));
  };

  const handleClearCache = () => {
    // Clear all cache-related data
    const cacheKeys = [
      'rooms',
      'messages',
      'users',
      'user-search',
      'saved-messages-room',
    ];

    cacheKeys.forEach(key => {
      // Clear from localStorage
      localStorage.removeItem(key);
      
      // Clear from IndexedDB if exists
      if (window.indexedDB) {
        const dbRequest = window.indexedDB.open('ChatAppDB');
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const stores = Array.from(db.objectStoreNames);
          stores.forEach(store => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).clear();
          });
        };
      }
    });

    // Clear service worker cache if available
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className='w-full h-full flex flex-col rounded-[28px] bg-(--surface) p-8 overflow-y-auto'>
      <div className='flex items-center gap-3 mb-8'>
        <SettingsIcon className='w-8 h-8 text-(--primary)' />
        <h2 className='text-2xl font-semibold text-(--primary)'>{t('settings')}</h2>
      </div>

      {/* Profile Info Section - Compact */}
      <div className='mb-6'>
        <h3 className='text-sm font-semibold text-(--primary) uppercase tracking-wide mb-3'>{t('profile')}</h3>
        <div className='p-4 rounded-2xl bg-(--primary-faded) border border-(--border) flex items-center gap-4'>
          <UserAvatar avatar={resolveAvatarUrl(user?.avatar)} inputSize={60} username={user?.username} />
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-semibold text-(--primary) truncate'>{user?.username}</p>
            <p className='text-xs text-gray-600 truncate'>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Message Text Size */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 mb-3'>
          <TextIcon className='w-4 h-4 text-(--primary)' />
          <h3 className='text-sm font-semibold text-(--primary) uppercase tracking-wide'>{t('message_text_size')}</h3>
        </div>
        <div className='p-4 rounded-2xl bg-(--primary-faded) border border-(--border) space-y-3'>
          {TEXT_SIZES.map(size => (
            <label key={size.id} className='flex items-center gap-3 cursor-pointer group'>
              <input
                type='radio'
                name='textSize'
                value={size.id}
                checked={messageTextSize === size.id}
                onChange={() => handleTextSizeChange(size.id)}
                className='w-4 h-4 accent-(--primary) cursor-pointer'
              />
              <span className={`font-medium text-(--primary) group-hover:opacity-80 transition ${size.value}`}>
                {t(size.label)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Color Theme */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 mb-3'>
          <Palette className='w-4 h-4 text-(--primary)' />
          <h3 className='text-sm font-semibold text-(--primary) uppercase tracking-wide'>{t('color_theme')}</h3>
        </div>
        <div className='p-4 rounded-2xl bg-(--primary-faded) border border-(--border)'>
          <div className='grid grid-cols-2 gap-3'>
            {COLOR_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`relative p-3 rounded-xl border-2 transition ${
                  colorTheme === theme.id
                    ? 'border-(--primary) bg-white/60'
                    : 'border-(--border) bg-white/30 hover:bg-white/40'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <div className='flex gap-2'>
                    {theme.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className='w-4 h-4 rounded-full border border-gray-300'
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className='text-xs font-semibold text-(--primary)'>{t(theme.name)}</span>
                </div>
                {colorTheme === theme.id && (
                  <div className='absolute top-2 right-2 w-2 h-2 rounded-full bg-(--primary)' />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Layout for Notifications, Language, Data & Storage, Danger Zone */}
      <div className='grid grid-cols-2 gap-6'>
        {/* Notifications */}
        <div className='mb-0'>
          <div className='flex items-center gap-2 mb-3'>
            <Bell className='w-4 h-4 text-(--primary)' />
            <h3 className='text-sm font-semibold text-(--primary) uppercase tracking-wide'>{t('notifications')}</h3>
          </div>
          <div className='p-4 rounded-2xl bg-(--primary-faded) border border-(--border) space-y-4'>
            <label className='flex items-center justify-between cursor-pointer group'>
              <span className='font-medium text-(--primary)'>{t('enable_notifications')}</span>
              <div className='relative'>
                <input
                  type='checkbox'
                  checked={notificationsEnabled}
                  onChange={(e) => handleNotificationsChange(e.target.checked)}
                  className='w-6 h-6 rounded accent-(--primary) cursor-pointer'
                />
              </div>
            </label>
            <p className='text-xs text-gray-600'>{t('get_alerts')}</p>
          </div>
        </div>

        {/* Language */}
        <div className='mb-0'>
          <div className='flex items-center gap-2 mb-3'>
            <Globe className='w-4 h-4 text-(--primary)' />
            <h3 className='text-sm font-semibold text-(--primary) uppercase tracking-wide'>{t('language')}</h3>
          </div>
          <div className='p-4 rounded-2xl bg-(--primary-faded) border border-(--border)'>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className='w-full px-4 py-2 rounded-xl border border-(--border) bg-white text-(--primary) font-medium focus:outline-none focus:ring-2 focus:ring-(--primary-faded) cursor-pointer'
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className='text-xs text-gray-600 mt-2'>{t('language_switching_soon')}</p>
          </div>
        </div>

        {/* Data and Storage */}
        <div className='mb-0'>
          <div className='flex items-center gap-2 mb-3'>
            <Database className='w-4 h-4 text-(--primary)' />
            <h3 className='text-sm font-semibold text-(--primary) uppercase tracking-wide'>{t('data_storage')}</h3>
          </div>
          <div className='p-4 rounded-2xl bg-(--primary-faded) border border-(--border) space-y-3'>
            {cacheCleared && (
              <div className='p-3 rounded-xl bg-green-100/50 text-green-700 text-sm font-medium border border-green-300/50'>
                ✓ Cache cleared successfully!
              </div>
            )}
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium text-(--primary)'>{t('storage_used')}</span>
              <span className='text-sm font-semibold text-(--primary)'>--</span>
            </div>
            <button
              onClick={handleClearCache}
              className='px-4 py-2 rounded-xl bg-orange-500/20 text-orange-700 border border-orange-300/50 font-medium text-sm transition hover:bg-orange-500/30'
            >
              {t('clear_cache')}
            </button>
            <p className='text-xs text-gray-600'>{t('cache_clearing_soon')}</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className='mb-0'>
          <h3 className='text-sm font-semibold text-red-600 uppercase tracking-wide mb-3'>{t('danger_zone')}</h3>
          <div className='p-5 rounded-[20px] bg-red-50 border border-red-300/50'>
            {showConfirmLogout ? (
              <div className='flex flex-col gap-4'>
                <p className='text-sm font-medium text-(--primary) p-3 bg-red-100/50 rounded-xl'>
                  {t('confirm_logout')}
                </p>
                <div className='flex gap-3'>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className='flex-1 px-4 py-3 rounded-[14px] bg-red-500 text-white font-semibold uppercase tracking-wide transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-10 text-xs'
                  >
                    {isLoggingOut ? (
                      <>
                        <span className='border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin'></span>
                        {t('logging_out')}
                      </>
                    ) : (
                      <>
                        <LogOut className='w-4 h-4' />
                        {t('yes_logout')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirmLogout(false)}
                    disabled={isLoggingOut}
                    className='flex-1 px-4 py-3 rounded-[14px] bg-gray-300/40 text-gray-600 font-semibold uppercase tracking-wide border border-gray-400/50 transition hover:bg-gray-300/60 disabled:opacity-50 disabled:cursor-not-allowed text-xs'
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmLogout(true)}
                className='px-4 py-3 rounded-[14px] bg-red-500 text-white font-semibold uppercase tracking-wide transition hover:bg-red-600 flex items-center justify-center gap-2 min-h-11 text-sm'
              >
                <LogOut className='w-5 h-5' />
                {t('log_out')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}