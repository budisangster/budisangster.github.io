// Messages Management
class MessagesManager {
    constructor() {
        this.messages = this.loadFromLocalStorage() || [];
        this.pageSize = 3;
        this.currentPage = 1;
        this.setupStorageListener();
        // Make manager globally accessible
        window.messagesManager = this;
    }

    setupStorageListener() {
        // Listen for localStorage changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'messages') {
                this.messages = JSON.parse(e.newValue) || [];
                this.currentPage = 1; // Reset to first page
                if (window.messageUI) {
                    window.messageUI.updateMessageCount();
                    window.messageUI.displayMessages();
                    if (!window.messageUI.isMessagesVisible) {
                        window.messageUI.showNewMessageNotification();
                    }
                }
            }
        });
    }

    loadFromLocalStorage() {
        try {
            const messages = localStorage.getItem('messages');
            return messages ? JSON.parse(messages) : null;
        } catch (error) {
            console.error('Error loading messages:', error);
            return null;
        }
    }

    formatTime(timestamp) {
        const now = new Date().getTime();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }

    getPagedMessages() {
        // Get fresh messages from localStorage
        const freshMessages = this.loadFromLocalStorage() || this.messages;
        this.messages = freshMessages || [];

        // Format times for display
        const displayMessages = this.messages.map(msg => ({
            ...msg,
            time: this.formatTime(msg.timestamp)
        }));
        
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return displayMessages.slice(start, end);
    }

    hasMoreMessages() {
        return this.currentPage * this.pageSize < this.messages.length;
    }

    loadMoreMessages() {
        if (this.hasMoreMessages()) {
            this.currentPage++;
            return this.getPagedMessages();
        }
        return [];
    }

    hasNewMessages() {
        const freshMessages = this.loadFromLocalStorage();
        if (!freshMessages) return false;
        
        // Compare lengths first
        if (freshMessages.length > this.messages.length) return true;
        
        // Compare latest message timestamps
        if (freshMessages[0]?.timestamp > (this.messages[0]?.timestamp || 0)) return true;
        
        return false;
    }
}

// Message UI Management
class MessageUI {
    constructor(messagesManager) {
        this.manager = messagesManager;
        this.isMessagesVisible = false;
        this.setupElements();
        this.setupEventListeners();
        this.updateMessageCount();
        this.startAutoUpdate();
        this.checkShowMessages();
        // Make messageUI globally accessible
        window.messageUI = this;
    }

    checkShowMessages() {
        const shouldShow = localStorage.getItem('showMessages');
        if (shouldShow === 'true' && !this.isMessagesVisible) {
            setTimeout(() => {
                this.toggleMessages();
                localStorage.removeItem('showMessages');
            }, 500);
        }
    }

    setupElements() {
        this.messagesToggle = document.querySelector('.messages-toggle');
        this.floatingMessages = document.querySelector('.floating-messages');
        this.messageCount = document.querySelector('.message-count');
        this.noMessages = document.querySelector('.no-messages');
        this.loadMoreButton = document.createElement('div');
        this.loadMoreButton.className = 'load-more-messages';
        this.loadMoreButton.innerHTML = 'Load More Messages';
        this.loadMoreButton.style.display = 'none';
    }

    setupEventListeners() {
        if (!this.messagesToggle) return;

        this.messagesToggle.addEventListener('click', () => this.toggleMessages());
        this.loadMoreButton.addEventListener('click', () => this.loadMore());
        
        document.addEventListener('click', (e) => {
            if (this.isMessagesVisible && 
                !this.floatingMessages.contains(e.target) && 
                !this.messagesToggle.contains(e.target)) {
                this.toggleMessages();
            }
        });

        // Listen for storage changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'messages' || e.key === 'showMessages') {
                this.manager.messages = this.manager.loadFromLocalStorage() || [];
                this.updateMessageCount();
                if (this.isMessagesVisible) {
                    this.displayMessages();
                }
                if (e.key === 'showMessages' && e.newValue === 'true') {
                    this.toggleMessages();
                    localStorage.removeItem('showMessages');
                }
            }
        });
    }

    startAutoUpdate() {
        // Check for new messages every 5 seconds
        setInterval(() => {
            if (this.manager.hasNewMessages()) {
                this.updateMessageCount();
                if (this.isMessagesVisible) {
                    this.displayMessages();
                } else {
                    this.showNewMessageNotification();
                }
            }
        }, 5000);

        // Update message times every minute
        setInterval(() => {
            if (this.isMessagesVisible) {
                this.displayMessages();
            }
        }, 60000);
    }

    handleNewMessage(messageData) {
        this.manager.messages = this.manager.loadFromLocalStorage() || [];
        this.updateMessageCount();
        this.showNewMessageNotification();
        if (this.isMessagesVisible) {
            this.displayMessages();
        }
    }

    showNewMessageNotification() {
        if (!this.messageCount) return;
        this.messageCount.style.display = 'flex';
        this.messageCount.classList.add('pulse');
        setTimeout(() => {
            this.messageCount.classList.remove('pulse');
        }, 1000);
    }

    createMessageBubble(message) {
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = `
            <div class="message-type-tag">${message.type.toUpperCase()}</div>
            <div class="message-content">${message.content}</div>
            <div class="message-time">${message.time}</div>
        `;
        return bubble;
    }

    toggleMessages() {
        if (!this.floatingMessages) return;
        
        this.isMessagesVisible = !this.isMessagesVisible;
        this.floatingMessages.style.display = this.isMessagesVisible ? 'block' : 'none';
        
        if (this.isMessagesVisible) {
            this.manager.messages = this.manager.loadFromLocalStorage() || [];
            this.displayMessages();
            if (this.messageCount) {
                this.messageCount.style.display = 'none';
            }
        }
    }

    displayMessages() {
        if (!this.floatingMessages || !this.noMessages) return;
        
        this.floatingMessages.innerHTML = '';
        const messages = this.manager.getPagedMessages();
        
        if (messages.length === 0) {
            this.noMessages.style.display = 'block';
            this.floatingMessages.appendChild(this.noMessages);
            return;
        }

        this.noMessages.style.display = 'none';
        messages.forEach((message, index) => {
            const bubble = this.createMessageBubble(message);
            this.floatingMessages.appendChild(bubble);
            setTimeout(() => {
                bubble.classList.add('show');
            }, index * 200);
        });

        if (this.manager.hasMoreMessages()) {
            this.floatingMessages.appendChild(this.loadMoreButton);
            this.loadMoreButton.style.display = 'block';
        } else {
            this.loadMoreButton.style.display = 'none';
        }
    }

    loadMore() {
        const newMessages = this.manager.loadMoreMessages();
        newMessages.forEach((message, index) => {
            const bubble = this.createMessageBubble(message);
            bubble.style.opacity = '0';
            this.floatingMessages.insertBefore(bubble, this.loadMoreButton);
            setTimeout(() => {
                bubble.classList.add('show');
            }, index * 200);
        });

        if (!this.manager.hasMoreMessages()) {
            this.loadMoreButton.style.display = 'none';
        }
    }

    updateMessageCount() {
        if (!this.messageCount) return;
        const count = this.manager.messages.length;
        this.messageCount.textContent = count;
        this.messageCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const messagesManager = new MessagesManager();
    const messageUI = new MessageUI(messagesManager);
}); 