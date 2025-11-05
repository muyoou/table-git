import { FlowBuilder, NodeRuntime, TableGitAdapter, registerBuiltinNodes } from '../src';
// @ts-ignore: use root build output during local development
import { TableGit } from '../../../dist';

async function run() {
  const flow = FlowBuilder.create('demo-flow')
    .useNode('LoadTable', { sheetId: 'demo' })
    .useNode('ParseTags')
    .useNode('ApplyChanges')
    .useNode('FormatPrompt', { formatter: 'prompt' })
    .build();

  const tableGit = new TableGit();
  tableGit.init('main', { defaultSheetName: 'demo' });

  const runtime = new NodeRuntime({
    adapter: new TableGitAdapter({ tableGit, defaultSheetId: 'demo', autoInit: false })
  });

  registerBuiltinNodes(runtime);

  const result = await runtime.run(flow, {
    conversation: [
      {
        id: 'msg-1',
        role: 'assistant',
        content: '[[table:setCell sheet=demo row=0 column=0 value="Hello"]]'
      }
    ],
    sheetId: 'demo',
    services: {}
  });

  console.log('Formatted output:', result.context.variables?.formatted);
}

run().catch(error => {
  console.error(error);
});
