export interface ParameterPanelOptions {
  host: HTMLElement;
  onSubmit: (nodeId: string, config: Record<string, unknown>) => void;
  onCancel?: () => void;
}

const PANEL_CLASS = 'node-parameter-panel';

export class ParameterPanel {
  private readonly root: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly textarea: HTMLTextAreaElement;
  private readonly error: HTMLDivElement;
  private readonly submitButton: HTMLButtonElement;
  private readonly cancelButton: HTMLButtonElement;
  private readonly options: ParameterPanelOptions;
  private activeNodeId?: string;

  constructor(options: ParameterPanelOptions) {
    this.options = options;

    this.root = document.createElement('div');
    this.root.className = PANEL_CLASS;
    this.root.style.position = 'absolute';
    this.root.style.top = '16px';
    this.root.style.right = '16px';
    this.root.style.width = '280px';
    this.root.style.padding = '16px';
    this.root.style.background = 'rgba(17, 24, 39, 0.95)';
    this.root.style.border = '1px solid rgba(99, 102, 241, 0.6)';
    this.root.style.borderRadius = '12px';
    this.root.style.color = '#f9fafb';
    this.root.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.35)';
    this.root.style.display = 'none';
    this.root.style.zIndex = '10';

    this.title = document.createElement('h3');
    this.title.textContent = 'Node Parameters';
    this.title.style.margin = '0 0 12px';
    this.title.style.fontSize = '16px';

    this.textarea = document.createElement('textarea');
    this.textarea.style.width = '100%';
    this.textarea.style.minHeight = '160px';
    this.textarea.style.resize = 'vertical';
    this.textarea.style.borderRadius = '8px';
    this.textarea.style.border = '1px solid rgba(148, 163, 184, 0.6)';
    this.textarea.style.background = 'rgba(30, 41, 59, 0.85)';
    this.textarea.style.color = '#f9fafb';
    this.textarea.style.fontFamily = 'monospace';
    this.textarea.style.fontSize = '12px';
    this.textarea.style.padding = '8px';

    this.error = document.createElement('div');
    this.error.style.color = '#f97316';
    this.error.style.fontSize = '12px';
    this.error.style.marginTop = '8px';

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'space-between';
    buttons.style.marginTop = '12px';

    this.submitButton = document.createElement('button');
    this.submitButton.textContent = 'Save';
    this.submitButton.style.flex = '1';
    this.submitButton.style.marginRight = '8px';
    this.submitButton.style.padding = '8px 12px';
    this.submitButton.style.border = 'none';
    this.submitButton.style.borderRadius = '8px';
    this.submitButton.style.background = '#6366f1';
    this.submitButton.style.color = '#f9fafb';
    this.submitButton.style.cursor = 'pointer';

    this.cancelButton = document.createElement('button');
    this.cancelButton.textContent = 'Cancel';
    this.cancelButton.style.flex = '1';
    this.cancelButton.style.padding = '8px 12px';
    this.cancelButton.style.border = 'none';
    this.cancelButton.style.borderRadius = '8px';
    this.cancelButton.style.background = 'rgba(148, 163, 184, 0.3)';
    this.cancelButton.style.color = '#f9fafb';
    this.cancelButton.style.cursor = 'pointer';

    buttons.appendChild(this.submitButton);
    buttons.appendChild(this.cancelButton);

    this.root.appendChild(this.title);
    this.root.appendChild(this.textarea);
    this.root.appendChild(this.error);
    this.root.appendChild(buttons);
    options.host.appendChild(this.root);

    this.submitButton.addEventListener('click', () => this.handleSubmit());
    this.cancelButton.addEventListener('click', () => this.close());
  }

  open(nodeId: string, title: string, config: Record<string, unknown>): void {
    this.activeNodeId = nodeId;
    this.title.textContent = `${title} Parameters`;
    this.textarea.value = JSON.stringify(config ?? {}, null, 2);
    this.error.textContent = '';
    this.root.style.display = 'block';
  }

  close(): void {
    this.activeNodeId = undefined;
    this.root.style.display = 'none';
    this.error.textContent = '';
    if (this.options.onCancel) {
      this.options.onCancel();
    }
  }

  isOpen(): boolean {
    return typeof this.activeNodeId !== 'undefined';
  }

  private handleSubmit(): void {
    if (!this.activeNodeId) {
      return;
    }
    try {
      const config = this.textarea.value.trim() ? JSON.parse(this.textarea.value) : {};
      if (typeof config !== 'object' || Array.isArray(config)) {
        throw new Error('Configuration must be an object');
      }
      this.options.onSubmit(this.activeNodeId, config as Record<string, unknown>);
      this.close();
    } catch (error) {
      this.error.textContent = error instanceof Error ? error.message : 'Unable to parse configuration';
    }
  }
}
