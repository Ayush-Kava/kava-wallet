import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  /** Use on dark backgrounds (e.g. auth sidebar) so text stays visible. */
  variant?: 'default' | 'onDark';
  className?: string;
}

const Logo = ({ size = 'md', showText = true, variant = 'default', className }: LogoProps) => {
  const iconSize = size === 'lg' ? 22 : size === 'md' ? 18 : 16;
  const boxSize = size === 'lg' ? 'h-10 w-10' : size === 'md' ? 'h-8 w-8' : 'h-7 w-7';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          boxSize,
          'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
        )}
      >
        <Wallet size={iconSize} strokeWidth={2.25} />
      </div>
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight',
            variant === 'onDark' ? 'text-white' : 'text-foreground',
            size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm',
          )}
        >
          Kava Wallet
        </span>
      )}
    </div>
  );
};

export default Logo;
