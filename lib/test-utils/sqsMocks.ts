import {
  SQSClient,
  CreateQueueCommand,
  DeleteQueueCommand
} from '@aws-sdk/client-sqs';

export class SQSMocks {
  public sqsClient: SQSClient;
  public sqsQueueUrl: string;
  public sqsDebouncedQueueUrl: string;

  constructor(
    public queueName: string,
    public debouncedQueueName: string,
    public region = 'us-east-1'
  ) {}

  async init() {
    this.sqsClient = new SQSClient({
      region: this.region,
      endpoint: 'http://localhost:4566'
    });

    let result = await this.sqsClient.send(
      new CreateQueueCommand({ QueueName: this.queueName })
    );
    this.sqsQueueUrl = result.QueueUrl;
    result = await this.sqsClient.send(
      new CreateQueueCommand({ QueueName: this.debouncedQueueName })
    );
    this.sqsDebouncedQueueUrl = result.QueueUrl;
  }

  async clear() {
    await this.sqsClient.send(
      new DeleteQueueCommand({ QueueUrl: this.sqsQueueUrl })
    );
    await this.sqsClient.send(
      new DeleteQueueCommand({ QueueUrl: this.sqsDebouncedQueueUrl })
    );
  }
}
