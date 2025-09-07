"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSampleTable = exports.createRow = exports.createColumn = exports.createCell = exports.createTableGit = exports.formatPosition = exports.parsePosition = exports.deepEqual = exports.deepClone = exports.generateId = exports.calculateHash = exports.ConflictResolver = exports.DiffMergeEngine = exports.TableGit = exports.CommitObject = exports.SheetTree = exports.TableStructure = exports.CellObject = void 0;
// 核心类导出
var cell_1 = require("./core/cell");
Object.defineProperty(exports, "CellObject", { enumerable: true, get: function () { return cell_1.CellObject; } });
var structure_1 = require("./core/structure");
Object.defineProperty(exports, "TableStructure", { enumerable: true, get: function () { return structure_1.TableStructure; } });
var sheet_1 = require("./core/sheet");
Object.defineProperty(exports, "SheetTree", { enumerable: true, get: function () { return sheet_1.SheetTree; } });
var commit_1 = require("./core/commit");
Object.defineProperty(exports, "CommitObject", { enumerable: true, get: function () { return commit_1.CommitObject; } });
var table_git_1 = require("./core/table-git");
Object.defineProperty(exports, "TableGit", { enumerable: true, get: function () { return table_git_1.TableGit; } });
var diff_merge_1 = require("./core/diff-merge");
Object.defineProperty(exports, "DiffMergeEngine", { enumerable: true, get: function () { return diff_merge_1.DiffMergeEngine; } });
var conflict_resolver_1 = require("./core/conflict-resolver");
Object.defineProperty(exports, "ConflictResolver", { enumerable: true, get: function () { return conflict_resolver_1.ConflictResolver; } });
// 类型导出
__exportStar(require("./types"), exports);
// 工具函数导出
var hash_1 = require("./utils/hash");
Object.defineProperty(exports, "calculateHash", { enumerable: true, get: function () { return hash_1.calculateHash; } });
Object.defineProperty(exports, "generateId", { enumerable: true, get: function () { return hash_1.generateId; } });
Object.defineProperty(exports, "deepClone", { enumerable: true, get: function () { return hash_1.deepClone; } });
Object.defineProperty(exports, "deepEqual", { enumerable: true, get: function () { return hash_1.deepEqual; } });
Object.defineProperty(exports, "parsePosition", { enumerable: true, get: function () { return hash_1.parsePosition; } });
Object.defineProperty(exports, "formatPosition", { enumerable: true, get: function () { return hash_1.formatPosition; } });
// 便利函数
var factory_1 = require("./utils/factory");
Object.defineProperty(exports, "createTableGit", { enumerable: true, get: function () { return factory_1.createTableGit; } });
Object.defineProperty(exports, "createCell", { enumerable: true, get: function () { return factory_1.createCell; } });
Object.defineProperty(exports, "createColumn", { enumerable: true, get: function () { return factory_1.createColumn; } });
Object.defineProperty(exports, "createRow", { enumerable: true, get: function () { return factory_1.createRow; } });
Object.defineProperty(exports, "createSampleTable", { enumerable: true, get: function () { return factory_1.createSampleTable; } });
//# sourceMappingURL=index.js.map