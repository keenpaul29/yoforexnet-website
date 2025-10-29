module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/thread/[slug]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ThreadDetailPage,
    "generateMetadata",
    ()=>generateMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@/lib/category-path'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
;
;
async function fetchData(url) {
    try {
        const expressUrl = ("TURBOPACK compile-time value", "http://localhost:5000") || 'http://localhost:5000';
        const res = await fetch(`${expressUrl}${url}`, {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!res.ok) {
            console.error(`Failed to fetch ${url}:`, res.status, res.statusText);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
function createExcerpt(html, maxLength = 155) {
    const text = stripHtml(html);
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}
async function generateMetadata({ params }) {
    const { slug } = await params;
    const thread = await fetchData(`/api/threads/slug/${slug}`);
    if (!thread) {
        return {
            title: 'Thread Not Found - YoForex',
            description: 'The thread you are looking for does not exist.'
        };
    }
    const description = thread.metaDescription || createExcerpt(thread.body || '');
    const title = `${thread.title} - YoForex Forum`;
    return {
        title,
        description,
        keywords: [
            thread.categorySlug || 'forum',
            'EA discussion',
            'forex forum',
            'expert advisor',
            'trading discussion',
            'MT4',
            'MT5'
        ],
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://yoforex.com/thread/${slug}`,
            siteName: 'YoForex'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description
        }
    };
}
async function ThreadDetailPage({ params }) {
    const { slug } = await params;
    // Fetch thread data from Express API
    const thread = await fetchData(`/api/threads/slug/${slug}`);
    // Return 404 if thread doesn't exist
    if (!thread) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    }
    // Generate hierarchical URL and redirect (301)
    const hierarchicalUrl = await getThreadUrl(thread);
    // Use NextResponse.redirect with 301 status for permanent redirect (SEO)
    const headersList = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["headers"])();
    const host = headersList.get('host') || 'localhost:5000';
    const protocol = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 'http';
    const baseUrl = `${protocol}://${host}`;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(hierarchicalUrl, baseUrl), 301);
}
}),
"[project]/app/thread/[slug]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/thread/[slug]/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0a021364._.js.map