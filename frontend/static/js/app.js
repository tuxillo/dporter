var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { StateManager } from './managers/StateManager.js';
import { UserManager } from './managers/UserManager.js';
import { PortManager } from './managers/PortManager.js';
import { UIManager } from './managers/UIManager.js';
import { APIClient } from './utils/api.js';
import { NotificationManager } from './utils/notifications.js';
class Application {
    constructor() {
        this.stateManager = new StateManager();
        this.apiClient = new APIClient();
        this.userManager = new UserManager(this.apiClient, this.stateManager);
        this.portManager = new PortManager(this.apiClient, this.stateManager, this.userManager);
        this.uiManager = new UIManager(this.stateManager, this.userManager, this.portManager);
        this.notifications = new NotificationManager();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.notifications.info('Loading DPorts Coordinator...');
                // Set current user based on login (you mentioned tuxillo)
                yield this.userManager.loadUsers();
                const currentUser = this.userManager.getUserByUsername('tuxillo');
                if (currentUser) {
                    this.userManager.setCurrentUser(currentUser);
                }
                yield Promise.all([
                    this.portManager.loadPorts()
                ]);
                yield this.portManager.loadPaginatedPorts();
                this.setupAutoRefresh();
                this.notifications.success('DPorts Coordinator ready! 🚀');
                console.log('Application initialized successfully');
            }
            catch (error) {
                console.error('Failed to initialize application:', error);
                this.notifications.error('Failed to initialize application. Please refresh the page.');
            }
        });
    }
    // Public methods for global access (window.coordinator compatibility)
    showLockModal(portId) {
        this.uiManager.showLockModal(portId);
    }
    unlockPort(portId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!confirm('Are you sure you want to unlock this port?')) {
                return;
            }
            try {
                yield this.portManager.unlockPort(portId);
                this.notifications.success('Port unlocked successfully! 🔓');
            }
            catch (error) {
                this.notifications.error(`Failed to unlock port: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    setupAutoRefresh() {
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.portManager.loadPorts();
                const tableSection = document.getElementById('ports-table-section');
                if (tableSection && tableSection.style.display !== 'none') {
                    yield this.portManager.loadPaginatedPorts();
                }
            }
            catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }), 30000);
    }
}
// Global initialization
const coordinator = new Application();
window.coordinator = coordinator;
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    coordinator.init();
});
export default coordinator;
