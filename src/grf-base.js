var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { inflate } from 'pako';
import jDataview from 'jdataview';
import { decodeFull, decodeHeader } from './des';
var FILELIST_TYPE_FILE = 0x01;
var FILELIST_TYPE_ENCRYPT_MIXED = 0x02; // encryption mode 0 (header DES + periodic DES/shuffle)
var FILELIST_TYPE_ENCRYPT_HEADER = 0x04; // encryption mode 1 (header DES only)
var HEADER_SIGNATURE = 'Master of Magic';
var HEADER_SIZE = 46;
var FILE_TABLE_SIZE = Uint32Array.BYTES_PER_ELEMENT * 2;
var GrfBase = /** @class */ (function () {
    function GrfBase(fd) {
        this.fd = fd;
        this.version = 0x200;
        this.fileCount = 0;
        this.loaded = false;
        this.files = new Map();
        this.fileTableOffset = 0;
    }
    GrfBase.prototype.getStreamReader = function (offset, length) {
        return __awaiter(this, void 0, void 0, function () {
            var buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getStreamBuffer(this.fd, offset, length)];
                    case 1:
                        buffer = _a.sent();
                        return [2 /*return*/, new jDataview(buffer, void 0, void 0, true)];
                }
            });
        });
    };
    GrfBase.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.loaded) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.parseHeader()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.parseFileList()];
                    case 2:
                        _a.sent();
                        this.loaded = true;
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GrfBase.prototype.parseHeader = function () {
        return __awaiter(this, void 0, void 0, function () {
            var reader, signature, reservedFiles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getStreamReader(0, HEADER_SIZE)];
                    case 1:
                        reader = _a.sent();
                        signature = reader.getString(15);
                        if (signature !== HEADER_SIGNATURE) {
                            throw new Error('Not a GRF file (invalid signature)');
                        }
                        reader.skip(15);
                        this.fileTableOffset = reader.getUint32() + HEADER_SIZE;
                        reservedFiles = reader.getUint32();
                        this.fileCount = reader.getUint32() - reservedFiles - 7;
                        this.version = reader.getUint32();
                        if (this.version !== 0x200) {
                            throw new Error("Unsupported version \"0x" + this.version.toString(16) + "\"");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    GrfBase.prototype.parseFileList = function () {
        return __awaiter(this, void 0, void 0, function () {
            var reader, compressedSize, realSize, compressed, data, i, p, filename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getStreamReader(this.fileTableOffset, FILE_TABLE_SIZE)];
                    case 1:
                        reader = _a.sent();
                        compressedSize = reader.getUint32();
                        realSize = reader.getUint32();
                        return [4 /*yield*/, this.getStreamBuffer(this.fd, this.fileTableOffset + FILE_TABLE_SIZE, compressedSize)];
                    case 2:
                        compressed = _a.sent();
                        data = inflate(compressed, {
                        //chunkSize: realSize
                        });
                        // Optimized version without using jDataView (faster)
                        for (i = 0, p = 0; i < this.fileCount; ++i) {
                            filename = '';
                            while (data[p]) {
                                filename += String.fromCharCode(data[p++]);
                            }
                            p++;
                            // prettier-ignore
                            this.files.set(filename.toLowerCase(), {
                                compressedSize: data[p++] | (data[p++] << 8) | (data[p++] << 16) | (data[p++] << 24),
                                lengthAligned: data[p++] | (data[p++] << 8) | (data[p++] << 16) | (data[p++] << 24),
                                realSize: data[p++] | (data[p++] << 8) | (data[p++] << 16) | (data[p++] << 24),
                                type: data[p++],
                                offset: data[p++] | (data[p++] << 8) | (data[p++] << 16) | (data[p++] << 24)
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    GrfBase.prototype.decodeEntry = function (data, entry) {
        // Decode the file
        if (entry.type & FILELIST_TYPE_ENCRYPT_MIXED) {
            decodeFull(data, entry.lengthAligned, entry.compressedSize);
        }
        else if (entry.type & FILELIST_TYPE_ENCRYPT_HEADER) {
            decodeHeader(data, entry.lengthAligned);
        }
        // No compression
        if (entry.realSize === entry.compressedSize) {
            return data;
        }
        // Uncompress
        return inflate(data, {
        //chunkSize: entry.realSize
        });
    };
    GrfBase.prototype.getFile = function (filename) {
        return __awaiter(this, void 0, void 0, function () {
            var path, entry, data, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.loaded) {
                            return [2 /*return*/, Promise.resolve({ data: null, error: 'GRF not loaded yet' })];
                        }
                        path = filename.toLowerCase();
                        // Not exists
                        if (!this.files.has(path)) {
                            return [2 /*return*/, Promise.resolve({ data: null, error: "File \"" + path + "\" not found" })];
                        }
                        entry = this.files.get(path);
                        // Not a file (folder ?)
                        if (!(entry.type & FILELIST_TYPE_FILE)) {
                            return [2 /*return*/, Promise.resolve({
                                    data: null,
                                    error: "File \"" + path + "\" is a directory"
                                })];
                        }
                        return [4 /*yield*/, this.getStreamBuffer(this.fd, entry.offset + HEADER_SIZE, entry.lengthAligned)];
                    case 1:
                        data = _a.sent();
                        try {
                            result = this.decodeEntry(data, entry);
                            return [2 /*return*/, Promise.resolve({ data: result, error: null })];
                        }
                        catch (error) {
                            return [2 /*return*/, Promise.resolve({ data: null, error: error })];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return GrfBase;
}());
export { GrfBase };
