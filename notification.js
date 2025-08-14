// Notification system for Chrome extension
// Check if already initialized to prevent conflicts
if (typeof window.extensionNotifications === 'undefined') {
    class NotificationSystem {
        constructor() {
            this.container = null;
            this.init();
        }

    init() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('extension-notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'extension-notification-container';
            this.container.className = 'notification-container';
            
            // Apply inline styles to ensure proper positioning
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                max-width: 400px;
                width: 90%;
                pointer-events: none;
            `;
            
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('extension-notification-container');
        }
    }

    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            showClose = true
        } = options;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Apply inline styles to ensure proper appearance
        notification.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
            margin-bottom: 10px;
            padding: 16px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            transform: translateY(-100px);
            opacity: 0;
            transition: all 0.3s ease;
            border-left: 4px solid #3b82f6;
            pointer-events: auto;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <div class="notification-icon" style="flex-shrink: 0; width: 20px; height: 20px; color: #6b7280;">
                ${icon}
            </div>
            <div class="notification-content" style="flex: 1; min-width: 0;">
                ${title ? `<div class="notification-title" style="font-weight: 600; color: #1f2937; margin-bottom: 2px;">${title}</div>` : ''}
                ${message ? `<div class="notification-message" style="color: #6b7280; font-size: 14px;">${message}</div>` : ''}
            </div>
            ${showClose ? '<button class="notification-close" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;" onclick="this.parentElement.remove()">×</button>' : ''}
        `;

        this.container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    remove(notification) {
        notification.style.transform = 'translateY(-100px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }

    getIcon(type) {
        const icons = {
            success: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
            error: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
            warning: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            info: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    success(title, message, duration = 5000) {
        return this.show({ type: 'success', title, message, duration });
    }

    error(title, message, duration = 5000) {
        return this.show({ type: 'error', title, message, duration });
    }

    warning(title, message, duration = 5000) {
        return this.show({ type: 'warning', title, message, duration });
    }

    info(title, message, duration = 5000) {
        return this.show({ type: 'info', title, message, duration });
    }
}

// Initialize notification system
window.extensionNotifications = new NotificationSystem();
} 