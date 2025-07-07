export class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1100;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        `;
        document.body.appendChild(container);
        return container;
    }
    show(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        notification.innerHTML = `${icon} ${message}`;
        this.container.appendChild(notification);
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    success(message) {
        this.show(message, 'success');
    }
    error(message) {
        this.show(message, 'error');
    }
    info(message) {
        this.show(message, 'info');
    }
}
