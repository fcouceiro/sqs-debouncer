import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';

import { Debouncer } from '../../lib/deouncer.js';
import { UniqueIndex } from '../../lib/unique-index/uniqueIndex.js';
import { ConnectorS3 } from '../../lib/unique-index/connectors/s3.js';

const s3Client = new S3Client({
  region: 'your-region'
});
const S3_BUCKET_NAME = 'your-s3-bucket-name';

const sqsClient = new SQSClient({
  region: 'your-region'
});
export const SQS_QUEUE_URL = 'your-sqs-queue-url';
export const SQS_DEBOUNCED_QUEUE_URL = 'your-sqs-debounced-queue-url';

const debouncer = new Debouncer({
  mode: 'withPayload',
  index: new UniqueIndex({
    name: 'inbound-webhooks',
    connector: new ConnectorS3(s3Client, S3_BUCKET_NAME)
  }),
  inputQueueUrl: SQS_QUEUE_URL,
  outputQueueUrl: SQS_DEBOUNCED_QUEUE_URL,
  messageMapper: {
    mapInputMessage: async ({ tenantId, webhookId, data }) => {
      return {
        groupId: tenantId,
        entryId: webhookId,
        payload: data
      };
    },
    mapOutputMessages: async (groupId, entriesIds, payloadsByEntryId) => {
      return entriesIds.map((entryId) => {
        return {
          tenantId: Number(groupId),
          webhookId: Number(entryId),
          data: payloadsByEntryId[entryId]
        };
      });
    }
  },
  sqs: sqsClient
});

export default debouncer;
