var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NotificationManager } from '../utils/notifications.js';
export class UIManager {
    constructor(stateManager, userManager, portManager) {
        this.stateManager = stateManager;
        this.userManager = userManager;
        this.portManager = portManager;
        this.notifications = new NotificationManager();
        this.setupEventListeners();
        this.subscribeToStateChanges();
    }
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search');
        searchInput === null || searchInput === void 0 ? void 0 : searchInput.addEventListener('input', () => {
            const filters = { search: searchInput.value };
            this.stateManager.updateFilters(filters);
        });
        // Filter functionality
        const categoryFilter = document.getElementById('category-filter');
        categoryFilter === null || categoryFilter === void 0 ? void 0 : categoryFilter.addEventListener('change', () => {
            const filters = { category: categoryFilter.value };
            this.stateManager.updateFilters(filters);
        });
        const statusFilter = document.getElementById('status-filter');
        statusFilter === null || statusFilter === void 0 ? void 0 : statusFilter.addEventListener('change', () => {
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
    setupModalEvents() {
        const modal = document.getElementById('lock-modal');
        const closeBtn = document.getElementsByClassName('close')[0];
        closeBtn === null || closeBtn === void 0 ? void 0 : closeBtn.addEventListener('click', () => {
            this.hideModal();
        });
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.hideModal();
            }
        });
        // Lock form submission
        const lockForm = document.getElementById('lock-form');
        lockForm === null || lockForm === void 0 ? void 0 : lockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLockSubmission();
        });
    }
    setupViewToggleEvents() {
        const tableViewBtn = document.getElementById('table-view-btn');
        const cardViewBtn = document.getElementById('card-view-btn');
        tableViewBtn === null || tableViewBtn === void 0 ? void 0 : tableViewBtn.addEventListener('click', () => {
            this.switchToTableView();
            this.updateViewButtonStates('table');
        });
        cardViewBtn === null || cardViewBtn === void 0 ? void 0 : cardViewBtn.addEventListener('click', () => {
            this.switchToCardView();
            this.updateViewButtonStates('card');
        });
    }
    updateViewButtonStates(activeView) {
        const tableViewBtn = document.getElementById('table-view-btn');
        const cardViewBtn = document.getElementById('card-view-btn');
        if (tableViewBtn && cardViewBtn) {
            tableViewBtn.classList.toggle('active', activeView === 'table');
            cardViewBtn.classList.toggle('active', activeView === 'card');
        }
    }
    setupPaginationEvents() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        prevBtn === null || prevBtn === void 0 ? void 0 : prevBtn.addEventListener('click', () => {
            const { pagination } = this.stateManager.getState();
            if (pagination.page > 1) {
                this.portManager.loadPaginatedPorts(pagination.page - 1);
            }
        });
        nextBtn === null || nextBtn === void 0 ? void 0 : nextBtn.addEventListener('click', () => {
            const { pagination } = this.stateManager.getState();
            const totalPages = Math.ceil(pagination.total / pagination.limit);
            if (pagination.page < totalPages) {
                this.portManager.loadPaginatedPorts(pagination.page + 1);
            }
        });
    }
    subscribeToStateChanges() {
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
    updateCategoryFilter() {
        const select = document.getElementById('category-filter');
        if (!select)
            return;
        const { categories } = this.stateManager.getState();
        select.innerHTML = '<option value="">📁 All Categories</option>';
        [...categories].sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }
    updateUserDropdown() {
        const select = document.getElementById('user-select');
        if (!select)
            return;
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
    updateCurrentUserDisplay() {
        const userDisplay = document.getElementById('current-user');
        if (!userDisplay)
            return;
        const currentUser = this.userManager.getCurrentUser();
        if (currentUser) {
            userDisplay.textContent = `${currentUser.name} (@${currentUser.username})`;
        }
        else {
            userDisplay.textContent = 'No user selected';
        }
    }
    renderPorts() {
        const filteredPorts = this.portManager.getFilteredPorts();
        const grid = document.getElementById('ports-grid');
        if (!grid)
            return;
        grid.innerHTML = '';
        if (filteredPorts.length === 0) {
            this.renderEmptyState(grid);
            return;
        }
        filteredPorts.forEach(port => {
            const portCard = this.createPortCard(port);
            grid.appendChild(portCard);
        });
    }
    renderEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No ports found</h3>
                <p>Try adjusting your search filters to find what you're looking for.</p>
            </div>
        `;
    }
    createPortCard(port) {
        const card = document.createElement('div');
        card.className = `port-card ${port.lock ? 'locked' : 'available'}`;
        const lockInfo = port.lock ? `
            <div class="lock-info">
                <strong>🔒 Locked by:</strong> ${port.lock.developer_name}<br>
                <strong>📅 Since:</strong> ${new Date(port.lock.locked_at).toLocaleDateString()}
            </div>
        ` : '';
        const actions = port.lock ? `
            <button class="btn btn-danger" onclick="window.coordinator.unlockPort(${port.id})">
                🔓 Unlock Port
            </button>
        ` : `
            <button class="btn btn-primary" onclick="window.coordinator.showLockModal(${port.id})">
                🔒 Lock Port
            </button>
        `;
        card.innerHTML = `
            <div class="port-header">
                <div class="port-name">${port.name}</div>
                <div class="port-status status-${port.lock ? 'locked' : 'available'}">
                    ${port.lock ? '🔒 Locked' : '✅ Available'}
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
    renderTable() {
        const tbody = document.querySelector('#ports-table tbody');
        if (!tbody)
            return;
        const { paginatedPorts } = this.stateManager.getState();
        tbody.innerHTML = '';
        if (paginatedPorts.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="empty-table">
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <p>No ports to display</p>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        paginatedPorts.forEach(port => {
            const row = this.createPortTableRow(port);
            tbody.appendChild(row);
        });
    }
    createPortTableRow(port) {
        const row = document.createElement('tr');
        const action = port.lock ?
            `<button class="btn btn-danger" onclick="window.coordinator.unlockPort(${port.id})">🔓 Unlock</button>` :
            `<button class="btn btn-primary" onclick="window.coordinator.showLockModal(${port.id})">🔒 Lock</button>`;
        row.innerHTML = `
            <td><code>${port.name}</code></td>
            <td>${port.category}</td>
            <td>${port.description}</td>
            <td>
                <span class="status-badge status-${port.lock ? 'locked' : 'available'}">
                    ${port.lock ? '🔒 Locked' : '✅ Available'}
                </span>
            </td>
            <td>${action}</td>
        `;
        return row;
    }
    updatePagination() {
        const { pagination } = this.stateManager.getState();
        const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (pageInfo)
            pageInfo.textContent = `Page ${pagination.page} of ${totalPages}`;
        if (prevBtn)
            prevBtn.disabled = pagination.page <= 1;
        if (nextBtn)
            nextBtn.disabled = pagination.page >= totalPages;
    }
    updateStats() {
        const stats = this.portManager.getStats();
        const totalEl = document.getElementById('total-ports');
        const lockedEl = document.getElementById('locked-ports');
        const availableEl = document.getElementById('available-ports');
        if (totalEl)
            totalEl.textContent = String(stats.total);
        if (lockedEl)
            lockedEl.textContent = String(stats.locked);
        if (availableEl)
            availableEl.textContent = String(stats.available);
    }
    showLockModal(portId) {
        const portIdInput = document.getElementById('port-id');
        const modal = document.getElementById('lock-modal');
        if (portIdInput)
            portIdInput.value = String(portId);
        if (modal)
            modal.style.display = 'block';
        this.updateUserDropdown();
    }
    hideModal() {
        const modal = document.getElementById('lock-modal');
        const form = document.getElementById('lock-form');
        if (modal)
            modal.style.display = 'none';
        if (form)
            form.reset();
    }
    handleLockSubmission() {
        return __awaiter(this, void 0, void 0, function* () {
            const portIdInput = document.getElementById('port-id');
            const userSelect = document.getElementById('user-select');
            if (!portIdInput || !userSelect)
                return;
            const portId = parseInt(portIdInput.value);
            const username = userSelect.value;
            if (!username) {
                this.notifications.error('Please select a user');
                return;
            }
            try {
                yield this.portManager.lockPort(portId, username);
                this.hideModal();
                this.notifications.success('Port locked successfully! 🎉');
            }
            catch (error) {
                this.notifications.error(`Failed to lock port: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    switchToTableView() {
        const portsGrid = document.getElementById('ports-grid');
        const tableSection = document.getElementById('ports-table-section');
        if (portsGrid)
            portsGrid.style.display = 'none';
        if (tableSection)
            tableSection.style.display = 'block';
        this.portManager.loadPaginatedPorts();
    }
    switchToCardView() {
        const tableSection = document.getElementById('ports-table-section');
        const portsGrid = document.getElementById('ports-grid');
        if (tableSection)
            tableSection.style.display = 'none';
        if (portsGrid)
            portsGrid.style.display = 'grid';
    }
}
