import { ImgHTMLAttributes } from 'react';

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  quality?: number;
  unoptimized?: boolean;
};

export default function Image({ fill, priority, fetchPriority, quality, unoptimized, className = '', style, src, alt, ...props }: ImageProps) {
  // Translate Next.js 'fill' layout to absolute positioning
  const combinedClassName = fill 
    ? `absolute inset-0 w-full h-full object-cover ${className}`
    : className;

  return (
    <img
      src={src}
      alt={alt}
      className={combinedClassName}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={fetchPriority || (priority ? 'high' : 'auto')}
      style={style}
      {...props}
    />
  );
}
