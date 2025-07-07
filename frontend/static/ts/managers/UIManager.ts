import { Port, User } from '../types/index.js';
import { StateManager } from './StateManager.js';
import { UserManager } from './UserManager.js';
import { PortManager } from './PortManager.js';

export class UIManager {
    private stateManager: StateManager;
    private userManager: UserManager;
    private portManager: PortManager;

    constructor(stateManager: StateManager, userManager: UserManager, portManager: PortManager) {
        this.stateManager = stateManager;
        this.userManager = userManager;
        this.portManager = portManager;
        
        this.setupEventListeners();
        this.subscribeToStateChanges();
    }

    private setupEventListeners(): void {
        // Search functionality
        const searchInput = document.getElementById('search') as HTMLInputElement;
        searchInput?.addEventListener('input', () => {
            const filters = { search: searchInput.value };
            this.stateManager.updateFilters(filters);
        });

        // Filter functionality
        const categoryFilter = document.getElementById('category-filter') as HTMLSelectElement;
        categoryFilter?.addEventListener('change', () => {
            const filters = { category: categoryFilter.value };
            this.stateManager.updateFilters(filters);
        });

        const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
        statusFilter?.addEventListener('change', () => {
            const filters = { status: statusFilter.value };
            this.stateManager.updateFilters(filters);
        });

        // Modal functionality
        this.setupModalEvents();
        
        // View toggle buttons
        this.setupViewToggleEvents();
        
        // Pagination
        this.setupPaginationEvents();
    }

    private setupModalEvents(): void {
        const modal = document.getElementById('lock-modal') as HTMLElement;
        const closeBtn = document.getElementsByClassName('close')[0] as HTMLElement;
        
        closeBtn?.addEventListener('click', () => {
            this.hideModal();
        });

        window.addEventListener('click', (event: MouseEvent) => {
            if (event.target === modal) {
                this.hideModal();
            }
        });

        // Lock form submission
        const lockForm = document.getElementById('lock-form') as HTMLFormElement;
        lockForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLockSubmission();
        });
    }

    private setupViewToggleEvents(): void {
        const tableViewBtn = document.getElementById('table-view-btn') as HTMLElement;
        const cardViewBtn = document.getElementById('card-view-btn') as HTMLElement;
        
        tableViewBtn?.addEventListener('click', () => {
            this.switchToTableView();
        });

        cardViewBtn?.addEventListener('click', () => {
            this.switchToCardView();
        });
    }

    private setupPaginationEvents(): void {
        const prevBtn = document.getElementById('prev-page') as HTMLButtonElement;
        const nextBtn = document.getElementById('next-page') as HTMLButtonElement;

        prevBtn?.addEventListener('click', () => {
            const { pagination } = this.stateManager.getState();
            if (pagination.page > 1) {
                this.portManager.loadPaginatedPorts(pagination.page - 1);
            }
        });

        nextBtn?.addEventListener('click', () => {
            const { pagination } = this.stateManager.getState();
            const totalPages = Math.ceil(pagination.total / pagination.limit);
            if (pagination.page < totalPages) {
                this.portManager.loadPaginatedPorts(pagination.page + 1);
            }
        });
    }

    private subscribeToStateChanges(): void {
        this.stateManager.subscribe('portsUpdated', () => {
            this.renderPorts();
            this.updateStats();
            this.updateCategoryFilter();
        });

        this.stateManager.subscribe('paginationUpdated', () => {
            this.renderTable();
            this.updatePagination();
        });

        this.stateManager.subscribe('filtersChanged', () => {
            this.renderPorts();
        });

        this.stateManager.subscribe('usersUpdated', () => {
            this.updateUserDropdown();
        });

        this.stateManager.subscribe('userChanged', () => {
            this.updateCurrentUserDisplay();
        });
    }

    private updateCategoryFilter(): void {
        const select = document.getElementById('category-filter') as HTMLSelectElement;
        if (!select) return;

        const { categories } = this.stateManager.getState();
        select.innerHTML = '<option value="">All Categories</option>';
        
        [...categories].sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    private updateUserDropdown(): void {
        const select = document.getElementById('user-select') as HTMLSelectElement;
        if (!select) return;

        const users = this.userManager.getActiveUsers();
        const currentUser = this.userManager.getCurrentUser();
        
        select.innerHTML = '';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = `${user.name} (${user.username})`;
            if (currentUser && user.username === currentUser.username) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    private updateCurrentUserDisplay(): void {
        const userDisplay = document.getElementById('current-user') as HTMLElement;
        if (!userDisplay) return;

        const currentUser = this.userManager.getCurrentUser();
        if (currentUser) {
            userDisplay.textContent = `Logged in as: ${currentUser.name}`;
        } else {
            userDisplay.textContent = 'No user selected';
        }
    }

    renderPorts(): void {
        const filteredPorts = this.portManager.getFilteredPorts();
        const grid = document.getElementById('ports-grid') as HTMLElement;
        if (!grid) return;

        grid.innerHTML = '';

        filteredPorts.forEach(port => {
            const portCard = this.createPortCard(port);
            grid.appendChild(portCard);
        });
    }

    private createPortCard(port: Port): HTMLElement {
        const card = document.createElement('div');
        card.className = `port-card ${port.lock ? 'locked' : 'available'}`;

        const lockInfo = port.lock ? `
            <div class="lock-info">
                <strong>Locked by:</strong> ${port.lock.developer_name}<br>
                <strong>Since:</strong> ${new Date(port.lock.locked_at).toLocaleDateString()}
            </div>
        ` : '';

        const actions = port.lock ? `
            <button class="btn btn-secondary" onclick="window.coordinator.unlockPort(${port.id})">
                Unlock Port
            </button>
        ` : `
            <button class="btn btn-primary" onclick="window.coordinator.showLockModal(${port.id})">
                Lock Port
            </button>
        `;

        card.innerHTML = `
            <div class="port-header">
                <div class="port-name">${port.name}</div>
                <div class="port-status status-${port.lock ? 'locked' : 'available'}">
                    ${port.lock ? 'Locked' : 'Available'}
                </div>
            </div>
            <div class="port-category">${port.category}</div>
            <div class="port-description">${port.description}</div>
            ${lockInfo}
            <div class="port-actions">
                ${actions}
            </div>
        `;

        return card;
    }

    renderTable(): void {
        const tbody = document.querySelector('#ports-table tbody') as HTMLTableSectionElement;
        if (!tbody) return;

        const { paginatedPorts } = this.stateManager.getState();
        tbody.innerHTML = '';
        
        paginatedPorts.forEach(port => {
            const row = this.createPortTableRow(port);
            tbody.appendChild(row);
        });
    }

    private createPortTableRow(port: Port): HTMLTableRowElement {
        const row = document.createElement('tr');
        const action = port.lock ?
            `<button class="btn btn-secondary" onclick="window.coordinator.unlockPort(${port.id})">Unlock</button>` :
            `<button class="btn btn-primary" onclick="window.coordinator.showLockModal(${port.id})">Lock</button>`;
            
        row.innerHTML = `
            <td>${port.name}</td>
            <td>${port.category}</td>
            <td>${port.description}</td>
            <td>${port.lock ? 'Locked' : 'Available'}</td>
            <td>${action}</td>
        `;
        return row;
    }

    private updatePagination(): void {
        const { pagination } = this.stateManager.getState();
        const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
        
        const pageInfo = document.getElementById('page-info') as HTMLElement;
        const prevBtn = document.getElementById('prev-page') as HTMLButtonElement;
        const nextBtn = document.getElementById('next-page') as HTMLButtonElement;

        if (pageInfo) pageInfo.textContent = `${pagination.page} / ${totalPages}`;
        if (prevBtn) prevBtn.disabled = pagination.page <= 1;
        if (nextBtn) nextBtn.disabled = pagination.page >= totalPages;
    }

    updateStats(): void {
        const stats = this.portManager.getStats();
        
        const totalEl = document.getElementById('total-ports') as HTMLElement;
        const lockedEl = document.getElementById('locked-ports') as HTMLElement;
        const availableEl = document.getElementById('available-ports') as HTMLElement;

        if (totalEl) totalEl.textContent = String(stats.total);
        if (lockedEl) lockedEl.textContent = String(stats.locked);
        if (availableEl) availableEl.textContent = String(stats.available);
    }

    showLockModal(portId: number): void {
        const portIdInput = document.getElementById('port-id') as HTMLInputElement;
        const modal = document.getElementById('lock-modal') as HTMLElement;
        
        if (portIdInput) portIdInput.value = String(portId);
        if (modal) modal.style.display = 'block';
        
        this.updateUserDropdown();
    }

    private hideModal(): void {
        const modal = document.getElementById('lock-modal') as HTMLElement;
        const form = document.getElementById('lock-form') as HTMLFormElement;
        
        if (modal) modal.style.display = 'none';
        if (form) form.reset();
    }

    private async handleLockSubmission(): Promise<void> {
        const portIdInput = document.getElementById('port-id') as HTMLInputElement;
        const userSelect = document.getElementById('user-select') as HTMLSelectElement;
        
        if (!portIdInput || !userSelect) return;

        const portId = parseInt(portIdInput.value);
        const username = userSelect.value;

        try {
            await this.portManager.lockPort(portId, username);
            this.hideModal();
            this.showSuccessMessage('Port locked successfully!');
        } catch (error) {
            this.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private switchToTableView(): void {
        const portsGrid = document.getElementById('ports-grid') as HTMLElement;
        const tableSection = document.getElementById('ports-table-section') as HTMLElement;
        
        if (portsGrid) portsGrid.style.display = 'none';
        if (tableSection) tableSection.style.display = 'block';
        
        this.portManager.loadPaginatedPorts();
    }

    private switchToCardView(): void {
        const tableSection = document.getElementById('ports-table-section') as HTMLElement;
        const portsGrid = document.getElementById('ports-grid') as HTMLElement;
        
        if (tableSection) tableSection.style.display = 'none';
        if (portsGrid) portsGrid.style.display = 'grid';
    }

    private showSuccessMessage(message: string): void {
        alert(message); // You can replace this with a better notification system
    }

    private showErrorMessage(message: string): void {
        alert(message); // You can replace this with a better notification system
    }
}