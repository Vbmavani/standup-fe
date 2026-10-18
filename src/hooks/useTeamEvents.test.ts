import { describe, expect, it } from 'vitest';
import { keysForEvent } from './useTeamEvents';

describe('keysForEvent', () => {
  it('maps each SSE event to the query keys to invalidate', () => {
    expect(keysForEvent('tasks', 't')).toEqual([['tasks', 't']]);
    expect(keysForEvent('standups', 't')).toEqual([['standups', 't']]);
    expect(keysForEvent('activity', 't')).toEqual([
      ['activity', 't'],
      ['summary', 't'],
    ]);
    expect(keysForEvent('team', 't')).toEqual([['team', 't'], ['teams']]);
    expect(keysForEvent('members', 't')).toEqual([['team', 't'], ['teams'], ['standups', 't']]);
  });
});
