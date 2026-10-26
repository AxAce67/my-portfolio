import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

// A native <select> with the browser arrow replaced by one set in from the
// edge, so every dropdown on the site has its arrow in the same place.
// `className` styles the select; `wrapperClassName` sizes the box around it.
export function Select({ className = '', wrapperClassName = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }) {
  return (
    <span className={`relative inline-block ${wrapperClassName}`}>
      <select {...props} className={`w-full appearance-none pr-9 ${className}`} />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </span>
  );
}
