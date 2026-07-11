import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useTextSize = () => {
  const textSize = useSelector((state: RootState) => state.ui.textSize);
  
  const textSizeClasses: Record<string, string> = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };
  
  return {
    textSize,
    className: textSizeClasses[textSize] || 'text-base',
    sizeValue: textSize,
  };
};
