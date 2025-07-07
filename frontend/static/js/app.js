"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class PortsCoordinator {
    constructor() {
        this.ports = [];
        this.categories = new Set();
        this.paginatedPorts = [];
        this.tableLimit = 20;
        this.tablePage = 1;
        this.tableTotal = 0;
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadPorts();
            yield this.loadPaginatedPorts();
            this.setupEventListeners();
            this.renderPorts();
            this.updateStats();
            this.setupAutoRefresh();
        });
    }
    loadPorts() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/v1/ports');
                this.ports = yield response.json();
                // Extract categories
                this.categories.clear();
                this.ports.forEach(port => {
                    if (port.category) {
                        this.categories.add(port.category);
                    }
                });
                this.updateCategoryFilter();
            }
            catch (error) {
                console.error('Failed to load ports:', error);
            }
        });
    }
    loadPaginatedPorts() {
        return __awaiter(this, arguments, void 0, function* (page = this.tablePage) {
            try {
                const response = yield fetch(`/api/v1/ports_paginated?page=${page}&limit=${this.tableLimit}`);
                const data = yield response.json();
                this.paginatedPorts = data.ports;
                this.tableTotal = data.total;
                this.tablePage = page;
                this.renderTable();
                this.updatePagination();
            }
            catch (error) {
                console.error('Failed to load paginated ports:', error);
            }
        });
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
        document.getElementById('table-view-btn').addEventListener('click', () => {
            document.getElementById('ports-grid').style.display = 'none';
            document.getElementById('ports-table-section').style.display = 'block';
            this.loadPaginatedPorts();
        });
        document.getElementById('card-view-btn').addEventListener('click', () => {
            document.getElementById('ports-table-section').style.display = 'none';
            document.getElementById('ports-grid').style.display = 'grid';
        });
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.tablePage > 1) {
                this.loadPaginatedPorts(this.tablePage - 1);
            }
        });
        document.getElementById('next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(this.tableTotal / this.tableLimit);
            if (this.tablePage < totalPages) {
                this.loadPaginatedPorts(this.tablePage + 1);
            }
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
    createPortTableRow(port) {
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
    renderTable() {
        const tbody = document.querySelector('#ports-table tbody');
        tbody.innerHTML = '';
        this.paginatedPorts.forEach(port => {
            const row = this.createPortTableRow(port);
            tbody.appendChild(row);
        });
    }
    updatePagination() {
        const totalPages = Math.ceil(this.tableTotal / this.tableLimit) || 1;
        document.getElementById('page-info').textContent = `${this.tablePage} / ${totalPages}`;
        document.getElementById('prev-page').disabled = this.tablePage <= 1;
        document.getElementById('next-page').disabled = this.tablePage >= totalPages;
    }
    updateStats() {
        const totalPorts = this.ports.length;
        const lockedPorts = this.ports.filter(port => port.lock).length;
        const availablePorts = totalPorts - lockedPorts;
        document.getElementById('total-ports').textContent = String(totalPorts);
        document.getElementById('locked-ports').textContent = String(lockedPorts);
        document.getElementById('available-ports').textContent = String(availablePorts);
    }
    showLockModal(portId) {
        document.getElementById('port-id').value = String(portId);
        document.getElementById('lock-modal').style.display = 'block';
    }
    lockPort() {
        return __awaiter(this, void 0, void 0, function* () {
            const portId = document.getElementById('port-id').value;
            const developerName = document.getElementById('developer-name').value;
            const developerId = document.getElementById('developer-id').value;
            try {
                const formData = new FormData();
                formData.append('developer_name', developerName);
                formData.append('developer_id', developerId);
                const response = yield fetch(`/api/v1/ports/${portId}/lock`, {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    document.getElementById('lock-modal').style.display = 'none';
                    document.getElementById('lock-form').reset();
                    yield this.loadPorts();
                    this.renderPorts();
                    this.updateStats();
                    alert('Port locked successfully!');
                }
                else {
                    const error = yield response.json();
                    alert(`Error: ${error.error}`);
                }
            }
            catch (error) {
                console.error('Failed to lock port:', error);
                alert('Failed to lock port. Please try again.');
            }
        });
    }
    unlockPort(portId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!confirm('Are you sure you want to unlock this port?')) {
                return;
            }
            try {
                const response = yield fetch(`/api/v1/ports/${portId}/lock`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    yield this.loadPorts();
                    this.renderPorts();
                    this.updateStats();
                    alert('Port unlocked successfully!');
                }
                else {
                    const error = yield response.json();
                    alert(`Error: ${error.error}`);
                }
            }
            catch (error) {
                console.error('Failed to unlock port:', error);
                alert('Failed to unlock port. Please try again.');
            }
        });
    }
    setupAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadPorts().then(() => {
                this.renderPorts();
                this.updateStats();
            });
            if (document.getElementById('ports-table-section').style.display !== 'none') {
                this.loadPaginatedPorts();
            }
        }, 30000);
    }
}
// Initialize the application
const coordinator = new PortsCoordinator();
