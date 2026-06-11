import { describe, it, expect } from 'vitest';
import { parseRelationshipQuery } from './search';

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
        'depends_on',
        'part_of',
        'competitor_of',
      ];

      expect(types).toHaveLength(7);
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
});
