export class StateManager {
    constructor() {
        this.state = {
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
        this.listeners = new Map();
    }
    getState() {
        return Object.assign({}, this.state);
    }
    setState(updates) {
        this.state = Object.assign(Object.assign({}, this.state), updates);
        this.notifyListeners('stateChange');
    }
    updateUsers(users) {
        this.state.users = users;
        this.notifyListeners('usersUpdated');
    }
    updatePorts(ports) {
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
    updatePaginatedPorts(ports, total, page) {
        this.state.paginatedPorts = ports;
        this.state.pagination = Object.assign(Object.assign({}, this.state.pagination), { total, page });
        this.notifyListeners('paginationUpdated');
    }
    setCurrentUser(user) {
        this.state.currentUser = user;
        this.notifyListeners('userChanged');
    }
    updateFilters(filters) {
        this.state.filters = Object.assign(Object.assign({}, this.state.filters), filters);
        this.notifyListeners('filtersChanged');
    }
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    notifyListeners(event) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(this.state));
    }
}
