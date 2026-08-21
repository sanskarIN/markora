import { beforeEach, describe, expect, it } from 'vitest';

import { clearFindHistory, loadFindHistory, recordFindQuery } from './findHistory';

describe('find history', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores most recent unique queries first', () => {
    recordFindQuery('alpha');
    recordFindQuery('beta');
    recordFindQuery('alpha');

    expect(loadFindHistory()).toEqual(['alpha', 'beta']);
  });

  it('ignores empty queries and bounds stored history', () => {
    recordFindQuery('   ');
    for (let index = 0; index < 15; index += 1) recordFindQuery(`query-${index}`);

    const history = loadFindHistory();
    expect(history).toHaveLength(10);
    expect(history[0]).toBe('query-14');
    expect(history.at(-1)).toBe('query-5');
  });

  it('can clear find history without affecting other storage', () => {
    localStorage.setItem('unrelated', 'keep');
    recordFindQuery('needle');
    clearFindHistory();

    expect(loadFindHistory()).toEqual([]);
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });
});
