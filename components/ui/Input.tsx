import { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={clsx('border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary', className)}
    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
    {...props}
  />
);