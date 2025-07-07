var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class UserManager {
    constructor(api, stateManager) {
        this.api = api;
        this.stateManager = stateManager;
    }
    loadUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield this.api.getUsers();
                const activeUsers = users.filter(user => user.active);
                this.stateManager.updateUsers(activeUsers);
                // Set current user (for now, use the first user or implement proper auth)
                if (activeUsers.length > 0 && !this.stateManager.getState().currentUser) {
                    this.setCurrentUser(activeUsers[0]);
                }
            }
            catch (error) {
                console.error('Failed to load users:', error);
                throw error;
            }
        });
    }
    setCurrentUser(user) {
        this.stateManager.setCurrentUser(user);
    }
    getCurrentUser() {
        return this.stateManager.getState().currentUser;
    }
    getUsers() {
        return this.stateManager.getState().users;
    }
    getUserByUsername(username) {
        return this.stateManager.getState().users.find(user => user.username === username);
    }
    getActiveUsers() {
        return this.stateManager.getState().users.filter(user => user.active);
    }
}
