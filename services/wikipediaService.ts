import { NodeType } from '../types';

const EN_WIKI_API = 'https://en.wikipedia.org/w/api.php';

const fixWikiProtocols = (html: string) => {
    if (!html) return "";
    return html
        .replace(/src="\/\//g, 'src="https://')
        .replace(/srcset="\/\//g, 'srcset="https://')
        .replace(/href="\/\//g, 'href="https://');
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
        return fixWikiProtocols(data.parse.text['*']);
    } catch (e) {
        console.error("Wiki Parse failed", e);
        return "";
    }
};
