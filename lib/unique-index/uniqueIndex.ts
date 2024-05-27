import {
  IndexedStorage,
  IndexedStorageConnector,
  IndexedStorageOptions,
  MessagePayload
} from '../types.js';
import { IndexKeySpace } from './keyspace.js';

/**
 * Messages are grouped and deduplicated using a unique index. It can be seen as a database, although we are trying to provide connectors with other scalable systems like AWS S3 or AWS DynamoDB.
 */
export class UniqueIndex implements IndexedStorage {
  public keyspace: IndexKeySpace;
  public name: string;
  private connector: IndexedStorageConnector;

  constructor(options: IndexedStorageOptions) {
    this.name = options.name;
    this.connector = options.connector;
    this.keyspace = new IndexKeySpace(this.name);
  }

  async add(groupId: string, entryId: string, payload: MessagePayload) {
    await Promise.all([
      this.connector.put(this.keyspace.getGroupKey(groupId)),
      this.connector.put(this.keyspace.getEntryKey(groupId, entryId), payload)
    ]);
  }

  async *listGroups() {
    const keyPrefix = `${this.keyspace.getGroupKeyspace()}/`;

    for await (const keys of this.connector.list(keyPrefix)) {
      const groupIds = keys.filter(Boolean).map(this.keyspace.getIdFromKey);
      yield groupIds;
    }
  }

  async *listEntries(groupId: string) {
    const keyPrefix = `${this.keyspace.getEntryKeyspace(groupId)}/`;

    for await (const keys of this.connector.list(keyPrefix)) {
      const entriesIds = keys.map(this.keyspace.getIdFromKey);
      yield entriesIds;
    }
  }

  async loadEntriesPayloads(
    groupId: string,
    entriesIds: string[]
  ): Promise<Record<string, MessagePayload>> {
    const keys = entriesIds.map((entryId) => {
      return this.keyspace.getEntryKey(groupId, entryId);
    });
    const entries = await this.connector.getMany(keys);

    return entries.reduce((byId, entry, idx) => {
      const id = this.keyspace.getIdFromKey(entry.key);
      return {
        ...byId,
        [id]: entry.payload
      };
    }, {});
  }
}
