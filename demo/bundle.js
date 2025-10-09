// build-version:1760025145450
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

  // demo/crypto-shim.js
  var require_crypto_shim = __commonJS({
    "demo/crypto-shim.js"(exports) {
      "use strict";
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

  // (disabled):buffer
  var require_buffer = __commonJS({
    "(disabled):buffer"() {
      "use strict";
    }
  });

  // node_modules/js-sha1/src/sha1.js
  var require_sha1 = __commonJS({
    "node_modules/js-sha1/src/sha1.js"(exports, module) {
      "use strict";
      (function() {
        "use strict";
        var INPUT_ERROR = "input is invalid type";
        var FINALIZE_ERROR = "finalize already called";
        var WINDOW = typeof window === "object";
        var root = WINDOW ? window : {};
        if (root.JS_SHA1_NO_WINDOW) {
          WINDOW = false;
        }
        var WEB_WORKER = !WINDOW && typeof self === "object";
        var NODE_JS = !root.JS_SHA1_NO_NODE_JS && typeof process === "object" && process.versions && process.versions.node;
        if (NODE_JS) {
          root = global;
        } else if (WEB_WORKER) {
          root = self;
        }
        var COMMON_JS = !root.JS_SHA1_NO_COMMON_JS && typeof module === "object" && module.exports;
        var AMD = typeof define === "function" && define.amd;
        var ARRAY_BUFFER = !root.JS_SHA1_NO_ARRAY_BUFFER && typeof ArrayBuffer !== "undefined";
        var HEX_CHARS = "0123456789abcdef".split("");
        var EXTRA = [-2147483648, 8388608, 32768, 128];
        var SHIFT = [24, 16, 8, 0];
        var OUTPUT_TYPES = ["hex", "array", "digest", "arrayBuffer"];
        var blocks = [];
        var isArray = Array.isArray;
        if (root.JS_SHA1_NO_NODE_JS || !isArray) {
          isArray = function(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
          };
        }
        var isView = ArrayBuffer.isView;
        if (ARRAY_BUFFER && (root.JS_SHA1_NO_ARRAY_BUFFER_IS_VIEW || !isView)) {
          isView = function(obj) {
            return typeof obj === "object" && obj.buffer && obj.buffer.constructor === ArrayBuffer;
          };
        }
        var formatMessage = function(message) {
          var type = typeof message;
          if (type === "string") {
            return [message, true];
          }
          if (type !== "object" || message === null) {
            throw new Error(INPUT_ERROR);
          }
          if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
            return [new Uint8Array(message), false];
          }
          if (!isArray(message) && !isView(message)) {
            throw new Error(INPUT_ERROR);
          }
          return [message, false];
        };
        var createOutputMethod = function(outputType) {
          return function(message) {
            return new Sha1(true).update(message)[outputType]();
          };
        };
        var createMethod = function() {
          var method = createOutputMethod("hex");
          if (NODE_JS) {
            method = nodeWrap(method);
          }
          method.create = function() {
            return new Sha1();
          };
          method.update = function(message) {
            return method.create().update(message);
          };
          for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
            var type = OUTPUT_TYPES[i];
            method[type] = createOutputMethod(type);
          }
          return method;
        };
        var nodeWrap = function(method) {
          var crypto = require_crypto_shim();
          var Buffer2 = require_buffer().Buffer;
          var bufferFrom;
          if (Buffer2.from && !root.JS_SHA1_NO_BUFFER_FROM) {
            bufferFrom = Buffer2.from;
          } else {
            bufferFrom = function(message) {
              return new Buffer2(message);
            };
          }
          var nodeMethod = function(message) {
            if (typeof message === "string") {
              return crypto.createHash("sha1").update(message, "utf8").digest("hex");
            } else {
              if (message === null || message === void 0) {
                throw new Error(INPUT_ERROR);
              } else if (message.constructor === ArrayBuffer) {
                message = new Uint8Array(message);
              }
            }
            if (isArray(message) || isView(message) || message.constructor === Buffer2) {
              return crypto.createHash("sha1").update(bufferFrom(message)).digest("hex");
            } else {
              return method(message);
            }
          };
          return nodeMethod;
        };
        var createHmacOutputMethod = function(outputType) {
          return function(key, message) {
            return new HmacSha1(key, true).update(message)[outputType]();
          };
        };
        var createHmacMethod = function() {
          var method = createHmacOutputMethod("hex");
          method.create = function(key) {
            return new HmacSha1(key);
          };
          method.update = function(key, message) {
            return method.create(key).update(message);
          };
          for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
            var type = OUTPUT_TYPES[i];
            method[type] = createHmacOutputMethod(type);
          }
          return method;
        };
        function Sha1(sharedMemory) {
          if (sharedMemory) {
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.blocks = blocks;
          } else {
            this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          }
          this.h0 = 1732584193;
          this.h1 = 4023233417;
          this.h2 = 2562383102;
          this.h3 = 271733878;
          this.h4 = 3285377520;
          this.block = this.start = this.bytes = this.hBytes = 0;
          this.finalized = this.hashed = false;
          this.first = true;
        }
        Sha1.prototype.update = function(message) {
          if (this.finalized) {
            throw new Error(FINALIZE_ERROR);
          }
          var result = formatMessage(message);
          message = result[0];
          var isString = result[1];
          var code, index = 0, i, length = message.length || 0, blocks2 = this.blocks;
          while (index < length) {
            if (this.hashed) {
              this.hashed = false;
              blocks2[0] = this.block;
              this.block = blocks2[16] = blocks2[1] = blocks2[2] = blocks2[3] = blocks2[4] = blocks2[5] = blocks2[6] = blocks2[7] = blocks2[8] = blocks2[9] = blocks2[10] = blocks2[11] = blocks2[12] = blocks2[13] = blocks2[14] = blocks2[15] = 0;
            }
            if (isString) {
              for (i = this.start; index < length && i < 64; ++index) {
                code = message.charCodeAt(index);
                if (code < 128) {
                  blocks2[i >>> 2] |= code << SHIFT[i++ & 3];
                } else if (code < 2048) {
                  blocks2[i >>> 2] |= (192 | code >>> 6) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                } else if (code < 55296 || code >= 57344) {
                  blocks2[i >>> 2] |= (224 | code >>> 12) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 6 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                } else {
                  code = 65536 + ((code & 1023) << 10 | message.charCodeAt(++index) & 1023);
                  blocks2[i >>> 2] |= (240 | code >>> 18) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 12 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 6 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                }
              }
            } else {
              for (i = this.start; index < length && i < 64; ++index) {
                blocks2[i >>> 2] |= message[index] << SHIFT[i++ & 3];
              }
            }
            this.lastByteIndex = i;
            this.bytes += i - this.start;
            if (i >= 64) {
              this.block = blocks2[16];
              this.start = i - 64;
              this.hash();
              this.hashed = true;
            } else {
              this.start = i;
            }
          }
          if (this.bytes > 4294967295) {
            this.hBytes += this.bytes / 4294967296 << 0;
            this.bytes = this.bytes % 4294967296;
          }
          return this;
        };
        Sha1.prototype.finalize = function() {
          if (this.finalized) {
            return;
          }
          this.finalized = true;
          var blocks2 = this.blocks, i = this.lastByteIndex;
          blocks2[16] = this.block;
          blocks2[i >>> 2] |= EXTRA[i & 3];
          this.block = blocks2[16];
          if (i >= 56) {
            if (!this.hashed) {
              this.hash();
            }
            blocks2[0] = this.block;
            blocks2[16] = blocks2[1] = blocks2[2] = blocks2[3] = blocks2[4] = blocks2[5] = blocks2[6] = blocks2[7] = blocks2[8] = blocks2[9] = blocks2[10] = blocks2[11] = blocks2[12] = blocks2[13] = blocks2[14] = blocks2[15] = 0;
          }
          blocks2[14] = this.hBytes << 3 | this.bytes >>> 29;
          blocks2[15] = this.bytes << 3;
          this.hash();
        };
        Sha1.prototype.hash = function() {
          var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4;
          var f, j, t, blocks2 = this.blocks;
          for (j = 16; j < 80; ++j) {
            t = blocks2[j - 3] ^ blocks2[j - 8] ^ blocks2[j - 14] ^ blocks2[j - 16];
            blocks2[j] = t << 1 | t >>> 31;
          }
          for (j = 0; j < 20; j += 5) {
            f = b & c | ~b & d;
            t = a << 5 | a >>> 27;
            e = t + f + e + 1518500249 + blocks2[j] << 0;
            b = b << 30 | b >>> 2;
            f = a & b | ~a & c;
            t = e << 5 | e >>> 27;
            d = t + f + d + 1518500249 + blocks2[j + 1] << 0;
            a = a << 30 | a >>> 2;
            f = e & a | ~e & b;
            t = d << 5 | d >>> 27;
            c = t + f + c + 1518500249 + blocks2[j + 2] << 0;
            e = e << 30 | e >>> 2;
            f = d & e | ~d & a;
            t = c << 5 | c >>> 27;
            b = t + f + b + 1518500249 + blocks2[j + 3] << 0;
            d = d << 30 | d >>> 2;
            f = c & d | ~c & e;
            t = b << 5 | b >>> 27;
            a = t + f + a + 1518500249 + blocks2[j + 4] << 0;
            c = c << 30 | c >>> 2;
          }
          for (; j < 40; j += 5) {
            f = b ^ c ^ d;
            t = a << 5 | a >>> 27;
            e = t + f + e + 1859775393 + blocks2[j] << 0;
            b = b << 30 | b >>> 2;
            f = a ^ b ^ c;
            t = e << 5 | e >>> 27;
            d = t + f + d + 1859775393 + blocks2[j + 1] << 0;
            a = a << 30 | a >>> 2;
            f = e ^ a ^ b;
            t = d << 5 | d >>> 27;
            c = t + f + c + 1859775393 + blocks2[j + 2] << 0;
            e = e << 30 | e >>> 2;
            f = d ^ e ^ a;
            t = c << 5 | c >>> 27;
            b = t + f + b + 1859775393 + blocks2[j + 3] << 0;
            d = d << 30 | d >>> 2;
            f = c ^ d ^ e;
            t = b << 5 | b >>> 27;
            a = t + f + a + 1859775393 + blocks2[j + 4] << 0;
            c = c << 30 | c >>> 2;
          }
          for (; j < 60; j += 5) {
            f = b & c | b & d | c & d;
            t = a << 5 | a >>> 27;
            e = t + f + e - 1894007588 + blocks2[j] << 0;
            b = b << 30 | b >>> 2;
            f = a & b | a & c | b & c;
            t = e << 5 | e >>> 27;
            d = t + f + d - 1894007588 + blocks2[j + 1] << 0;
            a = a << 30 | a >>> 2;
            f = e & a | e & b | a & b;
            t = d << 5 | d >>> 27;
            c = t + f + c - 1894007588 + blocks2[j + 2] << 0;
            e = e << 30 | e >>> 2;
            f = d & e | d & a | e & a;
            t = c << 5 | c >>> 27;
            b = t + f + b - 1894007588 + blocks2[j + 3] << 0;
            d = d << 30 | d >>> 2;
            f = c & d | c & e | d & e;
            t = b << 5 | b >>> 27;
            a = t + f + a - 1894007588 + blocks2[j + 4] << 0;
            c = c << 30 | c >>> 2;
          }
          for (; j < 80; j += 5) {
            f = b ^ c ^ d;
            t = a << 5 | a >>> 27;
            e = t + f + e - 899497514 + blocks2[j] << 0;
            b = b << 30 | b >>> 2;
            f = a ^ b ^ c;
            t = e << 5 | e >>> 27;
            d = t + f + d - 899497514 + blocks2[j + 1] << 0;
            a = a << 30 | a >>> 2;
            f = e ^ a ^ b;
            t = d << 5 | d >>> 27;
            c = t + f + c - 899497514 + blocks2[j + 2] << 0;
            e = e << 30 | e >>> 2;
            f = d ^ e ^ a;
            t = c << 5 | c >>> 27;
            b = t + f + b - 899497514 + blocks2[j + 3] << 0;
            d = d << 30 | d >>> 2;
            f = c ^ d ^ e;
            t = b << 5 | b >>> 27;
            a = t + f + a - 899497514 + blocks2[j + 4] << 0;
            c = c << 30 | c >>> 2;
          }
          this.h0 = this.h0 + a << 0;
          this.h1 = this.h1 + b << 0;
          this.h2 = this.h2 + c << 0;
          this.h3 = this.h3 + d << 0;
          this.h4 = this.h4 + e << 0;
        };
        Sha1.prototype.hex = function() {
          this.finalize();
          var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4;
          return HEX_CHARS[h0 >>> 28 & 15] + HEX_CHARS[h0 >>> 24 & 15] + HEX_CHARS[h0 >>> 20 & 15] + HEX_CHARS[h0 >>> 16 & 15] + HEX_CHARS[h0 >>> 12 & 15] + HEX_CHARS[h0 >>> 8 & 15] + HEX_CHARS[h0 >>> 4 & 15] + HEX_CHARS[h0 & 15] + HEX_CHARS[h1 >>> 28 & 15] + HEX_CHARS[h1 >>> 24 & 15] + HEX_CHARS[h1 >>> 20 & 15] + HEX_CHARS[h1 >>> 16 & 15] + HEX_CHARS[h1 >>> 12 & 15] + HEX_CHARS[h1 >>> 8 & 15] + HEX_CHARS[h1 >>> 4 & 15] + HEX_CHARS[h1 & 15] + HEX_CHARS[h2 >>> 28 & 15] + HEX_CHARS[h2 >>> 24 & 15] + HEX_CHARS[h2 >>> 20 & 15] + HEX_CHARS[h2 >>> 16 & 15] + HEX_CHARS[h2 >>> 12 & 15] + HEX_CHARS[h2 >>> 8 & 15] + HEX_CHARS[h2 >>> 4 & 15] + HEX_CHARS[h2 & 15] + HEX_CHARS[h3 >>> 28 & 15] + HEX_CHARS[h3 >>> 24 & 15] + HEX_CHARS[h3 >>> 20 & 15] + HEX_CHARS[h3 >>> 16 & 15] + HEX_CHARS[h3 >>> 12 & 15] + HEX_CHARS[h3 >>> 8 & 15] + HEX_CHARS[h3 >>> 4 & 15] + HEX_CHARS[h3 & 15] + HEX_CHARS[h4 >>> 28 & 15] + HEX_CHARS[h4 >>> 24 & 15] + HEX_CHARS[h4 >>> 20 & 15] + HEX_CHARS[h4 >>> 16 & 15] + HEX_CHARS[h4 >>> 12 & 15] + HEX_CHARS[h4 >>> 8 & 15] + HEX_CHARS[h4 >>> 4 & 15] + HEX_CHARS[h4 & 15];
        };
        Sha1.prototype.toString = Sha1.prototype.hex;
        Sha1.prototype.digest = function() {
          this.finalize();
          var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4;
          return [
            h0 >>> 24 & 255,
            h0 >>> 16 & 255,
            h0 >>> 8 & 255,
            h0 & 255,
            h1 >>> 24 & 255,
            h1 >>> 16 & 255,
            h1 >>> 8 & 255,
            h1 & 255,
            h2 >>> 24 & 255,
            h2 >>> 16 & 255,
            h2 >>> 8 & 255,
            h2 & 255,
            h3 >>> 24 & 255,
            h3 >>> 16 & 255,
            h3 >>> 8 & 255,
            h3 & 255,
            h4 >>> 24 & 255,
            h4 >>> 16 & 255,
            h4 >>> 8 & 255,
            h4 & 255
          ];
        };
        Sha1.prototype.array = Sha1.prototype.digest;
        Sha1.prototype.arrayBuffer = function() {
          this.finalize();
          var buffer = new ArrayBuffer(20);
          var dataView = new DataView(buffer);
          dataView.setUint32(0, this.h0);
          dataView.setUint32(4, this.h1);
          dataView.setUint32(8, this.h2);
          dataView.setUint32(12, this.h3);
          dataView.setUint32(16, this.h4);
          return buffer;
        };
        function HmacSha1(key, sharedMemory) {
          var i, result = formatMessage(key);
          key = result[0];
          if (result[1]) {
            var bytes = [], length = key.length, index = 0, code;
            for (i = 0; i < length; ++i) {
              code = key.charCodeAt(i);
              if (code < 128) {
                bytes[index++] = code;
              } else if (code < 2048) {
                bytes[index++] = 192 | code >>> 6;
                bytes[index++] = 128 | code & 63;
              } else if (code < 55296 || code >= 57344) {
                bytes[index++] = 224 | code >>> 12;
                bytes[index++] = 128 | code >>> 6 & 63;
                bytes[index++] = 128 | code & 63;
              } else {
                code = 65536 + ((code & 1023) << 10 | key.charCodeAt(++i) & 1023);
                bytes[index++] = 240 | code >>> 18;
                bytes[index++] = 128 | code >>> 12 & 63;
                bytes[index++] = 128 | code >>> 6 & 63;
                bytes[index++] = 128 | code & 63;
              }
            }
            key = bytes;
          }
          if (key.length > 64) {
            key = new Sha1(true).update(key).array();
          }
          var oKeyPad = [], iKeyPad = [];
          for (i = 0; i < 64; ++i) {
            var b = key[i] || 0;
            oKeyPad[i] = 92 ^ b;
            iKeyPad[i] = 54 ^ b;
          }
          Sha1.call(this, sharedMemory);
          this.update(iKeyPad);
          this.oKeyPad = oKeyPad;
          this.inner = true;
          this.sharedMemory = sharedMemory;
        }
        HmacSha1.prototype = new Sha1();
        HmacSha1.prototype.finalize = function() {
          Sha1.prototype.finalize.call(this);
          if (this.inner) {
            this.inner = false;
            var innerHash = this.array();
            Sha1.call(this, this.sharedMemory);
            this.update(this.oKeyPad);
            this.update(innerHash);
            Sha1.prototype.finalize.call(this);
          }
        };
        var exports2 = createMethod();
        exports2.sha1 = exports2;
        exports2.sha1.hmac = createHmacMethod();
        if (COMMON_JS) {
          module.exports = exports2;
        } else {
          root.sha1 = exports2;
          if (AMD) {
            define(function() {
              return exports2;
            });
          }
        }
      })();
    }
  });

  // src/utils/hash.ts
  var import_js_sha1 = __toESM(require_sha1());
  function normalize(value) {
    if (value === null || value === void 0) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => normalize(item));
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "object") {
      if (value instanceof Map) {
        const entries = Array.from(value.entries()).map(([key, val]) => [key, normalize(val)]);
        entries.sort(([a], [b]) => a > b ? 1 : a < b ? -1 : 0);
        return entries;
      }
      const sortedKeys = Object.keys(value).sort();
      const result = {};
      for (const key of sortedKeys) {
        result[key] = normalize(value[key]);
      }
      return result;
    }
    return value;
  }
  function calculateHash(obj) {
    const normalized = normalize(obj);
    const content = JSON.stringify(normalized);
    return (0, import_js_sha1.default)(content);
  }
  function generateId(prefix = "") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}_${random}`;
  }
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function parsePosition(position) {
    const [row, col] = position.split(",").map(Number);
    return { row, col };
  }
  function formatPosition(row, col) {
    return `${row},${col}`;
  }

  // src/core/cell.ts
  var CellObject = class _CellObject {
    constructor(row, column, value, formula, format) {
      this.type = "cell" /* CELL */;
      this.row = row;
      this.column = column;
      this.value = value;
      this.formula = formula;
      this.format = format;
      this.hash = this.calculateHash();
    }
    calculateHash() {
      return calculateHash({
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
      return new _CellObject(
        json.row,
        json.column,
        json.value,
        json.formula,
        json.format
      );
    }
  };

  // src/core/structure.ts
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
      this.columns.set(column.id, deepClone(column));
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
      this.rows.set(row.id, deepClone(row));
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
      return calculateHash({
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
      cloned.columns = new Map(Array.from(this.columns.entries()).map(([k, v]) => [k, deepClone(v)]));
      cloned.rows = new Map(Array.from(this.rows.entries()).map(([k, v]) => [k, deepClone(v)]));
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

  // src/core/sheet.ts
  var SheetTree = class _SheetTree {
    constructor(name) {
      this.type = "sheet" /* SHEET */;
      this.name = name;
      this.cells = /* @__PURE__ */ new Map();
      this.structure = new TableStructure();
      this.hash = this.calculateHash();
    }
    /**
     * 设置单元格哈希
     */
    setCellHash(row, col, hash) {
      const key = formatPosition(row, col);
      this.cells.set(key, hash);
      this.updateHash();
    }
    /**
     * 获取单元格哈希
     */
    getCellHash(row, col) {
      const key = formatPosition(row, col);
      return this.cells.get(key);
    }
    /**
     * 删除单元格
     */
    deleteCell(row, col) {
      const key = formatPosition(row, col);
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
      return Array.from(this.cells.keys()).map((key) => parsePosition(key));
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
            result.set(formatPosition(row, col), hash);
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
        const { row, col } = parsePosition(key);
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
        const { row, col } = parsePosition(key);
        const newRow = row >= targetRow ? row + 1 : row;
        newCells.set(formatPosition(newRow, col), hash);
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
        const { row, col } = parsePosition(key);
        const newCol = col >= targetCol ? col + 1 : col;
        newCells.set(formatPosition(row, newCol), hash);
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
        const { row, col } = parsePosition(key);
        if (row === targetRow) {
          continue;
        }
        const newRow = row > targetRow ? row - 1 : row;
        newCells.set(formatPosition(newRow, col), hash);
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
        const { row, col } = parsePosition(key);
        if (col === targetCol) {
          continue;
        }
        const newCol = col > targetCol ? col - 1 : col;
        newCells.set(formatPosition(row, newCol), hash);
      }
      this.cells = newCells;
      this.updateHash();
    }
    updateHash() {
      this.hash = this.calculateHash();
    }
    calculateHash() {
      return calculateHash({
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
     * 重命名工作表
     */
    rename(newName) {
      this.name = newName;
      this.updateHash();
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
      sheet.structure = TableStructure.fromJSON(json.structure);
      sheet.updateHash();
      return sheet;
    }
  };

  // src/core/table-tree.ts
  var TableTree = class _TableTree {
    constructor(entries) {
      this.type = "table" /* TABLE */;
      this.sheetMap = /* @__PURE__ */ new Map();
      this.sheetOrder = [];
      if (entries) {
        entries.forEach((entry) => {
          this.sheetMap.set(entry.name, deepClone(entry));
          this.sheetOrder.push(entry.name);
        });
      }
      this.hash = this.calculateHash();
    }
    /**
     * 新增或更新工作表
     */
    upsertSheet(name, hash, options) {
      const existing = this.sheetMap.get(name);
      const order = options?.order ?? existing?.order ?? this.sheetOrder.length;
      const entry = {
        name,
        hash,
        order,
        meta: options?.meta ? deepClone(options.meta) : existing?.meta ? deepClone(existing.meta) : void 0
      };
      this.sheetMap.set(name, entry);
      if (!existing) {
        this.sheetOrder.push(name);
      }
      this.normalizeOrder();
      this.updateHash();
    }
    /**
     * 获取工作表哈希
     */
    getSheetHash(name) {
      return this.sheetMap.get(name)?.hash;
    }
    /**
     * 判断工作表是否存在
     */
    hasSheet(name) {
      return this.sheetMap.has(name);
    }
    /**
     * 删除工作表
     */
    removeSheet(name) {
      const removed = this.sheetMap.delete(name);
      if (removed) {
        this.sheetOrder = this.sheetOrder.filter((sheet) => sheet !== name);
        this.normalizeOrder();
        this.updateHash();
      }
      return removed;
    }
    /**
     * 重命名工作表
     */
    renameSheet(oldName, newName) {
      if (!this.sheetMap.has(oldName) || this.sheetMap.has(newName)) {
        return false;
      }
      const entry = this.sheetMap.get(oldName);
      if (!entry) {
        return false;
      }
      const newEntry = {
        ...deepClone(entry),
        name: newName
      };
      this.sheetMap.delete(oldName);
      this.sheetMap.set(newName, newEntry);
      this.sheetOrder = this.sheetOrder.map((sheet) => sheet === oldName ? newName : sheet);
      this.updateHash();
      return true;
    }
    /**
     * 调整工作表顺序
     */
    moveSheet(name, newIndex) {
      const currentIndex = this.sheetOrder.indexOf(name);
      if (currentIndex === -1 || newIndex < 0 || newIndex >= this.sheetOrder.length) {
        return false;
      }
      this.sheetOrder.splice(currentIndex, 1);
      this.sheetOrder.splice(newIndex, 0, name);
      this.normalizeOrder();
      this.updateHash();
      return true;
    }
    /**
     * 获取所有工作表名称（按顺序）
     */
    getSheetNames() {
      return [...this.sheetOrder];
    }
    /**
     * 获取完整条目（用于内部操作）
     */
    getSheetEntries() {
      return new Map(this.sheetMap);
    }
    /**
     * 克隆表树
     */
    clone() {
      return new _TableTree(this.sheetOrder.map((name) => deepClone(this.sheetMap.get(name))));
    }
    /**
     * 序列化
     */
    toJSON() {
      const entries = this.sheetOrder.map((name) => deepClone(this.sheetMap.get(name)));
      return {
        type: this.type,
        sheets: entries,
        hash: this.hash
      };
    }
    /**
     * 反序列化
     */
    static fromJSON(json) {
      return new _TableTree(json.sheets);
    }
    normalizeOrder() {
      this.sheetOrder = this.sheetOrder.filter((name) => this.sheetMap.has(name));
      this.sheetOrder.forEach((name, index) => {
        const entry = this.sheetMap.get(name);
        if (entry) {
          entry.order = index;
        }
      });
    }
    updateHash() {
      this.hash = this.calculateHash();
    }
    calculateHash() {
      const sortedEntries = this.sheetOrder.map((name) => this.sheetMap.get(name)).filter(Boolean);
      return calculateHash({
        type: this.type,
        sheets: sortedEntries.map((entry) => ({
          name: entry.name,
          hash: entry.hash,
          order: entry.order,
          meta: entry.meta
        }))
      });
    }
  };

  // src/core/commit.ts
  var CommitObject = class _CommitObject {
    constructor(tree, message, author, email, parent) {
      this.type = "commit" /* COMMIT */;
      this.tree = tree;
      this.message = message;
      this.author = author;
      this.email = email;
      this.parent = parent;
      this.timestamp = Date.now();
      this.hash = this.calculateHash();
    }
    calculateHash() {
      return calculateHash({
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
      const commit = new _CommitObject(
        json.tree,
        json.message,
        json.author,
        json.email,
        json.parent
      );
      commit.timestamp = json.timestamp;
      commit.hash = json.hash;
      return commit;
    }
  };

  // src/core/table-git.ts
  var TableGit = class {
    // 提交对应的表快照
    constructor() {
      this.objects = /* @__PURE__ */ new Map();
      this.refs = /* @__PURE__ */ new Map();
      this.head = "main";
      this.index = /* @__PURE__ */ new Map();
      this.workingTable = null;
      this.workingSheets = /* @__PURE__ */ new Map();
      this.tableSnapshots = /* @__PURE__ */ new Map();
    }
    /**
     * 初始化仓库
     */
    init(branchName = "main", options) {
      this.head = branchName;
      this.refs.set(branchName, "");
      const table = new TableTree();
      if (options?.createDefaultSheet ?? true) {
        const sheetName = options?.defaultSheetName ?? "default";
        const sheet = new SheetTree(sheetName);
        const sheetHash = this.storeObject(sheet);
        table.upsertSheet(sheetName, sheetHash, { order: 0 });
      }
      const tableHash = this.storeObject(table);
      const initialCommit = new CommitObject(
        tableHash,
        "Initial commit",
        "System",
        "system@tablegit.com"
      );
      const commitHash = this.storeObject(initialCommit);
      this.refs.set(branchName, commitHash);
      this.tableSnapshots.set(commitHash, table.clone());
      this.loadWorkingState(table);
    }
    // ========== 工作表级操作 ==========
    createSheet(sheetName, details) {
      const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable ?? new TableTree();
      if (table.hasSheet(sheetName)) {
        throw new Error(`Sheet '${sheetName}' already exists`);
      }
      const changeKey = `sheet:add:${sheetName}`;
      this.index.set(changeKey, {
        type: "sheet_add" /* SHEET_ADD */,
        sheetName,
        details: details ?? {},
        timestamp: Date.now()
      });
    }
    deleteSheet(sheetName) {
      const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable;
      if (!table || !table.hasSheet(sheetName)) {
        throw new Error(`Sheet '${sheetName}' does not exist`);
      }
      const changeKey = `sheet:delete:${sheetName}`;
      this.index.set(changeKey, {
        type: "sheet_delete" /* SHEET_DELETE */,
        sheetName,
        details: {},
        timestamp: Date.now()
      });
    }
    renameSheet(oldName, newName) {
      if (oldName === newName) {
        return;
      }
      const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable;
      if (!table || !table.hasSheet(oldName)) {
        throw new Error(`Sheet '${oldName}' does not exist`);
      }
      if (table.hasSheet(newName)) {
        throw new Error(`Sheet '${newName}' already exists`);
      }
      if (this.hasBlockingStagedChanges(oldName)) {
        throw new Error(`Sheet '${oldName}' has staged changes. Commit or reset them before renaming.`);
      }
      const changeKey = `sheet:rename:${oldName}`;
      this.index.set(changeKey, {
        type: "sheet_rename" /* SHEET_RENAME */,
        sheetName: oldName,
        details: { newName },
        timestamp: Date.now()
      });
    }
    moveSheet(sheetName, newIndex) {
      const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable;
      if (!table) {
        throw new Error("No sheets available");
      }
      const sheetNames = table.getSheetNames();
      const currentIndex = sheetNames.indexOf(sheetName);
      if (currentIndex === -1) {
        throw new Error(`Sheet '${sheetName}' does not exist`);
      }
      if (newIndex < 0 || newIndex >= sheetNames.length) {
        throw new Error(`Invalid sheet index ${newIndex}`);
      }
      if (currentIndex === newIndex) {
        return;
      }
      const changeKey = `sheet:move:${sheetName}`;
      this.index.set(changeKey, {
        type: "sheet_move" /* SHEET_MOVE */,
        sheetName,
        details: { newIndex },
        timestamp: Date.now()
      });
    }
    duplicateSheet(sourceSheet, newName, options) {
      if (sourceSheet === newName) {
        throw new Error("Source sheet and new sheet names must differ");
      }
      const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable;
      if (!table || !table.hasSheet(sourceSheet)) {
        throw new Error(`Sheet '${sourceSheet}' does not exist`);
      }
      if (table.hasSheet(newName)) {
        throw new Error(`Sheet '${newName}' already exists`);
      }
      const changeKey = `sheet:duplicate:${newName}`;
      this.index.set(changeKey, {
        type: "sheet_duplicate" /* SHEET_DUPLICATE */,
        sheetName: newName,
        details: {
          sourceSheet,
          newName,
          order: options?.order,
          meta: options?.meta
        },
        timestamp: Date.now()
      });
    }
    listSheets(options) {
      if (options?.includeStaged) {
        const table = this.getPreviewTable({ includeStaged: true });
        return table ? table.getSheetNames() : [];
      }
      return this.workingTable ? this.workingTable.getSheetNames() : [];
    }
    hasSheet(sheetName, options) {
      if (options?.includeStaged) {
        const table = this.getPreviewTable({ includeStaged: true });
        return table ? table.hasSheet(sheetName) : false;
      }
      return this.workingTable ? this.workingTable.hasSheet(sheetName) : false;
    }
    // ========== 单元格操作 ==========
    addCellChange(sheetName, row, column, value, formula, format) {
      this.ensureSheetExists(sheetName);
      const cell = new CellObject(row, column, value, formula, format);
      const changeKey = `${sheetName}:cell:${row},${column}`;
      const baseSheet = this.workingSheets.get(sheetName);
      const baseHas = !!baseSheet?.getCellHash(row, column);
      const staged = this.index.get(changeKey);
      const type = !baseHas || staged?.type === "cell_add" /* CELL_ADD */ || staged?.type === "cell_delete" /* CELL_DELETE */ ? "cell_add" /* CELL_ADD */ : "cell_update" /* CELL_UPDATE */;
      this.index.set(changeKey, {
        type,
        sheetName,
        details: cell,
        timestamp: Date.now()
      });
    }
    deleteCellChange(sheetName, row, column) {
      this.ensureSheetExists(sheetName);
      const changeKey = `${sheetName}:cell:${row},${column}`;
      this.index.set(changeKey, {
        type: "cell_delete" /* CELL_DELETE */,
        sheetName,
        details: { row, column },
        timestamp: Date.now()
      });
    }
    // ========== 列操作 ==========
    addColumn(sheetName, column) {
      this.ensureSheetExists(sheetName);
      const changeKey = `${sheetName}:column:add:${column.id}`;
      this.index.set(changeKey, {
        type: "column_add" /* COLUMN_ADD */,
        sheetName,
        details: column,
        timestamp: Date.now()
      });
    }
    updateColumn(sheetName, columnId, updates) {
      this.ensureSheetExists(sheetName);
      const changeKey = `${sheetName}:column:update:${columnId}`;
      this.index.set(changeKey, {
        type: "column_update" /* COLUMN_UPDATE */,
        sheetName,
        details: { columnId, updates },
        timestamp: Date.now()
      });
    }
    deleteColumn(sheetName, columnId) {
      this.ensureSheetExists(sheetName);
      const changeKey = `${sheetName}:column:delete:${columnId}`;
      this.index.set(changeKey, {
        type: "column_delete" /* COLUMN_DELETE */,
        sheetName,
        details: { columnId },
        timestamp: Date.now()
      });
    }
    // ========== 行操作 ==========
    addRow(sheetName, row) {
      this.ensureSheetExists(sheetName);
      const changeKey = `${sheetName}:row:add:${row.id}`;
      this.index.set(changeKey, {
        type: "row_add" /* ROW_ADD */,
        sheetName,
        details: row,
        timestamp: Date.now()
      });
    }
    deleteRow(sheetName, rowId) {
      this.ensureSheetExists(sheetName);
      const changeKey = `${sheetName}:row:delete:${rowId}`;
      this.index.set(changeKey, {
        type: "row_delete" /* ROW_DELETE */,
        sheetName,
        details: { rowId },
        timestamp: Date.now()
      });
    }
    sortRows(sheetName, sortCriteria) {
      this.ensureSheetExists(sheetName);
      const changeKey = `${sheetName}:row:sort:${Date.now()}`;
      this.index.set(changeKey, {
        type: "row_sort" /* ROW_SORT */,
        sheetName,
        details: { sortCriteria },
        timestamp: Date.now()
      });
    }
    // ========== 版本控制核心操作 ==========
    commit(message, author, email) {
      if (this.index.size === 0) {
        throw new Error("Nothing to commit");
      }
      const { table, tableHash, sheets } = this.buildTableFromIndex();
      const currentCommitHash = this.refs.get(this.head);
      const commit = new CommitObject(
        tableHash,
        message,
        author,
        email,
        currentCommitHash
      );
      const commitHash = this.storeObject(commit);
      this.refs.set(this.head, commitHash);
      this.tableSnapshots.set(commitHash, table.clone());
      this.index.clear();
      this.loadWorkingState(table, sheets);
      return commitHash;
    }
    buildTableFromIndex() {
      const table = this.workingTable ? this.workingTable.clone() : new TableTree();
      const sheets = /* @__PURE__ */ new Map();
      if (this.workingTable) {
        for (const name of this.workingTable.getSheetNames()) {
          const workingSheet = this.workingSheets.get(name);
          if (workingSheet) {
            sheets.set(name, workingSheet.clone());
            continue;
          }
          const sheetHash = this.workingTable.getSheetHash(name);
          if (!sheetHash) continue;
          const storedSheet = this.getObject(sheetHash);
          if (storedSheet) {
            sheets.set(name, storedSheet.clone());
          }
        }
      }
      for (const change of this.index.values()) {
        this.applyChange(table, sheets, change);
      }
      for (const [name, sheet] of sheets) {
        const sheetHash = this.storeObject(sheet);
        table.upsertSheet(name, sheetHash);
      }
      const tableHash = this.storeObject(table);
      return { table, tableHash, sheets };
    }
    applyChange(table, sheets, change) {
      switch (change.type) {
        case "sheet_add" /* SHEET_ADD */: {
          const details = change.details;
          const newSheet = new SheetTree(change.sheetName);
          sheets.set(change.sheetName, newSheet);
          table.upsertSheet(change.sheetName, newSheet.hash, { order: details?.order, meta: details?.meta });
          break;
        }
        case "sheet_delete" /* SHEET_DELETE */: {
          sheets.delete(change.sheetName);
          table.removeSheet(change.sheetName);
          break;
        }
        case "sheet_rename" /* SHEET_RENAME */: {
          const details = change.details;
          if (!details?.newName) {
            break;
          }
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          sheet.rename(details.newName);
          sheets.delete(change.sheetName);
          sheets.set(details.newName, sheet);
          table.renameSheet(change.sheetName, details.newName);
          break;
        }
        case "sheet_move" /* SHEET_MOVE */: {
          const details = change.details;
          if (typeof details?.newIndex === "number") {
            table.moveSheet(change.sheetName, details.newIndex);
          }
          break;
        }
        case "sheet_duplicate" /* SHEET_DUPLICATE */: {
          const details = change.details;
          if (!details?.sourceSheet || !details?.newName) {
            break;
          }
          const sourceSheet = this.getMutableSheet(table, sheets, details.sourceSheet).clone();
          sourceSheet.rename(details.newName);
          sheets.set(details.newName, sourceSheet);
          table.upsertSheet(details.newName, sourceSheet.hash, { order: details.order, meta: details.meta });
          break;
        }
        case "cell_add" /* CELL_ADD */:
        case "cell_update" /* CELL_UPDATE */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          const cell = change.details;
          const cellHash = this.storeObject(cell);
          sheet.setCellHash(cell.row, cell.column, cellHash);
          break;
        }
        case "cell_delete" /* CELL_DELETE */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          const { row, column } = change.details;
          sheet.deleteCell(row, column);
          break;
        }
        case "column_add" /* COLUMN_ADD */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          sheet.structure.addColumn(change.details);
          break;
        }
        case "column_update" /* COLUMN_UPDATE */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          const { columnId, updates } = change.details;
          sheet.structure.updateColumn(columnId, updates);
          break;
        }
        case "column_delete" /* COLUMN_DELETE */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          const columnId = change.details.columnId;
          const column = sheet.structure.getColumn(columnId);
          if (column && typeof column.order === "number") {
            const columnIndex = column.order;
            const cells = sheet.getAllCellPositions();
            for (const { row, col } of cells) {
              if (col === columnIndex) {
                sheet.deleteCell(row, col);
              }
            }
          }
          sheet.structure.removeColumn(columnId);
          break;
        }
        case "column_move" /* COLUMN_MOVE */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          sheet.structure.moveColumn(change.details.columnId, change.details.newIndex);
          break;
        }
        case "row_add" /* ROW_ADD */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          sheet.structure.addRow(change.details);
          break;
        }
        case "row_delete" /* ROW_DELETE */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          const rowId = change.details.rowId;
          const row = sheet.structure.getRow(rowId);
          if (row && typeof row.order === "number") {
            const rowIndex = row.order;
            const cells = sheet.getAllCellPositions();
            for (const { row: r, col } of cells) {
              if (r === rowIndex) {
                sheet.deleteCell(r, col);
              }
            }
          }
          sheet.structure.removeRow(rowId);
          break;
        }
        case "row_sort" /* ROW_SORT */: {
          const sheet = this.getMutableSheet(table, sheets, change.sheetName);
          const { sortCriteria } = change.details;
          this.applySorting(sheet, sortCriteria);
          break;
        }
        default:
          break;
      }
    }
    getMutableSheet(table, sheets, sheetName) {
      let sheet = sheets.get(sheetName);
      if (sheet) {
        return sheet;
      }
      if (!table.hasSheet(sheetName)) {
        throw new Error(`Sheet '${sheetName}' does not exist`);
      }
      const sheetHash = table.getSheetHash(sheetName);
      if (!sheetHash) {
        throw new Error(`Snapshot for sheet '${sheetName}' is missing`);
      }
      const storedSheet = this.getObject(sheetHash);
      if (!storedSheet) {
        throw new Error(`Stored sheet '${sheetName}' cannot be found`);
      }
      sheet = storedSheet.clone();
      sheets.set(sheetName, sheet);
      return sheet;
    }
    applySorting(sheet, criteria) {
      const currentOrder = sheet.structure.getRowIds();
      const sortedOrder = [...currentOrder].sort((a, b) => a.localeCompare(b));
      sheet.structure.sortRows(sortedOrder);
    }
    // ========== 对象存储 ==========
    storeObject(obj) {
      const hash = obj.hash;
      if (obj instanceof SheetTree) {
        this.objects.set(hash, { type: "sheet" /* SHEET */, payload: obj.toJSON() });
        return hash;
      }
      if (obj instanceof TableTree) {
        this.objects.set(hash, { type: "table" /* TABLE */, payload: obj.toJSON() });
        return hash;
      }
      if (obj instanceof CellObject) {
        const clonedCell = new CellObject(obj.row, obj.column, obj.value, obj.formula, obj.format);
        this.objects.set(hash, { type: "cell" /* CELL */, payload: obj.toJSON() });
        return hash;
      }
      if (obj instanceof CommitObject) {
        this.objects.set(hash, { type: "commit" /* COMMIT */, payload: obj.toJSON() });
        return hash;
      }
      this.objects.set(hash, { type: obj.type ?? "raw", payload: obj });
      return hash;
    }
    getObject(hash) {
      const entry = this.objects.get(hash);
      if (!entry) {
        return void 0;
      }
      if (entry instanceof SheetTree || entry instanceof TableTree || entry instanceof CellObject || entry instanceof CommitObject) {
        return entry;
      }
      if (entry.type === "sheet" /* SHEET */) {
        return SheetTree.fromJSON(entry.payload);
      }
      if (entry.type === "table" /* TABLE */) {
        return TableTree.fromJSON(entry.payload);
      }
      if (entry.type === "cell" /* CELL */) {
        return CellObject.fromJSON(entry.payload);
      }
      if (entry.type === "commit" /* COMMIT */) {
        return CommitObject.fromJSON(entry.payload);
      }
      return entry.payload;
    }
    // ========== 快照 ==========
    getTreeSnapshot(ref) {
      let commitHash;
      if (ref?.commit) {
        commitHash = ref.commit;
      } else if (ref?.branch) {
        commitHash = this.refs.get(ref.branch);
      } else {
        commitHash = this.refs.get(this.head) || (this.isDetachedHead() ? this.head : void 0);
      }
      if (!commitHash) return void 0;
      const snapshot = commitHash ? this.tableSnapshots.get(commitHash) : void 0;
      if (snapshot) {
        return snapshot.clone();
      }
      const commitObj = this.getObject(commitHash);
      if (!commitObj) return void 0;
      const table = this.getObject(commitObj.tree);
      return table ? table.clone() : void 0;
    }
    getSheetSnapshot(sheetName, ref) {
      const table = this.getTreeSnapshot(ref);
      if (!table) return void 0;
      const sheetHash = table.getSheetHash(sheetName);
      if (!sheetHash) return void 0;
      const sheet = this.getObject(sheetHash);
      return sheet ? sheet.clone() : void 0;
    }
    getCellFromTree(tree, row, col, sheetName = "default") {
      if (tree instanceof TableTree) {
        const sheetHash = tree.getSheetHash(sheetName);
        if (!sheetHash) return void 0;
        const sheet = this.getObject(sheetHash);
        if (!sheet) return void 0;
        const cellHash = sheet.getCellHash(row, col);
        if (!cellHash) return void 0;
        return this.getObject(cellHash);
      }
      const hash = tree.getCellHash(row, col);
      if (!hash) return void 0;
      return this.getObject(hash);
    }
    // ========== 分支操作 ==========
    createBranch(branchName) {
      const currentCommitHash = this.refs.get(this.head);
      if (!currentCommitHash) {
        throw new Error("Cannot create branch: no commits found");
      }
      this.refs.set(branchName, currentCommitHash);
    }
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
      if (commit && commit.type === "commit" /* COMMIT */) {
        this.head = target;
        this.loadWorkingTreeFromCommit(target);
        return;
      }
      throw new Error(`Branch or commit '${target}' does not exist`);
    }
    loadWorkingTreeFromCommit(commitHash) {
      const snapshot = this.tableSnapshots.get(commitHash);
      if (snapshot) {
        this.loadWorkingState(snapshot.clone());
        return;
      }
      const commitObj = this.getObject(commitHash);
      if (!commitObj) {
        this.workingTable = null;
        this.workingSheets = /* @__PURE__ */ new Map();
        return;
      }
      const table = this.getObject(commitObj.tree);
      if (!table) {
        this.workingTable = null;
        this.workingSheets = /* @__PURE__ */ new Map();
        return;
      }
      this.loadWorkingState(table);
    }
    getCurrentBranch() {
      return this.head;
    }
    isDetachedHead() {
      return !this.refs.has(this.head);
    }
    getCurrentCommitHash() {
      if (this.isDetachedHead()) {
        return this.head;
      }
      return this.refs.get(this.head);
    }
    getBranches() {
      return Array.from(this.refs.keys());
    }
    loadWorkingTree() {
      const commitHash = this.refs.get(this.head);
      if (!commitHash) {
        this.workingTable = null;
        this.workingSheets = /* @__PURE__ */ new Map();
        return;
      }
      this.loadWorkingTreeFromCommit(commitHash);
    }
    // ========== 状态查询 ==========
    status() {
      const lastCommitHash = this.refs.get(this.head);
      return {
        branch: this.head,
        stagedChanges: this.index.size,
        lastCommit: lastCommitHash ? this.getObject(lastCommitHash)?.getShortHash() : void 0
      };
    }
    getStagedChanges() {
      return Array.from(this.index.values());
    }
    reset() {
      this.index.clear();
    }
    getCommitHistory(limit = 10) {
      const history = [];
      let currentHash = this.refs.get(this.head);
      while (currentHash && history.length < limit) {
        const commit = this.getObject(currentHash);
        if (!commit) {
          break;
        }
        history.push(commit);
        currentHash = commit.parent;
      }
      return history;
    }
    getWorkingTable() {
      return this.workingTable ? this.workingTable.clone() : void 0;
    }
    getWorkingSheet(sheetName) {
      const sheet = this.workingSheets.get(sheetName);
      return sheet ? sheet.clone() : void 0;
    }
    getWorkingTree() {
      return this.getWorkingSheet("default");
    }
    getPreviewTable(options) {
      if (options?.includeStaged) {
        const { table } = this.buildTableFromIndex();
        return table.clone();
      }
      return this.getWorkingTable();
    }
    getPreviewSheet(sheetName, options) {
      if (options?.includeStaged) {
        const { sheets } = this.buildTableFromIndex();
        const sheet = sheets.get(sheetName);
        return sheet ? sheet.clone() : void 0;
      }
      return this.getWorkingSheet(sheetName);
    }
    getPreviewTree(options) {
      return this.getPreviewSheet("default", options);
    }
    getCellValue(row, col, sheetName = "default") {
      const sheet = this.workingSheets.get(sheetName);
      if (!sheet) return void 0;
      const cellHash = sheet.getCellHash(row, col);
      if (!cellHash) return void 0;
      const cell = this.getObject(cellHash);
      return cell?.value;
    }
    getCell(row, col, sheetName = "default") {
      const sheet = this.workingSheets.get(sheetName);
      if (!sheet) return void 0;
      const cellHash = sheet.getCellHash(row, col);
      if (!cellHash) return void 0;
      return this.getObject(cellHash);
    }
    // ========== 内部工具 ==========
    loadWorkingState(table, sheetOverrides) {
      this.workingTable = table.clone();
      this.workingSheets = /* @__PURE__ */ new Map();
      for (const name of this.workingTable.getSheetNames()) {
        if (sheetOverrides?.has(name)) {
          this.workingSheets.set(name, sheetOverrides.get(name).clone());
          continue;
        }
        const sheetHash = this.workingTable.getSheetHash(name);
        if (!sheetHash) {
          continue;
        }
        const sheet = this.getObject(sheetHash);
        if (sheet) {
          this.workingSheets.set(name, sheet.clone());
        }
      }
    }
    ensureSheetExists(sheetName) {
      if (this.hasSheet(sheetName, { includeStaged: true })) {
        return;
      }
      throw new Error(`Sheet '${sheetName}' does not exist. Create it before modifying content.`);
    }
    hasBlockingStagedChanges(sheetName) {
      for (const change of this.index.values()) {
        if (change.sheetName !== sheetName) continue;
        if (change.type === "sheet_move" /* SHEET_MOVE */ || change.type === "sheet_rename" /* SHEET_RENAME */) {
          continue;
        }
        return true;
      }
      return false;
    }
  };

  // src/utils/factory.ts
  function createTableGit(branchName = "main") {
    const tableGit = new TableGit();
    tableGit.init(branchName);
    return tableGit;
  }
  function createColumn(id, options = {}) {
    return {
      id: id || generateId("col_"),
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
      id: options.id || generateId("row_"),
      height: options.height || 25,
      hidden: options.hidden || false,
      order: options.order || 0
    };
  }
  function createSampleTable() {
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
    for (let r = 0; r <= 3; r++) {
      repo2.addRow("default", createRow({ id: `row_${r}`, order: r }));
    }
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

  // src/formatters/adapter.ts
  var TableDataAdapter = class {
    constructor(repo2, sheetName = "default") {
      this.repo = repo2;
      this.sheetName = sheetName;
    }
    /**
     * 构建统一数据
     * @param source 可选：从其他分支或指定提交预览（不需要 checkout）
     */
    build(source) {
      const sheet = source ? this.repo.getSheetSnapshot(this.sheetName, source) : this.repo.getPreviewSheet(this.sheetName, { includeStaged: true });
      if (!sheet) {
        return this.empty();
      }
      const structure = sheet.structure;
      const columnEntries = this.getOrderedEntries(structure.getColumnIds(), (id) => structure.getColumn(id));
      const rowEntries = this.getOrderedEntries(structure.getRowIds(), (id) => structure.getRow(id));
      const useStructureColumns = columnEntries.length > 0;
      const useStructureRows = rowEntries.length > 0;
      let minRow = Number.POSITIVE_INFINITY;
      let maxRow = Number.NEGATIVE_INFINITY;
      let minCol = Number.POSITIVE_INFINITY;
      let maxCol = Number.NEGATIVE_INFINITY;
      const orderedCols = useStructureColumns ? columnEntries : this.buildFallbackEntries(sheet, "col");
      const orderedRows = useStructureRows ? rowEntries : this.buildFallbackEntries(sheet, "row");
      if (!orderedCols.length || !orderedRows.length) {
        return this.empty();
      }
      const matrix = [];
      orderedRows.forEach((rowEntry, rowIndex) => {
        const row = [];
        const rowPos = rowEntry.order;
        minRow = Math.min(minRow, rowPos);
        maxRow = Math.max(maxRow, rowPos);
        orderedCols.forEach((colEntry) => {
          const colPos = colEntry.order;
          minCol = Math.min(minCol, colPos);
          maxCol = Math.max(maxCol, colPos);
          const hash = sheet.getCellHash(rowPos, colPos);
          if (!hash) {
            row.push(void 0);
            return;
          }
          const cell = this.repo.getCellFromTree(sheet, rowPos, colPos);
          row.push(cell ? cell.value : void 0);
        });
        matrix[rowIndex] = row;
      });
      if (!Number.isFinite(minRow) || !Number.isFinite(minCol)) {
        return this.empty();
      }
      const header = minRow === 0 && matrix.length > 0 ? matrix[0] : [];
      const rows = minRow === 0 ? matrix.slice(1) : matrix;
      return { header, rows, matrix, minRow, minCol, maxRow, maxCol };
    }
    empty() {
      return { header: [], rows: [], matrix: [], minRow: 0, minCol: 0, maxRow: -1, maxCol: -1 };
    }
    getOrderedEntries(ids, resolver) {
      return ids.map((id, index) => {
        const meta = resolver(id);
        if (!meta || typeof meta.order !== "number") {
          return null;
        }
        return { id, meta, order: meta.order ?? index };
      }).filter((entry) => entry !== null).sort((a, b) => a.order - b.order);
    }
    buildFallbackEntries(sheet, axis) {
      const bounds = sheet.getBounds();
      if (!bounds) return [];
      const { minRow, minCol, maxRow, maxCol } = bounds;
      if (axis === "row") {
        const entries2 = [];
        for (let r = minRow; r <= maxRow; r++) {
          entries2.push({ id: `__row_${r}`, meta: { order: r }, order: r });
        }
        return entries2;
      }
      const entries = [];
      for (let c = minCol; c <= maxCol; c++) {
        entries.push({ id: `__col_${c}`, meta: { order: c }, order: c });
      }
      return entries;
    }
  };

  // src/formatters/function-formatter.ts
  var FunctionFormatter = class {
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
  var FormatterRegistry = class {
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
      if (!f) throw new Error(`Formatter '${name}' is not registered`);
      return f.run(data, options);
    }
  };

  // src/formatters/builtin.ts
  function escapeCsvValue(val, delimiter, quoteText) {
    if (val === null || val === void 0) return "";
    const str = typeof val === "string" ? val : String(val);
    const mustQuote = quoteText || str.includes(delimiter) || /[\r\n]/.test(str) || str.includes('"');
    if (!mustQuote) return str;
    return '"' + str.replace(/"/g, '""') + '"';
  }
  var csvFormatter = (data, options) => {
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
  var jsonFormatter = (data, options) => {
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
  function escapeHtml(s) {
    if (s === null || s === void 0) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  var htmlFormatter = (data, options) => {
    const tableClass = options?.tableClass ?? "table-git";
    const includeHeader = options?.includeHeader ?? true;
    const esc = options?.escapeHtml ?? true;
    const escVal = (v) => esc ? escapeHtml(v) : v ?? "";
    const parts = [];
    parts.push(`<table class="${tableClass}">`);
    if (includeHeader && data.header.length) {
      parts.push("<thead><tr>");
      for (const h of data.header) parts.push(`<th>${escVal(h)}</th>`);
      parts.push("</tr></thead>");
    }
    parts.push("<tbody>");
    for (const row of data.rows) {
      parts.push("<tr>");
      for (const cell of row ?? []) parts.push(`<td>${escVal(cell)}</td>`);
      parts.push("</tr>");
    }
    parts.push("</tbody></table>");
    return parts.join("");
  };

  // demo/app.ts
  var $ = (id) => document.getElementById(id);
  var repo = null;
  var activeSheet = "default";
  var registry = new FormatterRegistry();
  registry.register(new FunctionFormatter({ name: "csv", format: csvFormatter }));
  registry.register(new FunctionFormatter({ name: "json", format: jsonFormatter }));
  registry.register(new FunctionFormatter({ name: "html", format: htmlFormatter }));
  function setText(el, text) {
    if (el) el.textContent = text;
  }
  function setHTML(el, html) {
    if (el) el.innerHTML = html;
  }
  function escapeHtml2(s) {
    if (s === null || s === void 0) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function renderList(elId, items) {
    const el = $(elId);
    if (!el) return;
    const html = `<ul class="list">${items.map((i) => `<li>${escapeHtml2(i)}</li>`).join("")}</ul>`;
    setHTML(el, html);
  }
  function getSheetNames() {
    if (!repo) return [];
    const sheets = repo.listSheets({ includeStaged: true });
    return sheets.length ? sheets : [];
  }
  function ensureActiveSheet() {
    if (!repo) {
      activeSheet = "default";
      setText($("active-sheet"), "\u5F53\u524D\u5DE5\u4F5C\u8868\uFF1A-");
      return;
    }
    const sheets = getSheetNames();
    if (!sheets.includes(activeSheet)) {
      activeSheet = sheets[0] ?? "default";
    }
    setText($("active-sheet"), sheets.length ? `\u5F53\u524D\u5DE5\u4F5C\u8868\uFF1A${activeSheet}` : "\u5F53\u524D\u5DE5\u4F5C\u8868\uFF1A-");
  }
  function renderSheets() {
    const container = $("sheets");
    if (!container) return;
    if (!repo) {
      setHTML(container, "(\u672A\u521D\u59CB\u5316)");
      return;
    }
    ensureActiveSheet();
    const sheets = getSheetNames();
    if (!sheets.length) {
      setHTML(container, "(\u65E0\u5DE5\u4F5C\u8868)");
      return;
    }
    const items = sheets.map((name, index) => {
      const prefix = name === activeSheet ? "\u2605 " : "";
      const disableDelete = sheets.length === 1 ? " disabled" : "";
      const isDefault = name === "default";
      return `<span>${escapeHtml2(prefix + name)}</span>
			<button data-sheet-select="${index}" class="mini">\u5207\u6362</button>
			<button data-sheet-duplicate="${index}" class="mini">\u590D\u5236</button>
			<button data-sheet-delete="${index}" class="mini"${disableDelete || isDefault ? " disabled" : ""}>\u5220\u9664</button>`;
    });
    setHTML(container, `<ul class="list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    container.querySelectorAll("button[data-sheet-select]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.sheetSelect || "-1", 10);
        const name = sheets[idx];
        if (!name) return;
        activeSheet = name;
        refreshAll();
      });
    });
    container.querySelectorAll("button[data-sheet-duplicate]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!repo) return;
        const idx = parseInt(btn.dataset.sheetDuplicate || "-1", 10);
        const name = sheets[idx];
        if (!name) return;
        const nextName = window.prompt(`\u590D\u5236\u5DE5\u4F5C\u8868 "${name}" \u4E3A\uFF1A`, `${name}_\u526F\u672C`);
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
    container.querySelectorAll("button[data-sheet-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!repo) return;
        const idx = parseInt(btn.dataset.sheetDelete || "-1", 10);
        const name = sheets[idx];
        if (!name) return;
        if (!window.confirm(`\u786E\u5B9A\u5220\u9664\u5DE5\u4F5C\u8868 "${name}"\uFF1F`)) return;
        try {
          repo.deleteSheet(name);
          if (activeSheet === name) {
            const remaining = getSheetNames().filter((n) => n !== name);
            activeSheet = remaining[0] ?? "default";
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
    const s = repo.status();
    setText($("status"), `\u5206\u652F: ${s.branch}, \u6682\u5B58: ${s.stagedChanges}, \u6700\u540E\u63D0\u4EA4: ${s.lastCommit || "\u65E0"}`);
    setText($("active-sheet"), `\u5F53\u524D\u5DE5\u4F5C\u8868\uFF1A${activeSheet}`);
    const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
    if (sheet) {
      const cols = sheet.structure.getColumnIds().map((id) => {
        const c = sheet.structure.getColumn(id);
        const name = c.name || id;
        return `${name} (${c.dataType}) width=${c.width}`;
      });
      renderList("columns", cols);
    } else {
      renderList("columns", ["(\u65E0\u7ED3\u6784)"]);
    }
    const branches = repo.getBranches();
    const current = repo.getCurrentBranch();
    {
      const lines = branches.map((b) => {
        const label = `${b === current ? "\u2605 " : ""}${b}`;
        return `<span>${escapeHtml2(label)}</span>
							<button data-preview-branch="${escapeHtml2(b)}" class="mini">\u9884\u89C8</button>
							<button data-checkout-branch="${escapeHtml2(b)}" class="mini">\u5207\u6362</button>`;
      });
      const el = $("branches");
      if (el) {
        setHTML(el, `<ul class="list">${lines.map((li) => `<li>${li}</li>`).join("")}</ul>`);
        el.querySelectorAll("button[data-preview-branch]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const branch = btn.getAttribute("data-preview-branch");
            previewFrom({ branch }, `\u5206\u652F: ${branch}`);
          });
        });
        el.querySelectorAll("button[data-checkout-branch]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (!repo) return;
            const branch = btn.getAttribute("data-checkout-branch");
            try {
              repo.checkout(branch);
            } catch (e) {
              console.warn(e);
            }
            refreshAll();
          });
        });
      }
    }
    {
      const changes = repo.getStagedChanges();
      const lines = changes.map((ch) => {
        const when = new Date(ch.timestamp).toLocaleTimeString();
        let label = String(ch.type);
        if (ch.type === "cell_add" /* CELL_ADD */ || ch.type === "cell_update" /* CELL_UPDATE */ || ch.type === "cell_delete" /* CELL_DELETE */) {
          const d = ch.details;
          const pos = d && typeof d.row === "number" && typeof d.column === "number" ? ` (${d.row},${d.column})` : "";
          const val = d && "value" in d ? ` = ${String(d.value ?? "")}` : "";
          label = `${ch.type}${pos}${val}`;
        }
        return `${label} @${ch.sheetName} ${when}`;
      });
      renderList("staged", lines.length ? lines : ["(\u7A7A)"]);
    }
    const hist = repo.getCommitHistory(10);
    {
      const lines = hist.map((c) => {
        const label = `${c.getShortHash()} - ${c.message}`;
        return `<span>${escapeHtml2(label)}</span>
							<button data-preview-commit="${escapeHtml2(c.hash)}" class="mini">\u9884\u89C8</button>
							<button data-checkout-commit="${escapeHtml2(c.hash)}" class="mini">\u5207\u6362</button>`;
      });
      const el = $("history");
      if (el) {
        setHTML(el, `<ul class="list">${lines.map((li) => `<li>${li}</li>`).join("")}</ul>`);
        el.querySelectorAll("button[data-preview-commit]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const commit = btn.getAttribute("data-preview-commit");
            previewFrom({ commit }, `\u63D0\u4EA4: ${commit.substring(0, 7)}`);
          });
        });
        el.querySelectorAll("button[data-checkout-commit]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (!repo) return;
            const commit = btn.getAttribute("data-checkout-commit");
            try {
              repo.checkout(commit);
            } catch (e) {
              console.warn(e);
            }
            refreshAll();
          });
        });
      }
    }
    renderGrid();
    refreshPreview();
  }
  function renderGrid() {
    if (!repo) return;
    const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
    if (!sheet) {
      setHTML($("grid"), "(\u7A7A)");
      return;
    }
    const adapter = new TableDataAdapter(repo, activeSheet);
    const data = adapter.build();
    const rows = data.matrix;
    const hasHeader = data.header.length > 0;
    const html = ["<table>", `<caption>\u5DE5\u4F5C\u8868\uFF1A${escapeHtml2(activeSheet)}</caption>`];
    if (hasHeader && rows.length) {
      html.push("<thead><tr>");
      for (let c = 0; c < rows[0].length; c++) {
        const rowIdx = data.minRow + 0;
        const colIdx = data.minCol + c;
        const val = rows[0]?.[c] ?? "";
        html.push(`<th>${val ?? ""} <button class="mini" data-edit-row="${rowIdx}" data-edit-col="${colIdx}">\u4FEE\u6539</button></th>`);
      }
      html.push("</tr></thead>");
    }
    html.push("<tbody>");
    for (let r = hasHeader ? 1 : 0; r < rows.length; r++) {
      html.push("<tr>");
      for (let c = 0; c < rows[r].length; c++) {
        const rowIdx = data.minRow + r;
        const colIdx = data.minCol + c;
        const val = rows[r]?.[c] ?? "";
        html.push(`<td>${val ?? ""} <button class="mini" data-edit-row="${rowIdx}" data-edit-col="${colIdx}">\u4FEE\u6539</button></td>`);
      }
      html.push("</tr>");
    }
    html.push("</tbody></table>");
    setHTML($("grid"), html.join(""));
  }
  function refreshPreview() {
    if (!repo) return;
    const adapter = new TableDataAdapter(repo, activeSheet);
    const data = adapter.build();
    const html = registry.format("html", data, { includeHeader: true });
    const csv = registry.format("csv", data, { includeHeader: true, quoteText: true });
    const json = registry.format("json", data, { shape: "rows", space: 2 });
    setText($("previewFrom"), `\u9884\u89C8\u6765\u6E90\uFF1A\u5F53\u524D\u5DE5\u4F5C\u533A\uFF08${activeSheet}\uFF09`);
    const doc = document.getElementById("htmlFrame").contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`<!doctype html><meta charset='utf-8'><style>table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}</style>${html}`);
      doc.close();
    }
    setText($("csvOut"), csv);
    setText($("jsonOut"), json);
  }
  function previewFrom(source, label, sheetName) {
    if (!repo) return;
    const targetSheet = sheetName ?? activeSheet;
    const adapter = new TableDataAdapter(repo, targetSheet);
    const data = adapter.build(source);
    const html = registry.format("html", data, { includeHeader: true });
    const csv = registry.format("csv", data, { includeHeader: true, quoteText: true });
    const json = registry.format("json", data, { shape: "rows", space: 2 });
    setText($("previewFrom"), `\u9884\u89C8\u6765\u6E90\uFF1A${label}\uFF08${targetSheet}\uFF09`);
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
      repo = createSampleTable();
      seedDemoSheets();
      activeSheet = "default";
      refreshAll();
    };
    $("btn-create-branch").onclick = () => {
      if (!repo) return;
      const b = document.getElementById("branch").value || "temp";
      repo.createBranch(b);
      refreshAll();
    };
    const btnCreateSheet = document.getElementById("btn-create-sheet");
    if (btnCreateSheet) {
      btnCreateSheet.onclick = () => {
        if (!repo) return;
        const input = document.getElementById("sheet-name");
        const name = input?.value.trim() || `sheet_${generateId("")}`;
        if (!name) return;
        try {
          repo.createSheet(name);
          activeSheet = name;
          if (input) input.value = "";
        } catch (e) {
          alert(e?.message || String(e));
        }
        refreshAll();
      };
    }
    const btnDuplicateSheet = document.getElementById("btn-duplicate-sheet");
    if (btnDuplicateSheet) {
      btnDuplicateSheet.onclick = () => {
        if (!repo) return;
        const suggestion = `${activeSheet}_\u526F\u672C`;
        const name = window.prompt("\u590D\u5236\u5F53\u524D\u5DE5\u4F5C\u8868\u4E3A\uFF1A", suggestion)?.trim();
        if (!name) return;
        try {
          repo.duplicateSheet(activeSheet, name);
          activeSheet = name;
        } catch (e) {
          alert(e?.message || String(e));
        }
        refreshAll();
      };
    }
    const btnRenameSheet = document.getElementById("btn-rename-sheet");
    if (btnRenameSheet) {
      btnRenameSheet.onclick = () => {
        if (!repo) return;
        const input = document.getElementById("sheet-rename");
        const name = input?.value.trim();
        if (!name) return;
        try {
          repo.renameSheet(activeSheet, name);
          activeSheet = name;
          if (input) input.value = "";
        } catch (e) {
          alert(e?.message || String(e));
        }
        refreshAll();
      };
    }
    const btnDeleteSheet = document.getElementById("btn-delete-sheet");
    if (btnDeleteSheet) {
      btnDeleteSheet.onclick = () => {
        if (!repo) return;
        if (activeSheet === "default") {
          alert("\u9ED8\u8BA4\u5DE5\u4F5C\u8868\u4E0D\u53EF\u5220\u9664");
          return;
        }
        const sheets = getSheetNames();
        if (sheets.length <= 1) {
          alert("\u81F3\u5C11\u9700\u8981\u4FDD\u7559\u4E00\u4E2A\u5DE5\u4F5C\u8868");
          return;
        }
        if (!window.confirm(`\u786E\u8BA4\u5220\u9664\u5F53\u524D\u5DE5\u4F5C\u8868 "${activeSheet}"\uFF1F`)) return;
        try {
          const removed = activeSheet;
          repo.deleteSheet(removed);
          const remaining = getSheetNames().filter((n) => n !== removed);
          activeSheet = remaining[0] ?? "default";
        } catch (e) {
          alert(e?.message || String(e));
        }
        refreshAll();
      };
    }
    const grid = document.getElementById("grid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        const target = e.target;
        if (!target) return;
        const btn = target.closest("button[data-edit-row][data-edit-col]");
        if (!btn) return;
        if (!repo) return;
        const rowStr = btn.getAttribute("data-edit-row");
        const colStr = btn.getAttribute("data-edit-col");
        if (!rowStr || !colStr) return;
        const row = parseInt(rowStr, 10);
        const col = parseInt(colStr, 10);
        const currentVal = repo.getCellValue(row, col, activeSheet);
        const next = window.prompt(`\u4FEE\u6539\u5355\u5143\u683C (${row}, ${col}) \u7684\u503C\uFF1A`, currentVal != null ? String(currentVal) : "");
        if (next === null) return;
        try {
          repo.addCellChange(activeSheet, row, col, next);
        } catch (err) {
          console.warn(err);
        }
        refreshAll();
      });
    }
    const btnCommit = document.getElementById("btn-commit");
    if (btnCommit) {
      btnCommit.onclick = () => {
        if (!repo) return;
        const message = document.getElementById("commit-message")?.value?.trim() || "update";
        const author = document.getElementById("commit-author")?.value?.trim() || "User";
        const email = document.getElementById("commit-email")?.value?.trim() || "user@example.com";
        try {
          repo.commit(message, author, email);
        } catch (e) {
          alert(e?.message || String(e));
        }
        refreshAll();
      };
    }
    const btnInsertCol = document.getElementById("btn-insert-col");
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
            ids.forEach((id) => {
              const meta = sheet.structure.getColumn(id);
              if (meta && typeof meta.order === "number") {
                max = Math.max(max, meta.order);
              }
            });
            if (max >= 0) return max + 1;
          }
          return data.maxCol >= data.minCol ? data.maxCol + 1 : 0;
        })();
        const colId = `col_${generateId("")}`;
        const col = createColumn(colId, { order: nextOrder });
        try {
          repo.addColumn(activeSheet, col);
        } catch (e) {
          console.warn(e);
        }
        refreshAll();
      };
    }
    const btnInsertRow = document.getElementById("btn-insert-row");
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
            ids.forEach((id) => {
              const meta = sheet.structure.getRow(id);
              if (meta && typeof meta.order === "number") {
                max = Math.max(max, meta.order);
              }
            });
            if (max >= 0) return max + 1;
          }
          return data.maxRow >= data.minRow ? data.maxRow + 1 : 0;
        })();
        const row = createRow({ order: nextOrder });
        try {
          repo.addRow(activeSheet, row);
        } catch (e) {
          console.warn(e);
        }
        refreshAll();
      };
    }
    const btnDeleteColByIndex = document.getElementById("btn-delete-col-index");
    if (btnDeleteColByIndex) {
      btnDeleteColByIndex.onclick = () => {
        if (!repo) return;
        const input = document.getElementById("col-index");
        const raw = input?.value.trim();
        if (!raw?.length) {
          alert("\u8BF7\u8F93\u5165\u5217\u7D22\u5F15");
          return;
        }
        const colIndex = Number(raw);
        if (!Number.isInteger(colIndex) || colIndex < 0) {
          alert("\u5217\u7D22\u5F15\u9700\u4E3A\u975E\u8D1F\u6574\u6570");
          return;
        }
        const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
        if (!sheet) {
          alert("\u5F53\u524D\u5DE5\u4F5C\u8868\u4E3A\u7A7A");
          return;
        }
        let structIds = sheet.structure.getColumnIds();
        if (structIds.length === 0) {
          const bounds = sheet.getBounds?.();
          if (bounds) {
            for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
              repo.addColumn(activeSheet, createColumn(`auto_col_${c}`, { order: c }));
            }
            const refreshed = repo.getPreviewSheet(activeSheet, { includeStaged: true });
            if (refreshed) {
              structIds = refreshed.structure.getColumnIds();
            }
          }
        }
        if (colIndex >= structIds.length) {
          alert("\u7ED3\u6784\u5217\u7D22\u5F15\u4E0D\u5B58\u5728\uFF0C\u8BF7\u68C0\u67E5\u5217\u987A\u5E8F\u3002");
          return;
        }
        const targetId = structIds[colIndex];
        if (!targetId) {
          alert("\u672A\u627E\u5230\u5BF9\u5E94\u5217 ID\u3002");
          return;
        }
        try {
          repo.deleteColumn(activeSheet, targetId);
        } catch (e) {
          console.warn(e);
        }
        if (input) input.value = "";
        refreshAll();
      };
    }
    const btnDeleteRowByIndex = document.getElementById("btn-delete-row-index");
    if (btnDeleteRowByIndex) {
      btnDeleteRowByIndex.onclick = () => {
        if (!repo) return;
        const input = document.getElementById("row-index");
        const raw = input?.value.trim();
        if (!raw?.length) {
          alert("\u8BF7\u8F93\u5165\u884C\u7D22\u5F15");
          return;
        }
        const rowIndex = Number(raw);
        if (!Number.isInteger(rowIndex) || rowIndex < 0) {
          alert("\u884C\u7D22\u5F15\u9700\u4E3A\u975E\u8D1F\u6574\u6570");
          return;
        }
        const sheet = repo.getPreviewSheet(activeSheet, { includeStaged: true });
        if (!sheet) {
          alert("\u5F53\u524D\u5DE5\u4F5C\u8868\u4E3A\u7A7A");
          return;
        }
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
        if (rowIndex >= structIds.length) {
          alert("\u7ED3\u6784\u884C\u7D22\u5F15\u4E0D\u5B58\u5728\uFF0C\u8BF7\u68C0\u67E5\u884C\u987A\u5E8F\u3002");
          return;
        }
        const targetId = structIds[rowIndex];
        if (!targetId) {
          alert("\u672A\u627E\u5230\u5BF9\u5E94\u884C ID\u3002");
          return;
        }
        try {
          repo.deleteRow(activeSheet, targetId);
        } catch (e) {
          console.warn(e);
        }
        if (input) input.value = "";
        refreshAll();
      };
    }
  }
  function seedDemoSheets() {
    if (!repo) return;
    if (!repo.hasSheet("analysis")) {
      repo.createSheet("analysis", { order: 1 });
      repo.addRow("analysis", createRow({ id: "row_0", order: 0 }));
      repo.addRow("analysis", createRow({ id: "row_1", order: 1 }));
      repo.addRow("analysis", createRow({ id: "row_2", order: 2 }));
      repo.addRow("analysis", createRow({ id: "row_3", order: 3 }));
      repo.addCellChange("analysis", 0, 0, "\u6307\u6807", void 0, { fontWeight: "bold" });
      repo.addCellChange("analysis", 0, 1, "\u6570\u503C", void 0, { fontWeight: "bold" });
      repo.addCellChange("analysis", 1, 0, "\u4EA7\u54C1\u6570\u91CF");
      repo.addCellChange("analysis", 1, 1, 3);
      repo.addCellChange("analysis", 2, 0, "\u5E73\u5747\u4EF7\u683C");
      repo.addCellChange("analysis", 2, 1, 8185.67);
      repo.addCellChange("analysis", 3, 0, "\u5E93\u5B58\u603B\u91CF");
      repo.addCellChange("analysis", 3, 1, 225);
      repo.commit("\u65B0\u589E\u5206\u6790\u5DE5\u4F5C\u8868", "System", "system@example.com");
    }
    const sheets = repo.listSheets();
    if (!sheets.includes("draft")) {
      repo.duplicateSheet("default", "draft");
      repo.commit("\u590D\u5236\u9ED8\u8BA4\u5DE5\u4F5C\u8868", "System", "system@example.com");
    }
  }
  function main() {
    bindTabs();
    bindActions();
    repo = createSampleTable();
    seedDemoSheets();
    activeSheet = "default";
    refreshAll();
  }
  document.addEventListener("DOMContentLoaded", main);
})();
/*! Bundled license information:

js-sha1/src/sha1.js:
  (*
   * [js-sha1]{@link https://github.com/emn178/js-sha1}
   *
   * @version 0.7.0
   * @author Chen, Yi-Cyuan [emn178@gmail.com]
   * @copyright Chen, Yi-Cyuan 2014-2024
   * @license MIT
   *)
*/
//# sourceMappingURL=bundle.js.map
