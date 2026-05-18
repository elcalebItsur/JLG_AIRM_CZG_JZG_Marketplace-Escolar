/**
 * Post-build script for Expo web export.
 * 
 * Expo 54 + Metro bundler does NOT automatically copy files from public/ 
 * to the dist/ output directory. This script:
 * 1. Copies all files from public/ to dist/
 * 2. Injects <link rel="manifest"> into dist/index.html if missing
 * 3. Injects PWA meta tags and safe-area CSS if missing
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

// ─── 1. Copy public/ → dist/ ──────────────────────────────────────────────
function copyPublicToDist() {
    if (!fs.existsSync(PUBLIC_DIR)) {
        console.log('⚠️  No public/ directory found, skipping copy.');
        return;
    }
    if (!fs.existsSync(DIST_DIR)) {
        console.log('⚠️  No dist/ directory found. Run "npx expo export" first.');
        process.exit(1);
    }

    const files = fs.readdirSync(PUBLIC_DIR);
    let copied = 0;

    for (const file of files) {
        const src = path.join(PUBLIC_DIR, file);
        const dest = path.join(DIST_DIR, file);
        const stat = fs.statSync(src);

        if (stat.isFile()) {
            fs.copyFileSync(src, dest);
            copied++;
            console.log(`  ✅ Copied ${file} → dist/${file}`);
        }
    }

    console.log(`📦 Copied ${copied} file(s) from public/ to dist/`);
}

// ─── 2. Enhance index.html with PWA tags and safe-area CSS ────────────────
function enhanceIndexHtml() {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.log('⚠️  dist/index.html not found, skipping enhancement.');
        return;
    }

    let html = fs.readFileSync(indexPath, 'utf-8');

    // --- Inject manifest link ---
    if (!html.includes('rel="manifest"')) {
        html = html.replace(
            '</head>',
            '    <link rel="manifest" href="/manifest.json">\n  </head>'
        );
        console.log('✅ Injected <link rel="manifest">');
    } else {
        console.log('ℹ️  Manifest link already exists');
    }

    // --- Inject apple-touch-icon if missing ---
    if (!html.includes('apple-touch-icon')) {
        const appleIcons = `
    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="/icon.png">
    <link rel="apple-touch-icon-precomposed" href="/icon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/icon.png">
    <link rel="apple-touch-icon" sizes="192x192" href="/icon.png">
    <link rel="apple-touch-icon" sizes="512x512" href="/icon.png">`;
        html = html.replace('</head>', appleIcons + '\n  </head>');
        console.log('✅ Injected apple-touch-icon links');
    }

    // --- Inject PWA meta tags if missing ---
    if (!html.includes('apple-mobile-web-app-capable')) {
        const pwaMeta = `
    <!-- PWA Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Marketplace">`;
        html = html.replace('</head>', pwaMeta + '\n  </head>');
        console.log('✅ Injected PWA meta tags');
    }

    // --- Fix viewport to include viewport-fit=cover ---
    if (html.includes('name="viewport"') && !html.includes('viewport-fit=cover')) {
        html = html.replace(
            /content="([^"]*)"(\s*\/?\s*>)(\s*<!--\s*viewport\s*-->)?/,
            (match, content, closing) => {
                if (match.includes('viewport')) {
                    return match;
                }
                return match;
            }
        );
        // Direct replacement of the viewport meta
        html = html.replace(
            /<meta name="viewport"[^>]*>/,
            '<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no">'
        );
        console.log('✅ Updated viewport meta with viewport-fit=cover');
    }

    // --- Enhance CSS with safe-area styles ---
    if (!html.includes('safe-area-inset-top')) {
        const safeAreaCSS = `
      /* ─── PWA Safe Area & Background ─────────────────────── */
      html, body {
        overscroll-behavior: none;
        -webkit-overflow-scrolling: touch;
        background-color: #003366;
      }
      body {
        padding: 0;
        margin: 0;
        touch-action: pan-y;
      }
      #root {
        background-color: #F0F4F8;
      }
      @supports (padding-top: env(safe-area-inset-top)) {
        body {
          background-color: #003366;
        }
      }
      @media (display-mode: standalone) {
        body {
          background-color: #003366;
        }
      }`;
        // Insert before </style>
        html = html.replace('</style>', safeAreaCSS + '\n    </style>');
        console.log('✅ Injected safe-area CSS styles');
    }

    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('✅ Enhanced dist/index.html');
}

// ─── Run ───────────────────────────────────────────────────────────────────
console.log('\n🔧 Running post-build script...\n');
copyPublicToDist();
enhanceIndexHtml();
console.log('\n✨ Post-build complete!\n');
