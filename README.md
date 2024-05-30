# sqs-debouncer

[![Build Status](https://github.com/fcouceiro/sqs-debouncer/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/fcouceiro/sqs-debouncer/actions/workflows/test.yml)

Debounce AWS SQS messages based on content. Get a unique id/hash from your message content and optionally assign it a group id. Messages with the same id/hash are deduped within the group.

## Installation

To install this package, simply enter the following command into your terminal (or the variant of whatever package manager you are using):

```bash
npm install @fcouceiro/sqs-debouncer
```

## Documentation

Visit [https://fcouceiro.github.io/sqs-debouncer/](https://fcouceiro.github.io/sqs-debouncer/) for the full API documentation.

_sqs-debouncer_ indexes your messages using an Indexed Storage of choice (only S3 is implemented at the moment, DynamoDB and Redis are on the roadmap - ping us if you'd like to contribute). Those messages can then be dispatched to the output queue at fixed intervals producing the debounced effect:

TODO: insert diagram

Based on your message content you should specify an `entryId` and a `groupId` wich are then used during deduplication. Messages are stored and deduped within the group (it can be a tenant id for instance). If you do not need groups, use a fixed value (e.g. `no_group`).

TODO: insert diagram describing indexed storage keyspace

> _sqs-debouncer_ uses [sqs-consumer](https://github.com/bbc/sqs-consumer) under the hood to process messages from the input queue. This library is heavily inspired by sqs-consumer and we would like to thank their authors and maintainers!

## Usage

TODO: insert code snippets and explanation

See the included [inbound webhooks]() example

## API

TODO: describe top level methods and usage.

See [our reference documentation](<(https://fcouceiro.github.io/sqs-debouncer/)>) for full API docs in the meantime.

## Contributing

We welcome and appreciate contributions for anyone who would like to take the time to fix a bug or implement a new feature.

## License

_sqs-debouncer_ is distributed under the MIT License, see [LICENSE](https://github.com/fcouceiro/sqs-debouncer/blob/main/LICENSE) for more information.
