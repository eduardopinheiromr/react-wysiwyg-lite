import type { HTMLAttributes } from 'react';

export const Toolbar = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={['rsw-toolbar', className].filter(Boolean).join(' ')}>
    {children}
  </div>
);
