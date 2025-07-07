import { User, Port, PaginatedResponse, APIError } from '../types/index.js';

export class APIClient {
    private baseURL = '/api/v1';

    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseURL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    async post<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
            headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const error: APIError = await response.json();
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    async delete<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error: APIError = await response.json();
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    // Specific API methods
    async getUsers(): Promise<User[]> {
        return this.get<User[]>('/users');
    }

    async getPorts(): Promise<Port[]> {
        return this.get<Port[]>('/ports');
    }

    async getPaginatedPorts(page: number, limit: number): Promise<PaginatedResponse> {
        return this.get<PaginatedResponse>(`/ports_paginated?page=${page}&limit=${limit}`);
    }

    async lockPort(portId: number, username: string, developerName: string): Promise<any> {
        const formData = new FormData();
        formData.append('developer_name', developerName);
        formData.append('developer_id', username);
        return this.post(`/ports/${portId}/lock`, formData);
    }

    async unlockPort(portId: number): Promise<any> {
        return this.delete(`/ports/${portId}/lock`);
    }
}