import * as vscode from 'vscode';
import { AIService, AIResponse } from './aiService';
import { IntentManager } from './intentManager';

export class CurvableAIChatProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'curvable-ai-chat';

    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _aiService: AIService;
    private _intentManager: IntentManager;

    constructor(extensionUri: vscode.Uri, aiService: AIService, intentManager: IntentManager) {
        this._extensionUri = extensionUri;
        this._aiService = aiService;
        this._intentManager = intentManager;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this._handleMessage(data.message);
                    break;
                case 'getIntent':
                    this._sendIntent();
                    break;
                case 'clearChat':
                    this._clearChat();
                    break;
                case 'exportChat':
                    this._exportChat();
                    break;
            }
        });
    }

    private async _handleMessage(message: string) {
        if (!this._view) {
            return;
        }

        // Get current intent for context
        const currentIntent = this._intentManager.getCurrentIntent();
        const context = currentIntent ? `Current intent: ${currentIntent.description}` : undefined;

        try {
            // Show typing indicator
            this._view.webview.postMessage({
                type: 'addMessage',
                message: {
                    id: Date.now().toString(),
                    text: message,
                    sender: 'user',
                    timestamp: new Date().toISOString()
                }
            });

            // Show typing indicator for AI
            this._view.webview.postMessage({
                type: 'showTyping',
                sender: 'ai'
            });

            // Get AI response
            const response = await this._aiService.chat(message, context);

            // Hide typing indicator
            this._view.webview.postMessage({
                type: 'hideTyping'
            });

            // Send AI response
            this._view.webview.postMessage({
                type: 'addMessage',
                message: {
                    id: (Date.now() + 1).toString(),
                    text: response.content,
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    suggestions: response.suggestions,
                    confidence: response.confidence
                }
            });

            // Check if the response contains action markers and send message to webview
            const actionMarkers = [
                /\[CREATE_FILE:/,
                /\[CREATE_DIRECTORY:/,
                /\[CREATE_FOLDER:/,
                /\[DELETE_FILE:/,
                /\[DELETE_DIRECTORY:/,
                /\[MOVE_FILE:/,
                /\[COPY_FILE:/,
                /\[EDIT_FILE:/
            ];
            
            const hasActions = actionMarkers.some(marker => marker.test(response.content));
            
            if (hasActions) {
                console.log('[Chat Provider] Detected action markers in AI response');
                // Send message to webview to show execute button
                this._view.webview.postMessage({
                    type: 'showExecuteActions',
                    content: response.content
                });
            }

        } catch (error) {
            this._view.webview.postMessage({
                type: 'hideTyping'
            });
            
            this._view.webview.postMessage({
                type: 'addMessage',
                message: {
                    id: (Date.now() + 1).toString(),
                    text: `Sorry, I encountered an error: ${error}`,
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    isError: true
                }
            });
        }
    }

    private _sendIntent() {
        if (!this._view) {
            return;
        }

        const currentIntent = this._intentManager.getCurrentIntent();
        this._view.webview.postMessage({
            type: 'updateIntent',
            intent: currentIntent
        });
    }

    private _clearChat() {
        if (!this._view) {
            return;
        }

        this._view.webview.postMessage({
            type: 'clearChat'
        });
    }

    private _exportChat() {
        if (!this._view) {
            return;
        }

        this._view.webview.postMessage({
            type: 'exportChat'
        });
    }

    public sendWelcomeMessage() {
        if (!this._view) {
            return;
        }

        // Get workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders || [];
        const folderNames = workspaceFolders.map(folder => folder.name);
        const folderList = folderNames.length > 0 
            ? folderNames.join(', ') 
            : 'No workspace folders open';

        const welcomeMessage = `🎉 **Welcome to Curvable AI Assistant!**

I'm here to help you with your coding tasks. Here's what I can do for you today:

**🚀 Available Actions:**
• **Code Explanation** - Select code and I'll explain how it works
• **Code Generation** - Describe what you want and I'll generate code
• **Chat & Questions** - Ask me anything about programming
• **Learning Mode** - Get detailed explanations of concepts
• **Memory Tracking** - Keep track of your coding intents and progress

**📁 Accessible Folders:**
${folderList}

**💡 Quick Start:**
• Type your question in the chat box below
• Select code and use "Explain Code" command
• Use "Generate Code" command to create new code
• Check the Memory panel to track your progress

What would you like to work on today?`;

        this._view.webview.postMessage({
            type: 'addMessage',
            message: {
                id: 'welcome-message',
                text: welcomeMessage,
                sender: 'ai',
                timestamp: new Date().toISOString(),
                suggestions: [
                    'Explain the current file',
                    'Generate a new function',
                    'Help me debug this code',
                    'Show me the project structure'
                ]
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Curvable AI Chat</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    .chat-header {
                        padding: 12px 16px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        background: var(--vscode-editor-background);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .header-title {
                        font-weight: 600;
                        font-size: 14px;
                        color: var(--vscode-foreground);
                    }

                    .header-actions {
                        display: flex;
                        gap: 8px;
                    }

                    .header-btn {
                        background: transparent;
                        border: 1px solid var(--vscode-button-border);
                        color: var(--vscode-button-foreground);
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s ease;
                    }

                    .header-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .intent-display {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        padding: 8px 12px;
                        margin: 8px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        border-left: 3px solid var(--vscode-button-background);
                    }

                    .chat-container {
                        flex: 1;
                        overflow-y: auto;
                        padding: 0 12px;
                        scroll-behavior: smooth;
                    }

                    .message {
                        margin-bottom: 16px;
                        animation: fadeInUp 0.3s ease-out;
                    }

                    .message.user {
                        display: flex;
                        justify-content: flex-end;
                    }

                    .message.ai {
                        display: flex;
                        justify-content: flex-start;
                    }

                    .message-bubble {
                        max-width: 85%;
                        padding: 12px 16px;
                        border-radius: 18px;
                        position: relative;
                        word-wrap: break-word;
                        line-height: 1.4;
                    }

                    .message.user .message-bubble {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border-bottom-right-radius: 6px;
                    }

                    .message.ai .message-bubble {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        color: var(--vscode-editor-foreground);
                        border-bottom-left-radius: 6px;
                    }

                    .message.error .message-bubble {
                        background: var(--vscode-errorForeground);
                        color: var(--vscode-editor-background);
                    }

                    .message-timestamp {
                        font-size: 10px;
                        opacity: 0.6;
                        margin-top: 4px;
                        text-align: center;
                    }

                    .message.user .message-timestamp {
                        text-align: right;
                    }

                    .message.ai .message-timestamp {
                        text-align: left;
                    }

                    .suggestions {
                        margin-top: 8px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                    }

                    .suggestion {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: none;
                        padding: 6px 12px;
                        border-radius: 16px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                    }

                    .suggestion:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                        transform: translateY(-1px);
                    }

                    .confidence-indicator {
                        display: inline-block;
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        margin-left: 8px;
                        background: var(--vscode-debugIcon-startForeground);
                    }

                    .typing-indicator {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 12px 16px;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 18px;
                        border-bottom-left-radius: 6px;
                        max-width: 85%;
                        animation: fadeInUp 0.3s ease-out;
                    }

                    .typing-dots {
                        display: flex;
                        gap: 4px;
                    }

                    .typing-dot {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: var(--vscode-descriptionForeground);
                        animation: typing 1.4s infinite ease-in-out;
                    }

                    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                    .typing-dot:nth-child(2) { animation-delay: -0.16s; }

                    .input-container {
                        padding: 12px 16px;
                        border-top: 1px solid var(--vscode-panel-border);
                        background: var(--vscode-editor-background);
                        display: flex;
                        gap: 8px;
                        align-items: flex-end;
                    }

                    .message-input {
                        flex: 1;
                        padding: 10px 14px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 20px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: inherit;
                        font-size: 14px;
                        resize: none;
                        min-height: 40px;
                        max-height: 120px;
                        outline: none;
                        transition: border-color 0.2s ease;
                    }

                    .message-input:focus {
                        border-color: var(--vscode-focusBorder);
                    }

                    .send-button {
                        padding: 10px 16px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 20px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                        min-width: 60px;
                    }

                    .send-button:hover {
                        background: var(--vscode-button-hoverBackground);
                        transform: translateY(-1px);
                    }

                    .send-button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .empty-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 200px;
                        text-align: center;
                        opacity: 0.7;
                    }

                    .empty-state-icon {
                        font-size: 48px;
                        margin-bottom: 16px;
                        opacity: 0.5;
                    }

                    .empty-state-text {
                        font-size: 14px;
                        color: var(--vscode-descriptionForeground);
                    }

                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes typing {
                        0%, 80%, 100% {
                            transform: scale(0.8);
                            opacity: 0.5;
                        }
                        40% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }

                    .scroll-to-bottom {
                        position: fixed;
                        bottom: 80px;
                        right: 20px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        cursor: pointer;
                        display: none;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        transition: all 0.2s ease;
                    }

                    .scroll-to-bottom:hover {
                        background: var(--vscode-button-hoverBackground);
                        transform: scale(1.1);
                    }

                    .scroll-to-bottom.visible {
                        display: flex;
                    }

                    .code-actions {
                        margin-top: 12px;
                        border-top: 1px solid var(--vscode-panel-border);
                        padding-top: 12px;
                    }

                    .actions-header {
                        font-weight: 600;
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 8px;
                    }

                    .action-button {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: 1px solid var(--vscode-button-border);
                        padding: 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 13px;
                        transition: all 0.2s ease;
                        margin-bottom: 8px;
                        width: 100%;
                        text-align: left;
                    }

                    .action-button:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                        transform: translateY(-1px);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }

                    .action-icon {
                        font-size: 16px;
                        min-width: 20px;
                        text-align: center;
                    }

                    .action-content {
                        flex: 1;
                    }

                    .action-title {
                        font-weight: 600;
                        font-size: 12px;
                        color: var(--vscode-foreground);
                        margin-bottom: 2px;
                    }

                    .action-path {
                        font-family: 'Monaco', 'Menlo', monospace;
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 4px;
                    }

                    .action-description {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        line-height: 1.3;
                    }
                </style>
            </head>
            <body>
                <div class="chat-header">
                    <div class="header-title">🤖 Curvable AI Chat</div>
                    <div class="header-actions">
                        <button class="header-btn" id="analyze-code-btn">🔍 Analyze Code</button>
                        <button class="header-btn" id="clear-chat-btn">Clear</button>
                        <button class="header-btn" id="export-chat-btn">Export</button>
                    </div>
                </div>

                <div class="intent-display" id="intent-display">
                    No current intent set
                </div>
                
                <div class="chat-container" id="chat-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <div class="empty-state-text">Start a conversation with your AI assistant</div>
                    </div>
                </div>

                <button class="scroll-to-bottom" id="scroll-bottom-btn">↓</button>

                <div class="input-container">
                    <textarea 
                        class="message-input" 
                        id="message-input" 
                        placeholder="Ask me anything..."
                        rows="1"
                    ></textarea>
                    <button class="send-button" id="send-button">Send</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const chatContainer = document.getElementById('chat-container');
                    const messageInput = document.getElementById('message-input');
                    const sendButton = document.getElementById('send-button');
                    const intentDisplay = document.getElementById('intent-display');
                    const clearChatBtn = document.getElementById('clear-chat-btn');
                    const exportChatBtn = document.getElementById('export-chat-btn');
                    const analyzeCodeBtn = document.getElementById('analyze-code-btn');
                    const scrollBottomBtn = document.getElementById('scroll-bottom-btn');

                    let isTyping = false;
                    let chatHistory = [];

                    function addMessage(message) {
                        // Remove empty state if present
                        const emptyState = chatContainer.querySelector('.empty-state');
                        if (emptyState) {
                            emptyState.remove();
                        }

                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${message.sender}\`;
                        
                        const bubble = document.createElement('div');
                        bubble.className = 'message-bubble';
                        
                        const textDiv = document.createElement('div');
                        // Check if message contains markdown
                        if (message.text.includes('**') || message.text.includes('•')) {
                            textDiv.innerHTML = message.text
                                .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                                .replace(/•/g, '•')
                                .replace(/\\n/g, '<br>');
                        } else {
                            textDiv.textContent = message.text;
                        }
                        bubble.appendChild(textDiv);

                        // Add confidence indicator for AI messages
                        if (message.sender === 'ai' && message.confidence) {
                            const confidence = document.createElement('span');
                            confidence.className = 'confidence-indicator';
                            confidence.title = \`Confidence: \${Math.round(message.confidence * 100)}%\`;
                            bubble.appendChild(confidence);
                        }

                        // Add suggestions if available
                        if (message.suggestions && message.suggestions.length > 0) {
                            const suggestionsDiv = document.createElement('div');
                            suggestionsDiv.className = 'suggestions';
                            message.suggestions.forEach(suggestion => {
                                const button = document.createElement('button');
                                button.className = 'suggestion';
                                button.textContent = suggestion;
                                button.onclick = () => {
                                    messageInput.value = suggestion;
                                    sendMessage();
                                };
                                suggestionsDiv.appendChild(button);
                            });
                            bubble.appendChild(suggestionsDiv);
                        }

                        // Add code actions if available
                        if (message.actions && message.actions.length > 0) {
                            const actionsDiv = document.createElement('div');
                            actionsDiv.className = 'code-actions';
                            actionsDiv.innerHTML = '<div class="actions-header">🤖 Suggested Actions:</div>';
                            
                            message.actions.forEach(action => {
                                const actionButton = document.createElement('button');
                                actionButton.className = 'action-button';
                                actionButton.innerHTML = \`
                                    <div class="action-icon">\${getActionIcon(action.type)}</div>
                                    <div class="action-content">
                                        <div class="action-title">\${action.type.replace('_', ' ').toUpperCase()}</div>
                                        <div class="action-path">\${action.path}</div>
                                        <div class="action-description">\${action.description}</div>
                                    </div>
                                \`;
                                actionButton.onclick = () => {
                                    executeAction(action);
                                };
                                actionsDiv.appendChild(actionButton);
                            });
                            bubble.appendChild(actionsDiv);
                        }

                        const timestampDiv = document.createElement('div');
                        timestampDiv.className = 'message-timestamp';
                        timestampDiv.textContent = new Date(message.timestamp).toLocaleTimeString();
                        bubble.appendChild(timestampDiv);

                        messageDiv.appendChild(bubble);
                        chatContainer.appendChild(messageDiv);
                        
                        // Store in history
                        chatHistory.push(message);
                        
                        scrollToBottom();
                        updateScrollButton();
                    }

                    function showTyping() {
                        if (isTyping) return;
                        
                        isTyping = true;
                        const typingDiv = document.createElement('div');
                        typingDiv.className = 'typing-indicator';
                        typingDiv.id = 'typing-indicator';
                        
                        typingDiv.innerHTML = \`
                            <div class="typing-dots">
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                            </div>
                            <span>AI is typing...</span>
                        \`;
                        
                        chatContainer.appendChild(typingDiv);
                        scrollToBottom();
                    }

                    function hideTyping() {
                        isTyping = false;
                        const typingIndicator = document.getElementById('typing-indicator');
                        if (typingIndicator) {
                            typingIndicator.remove();
                        }
                    }

                    function sendMessage() {
                        const message = messageInput.value.trim();
                        if (message && !isTyping) {
                            vscode.postMessage({
                                type: 'sendMessage',
                                message: message
                            });
                            messageInput.value = '';
                            messageInput.style.height = 'auto';
                        }
                    }

                    function clearChat() {
                        chatContainer.innerHTML = \`
                            <div class="empty-state">
                                <div class="empty-state-icon">💬</div>
                                <div class="empty-state-text">Start a conversation with your AI assistant</div>
                            </div>
                        \`;
                        chatHistory = [];
                        vscode.postMessage({ type: 'clearChat' });
                    }

                    function exportChat() {
                        if (chatHistory.length === 0) return;
                        
                        const chatText = chatHistory.map(msg => {
                            const time = new Date(msg.timestamp).toLocaleString();
                            return \`[\${time}] \${msg.sender.toUpperCase()}: \${msg.text}\`;
                        }).join('\\n\\n');
                        
                        const blob = new Blob([chatText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = \`curvable-ai-chat-\${new Date().toISOString().split('T')[0]}.txt\`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }

                    function updateIntent(intent) {
                        if (intent) {
                            intentDisplay.textContent = \`Current Intent: \${intent.description}\`;
                        } else {
                            intentDisplay.textContent = 'No current intent set';
                        }
                    }

                    function scrollToBottom() {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }

                    function updateScrollButton() {
                        const isAtBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 10;
                        scrollBottomBtn.classList.toggle('visible', !isAtBottom);
                    }

                    // Event listeners
                    sendButton.addEventListener('click', sendMessage);
                    clearChatBtn.addEventListener('click', clearChat);
                    exportChatBtn.addEventListener('click', exportChat);
                    analyzeCodeBtn.addEventListener('click', analyzeSelectedCode);
                    scrollBottomBtn.addEventListener('click', scrollToBottom);

                    messageInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    });

                    messageInput.addEventListener('input', () => {
                        messageInput.style.height = 'auto';
                        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
                    });

                    chatContainer.addEventListener('scroll', updateScrollButton);

                    // Listen for messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'addMessage':
                                addMessage(message.message);
                                break;
                            case 'showTyping':
                                showTyping();
                                break;
                            case 'hideTyping':
                                hideTyping();
                                break;
                            case 'updateIntent':
                                updateIntent(message.intent);
                                break;
                            case 'clearChat':
                                clearChat();
                                break;
                        }
                    });

                    function getActionIcon(actionType) {
                        switch (actionType) {
                            case 'create_file': return '📄';
                            case 'edit_file': return '✏️';
                            case 'delete_file': return '🗑️';
                            case 'rename_file': return '🔄';
                            case 'create_folder': return '📁';
                            default: return '⚡';
                        }
                    }

                    function executeAction(action) {
                        vscode.postMessage({
                            type: 'executeAction',
                            action: action
                        });
                    }

                    function analyzeSelectedCode() {
                        vscode.postMessage({
                            type: 'analyzeSelectedCode'
                        });
                    }

                    // Request current intent on load
                    vscode.postMessage({ type: 'getIntent' });
                </script>
            </body>
            </html>
        `;
    }
} 