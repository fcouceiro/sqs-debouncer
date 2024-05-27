import {
  SQSClient,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry
} from '@aws-sdk/client-sqs';
import { nanoid } from 'nanoid';
import pLimit from 'p-limit';
import { Consumer } from 'sqs-consumer';

import {
  MessageMapper,
  DispatchMode,
  IndexedStorage,
  DebouncerOptions,
  MessagePayload
} from './types.js';

export class Debouncer {
  public sqs: SQSClient;
  public inputQueueUrl: string;
  public outputQueueUrl: string;
  private messageMapper: MessageMapper;
  private mode: DispatchMode;
  private index: IndexedStorage;

  /**
   * Creates debouncer. See {@link createInputConsumer} on how to listen for input messages.
   * See {@link dispatchStoredMessages} on how to send messages to the output queue (e.g. from a cron trigger).
   */
  constructor(options: DebouncerOptions) {
    this.sqs = options.sqs;
    this.inputQueueUrl = options.inputQueueUrl;
    this.outputQueueUrl = options.outputQueueUrl;
    this.messageMapper = options.messageMapper;
    this.mode = options.mode;
    this.index = options.index;
  }

  /**
   * Use this consumer to start processing messages on your input queue. Example:
   *
   * ```
   * const consumer = debouncer.createInputConsumer();
   * consumer.start()
   * ```
   */
  createInputConsumer() {
    const handleMessage = async (message) => {
      const { groupId, entryId, payload } =
        await this.messageMapper.mapInputMessage(JSON.parse(message.Body));

      await this.index.add(groupId, entryId, payload);
    };

    return Consumer.create({
      sqs: this.sqs,
      queueUrl: this.inputQueueUrl,
      batchSize: 10,
      handleMessageBatch: async (messages) => {
        const results = await Promise.all(
          messages.map(async (message) => {
            try {
              await handleMessage(message);
              return message;
            } catch (error) {
              console.error(error);
            }
          })
        );

        const successful = results.filter(Boolean);
        return successful;
      }
    });
  }

  /**
   * Call this method at the rate you wish to debounce events. Example:
   *
   * ```
   * // Runs every hour at the start of the hour
   * cron.schedule("0 * * * *", async () => {
   *     // Push out all deduped messages received so far
   *     debouncer.dispatchStoredMessages();
   * });
   * ```
   */
  async dispatchStoredMessages() {
    for await (const groupIds of this.index.listGroups()) {
      for (const groupId of groupIds) {
        for await (const entriesIds of this.index.listEntries(groupId)) {
          let payloadsByEntryId = {};

          if (this.mode === 'withPayload') {
            payloadsByEntryId = await this.index.loadEntriesPayloads(
              groupId,
              entriesIds
            );
          }

          const messages = await this.messageMapper.mapOutputMessages(
            groupId,
            entriesIds,
            payloadsByEntryId
          );
          await this.enqueue(messages, this.outputQueueUrl);
        }
      }
    }
  }

  async enqueue(messages: MessagePayload[], queueUrl: string) {
    const chunkMessages = (
      messages: SendMessageBatchRequestEntry[]
    ): Array<SendMessageBatchRequestEntry[]> => {
      const chunks: Array<SendMessageBatchRequestEntry[]> = [];
      for (let i = 0; i < messages.length; i += 10) {
        chunks.push(messages.slice(i, i + 10));
      }
      return chunks;
    };

    const sqsMessages = messages.map<SendMessageBatchRequestEntry>(
      (message) => ({
        Id: nanoid(),
        MessageBody: JSON.stringify(message)
      })
    );

    const limit = pLimit(5);
    await Promise.all(
      chunkMessages(sqsMessages).map((chunk) =>
        limit(async () => {
          const params = {
            QueueUrl: queueUrl,
            Entries: chunk
          };
          await this.sqs.send(new SendMessageBatchCommand(params));
        })
      )
    );
  }
}
