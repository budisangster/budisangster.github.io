import { database, ref, onValue, push, set, remove } from './firebase-config.js';

// Messages Management
class MessagesManager {
    constructor() {
        this.messages = [];
        this.pageSize = 3;
        this.currentPage = 1;
        this.setupRealtimeSync();
        // Make manager globally accessible
        window.messagesManager = this;
    }

    setupRealtimeSync() {
        const messagesRef = ref(database, 'messages');
        onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            this.messages = data ? Object.values(data).sort((a, b) => b.timestamp - a.timestamp) : [];
            if (window.messageUI) {
                window.messageUI.updateMessageCount();
                if (window.messageUI.isMessagesVisible) {
                    window.messageUI.displayMessages();
                } else {
                    window.messageUI.showNewMessageNotification();
                }
            }
        });
    }

    async saveMessage(type, content) {
        try {
            const messagesRef = ref(database, 'messages');
            const newMessage = {
                type,
                content,
                timestamp: Date.now()
            };
            await push(messagesRef, newMessage);
            return true;
        } catch (error) {
            console.error('Error saving message:', error);
            return false;
        }
    }

    async replyToMessage(messageId, reply) {
        try {
            const messageRef = ref(database, `messages/${messageId}`);
            await set(messageRef, {
                ...this.messages.find(m => m.id === messageId),
                reply
            });
            return true;
        } catch (error) {
            console.error('Error replying to message:', error);
            return false;
        }
    }

    async deleteMessage(messageId) {
        try {
            const messageRef = ref(database, `messages/${messageId}`);
            await remove(messageRef);
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    }

    formatTime(timestamp) {
        const now = Date.now();
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
        this.isAdmin = false; // Set this to true when admin is logged in
        this.addStyles();
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
        const hasReply = message.reply && message.reply.trim() !== '';
        
        bubble.innerHTML = `
            <div class="message-header">
                <div class="message-type-tag">
                    <i class="fas ${this.getTypeIcon(message.type)}"></i>
                    ${message.type.toUpperCase()}
                </div>
                <div class="message-time">${message.time}</div>
            </div>
            <div class="message-content">${this.formatMessageContent(message.content)}</div>
            ${hasReply ? `
                <div class="message-reply">
                    <div class="reply-header">
                        <i class="fas fa-reply"></i> Reply from Faiz
                    </div>
                    <div class="reply-content">${this.formatMessageContent(message.reply)}</div>
                </div>
            ` : ''}
            ${this.isAdmin ? `
                <div class="admin-controls">
                    <textarea class="reply-input" placeholder="Type your reply..."></textarea>
                    <button class="reply-button" onclick="messageUI.replyToMessage('${message.timestamp}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="delete-button" onclick="messageUI.deleteMessage('${message.timestamp}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            ` : ''}
        `;
        return bubble;
    }

    getTypeIcon(type) {
        switch (type) {
            case 'Question': return 'fa-question-circle';
            case 'Confession': return 'fa-heart';
            case 'Feedback': return 'fa-comment';
            default: return 'fa-message';
        }
    }

    formatMessageContent(content) {
        // Convert URLs to clickable links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        // Convert emojis to larger size
        content = content.replace(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g, '<span class="emoji">$&</span>');
        return content;
    }

    replyToMessage(timestamp) {
        const messages = this.manager.loadFromLocalStorage() || [];
        const messageIndex = messages.findIndex(m => m.timestamp.toString() === timestamp);
        if (messageIndex === -1) return;

        const replyInput = document.querySelector(`[data-timestamp="${timestamp}"] .reply-input`);
        const reply = replyInput.value.trim();
        if (!reply) return;

        messages[messageIndex].reply = reply;
        localStorage.setItem('messages', JSON.stringify(messages));
        this.displayMessages();
    }

    deleteMessage(timestamp) {
        if (!confirm('Are you sure you want to delete this message?')) return;
        
        const messages = this.manager.loadFromLocalStorage() || [];
        const newMessages = messages.filter(m => m.timestamp.toString() !== timestamp);
        localStorage.setItem('messages', JSON.stringify(newMessages));
        this.manager.messages = newMessages;
        this.displayMessages();
        this.updateMessageCount();
    }

    // Add to your CSS in index.html
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .message-bubble {
                background: var(--modal-bg);
                padding: 20px;
                border-radius: 20px;
                margin-bottom: 15px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }

            .message-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .message-type-tag {
                color: var(--accent-color);
                font-size: 14px;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .message-type-tag i {
                font-size: 16px;
            }

            .message-content {
                color: var(--text-color);
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 15px;
            }

            .message-reply {
                background: rgba(246, 178, 47, 0.1);
                border-radius: 15px;
                padding: 15px;
                margin-top: 10px;
            }

            .reply-header {
                color: var(--accent-color);
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .reply-content {
                color: var(--text-color);
                font-size: 14px;
                line-height: 1.5;
            }

            .admin-controls {
                margin-top: 15px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .reply-input {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 10px;
                background: var(--bg-color);
                color: var(--text-color);
                font-size: 14px;
                resize: vertical;
                min-height: 60px;
            }

            .reply-button, .delete-button {
                padding: 8px 15px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: all 0.3s ease;
            }

            .reply-button {
                background: var(--accent-color);
                color: #000;
            }

            .delete-button {
                background: #ff4444;
                color: white;
            }

            .emoji {
                font-size: 1.2em;
                vertical-align: middle;
            }

            .message-time {
                font-size: 12px;
                color: var(--text-color);
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
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