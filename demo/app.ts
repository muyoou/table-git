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
let activeSheet = 'default';
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

function getSheetNames(): string[] {
	if (!repo) return [];
	const sheets = repo.listSheets({ includeStaged: true });
	return sheets.length ? sheets : [];
}

function ensureActiveSheet() {
	if (!repo) {
		activeSheet = 'default';
		setText($("active-sheet"), '当前工作表：-');
		return;
	}
	const sheets = getSheetNames();
	if (!sheets.includes(activeSheet)) {
		activeSheet = sheets[0] ?? 'default';
	}
	setText($("active-sheet"), sheets.length ? `当前工作表：${activeSheet}` : '当前工作表：-');
}

function renderSheets() {
	const container = $("sheets");
	if (!container) return;
	if (!repo) {
		setHTML(container, '(未初始化)');
		return;
	}
	ensureActiveSheet();
	const sheets = getSheetNames();
	if (!sheets.length) {
		setHTML(container, '(无工作表)');
		return;
	}
	const items = sheets.map((name, index) => {
		const prefix = name === activeSheet ? '★ ' : '';
		const disableDelete = (sheets.length === 1) ? ' disabled' : '';
		const isDefault = name === 'default';
		return `<span>${escapeHtml(prefix + name)}</span>
			<button data-sheet-select="${index}" class="mini">切换</button>
			<button data-sheet-duplicate="${index}" class="mini">复制</button>
			<button data-sheet-delete="${index}" class="mini"${disableDelete || isDefault ? ' disabled' : ''}>删除</button>`;
	});
	setHTML(container, `<ul class="list">${items.map(item => `<li>${item}</li>`).join('')}</ul>`);

	container.querySelectorAll('button[data-sheet-select]').forEach(btn => {
		btn.addEventListener('click', () => {
			const idx = parseInt((btn as HTMLButtonElement).dataset.sheetSelect || '-1', 10);
			const name = sheets[idx];
			if (!name) return;
			activeSheet = name;
			refreshAll();
		});
	});

	container.querySelectorAll('button[data-sheet-duplicate]').forEach(btn => {
		btn.addEventListener('click', () => {
			if (!repo) return;
			const idx = parseInt((btn as HTMLButtonElement).dataset.sheetDuplicate || '-1', 10);
			const name = sheets[idx];
			if (!name) return;
			const nextName = window.prompt(`复制工作表 "${name}" 为：`, `${name}_副本`);
			if (!nextName) return;
			try {
				repo.duplicateSheet(name, nextName.trim());
				activeSheet = nextName.trim();
			} catch (e) {
				console.warn(e);
			}
			refreshAll();
		});
	});

	container.querySelectorAll('button[data-sheet-delete]').forEach(btn => {
		btn.addEventListener('click', () => {
			if (!repo) return;
			const idx = parseInt((btn as HTMLButtonElement).dataset.sheetDelete || '-1', 10);
			const name = sheets[idx];
			if (!name) return;
			if (!window.confirm(`确定删除工作表 "${name}"？`)) return;
			try {
				repo.deleteSheet(name);
				if (activeSheet === name) {
					const remaining = getSheetNames().filter(n => n !== name);
					activeSheet = remaining[0] ?? 'default';
				}
			} catch (e) {
				console.warn(e);
			}
			refreshAll();
		});
	});
}

function refreshAll() {
	if (!repo) return;
	ensureActiveSheet();
	renderSheets();
	// status
	const s = repo.status();
	setText($("status"), `分支: ${s.branch}, 暂存: ${s.stagedChanges}, 最后提交: ${s.lastCommit || '无'}`);
	setText($("active-sheet"), `当前工作表：${activeSheet}`);

	// columns
	const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
	if (sheet) {
		const cols = sheet.structure.getColumnIds().map((id) => {
			const c = sheet.structure.getColumn(id)!;
			const name = (c as any).name || id;
			return `${name} (${c.dataType}) width=${c.width}`;
		});
		renderList('columns', cols);
	} else {
		renderList('columns', ['(无结构)']);
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
	const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
	if (!sheet) { setHTML($("grid"), '(空)'); return; }

	// 粗略渲染矩阵（包含表头）
	const adapter = new TableDataAdapter(repo, activeSheet);
	const data = adapter.build(); // 默认包含暂存区的临时预览
	const rows = data.matrix;
	const hasHeader = data.header.length > 0;

	const html: string[] = ['<table>', `<caption>工作表：${escapeHtml(activeSheet)}</caption>`];
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
	const adapter = new TableDataAdapter(repo, activeSheet);
	const data = adapter.build(); // 默认包含暂存区的临时预览
	const html = registry.format('html', data, { includeHeader: true });
	const csv = registry.format('csv', data, { includeHeader: true, quoteText: true });
	const json = registry.format('json', data, { shape: 'rows', space: 2 });
	setText($("previewFrom"), `预览来源：当前工作区（${activeSheet}）`);

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
	function previewFrom(source: { branch?: string; commit?: string } | undefined, label: string, sheetName?: string) {
		if (!repo) return;
		const targetSheet = sheetName ?? activeSheet;
		const adapter = new TableDataAdapter(repo, targetSheet);
		const data = adapter.build(source);
		const html = registry.format('html', data, { includeHeader: true });
		const csv = registry.format('csv', data, { includeHeader: true, quoteText: true });
		const json = registry.format('json', data, { shape: 'rows', space: 2 });

		setText($("previewFrom"), `预览来源：${label}（${targetSheet}）`);

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
	($("btn-init") as HTMLButtonElement).onclick = () => {
		repo = createSampleTable();
		seedDemoSheets();
		activeSheet = 'default';
		refreshAll();
	};
	($("btn-create-branch") as HTMLButtonElement).onclick = () => {
		if (!repo) return;
		const b = (document.getElementById('branch') as HTMLInputElement).value || 'temp';
		repo.createBranch(b);
		refreshAll();
	};

	const btnCreateSheet = document.getElementById('btn-create-sheet') as HTMLButtonElement | null;
	if (btnCreateSheet) {
		btnCreateSheet.onclick = () => {
			if (!repo) return;
			const input = document.getElementById('sheet-name') as HTMLInputElement | null;
			const name = (input?.value.trim()) || `sheet_${generateId('')}`;
			if (!name) return;
			try {
				repo.createSheet(name);
				activeSheet = name;
				if (input) input.value = '';
			} catch (e: any) {
				alert(e?.message || String(e));
			}
			refreshAll();
		};
	}

	const btnDuplicateSheet = document.getElementById('btn-duplicate-sheet') as HTMLButtonElement | null;
	if (btnDuplicateSheet) {
		btnDuplicateSheet.onclick = () => {
			if (!repo) return;
			const suggestion = `${activeSheet}_副本`;
			const name = window.prompt('复制当前工作表为：', suggestion)?.trim();
			if (!name) return;
			try {
				repo.duplicateSheet(activeSheet, name);
				activeSheet = name;
			} catch (e: any) {
				alert(e?.message || String(e));
			}
			refreshAll();
		};
	}

	const btnRenameSheet = document.getElementById('btn-rename-sheet') as HTMLButtonElement | null;
	if (btnRenameSheet) {
		btnRenameSheet.onclick = () => {
			if (!repo) return;
			const input = document.getElementById('sheet-rename') as HTMLInputElement | null;
			const name = input?.value.trim();
			if (!name) return;
			try {
				repo.renameSheet(activeSheet, name);
				activeSheet = name;
				if (input) input.value = '';
			} catch (e: any) {
				alert(e?.message || String(e));
			}
			refreshAll();
		};
	}

	const btnDeleteSheet = document.getElementById('btn-delete-sheet') as HTMLButtonElement | null;
	if (btnDeleteSheet) {
		btnDeleteSheet.onclick = () => {
			if (!repo) return;
			if (activeSheet === 'default') {
				alert('默认工作表不可删除');
				return;
			}
			const sheets = getSheetNames();
			if (sheets.length <= 1) {
				alert('至少需要保留一个工作表');
				return;
			}
			if (!window.confirm(`确认删除当前工作表 "${activeSheet}"？`)) return;
			try {
				const removed = activeSheet;
				repo.deleteSheet(removed);
				const remaining = getSheetNames().filter(n => n !== removed);
				activeSheet = remaining[0] ?? 'default';
			} catch (e: any) {
				alert(e?.message || String(e));
			}
			refreshAll();
		};
	}
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
			const currentVal = repo.getCellValue(row, col, activeSheet);
			const next = window.prompt(`修改单元格 (${row}, ${col}) 的值：`, currentVal != null ? String(currentVal) : '');
			if (next === null) return; // 用户取消

			// 暂存变更（不提交）
			try {
				repo.addCellChange(activeSheet, row, col, next);
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
			const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
			const adapter = new TableDataAdapter(repo, activeSheet);
			const data = adapter.build();
			const nextOrder = (() => {
				if (sheet) {
					const ids = sheet.structure.getColumnIds();
					let max = -1;
					ids.forEach(id => {
						const meta = sheet.structure.getColumn(id);
						if (meta && typeof meta.order === 'number') {
							max = Math.max(max, meta.order);
						}
					});
					if (max >= 0) return max + 1;
				}
				return (data.maxCol >= data.minCol) ? data.maxCol + 1 : 0;
			})();
			const colId = `col_${generateId('')}`;
			const col = createColumn(colId, { order: nextOrder });
			try {
				repo.addColumn(activeSheet, col);
			} catch (e) { console.warn(e); }
			refreshAll();
		};
	}

	// 插入行（暂存，不提交）
	const btnInsertRow = document.getElementById('btn-insert-row') as HTMLButtonElement | null;
	if (btnInsertRow) {
		btnInsertRow.onclick = () => {
			if (!repo) return;
			const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
			const adapter = new TableDataAdapter(repo, activeSheet);
			const data = adapter.build();
			const nextOrder = (() => {
				if (sheet) {
					const ids = sheet.structure.getRowIds();
					let max = -1;
					ids.forEach(id => {
						const meta = sheet.structure.getRow(id);
						if (meta && typeof meta.order === 'number') {
							max = Math.max(max, meta.order);
						}
					});
					if (max >= 0) return max + 1;
				}
				return (data.maxRow >= data.minRow) ? data.maxRow + 1 : 0;
			})();
			const row = createRow({ order: nextOrder });
			try {
				repo.addRow(activeSheet, row);
			} catch (e) { console.warn(e); }
			refreshAll();
		};
	}

	// === 根据索引删除列（依赖结构顺序） ===
	const btnDeleteColByIndex = document.getElementById('btn-delete-col-index') as HTMLButtonElement | null;
	if (btnDeleteColByIndex) {
		btnDeleteColByIndex.onclick = () => {
			if (!repo) return;
			const input = document.getElementById('col-index') as HTMLInputElement | null;
			const raw = input?.value.trim();
			if (!raw?.length) { alert('请输入列索引'); return; }
			const colIndex = Number(raw);
			if (!Number.isInteger(colIndex) || colIndex < 0) { alert('列索引需为非负整数'); return; }

			const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
			if (!sheet) { alert('当前工作表为空'); return; }

			// 如果当前没有列结构，则尝试基于现有单元格边界自动补齐列结构
			let structIds = sheet.structure.getColumnIds();
			if (structIds.length === 0) {
				const bounds = sheet.getBounds?.();
				if (bounds) {
					for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
						// 生成稳定列ID：优先使用已有列元数据（无），否则统一前缀
						repo.addColumn(activeSheet, createColumn(`auto_col_${c}`, { order: c }));
					}
					// 重新获取最新 sheet 结构（包含刚刚暂存的列添加）
					const refreshed = repo.getPreviewSheet(activeSheet, { includeStaged: true });
					if (refreshed) {
						structIds = refreshed.structure.getColumnIds();
					}
				}
			}

			if (colIndex >= structIds.length) { alert('结构列索引不存在，请检查列顺序。'); return; }
			const targetId = structIds[colIndex];
			if (!targetId) { alert('未找到对应列 ID。'); return; }

			try {
				repo.deleteColumn(activeSheet, targetId);
			} catch (e) { console.warn(e); }

			if (input) input.value = '';
			refreshAll();
		};
	}

	// === 根据索引删除行（依赖结构顺序） ===
	const btnDeleteRowByIndex = document.getElementById('btn-delete-row-index') as HTMLButtonElement | null;
	if (btnDeleteRowByIndex) {
		btnDeleteRowByIndex.onclick = () => {
			if (!repo) return;
			const input = document.getElementById('row-index') as HTMLInputElement | null;
			const raw = input?.value.trim();
			if (!raw?.length) { alert('请输入行索引'); return; }
			const rowIndex = Number(raw);
			if (!Number.isInteger(rowIndex) || rowIndex < 0) { alert('行索引需为非负整数'); return; }

			const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
			if (!sheet) { alert('当前工作表为空'); return; }

			// 如果当前没有行结构，则尝试基于现有单元格边界自动补齐行结构
			let structIds = sheet.structure.getRowIds();
			if (structIds.length === 0) {
				const bounds = sheet.getBounds?.();
				if (bounds) {
					for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
						repo.addRow(activeSheet, createRow({ order: r, id: `auto_row_${r}` }));
					}
					const refreshed = repo.getPreviewSheet(activeSheet, { includeStaged: true });
					if (refreshed) {
						structIds = refreshed.structure.getRowIds();
					}
				}
			}

			if (rowIndex >= structIds.length) { alert('结构行索引不存在，请检查行顺序。'); return; }
			const targetId = structIds[rowIndex];
			if (!targetId) { alert('未找到对应行 ID。'); return; }

			try {
				repo.deleteRow(activeSheet, targetId);
			} catch (e) { console.warn(e); }

			if (input) input.value = '';
			refreshAll();
		};
	}
}

function seedDemoSheets() {
	if (!repo) return;
	if (!repo.hasSheet('analysis')) {
		repo.createSheet('analysis', { order: 1 });
		// 初始化行结构（0~3），与即将写入的单元格对应
		repo.addRow('analysis', createRow({ id: 'row_0', order: 0 }));
		repo.addRow('analysis', createRow({ id: 'row_1', order: 1 }));
		repo.addRow('analysis', createRow({ id: 'row_2', order: 2 }));
		repo.addRow('analysis', createRow({ id: 'row_3', order: 3 }));
		repo.addCellChange('analysis', 0, 0, '指标', undefined, { fontWeight: 'bold' });
		repo.addCellChange('analysis', 0, 1, '数值', undefined, { fontWeight: 'bold' });
		repo.addCellChange('analysis', 1, 0, '产品数量');
		repo.addCellChange('analysis', 1, 1, 3);
		repo.addCellChange('analysis', 2, 0, '平均价格');
		repo.addCellChange('analysis', 2, 1, 8185.67);
		repo.addCellChange('analysis', 3, 0, '库存总量');
		repo.addCellChange('analysis', 3, 1, 225);
		repo.commit('新增分析工作表', 'System', 'system@example.com');
	}
	const sheets = repo.listSheets();
	if (!sheets.includes('draft')) {
		repo.duplicateSheet('default', 'draft');
		repo.commit('复制默认工作表', 'System', 'system@example.com');
	}
}

function main() {
	bindTabs();
	bindActions();
	// 自动初始化一次
	repo = createSampleTable();
	seedDemoSheets();
	activeSheet = 'default';
	refreshAll();
}


document.addEventListener('DOMContentLoaded', main);

