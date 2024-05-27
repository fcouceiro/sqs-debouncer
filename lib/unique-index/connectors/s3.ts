import {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  S3Client
} from '@aws-sdk/client-s3';
import pLimit from 'p-limit';
import { Readable } from 'node:stream';
import { IndexedStorageConnector, MessagePayload } from '../../types.js';

export class ConnectorS3 implements IndexedStorageConnector {
  constructor(
    private s3Client: S3Client,
    private bucketName: string
  ) {}

  async put(key: string, payload: MessagePayload = {}) {
    const putParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(payload)
    };
    await this.s3Client.send(new PutObjectCommand(putParams));
  }

  async getMany(keys: string[]) {
    const limit = pLimit(10);
    const promises = keys.map((key) =>
      limit(async () => {
        const params = {
          Bucket: this.bucketName,
          Key: key
        };
        const data = await this.s3Client.send(new GetObjectCommand(params));

        const dataBuffer = await new Promise((resolve, reject) => {
          const chunks = [];
          const stream = data.Body as Readable;
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.once('end', () => resolve(Buffer.concat(chunks)));
          stream.once('error', reject);
        });

        return {
          key,
          payload: JSON.parse(dataBuffer.toString())
        };
      })
    );
    return await Promise.all(promises);
  }

  async *list(keyPrefix: string) {
    let continuationToken = null;
    do {
      const params = {
        Bucket: this.bucketName,
        Prefix: keyPrefix,
        ContinuationToken: continuationToken
      };
      const data = await this.s3Client.send(new ListObjectsV2Command(params));
      continuationToken = data.NextContinuationToken;

      const keys =
        data.KeyCount === 0 ? [] : data.Contents.map(({ Key }) => Key);
      yield keys as string[];
    } while (continuationToken);
  }

  async deleteMany(keys: string[]) {
    const deleteParams = {
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((Key) => ({ Key }))
      }
    };
    await this.s3Client.send(new DeleteObjectsCommand(deleteParams));
  }
}
