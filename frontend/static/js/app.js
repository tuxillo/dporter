class PortsCoordinator {
    constructor() {
        this.ports = [];
        this.categories = new Set();
        this.init();
    }

    async init() {
        await this.loadPorts();
        this.setupEventListeners();
        this.renderPorts();
        this.updateStats();
        this.setupAutoRefresh();
    }

    async loadPorts() {
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

    setupEventListeners() {
        // Search functionality
        document.getElementById('search').addEventListener('input', () => {
            this.renderPorts();
        });

        // Filter functionality
        document.getElementById('category-filter').addEventListener('change', () => {
            this.renderPorts();
        });

        document.getElementById('status-filter').addEventListener('change', () => {
            this.renderPorts();
        });

        // Modal functionality
        const modal = document.getElementById('lock-modal');
        const closeBtn = document.getElementsByClassName('close')[0];
        
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };

        // Lock form submission
        document.getElementById('lock-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.lockPort();
        });
    }

    updateCategoryFilter() {
        const select = document.getElementById('category-filter');
        select.innerHTML = '<option value="">All Categories</option>';
        
        [...this.categories].sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    renderPorts() {
        const searchTerm = document.getElementById('search').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        const filteredPorts = this.ports.filter(port => {
            const matchesSearch = port.name.toLowerCase().includes(searchTerm) ||
                                port.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || port.category === categoryFilter;
            const matchesStatus = !statusFilter || 
                                (statusFilter === 'locked' && port.lock) ||
                                (statusFilter === 'available' && !port.lock);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        const grid = document.getElementById('ports-grid');
        grid.innerHTML = '';

        filteredPorts.forEach(port => {
            const portCard = this.createPortCard(port);
            grid.appendChild(portCard);
        });
    }

    createPortCard(port) {
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

    updateStats() {
        const totalPorts = this.ports.length;
        const lockedPorts = this.ports.filter(port => port.lock).length;
        const availablePorts = totalPorts - lockedPorts;

        document.getElementById('total-ports').textContent = totalPorts;
        document.getElementById('locked-ports').textContent = lockedPorts;
        document.getElementById('available-ports').textContent = availablePorts;
    }

    showLockModal(portId) {
        document.getElementById('port-id').value = portId;
        document.getElementById('lock-modal').style.display = 'block';
    }

    async lockPort() {
        const portId = document.getElementById('port-id').value;
        const developerName = document.getElementById('developer-name').value;
        const developerId = document.getElementById('developer-id').value;

        try {
            const formData = new FormData();
            formData.append('developer_name', developerName);
            formData.append('developer_id', developerId);

            const response = await fetch(`/api/v1/ports/${portId}/lock`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                document.getElementById('lock-modal').style.display = 'none';
                document.getElementById('lock-form').reset();
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

    async unlockPort(portId) {
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

    setupAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadPorts().then(() => {
                this.renderPorts();
                this.updateStats();
            });
        }, 30000);
    }
}

// Initialize the application
const coordinator = new PortsCoordinator();
