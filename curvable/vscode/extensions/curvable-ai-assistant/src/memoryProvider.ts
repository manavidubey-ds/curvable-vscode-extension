import * as vscode from 'vscode';
import { IntentManager, Intent } from './intentManager';

export class CurvableAIMemoryProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'curvable-ai-memory';

    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _intentManager: IntentManager;

    constructor(extensionUri: vscode.Uri, intentManager: IntentManager) {
        this._extensionUri = extensionUri;
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
                case 'setIntent':
                    await this._intentManager.setCurrentIntent(data.description);
                    this._updateView();
                    break;
                case 'updateProgress':
                    await this._intentManager.updateIntentProgress(data.intentId, data.progress);
                    this._updateView();
                    break;
                case 'completeIntent':
                    await this._intentManager.completeIntent(data.intentId);
                    this._updateView();
                    break;
                case 'deleteIntent':
                    await this._intentManager.deleteIntent(data.intentId);
                    this._updateView();
                    break;
                case 'getIntents':
                    this._updateView();
                    break;
            }
        });

        // Initial update
        this._updateView();
    }

    private _updateView() {
        if (!this._view) {
            return;
        }

        const currentIntent = this._intentManager.getCurrentIntent();
        const intentHistory = this._intentManager.getIntentHistory();

        this._view.webview.postMessage({
            type: 'updateIntents',
            currentIntent: currentIntent,
            intentHistory: intentHistory
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Memory & Intent</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        margin: 0;
                        padding: 10px;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }

                    .section {
                        margin-bottom: 20px;
                    }

                    .section-title {
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: var(--vscode-foreground);
                    }

                    .intent-form {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 15px;
                    }

                    .intent-input {
                        flex: 1;
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: inherit;
                    }

                    .intent-button {
                        padding: 8px 16px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        white-space: nowrap;
                    }

                    .intent-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .intent-button.secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }

                    .intent-button.secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }

                    .intent-card {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        padding: 12px;
                        margin-bottom: 10px;
                    }

                    .intent-card.current {
                        border-color: var(--vscode-button-background);
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }

                    .intent-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 8px;
                    }

                    .intent-description {
                        font-weight: bold;
                        flex: 1;
                    }

                    .intent-actions {
                        display: flex;
                        gap: 4px;
                    }

                    .intent-progress {
                        margin: 8px 0;
                    }

                    .progress-bar {
                        width: 100%;
                        height: 6px;
                        background: var(--vscode-progressBar-background);
                        border-radius: 3px;
                        overflow: hidden;
                    }

                    .progress-fill {
                        height: 100%;
                        background: var(--vscode-progressBar-foreground);
                        transition: width 0.3s ease;
                    }

                    .intent-meta {
                        font-size: 12px;
                        opacity: 0.7;
                        margin-top: 8px;
                    }

                    .intent-files {
                        margin-top: 8px;
                        font-size: 12px;
                    }

                    .file-tag {
                        display: inline-block;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 3px;
                        margin: 2px;
                        font-size: 10px;
                    }

                    .empty-state {
                        text-align: center;
                        padding: 20px;
                        opacity: 0.7;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div class="section">
                    <div class="section-title">Current Intent</div>
                    <div class="intent-form">
                        <input type="text" class="intent-input" id="intent-input" placeholder="What are you working on?">
                        <button class="intent-button" id="set-intent-btn">Set Intent</button>
                    </div>
                    <div id="current-intent-display" class="empty-state">
                        No current intent set
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Intent History</div>
                    <div id="intent-history">
                        <div class="empty-state">No previous intents</div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const intentInput = document.getElementById('intent-input');
                    const setIntentBtn = document.getElementById('set-intent-btn');
                    const currentIntentDisplay = document.getElementById('current-intent-display');
                    const intentHistory = document.getElementById('intent-history');

                    function setIntent() {
                        const description = intentInput.value.trim();
                        if (description) {
                            vscode.postMessage({
                                type: 'setIntent',
                                description: description
                            });
                            intentInput.value = '';
                        }
                    }

                    function updateProgress(intentId, progress) {
                        vscode.postMessage({
                            type: 'updateProgress',
                            intentId: intentId,
                            progress: progress
                        });
                    }

                    function completeIntent(intentId) {
                        vscode.postMessage({
                            type: 'completeIntent',
                            intentId: intentId
                        });
                    }

                    function deleteIntent(intentId) {
                        vscode.postMessage({
                            type: 'deleteIntent',
                            intentId: intentId
                        });
                    }

                    function renderIntent(intent, isCurrent = false) {
                        const card = document.createElement('div');
                        card.className = \`intent-card \${isCurrent ? 'current' : ''}\`;
                        
                        const progress = intent.progress || 0;
                        const status = intent.completed ? 'Completed' : 'In Progress';
                        const timestamp = new Date(intent.timestamp).toLocaleString();

                        card.innerHTML = \`
                            <div class="intent-header">
                                <div class="intent-description">\${intent.description}</div>
                                <div class="intent-actions">
                                    \${!intent.completed ? \`
                                        <button class="intent-button secondary" onclick="completeIntent('\${intent.id}')">Complete</button>
                                    \` : ''}
                                    <button class="intent-button secondary" onclick="deleteIntent('\${intent.id}')">Delete</button>
                                </div>
                            </div>
                            <div class="intent-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: \${progress}%"></div>
                                </div>
                                <div>\${progress}% - \${status}</div>
                            </div>
                            <div class="intent-meta">Started: \${timestamp}</div>
                            \${intent.files && intent.files.length > 0 ? \`
                                <div class="intent-files">
                                    Files: \${intent.files.map(file => \`<span class="file-tag">\${file.split('/').pop()}</span>\`).join('')}
                                </div>
                            \` : ''}
                        \`;

                        return card;
                    }

                    function updateView(data) {
                        // Update current intent
                        if (data.currentIntent) {
                            currentIntentDisplay.innerHTML = '';
                            currentIntentDisplay.appendChild(renderIntent(data.currentIntent, true));
                        } else {
                            currentIntentDisplay.innerHTML = '<div class="empty-state">No current intent set</div>';
                        }

                        // Update intent history
                        if (data.intentHistory && data.intentHistory.length > 0) {
                            intentHistory.innerHTML = '';
                            data.intentHistory.forEach(intent => {
                                if (!data.currentIntent || intent.id !== data.currentIntent.id) {
                                    intentHistory.appendChild(renderIntent(intent));
                                }
                            });
                        } else {
                            intentHistory.innerHTML = '<div class="empty-state">No previous intents</div>';
                        }
                    }

                    setIntentBtn.addEventListener('click', setIntent);
                    intentInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            setIntent();
                        }
                    });

                    // Listen for messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'updateIntents':
                                updateView(message);
                                break;
                        }
                    });

                    // Request intents on load
                    vscode.postMessage({ type: 'getIntents' });
                </script>
            </body>
            </html>
        `;
    }
} 