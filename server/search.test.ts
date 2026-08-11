import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

const { mockGetDb } = vi.hoisted(() => ({ mockGetDb: vi.fn() }));
vi.mock('./db', () => ({ getDb: mockGetDb }));

import { editDistance, fuzzySearchResources, normalizeSearchFilters, parseRelationshipQuery, searchResourcesAdvanced, shouldFilterBaseResources } from './search';

function selectChain(result: unknown, terminal: 'limit' | 'orderBy' | 'offset') {
  const chain: Record<string, any> = {};
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => terminal === 'orderBy' ? Promise.resolve(result) : chain);
  chain.limit = vi.fn(() => terminal === 'limit' ? Promise.resolve(result) : chain);
  chain.offset = vi.fn(() => Promise.resolve(result));
  return chain;
}

function collectConditionTokens(value: unknown, seen = new WeakSet<object>(), depth = 0): string[] {
  if (depth > 8 || value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (typeof value !== 'object') return [];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) return value.flatMap((item) => collectConditionTokens(item, seen, depth + 1));
  const record = value as Record<string, unknown>;
  return Object.entries(record)
    .filter(([key]) => key !== 'table')
    .flatMap(([key, item]) => [key, ...collectConditionTokens(item, seen, depth + 1)]);
}

describe('Search Service', () => {
  describe('parseRelationshipQuery', () => {
    it('should detect "alternatives" keyword and return correct relationship type', () => {
      const result = parseRelationshipQuery('Jira alternatives');
      expect(result.relationshipType).toBe('alternative_to');
      expect(result.baseQuery).toBe('Jira');
    });

    it('should detect "integrations" keyword', () => {
      const result = parseRelationshipQuery('Slack integrations');
      expect(result.relationshipType).toBe('integrates_with');
      expect(result.baseQuery).toBe('Slack');
    });

    it('should detect "competitors" keyword', () => {
      const result = parseRelationshipQuery('GitHub competitors');
      expect(result.relationshipType).toBe('competitor_of');
      expect(result.baseQuery).toBe('GitHub');
    });

    it('should return undefined for non-relationship queries', () => {
      const result = parseRelationshipQuery('project management tools');
      expect(result.relationshipType).toBeUndefined();
      expect(result.baseQuery).toBe('project management tools');
    });

    it('should handle case-insensitive keywords', () => {
      const result = parseRelationshipQuery('JIRA ALTERNATIVES');
      expect(result.relationshipType).toBe('alternative_to');
      expect(result.baseQuery).toBe('JIRA');
    });

    it('should trim whitespace correctly', () => {
      const result = parseRelationshipQuery('Figma alternatives');
      expect(result.relationshipType).toBe('alternative_to');
      expect(result.baseQuery).toBe('Figma');
    });

    it('should handle "similar" keyword', () => {
      const result = parseRelationshipQuery('Figma similar');
      expect(result.relationshipType).toBe('similar_to');
      expect(result.baseQuery).toBe('Figma');
    });

    it('should handle "dependencies" keyword', () => {
      const result = parseRelationshipQuery('Node.js dependencies');
      expect(result.relationshipType).toBe('depends_on');
      expect(result.baseQuery).toBe('Node.js');
    });

    it('should handle "ecosystem" keyword', () => {
      const result = parseRelationshipQuery('React ecosystem');
      expect(result.relationshipType).toBe('part_of');
      expect(result.baseQuery).toBe('React');
    });

    it.each([
      ['OpenJS Foundation maintainers', 'maintained_by'],
      ['Open-source tooling funding', 'funded_by'],
      ['GitHub users', 'used_by'],
    ])('should recognize the %s graph intent', (query, relationshipType) => {
      expect(parseRelationshipQuery(query).relationshipType).toBe(relationshipType);
    });

    it('should preserve query case for baseQuery', () => {
      const result = parseRelationshipQuery('MyTool alternatives');
      expect(result.baseQuery).toBe('MyTool');
    });
  });

  describe('Relationship Types', () => {
    it('should support all required relationship types', () => {
      const types = [
        'alternative_to',
        'similar_to',
        'integrates_with',
        'built_by',
        'maintained_by',
        'funded_by',
        'used_by',
        'depends_on',
        'part_of',
        'competitor_of',
      ];

      expect(types).toHaveLength(10);
      types.forEach(type => {
        expect(type).toBeTruthy();
      });
    });
  });

  describe('Query Parsing Edge Cases', () => {
    it('should not match keyword in middle of query', () => {
      const result = parseRelationshipQuery('alternatives to Jira');
      expect(result.relationshipType).toBeUndefined();
    });

    it('should handle empty baseQuery', () => {
      const result = parseRelationshipQuery('alternatives');
      expect(result.relationshipType).toBeUndefined();
      expect(result.baseQuery).toBe('alternatives');
    });

    it('should handle multiple spaces between query and keyword', () => {
      const result = parseRelationshipQuery('Jira  alternatives');
      expect(result.relationshipType).toBe('alternative_to');
      // baseQuery will have the extra space
      expect(result.baseQuery.trim()).toBe('Jira');
    });
  });

  describe('Search Filters', () => {
    it('normalizes valid structured filters without changing relationship-query intent', () => {
      expect(normalizeSearchFilters({ categoryId: 3, pricing: 'open_source', tag: '  Collaboration  ' })).toEqual({
        categoryId: 3,
        pricing: 'open_source',
        tag: 'collaboration',
      });
      expect(parseRelationshipQuery('Jira alternatives').relationshipType).toBe('alternative_to');
    });

    it('drops invalid category values and blank tag filters', () => {
      expect(normalizeSearchFilters({ categoryId: 0, tag: '   ' })).toEqual({});
    });

    it('uses the fuzzy matcher when an exact resource lookup has no match', async () => {
      const exactLookup = selectChain([], 'limit');
      const fuzzyLookup = selectChain([{ id: 30, title: 'Linear', description: 'Planning tool', categoryId: 1, pricing: 'freemium' }], 'limit');
      mockGetDb.mockResolvedValue({
        select: vi.fn()
          .mockReturnValueOnce(exactLookup)
          .mockReturnValueOnce(fuzzyLookup),
      });

      const result = await searchResourcesAdvanced('linear', 20, 0);

      expect(exactLookup.where).toHaveBeenCalledTimes(1);
      expect(fuzzyLookup.where).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ id: 30, title: 'Linear', description: 'Planning tool', categoryId: 1, pricing: 'freemium' }]);
    });

    it('matches a one-character typo against a resource title', async () => {
      const fuzzyLookup = selectChain([{ id: 31, title: 'Figma', description: 'Design collaboration', categoryId: 2, pricing: 'freemium' }], 'limit');
      mockGetDb.mockResolvedValue({ select: vi.fn().mockReturnValueOnce(fuzzyLookup) });
      expect(editDistance('figma', 'figmae')).toBe(1);
      await expect(fuzzySearchResources('figmae', 10)).resolves.toEqual([{ id: 31, title: 'Figma', description: 'Design collaboration', categoryId: 2, pricing: 'freemium' }]);
    });

    it('keeps the named base resource unfiltered for relationship queries before narrowing final related results', () => {
      expect(shouldFilterBaseResources('Jira alternatives')).toBe(false);
      expect(shouldFilterBaseResources('Slack integrations')).toBe(false);
      expect(shouldFilterBaseResources('Figma')).toBe(true);
    });

    it('executes a filtered relationship query by resolving the base resource before returning the narrowed related node', async () => {
      const baseLookup = selectChain([{ id: 10, title: 'Jira' }], 'limit');
      const relationshipLookup = selectChain([{ sourceId: 20, targetId: 10, type: 'alternative_to', status: 'approved' }], 'orderBy');
      const relatedLookup = selectChain([{ id: 20, title: 'Linear', categoryId: 3, pricing: 'freemium' }], 'offset');
      mockGetDb.mockResolvedValue({
        select: vi.fn()
          .mockReturnValueOnce(baseLookup)
          .mockReturnValueOnce(relationshipLookup)
          .mockReturnValueOnce(relatedLookup),
      });

      const result = await searchResourcesAdvanced('Jira alternatives', 20, 0, { categoryId: 3, pricing: 'freemium', tag: 'planning' });

      expect(baseLookup.where).toHaveBeenCalledTimes(1);
      expect(relationshipLookup.where).toHaveBeenCalledTimes(1);
      expect(relatedLookup.where).toHaveBeenCalledTimes(1);
      const baseCondition = collectConditionTokens(baseLookup.where.mock.calls[0][0]);
      const finalCondition = collectConditionTokens(relatedLookup.where.mock.calls[0][0]);
      const hasToken = (tokens: string[], fragment: string) => tokens.some((token) => token.toLowerCase().includes(fragment));
      expect(hasToken(baseCondition, 'category')).toBe(false);
      expect(hasToken(baseCondition, 'pricing')).toBe(false);
      expect(hasToken(baseCondition, 'planning')).toBe(false);
      expect(hasToken(finalCondition, 'category')).toBe(true);
      expect(hasToken(finalCondition, 'pricing')).toBe(true);
      expect(hasToken(finalCondition, 'planning')).toBe(true);
      expect(result).toEqual([{ id: 20, title: 'Linear', categoryId: 3, pricing: 'freemium' }]);
    });
  });
});
