"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseDto = void 0;
class ResponseDto {
    static success(message, data, meta) {
        return {
            success: true,
            message,
            data,
            meta,
        };
    }
    static error(message, errors) {
        return {
            success: false,
            message,
            errors,
        };
    }
}
exports.ResponseDto = ResponseDto;
