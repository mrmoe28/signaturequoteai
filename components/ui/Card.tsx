import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={clsx('border rounded-lg p-4', className)}
    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
    {...props}
  />
);