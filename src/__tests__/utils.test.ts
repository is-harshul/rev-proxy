import { Utils } from '../utils';

describe('Utils', () => {
  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(Utils.validateUrl('example.com')).toEqual({ isValid: true });
      expect(Utils.validateUrl('subdomain.example.com')).toEqual({ isValid: true });
      expect(Utils.validateUrl('test-staging.example.com')).toEqual({ isValid: true });
    });

    it('should reject invalid URLs', () => {
      expect(Utils.validateUrl('')).toEqual({ isValid: false, error: 'URL is required' });
      expect(Utils.validateUrl('a')).toEqual({ isValid: false, error: 'URL must be at least 3 characters long' });
      expect(Utils.validateUrl('invalid..url')).toEqual({ isValid: false, error: 'Invalid URL format' });
    });
  });

  describe('validatePort', () => {
    it('should validate correct ports', () => {
      expect(Utils.validatePort(80)).toEqual({ isValid: true });
      expect(Utils.validatePort(3000)).toEqual({ isValid: true });
      expect(Utils.validatePort(65535)).toEqual({ isValid: true });
    });

    it('should reject invalid ports', () => {
      expect(Utils.validatePort(0)).toEqual({ isValid: false, error: 'Port must be a number between 1 and 65535' });
      expect(Utils.validatePort(65536)).toEqual({ isValid: false, error: 'Port must be a number between 1 and 65535' });
      expect(Utils.validatePort(-1)).toEqual({ isValid: false, error: 'Port must be a number between 1 and 65535' });
    });
  });

  describe('generateNginxBlock', () => {
    it('should generate correct nginx block', () => {
      const block = Utils.generateNginxBlock('example.com', 3000);
      expect(block).toContain('server_name example.com;');
      expect(block).toContain('proxy_pass http://127.0.0.1:3000;');
      expect(block).toContain('listen 80;');
      expect(block).toContain('location / {');
    });
  });

  describe('generateHostsEntry', () => {
    it('should generate correct hosts entry', () => {
      const entry = Utils.generateHostsEntry('example.com');
      expect(entry).toBe('127.0.0.1 example.com');
    });
  });
});
