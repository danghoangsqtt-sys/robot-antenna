/**
 * Academic Source Service
 * Fetches and cites scientific literature from reputable sources:
 * - arXiv (physics, computer science preprints)
 * - CrossRef (academic articles, DOI metadata)
 * - Wikipedia (general knowledge)
 * - PubMed (biomedical literature)
 */

import { AcademicSource, InternetResearchResult } from '../types';

export class AcademicSourceService {
  private cache: Map<string, InternetResearchResult> = new Map();
  private cacheTimeout = 3600000; // 1 hour

  /**
   * Search academic sources for research query
   */
  async searchAcademicSources(query: string, topic?: string): Promise<AcademicSource[]> {
    const cacheKey = `${query}_${topic}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.sources;
    }

    const sources: AcademicSource[] = [];

    // Search multiple sources in parallel
    try {
      const [arxivResults, crossrefResults, wikiResults] = await Promise.all([
        this.searchArxiv(query, topic),
        this.searchCrossRef(query, topic),
        this.searchWikipedia(query)
      ]);

      sources.push(...arxivResults, ...crossrefResults, ...wikiResults);
      
      // Sort by relevance and citation count
      sources.sort((a, b) => {
        const scoreA = (a.relevanceScore || 0) * 0.7 + (a.citations || 0) * 0.01;
        const scoreB = (b.relevanceScore || 0) * 0.7 + (b.citations || 0) * 0.01;
        return scoreB - scoreA;
      });

      // Cache results
      this.cache.set(cacheKey, {
        query,
        sources: sources.slice(0, 10), // Keep top 10
        timestamp: Date.now(),
        searchEngine: 'multi'
      });

      return sources.slice(0, 10);
    } catch (error) {
      console.error('Academic search error:', error);
      return sources;
    }
  }

  /**
   * Search arXiv preprints (physics, CS, math, etc.)
   * arXiv API: https://arxiv.org/help/api
   */
  private async searchArxiv(query: string, topic?: string): Promise<AcademicSource[]> {
    try {
      // Build search query
      let searchQuery = `(title:"${query}" OR abstract:"${query}")`;
      
      if (topic) {
        searchQuery += ` AND cat:${this.mapTopicToArxivCategory(topic)}`;
      }

      // arXiv API endpoint
      const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=5&sortBy=relevance&sortOrder=descending`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('arXiv API error');

      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');

      const entries = doc.getElementsByTagName('entry');
      const sources: AcademicSource[] = [];

      for (let i = 0; i < Math.min(entries.length, 5); i++) {
        const entry = entries[i];
        
        // Extract metadata
        const title = entry.getElementsByTagName('title')[0]?.textContent?.trim() || '';
        const authors: string[] = [];
        
        const authorElements = entry.getElementsByTagName('author');
        for (let j = 0; j < authorElements.length; j++) {
          const name = authorElements[j]?.getElementsByTagName('name')[0]?.textContent;
          if (name) authors.push(name);
        }

        const published = entry.getElementsByTagName('published')[0]?.textContent?.slice(0, 4) || new Date().getFullYear().toString();
        const summary = entry.getElementsByTagName('summary')[0]?.textContent?.trim() || '';
        const arxivId = entry.getElementsByTagName('id')[0]?.textContent?.match(/arxiv\.org\/abs\/([\d.]+)/)?.[1] || '';

        sources.push({
          id: `arxiv_${arxivId}`,
          title: title.replace(/\n/g, ' '),
          authors,
          year: parseInt(published),
          sourceType: 'arxiv',
          url: `https://arxiv.org/abs/${arxivId}`,
          abstract: summary.slice(0, 500),
          relevanceScore: this.calculateRelevance(title + ' ' + summary, query),
          tags: this.extractTags(summary),
        });
      }

      return sources;
    } catch (error) {
      console.warn('arXiv search failed:', error);
      return [];
    }
  }

  /**
   * Search CrossRef for published articles
   * CrossRef API: https://github.com/CrossRef/rest-api-doc
   */
  private async searchCrossRef(query: string, topic?: string): Promise<AcademicSource[]> {
    try {
      // CrossRef API endpoint
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&sort=relevance&order=desc&rows=5`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('CrossRef API error');

      const data = await response.json() as any;
      const items = data.message?.items || [];

      const sources: AcademicSource[] = items.map((item: any) => ({
        id: `crossref_${item.DOI?.replace(/\//g, '_') || item.URL}`,
        title: item.title?.[0] || '',
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || [],
        year: item.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
        journal: item['container-title']?.[0],
        doi: item.DOI,
        url: item.URL || `https://doi.org/${item.DOI}`,
        abstract: item.abstract?.slice(0, 500),
        sourceType: 'crossref' as const,
        relevanceScore: this.calculateRelevance(item.title?.[0] || '', query),
        citations: item['is-referenced-by-count'] || 0,
        tags: item.keywords || [],
      }));

      return sources;
    } catch (error) {
      console.warn('CrossRef search failed:', error);
      return [];
    }
  }

  /**
   * Search Wikipedia for general knowledge and definitions
   */
  private async searchWikipedia(query: string): Promise<AcademicSource[]> {
    try {
      // Wikipedia API endpoint
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Wikipedia API error');

      const data = await response.json() as any;
      const results = data.query?.search || [];

      const sources: AcademicSource[] = [];

      for (const result of results) {
        // Get page content
        const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=extracts|pageimages&exintro&explaintext&format=json&origin=*`;
        const pageResponse = await fetch(pageUrl);
        const pageData = await pageResponse.json() as any;
        
        const page = Object.values(pageData.query?.pages || {})[0] as any;
        
        sources.push({
          id: `wiki_${result.title.replace(/\s/g, '_')}`,
          title: result.title,
          authors: ['Wikipedia Contributors'],
          year: new Date().getFullYear(),
          sourceType: 'wiki',
          url: `https://en.wikipedia.org/wiki/${result.title.replace(/\s/g, '_')}`,
          abstract: page?.extract?.slice(0, 500) || result.snippet,
          relevanceScore: this.calculateRelevance(result.title + ' ' + result.snippet, query),
          tags: [query.split(/\s+/)[0]],
        });
      }

      return sources;
    } catch (error) {
      console.warn('Wikipedia search failed:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score (0-1) based on query match
   */
  private calculateRelevance(text: string, query: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Exact match
    if (lowerText.includes(lowerQuery)) return 1.0;
    
    // Word match
    const words = lowerQuery.split(/\s+/);
    const matches = words.filter(w => lowerText.includes(w)).length;
    
    return Math.min(1.0, matches / words.length * 0.8);
  }

  /**
   * Extract key tags from text
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const patterns = [
      /antenna|anten/i,
      /electromagnetic|điện từ/i,
      /radiation|bức xạ/i,
      /gain|directivity/i,
      /impedance|trở kháng/i,
      /maxwell|phương trình/i,
      /simulation|mô phỏng/i,
      /design|thiết kế/i,
      /analysis|phân tích/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        tags.push(pattern.source.split('|')[0].toLowerCase());
      }
    }

    return tags;
  }

  /**
   * Map research topic to arXiv category
   */
  private mapTopicToArxivCategory(topic: string): string {
    const mapping: { [key: string]: string } = {
      'antenna': 'physics.app-ph',
      'electromagnetic': 'physics.class-ph',
      'physics': 'physics',
      'computer science': 'cs',
      'engineering': 'physics.app-ph',
      'mathematics': 'math',
      'signal processing': 'eess.SP',
      'communications': 'eess.COM',
    };

    return mapping[topic.toLowerCase()] || 'physics.app-ph';
  }

  /**
   * Format citation in APA style
   */
  formatCitation(source: AcademicSource, style: 'APA' | 'MLA' | 'Chicago' = 'APA'): string {
    if (style === 'APA') {
      const authors = source.authors.slice(0, 3).join(', ');
      const etAl = source.authors.length > 3 ? ', et al.' : '';
      return `${authors}${etAl} (${source.year}). ${source.title}. ${source.journal || 'Retrieved'} ${source.doi ? `https://doi.org/${source.doi}` : source.url || ''}`;
    } else if (style === 'MLA') {
      const authors = source.authors.slice(0, 3).join(', and ');
      return `${authors}. "${source.title}." ${source.journal}, ${source.year}. Web.`;
    }
    
    return source.title;
  }

  /**
   * Get cached results
   */
  getCachedResults(query: string, topic?: string): InternetResearchResult | null {
    const key = `${query}_${topic}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached;
    }
    
    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const academicSourceService = new AcademicSourceService();
