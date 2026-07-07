'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'scrollbar-hide sticky top-0 z-10 shrink-0 w-full max-w-full min-w-0 justify-start overflow-x-auto overflow-y-hidden rounded-t-lg border-b border-b-border bg-background p-1',
        props.className
      )}
    />
  );
}
