import { validators } from '../../src/utils/validators';

describe('validators', () => {
  describe('email', () => {
    it('should validate correct email', () => {
      expect(validators.email('test@example.com')).toBe(true);
      expect(validators.email('user.name@domain.co.uk')).toBe(true);
    });

    it('should invalidate incorrect email', () => {
      expect(validators.email('invalid')).toBe(false);
      expect(validators.email('test@')).toBe(false);
      expect(validators.email('@example.com')).toBe(false);
      expect(validators.email('test @example.com')).toBe(false);
    });
  });

  describe('password', () => {
    it('should validate password with min length', () => {
      expect(validators.password('password123')).toBe(true);
      expect(validators.password('12345678')).toBe(true);
    });

    it('should invalidate short password', () => {
      expect(validators.password('short')).toBe(false);
      expect(validators.password('1234567')).toBe(false);
    });
  });

  describe('required', () => {
    it('should validate non-empty string', () => {
      expect(validators.required('test')).toBe(true);
      expect(validators.required('  test  ')).toBe(true);
    });

    it('should invalidate empty string', () => {
      expect(validators.required('')).toBe(false);
      expect(validators.required('   ')).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should validate string with min length', () => {
      expect(validators.minLength('test', 3)).toBe(true);
      expect(validators.minLength('test', 4)).toBe(true);
    });

    it('should invalidate string below min length', () => {
      expect(validators.minLength('te', 3)).toBe(false);
    });
  });

  describe('maxLength', () => {
    it('should validate string within max length', () => {
      expect(validators.maxLength('test', 5)).toBe(true);
      expect(validators.maxLength('test', 4)).toBe(true);
    });

    it('should invalidate string exceeding max length', () => {
      expect(validators.maxLength('testing', 5)).toBe(false);
    });
  });

  describe('phone', () => {
    it('should validate correct phone number', () => {
      expect(validators.phone('1234567890')).toBe(true);
      expect(validators.phone('+1234567890')).toBe(true);
      expect(validators.phone('123-456-7890')).toBe(true);
      expect(validators.phone('(123) 456-7890')).toBe(true);
    });

    it('should invalidate incorrect phone number', () => {
      expect(validators.phone('123')).toBe(false);
      expect(validators.phone('abc')).toBe(false);
    });
  });
});
