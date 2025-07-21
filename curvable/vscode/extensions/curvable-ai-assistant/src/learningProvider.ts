import * as vscode from 'vscode';
import { AIService } from './aiService';

export class CurvableAILearningProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'curvable-ai-learning';

    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _aiService: AIService;

    constructor(extensionUri: vscode.Uri, aiService: AIService) {
        this._extensionUri = extensionUri;
        this._aiService = aiService;
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
                case 'explainConcept':
                    await this._explainConcept(data.concept, data.context);
                    break;
                case 'getLearningPath':
                    await this._getLearningPath(data.topic);
                    break;
                case 'toggleLearningMode':
                    this._toggleLearningMode();
                    break;
            }
        });
    }

    private async _explainConcept(concept: string, context?: string) {
        if (!this._view) {
            return;
        }

        try {
            const explanation = await this._aiService.explainCode(concept, 'text');
            
            this._view.webview.postMessage({
                type: 'addExplanation',
                explanation: {
                    concept: concept,
                    content: explanation,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            this._view.webview.postMessage({
                type: 'addExplanation',
                explanation: {
                    concept: concept,
                    content: `Failed to explain concept: ${error}`,
                    timestamp: new Date().toISOString(),
                    isError: true
                }
            });
        }
    }

    private async _getLearningPath(topic: string) {
        if (!this._view) {
            return;
        }

        try {
            // Placeholder learning path
            const learningPath = {
                topic: topic,
                steps: [
                    {
                        title: 'Understanding the Basics',
                        description: 'Learn fundamental concepts',
                        resources: ['Documentation', 'Tutorial Videos', 'Practice Exercises']
                    },
                    {
                        title: 'Hands-on Practice',
                        description: 'Apply concepts through coding',
                        resources: ['Code Examples', 'Interactive Exercises', 'Mini Projects']
                    },
                    {
                        title: 'Advanced Concepts',
                        description: 'Explore advanced features',
                        resources: ['Advanced Tutorials', 'Real-world Projects', 'Best Practices']
                    }
                ],
                estimatedTime: '2-4 weeks',
                difficulty: 'Intermediate'
            };

            this._view.webview.postMessage({
                type: 'setLearningPath',
                learningPath: learningPath
            });
        } catch (error) {
            this._view.webview.postMessage({
                type: 'setLearningPath',
                learningPath: null,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    private _toggleLearningMode() {
        const config = vscode.workspace.getConfiguration('curvable-ai');
        const currentMode = config.get('learningMode', false);
        config.update('learningMode', !currentMode, vscode.ConfigurationTarget.Global);
        
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateLearningMode',
                enabled: !currentMode
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Learning Mode</title>
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

                    .mode-toggle {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 15px;
                    }

                    .toggle-switch {
                        position: relative;
                        width: 50px;
                        height: 24px;
                        background: var(--vscode-input-border);
                        border-radius: 12px;
                        cursor: pointer;
                        transition: background 0.3s;
                    }

                    .toggle-switch.active {
                        background: var(--vscode-button-background);
                    }

                    .toggle-slider {
                        position: absolute;
                        top: 2px;
                        left: 2px;
                        width: 20px;
                        height: 20px;
                        background: white;
                        border-radius: 50%;
                        transition: transform 0.3s;
                    }

                    .toggle-switch.active .toggle-slider {
                        transform: translateX(26px);
                    }

                    .concept-form {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 15px;
                    }

                    .concept-input {
                        flex: 1;
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: inherit;
                    }

                    .concept-button {
                        padding: 8px 16px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }

                    .concept-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .explanation-card {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        padding: 12px;
                        margin-bottom: 10px;
                    }

                    .explanation-header {
                        font-weight: bold;
                        margin-bottom: 8px;
                        color: var(--vscode-foreground);
                    }

                    .explanation-content {
                        line-height: 1.5;
                        margin-bottom: 8px;
                    }

                    .explanation-timestamp {
                        font-size: 12px;
                        opacity: 0.7;
                    }

                    .learning-path {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        padding: 12px;
                    }

                    .path-step {
                        margin-bottom: 15px;
                        padding: 10px;
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                    }

                    .step-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    .step-description {
                        margin-bottom: 8px;
                        opacity: 0.8;
                    }

                    .step-resources {
                        font-size: 12px;
                        opacity: 0.7;
                    }

                    .empty-state {
                        text-align: center;
                        padding: 20px;
                        opacity: 0.7;
                        font-style: italic;
                    }

                    .status-indicator {
                        display: inline-block;
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        margin-right: 8px;
                    }

                    .status-active {
                        background: var(--vscode-debugIcon-startForeground);
                    }

                    .status-inactive {
                        background: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="section">
                    <div class="section-title">Learning Mode</div>
                    <div class="mode-toggle">
                        <div class="toggle-switch" id="learning-toggle">
                            <div class="toggle-slider"></div>
                        </div>
                        <span id="learning-status">Inactive</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Explain Concept</div>
                    <div class="concept-form">
                        <input type="text" class="concept-input" id="concept-input" placeholder="What would you like to learn about?">
                        <button class="concept-button" id="explain-btn">Explain</button>
                    </div>
                    <div id="explanations">
                        <div class="empty-state">No explanations yet</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Learning Path</div>
                    <div class="concept-form">
                        <input type="text" class="concept-input" id="topic-input" placeholder="Enter a topic to learn">
                        <button class="concept-button" id="path-btn">Get Path</button>
                    </div>
                    <div id="learning-path" class="empty-state">
                        No learning path set
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const learningToggle = document.getElementById('learning-toggle');
                    const learningStatus = document.getElementById('learning-status');
                    const conceptInput = document.getElementById('concept-input');
                    const explainBtn = document.getElementById('explain-btn');
                    const topicInput = document.getElementById('topic-input');
                    const pathBtn = document.getElementById('path-btn');
                    const explanations = document.getElementById('explanations');
                    const learningPath = document.getElementById('learning-path');

                    function toggleLearningMode() {
                        vscode.postMessage({ type: 'toggleLearningMode' });
                    }

                    function explainConcept() {
                        const concept = conceptInput.value.trim();
                        if (concept) {
                            vscode.postMessage({
                                type: 'explainConcept',
                                concept: concept
                            });
                            conceptInput.value = '';
                        }
                    }

                    function getLearningPath() {
                        const topic = topicInput.value.trim();
                        if (topic) {
                            vscode.postMessage({
                                type: 'getLearningPath',
                                topic: topic
                            });
                            topicInput.value = '';
                        }
                    }

                    function updateLearningMode(enabled) {
                        learningToggle.classList.toggle('active', enabled);
                        learningStatus.textContent = enabled ? 'Active' : 'Inactive';
                        learningStatus.innerHTML = \`
                            <span class="status-indicator \${enabled ? 'status-active' : 'status-inactive'}"></span>
                            \${enabled ? 'Active' : 'Inactive'}
                        \`;
                    }

                    function addExplanation(explanation) {
                        if (explanations.querySelector('.empty-state')) {
                            explanations.innerHTML = '';
                        }

                        const card = document.createElement('div');
                        card.className = 'explanation-card';
                        
                        const timestamp = new Date(explanation.timestamp).toLocaleString();
                        
                        card.innerHTML = \`
                            <div class="explanation-header">\${explanation.concept}</div>
                            <div class="explanation-content">\${explanation.content}</div>
                            <div class="explanation-timestamp">\${timestamp}</div>
                        \`;

                        explanations.appendChild(card);
                    }

                    function setLearningPath(path) {
                        if (!path) {
                            learningPath.innerHTML = '<div class="empty-state">No learning path set</div>';
                            return;
                        }

                        const pathDiv = document.createElement('div');
                        pathDiv.className = 'learning-path';
                        
                        let stepsHtml = '';
                        path.steps.forEach((step, index) => {
                            stepsHtml += \`
                                <div class="path-step">
                                    <div class="step-title">\${index + 1}. \${step.title}</div>
                                    <div class="step-description">\${step.description}</div>
                                    <div class="step-resources">Resources: \${step.resources.join(', ')}</div>
                                </div>
                            \`;
                        });

                        pathDiv.innerHTML = \`
                            <div style="margin-bottom: 15px;">
                                <strong>Learning Path: \${path.topic}</strong><br>
                                <small>Estimated Time: \${path.estimatedTime} | Difficulty: \${path.difficulty}</small>
                            </div>
                            \${stepsHtml}
                        \`;

                        learningPath.innerHTML = '';
                        learningPath.appendChild(pathDiv);
                    }

                    learningToggle.addEventListener('click', toggleLearningMode);
                    explainBtn.addEventListener('click', explainConcept);
                    pathBtn.addEventListener('click', getLearningPath);

                    conceptInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            explainConcept();
                        }
                    });

                    topicInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            getLearningPath();
                        }
                    });

                    // Listen for messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'addExplanation':
                                addExplanation(message.explanation);
                                break;
                            case 'setLearningPath':
                                setLearningPath(message.learningPath);
                                break;
                            case 'updateLearningMode':
                                updateLearningMode(message.enabled);
                                break;
                        }
                    });

                    // Initialize learning mode status
                    updateLearningMode(false);
                </script>
            </body>
            </html>
        `;
    }
} 