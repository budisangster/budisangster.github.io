import { database, ref, onValue, push, set, remove } from './firebase-config.js';

// Messages Management
class MessagesManager {
    constructor() {
        this.messages = [];
        this.setupRealtimeSync();
        // Make manager globally accessible
        window.messagesManager = this;
    }

    setupRealtimeSync() {
        const messagesRef = ref(database, 'messages');
        onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            // Convert object to array with keys and sort by timestamp (newest first)
            this.messages = data ? Object.entries(data).map(([key, value]) => ({
                ...value,
                key
            })).sort((a, b) => b.timestamp - a.timestamp) : [];
            
            if (window.messageUI) {
                window.messageUI.updateMessageCount();
                if (window.messageUI.isMessagesVisible) {
                    // Reset to first page when new data arrives
                    this.currentPage = 1;
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
            // Find the original message
            const message = this.messages.find(m => m.key === messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Create updated message with reply
            const updatedMessage = {
                type: message.type,
                content: message.content,
                timestamp: message.timestamp,
                reply: reply
            };

            // Update in Firebase
            const messageRef = ref(database, `messages/${messageId}`);
            await set(messageRef, updatedMessage);
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
        // Return all messages with formatted time
        return this.messages.map(msg => ({
            ...msg,
            time: this.formatTime(msg.timestamp)
        }));
    }

    hasMoreMessages() {
        return false;
    }

    loadMoreMessages() {
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
        this.checkAdminStatus();
        this.addStyles();
        this.setupAdminShortcut();
        // Make messageUI globally accessible
        window.messageUI = this;
    }

    setupAdminShortcut() {
        let keys = {};
        let lastKeyTime = 0;
        const KEY_TIMEOUT = 500; // 500ms timeout for key combination

        document.addEventListener('keydown', (e) => {
            const currentTime = Date.now();
            
            // Reset keys if too much time has passed
            if (currentTime - lastKeyTime > KEY_TIMEOUT) {
                keys = {};
            }
            lastKeyTime = currentTime;

            // Store the key state
            keys[e.key.toLowerCase()] = true;

            // Only trigger if both 'a' and 'l' are pressed together
            // and we're not in a text input
            if (keys['a'] && keys['l'] && 
                !(document.activeElement.tagName === 'INPUT' || 
                  document.activeElement.tagName === 'TEXTAREA')) {
                if (!this.isAdmin) {
                    this.isAdmin = true;
                    localStorage.setItem('adminData', JSON.stringify({
                        timestamp: Date.now(),
                        level: 'Full Access'
                    }));
                    this.displayMessages();
                    alert('Admin mode activated! 👑✨');
                } else {
                    this.exitAdmin();
                }
                // Prevent default to avoid typing 'al'
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            // Remove the released key from tracking
            delete keys[e.key.toLowerCase()];
        });

        // Clear keys when window loses focus
        window.addEventListener('blur', () => {
            keys = {};
        });
    }

    checkAdminStatus() {
        // Check if admin code is stored and still valid (24 hours)
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        const now = Date.now();
        
        if (adminData.timestamp && (now - adminData.timestamp) < 24 * 60 * 60 * 1000) {
            this.isAdmin = true;
        } else {
            this.isAdmin = false;
            localStorage.removeItem('adminData');
        }
    }

    exitAdmin() {
        this.isAdmin = false;
        localStorage.removeItem('adminData');
        this.displayMessages();
        alert('Admin mode deactivated! 👋');
    }

    setupElements() {
        this.messagesToggle = document.querySelector('.messages-toggle');
        this.floatingMessages = document.querySelector('.floating-messages');
        this.messageCount = document.querySelector('.message-count');
        this.noMessages = document.querySelector('.no-messages');

        // Add admin status indicator
        this.adminIndicator = document.createElement('div');
        this.adminIndicator.className = 'admin-indicator';
        this.adminIndicator.innerHTML = `
            <div class="admin-status">
                ${this.isAdmin ? '👑 Admin Mode' : ''}
            </div>
        `;
        if (this.floatingMessages) {
            this.floatingMessages.appendChild(this.adminIndicator);
        }
    }

    setupEventListeners() {
        if (!this.messagesToggle) return;

        this.messagesToggle.addEventListener('click', () => this.toggleMessages());
        
        document.addEventListener('click', (e) => {
            if (this.isMessagesVisible && 
                !this.floatingMessages.contains(e.target) && 
                !this.messagesToggle.contains(e.target)) {
                this.toggleMessages();
            }
        });
    }

    startAutoUpdate() {
        // Update message times every minute
        setInterval(() => {
            if (this.isMessagesVisible) {
                this.displayMessages();
            }
        }, 60000);
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
        bubble.dataset.messageId = message.key;
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
                        ${this.isAdmin ? `
                            <div class="reply-actions">
                                <button onclick="window.messageUI.editReply('${message.key}')" class="edit-reply-btn">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="window.messageUI.removeReply('${message.key}')" class="remove-reply-btn">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="reply-content" id="reply-${message.key}">${this.formatMessageContent(message.reply)}</div>
                </div>
            ` : ''}
            ${this.isAdmin ? `
                <div class="admin-controls">
                    <textarea class="reply-input" placeholder="Ketik balasan disini..."></textarea>
                    <button class="reply-button" onclick="window.messageUI.replyToMessage('${message.key}')">
                        <i class="fas fa-reply"></i> Balas
                    </button>
                    <button class="delete-button" onclick="window.messageUI.deleteMessage('${message.key}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            ` : ''}
        `;
        return bubble;
    }

    getTypeIcon(type) {
        switch (type) {
            case 'Tanya Dong': return 'fa-question-circle';
            case 'Spill Tea': return 'fa-coffee';
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

    async replyToMessage(messageId) {
        try {
            // Find the message bubble by ID
            const messageBubble = document.querySelector(`[data-message-id="${messageId}"]`);
            if (!messageBubble) {
                console.error('Message bubble not found');
                return;
            }

            // Find the reply input within this message bubble
            const replyInput = messageBubble.querySelector('.reply-input');
            if (!replyInput) {
                console.error('Reply input not found');
                return;
            }

            const reply = replyInput.value.trim();
            if (!reply) {
                alert('Tulis balasan dulu dong!');
                return;
            }

            // Save the reply
            const success = await this.manager.replyToMessage(messageId, reply);
            
            if (success) {
                // Clear the input
                replyInput.value = '';
                // Show success feedback
                alert('Balasan terkirim! ✨');
            } else {
                throw new Error('Failed to save reply');
            }
        } catch (error) {
            console.error('Error replying to message:', error);
            alert('Gagal mengirim balasan. Coba lagi ya!');
        }
    }

    async deleteMessage(messageId) {
        try {
            if (!confirm('Yakin mau hapus pesan ini?')) return;
            
            await this.manager.deleteMessage(messageId);
            alert('Pesan berhasil dihapus! ✨');
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Gagal menghapus pesan. Coba lagi ya!');
        }
    }

    async editReply(messageId) {
        try {
            // Find the message
            const message = this.manager.messages.find(m => m.key === messageId);
            if (!message || !message.reply) {
                throw new Error('Reply not found');
            }

            // Prompt for new reply text
            const newReply = prompt('Edit reply:', message.reply);
            if (newReply === null) return; // User cancelled
            if (!newReply.trim()) {
                alert('Reply cannot be empty!');
                return;
            }

            // Update the message with new reply
            const updatedMessage = {
                type: message.type,
                content: message.content,
                timestamp: message.timestamp,
                reply: newReply.trim()
            };

            // Save to Firebase
            const messageRef = ref(database, `messages/${messageId}`);
            await set(messageRef, updatedMessage);
            alert('Reply updated! ✨');
        } catch (error) {
            console.error('Error editing reply:', error);
            alert('Failed to update reply. Try again!');
        }
    }

    async removeReply(messageId) {
        try {
            if (!confirm('Are you sure you want to remove this reply?')) return;

            // Find the message
            const message = this.manager.messages.find(m => m.key === messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Update message without reply
            const updatedMessage = {
                type: message.type,
                content: message.content,
                timestamp: message.timestamp
                // Omit reply field to remove it
            };

            // Save to Firebase
            const messageRef = ref(database, `messages/${messageId}`);
            await set(messageRef, updatedMessage);
            alert('Reply removed! ✨');
        } catch (error) {
            console.error('Error removing reply:', error);
            alert('Failed to remove reply. Try again!');
        }
    }

    // Add to your CSS in index.html
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .admin-indicator {
                position: sticky;
                top: 0;
                background: var(--modal-bg);
                padding: 10px;
                border-radius: 10px;
                margin-bottom: 15px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
                z-index: 2;
                text-align: center;
                font-weight: bold;
                color: var(--accent-color);
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 5px;
                transition: all 0.3s ease;
            }

            .admin-indicator:empty {
                display: none;
            }

            .message-bubble {
                background: var(--modal-bg);
                padding: 20px;
                border-radius: 20px;
                margin-bottom: 15px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }

            .admin-status {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                font-weight: bold;
                color: var(--text-color);
            }

            .admin-status button {
                background: var(--accent-color);
                color: #000;
                border: none;
                padding: 8px 15px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .admin-status button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(246, 178, 47, 0.3);
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
                background: var(--bg-color);
                border-radius: 15px;
                padding: 15px;
                margin-top: 15px;
                border-left: 4px solid var(--accent-color);
                position: relative;
            }

            .reply-header {
                color: var(--accent-color);
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 5px;
            }

            .reply-header i {
                font-size: 12px;
            }

            .reply-content {
                color: var(--text-color);
                font-size: 14px;
                line-height: 1.5;
                padding-left: 10px;
            }

            .admin-controls {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid rgba(246, 178, 47, 0.2);
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
                border: 1px solid rgba(246, 178, 47, 0.2);
                transition: all 0.3s ease;
            }

            .reply-input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 10px rgba(246, 178, 47, 0.1);
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

            .reply-actions {
                display: flex;
                gap: 5px;
            }

            .edit-reply-btn, .remove-reply-btn {
                background: none;
                border: none;
                color: var(--text-color);
                opacity: 0.6;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }

            .edit-reply-btn:hover, .remove-reply-btn:hover {
                opacity: 1;
                background: rgba(246, 178, 47, 0.1);
            }

            .remove-reply-btn:hover {
                color: #ff4444;
            }
        `;
        document.head.appendChild(style);
    }

    toggleMessages() {
        if (!this.floatingMessages) return;
        
        this.isMessagesVisible = !this.isMessagesVisible;
        this.floatingMessages.style.display = this.isMessagesVisible ? 'block' : 'none';
        
        if (this.isMessagesVisible) {
            this.displayMessages();
            if (this.messageCount) {
                this.messageCount.style.display = 'none';
            }
        }
    }

    displayMessages() {
        if (!this.floatingMessages || !this.noMessages) return;
        
        // Clear existing messages
        this.floatingMessages.innerHTML = '';

        // Add admin indicator if needed
        if (this.isAdmin) {
            this.adminIndicator.innerHTML = '<div class="admin-status">👑 Admin Mode</div>';
            this.floatingMessages.appendChild(this.adminIndicator);
        }

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
            }, index * 100);
        });
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