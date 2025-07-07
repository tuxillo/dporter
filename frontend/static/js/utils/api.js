var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class APIClient {
    constructor() {
        this.baseURL = '/api/v1';
    }
    get(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseURL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        });
    }
    post(endpoint, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                body: data instanceof FormData ? data : JSON.stringify(data),
                headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        });
    }
    delete(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        });
    }
    // Specific API methods
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('/users');
        });
    }
    getPorts() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('/ports');
        });
    }
    getPaginatedPorts(page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get(`/ports_paginated?page=${page}&limit=${limit}`);
        });
    }
    lockPort(portId, username, developerName) {
        return __awaiter(this, void 0, void 0, function* () {
            const formData = new FormData();
            formData.append('developer_name', developerName);
            formData.append('developer_id', username);
            return this.post(`/ports/${portId}/lock`, formData);
        });
    }
    unlockPort(portId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.delete(`/ports/${portId}/lock`);
        });
    }
}
