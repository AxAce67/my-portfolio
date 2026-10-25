type Props = {
  src: string;
  alt: string;
  size: number;
  className?: string;
  // Dark- or light-only logos ship a second file named `<name>-dark.svg`
  // for dark mode.
  hasDarkVariant?: boolean;
};

export function BrandLogo({ src, alt, size, className = '', hasDarkVariant = false }: Props) {
  if (!hasDarkVariant) {
    return <img src={src} alt={alt} width={size} height={size} loading="lazy" className={`object-contain ${className}`} />;
  }
  const darkSrc = src.replace(/\.svg$/, '-dark.svg');
  return (
    <>
      <img src={src} alt={alt} width={size} height={size} loading="lazy" className={`object-contain dark:hidden ${className}`} />
      <img src={darkSrc} alt={alt} width={size} height={size} loading="lazy" className={`hidden object-contain dark:block ${className}`} />
    </>
  );
}
