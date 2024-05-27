import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand
} from '@aws-sdk/client-s3';
import { ConnectorS3 } from '../unique-index/connectors/s3.js';
import { UniqueIndex } from '../unique-index/uniqueIndex.js';

export class S3Mocks {
  public s3Client: S3Client;
  public s3Dao: ConnectorS3;
  public uniqueIndex: UniqueIndex;

  constructor(
    public bucketName: string,
    public indexName: string,
    public region = 'us-east-1'
  ) {}

  async init() {
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: 'http://localhost:4566',
      forcePathStyle: true
    });
    this.s3Dao = new ConnectorS3(this.s3Client, this.bucketName);
    this.uniqueIndex = new UniqueIndex({
      name: this.indexName,
      connector: this.s3Dao
    });
    await this.s3Client.send(
      new CreateBucketCommand({ Bucket: this.bucketName })
    );
  }

  async clear() {
    await this.s3Client.send(
      new DeleteBucketCommand({ Bucket: this.bucketName })
    );
  }

  async clearIndexFiles() {
    const keys = [];
    for await (const key of this.s3Dao.list(`index/${this.indexName}/`)) {
      keys.push(...key);
    }
    await this.s3Dao.deleteMany(keys);
  }
}
