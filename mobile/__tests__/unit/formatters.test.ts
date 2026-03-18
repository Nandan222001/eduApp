import { formatters } from '../../src/utils/formatters';

describe('formatters', () => {
  describe('date', () => {
    it('should format date object', () => {
      const date = new Date('2024-01-15');
      const result = formatters.date(date);
      expect(result).toContain('2024');
      expect(result).toContain('January');
    });

    it('should format date string', () => {
      const result = formatters.date('2024-01-15');
      expect(result).toContain('2024');
    });
  });

  describe('dateTime', () => {
    it('should format date time', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatters.dateTime(date);
      expect(result).toContain('2024');
      expect(result).toContain('10:30');
    });
  });

  describe('time', () => {
    it('should format time', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatters.time(date);
      expect(result).toContain('10:30');
    });
  });

  describe('currency', () => {
    it('should format currency with default USD', () => {
      const result = formatters.currency(100);
      expect(result).toContain('$');
      expect(result).toContain('100');
    });

    it('should format currency with custom currency', () => {
      const result = formatters.currency(100, 'EUR');
      expect(result).toContain('100');
    });
  });

  describe('percentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatters.percentage(95)).toBe('95%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatters.percentage(95.5678, 2)).toBe('95.57%');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text';
      expect(formatters.truncate(text, 10)).toBe('This is a ...');
    });

    it('should not truncate short text', () => {
      const text = 'Short';
      expect(formatters.truncate(text, 10)).toBe('Short');
    });
  });
});
