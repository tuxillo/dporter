var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class PortManager {
    constructor(api, stateManager, userManager) {
        this.api = api;
        this.stateManager = stateManager;
        this.userManager = userManager;
    }
    loadPorts() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ports = yield this.api.getPorts();
                this.stateManager.updatePorts(ports);
            }
            catch (error) {
                console.error('Failed to load ports:', error);
                throw error;
            }
        });
    }
    loadPaginatedPorts() {
        return __awaiter(this, arguments, void 0, function* (page = 1) {
            try {
                const { pagination } = this.stateManager.getState();
                const data = yield this.api.getPaginatedPorts(page, pagination.limit);
                this.stateManager.updatePaginatedPorts(data.ports, data.total, page);
            }
            catch (error) {
                console.error('Failed to load paginated ports:', error);
                throw error;
            }
        });
    }
    lockPort(portId, username) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = username ?
                this.userManager.getUserByUsername(username) :
                this.userManager.getCurrentUser();
            if (!user) {
                throw new Error('No user selected for locking port');
            }
            try {
                yield this.api.lockPort(portId, user.username, user.name);
                yield this.refreshData();
            }
            catch (error) {
                console.error('Failed to lock port:', error);
                throw error;
            }
        });
    }
    unlockPort(portId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.api.unlockPort(portId);
                yield this.refreshData();
            }
            catch (error) {
                console.error('Failed to unlock port:', error);
                throw error;
            }
        });
    }
    getFilteredPorts() {
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
    refreshData() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadPorts();
            const { pagination } = this.stateManager.getState();
            if (pagination.page > 1) {
                yield this.loadPaginatedPorts(pagination.page);
            }
        });
    }
}
