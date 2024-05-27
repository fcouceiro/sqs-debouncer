export class IndexKeySpace {
  constructor(private name: string) {}

  getGroupKeyspace(): string {
    return `index/${this.name}/groups`;
  }

  getGroupKey(groupId: string): string {
    return `${this.getGroupKeyspace()}/${groupId}.entry`;
  }

  getEntryKeyspace(groupId: string): string {
    return `index/${this.name}/entries/by-group/${groupId}`;
  }

  getEntryKey(groupId: string, entryId: string): string {
    return `${this.getEntryKeyspace(groupId)}/${entryId}.entry`;
  }

  getIdFromKey(key): string {
    return key.split('/').pop().split('.entry')[0];
  }
}
