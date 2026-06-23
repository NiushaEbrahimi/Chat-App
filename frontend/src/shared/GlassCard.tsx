import React from 'react';

interface Props {
  children: React.ReactNode;
  blur?: number; // px
  minWidth?: string | number;
  minHeight?: string | number;
  padding?: number | string;
  className?: string;
}

const GlassCard = ({ children, blur = 8, minWidth, minHeight, padding = 12, className = '' }: Props) => {
  const style: React.CSSProperties = {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.25))',
    minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 6px 24px rgba(16,24,40,0.06)',
  };

  return (
    <div style={style} className={`backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
