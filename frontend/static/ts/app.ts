import { StateManager } from './managers/StateManager.js';
import { UserManager } from './managers/UserManager.js';
import { PortManager } from './managers/PortManager.js';
import { UIManager } from './managers/UIManager.js';
import { APIClient } from './utils/api.js';
import { NotificationManager } from './utils/notifications.js';

class Application {
    private stateManager: StateManager;
    private apiClient: APIClient;
    private userManager: UserManager;
    private portManager: PortManager;
    private uiManager: UIManager;
    private notifications: NotificationManager;

    constructor() {
        this.stateManager = new StateManager();
        this.apiClient = new APIClient();
        this.userManager = new UserManager(this.apiClient, this.stateManager);
        this.portManager = new PortManager(this.apiClient, this.stateManager, this.userManager);
        this.uiManager = new UIManager(this.stateManager, this.userManager, this.portManager);
        this.notifications = new NotificationManager();
    }

    async init(): Promise<void> {
        try {
            this.notifications.info('Loading DPorts Coordinator...');
            
            // Set current user based on login (you mentioned tuxillo)
            await this.userManager.loadUsers();
            const currentUser = this.userManager.getUserByUsername('tuxillo');
            if (currentUser) {
                this.userManager.setCurrentUser(currentUser);
            }
            
            await Promise.all([
                this.portManager.loadPorts()
            ]);
            
            await this.portManager.loadPaginatedPorts();
            this.setupAutoRefresh();
            
            this.notifications.success('DPorts Coordinator ready! 🚀');
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.notifications.error('Failed to initialize application. Please refresh the page.');
        }
    }

    // Public methods for global access (window.coordinator compatibility)
    showLockModal(portId: number): void {
        this.uiManager.showLockModal(portId);
    }

    async unlockPort(portId: number): Promise<void> {
        if (!confirm('Are you sure you want to unlock this port?')) {
            return;
        }

        try {
            await this.portManager.unlockPort(portId);
            this.notifications.success('Port unlocked successfully! 🔓');
        } catch (error) {
            this.notifications.error(`Failed to unlock port: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private setupAutoRefresh(): void {
        setInterval(async () => {
            try {
                await this.portManager.loadPorts();
                
                const tableSection = document.getElementById('ports-table-section') as HTMLElement;
                if (tableSection && tableSection.style.display !== 'none') {
                    await this.portManager.loadPaginatedPorts();
                }
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }, 30000);
    }
}

// Global initialization
const coordinator = new Application();

// Make coordinator available globally for onclick handlers
declare global {
    interface Window {
        coordinator: Application;
    }
}
window.coordinator = coordinator;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    coordinator.init();
});

export default coordinator;
