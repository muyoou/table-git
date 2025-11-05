// @ts-ignore: use root build output during local development
import { TableGit } from '../../../dist';
import { FlowBuilder, NodeRuntime, TableGitAdapter, registerBuiltinNodes } from '../src';

describe('NodeRuntime', () => {
  it('executes a basic flow', async () => {
    const tableGit = new TableGit();
    tableGit.init('main', { defaultSheetName: 'test' });

    const runtime = new NodeRuntime({
      adapter: new TableGitAdapter({ tableGit, defaultSheetId: 'test', autoInit: false })
    });

    registerBuiltinNodes(runtime);

    const flow = FlowBuilder.create('spec-flow')
      .useNode('LoadTable', { sheetId: 'test' })
      .useNode('ParseTags')
      .useNode('ApplyChanges')
      .useNode('FormatPrompt', { formatter: 'prompt' })
      .build();

    const result = await runtime.run(flow, {
      conversation: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: '[[table:setCell sheet=test row=0 column=0 value="Spec"]]'
        }
      ],
      sheetId: 'test',
      services: {}
    });

  const snapshot = result.context.variables?.lastSnapshot as { rows?: unknown[][] } | undefined;
  expect(snapshot?.rows?.[0]?.[0]).toBe('Spec');
    expect(typeof result.context.variables?.formatted).toBe('string');
  });
});
