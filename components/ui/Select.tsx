import { SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = ({ className, ...props }: SelectProps) => (
  <select
    className={clsx('border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary', className)}
    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
    {...props}
  />
);