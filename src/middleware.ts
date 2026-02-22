import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

function buildCsp(nonce: string, isDev: boolean) {
    const scriptDirectives = [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`, 'https://challenges.cloudflare.com'];
    if (isDev) {
        scriptDirectives.push(`'unsafe-eval'`);
    }

    return [
        `default-src 'self'`,
        `base-uri 'self'`,
        `frame-ancestors 'none'`,
        `frame-src 'self' https://challenges.cloudflare.com`,
        `object-src 'none'`,
        `form-action 'self' https://formspree.io`,
        `img-src 'self' data: blob: https:`,
        `media-src 'self' data: https:`,
        `font-src 'self' data: https:`,
        `manifest-src 'self'`,
        `worker-src 'self' blob:`,
        `style-src 'self' 'unsafe-inline'`,
        `script-src ${scriptDirectives.join(' ')}`,
        `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://count.getloli.com https://formspree.io https://challenges.cloudflare.com`,
        `upgrade-insecure-requests`,
    ].join('; ');
}

function buildCspReportOnly(nonce: string, isDev: boolean) {
    const reportOnlyPolicy = buildCsp(nonce, isDev)
        .split('; ')
        .filter((directive) => directive !== 'upgrade-insecure-requests')
        .join('; ');
    return `${reportOnlyPolicy}; report-uri /api/security/csp-report; report-to csp-endpoint`;
}

export default function middleware(request: NextRequest) {
    const response = intlMiddleware(request);
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const isDev = process.env.NODE_ENV !== 'production';

    response.cookies.set('csp-nonce', nonce, {
        httpOnly: true,
        secure: !isDev,
        sameSite: 'lax',
        path: '/',
    });
    response.headers.set('x-nonce', nonce);
    response.headers.set('Content-Security-Policy', buildCsp(nonce, isDev));
    response.headers.set('Content-Security-Policy-Report-Only', buildCspReportOnly(nonce, isDev));
    response.headers.set(
        'Report-To',
        JSON.stringify({
            group: 'csp-endpoint',
            max_age: 10886400,
            endpoints: [{ url: '/api/security/csp-report' }],
        })
    );
    response.headers.set('Reporting-Endpoints', 'csp-endpoint="/api/security/csp-report"');

    return response;
}

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
