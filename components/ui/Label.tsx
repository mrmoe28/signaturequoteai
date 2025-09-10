import { LabelHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = ({ className, ...props }: LabelProps) => (
  <label
    className={clsx('text-sm font-medium', className)}
    style={{ color: 'var(--text)' }}
    {...props}
  />
);