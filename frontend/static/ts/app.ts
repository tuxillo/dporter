import { StateManager } from './managers/StateManager.js';
import { UserManager } from './managers/UserManager.js';
import { PortManager } from './managers/PortManager.js';
import { UIManager } from './managers/UIManager.js';
import { APIClient } from './utils/api.js';

class Application {
    private stateManager: StateManager;
    private apiClient: APIClient;
    private userManager: UserManager;
    private portManager: PortManager;
    private uiManager: UIManager;

    constructor() {
        this.stateManager = new StateManager();
        this.apiClient = new APIClient();
        this.userManager = new UserManager(this.apiClient, this.stateManager);
        this.portManager = new PortManager(this.apiClient, this.stateManager, this.userManager);
        this.uiManager = new UIManager(this.stateManager, this.userManager, this.portManager);
    }

    async init(): Promise<void> {
        try {
            await Promise.all([
                this.userManager.loadUsers(),
                this.portManager.loadPorts()
            ]);
            
            await this.portManager.loadPaginatedPorts();
            this.setupAutoRefresh();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
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
            alert('Port unlocked successfully!');
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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