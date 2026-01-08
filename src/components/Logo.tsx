import { Waves } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo = ({ size = 'md', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} gradient-primary rounded-xl flex items-center justify-center shadow-glow`}>
        <Waves className="text-primary-foreground" size={size === 'lg' ? 28 : size === 'md' ? 22 : 18} />
      </div>
      {showText && (
        <span className={`font-display font-bold ${textClasses[size]} gradient-text`}>
          KavaFlow
        </span>
      )}
    </div>
  );
};

export default Logo;
