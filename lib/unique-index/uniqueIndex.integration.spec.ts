import { expect } from 'chai';
import { S3Mocks } from '../test-utils/s3Mocks.js';

describe('UniqueIndex Integration Tests with S3', () => {
  let s3Mocks: S3Mocks;

  before(async () => {
    s3Mocks = new S3Mocks('test-bucket', 'test-index');
    await s3Mocks.init();
  });

  after(async () => {
    await s3Mocks.clear();
  });

  afterEach(async () => {
    await s3Mocks.clearIndexFiles();
  });

  it('should add and list groups correctly', async () => {
    const groupId = 'group1';
    const entryId = 'entry1';
    const payload = { data: 'payload' };

    await s3Mocks.uniqueIndex.add(groupId, entryId, payload);

    const groups = [];
    for await (const groupIds of s3Mocks.uniqueIndex.listGroups()) {
      groups.push(...groupIds);
    }

    expect(groups).to.include(groupId);
  });

  it('should add and list entries correctly', async () => {
    const groupId = 'group1';
    const entryId1 = 'entry1';
    const entryId2 = 'entry2';
    const payload1 = { data: 'payload1' };
    const payload2 = { data: 'payload2' };

    await s3Mocks.uniqueIndex.add(groupId, entryId1, payload1);
    await s3Mocks.uniqueIndex.add(groupId, entryId2, payload2);

    const entries = [];
    for await (const entryIds of s3Mocks.uniqueIndex.listEntries(groupId)) {
      entries.push(...entryIds);
    }

    expect(entries).to.include(entryId1);
    expect(entries).to.include(entryId2);
  });

  it('should handle duplicate entries for the same group correctly', async () => {
    const groupId = 'group1';
    const entryId = 'entry1';
    const payload1 = { data: 'payload1' };
    const payload2 = { data: 'payload2' };

    await s3Mocks.uniqueIndex.add(groupId, entryId, payload1);
    await s3Mocks.uniqueIndex.add(groupId, entryId, payload2);

    const entries = [];
    for await (const entryIds of s3Mocks.uniqueIndex.listEntries(groupId)) {
      entries.push(...entryIds);
    }

    expect(entries).to.include(entryId);
    expect(entries.length).to.equal(1);
  });

  it('should delete an entry and assert list is empty', async () => {
    const groupId = 'group1';
    const entryId = 'entry1';
    const payload = { data: 'payload' };

    await s3Mocks.uniqueIndex.add(groupId, entryId, payload);

    const entryKey = s3Mocks.uniqueIndex.keyspace.getEntryKey(groupId, entryId);
    await s3Mocks.s3Dao.deleteMany([entryKey]);

    const entries = [];
    for await (const entryIds of s3Mocks.uniqueIndex.listEntries(groupId)) {
      entries.push(...entryIds);
    }

    expect(entries).to.not.include(entryId);
    expect(entries.length).to.equal(0);
  });
});
