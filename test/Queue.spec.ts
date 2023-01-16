import { Queue } from '../src';
const { Deta } = require('deta'); // import Deta


  describe("constructor()", () => {
    let deta: typeof Deta;

    beforeEach(() => {
      deta = {
        Base: jest.fn(() => ({}))
      };
    });

    it("should initialize the queueBase, logBase, and statBase with the provided queueName", () => {
      const queueName = "test-queue";
      const queue = new Queue(deta, 0, queueName);

      expect(deta.Base).toHaveBeenCalledWith(queueName);
      expect(deta.Base).toHaveBeenCalledWith(`${queueName}Log`);
      expect(deta.Base).toHaveBeenCalledWith(`${queueName}Stat`);
      expect(queue.queueBase).toBeDefined();
      expect(queue.logBase).toBeDefined();
      expect(queue.statBase).toBeDefined();
    });

    it("should initialize the ttl with the provided ttl value", () => {
      const ttl = 86400;
      const queue = new Queue(deta, ttl);

      expect(queue.ttl).toEqual(ttl);
    });

    it("should set default values for queueName and ttl if none are provided", () => {
      const queue = new Queue(deta);

      expect(deta.Base).toHaveBeenCalledWith("queue");
      expect(queue.ttl).toEqual(60 * 60 * 24 * 14);
    });
  });

  describe("generateLowKey()", () => {

    let queue: Queue;
    let queueBaseMock: any;
    let statBaseMock: any;
    let logBaseMock: any;
  
    beforeEach(() => {
      queueBaseMock = {
        put: jest.fn(),
        fetch: jest.fn(),
        delete: jest.fn(),
      };
      statBaseMock = {
        put: jest.fn(),
        insert: jest.fn(),
        update: jest.fn()
      };
      logBaseMock = {
        put: jest.fn()
      };
  
      const detaMock = {
        Base: jest.fn().mockImplementation((baseName: string) => {
          if (baseName === 'queue') {
            return queueBaseMock;
          } else if (baseName === 'queueLog') {
            return logBaseMock;
          } else if (baseName === 'queueStat') {
            return statBaseMock;
          }
        })
      };
  
      queue = new Queue(detaMock);
    });

    it("should return a unique key using the current timestamp in a low range", () => {
      const lowKey = queue.generateLowKey();
      expect(lowKey).toMatch(/^\d+$/);
      expect(parseInt(lowKey)).toBeLessThan(BigInt(Date.now() + 1000));
    });
  });
  
  describe("generateHighKey()", () => {

    let queue: Queue;
    let queueBaseMock: any;
    let statBaseMock: any;
    let logBaseMock: any;
  
    beforeEach(() => {
      queueBaseMock = {
        put: jest.fn(),
        fetch: jest.fn(),
        delete: jest.fn(),
      };
      statBaseMock = {
        put: jest.fn(),
        insert: jest.fn(),
        update: jest.fn()
      };
      logBaseMock = {
        put: jest.fn()
      };
  
      const detaMock = {
        Base: jest.fn().mockImplementation((baseName: string) => {
          if (baseName === 'queue') {
            return queueBaseMock;
          } else if (baseName === 'queueLog') {
            return logBaseMock;
          } else if (baseName === 'queueStat') {
            return statBaseMock;
          }
        })
      };
  
      queue = new Queue(detaMock);
    });

    it("should return a unique key using the current timestamp in a high range", () => {
      const highKey = queue.generateHighKey();
      expect(highKey).toMatch(/^\d+$/);
      expect(parseInt(highKey)).toBeGreaterThan(BigInt(8.64e15 - Date.now() - 1000));
    });
  });
  

  describe("push()", () => {
    let queue: Queue;
    let queueBaseMock: any;
    let statBaseMock: any;
    let logBaseMock: any;
  
    beforeEach(() => {
      queueBaseMock = {
        put: jest.fn(),
        fetch: jest.fn(),
        delete: jest.fn(),
      };
      statBaseMock = {
        put: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        util: {
          increment: jest.fn()
        }
      };
      logBaseMock = {
        put: jest.fn()
      };
  
      const detaMock = {
        Base: jest.fn().mockImplementation((baseName: string) => {
          if (baseName === 'queue') {
            return queueBaseMock;
          } else if (baseName === 'queueLog') {
            return logBaseMock;
          } else if (baseName === 'queueStat') {
            return statBaseMock;
          }
        })
      };
  
      queue = new Queue(detaMock);
    });
  
    it("should insert the item into the queueBase and update the statBase", async () => {
      const item = {};
      const queueName = "test-queue";
      await queue.push(item, queueName);
  
      expect(queueBaseMock.put).toHaveBeenCalledWith({ timestamp: expect.any(Number), queue: queueName, payload: item }, expect.any(String), { expireIn: expect.any(Number) });
      expect(statBaseMock.insert).toHaveBeenCalledWith({}, queueName);
      expect(statBaseMock.update).toHaveBeenCalledWith({ lastPush: expect.any(Number) }, queueName);
    });
  });
  
  describe('pop', () => {
    let queue: Queue;
    let queueBaseMock: any;
    let statBaseMock: any;
    let logBaseMock: any;
    let sampleMock: any;
  
    beforeEach(() => {
      queueBaseMock = {
        put: jest.fn(),
        fetch: jest.fn().mockResolvedValue({ items: [{ key: "item1", payload: "item1" }] }),
        delete: jest.fn()
      };
      statBaseMock = {
        get: jest.fn(),
        put: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        util: {
          increment: jest.fn()
        }
      };
      logBaseMock = {
        put: jest.fn(),
        delete: jest.fn()
      };
  
      const detaMock = {
        Base: jest.fn().mockImplementation((baseName: string) => {
          if (baseName === 'queue') {
            return queueBaseMock;
          } else if (baseName === 'queueLog') {
            return logBaseMock;
          } else if (baseName === 'queueStat') {
            return statBaseMock;
          }
        })
      };

      queue = new Queue(detaMock);
    });
  
    it("should pop an item from the queue and return its payload", async () => {
        // setup the queue with some items
        await queue.push("item1", "test-queue");
        await queue.push("item2", "test-queue");
        await queue.push("item3", "test-queue");

        // pop an item from the queue
        const item = await queue.pop(1, "test-queue");

        // assert that an item was returned and it's payload is as expected
        expect(item).toBeDefined();
        expect(item).toBe("item1");
    });
  

});

