import { Deta } from 'deta';
import sample from 'lodash/sample';

export default class Queue {
    private queueBase: any;
    private logBase: any;
    private statBase: any;
    private ttl: number;

    constructor(deta: typeof Deta, ttl = 60 * 60 * 24 * 14, queueName = "queue") {
        this.queueBase = deta.Base(queueName);
        this.logBase = deta.Base(`${queueName}Log`);
        this.statBase = deta.Base(`${queueName}Stat`);
        this.ttl = ttl;
    }

	generateLowKey() {
		// Generates a unique key using the current timestamp in a low range
		return `${BigInt(Date.now())}`;
	}

	generateHighKey() {
		// Generates a unique key using the current timestamp in a high range
		return `${BigInt(8.64e15) - BigInt(Date.now())}`;
	}

	async push(item: any, queue: string = "deta-queue-default"): Promise<void> {
		// Perform all the database operations in parallel
		// Insert the item into the queueBase
		// Insert a new item into the statBase, handle any errors that occur
		// Update the lastPush timestamp and increment the items count in the statBase
		await Promise.all([
			this.queueBase.put({timestamp: Date.now(), queue: queue, payload: item}, this.generateLowKey(), {expireIn: this.ttl}),
			this.statBase.insert({}, queue),
			this.statBase.update({lastPush: Date.now(), items: this.statBase.util.increment(1)}, queue)
		]);
	}

	async pop(limit: number = 10, queue: string = "deta-queue-default"): Promise<any | undefined> {
		// Fetch a specified number of items from the queue
		const { items: items } = await this.queueBase.fetch({queue: queue}, {limit: limit});

		// Select a random item from the fetched items
		const item = sample(items);

		if (item) {
			// Perform all the database operations in parallel
			await Promise.all([
				this.queueBase.delete(item.key), // remove item from the queue
				this.statBase.insert({}, queue), // insert a new record
				this.statBase.update({lastPop: Date.now(), items: this.statBase.util.increment(-1)}, queue, {}), // update the stat base
				this.logBase.put({timestamp: Date.now(), queue: item.queue, payload: item.payload}, this.generateHighKey()) // log the item
			]);
			return item.payload; // return the item payload
		}
		return undefined; // return undefined if there is no item
	}

	async process(queue:string, worker: (item: any) => void, concurrency = 1): Promise<void> {
		const items = [];
	
		// Retrieve a specified concurrent number of items from the queue
		for (let index = 0; index < concurrency; index++) {
			const item = await this.pop(concurrency*5, queue);
			if(item) {
				items.push(item);
			}
		}
	
		// Execute the worker function on each item in parallel
		if(items) {
			await Promise.all(items.map(item => worker(item))).then(() => {
				setImmediate(() => this.process(queue, worker, concurrency));
			});
		}
	}
	

	private async emptyBase(base: any): Promise<void> {
		// Fetch the first set of items from the base
		let res = await base.fetch();
		let allItems = res.items;

		// Continue fetching items using the last property as a cursor
		// until the last property is not seen
		while (res.last){
		res = await base.fetch({}, {last: res.last});
		allItems = allItems.concat(res.items);
		}

		// Delete all items in parallel
		await Promise.all(allItems.map(item => base.delete(item.key)));
	}


	async empty(): Promise<void> {
		// Run `emptyBase` function on both `queueBase` and `statBase` in parallel
		try {
			await Promise.all([this.emptyBase(this.queueBase), this.emptyBase(this.statBase)]);
			// If both `emptyBase` functions succeed, return a resolved promise
			return Promise.resolve();
		} catch (error) {
			// If one of the `emptyBase` functions throws an error, return a rejected promise
			return Promise.reject(error);
		}
	}


}