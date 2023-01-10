import { Queue } from '../src';

require('dotenv-safe').config();

const { Deta } = require('deta'); // import Deta
// Initialize with a Project Key
const deta = Deta(process.env.DETA_PROJECT_KEY); 

describe('index', () => {
  describe('New Queue', () => {
    it('should return Queue', async() => {
      const queue = new Queue(deta);
      expect(typeof queue).toBe("object");
    });
  });
});
