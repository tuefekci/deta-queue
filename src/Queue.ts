import { resolve } from "dns";

var sample = require('lodash/sample');

export default class Queue {
    private queueBase: any;
    private logBase: any;
    private statBase: any;
    private ttl: number;

    constructor(deta: any, ttl: number = 60*60*24*14, queueName: string = "queue") {
        this.queueBase = deta.Base(queueName);
        this.logBase = deta.Base(queueName+"Log");
        this.statBase = deta.Base(queueName+"Stat");
		this.ttl = ttl;
    }

	generateLowKey() {
		const smallNumber = 0;
		const timestamp = Date.now();
		return `${ smallNumber + timestamp}`
	}

	generateHighKey() {
		const bigNumber = 8.64e15;
		const timestamp = Date.now();
		return `${ bigNumber - timestamp}`
	}

    async push(item: any, queue: string = "deta-queue-default"): Promise<void> {
        // Insert the item into the database
		await this.queueBase.put({
			timestamp: Date.now(),
			queue: queue,
			payload: item
		}, this.generateLowKey(), {expireIn: this.ttl});

		try {
			await this.statBase.insert({}, queue);
		} catch (error) {
		}

		await this.statBase.update({
			lastPush: Date.now(),
			items: this.statBase.util.increment(1)
		}, queue);

    }

    async pop(limit:number = 10, queue: string = "deta-queue-default"): Promise<any | undefined> {
		const { items: items } = await this.queueBase.fetch({
			queue: queue,
		}, {limit: limit});

		const item = sample(items);

        if (item) {
            // Remove the item from the database
			await this.queueBase.delete(item.key);

			try {
				await this.statBase.insert({}, queue);
			} catch (error) {
			}

			await this.statBase.update({
				lastPop: Date.now(),
				items: this.statBase.util.increment(-1)
			}, queue, {});

			await this.logBase.put({
				timestamp: Date.now(),
				queue: item.queue,
				payload: item.payload
			}, this.generateHighKey()) 

            return item.payload;
        }
        return undefined; 
    }

    async process(worker: (item: any) => void, concurrency = 1): Promise<void> {
        let running = 0;

        const next = async () => {
            if (running < concurrency) {
                running++;

                const item = await this.pop();
                if (item) {
                    await worker(item);
                    running--;
                    next();
                } else {
                    running--;
                }
            }
        };

        next();
    }

	private async emptyBase(base) {
		let res = await base.fetch();
		let allItems = res.items;
		
		// continue fetching until last is not seen
		while (res.last){
		  res = await base.fetch({}, {last: res.last});
		  allItems = allItems.concat(res.items);
		}

		for (let index = 0; index < allItems.length; index++) {
			const item = allItems[index];
			await base.delete(item.key);
		}
	}

	async empty(): Promise<void> {
		try {
			await this.emptyBase(this.queueBase);
			await this.emptyBase(this.statBase);
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	}
}