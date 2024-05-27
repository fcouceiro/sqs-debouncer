import { expect } from 'chai';
import { IndexKeySpace } from './keyspace.js';

describe('IndexKeySpace', () => {
  it('getGroupKeyspace should return correct keyspace', () => {
    const indexKeySpace = new IndexKeySpace('testName');
    expect(indexKeySpace.getGroupKeyspace()).to.equal('index/testName/groups');
  });

  it('getGroupKey should return correct key for groupId', () => {
    const indexKeySpace = new IndexKeySpace('testName');
    const groupId = 'group1';
    expect(indexKeySpace.getGroupKey(groupId)).to.equal(
      'index/testName/groups/group1.entry'
    );
  });

  it('getEntryKeyspace should return correct keyspace for groupId', () => {
    const indexKeySpace = new IndexKeySpace('testName');
    const groupId = 'group1';
    expect(indexKeySpace.getEntryKeyspace(groupId)).to.equal(
      'index/testName/entries/by-group/group1'
    );
  });

  it('getEntryKey should return correct key for groupId and entryId', () => {
    const indexKeySpace = new IndexKeySpace('testName');
    const groupId = 'group1';
    const entryId = 'entry1';
    expect(indexKeySpace.getEntryKey(groupId, entryId)).to.equal(
      'index/testName/entries/by-group/group1/entry1.entry'
    );
  });

  it('getIdFromKey should return correct id from key', () => {
    const indexKeySpace = new IndexKeySpace('testName');
    const key = 'index/testName/entries/by-group/group1/entry1.entry';
    expect(indexKeySpace.getIdFromKey(key)).to.equal('entry1');
  });

  it('getIdFromKey should return correct id from group key', () => {
    const indexKeySpace = new IndexKeySpace('testName');
    const key = 'index/testName/groups/group1.entry';
    expect(indexKeySpace.getIdFromKey(key)).to.equal('group1');
  });
});
