# deta-queue

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]

> Queue for use with deta base.

## Install

```bash
npm install deta-queue
```

## Usage

```ts
import { Queue } from 'deta-queue';
import { Deta } from 'deta';

// Initialize with a Project Key
const deta = Deta(process.env.DETA_PROJECT_KEY); 

const queue = new Queue(deta);

async function main() {

	await queue.empty();

	const items = ["test1", "test2", "test3", "test4", "test5"]

	for (let index = 0; index < items.length; index++) {
		const element = items[index];
		await queue.push(element);
	}

	const item = queue.pop(1);

	console.log(item);
}

main();
//=> 'test1'
```

## API

### Queue(deta: Deta, ttl?: number = 60*60*24*14, queueName?: string = "queue")

#### deta

Type: `object`

Deta object

#### ttl

Type: `number`

expireIn for the Deta Base Item

##### queueName

Type: `string`
Default: `queue`

Base Name for the Queue Deta Bases

[build-img]:https://github.com/tuefekci/deta-queue/actions/workflows/release.yml/badge.svg
[build-url]:https://github.com/tuefekci/deta-queue/actions/workflows/release.yml
[downloads-img]:https://img.shields.io/npm/dt/deta-queue
[downloads-url]:https://www.npmtrends.com/deta-queue
[npm-img]:https://img.shields.io/npm/v/deta-queue
[npm-url]:https://www.npmjs.com/package/deta-queue
[issues-img]:https://img.shields.io/github/issues/tuefekci/deta-queue
[issues-url]:https://github.com/tuefekci/deta-queue/issues
[codecov-img]:https://codecov.io/gh/tuefekci/deta-queue/branch/main/graph/badge.svg
[codecov-url]:https://codecov.io/gh/tuefekci/deta-queue
[semantic-release-img]:https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]:https://github.com/semantic-release/semantic-release
[commitizen-img]:https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]:http://commitizen.github.io/cz-cli/
