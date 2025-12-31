import { NodeType } from '../types';

const EN_WIKI_API = 'https://en.wikipedia.org/w/api.php';

const fixWikiProtocols = (html: string) => {
    if (!html) return "";

    let fixed = html;

    // 1. Fix src, href, poster, data-src, data-srcset, resource for protocol-relative URLs
    // We handle both double and single quotes
    fixed = fixed.replace(/(src|href|poster|data-src|data-srcset|resource)=(['"])\/\//g, '$1=$2https://');

    // 2. Fix root-relative Wikipedia URLs (/wiki, /w, /static, /math, /api)
    // We point them to en.wikipedia.org
    fixed = fixed.replace(/(src|href|poster|data-src|data-srcset|resource)=(['"])\/(wiki|w|static|math|api)\//g, '$1=$2https://en.wikipedia.org/$3/');

    // 3. Fix srcset specifically because it contains multiple URLs separated by commas
    fixed = fixed.replace(/srcset=(['"])([^'"]+)\1/g, (match, quote, content) => {
        const parts = content.split(',').map((part: string) => {
            let trimmed = part.trim();
            if (trimmed.startsWith('//')) {
                trimmed = 'https:' + trimmed;
            } else if (trimmed.startsWith('/')) {
                trimmed = 'https://en.wikipedia.org' + trimmed;
            }
            return trimmed;
        });
        return `srcset=${quote}${parts.join(', ')}${quote}`;
    });

    // 4. Promote lazy-loaded content (swap data-src/data-srcset to src/srcset)
    // Wikipedia often uses data-src for lazy loading which we won't trigger with JS
    fixed = fixed.replace(/data-src=(['"])([^'"]+)\1/g, 'src=$1$2$1');
    fixed = fixed.replace(/data-srcset=(['"])([^'"]+)\1/g, 'srcset=$1$2$1');

    return fixed;
};

export interface WikiSearchResult {
    title: string;
    snippet: string;
    pageid: number;
}

export interface WikiPageContent {
    title: string;
    extract: string;
    url: string;
}

export const searchWikipedia = async (query: string): Promise<WikiSearchResult[]> => {
    const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        origin: '*'
    });

    try {
        const response = await fetch(`${EN_WIKI_API}?${params.toString()}`);
        const data = await response.json();
        return data.query.search.map((s: any) => ({
            title: s.title,
            snippet: s.snippet,
            pageid: s.pageid
        }));
    } catch (e) {
        console.error("Wiki Search failed", e);
        return [];
    }
};

export const getWikiPageContent = async (title: string): Promise<WikiPageContent | null> => {
    const params = new URLSearchParams({
        action: 'query',
        prop: 'extracts|info',
        titles: title,
        inprop: 'url',
        format: 'json',
        origin: '*',
        explaintext: '0' // We want HTML for richness but maybe text for AI? 
    });

    try {
        const response = await fetch(`${EN_WIKI_API}?${params.toString()}`);
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (pageId === '-1') return null;

        return {
            title: page.title,
            extract: fixWikiProtocols(page.extract), // HTML
            url: page.fullurl
        };
    } catch (e) {
        console.error("Wiki Fetch failed", e);
        return null;
    }
};

export const getWikiFullHtml = async (title: string): Promise<string> => {
    const params = new URLSearchParams({
        action: 'parse',
        page: title,
        format: 'json',
        origin: '*',
        prop: 'text|headhtml'
    });

    try {
        const response = await fetch(`${EN_WIKI_API}?${params.toString()}`);
        const data = await response.json();
        if (!data.parse) {
            console.error("Wikipedia page not found or parse error:", data);
            return "<div class='p-8 text-center text-slate-500'>Wikipedia page not found.</div>";
        }
        return fixWikiProtocols(data.parse.text['*']);
    } catch (e) {
        console.error("Wiki Parse failed", e);
        return "";
    }
};
