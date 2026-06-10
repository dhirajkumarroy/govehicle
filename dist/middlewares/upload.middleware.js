"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVehicleImages = exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const app_error_1 = require("../common/utils/app-error");
// Custom file type filter checking MIME types
const fileFilter = (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new app_error_1.BadRequestError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
};
// Multer memory storage engine configuration
const uploadSingleImage = (fieldName) => {
    return (0, multer_1.default)({
        storage: multer_1.default.memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5 MB
        },
        fileFilter,
    }).single(fieldName);
};
/**
 * Express middleware to handle avatar image uploads.
 * Captures Multer limit errors and routes them to global error middleware.
 */
const uploadAvatar = (req, res, next) => {
    const upload = uploadSingleImage('avatar');
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer_1.default.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new app_error_1.BadRequestError('File is too large. Maximum size allowed is 5 MB.'));
                }
                return next(new app_error_1.BadRequestError(`File upload error: ${err.message}`));
            }
            return next(err);
        }
        next();
    });
};
exports.uploadAvatar = uploadAvatar;
// Multer array storage engine configuration
const uploadMultipleImages = (fieldName, maxCount) => {
    return (0, multer_1.default)({
        storage: multer_1.default.memoryStorage(),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10 MB per file
        },
        fileFilter,
    }).array(fieldName, maxCount);
};
/**
 * Express middleware to handle multiple vehicle image uploads.
 */
const uploadVehicleImages = (req, res, next) => {
    const upload = uploadMultipleImages('images', 10);
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer_1.default.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new app_error_1.BadRequestError('File is too large. Maximum size allowed is 10 MB per image.'));
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next(new app_error_1.BadRequestError('Too many files uploaded. Maximum is 10 images.'));
                }
                return next(new app_error_1.BadRequestError(`File upload error: ${err.message}`));
            }
            return next(err);
        }
        next();
    });
};
exports.uploadVehicleImages = uploadVehicleImages;
