interface PortLock {
    developer_name: string;
    locked_at: string;
}

interface Port {
    id: number;
    name: string;
    category: string;
    description: string;
    lock?: PortLock | null;
}

class PortsCoordinator {
    ports: Port[] = [];
    categories: Set<string> = new Set();
    paginatedPorts: Port[] = [];
    tableLimit: number = 20;
    tablePage: number = 1;
    tableTotal: number = 0;

    constructor() {
        this.init();
    }

    async init(): Promise<void> {
        await this.loadPorts();
        await this.loadPaginatedPorts();
        this.setupEventListeners();
        this.renderPorts();
        this.updateStats();
        this.setupAutoRefresh();
    }

    async loadPorts(): Promise<void> {
        try {
            const response = await fetch('/api/v1/ports');
            this.ports = await response.json();
            
            // Extract categories
            this.categories.clear();
            this.ports.forEach(port => {
                if (port.category) {
                    this.categories.add(port.category);
                }
            });
            
            this.updateCategoryFilter();
        } catch (error) {
            console.error('Failed to load ports:', error);
        }
    }

    async loadPaginatedPorts(page: number = this.tablePage): Promise<void> {
        try {
            const response = await fetch(`/api/v1/ports_paginated?page=${page}&limit=${this.tableLimit}`);
            const data = await response.json();
            this.paginatedPorts = data.ports;
            this.tableTotal = data.total;
            this.tablePage = page;
            this.renderTable();
            this.updatePagination();
        } catch (error) {
            console.error('Failed to load paginated ports:', error);
        }
    }

    setupEventListeners(): void {
        // Search functionality
        (document.getElementById('search') as HTMLInputElement).addEventListener('input', () => {
            this.renderPorts();
        });

        // Filter functionality
        (document.getElementById('category-filter') as HTMLSelectElement).addEventListener('change', () => {
            this.renderPorts();
        });

        (document.getElementById('status-filter') as HTMLSelectElement).addEventListener('change', () => {
            this.renderPorts();
        });

        // Modal functionality
        const modal = document.getElementById('lock-modal') as HTMLElement;
        const closeBtn = document.getElementsByClassName('close')[0] as HTMLElement;
        
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        window.onclick = (event: MouseEvent) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };

        // Lock form submission
        (document.getElementById('lock-form') as HTMLFormElement).addEventListener('submit', (e) => {
            e.preventDefault();
            this.lockPort();
        });

        (document.getElementById('table-view-btn') as HTMLElement).addEventListener('click', () => {
            (document.getElementById('ports-grid') as HTMLElement).style.display = 'none';
            (document.getElementById('ports-table-section') as HTMLElement).style.display = 'block';
            this.loadPaginatedPorts();
        });

        (document.getElementById('card-view-btn') as HTMLElement).addEventListener('click', () => {
            (document.getElementById('ports-table-section') as HTMLElement).style.display = 'none';
            (document.getElementById('ports-grid') as HTMLElement).style.display = 'grid';
        });

        (document.getElementById('prev-page') as HTMLButtonElement).addEventListener('click', () => {
            if (this.tablePage > 1) {
                this.loadPaginatedPorts(this.tablePage - 1);
            }
        });

        (document.getElementById('next-page') as HTMLButtonElement).addEventListener('click', () => {
            const totalPages = Math.ceil(this.tableTotal / this.tableLimit);
            if (this.tablePage < totalPages) {
                this.loadPaginatedPorts(this.tablePage + 1);
            }
        });
    }

    updateCategoryFilter(): void {
        const select = document.getElementById('category-filter') as HTMLSelectElement;
        select.innerHTML = '<option value="">All Categories</option>';
        
        [...this.categories].sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    renderPorts(): void {
        const searchTerm = (document.getElementById('search') as HTMLInputElement).value.toLowerCase();
        const categoryFilter = (document.getElementById('category-filter') as HTMLSelectElement).value;
        const statusFilter = (document.getElementById('status-filter') as HTMLSelectElement).value;

        const filteredPorts = this.ports.filter(port => {
            const matchesSearch = port.name.toLowerCase().includes(searchTerm) ||
                                port.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || port.category === categoryFilter;
            const matchesStatus = !statusFilter || 
                                (statusFilter === 'locked' && port.lock) ||
                                (statusFilter === 'available' && !port.lock);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        const grid = document.getElementById('ports-grid') as HTMLElement;
        grid.innerHTML = '';

        filteredPorts.forEach(port => {
            const portCard = this.createPortCard(port);
            grid.appendChild(portCard);
        });
    }

    createPortCard(port: Port): HTMLElement {
        const card = document.createElement('div');
        card.className = `port-card ${port.lock ? 'locked' : 'available'}`;

        const lockInfo = port.lock ? `
            <div class="lock-info">
                <strong>Locked by:</strong> ${port.lock.developer_name}<br>
                <strong>Since:</strong> ${new Date(port.lock.locked_at).toLocaleDateString()}
            </div>
        ` : '';

        const actions = port.lock ? `
            <button class="btn btn-secondary" onclick="coordinator.unlockPort(${port.id})">
                Unlock Port
            </button>
        ` : `
            <button class="btn btn-primary" onclick="coordinator.showLockModal(${port.id})">
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

    createPortTableRow(port: Port): HTMLTableRowElement {
        const row = document.createElement('tr');
        const action = port.lock ?
            `<button class="btn btn-secondary" onclick="coordinator.unlockPort(${port.id})">Unlock</button>` :
            `<button class="btn btn-primary" onclick="coordinator.showLockModal(${port.id})">Lock</button>`;
        row.innerHTML = `
            <td>${port.name}</td>
            <td>${port.category}</td>
            <td>${port.description}</td>
            <td>${port.lock ? 'Locked' : 'Available'}</td>
            <td>${action}</td>
        `;
        return row;
    }

    renderTable(): void {
        const tbody = document.querySelector('#ports-table tbody') as HTMLTableSectionElement;
        tbody.innerHTML = '';
        this.paginatedPorts.forEach(port => {
            const row = this.createPortTableRow(port);
            tbody.appendChild(row);
        });
    }

    updatePagination(): void {
        const totalPages = Math.ceil(this.tableTotal / this.tableLimit) || 1;
        (document.getElementById('page-info') as HTMLElement).textContent = `${this.tablePage} / ${totalPages}`;
        (document.getElementById('prev-page') as HTMLButtonElement).disabled = this.tablePage <= 1;
        (document.getElementById('next-page') as HTMLButtonElement).disabled = this.tablePage >= totalPages;
    }

    updateStats(): void {
        const totalPorts = this.ports.length;
        const lockedPorts = this.ports.filter(port => port.lock).length;
        const availablePorts = totalPorts - lockedPorts;

        (document.getElementById('total-ports') as HTMLElement).textContent = String(totalPorts);
        (document.getElementById('locked-ports') as HTMLElement).textContent = String(lockedPorts);
        (document.getElementById('available-ports') as HTMLElement).textContent = String(availablePorts);
    }

    showLockModal(portId: number): void {
        (document.getElementById('port-id') as HTMLInputElement).value = String(portId);
        (document.getElementById('lock-modal') as HTMLElement).style.display = 'block';
    }

    async lockPort(): Promise<void> {
        const portId = (document.getElementById('port-id') as HTMLInputElement).value;
        const developerName = (document.getElementById('developer-name') as HTMLInputElement).value;
        const developerId = (document.getElementById('developer-id') as HTMLInputElement).value;

        try {
            const formData = new FormData();
            formData.append('developer_name', developerName);
            formData.append('developer_id', developerId);

            const response = await fetch(`/api/v1/ports/${portId}/lock`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                (document.getElementById('lock-modal') as HTMLElement).style.display = 'none';
                (document.getElementById('lock-form') as HTMLFormElement).reset();
                await this.loadPorts();
                this.renderPorts();
                this.updateStats();
                alert('Port locked successfully!');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Failed to lock port:', error);
            alert('Failed to lock port. Please try again.');
        }
    }

    async unlockPort(portId: number): Promise<void> {
        if (!confirm('Are you sure you want to unlock this port?')) {
            return;
        }

        try {
            const response = await fetch(`/api/v1/ports/${portId}/lock`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadPorts();
                this.renderPorts();
                this.updateStats();
                alert('Port unlocked successfully!');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Failed to unlock port:', error);
            alert('Failed to unlock port. Please try again.');
        }
    }

    setupAutoRefresh(): void {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadPorts().then(() => {
                this.renderPorts();
                this.updateStats();
            });
            if ((document.getElementById('ports-table-section') as HTMLElement).style.display !== 'none') {
                this.loadPaginatedPorts();
            }
        }, 30000);
    }
}

// Initialize the application
const coordinator: PortsCoordinator = new PortsCoordinator();
