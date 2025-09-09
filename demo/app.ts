import {
	createSampleTable,
	TableGit,
	TableDataAdapter,
	FunctionFormatter,
	FormatterRegistry,
	csvFormatter,
	jsonFormatter,
	htmlFormatter,
} from '../src/index.ts';
import { createColumn, createRow, generateId, ChangeType } from '../src/index.ts';

type El = HTMLElement | null;
const $ = (id: string) => document.getElementById(id);

let repo: TableGit | null = null;
const registry = new FormatterRegistry();
registry.register(new FunctionFormatter({ name: 'csv', format: csvFormatter }));
registry.register(new FunctionFormatter({ name: 'json', format: jsonFormatter }));
registry.register(new FunctionFormatter({ name: 'html', format: htmlFormatter }));

function setText(el: El, text: string) { if (el) el.textContent = text; }
function setHTML(el: El, html: string) { if (el) el.innerHTML = html; }
function escapeHtml(s: any) {
	if (s === null || s === undefined) return '';
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
function renderList(elId: string, items: string[]) {
	const el = $(elId);
	if (!el) return;
	const html = `<ul class="list">${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
	setHTML(el, html);
}

function refreshAll() {
	if (!repo) return;
	// status
	const s = repo.status();
	setText($("status"), `分支: ${s.branch}, 暂存: ${s.stagedChanges}, 最后提交: ${s.lastCommit || '无'}`);

	// columns
	const tree = repo.getWorkingTree();
	if (tree) {
			const cols = tree.structure.getColumnIds().map((id, i) => {
			const c = tree.structure.getColumn(id)!;
			const name = (c as any).name || id; // 我们的 ColumnMetadata 没有 name 字段，这里向后兼容
				return `${name} (${c.dataType}) width=${c.width}`;
		});
			renderList('columns', cols);
	}

	// branches
	const branches = repo.getBranches();
	const current = repo.getCurrentBranch();
			// 分支列表：附带预览按钮
				{
					const lines = branches.map(b => {
						const label = `${b === current ? '★ ' : ''}${b}`;
						return `<span>${escapeHtml(label)}</span>
							<button data-preview-branch="${escapeHtml(b)}" class="mini">预览</button>
							<button data-checkout-branch="${escapeHtml(b)}" class="mini">切换</button>`;
					});
					const el = $("branches");
					if (el) {
						setHTML(el, `<ul class="list">${lines.map(li => `<li>${li}</li>`).join('')}</ul>`);
						// 预览
						el.querySelectorAll('button[data-preview-branch]').forEach(btn => {
							btn.addEventListener('click', () => {
								const branch = (btn as HTMLButtonElement).getAttribute('data-preview-branch')!;
								previewFrom({ branch }, `分支: ${branch}`);
							});
						});
						// 切换
						el.querySelectorAll('button[data-checkout-branch]').forEach(btn => {
							btn.addEventListener('click', () => {
								if (!repo) return;
								const branch = (btn as HTMLButtonElement).getAttribute('data-checkout-branch')!;
								try { repo.checkout(branch); } catch (e) { console.warn(e); }
								refreshAll();
							});
						});
					}
				}

					// staged changes
					{
						const changes = repo.getStagedChanges();
						const lines = changes.map((ch) => {
							const when = new Date(ch.timestamp).toLocaleTimeString();
							let label: string = String(ch.type);
							if (ch.type === ChangeType.CELL_ADD || ch.type === ChangeType.CELL_UPDATE || ch.type === ChangeType.CELL_DELETE) {
								const d = ch.details as any;
								const pos = (d && typeof d.row === 'number' && typeof d.column === 'number') ? ` (${d.row},${d.column})` : '';
								const val = (d && 'value' in d) ? ` = ${String(d.value ?? '')}` : '';
								label = `${ch.type}${pos}${val}`;
							}
							return `${label} @${ch.sheetName} ${when}`;
						});
						renderList('staged', lines.length ? lines : ['(空)']);
					}

	// history
	const hist = repo.getCommitHistory(10);
			// 历史提交：附带预览按钮
				{
					const lines = hist.map((c) => {
						const label = `${c.getShortHash()} - ${c.message}`;
						return `<span>${escapeHtml(label)}</span>
							<button data-preview-commit="${escapeHtml(c.hash)}" class="mini">预览</button>
							<button data-checkout-commit="${escapeHtml(c.hash)}" class="mini">切换</button>`;
					});
					const el = $("history");
					if (el) {
						setHTML(el, `<ul class="list">${lines.map(li => `<li>${li}</li>`).join('')}</ul>`);
						// 预览
						el.querySelectorAll('button[data-preview-commit]').forEach(btn => {
							btn.addEventListener('click', () => {
								const commit = (btn as HTMLButtonElement).getAttribute('data-preview-commit')!;
								previewFrom({ commit }, `提交: ${commit.substring(0,7)}`);
							});
						});
						// 切换
						el.querySelectorAll('button[data-checkout-commit]').forEach(btn => {
							btn.addEventListener('click', () => {
								if (!repo) return;
								const commit = (btn as HTMLButtonElement).getAttribute('data-checkout-commit')!;
								try { repo.checkout(commit); } catch (e) { console.warn(e); }
								refreshAll();
							});
						});
					}
				}

	// grid
	renderGrid();
	// preview
	refreshPreview();
}

function renderGrid() {
	if (!repo) return;
	const tree = repo.getWorkingTree();
	if (!tree) { setHTML($("grid"), '(空)'); return; }

	// 粗略渲染矩阵（包含表头）
	const adapter = new TableDataAdapter(repo);
	const data = adapter.build(); // 默认包含暂存区的临时预览
	const rows = data.matrix;
	const hasHeader = data.header.length > 0;

	const html: string[] = ['<table>'];
	if (hasHeader && rows.length) {
		html.push('<thead><tr>');
		for (let c = 0; c < rows[0].length; c++) {
			const rowIdx = data.minRow + 0;
			const colIdx = data.minCol + c;
			const val = rows[0]?.[c] ?? '';
			html.push(`<th>${val ?? ''} <button class="mini" data-edit-row="${rowIdx}" data-edit-col="${colIdx}">修改</button></th>`);
		}
		html.push('</tr></thead>');
	}
	html.push('<tbody>');
	for (let r = hasHeader ? 1 : 0; r < rows.length; r++) {
		html.push('<tr>');
		for (let c = 0; c < rows[r].length; c++) {
			const rowIdx = data.minRow + r;
			const colIdx = data.minCol + c;
			const val = rows[r]?.[c] ?? '';
			html.push(`<td>${val ?? ''} <button class="mini" data-edit-row="${rowIdx}" data-edit-col="${colIdx}">修改</button></td>`);
		}
		html.push('</tr>');
	}
	html.push('</tbody></table>');
	setHTML($("grid"), html.join(''));
}

function refreshPreview() {
	if (!repo) return;
	const adapter = new TableDataAdapter(repo);
	const data = adapter.build(); // 默认包含暂存区的临时预览
	const html = registry.format('html', data, { includeHeader: true });
	const csv = registry.format('csv', data, { includeHeader: true, quoteText: true });
	const json = registry.format('json', data, { shape: 'rows', space: 2 });
	setText($("previewFrom"), '预览来源：当前工作区');

	// HTML -> iframe
	const doc = (document.getElementById('htmlFrame') as HTMLIFrameElement).contentWindow?.document;
	if (doc) {
		doc.open();
		doc.write(`<!doctype html><meta charset='utf-8'><style>table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}</style>${html}`);
		doc.close();
	}
	setText($("csvOut"), csv);
	setText($("jsonOut"), json);
}

	// 基于分支/提交的临时预览（不影响当前工作区）
	function previewFrom(source: { branch?: string; commit?: string }, label: string) {
		if (!repo) return;
			const adapter = new TableDataAdapter(repo);
			const data = adapter.build(source);
		const html = registry.format('html', data, { includeHeader: true });
		const csv = registry.format('csv', data, { includeHeader: true, quoteText: true });
		const json = registry.format('json', data, { shape: 'rows', space: 2 });

		setText($("previewFrom"), `预览来源：${label}`);

		const doc = (document.getElementById('htmlFrame') as HTMLIFrameElement).contentWindow?.document;
		if (doc) { doc.open(); doc.write(`<!doctype html><meta charset='utf-8'><style>table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}</style>${html}`); doc.close(); }
		setText($("csvOut"), csv);
		setText($("jsonOut"), json);
	}

function bindTabs() {
	const buttons = Array.from(document.querySelectorAll('.tabs button')) as HTMLButtonElement[];
	const panels: Record<string, HTMLElement> = {
		html: document.getElementById('panel-html')!,
		csv: document.getElementById('panel-csv')!,
		json: document.getElementById('panel-json')!,
	};
	buttons.forEach(btn => {
		btn.addEventListener('click', () => {
			buttons.forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
			const tab = btn.getAttribute('data-tab')!;
			Object.entries(panels).forEach(([k, el]) => el.style.display = (k === tab ? 'block' : 'none'));
		});
	});
}

function bindActions() {
	($("btn-init") as HTMLButtonElement).onclick = () => { repo = createSampleTable(); refreshAll(); };
	($("btn-create-branch") as HTMLButtonElement).onclick = () => {
		if (!repo) return;
		const b = (document.getElementById('branch') as HTMLInputElement).value || 'temp';
		repo.createBranch(b);
		refreshAll();
	};

	// 表格内的“修改”按钮（事件委托，修改后仅暂存，不自动提交）
	const grid = document.getElementById('grid');
	if (grid) {
		grid.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (!target) return;
			const btn = target.closest('button[data-edit-row][data-edit-col]') as HTMLButtonElement | null;
			if (!btn) return;
			if (!repo) return;
			const rowStr = btn.getAttribute('data-edit-row');
			const colStr = btn.getAttribute('data-edit-col');
			if (!rowStr || !colStr) return;
			const row = parseInt(rowStr, 10);
			const col = parseInt(colStr, 10);

			// 读取当前值作为默认内容（基于工作区）
			const currentVal = repo.getCellValue(row, col);
			const next = window.prompt(`修改单元格 (${row}, ${col}) 的值：`, currentVal != null ? String(currentVal) : '');
			if (next === null) return; // 用户取消

			// 暂存变更（不提交）
			try {
				repo.addCellChange('default', row, col, next);
			} catch (err) {
				console.warn(err);
			}
			refreshAll();
		});
	}

	// 提交变更按钮
	const btnCommit = document.getElementById('btn-commit') as HTMLButtonElement | null;
	if (btnCommit) {
		btnCommit.onclick = () => {
			if (!repo) return;
			const message = (document.getElementById('commit-message') as HTMLInputElement)?.value?.trim() || 'update';
			const author = (document.getElementById('commit-author') as HTMLInputElement)?.value?.trim() || 'User';
			const email = (document.getElementById('commit-email') as HTMLInputElement)?.value?.trim() || 'user@example.com';
			try {
				repo.commit(message, author, email);
			} catch (e: any) {
				alert(e?.message || String(e));
			}
			refreshAll();
		};
	}

	// 插入列（暂存，不提交）
	const btnInsertCol = document.getElementById('btn-insert-col') as HTMLButtonElement | null;
	if (btnInsertCol) {
		btnInsertCol.onclick = () => {
			if (!repo) return;
			// 依据当前结构下一个序号作为 order
			const tree = repo.getWorkingTree();
			const order = tree ? tree.structure.getColumnIds().length : 0;
			const colId = `col_${generateId('')}`;
			const col = createColumn(colId, { order });
			try {
				repo.addColumn('default', col); // 暂存结构变更
			} catch (e) { console.warn(e); }

			// 为新列追加占位单元格，让可视矩阵立即扩展
			const adapter = new TableDataAdapter(repo);
			const data = adapter.build();
			const hasBounds = data.maxCol >= data.minCol && data.maxRow >= data.minRow;
			const newColIndex = hasBounds ? (data.maxCol + 1) : 0;
			for (let r = hasBounds ? data.minRow : 0; r <= (hasBounds ? data.maxRow : 0); r++) {
				try { repo.addCellChange('default', r, newColIndex, ''); } catch {}
			}
			refreshAll();
		};
	}

	// 插入行（暂存，不提交）
	const btnInsertRow = document.getElementById('btn-insert-row') as HTMLButtonElement | null;
	if (btnInsertRow) {
		btnInsertRow.onclick = () => {
			if (!repo) return;
			const tree = repo.getWorkingTree();
			const order = tree ? tree.structure.getRowIds().length : 0;
			const row = createRow({ order });
			try {
				repo.addRow('default', row); // 暂存结构变更
			} catch (e) { console.warn(e); }

			// 为新行追加占位单元格，让可视矩阵立即扩展
			const adapter = new TableDataAdapter(repo);
			const data = adapter.build();
			const hasBounds = data.maxCol >= data.minCol && data.maxRow >= data.minRow;
			const newRowIndex = hasBounds ? (data.maxRow + 1) : 0;
			for (let c = hasBounds ? data.minCol : 0; c <= (hasBounds ? data.maxCol : 0); c++) {
				try { repo.addCellChange('default', newRowIndex, c, ''); } catch {}
			}
			refreshAll();
		};
	}
}

function main() {
	bindTabs();
	bindActions();
	// 自动初始化一次
	repo = createSampleTable();
	refreshAll();
}

document.addEventListener('DOMContentLoaded', main);

