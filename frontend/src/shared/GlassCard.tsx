import React from 'react';
import style from '../assets/css/CrystalMist.module.css';

interface Props {
  children: React.ReactNode;
  blur?: number; // px
  minWidth?: string | number;
  minHeight?: string | number;
  padding?: number | string;
  className?: string;
}

const GlassCard = ({ children, blur = 8, minWidth, minHeight, padding = 12, className = '' }: Props) => {
  const styleProps: React.CSSProperties = {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.2))',
    minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.2)',
  };

  return (
    <div className={`${style.liquidGlassContainer} ${className}`} style={styleProps}>
      <div className={style.cardContent} style={{padding:"0px"}}>
      {children}
      </div>
    </div>
  );
};

export default GlassCard;
