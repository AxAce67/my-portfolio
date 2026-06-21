/// <reference types="vite/client" />

// Shims for removed Next.js APIs (aliased in vite.config.ts) — loosely
// typed on purpose since these are compat stand-ins, not real APIs.
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'next/image' {
  const Image: any;
  export default Image;
}

declare module 'next/link' {
  const Link: any;
  export default Link;
}

declare module 'next/navigation' {
  export const useRouter: any;
  export const usePathname: any;
  export const useParams: any;
  export const useSearchParams: any;
  export const redirect: any;
}

declare module 'next/script' {
  const Script: any;
  export default Script;
}

declare module 'next-intl' {
  export const useTranslations: any;
  export const useLocale: any;
}

declare module 'next-themes' {
  export const useTheme: any;
}

declare module 'next-view-transitions' {
  export const useTransitionRouter: any;
  export const Link: any;
}

declare module 'next/dynamic' {
  const dynamic: any;
  export default dynamic;
}

declare module 'next/cache' {
  export const revalidatePath: any;
  export const revalidateTag: any;
}

declare module 'next/headers' {
  export const cookies: any;
}
