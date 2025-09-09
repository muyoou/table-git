"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // dist/types/index.js
  var require_types = __commonJS({
    "dist/types/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ChangeType = exports.ObjectType = void 0;
      var ObjectType;
      (function(ObjectType2) {
        ObjectType2["CELL"] = "cell";
        ObjectType2["COLUMN"] = "column";
        ObjectType2["ROW"] = "row";
        ObjectType2["SHEET"] = "sheet";
        ObjectType2["TABLE"] = "table";
        ObjectType2["COMMIT"] = "commit";
      })(ObjectType || (exports.ObjectType = ObjectType = {}));
      var ChangeType;
      (function(ChangeType2) {
        ChangeType2["CELL_ADD"] = "cell_add";
        ChangeType2["CELL_UPDATE"] = "cell_update";
        ChangeType2["CELL_DELETE"] = "cell_delete";
        ChangeType2["COLUMN_ADD"] = "column_add";
        ChangeType2["COLUMN_UPDATE"] = "column_update";
        ChangeType2["COLUMN_DELETE"] = "column_delete";
        ChangeType2["COLUMN_MOVE"] = "column_move";
        ChangeType2["ROW_ADD"] = "row_add";
        ChangeType2["ROW_UPDATE"] = "row_update";
        ChangeType2["ROW_DELETE"] = "row_delete";
        ChangeType2["ROW_SORT"] = "row_sort";
      })(ChangeType || (exports.ChangeType = ChangeType = {}));
    }
  });

  // demo/crypto-shim.js
  var require_crypto_shim = __commonJS({
    "demo/crypto-shim.js"(exports) {
      function sha1Hex(message) {
        function rotl(n, s) {
          return n << s | n >>> 32 - s;
        }
        function toHex(n) {
          return ("00000000" + (n >>> 0).toString(16)).slice(-8);
        }
        const msg = new TextEncoder().encode(String(message));
        const ml = msg.length * 8;
        const withOne = new Uint8Array(msg.length + 9 + 63 >> 6 << 6);
        withOne.set(msg);
        withOne[msg.length] = 128;
        const dv = new DataView(withOne.buffer);
        dv.setUint32(withOne.length - 4, ml >>> 0);
        let h0 = 1732584193, h1 = 4023233417, h2 = 2562383102, h3 = 271733878, h4 = 3285377520;
        const w = new Uint32Array(80);
        for (let i = 0; i < withOne.length; i += 64) {
          for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
          for (let j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
          let a = h0, b = h1, c = h2, d = h3, e = h4;
          for (let j = 0; j < 80; j++) {
            const f = j < 20 ? b & c | ~b & d : j < 40 ? b ^ c ^ d : j < 60 ? b & c | b & d | c & d : b ^ c ^ d;
            const k = j < 20 ? 1518500249 : j < 40 ? 1859775393 : j < 60 ? 2400959708 : 3395469782;
            const temp = rotl(a, 5) + f + e + k + w[j] >>> 0;
            e = d;
            d = c;
            c = rotl(b, 30) >>> 0;
            b = a;
            a = temp;
          }
          h0 = h0 + a >>> 0;
          h1 = h1 + b >>> 0;
          h2 = h2 + c >>> 0;
          h3 = h3 + d >>> 0;
          h4 = h4 + e >>> 0;
        }
        return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
      }
      exports.createHash = function createHash(algo) {
        if (algo !== "sha1") throw new Error("Only sha1 supported in demo shim");
        let acc = "";
        return {
          update(chunk) {
            acc += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
            return this;
          },
          digest(enc) {
            const hex = sha1Hex(acc);
            return enc === "hex" ? hex : Buffer.from(hex, "hex");
          }
        };
      };
    }
  });

  // dist/utils/hash.js
  var require_hash = __commonJS({
    "dist/utils/hash.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      } : function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      });
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      } : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || /* @__PURE__ */ function() {
        var ownKeys = function(o) {
          ownKeys = Object.getOwnPropertyNames || function(o2) {
            var ar = [];
            for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
            return ar;
          };
          return ownKeys(o);
        };
        return function(mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null) {
            for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
          }
          __setModuleDefault(result, mod);
          return result;
        };
      }();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.calculateHash = calculateHash;
      exports.generateId = generateId;
      exports.deepClone = deepClone;
      exports.deepEqual = deepEqual;
      exports.parsePosition = parsePosition;
      exports.formatPosition = formatPosition;
      var crypto = __importStar(require_crypto_shim());
      function calculateHash(obj) {
        const content = JSON.stringify(obj, Object.keys(obj).sort());
        return crypto.createHash("sha1").update(content).digest("hex");
      }
      function generateId(prefix = "") {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}${timestamp}_${random}`;
      }
      function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
      }
      function deepEqual(obj1, obj2) {
        return JSON.stringify(obj1, Object.keys(obj1).sort()) === JSON.stringify(obj2, Object.keys(obj2).sort());
      }
      function parsePosition(position) {
        const [row, col] = position.split(",").map(Number);
        return { row, col };
      }
      function formatPosition(row, col) {
        return `${row},${col}`;
      }
    }
  });

  // dist/core/cell.js
  var require_cell = __commonJS({
    "dist/core/cell.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CellObject = void 0;
      var types_1 = require_types();
      var hash_1 = require_hash();
      var CellObject = class _CellObject {
        constructor(row, column, value, formula, format) {
          this.type = types_1.ObjectType.CELL;
          this.row = row;
          this.column = column;
          this.value = value;
          this.formula = formula;
          this.format = format;
          this.hash = this.calculateHash();
        }
        calculateHash() {
          return (0, hash_1.calculateHash)({
            type: this.type,
            row: this.row,
            column: this.column,
            value: this.value,
            formula: this.formula,
            format: this.format
          });
        }
        /**
         * 更新单元格值
         */
        updateValue(value, formula, format) {
          return new _CellObject(this.row, this.column, value, formula, format);
        }
        /**
         * 检查是否为空单元格
         */
        isEmpty() {
          return this.value === null || this.value === void 0 || this.value === "";
        }
        /**
         * 转换为JSON
         */
        toJSON() {
          return {
            type: this.type,
            row: this.row,
            column: this.column,
            value: this.value,
            formula: this.formula,
            format: this.format,
            hash: this.hash
          };
        }
        /**
         * 从JSON创建对象
         */
        static fromJSON(json) {
          return new _CellObject(json.row, json.column, json.value, json.formula, json.format);
        }
      };
      exports.CellObject = CellObject;
    }
  });

  // dist/core/structure.js
  var require_structure = __commonJS({
    "dist/core/structure.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.TableStructure = void 0;
      var hash_1 = require_hash();
      var TableStructure = class _TableStructure {
        constructor() {
          this.columns = /* @__PURE__ */ new Map();
          this.rows = /* @__PURE__ */ new Map();
          this.columnOrder = [];
          this.rowOrder = [];
          this.hash = this.calculateHash();
        }
        /**
         * 添加列
         */
        addColumn(column) {
          this.columns.set(column.id, (0, hash_1.deepClone)(column));
          const insertIndex = this.columnOrder.findIndex((id) => {
            const existingColumn = this.columns.get(id);
            return existingColumn && existingColumn.order > column.order;
          });
          if (insertIndex === -1) {
            this.columnOrder.push(column.id);
          } else {
            this.columnOrder.splice(insertIndex, 0, column.id);
          }
          this.updateHash();
        }
        /**
         * 删除列
         */
        removeColumn(columnId) {
          if (this.columns.delete(columnId)) {
            this.columnOrder = this.columnOrder.filter((id) => id !== columnId);
            this.updateHash();
            return true;
          }
          return false;
        }
        /**
         * 更新列信息
         */
        updateColumn(columnId, updates) {
          const column = this.columns.get(columnId);
          if (column) {
            const updatedColumn = { ...column, ...updates };
            this.columns.set(columnId, updatedColumn);
            this.updateHash();
            return true;
          }
          return false;
        }
        /**
         * 移动列位置
         */
        moveColumn(columnId, newIndex) {
          const currentIndex = this.columnOrder.indexOf(columnId);
          if (currentIndex === -1 || newIndex < 0 || newIndex >= this.columnOrder.length) {
            return false;
          }
          this.columnOrder.splice(currentIndex, 1);
          this.columnOrder.splice(newIndex, 0, columnId);
          this.updateColumnOrders();
          this.updateHash();
          return true;
        }
        /**
         * 添加行
         */
        addRow(row) {
          this.rows.set(row.id, (0, hash_1.deepClone)(row));
          const insertIndex = this.rowOrder.findIndex((id) => {
            const existingRow = this.rows.get(id);
            return existingRow && existingRow.order > row.order;
          });
          if (insertIndex === -1) {
            this.rowOrder.push(row.id);
          } else {
            this.rowOrder.splice(insertIndex, 0, row.id);
          }
          this.updateHash();
        }
        /**
         * 删除行
         */
        removeRow(rowId) {
          if (this.rows.delete(rowId)) {
            this.rowOrder = this.rowOrder.filter((id) => id !== rowId);
            this.updateHash();
            return true;
          }
          return false;
        }
        /**
         * 排序行
         */
        sortRows(newOrder) {
          if (newOrder.length === this.rowOrder.length && newOrder.every((id) => this.rowOrder.includes(id))) {
            this.rowOrder = [...newOrder];
            this.updateRowOrders();
            this.updateHash();
          }
        }
        /**
         * 获取列信息
         */
        getColumn(columnId) {
          return this.columns.get(columnId);
        }
        /**
         * 获取行信息
         */
        getRow(rowId) {
          return this.rows.get(rowId);
        }
        /**
         * 获取所有列ID（按顺序）
         */
        getColumnIds() {
          return [...this.columnOrder];
        }
        /**
         * 获取所有行ID（按顺序）
         */
        getRowIds() {
          return [...this.rowOrder];
        }
        updateColumnOrders() {
          this.columnOrder.forEach((id, index) => {
            const column = this.columns.get(id);
            if (column) {
              column.order = index;
            }
          });
        }
        updateRowOrders() {
          this.rowOrder.forEach((id, index) => {
            const row = this.rows.get(id);
            if (row) {
              row.order = index;
            }
          });
        }
        updateHash() {
          this.hash = this.calculateHash();
        }
        calculateHash() {
          return (0, hash_1.calculateHash)({
            columns: Array.from(this.columns.entries()),
            rows: Array.from(this.rows.entries()),
            columnOrder: this.columnOrder,
            rowOrder: this.rowOrder
          });
        }
        /**
         * 克隆结构
         */
        clone() {
          const cloned = new _TableStructure();
          cloned.columns = new Map(Array.from(this.columns.entries()).map(([k, v]) => [k, (0, hash_1.deepClone)(v)]));
          cloned.rows = new Map(Array.from(this.rows.entries()).map(([k, v]) => [k, (0, hash_1.deepClone)(v)]));
          cloned.columnOrder = [...this.columnOrder];
          cloned.rowOrder = [...this.rowOrder];
          cloned.updateHash();
          return cloned;
        }
        /**
         * 转换为JSON
         */
        toJSON() {
          return {
            columns: Array.from(this.columns.entries()),
            rows: Array.from(this.rows.entries()),
            columnOrder: this.columnOrder,
            rowOrder: this.rowOrder,
            hash: this.hash
          };
        }
        /**
         * 从JSON创建对象
         */
        static fromJSON(json) {
          const structure = new _TableStructure();
          structure.columns = new Map(json.columns);
          structure.rows = new Map(json.rows);
          structure.columnOrder = json.columnOrder;
          structure.rowOrder = json.rowOrder;
          structure.updateHash();
          return structure;
        }
      };
      exports.TableStructure = TableStructure;
    }
  });

  // dist/core/sheet.js
  var require_sheet = __commonJS({
    "dist/core/sheet.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SheetTree = void 0;
      var types_1 = require_types();
      var structure_1 = require_structure();
      var hash_1 = require_hash();
      var hash_2 = require_hash();
      var SheetTree = class _SheetTree {
        constructor(name) {
          this.type = types_1.ObjectType.SHEET;
          this.name = name;
          this.cells = /* @__PURE__ */ new Map();
          this.structure = new structure_1.TableStructure();
          this.hash = this.calculateHash();
        }
        /**
         * 设置单元格哈希
         */
        setCellHash(row, col, hash) {
          const key = (0, hash_2.formatPosition)(row, col);
          this.cells.set(key, hash);
          this.updateHash();
        }
        /**
         * 获取单元格哈希
         */
        getCellHash(row, col) {
          const key = (0, hash_2.formatPosition)(row, col);
          return this.cells.get(key);
        }
        /**
         * 删除单元格
         */
        deleteCell(row, col) {
          const key = (0, hash_2.formatPosition)(row, col);
          const deleted = this.cells.delete(key);
          if (deleted) {
            this.updateHash();
          }
          return deleted;
        }
        /**
         * 获取所有单元格位置
         */
        getAllCellPositions() {
          return Array.from(this.cells.keys()).map((key) => (0, hash_2.parsePosition)(key));
        }
        /**
         * 获取指定区域的单元格
         */
        getCellsInRange(startRow, startCol, endRow, endCol) {
          const result = /* @__PURE__ */ new Map();
          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const hash = this.getCellHash(row, col);
              if (hash) {
                result.set((0, hash_2.formatPosition)(row, col), hash);
              }
            }
          }
          return result;
        }
        /**
         * 清空所有单元格
         */
        clearAllCells() {
          this.cells.clear();
          this.updateHash();
        }
        /**
         * 获取工作表边界
         */
        getBounds() {
          if (this.cells.size === 0) {
            return null;
          }
          let minRow = Infinity, maxRow = -Infinity;
          let minCol = Infinity, maxCol = -Infinity;
          for (const key of this.cells.keys()) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
          }
          return { minRow, maxRow, minCol, maxCol };
        }
        /**
         * 插入行（在指定行之前插入）
         */
        insertRowBefore(targetRow) {
          const newCells = /* @__PURE__ */ new Map();
          for (const [key, hash] of this.cells) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            const newRow = row >= targetRow ? row + 1 : row;
            newCells.set((0, hash_2.formatPosition)(newRow, col), hash);
          }
          this.cells = newCells;
          this.updateHash();
        }
        /**
         * 插入列（在指定列之前插入）
         */
        insertColumnBefore(targetCol) {
          const newCells = /* @__PURE__ */ new Map();
          for (const [key, hash] of this.cells) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            const newCol = col >= targetCol ? col + 1 : col;
            newCells.set((0, hash_2.formatPosition)(row, newCol), hash);
          }
          this.cells = newCells;
          this.updateHash();
        }
        /**
         * 删除行
         */
        deleteRow(targetRow) {
          const newCells = /* @__PURE__ */ new Map();
          for (const [key, hash] of this.cells) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            if (row === targetRow) {
              continue;
            }
            const newRow = row > targetRow ? row - 1 : row;
            newCells.set((0, hash_2.formatPosition)(newRow, col), hash);
          }
          this.cells = newCells;
          this.updateHash();
        }
        /**
         * 删除列
         */
        deleteColumn(targetCol) {
          const newCells = /* @__PURE__ */ new Map();
          for (const [key, hash] of this.cells) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            if (col === targetCol) {
              continue;
            }
            const newCol = col > targetCol ? col - 1 : col;
            newCells.set((0, hash_2.formatPosition)(row, newCol), hash);
          }
          this.cells = newCells;
          this.updateHash();
        }
        updateHash() {
          this.hash = this.calculateHash();
        }
        calculateHash() {
          return (0, hash_1.calculateHash)({
            type: this.type,
            name: this.name,
            cells: Array.from(this.cells.entries()),
            structure: this.structure.hash
          });
        }
        /**
         * 克隆工作表
         */
        clone() {
          const cloned = new _SheetTree(this.name);
          cloned.cells = new Map(this.cells);
          cloned.structure = this.structure.clone();
          cloned.updateHash();
          return cloned;
        }
        /**
         * 转换为JSON
         */
        toJSON() {
          return {
            type: this.type,
            name: this.name,
            cells: Array.from(this.cells.entries()),
            structure: this.structure.toJSON(),
            hash: this.hash
          };
        }
        /**
         * 从JSON创建对象
         */
        static fromJSON(json) {
          const sheet = new _SheetTree(json.name);
          sheet.cells = new Map(json.cells);
          sheet.structure = structure_1.TableStructure.fromJSON(json.structure);
          sheet.updateHash();
          return sheet;
        }
      };
      exports.SheetTree = SheetTree;
    }
  });

  // dist/core/commit.js
  var require_commit = __commonJS({
    "dist/core/commit.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CommitObject = void 0;
      var types_1 = require_types();
      var hash_1 = require_hash();
      var CommitObject = class _CommitObject {
        constructor(tree, message, author, email, parent) {
          this.type = types_1.ObjectType.COMMIT;
          this.tree = tree;
          this.message = message;
          this.author = author;
          this.email = email;
          this.parent = parent;
          this.timestamp = Date.now();
          this.hash = this.calculateHash();
        }
        calculateHash() {
          return (0, hash_1.calculateHash)({
            type: this.type,
            tree: this.tree,
            parent: this.parent,
            author: this.author,
            email: this.email,
            message: this.message,
            timestamp: this.timestamp
          });
        }
        /**
         * 检查是否为初始提交
         */
        isInitialCommit() {
          return this.parent === void 0 || this.parent === "";
        }
        /**
         * 获取简短哈希
         */
        getShortHash() {
          return this.hash.substring(0, 7);
        }
        /**
         * 格式化提交信息
         */
        format() {
          const date = new Date(this.timestamp).toLocaleString();
          return `${this.getShortHash()} ${this.message}
Author: ${this.author} <${this.email}>
Date: ${date}`;
        }
        /**
         * 转换为JSON
         */
        toJSON() {
          return {
            type: this.type,
            tree: this.tree,
            parent: this.parent,
            author: this.author,
            email: this.email,
            message: this.message,
            timestamp: this.timestamp,
            hash: this.hash
          };
        }
        /**
         * 从JSON创建对象
         */
        static fromJSON(json) {
          const commit = new _CommitObject(json.tree, json.message, json.author, json.email, json.parent);
          commit.timestamp = json.timestamp;
          commit.hash = json.hash;
          return commit;
        }
      };
      exports.CommitObject = CommitObject;
    }
  });

  // dist/core/table-git.js
  var require_table_git = __commonJS({
    "dist/core/table-git.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.TableGit = void 0;
      var types_1 = require_types();
      var cell_1 = require_cell();
      var sheet_1 = require_sheet();
      var commit_1 = require_commit();
      var TableGit2 = class {
        constructor() {
          this.objects = /* @__PURE__ */ new Map();
          this.refs = /* @__PURE__ */ new Map();
          this.head = "main";
          this.index = /* @__PURE__ */ new Map();
          this.workingTree = /* @__PURE__ */ new Map();
        }
        /**
         * 初始化仓库
         */
        init(branchName = "main") {
          this.head = branchName;
          this.refs.set(branchName, "");
          const emptyTree = new sheet_1.SheetTree("default");
          const treeHash = this.storeObject(emptyTree);
          const initialCommit = new commit_1.CommitObject(treeHash, "Initial commit", "System", "system@tablegit.com");
          const commitHash = this.storeObject(initialCommit);
          this.refs.set(branchName, commitHash);
          this.loadWorkingTree();
        }
        // ========== 单元格操作 ==========
        /**
         * 添加或更新单元格
         */
        addCellChange(sheetName, row, column, value, formula, format) {
          const cell = new cell_1.CellObject(row, column, value, formula, format);
          const changeKey = `${sheetName}:cell:${row},${column}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.CELL_UPDATE,
            sheetName,
            details: cell,
            timestamp: Date.now()
          });
        }
        /**
         * 删除单元格
         */
        deleteCellChange(sheetName, row, column) {
          const changeKey = `${sheetName}:cell:${row},${column}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.CELL_DELETE,
            sheetName,
            details: { row, column },
            timestamp: Date.now()
          });
        }
        // ========== 列操作 ==========
        /**
         * 添加列
         */
        addColumn(sheetName, column) {
          const changeKey = `${sheetName}:column:add:${column.id}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.COLUMN_ADD,
            sheetName,
            details: column,
            timestamp: Date.now()
          });
        }
        /**
         * 更新列信息
         */
        updateColumn(sheetName, columnId, updates) {
          const changeKey = `${sheetName}:column:update:${columnId}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.COLUMN_UPDATE,
            sheetName,
            details: { columnId, updates },
            timestamp: Date.now()
          });
        }
        /**
         * 删除列
         */
        deleteColumn(sheetName, columnId) {
          const changeKey = `${sheetName}:column:delete:${columnId}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.COLUMN_DELETE,
            sheetName,
            details: { columnId },
            timestamp: Date.now()
          });
        }
        /**
         * 移动列位置
         */
        moveColumn(sheetName, columnId, newIndex) {
          const changeKey = `${sheetName}:column:move:${columnId}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.COLUMN_MOVE,
            sheetName,
            details: { columnId, newIndex },
            timestamp: Date.now()
          });
        }
        // ========== 行操作 ==========
        /**
         * 添加行
         */
        addRow(sheetName, row) {
          const changeKey = `${sheetName}:row:add:${row.id}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.ROW_ADD,
            sheetName,
            details: row,
            timestamp: Date.now()
          });
        }
        /**
         * 删除行
         */
        deleteRow(sheetName, rowId) {
          const changeKey = `${sheetName}:row:delete:${rowId}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.ROW_DELETE,
            sheetName,
            details: { rowId },
            timestamp: Date.now()
          });
        }
        /**
         * 排序行
         */
        sortRows(sheetName, sortCriteria) {
          const changeKey = `${sheetName}:row:sort:${Date.now()}`;
          this.index.set(changeKey, {
            type: types_1.ChangeType.ROW_SORT,
            sheetName,
            details: { sortCriteria },
            timestamp: Date.now()
          });
        }
        // ========== 版本控制核心操作 ==========
        /**
         * 提交变更
         */
        commit(message, author, email) {
          if (this.index.size === 0) {
            throw new Error("Nothing to commit");
          }
          const newTree = this.buildTreeFromIndex();
          const treeHash = this.storeObject(newTree);
          const currentCommitHash = this.refs.get(this.head);
          const commit = new commit_1.CommitObject(treeHash, message, author, email, currentCommitHash);
          const commitHash = this.storeObject(commit);
          this.refs.set(this.head, commitHash);
          this.index.clear();
          this.loadWorkingTree();
          return commitHash;
        }
        /**
         * 从暂存区构建树对象
         */
        buildTreeFromIndex() {
          let sheet = this.workingTree.get("default")?.clone() || new sheet_1.SheetTree("default");
          for (const [key, change] of this.index) {
            this.applyChange(sheet, change);
          }
          return sheet;
        }
        /**
         * 应用单个变更
         */
        applyChange(sheet, change) {
          switch (change.type) {
            case types_1.ChangeType.CELL_UPDATE:
            case types_1.ChangeType.CELL_ADD:
              const cell = change.details;
              const cellHash = this.storeObject(cell);
              sheet.setCellHash(cell.row, cell.column, cellHash);
              break;
            case types_1.ChangeType.CELL_DELETE:
              const { row, column } = change.details;
              sheet.deleteCell(row, column);
              break;
            case types_1.ChangeType.COLUMN_ADD:
              sheet.structure.addColumn(change.details);
              break;
            case types_1.ChangeType.COLUMN_UPDATE:
              const { columnId, updates } = change.details;
              sheet.structure.updateColumn(columnId, updates);
              break;
            case types_1.ChangeType.COLUMN_DELETE:
              sheet.structure.removeColumn(change.details.columnId);
              break;
            case types_1.ChangeType.COLUMN_MOVE:
              sheet.structure.moveColumn(change.details.columnId, change.details.newIndex);
              break;
            case types_1.ChangeType.ROW_ADD:
              sheet.structure.addRow(change.details);
              break;
            case types_1.ChangeType.ROW_DELETE:
              sheet.structure.removeRow(change.details.rowId);
              break;
            case types_1.ChangeType.ROW_SORT:
              const { sortCriteria } = change.details;
              this.applySorting(sheet, sortCriteria);
              break;
          }
        }
        /**
         * 应用排序
         */
        applySorting(sheet, criteria) {
          const currentOrder = sheet.structure.getRowIds();
          const sortedOrder = [...currentOrder].sort((a, b) => {
            return a.localeCompare(b);
          });
          sheet.structure.sortRows(sortedOrder);
        }
        // ========== 对象存储 ==========
        /**
         * 存储对象
         */
        storeObject(obj) {
          const hash = obj.hash;
          this.objects.set(hash, obj);
          return hash;
        }
        /**
         * 获取对象
         */
        getObject(hash) {
          return this.objects.get(hash);
        }
        // ========== 分支操作 ==========
        /**
         * 创建分支
         */
        createBranch(branchName) {
          const currentCommitHash = this.refs.get(this.head);
          if (currentCommitHash) {
            this.refs.set(branchName, currentCommitHash);
          } else {
            throw new Error("Cannot create branch: no commits found");
          }
        }
        /**
         * 切换分支或提交
         */
        checkout(target) {
          if (this.index.size > 0) {
            throw new Error("Cannot checkout: you have unstaged changes");
          }
          if (this.refs.has(target)) {
            this.head = target;
            this.loadWorkingTree();
            return;
          }
          const commit = this.getObject(target);
          if (commit && commit.type === types_1.ObjectType.COMMIT) {
            this.head = target;
            this.loadWorkingTreeFromCommit(target);
            return;
          }
          throw new Error(`Branch or commit '${target}' does not exist`);
        }
        /**
         * 从指定提交加载工作区
         */
        loadWorkingTreeFromCommit(commitHash) {
          const commit = this.getObject(commitHash);
          if (commit) {
            const tree = this.getObject(commit.tree);
            if (tree) {
              this.workingTree.set("default", tree.clone());
            }
          }
        }
        /**
         * 获取当前分支
         */
        getCurrentBranch() {
          return this.head;
        }
        /**
         * 检查当前是否处于分离HEAD状态
         */
        isDetachedHead() {
          return !this.refs.has(this.head);
        }
        /**
         * 获取当前HEAD指向的提交哈希
         */
        getCurrentCommitHash() {
          if (this.isDetachedHead()) {
            return this.head;
          }
          return this.refs.get(this.head);
        }
        /**
         * 获取所有分支
         */
        getBranches() {
          return Array.from(this.refs.keys());
        }
        /**
         * 加载工作区
         */
        loadWorkingTree() {
          const commitHash = this.refs.get(this.head);
          if (commitHash) {
            const commit = this.getObject(commitHash);
            if (commit) {
              const tree = this.getObject(commit.tree);
              if (tree) {
                this.workingTree.set("default", tree.clone());
              }
            }
          }
        }
        // ========== 状态查询 ==========
        /**
         * 获取当前状态
         */
        status() {
          const lastCommitHash = this.refs.get(this.head);
          return {
            branch: this.head,
            stagedChanges: this.index.size,
            lastCommit: lastCommitHash ? this.getObject(lastCommitHash)?.getShortHash() : void 0
          };
        }
        /**
         * 获取暂存区变更
         */
        getStagedChanges() {
          return Array.from(this.index.values());
        }
        /**
         * 重置暂存区
         */
        reset() {
          this.index.clear();
        }
        /**
         * 获取提交历史
         */
        getCommitHistory(limit = 10) {
          const history = [];
          let currentHash = this.refs.get(this.head);
          while (currentHash && history.length < limit) {
            const commit = this.getObject(currentHash);
            if (!commit)
              break;
            history.push(commit);
            currentHash = commit.parent;
          }
          return history;
        }
        /**
         * 获取工作区内容
         */
        getWorkingTree() {
          return this.workingTree.get("default");
        }
        /**
         * 获取单元格值
         */
        getCellValue(row, col) {
          const sheet = this.workingTree.get("default");
          if (!sheet)
            return void 0;
          const cellHash = sheet.getCellHash(row, col);
          if (!cellHash)
            return void 0;
          const cell = this.getObject(cellHash);
          return cell?.value;
        }
        /**
         * 获取单元格对象
         */
        getCell(row, col) {
          const sheet = this.workingTree.get("default");
          if (!sheet)
            return void 0;
          const cellHash = sheet.getCellHash(row, col);
          if (!cellHash)
            return void 0;
          return this.getObject(cellHash);
        }
      };
      exports.TableGit = TableGit2;
    }
  });

  // dist/core/diff-merge.js
  var require_diff_merge = __commonJS({
    "dist/core/diff-merge.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.DiffMergeEngine = void 0;
      var hash_1 = require_hash();
      var DiffMergeEngine = class {
        constructor(tableGit) {
          this.tableGit = tableGit;
        }
        /**
         * 计算两个提交之间的差异
         */
        diff(commitHash1, commitHash2) {
          const commit1 = this.getObject(commitHash1);
          const commit2 = this.getObject(commitHash2);
          if (!commit1 || !commit2) {
            throw new Error("Invalid commit hash");
          }
          const tree1 = this.getObject(commit1.tree);
          const tree2 = this.getObject(commit2.tree);
          return this.diffTrees(tree1, tree2);
        }
        /**
         * 比较两个树对象
         */
        diffTrees(tree1, tree2) {
          const result = {
            cellChanges: {
              added: [],
              modified: [],
              deleted: []
            },
            structureChanges: {
              columns: {
                added: [],
                modified: [],
                deleted: [],
                moved: []
              },
              rows: {
                added: [],
                modified: [],
                deleted: [],
                sorted: { oldOrder: [], newOrder: [] }
              }
            }
          };
          this.diffCells(tree1, tree2, result);
          this.diffStructure(tree1, tree2, result);
          return result;
        }
        /**
         * 比较单元格差异
         */
        diffCells(tree1, tree2, result) {
          const allCellKeys = /* @__PURE__ */ new Set([...tree1.cells.keys(), ...tree2.cells.keys()]);
          for (const key of allCellKeys) {
            const hash1 = tree1.cells.get(key);
            const hash2 = tree2.cells.get(key);
            if (!hash1 && hash2) {
              const cell = this.getObject(hash2);
              result.cellChanges.added.push(cell);
            } else if (hash1 && !hash2) {
              const cell = this.getObject(hash1);
              result.cellChanges.deleted.push(cell);
            } else if (hash1 !== hash2) {
              if (hash1 && hash2) {
                const oldCell = this.getObject(hash1);
                const newCell = this.getObject(hash2);
                result.cellChanges.modified.push({ old: oldCell, new: newCell });
              }
            }
          }
        }
        /**
         * 比较结构差异
         */
        diffStructure(tree1, tree2, result) {
          const columns1 = tree1.structure.columns;
          const columns2 = tree2.structure.columns;
          for (const [id, col2] of columns2) {
            const col1 = columns1.get(id);
            if (!col1) {
              result.structureChanges.columns.added.push(col2);
            } else if (!(0, hash_1.deepEqual)(col1, col2)) {
              result.structureChanges.columns.modified.push({ old: col1, new: col2 });
            }
          }
          for (const [id, col1] of columns1) {
            if (!columns2.has(id)) {
              result.structureChanges.columns.deleted.push(col1);
            }
          }
          this.diffColumnOrder(tree1, tree2, result);
          this.diffRowOrder(tree1, tree2, result);
        }
        /**
         * 比较列顺序差异
         */
        diffColumnOrder(tree1, tree2, result) {
          const order1 = tree1.structure.columnOrder;
          const order2 = tree2.structure.columnOrder;
          if (!(0, hash_1.deepEqual)(order1, order2)) {
            for (let i = 0; i < order2.length; i++) {
              const colId = order2[i];
              const oldIndex = order1.indexOf(colId);
              if (oldIndex !== -1 && oldIndex !== i) {
                const column = tree2.structure.columns.get(colId);
                if (column) {
                  result.structureChanges.columns.moved.push({
                    column,
                    oldIndex,
                    newIndex: i
                  });
                }
              }
            }
          }
        }
        /**
         * 比较行顺序差异
         */
        diffRowOrder(tree1, tree2, result) {
          const order1 = tree1.structure.rowOrder;
          const order2 = tree2.structure.rowOrder;
          if (!(0, hash_1.deepEqual)(order1, order2)) {
            result.structureChanges.rows.sorted = {
              oldOrder: order1,
              newOrder: order2
            };
          }
        }
        /**
         * 三路合并
         */
        merge(branchName) {
          const currentCommitHash = this.getCurrentCommitHash();
          const targetCommitHash = this.getBranchCommitHash(branchName);
          if (!currentCommitHash || !targetCommitHash) {
            return { success: false };
          }
          const baseCommitHash = this.findCommonAncestor(currentCommitHash, targetCommitHash);
          if (!baseCommitHash) {
            return { success: false };
          }
          const conflicts = this.threeWayMerge(baseCommitHash, currentCommitHash, targetCommitHash);
          if (conflicts.length === 0) {
            return { success: true };
          } else {
            return { success: false, conflicts };
          }
        }
        /**
         * 三路合并实现
         */
        threeWayMerge(baseHash, currentHash, targetHash) {
          const conflicts = [];
          const baseCommit = this.getObject(baseHash);
          const currentCommit = this.getObject(currentHash);
          const targetCommit = this.getObject(targetHash);
          const baseTree = this.getObject(baseCommit.tree);
          const currentTree = this.getObject(currentCommit.tree);
          const targetTree = this.getObject(targetCommit.tree);
          this.mergeCells(baseTree, currentTree, targetTree, conflicts);
          this.mergeStructure(baseTree, currentTree, targetTree, conflicts);
          return conflicts;
        }
        /**
         * 合并单元格
         */
        mergeCells(baseTree, currentTree, targetTree, conflicts) {
          const allCellKeys = /* @__PURE__ */ new Set([
            ...baseTree.cells.keys(),
            ...currentTree.cells.keys(),
            ...targetTree.cells.keys()
          ]);
          for (const key of allCellKeys) {
            const baseCell = baseTree.cells.get(key);
            const currentCell = currentTree.cells.get(key);
            const targetCell = targetTree.cells.get(key);
            if (currentCell !== targetCell) {
              if (baseCell === currentCell) {
                continue;
              } else if (baseCell === targetCell) {
                continue;
              } else {
                conflicts.push({
                  type: "cell",
                  position: key,
                  base: baseCell ? this.getObject(baseCell) : null,
                  current: currentCell ? this.getObject(currentCell) : null,
                  target: targetCell ? this.getObject(targetCell) : null
                });
              }
            }
          }
        }
        /**
         * 合并结构
         */
        mergeStructure(baseTree, currentTree, targetTree, conflicts) {
          this.mergeColumns(baseTree, currentTree, targetTree, conflicts);
          this.mergeRows(baseTree, currentTree, targetTree, conflicts);
        }
        /**
         * 合并列结构
         */
        mergeColumns(baseTree, currentTree, targetTree, conflicts) {
          const baseColumns = baseTree.structure.columns;
          const currentColumns = currentTree.structure.columns;
          const targetColumns = targetTree.structure.columns;
          const allColumnIds = /* @__PURE__ */ new Set([
            ...baseColumns.keys(),
            ...currentColumns.keys(),
            ...targetColumns.keys()
          ]);
          for (const id of allColumnIds) {
            const baseCol = baseColumns.get(id);
            const currentCol = currentColumns.get(id);
            const targetCol = targetColumns.get(id);
            if (!(0, hash_1.deepEqual)(currentCol, targetCol)) {
              if ((0, hash_1.deepEqual)(baseCol, currentCol)) {
                continue;
              } else if ((0, hash_1.deepEqual)(baseCol, targetCol)) {
                continue;
              } else {
                conflicts.push({
                  type: "column",
                  id,
                  base: baseCol,
                  current: currentCol,
                  target: targetCol
                });
              }
            }
          }
        }
        /**
         * 合并行结构
         */
        mergeRows(baseTree, currentTree, targetTree, conflicts) {
        }
        /**
         * 找到共同祖先
         */
        findCommonAncestor(hash1, hash2) {
          const history1 = this.getCommitHistory(hash1);
          const history2 = this.getCommitHistory(hash2);
          for (const commit of history1) {
            if (history2.includes(commit)) {
              return commit;
            }
          }
          return null;
        }
        /**
         * 获取提交历史
         */
        getCommitHistory(commitHash) {
          const history = [];
          let current = commitHash;
          while (current) {
            history.push(current);
            const commit = this.getObject(current);
            if (!commit)
              break;
            current = commit.parent || "";
          }
          return history;
        }
        // 辅助方法
        getObject(hash) {
          return this.tableGit.objects.get(hash);
        }
        getCurrentCommitHash() {
          return this.tableGit.refs.get(this.tableGit.head);
        }
        getBranchCommitHash(branchName) {
          return this.tableGit.refs.get(branchName);
        }
      };
      exports.DiffMergeEngine = DiffMergeEngine;
    }
  });

  // dist/core/conflict-resolver.js
  var require_conflict_resolver = __commonJS({
    "dist/core/conflict-resolver.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ConflictResolver = void 0;
      var cell_1 = require_cell();
      var hash_1 = require_hash();
      var ConflictResolver = class {
        constructor(defaultStrategy = "manual") {
          this.defaultStrategy = "manual";
          this.defaultStrategy = defaultStrategy;
        }
        /**
         * 解决单元格冲突
         */
        resolveCellConflict(conflict, resolution = this.defaultStrategy) {
          if (typeof resolution === "object") {
            return this.createCustomCell(conflict, resolution);
          }
          switch (resolution) {
            case "current":
              return conflict.current || null;
            case "target":
              return conflict.target || null;
            case "merge":
              return this.mergeCell(conflict);
            case "manual":
            default:
              return null;
          }
        }
        /**
         * 解决结构冲突
         */
        resolveStructureConflict(conflict, resolution = this.defaultStrategy) {
          switch (resolution) {
            case "current":
              return conflict.current;
            case "target":
              return conflict.target;
            case "merge":
              return this.mergeStructure(conflict);
            case "manual":
            default:
              return null;
          }
        }
        /**
         * 批量解决冲突
         */
        batchResolve(conflicts, strategy) {
          return conflicts.map((conflict) => {
            if ("position" in conflict) {
              return this.resolveCellConflict(conflict, strategy);
            } else {
              return this.resolveStructureConflict(conflict, strategy);
            }
          });
        }
        /**
         * 智能合并单元格
         */
        mergeCell(conflict) {
          const { base, current, target } = conflict;
          if (!current && !target) {
            return null;
          }
          if (!current)
            return target;
          if (!target)
            return current;
          const mergedCell = this.createMergedCell(base, current, target);
          return mergedCell;
        }
        /**
         * 创建合并后的单元格
         */
        createMergedCell(base, current, target) {
          if (!current && !target) {
            throw new Error("Cannot merge: both current and target are null");
          }
          const reference = current || target;
          const value = this.mergeValue(base?.value, current?.value, target?.value);
          const formula = this.mergeFormula(base?.formula, current?.formula, target?.formula);
          const format = this.mergeFormat(base?.format, current?.format, target?.format);
          return new cell_1.CellObject(reference.row, reference.column, value, formula, format);
        }
        /**
         * 合并单元格值
         */
        mergeValue(base, current, target) {
          if (typeof current === "number" && typeof target === "number") {
            return (current + target) / 2;
          }
          if (typeof current === "string" && typeof target === "string" && current !== target) {
            return `${current} | ${target}`;
          }
          return current !== void 0 ? current : target !== void 0 ? target : null;
        }
        /**
         * 合并公式
         */
        mergeFormula(base, current, target) {
          return current || target;
        }
        /**
         * 合并格式
         */
        mergeFormat(base, current, target) {
          if (!current && !target)
            return void 0;
          if (!current)
            return (0, hash_1.deepClone)(target);
          if (!target)
            return (0, hash_1.deepClone)(current);
          return {
            ...target,
            ...current,
            // 当前分支的格式优先级更高
            // 但某些属性可以智能合并
            backgroundColor: current.backgroundColor || target.backgroundColor,
            textColor: current.textColor || target.textColor
          };
        }
        /**
         * 创建自定义单元格
         */
        createCustomCell(conflict, resolution) {
          const reference = conflict.current || conflict.target;
          if (!reference)
            return null;
          return new cell_1.CellObject(reference.row, reference.column, resolution.value !== void 0 ? resolution.value : reference.value, resolution.formula !== void 0 ? resolution.formula : reference.formula, resolution.format !== void 0 ? resolution.format : reference.format);
        }
        /**
         * 智能合并结构
         */
        mergeStructure(conflict) {
          if (conflict.type === "column") {
            return this.mergeColumnMetadata(conflict.base, conflict.current, conflict.target);
          }
          return conflict.current;
        }
        /**
         * 合并列元数据
         */
        mergeColumnMetadata(base, current, target) {
          if (!current && !target) {
            return base;
          }
          if (!current)
            return (0, hash_1.deepClone)(target);
          if (!target)
            return (0, hash_1.deepClone)(current);
          const merged = {
            id: current.id,
            description: this.mergeStringField(base?.description, current.description, target.description),
            dataType: current.dataType !== base?.dataType ? current.dataType : target.dataType,
            width: current.width !== base?.width ? current.width : target.width,
            hidden: current.hidden !== base?.hidden ? current.hidden : target.hidden,
            order: current.order,
            constraints: this.mergeConstraints(base?.constraints, current.constraints, target.constraints)
          };
          return merged;
        }
        /**
         * 合并字符串字段
         */
        mergeStringField(base, current, target) {
          if (current === base) {
            return target || current || "";
          }
          if (target === base) {
            return current || target || "";
          }
          return current || target || "";
        }
        /**
         * 合并约束条件
         */
        mergeConstraints(base, current, target) {
          return {
            ...base,
            ...target,
            ...current
            // 当前分支的约束优先级最高
          };
        }
        /**
         * 生成冲突报告
         */
        generateConflictReport(conflicts) {
          const cellConflicts = conflicts.filter((c) => "position" in c);
          const structureConflicts = conflicts.filter((c) => "type" in c);
          let report = `\u51B2\u7A81\u62A5\u544A (${conflicts.length} \u4E2A\u51B2\u7A81)

`;
          if (cellConflicts.length > 0) {
            report += `\u5355\u5143\u683C\u51B2\u7A81 (${cellConflicts.length} \u4E2A):
`;
            cellConflicts.forEach((conflict, index) => {
              report += `${index + 1}. \u4F4D\u7F6E ${conflict.position}
`;
              report += `   \u5F53\u524D\u503C: ${this.formatCellValue(conflict.current)}
`;
              report += `   \u76EE\u6807\u503C: ${this.formatCellValue(conflict.target)}

`;
            });
          }
          if (structureConflicts.length > 0) {
            report += `\u7ED3\u6784\u51B2\u7A81 (${structureConflicts.length} \u4E2A):
`;
            structureConflicts.forEach((conflict, index) => {
              report += `${index + 1}. ${conflict.type} "${conflict.id}"
`;
              report += `   \u5F53\u524D: ${JSON.stringify(conflict.current, null, 2)}
`;
              report += `   \u76EE\u6807: ${JSON.stringify(conflict.target, null, 2)}

`;
            });
          }
          return report;
        }
        /**
         * 格式化单元格值显示
         */
        formatCellValue(cell) {
          if (!cell)
            return "(\u7A7A)";
          let display = `\u503C: ${cell.value}`;
          if (cell.formula) {
            display += `, \u516C\u5F0F: ${cell.formula}`;
          }
          return display;
        }
        /**
         * 检查冲突是否可以自动解决
         */
        canAutoResolve(conflict) {
          if ("position" in conflict) {
            const cellConflict = conflict;
            if (!cellConflict.current || !cellConflict.target) {
              return true;
            }
            if (cellConflict.current.value === cellConflict.target.value) {
              return true;
            }
            return false;
          } else {
            return false;
          }
        }
      };
      exports.ConflictResolver = ConflictResolver;
    }
  });

  // dist/utils/factory.js
  var require_factory = __commonJS({
    "dist/utils/factory.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createTableGit = createTableGit;
      exports.createCell = createCell;
      exports.createColumn = createColumn;
      exports.createRow = createRow;
      exports.createSampleTable = createSampleTable2;
      var table_git_1 = require_table_git();
      var cell_1 = require_cell();
      var hash_1 = require_hash();
      function createTableGit(branchName = "main") {
        const tableGit = new table_git_1.TableGit();
        tableGit.init(branchName);
        return tableGit;
      }
      function createCell(row, column, value, formula, format) {
        return new cell_1.CellObject(row, column, value, formula, format);
      }
      function createColumn(id, options = {}) {
        return {
          id: id || (0, hash_1.generateId)("col_"),
          description: options.description,
          dataType: options.dataType || "mixed",
          width: options.width || 100,
          hidden: options.hidden || false,
          order: options.order || 0,
          constraints: options.constraints
        };
      }
      function createRow(options = {}) {
        return {
          id: options.id || (0, hash_1.generateId)("row_"),
          height: options.height || 25,
          hidden: options.hidden || false,
          order: options.order || 0
        };
      }
      function createSampleTable2() {
        const repo2 = createTableGit();
        const columns = [
          createColumn("product_name", {
            dataType: "string",
            width: 150,
            order: 0,
            constraints: { required: true }
          }),
          createColumn("price", {
            dataType: "number",
            width: 100,
            order: 1,
            constraints: { required: true, min: 0 }
          }),
          createColumn("stock", {
            dataType: "number",
            width: 100,
            order: 2
          }),
          createColumn("description", {
            dataType: "string",
            width: 200,
            order: 3
          })
        ];
        columns.forEach((col) => repo2.addColumn("default", col));
        repo2.addCellChange("default", 0, 0, "\u4EA7\u54C1\u540D\u79F0", void 0, { fontWeight: "bold" });
        repo2.addCellChange("default", 0, 1, "\u4EF7\u683C", void 0, { fontWeight: "bold" });
        repo2.addCellChange("default", 0, 2, "\u5E93\u5B58", void 0, { fontWeight: "bold" });
        repo2.addCellChange("default", 0, 3, "\u63CF\u8FF0", void 0, { fontWeight: "bold" });
        repo2.addCellChange("default", 1, 0, "iPhone 15");
        repo2.addCellChange("default", 1, 1, 5999);
        repo2.addCellChange("default", 1, 2, 100);
        repo2.addCellChange("default", 1, 3, "\u6700\u65B0\u6B3EiPhone");
        repo2.addCellChange("default", 2, 0, "MacBook Pro");
        repo2.addCellChange("default", 2, 1, 12999);
        repo2.addCellChange("default", 2, 2, 50);
        repo2.addCellChange("default", 2, 3, "\u4E13\u4E1A\u7EA7\u7B14\u8BB0\u672C\u7535\u8111");
        repo2.addCellChange("default", 3, 0, "iPad Air");
        repo2.addCellChange("default", 3, 1, 4599);
        repo2.addCellChange("default", 3, 2, 75);
        repo2.addCellChange("default", 3, 3, "\u8F7B\u8584\u5E73\u677F\u7535\u8111");
        repo2.commit("\u521D\u59CB\u5316\u4EA7\u54C1\u8868", "System", "system@example.com");
        return repo2;
      }
    }
  });

  // dist/formatters/adapter.js
  var require_adapter = __commonJS({
    "dist/formatters/adapter.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.TableDataAdapter = void 0;
      var TableDataAdapter2 = class {
        constructor(repo2, sheetName = "default") {
          this.repo = repo2;
          this.sheetName = sheetName;
        }
        build() {
          const sheet = this.repo.getWorkingTree();
          if (!sheet) {
            return { header: [], rows: [], matrix: [], minRow: 0, minCol: 0, maxRow: -1, maxCol: -1 };
          }
          const bounds = sheet.getBounds();
          if (!bounds) {
            return { header: [], rows: [], matrix: [], minRow: 0, minCol: 0, maxRow: -1, maxCol: -1 };
          }
          const { minRow, minCol, maxRow, maxCol } = bounds;
          const matrix = [];
          for (let r = minRow; r <= maxRow; r++) {
            const row = [];
            for (let c = minCol; c <= maxCol; c++) {
              const hash = sheet.getCellHash(r, c);
              if (!hash) {
                row.push(void 0);
              } else {
                const cell = this.repo.getCell(r, c);
                row.push(cell ? cell.value : void 0);
              }
            }
            matrix.push(row);
          }
          const header = minRow === 0 && matrix.length > 0 ? matrix[0] : [];
          const rows = minRow === 0 ? matrix.slice(1) : matrix;
          return { header, rows, matrix, minRow, minCol, maxRow, maxCol };
        }
      };
      exports.TableDataAdapter = TableDataAdapter2;
    }
  });

  // dist/formatters/function-formatter.js
  var require_function_formatter = __commonJS({
    "dist/formatters/function-formatter.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FormatterRegistry = exports.FunctionFormatter = void 0;
      var FunctionFormatter2 = class {
        constructor(options) {
          this.name = options.name;
          this.fn = options.format;
          this.defaults = options.defaults;
        }
        run(data, options) {
          const finalOptions = { ...this.defaults, ...options };
          return this.fn(data, finalOptions);
        }
      };
      exports.FunctionFormatter = FunctionFormatter2;
      var FormatterRegistry2 = class {
        constructor() {
          this.registry = /* @__PURE__ */ new Map();
        }
        register(formatter) {
          this.registry.set(formatter.name, formatter);
        }
        unregister(name) {
          this.registry.delete(name);
        }
        list() {
          return [...this.registry.keys()];
        }
        format(name, data, options) {
          const f = this.registry.get(name);
          if (!f)
            throw new Error(`Formatter '${name}' is not registered`);
          return f.run(data, options);
        }
      };
      exports.FormatterRegistry = FormatterRegistry2;
    }
  });

  // dist/formatters/builtin.js
  var require_builtin = __commonJS({
    "dist/formatters/builtin.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.htmlFormatter = exports.jsonFormatter = exports.csvFormatter = void 0;
      function escapeCsvValue(val, delimiter, quoteText) {
        if (val === null || val === void 0)
          return "";
        const str = typeof val === "string" ? val : String(val);
        const mustQuote = quoteText || str.includes(delimiter) || /[\r\n]/.test(str) || str.includes('"');
        if (!mustQuote)
          return str;
        return '"' + str.replace(/"/g, '""') + '"';
      }
      var csvFormatter2 = (data, options) => {
        const delimiter = options?.delimiter ?? ",";
        const newline = options?.newline ?? "\n";
        const includeHeader = options?.includeHeader ?? true;
        const quoteText = options?.quoteText ?? false;
        const lines = [];
        if (includeHeader && data.header.length) {
          lines.push(data.header.map((v) => escapeCsvValue(v, delimiter, quoteText)).join(delimiter));
        }
        for (const row of data.rows) {
          lines.push((row ?? []).map((v) => escapeCsvValue(v, delimiter, quoteText)).join(delimiter));
        }
        return lines.join(newline);
      };
      exports.csvFormatter = csvFormatter2;
      var jsonFormatter2 = (data, options) => {
        const space = options?.space ?? 2;
        const shape = options?.shape ?? "rows";
        let payload;
        switch (shape) {
          case "matrix":
            payload = data.matrix;
            break;
          case "detailed":
            payload = data;
            break;
          case "rows":
          default:
            payload = {
              header: data.header,
              rows: data.rows
            };
            break;
        }
        return JSON.stringify(payload, null, space);
      };
      exports.jsonFormatter = jsonFormatter2;
      function escapeHtml2(s) {
        if (s === null || s === void 0)
          return "";
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      }
      var htmlFormatter2 = (data, options) => {
        const tableClass = options?.tableClass ?? "table-git";
        const includeHeader = options?.includeHeader ?? true;
        const esc = options?.escapeHtml ?? true;
        const escVal = (v) => esc ? escapeHtml2(v) : v ?? "";
        const parts = [];
        parts.push(`<table class="${tableClass}">`);
        if (includeHeader && data.header.length) {
          parts.push("<thead><tr>");
          for (const h of data.header)
            parts.push(`<th>${escVal(h)}</th>`);
          parts.push("</tr></thead>");
        }
        parts.push("<tbody>");
        for (const row of data.rows) {
          parts.push("<tr>");
          for (const cell of row ?? [])
            parts.push(`<td>${escVal(cell)}</td>`);
          parts.push("</tr>");
        }
        parts.push("</tbody></table>");
        return parts.join("");
      };
      exports.htmlFormatter = htmlFormatter2;
    }
  });

  // dist/index.js
  var require_dist = __commonJS({
    "dist/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      } : function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      });
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.htmlFormatter = exports.jsonFormatter = exports.csvFormatter = exports.FormatterRegistry = exports.FunctionFormatter = exports.TableDataAdapter = exports.createSampleTable = exports.createRow = exports.createColumn = exports.createCell = exports.createTableGit = exports.formatPosition = exports.parsePosition = exports.deepEqual = exports.deepClone = exports.generateId = exports.calculateHash = exports.ConflictResolver = exports.DiffMergeEngine = exports.TableGit = exports.CommitObject = exports.SheetTree = exports.TableStructure = exports.CellObject = void 0;
      var cell_1 = require_cell();
      Object.defineProperty(exports, "CellObject", { enumerable: true, get: function() {
        return cell_1.CellObject;
      } });
      var structure_1 = require_structure();
      Object.defineProperty(exports, "TableStructure", { enumerable: true, get: function() {
        return structure_1.TableStructure;
      } });
      var sheet_1 = require_sheet();
      Object.defineProperty(exports, "SheetTree", { enumerable: true, get: function() {
        return sheet_1.SheetTree;
      } });
      var commit_1 = require_commit();
      Object.defineProperty(exports, "CommitObject", { enumerable: true, get: function() {
        return commit_1.CommitObject;
      } });
      var table_git_1 = require_table_git();
      Object.defineProperty(exports, "TableGit", { enumerable: true, get: function() {
        return table_git_1.TableGit;
      } });
      var diff_merge_1 = require_diff_merge();
      Object.defineProperty(exports, "DiffMergeEngine", { enumerable: true, get: function() {
        return diff_merge_1.DiffMergeEngine;
      } });
      var conflict_resolver_1 = require_conflict_resolver();
      Object.defineProperty(exports, "ConflictResolver", { enumerable: true, get: function() {
        return conflict_resolver_1.ConflictResolver;
      } });
      __exportStar(require_types(), exports);
      var hash_1 = require_hash();
      Object.defineProperty(exports, "calculateHash", { enumerable: true, get: function() {
        return hash_1.calculateHash;
      } });
      Object.defineProperty(exports, "generateId", { enumerable: true, get: function() {
        return hash_1.generateId;
      } });
      Object.defineProperty(exports, "deepClone", { enumerable: true, get: function() {
        return hash_1.deepClone;
      } });
      Object.defineProperty(exports, "deepEqual", { enumerable: true, get: function() {
        return hash_1.deepEqual;
      } });
      Object.defineProperty(exports, "parsePosition", { enumerable: true, get: function() {
        return hash_1.parsePosition;
      } });
      Object.defineProperty(exports, "formatPosition", { enumerable: true, get: function() {
        return hash_1.formatPosition;
      } });
      var factory_1 = require_factory();
      Object.defineProperty(exports, "createTableGit", { enumerable: true, get: function() {
        return factory_1.createTableGit;
      } });
      Object.defineProperty(exports, "createCell", { enumerable: true, get: function() {
        return factory_1.createCell;
      } });
      Object.defineProperty(exports, "createColumn", { enumerable: true, get: function() {
        return factory_1.createColumn;
      } });
      Object.defineProperty(exports, "createRow", { enumerable: true, get: function() {
        return factory_1.createRow;
      } });
      Object.defineProperty(exports, "createSampleTable", { enumerable: true, get: function() {
        return factory_1.createSampleTable;
      } });
      var adapter_1 = require_adapter();
      Object.defineProperty(exports, "TableDataAdapter", { enumerable: true, get: function() {
        return adapter_1.TableDataAdapter;
      } });
      var function_formatter_1 = require_function_formatter();
      Object.defineProperty(exports, "FunctionFormatter", { enumerable: true, get: function() {
        return function_formatter_1.FunctionFormatter;
      } });
      Object.defineProperty(exports, "FormatterRegistry", { enumerable: true, get: function() {
        return function_formatter_1.FormatterRegistry;
      } });
      var builtin_1 = require_builtin();
      Object.defineProperty(exports, "csvFormatter", { enumerable: true, get: function() {
        return builtin_1.csvFormatter;
      } });
      Object.defineProperty(exports, "jsonFormatter", { enumerable: true, get: function() {
        return builtin_1.jsonFormatter;
      } });
      Object.defineProperty(exports, "htmlFormatter", { enumerable: true, get: function() {
        return builtin_1.htmlFormatter;
      } });
    }
  });

  // demo/app.ts
  var import_dist = __toESM(require_dist());
  var $ = (id) => document.getElementById(id);
  var repo = null;
  var registry = new import_dist.FormatterRegistry();
  registry.register(new import_dist.FunctionFormatter({ name: "csv", format: import_dist.csvFormatter }));
  registry.register(new import_dist.FunctionFormatter({ name: "json", format: import_dist.jsonFormatter }));
  registry.register(new import_dist.FunctionFormatter({ name: "html", format: import_dist.htmlFormatter }));
  function setText(el, text) {
    if (el) el.textContent = text;
  }
  function setHTML(el, html) {
    if (el) el.innerHTML = html;
  }
  function escapeHtml(s) {
    if (s === null || s === void 0) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function renderList(elId, items) {
    const el = $(elId);
    if (!el) return;
    const html = `<ul class="list">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    setHTML(el, html);
  }
  function refreshAll() {
    if (!repo) return;
    const s = repo.status();
    setText($("status"), `\u5206\u652F: ${s.branch}, \u6682\u5B58: ${s.stagedChanges}, \u6700\u540E\u63D0\u4EA4: ${s.lastCommit || "\u65E0"}`);
    const tree = repo.getWorkingTree();
    if (tree) {
      const cols = tree.structure.getColumnIds().map((id, i) => {
        const c = tree.structure.getColumn(id);
        const name = c.name || id;
        return `${name} (${c.dataType}) width=${c.width}`;
      });
      renderList("columns", cols);
    }
    const branches = repo.getBranches();
    const current = repo.getCurrentBranch();
    renderList("branches", branches.map((b) => `${b === current ? "\u2605 " : ""}${b}`));
    const hist = repo.getCommitHistory(10);
    renderList("history", hist.map((c) => `${c.getShortHash()} - ${c.message}`));
    renderGrid();
    refreshPreview();
  }
  function renderGrid() {
    if (!repo) return;
    const tree = repo.getWorkingTree();
    if (!tree) {
      setHTML($("grid"), "(\u7A7A)");
      return;
    }
    const adapter = new import_dist.TableDataAdapter(repo);
    const data = adapter.build();
    const rows = data.matrix;
    const html = [`<table>`];
    if (data.header.length) {
      html.push("<thead><tr>");
      html.push(...data.header.map((h) => `<th>${h ?? ""}</th>`));
      html.push("</tr></thead>");
    }
    html.push("<tbody>");
    for (const row of data.header.length ? data.rows : rows) {
      html.push("<tr>");
      html.push(...(row ?? []).map((cell) => `<td>${cell ?? ""}</td>`));
      html.push("</tr>");
    }
    html.push("</tbody></table>");
    setHTML($("grid"), html.join(""));
  }
  function refreshPreview() {
    if (!repo) return;
    const adapter = new import_dist.TableDataAdapter(repo);
    const data = adapter.build();
    const html = registry.format("html", data, { includeHeader: true });
    const csv = registry.format("csv", data, { includeHeader: true, quoteText: true });
    const json = registry.format("json", data, { shape: "rows", space: 2 });
    const doc = document.getElementById("htmlFrame").contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`<!doctype html><meta charset='utf-8'><style>table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}</style>${html}`);
      doc.close();
    }
    setText($("csvOut"), csv);
    setText($("jsonOut"), json);
  }
  function bindTabs() {
    const buttons = Array.from(document.querySelectorAll(".tabs button"));
    const panels = {
      html: document.getElementById("panel-html"),
      csv: document.getElementById("panel-csv"),
      json: document.getElementById("panel-json")
    };
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.getAttribute("data-tab");
        Object.entries(panels).forEach(([k, el]) => el.style.display = k === tab ? "block" : "none");
      });
    });
  }
  function bindActions() {
    $("btn-init").onclick = () => {
      repo = (0, import_dist.createSampleTable)();
      refreshAll();
    };
    $("btn-commit").onclick = () => {
      if (!repo) return;
      const author = document.getElementById("author").value || "Demo User";
      const email = document.getElementById("email").value || "demo@example.com";
      const message = document.getElementById("message").value || "\u6F14\u793A\u63D0\u4EA4";
      try {
        repo.commit(message, author, email);
      } catch (e) {
        console.warn(e);
      }
      refreshAll();
    };
    $("btn-create-branch").onclick = () => {
      if (!repo) return;
      const b = document.getElementById("branch").value || "temp";
      repo.createBranch(b);
      refreshAll();
    };
    $("btn-checkout").onclick = () => {
      if (!repo) return;
      const b = document.getElementById("branch").value || "main";
      try {
        repo.checkout(b);
      } catch (e) {
        console.warn(e);
      }
      refreshAll();
    };
    $("btn-back-main").onclick = () => {
      if (!repo) return;
      try {
        repo.checkout("main");
      } catch (e) {
        console.warn(e);
      }
      refreshAll();
    };
    $("btn-adjust").onclick = () => {
      if (!repo) return;
      repo.addCellChange("default", 1, 2, 6999);
      repo.addCellChange("default", 2, 2, 13999);
      try {
        repo.commit("\u8C03\u6574\u4EA7\u54C1\u4EF7\u683C", "Sales Manager", "sales@company.com");
      } catch (e) {
      }
      refreshAll();
    };
    $("btn-delete-row").onclick = () => {
      if (!repo) return;
      repo.addRow("default", { id: "row_2", height: 25, hidden: false, order: 1 });
      try {
        repo.commit("\u6DFB\u52A0\u884C\u5143\u6570\u636E", "Data Manager", "data@company.com");
      } catch (e) {
      }
      repo.deleteCellChange("default", 2, 1);
      repo.deleteCellChange("default", 2, 2);
      repo.deleteCellChange("default", 2, 3);
      repo.deleteCellChange("default", 2, 4);
      repo.deleteRow("default", "row_2");
      try {
        repo.commit("\u5220\u9664MacBook Pro\u4EA7\u54C1\u884C", "Product Manager", "pm@company.com");
      } catch (e) {
      }
      refreshAll();
    };
    $("btn-add-more").onclick = () => {
      if (!repo) return;
      repo.addCellChange("default", 4, 1, "Apple Watch");
      repo.addCellChange("default", 4, 2, 2999);
      repo.addCellChange("default", 4, 3, 200);
      repo.addCellChange("default", 4, 4, "\u667A\u80FD\u624B\u8868");
      repo.addCellChange("default", 5, 1, "AirPods Pro");
      repo.addCellChange("default", 5, 2, 1999);
      repo.addCellChange("default", 5, 3, 150);
      repo.addCellChange("default", 5, 4, "\u65E0\u7EBF\u8033\u673A");
      try {
        repo.commit("\u6DFB\u52A0\u66F4\u591A\u4EA7\u54C1", "Product Manager", "pm@company.com");
      } catch (e) {
      }
      refreshAll();
    };
    $("btn-sort").onclick = () => {
      if (!repo) return;
      repo.sortRows("default", [{ columnId: "col_2", ascending: true }]);
      try {
        repo.commit("\u6309\u4EF7\u683C\u6392\u5E8F\u4EA7\u54C1", "Data Analyst", "analyst@company.com");
      } catch (e) {
      }
      refreshAll();
    };
    $("btn-checkout-prev").onclick = () => {
      if (!repo) return;
      const history = repo.getCommitHistory(10);
      if (history.length >= 2) {
        const oldCommit = history[history.length - 2];
        try {
          repo.checkout(oldCommit.hash);
        } catch (e) {
        }
        refreshAll();
      }
    };
  }
  function main() {
    bindTabs();
    bindActions();
    repo = (0, import_dist.createSampleTable)();
    refreshAll();
  }
  document.addEventListener("DOMContentLoaded", main);
})();
//# sourceMappingURL=bundle.js.map
