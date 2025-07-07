import { User } from '../types/index.js';
import { APIClient } from '../utils/api.js';
import { StateManager } from './StateManager.js';

export class UserManager {
    private api: APIClient;
    private stateManager: StateManager;

    constructor(api: APIClient, stateManager: StateManager) {
        this.api = api;
        this.stateManager = stateManager;
    }

    async loadUsers(): Promise<void> {
        try {
            const users = await this.api.getUsers();
            const activeUsers = users.filter(user => user.active);
            this.stateManager.updateUsers(activeUsers);
            
            // Set current user (for now, use the first user or implement proper auth)
            if (activeUsers.length > 0 && !this.stateManager.getState().currentUser) {
                this.setCurrentUser(activeUsers[0]);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            throw error;
        }
    }

    setCurrentUser(user: User | null): void {
        this.stateManager.setCurrentUser(user);
    }

    getCurrentUser(): User | null {
        return this.stateManager.getState().currentUser;
    }

    getUsers(): User[] {
        return this.stateManager.getState().users;
    }

    getUserByUsername(username: string): User | undefined {
        return this.stateManager.getState().users.find(user => user.username === username);
    }

    getActiveUsers(): User[] {
        return this.stateManager.getState().users.filter(user => user.active);
    }
}