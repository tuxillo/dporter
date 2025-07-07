import { Port } from '../types/index.js';
import { APIClient } from '../utils/api.js';
import { StateManager } from './StateManager.js';
import { UserManager } from './UserManager.js';

export class PortManager {
    private api: APIClient;
    private stateManager: StateManager;
    private userManager: UserManager;

    constructor(api: APIClient, stateManager: StateManager, userManager: UserManager) {
        this.api = api;
        this.stateManager = stateManager;
        this.userManager = userManager;
    }

    async loadPorts(): Promise<void> {
        try {
            const ports = await this.api.getPorts();
            this.stateManager.updatePorts(ports);
        } catch (error) {
            console.error('Failed to load ports:', error);
            throw error;
        }
    }

    async loadPaginatedPorts(page: number = 1): Promise<void> {
        try {
            const { pagination } = this.stateManager.getState();
            const data = await this.api.getPaginatedPorts(page, pagination.limit);
            this.stateManager.updatePaginatedPorts(data.ports, data.total, page);
        } catch (error) {
            console.error('Failed to load paginated ports:', error);
            throw error;
        }
    }

    async lockPort(portId: number, username?: string): Promise<void> {
        const user = username ? 
            this.userManager.getUserByUsername(username) : 
            this.userManager.getCurrentUser();
            
        if (!user) {
            throw new Error('No user selected for locking port');
        }

        try {
            await this.api.lockPort(portId, user.username, user.name);
            await this.refreshData();
        } catch (error) {
            console.error('Failed to lock port:', error);
            throw error;
        }
    }

    async unlockPort(portId: number): Promise<void> {
        try {
            await this.api.unlockPort(portId);
            await this.refreshData();
        } catch (error) {
            console.error('Failed to unlock port:', error);
            throw error;
        }
    }

    getFilteredPorts(): Port[] {
        const { ports, filters } = this.stateManager.getState();
        
        return ports.filter(port => {
            const matchesSearch = !filters.search || 
                port.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                port.description.toLowerCase().includes(filters.search.toLowerCase());
                
            const matchesCategory = !filters.category || port.category === filters.category;
            
            const matchesStatus = !filters.status || 
                (filters.status === 'locked' && port.lock) ||
                (filters.status === 'available' && !port.lock);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }

    getStats() {
        const { ports } = this.stateManager.getState();
        const total = ports.length;
        const locked = ports.filter(port => port.lock).length;
        const available = total - locked;
        
        return { total, locked, available };
    }

    private async refreshData(): Promise<void> {
        await this.loadPorts();
        const { pagination } = this.stateManager.getState();
        if (pagination.page > 1) {
            await this.loadPaginatedPorts(pagination.page);
        }
    }
}