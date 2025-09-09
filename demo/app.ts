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
					const id = `preview-branch-${b}`;
					return `<span>${escapeHtml(label)}</span> <button data-preview-branch="${escapeHtml(b)}" class="mini">预览</button>`;
				});
				const el = $("branches");
				if (el) {
					setHTML(el, `<ul class="list">${lines.map(li => `<li>${li}</li>`).join('')}</ul>`);
					// 绑定事件
					el.querySelectorAll('button[data-preview-branch]').forEach(btn => {
						btn.addEventListener('click', () => {
							const branch = (btn as HTMLButtonElement).getAttribute('data-preview-branch')!;
							previewFrom({ branch }, `分支: ${branch}`);
						});
					});
				}
			}

	// history
	const hist = repo.getCommitHistory(10);
			// 历史提交：附带预览按钮
			{
				const lines = hist.map((c) => {
					const label = `${c.getShortHash()} - ${c.message}`;
					return `<span>${escapeHtml(label)}</span> <button data-preview-commit="${escapeHtml(c.hash)}" class="mini">预览</button>`;
				});
				const el = $("history");
				if (el) {
					setHTML(el, `<ul class="list">${lines.map(li => `<li>${li}</li>`).join('')}</ul>`);
					el.querySelectorAll('button[data-preview-commit]').forEach(btn => {
						btn.addEventListener('click', () => {
							const commit = (btn as HTMLButtonElement).getAttribute('data-preview-commit')!;
							previewFrom({ commit }, `提交: ${commit.substring(0,7)}`);
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
	const data = adapter.build();
	const rows = data.matrix;
	const html = [`<table>`]
	if (data.header.length) {
		html.push('<thead><tr>');
		html.push(...data.header.map(h => `<th>${h ?? ''}</th>`));
		html.push('</tr></thead>');
	}
	html.push('<tbody>');
	for (const row of (data.header.length ? data.rows : rows)) {
		html.push('<tr>');
		html.push(...(row ?? []).map(cell => `<td>${cell ?? ''}</td>`));
		html.push('</tr>');
	}
	html.push('</tbody></table>');
	setHTML($("grid"), html.join(''));
}

function refreshPreview() {
	if (!repo) return;
	const adapter = new TableDataAdapter(repo);
	const data = adapter.build();
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
	($("btn-commit") as HTMLButtonElement).onclick = () => {
		if (!repo) return;
		const author = (document.getElementById('author') as HTMLInputElement).value || 'Demo User';
		const email = (document.getElementById('email') as HTMLInputElement).value || 'demo@example.com';
		const message = (document.getElementById('message') as HTMLInputElement).value || '演示提交';
		try { repo.commit(message, author, email); } catch (e) { console.warn(e); }
		refreshAll();
	};
	($("btn-create-branch") as HTMLButtonElement).onclick = () => { if (!repo) return; const b = (document.getElementById('branch') as HTMLInputElement).value || 'temp'; repo.createBranch(b); refreshAll(); };
	($("btn-checkout") as HTMLButtonElement).onclick = () => { if (!repo) return; const b = (document.getElementById('branch') as HTMLInputElement).value || 'main'; try { repo.checkout(b); } catch(e) { console.warn(e); } refreshAll(); };
	($("btn-back-main") as HTMLButtonElement).onclick = () => { if (!repo) return; try { repo.checkout('main'); } catch(e) { console.warn(e); } refreshAll(); };

	// 业务操作参考 demo.js
	($("btn-adjust") as HTMLButtonElement).onclick = () => {
		if (!repo) return;
		repo.addCellChange('default', 1, 2, 6999);
		repo.addCellChange('default', 2, 2, 13999);
		try { repo.commit('调整产品价格', 'Sales Manager', 'sales@company.com'); } catch(e) {}
		refreshAll();
	};

	($("btn-delete-row") as HTMLButtonElement).onclick = () => {
		if (!repo) return;
		// 添加行元数据->删除第2行
		repo.addRow('default', { id: 'row_2', height: 25, hidden: false, order: 1 });
		try { repo.commit('添加行元数据', 'Data Manager', 'data@company.com'); } catch(e) {}
		repo.deleteCellChange('default', 2, 1);
		repo.deleteCellChange('default', 2, 2);
		repo.deleteCellChange('default', 2, 3);
		repo.deleteCellChange('default', 2, 4);
		repo.deleteRow('default', 'row_2');
		try { repo.commit('删除MacBook Pro产品行', 'Product Manager', 'pm@company.com'); } catch(e) {}
		refreshAll();
	};

	($("btn-add-more") as HTMLButtonElement).onclick = () => {
		if (!repo) return;
		repo.addCellChange('default', 4, 1, 'Apple Watch');
		repo.addCellChange('default', 4, 2, 2999);
		repo.addCellChange('default', 4, 3, 200);
		repo.addCellChange('default', 4, 4, '智能手表');
		repo.addCellChange('default', 5, 1, 'AirPods Pro');
		repo.addCellChange('default', 5, 2, 1999);
		repo.addCellChange('default', 5, 3, 150);
		repo.addCellChange('default', 5, 4, '无线耳机');
		try { repo.commit('添加更多产品', 'Product Manager', 'pm@company.com'); } catch(e) {}
		refreshAll();
	};

	($("btn-sort") as HTMLButtonElement).onclick = () => { if (!repo) return; repo.sortRows('default', [{ columnId: 'col_2', ascending: true }]); try { repo.commit('按价格排序产品', 'Data Analyst', 'analyst@company.com'); } catch(e) {} refreshAll(); };

	($("btn-checkout-prev") as HTMLButtonElement).onclick = () => {
		if (!repo) return;
		const history = repo.getCommitHistory(10);
		if (history.length >= 2) {
			const oldCommit = history[history.length - 2];
			try { repo.checkout(oldCommit.hash); } catch(e) {}
			refreshAll();
		}
	};
}

function main() {
	bindTabs();
	bindActions();
	// 自动初始化一次
	repo = createSampleTable();
	refreshAll();
}

document.addEventListener('DOMContentLoaded', main);

