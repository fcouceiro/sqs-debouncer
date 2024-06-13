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

### Indexed Storage

_sqs-debouncer_ indexes your messages using an Indexed Storage of choice (only S3 is implemented at the moment, DynamoDB and Redis are on the roadmap - ping us if you'd like to contribute). Those messages are then dispatched to the output queue at fixed intervals producing the debounced effect:

![sqs-debouncer](https://github.com/fcouceiro/sqs-debouncer/assets/3154879/a27eb91a-22cf-41fe-ae0b-d48ad06bd509)

### Mapping input messages

Based on your message content you can derive an `entryId` and a `groupId` wich are then used during deduplication. Messages are stored and deduped within the group (it can be a tenant id for instance) by `entryId`. If you do not need groups, use a fixed value (e.g. `no_group`).

![sqs-debouncer-2](https://github.com/fcouceiro/sqs-debouncer/assets/3154879/a5b3b67a-90b6-4fe9-a2db-9869ea3cee07)

Deduplication is achieved by indexing multiple messages under the same (groupId, entryId) pair.

### Debouncing

Then at the intended debounce rate (e.g. using a cron job - [see an example](examples/inbound-webhooks/cron.ts)) all indexed entries can be dispatched to the output queue. Firstly groups are listed and then for each group all entries are listed (i.e. fetched from Indexed Storage). A single message or multiple messages can be dispatched to the output queue for each group of deduped entries - this feature enables use cases where we would want only one message per group containing all entries (i.e. batched entries) or multiple messages, one for each entry within the group. **In any case, entries are deduped within the group for the intended debounce rate.**

Fetching entries from the IndexedStorage comes in two flavours:

1. Including a payload (`DispatchMode: "withPayload"`)
2. Group Id and Entry Id only (`DispatchMode: "onlyIds"`)

When setting up a Debouncer instance this behaviour can be configured using the [mode](https://fcouceiro.github.io/sqs-debouncer/interfaces/DebouncerOptions.html#mode) option. Using `DispatchMode: "withPayload"` may incur additional round trips to the IndexedStorage depending on the implementation (e.g. using S3 an additional GET operation is performed for each entry to retrieve its payload).

> **Note:** > _sqs-debouncer_ uses [sqs-consumer](https://github.com/bbc/sqs-consumer) under the hood to process messages from the input queue. This library is heavily inspired by sqs-consumer and we would like to thank their authors and maintainers!

## Usage

Setup an IndexedStorage based on an existing connector (e.g S3) or build your own:

```typescript
const indexedStorage = new UniqueIndex({
  name: 'inbound-webhooks',
  connector: new ConnectorS3(s3Client, S3_BUCKET_NAME)
});
```

Implement your logic around message mapping. Map input messages to (groupId, entryId) pairs ([see how it works](#mapping-input-messages)) optionally including a payload. Map deduped entries to a single or multiple output messages ([see how it works](#debouncing)). Snippet based on [inbound webhooks](/examples/inbound-webhooks/) exampe:

```typescript
const messageMapper: MessageMapper = {
  mapInputMessage: async ({ tenantId, webhookId, data }) => {
    return {
      groupId: tenantId,
      entryId: webhookId,
      payload: data
    };
  },
  mapOutputMessages: async (groupId, entriesIds, payloadsByEntryId) => {
    // Send one output message per deduped entry
    return entriesIds.map((entryId) => {
      return {
        tenantId: Number(groupId),
        webhookId: Number(entryId),
        data: payloadsByEntryId[entryId]
      };
    });
  }
};
```

Create a Debouncer instance that can be reused across your stack by providing the input and output SQS Queues, index storage, message mapper and the [DispatchMode](https://fcouceiro.github.io/sqs-debouncer/interfaces/DebouncerOptions.html#mode) suitable for your use case:

```typescript
const debouncer = new Debouncer({
  mode: 'withPayload',
  index: indexedStorage,
  inputQueueUrl: SQS_QUEUE_URL,
  outputQueueUrl: SQS_DEBOUNCED_QUEUE_URL,
  messageMapper: messageMapper,
  sqs: sqsClient
});
```

See the included [inbound webhooks](/examples/inbound-webhooks/) example for a full reference on how to use Debouncer end-to-end. This example includes an express.js endpoint that enqueues Input messages, a worker job that continuously processes input messages and stores them in the IndexedStorage and a cron job that debounces (as in "dispatches") indexed entries to the Output queue.

## API

TODO: describe top level methods and usage.

See [our reference documentation](<(https://fcouceiro.github.io/sqs-debouncer/)>) for full API docs in the meantime.

## Contributing

We welcome and appreciate contributions for anyone who would like to take the time to fix a bug or implement a new feature.

## License

_sqs-debouncer_ is distributed under the MIT License, see [LICENSE](https://github.com/fcouceiro/sqs-debouncer/blob/main/LICENSE) for more information.
