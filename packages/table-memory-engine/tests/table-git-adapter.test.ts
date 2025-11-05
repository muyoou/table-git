// @ts-ignore: use root build output during local development
import { TableGit } from '../../../dist';
import { TableGitAdapter } from '../src';

describe('TableGitAdapter', () => {
  it('applies set and snapshot commands', async () => {
    const engine = new TableGit();
    engine.init('main', { defaultSheetName: 'memory' });

    const adapter = new TableGitAdapter({ tableGit: engine, defaultSheetId: 'memory', autoInit: false });

    const snapshot = await adapter.applyChanges('memory', [
      {
        type: 'set',
        sheetId: 'memory',
        payload: { row: 0, column: 0, value: 'Hello' }
      }
    ]);

    expect(snapshot.rows[0][0]).toBe('Hello');
    expect(snapshot.sheetId).toBe('memory');

    const refreshed = await adapter.snapshot('memory');
    expect(refreshed.rows[0][0]).toBe('Hello');
  });
});
