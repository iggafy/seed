import { NodeType } from '../types';

export interface OpenAlexWork {
    id: string;
    doi: string;
    title: string;
    display_name: string;
    publication_year: number;
    reconstructed_abstract: string;
    authorships: any[];
    primary_location: {
        landing_page_url: string;
        pdf_url: string;
    } | null;
    concepts: any[];
}

const reconstructAbstract = (invertedIndex: Record<string, number[]> | null): string => {
    if (!invertedIndex) return "";

    // Find the total number of words
    let maxIndex = 0;
    Object.values(invertedIndex).forEach(indices => {
        indices.forEach(idx => {
            if (idx > maxIndex) maxIndex = idx;
        });
    });

    const abstractArray = new Array(maxIndex + 1);
    Object.entries(invertedIndex).forEach(([word, indices]) => {
        // Clean individual word keys in case they contain baked-in newlines
        const cleanWord = word.replace(/\\n/g, ' ').replace(/[\r\n]+/g, ' ').trim();
        indices.forEach(idx => {
            abstractArray[idx] = cleanWord;
        });
    });

    return abstractArray.join(' ')
        .replace(/\\n/g, ' ')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

export const searchOpenAlex = async (query: string): Promise<OpenAlexWork[]> => {
    try {
        const response = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&mailto=team@seed-app.com`);
        const data = await response.json();

        return data.results.map((work: any) => ({
            id: work.id,
            doi: work.doi,
            title: work.title || work.display_name,
            display_name: work.display_name,
            publication_year: work.publication_year,
            reconstructed_abstract: reconstructAbstract(work.abstract_inverted_index),
            authorships: work.authorships,
            primary_location: work.primary_location,
            concepts: work.concepts
        }));
    } catch (e) {
        console.error("OpenAlex Search failed", e);
        return [];
    }
};

export const getOpenAlexWork = async (id: string): Promise<OpenAlexWork | null> => {
    try {
        const response = await fetch(`${id}?mailto=team@seed-app.com`);
        const work = await response.json();

        return {
            id: work.id,
            doi: work.doi,
            title: work.title || work.display_name,
            display_name: work.display_name,
            publication_year: work.publication_year,
            reconstructed_abstract: reconstructAbstract(work.abstract_inverted_index),
            authorships: work.authorships,
            primary_location: work.primary_location,
            concepts: work.concepts
        };
    } catch (e) {
        console.error("OpenAlex Fetch failed", e);
        return null;
    }
};
