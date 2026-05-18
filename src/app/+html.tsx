import { ScrollViewStyleReset } from 'react-native-css-interop';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML template for Expo Router web builds.
 * This replaces the default Expo HTML shell and gives us full control
 * over meta tags, PWA configuration, and safe area CSS.
 */
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="es">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
                />
                <title>Marketplace ITSUR</title>

                {/* PWA Meta Tags */}
                <meta name="theme-color" content="#003366" />
                <meta
                    name="description"
                    content="Compra y vende productos dentro de la comunidad estudiantil del ITSUR. Libros, electrónica, ropa y más."
                />
                <meta name="mobile-web-app-capable" content="yes" />

                {/* Apple PWA Meta Tags */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Marketplace" />

                {/* Apple Touch Icons — iOS uses these for the home screen icon */}
                <link rel="apple-touch-icon" href="/icon.png" />
                <link rel="apple-touch-icon-precomposed" href="/icon.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
                <link rel="apple-touch-icon" sizes="192x192" href="/icon.png" />
                <link rel="apple-touch-icon" sizes="512x512" href="/icon.png" />

                {/* Web App Manifest — critical for PWA install + icon */}
                <link rel="manifest" href="/manifest.json" />

                {/* Favicon */}
                <link rel="icon" href="/favicon.ico" />

                {/* ScrollView CSS Reset from RN Web */}
                <ScrollViewStyleReset />

                {/* ─── Critical CSS for PWA safe areas ─────────────────────── */}
                <style dangerouslySetInnerHTML={{ __html: `
                    html, body {
                        height: 100%;
                        overscroll-behavior: none;
                        -webkit-overflow-scrolling: touch;
                        /* Primary color fills the status bar / Dynamic Island area */
                        background-color: #003366;
                    }
                    body {
                        overflow: hidden;
                        padding: 0;
                        margin: 0;
                        touch-action: pan-y;
                    }
                    #root {
                        display: flex;
                        height: 100%;
                        flex: 1;
                        /* App background for the content area */
                        background-color: #F0F4F8;
                    }

                    /* ─── PWA Standalone: full safe-area coverage ─────────── */
                    @supports (padding-top: env(safe-area-inset-top)) {
                        body {
                            /* Ensure primary color covers the entire status bar region */
                            background-color: #003366;
                        }
                    }

                    @media (display-mode: standalone) {
                        body {
                            background-color: #003366;
                        }
                        /* In standalone PWA, the #root needs to account for the
                           safe area insets via CSS env() for pixel-perfect coverage.
                           The React components handle their own internal padding,
                           but body bg ensures no white gaps. */
                    }
                `}} />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
