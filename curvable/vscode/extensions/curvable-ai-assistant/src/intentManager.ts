import * as vscode from 'vscode';

export interface Intent {
    id: string;
    description: string;
    timestamp: number;
    files?: string[];
    progress?: number;
    completed?: boolean;
}

export class IntentManager {
    private context: vscode.ExtensionContext;
    private currentIntent: Intent | null = null;
    private intentHistory: Intent[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadIntents();
    }

    async setCurrentIntent(description: string): Promise<void> {
        const intent: Intent = {
            id: this.generateIntentId(),
            description,
            timestamp: Date.now(),
            progress: 0,
            completed: false
        };

        this.currentIntent = intent;
        this.intentHistory.unshift(intent);
        
        // Keep only last 10 intents
        if (this.intentHistory.length > 10) {
            this.intentHistory = this.intentHistory.slice(0, 10);
        }

        await this.saveIntents();
    }

    getCurrentIntent(): Intent | null {
        return this.currentIntent;
    }

    getIntentHistory(): Intent[] {
        return this.intentHistory;
    }

    async updateIntentProgress(intentId: string, progress: number): Promise<void> {
        const intent = this.intentHistory.find(i => i.id === intentId);
        if (intent) {
            intent.progress = Math.min(100, Math.max(0, progress));
            if (intent.progress === 100) {
                intent.completed = true;
            }
            await this.saveIntents();
        }
    }

    async addFileToIntent(intentId: string, filePath: string): Promise<void> {
        const intent = this.intentHistory.find(i => i.id === intentId);
        if (intent) {
            if (!intent.files) {
                intent.files = [];
            }
            if (!intent.files.includes(filePath)) {
                intent.files.push(filePath);
                await this.saveIntents();
            }
        }
    }

    async completeIntent(intentId: string): Promise<void> {
        const intent = this.intentHistory.find(i => i.id === intentId);
        if (intent) {
            intent.completed = true;
            intent.progress = 100;
            await this.saveIntents();
        }
    }

    async deleteIntent(intentId: string): Promise<void> {
        this.intentHistory = this.intentHistory.filter(i => i.id !== intentId);
        if (this.currentIntent?.id === intentId) {
            this.currentIntent = null;
        }
        await this.saveIntents();
    }

    getIntentSummary(): string {
        if (!this.currentIntent) {
            return 'No current intent set';
        }

        const progress = this.currentIntent.progress || 0;
        const status = this.currentIntent.completed ? 'Completed' : 'In Progress';
        
        return `Current Intent: ${this.currentIntent.description}
Progress: ${progress}%
Status: ${status}
Started: ${new Date(this.currentIntent.timestamp).toLocaleString()}`;
    }

    private generateIntentId(): string {
        return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async saveIntents(): Promise<void> {
        try {
            await this.context.globalState.update('curvable-ai-intents', {
                currentIntent: this.currentIntent,
                intentHistory: this.intentHistory
            });
        } catch (error) {
            console.error('Failed to save intents:', error);
        }
    }

    private async loadIntents(): Promise<void> {
        try {
            const saved = this.context.globalState.get('curvable-ai-intents') as any;
            if (saved) {
                this.currentIntent = saved.currentIntent || null;
                this.intentHistory = saved.intentHistory || [];
            }
        } catch (error) {
            console.error('Failed to load intents:', error);
        }
    }
} 