export interface User {
    id?: number;
    username: string;
    name: string;
    email: string;
    active: boolean;
}

export interface PortLock {
    developer_name: string;
    developer_username?: string;
    locked_at: string;
}

export interface Port {
    id: number;
    name: string;
    category: string;
    description: string;
    lock?: PortLock | null;
}

export interface PaginatedResponse {
    ports: Port[];
    total: number;
}

export interface AppState {
    users: User[];
    ports: Port[];
    categories: Set<string>;
    paginatedPorts: Port[];
    currentUser: User | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
    filters: {
        search: string;
        category: string;
        status: string;
    };
}

export interface APIError {
    error: string;
    message?: string;
}