import { Queue } from '../src';

require('dotenv-safe').config();

const { Deta } = require('deta'); // import Deta
// Initialize with a Project Key
const deta = Deta(process.env.DETA_PROJECT_KEY); 

describe('Queue', () => {
	describe('Construct', () => {
		it('should return Queue Object', async() => {
			const queue = new Queue(deta);
			expect(typeof queue).toBe("object");
		});
	});

  describe('Empty Queue', () => {
    it('should resolve', async() => {
      const queue = new Queue(deta);
      await queue.empty();
      expect(queue.pop()).resolves.toEqual(undefined);
    });
  });

  describe('Push', () => {
    it('should resolve', async() => {
      const queue = new Queue(deta);
      await queue.empty();
      expect(queue.push("test")).resolves;
    });
  });

  describe('Pop', () => {
    it('should resolve', async() => {
      const queue = new Queue(deta);
      await queue.empty();
	  await queue.push("test");

      expect(await queue.pop()).toMatch("test");
    });
  });

  describe('Pop with high Limit', () => {
    it('should resolve', async() => {
      	const queue = new Queue(deta);
      	await queue.empty();

	  	const items = ["test1", "test2", "test3", "test4", "test5"]

		for (let index = 0; index < items.length; index++) {
			const element = items[index];
			await queue.push(element);
		}

      	expect(items).toContain(await queue.pop());
    });
  });

});

