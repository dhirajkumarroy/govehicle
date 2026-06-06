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
}
exports.UserRepository = UserRepository;
exports.default = UserRepository;
