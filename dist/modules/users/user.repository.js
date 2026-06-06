"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const database_1 = __importDefault(require("../../config/database"));
class UserRepository {
    /**
     * Find a user profile in the database by their unique ID.
     * @param id The database user uuid.
     */
    async findById(id) {
        return database_1.default.user.findUnique({
            where: { id },
        });
    }
    /**
     * Find a user profile in the database by their unique phone number.
     * @param phone The unique phone number.
     */
    async findByPhone(phone) {
        return database_1.default.user.findUnique({
            where: { phone },
        });
    }
    /**
     * Updates partial data on a user record.
     * @param id The database user uuid.
     * @param data The updated data fields.
     */
    async update(id, data) {
        return database_1.default.user.update({
            where: { id },
            data,
        });
    }
}
exports.UserRepository = UserRepository;
exports.default = UserRepository;
