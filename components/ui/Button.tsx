import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ className, variant = 'default', size = 'md', ...props }: ButtonProps) => {
  const baseStyles = 'border rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    default: 'bg-primary text-white border-primary hover:bg-opacity-90',
    ghost: 'bg-transparent border-transparent hover:bg-gray-100',
    outline: 'bg-transparent border-border hover:bg-gray-50',
  };
  
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      style={{
        backgroundColor: variant === 'default' ? 'var(--primary)' : variant === 'ghost' ? 'transparent' : 'transparent',
        borderColor: variant === 'outline' ? 'var(--border)' : variant === 'default' ? 'var(--primary)' : 'transparent',
        color: variant === 'default' ? 'white' : 'var(--text)',
      }}
      {...props}
    />
  );
};