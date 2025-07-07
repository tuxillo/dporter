import { AppState, User, Port } from '../types/index.js';

export class StateManager {
    private state: AppState = {
        users: [],
        ports: [],
        categories: new Set(),
        paginatedPorts: [],
        currentUser: null,
        pagination: {
            page: 1,
            limit: 20,
            total: 0
        },
        filters: {
            search: '',
            category: '',
            status: ''
        }
    };

    private listeners: Map<string, Function[]> = new Map();

    getState(): AppState {
        return { ...this.state };
    }

    setState(updates: Partial<AppState>): void {
        this.state = { ...this.state, ...updates };
        this.notifyListeners('stateChange');
    }

    updateUsers(users: User[]): void {
        this.state.users = users;
        this.notifyListeners('usersUpdated');
    }

    updatePorts(ports: Port[]): void {
        this.state.ports = ports;
        // Update categories
        this.state.categories.clear();
        ports.forEach(port => {
            if (port.category) {
                this.state.categories.add(port.category);
            }
        });
        this.notifyListeners('portsUpdated');
    }

    updatePaginatedPorts(ports: Port[], total: number, page: number): void {
        this.state.paginatedPorts = ports;
        this.state.pagination = { ...this.state.pagination, total, page };
        this.notifyListeners('paginationUpdated');
    }

    setCurrentUser(user: User | null): void {
        this.state.currentUser = user;
        this.notifyListeners('userChanged');
    }

    updateFilters(filters: Partial<AppState['filters']>): void {
        this.state.filters = { ...this.state.filters, ...filters };
        this.notifyListeners('filtersChanged');
    }

    subscribe(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    private notifyListeners(event: string): void {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(this.state));
    }
}