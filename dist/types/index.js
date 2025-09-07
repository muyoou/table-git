"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeType = exports.ObjectType = void 0;
/**
 * 基础对象类型枚举
 */
var ObjectType;
(function (ObjectType) {
    ObjectType["CELL"] = "cell";
    ObjectType["COLUMN"] = "column";
    ObjectType["ROW"] = "row";
    ObjectType["SHEET"] = "sheet";
    ObjectType["TABLE"] = "table";
    ObjectType["COMMIT"] = "commit";
})(ObjectType || (exports.ObjectType = ObjectType = {}));
/**
 * 变更类型枚举
 */
var ChangeType;
(function (ChangeType) {
    ChangeType["CELL_ADD"] = "cell_add";
    ChangeType["CELL_UPDATE"] = "cell_update";
    ChangeType["CELL_DELETE"] = "cell_delete";
    ChangeType["COLUMN_ADD"] = "column_add";
    ChangeType["COLUMN_UPDATE"] = "column_update";
    ChangeType["COLUMN_DELETE"] = "column_delete";
    ChangeType["COLUMN_MOVE"] = "column_move";
    ChangeType["ROW_ADD"] = "row_add";
    ChangeType["ROW_UPDATE"] = "row_update";
    ChangeType["ROW_DELETE"] = "row_delete";
    ChangeType["ROW_SORT"] = "row_sort";
})(ChangeType || (exports.ChangeType = ChangeType = {}));
//# sourceMappingURL=index.js.map