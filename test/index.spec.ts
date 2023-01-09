import { myPackage, World } from '../src';

describe('index', () => {
  describe('myPackage', () => {
    it('should return a string containing the message', () => {
      const message = 'Hello';

      const result = myPackage(message);

      expect(result).toMatch(message);
    });
  });

  describe('World', () => {
    it('should return a string containing the message', () => {
      const message = 'Hello';

      const result = World(message);

      expect(result).toMatch(message);
    });
  });
});
