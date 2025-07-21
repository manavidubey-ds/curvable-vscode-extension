import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface AIResponse {
    content: string;
    suggestions?: string[];
    confidence?: number;
    actions?: CodeAction[];
}

export interface CodeAction {
    type: 'CREATE_FILE' | 'CREATE_DIRECTORY' | 'DELETE_FILE' | 'DELETE_DIRECTORY' | 'MOVE_FILE' | 'COPY_FILE' | 'EDIT_FILE';
    path: string;
    content?: string;
    description: string;
    sourcePath?: string;
    destinationPath?: string;
}

export class AIService {
    private apiKey: string = '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';
    private baseUrl: string = 'https://openrouter.ai/api/v1';

    async chat(message: string, context?: string): Promise<AIResponse> {
        try {
            // Analyze the codebase context
            const codebaseContext = await this.getCodebaseContext();
            const fullContext = `${context ? context + '\n\n' : ''}${codebaseContext}`;
            
            const response = await this.callOpenRouterAPI(message, fullContext);
            
            // Parse for code actions
            const actions = this.parseCodeActions(response);
            
            return {
                content: response,
                suggestions: this.generateSuggestions(message),
                confidence: 0.95,
                actions: actions
            };
        } catch (error) {
            console.error('Error calling OpenRouter API:', error);
            return {
                content: `I'm having trouble connecting to my AI service right now. Please try again in a moment. Error: ${error}`,
                suggestions: ['Try again', 'Check your internet connection'],
                confidence: 0.1
            };
        }
    }

    async explainCode(code: string, language: string): Promise<string> {
        try {
            const prompt = `Please explain this ${language} code in a clear and concise way:

\`\`\`${language}
${code}
\`\`\`

Focus on:
1. What the code does
2. How it works
3. Any important concepts or patterns used
4. Potential improvements or considerations

Keep the explanation beginner-friendly but informative.`;

            const response = await this.callOpenRouterAPI(prompt);
            return response;
        } catch (error) {
            console.error('Error explaining code:', error);
            return `I'm having trouble analyzing this code right now. Please try again in a moment. Error: ${error}`;
        }
    }

    async generateCode(prompt: string, language: string = 'javascript'): Promise<string> {
        try {
            const codebaseContext = await this.getCodebaseContext();
            const fullPrompt = `Generate ${language} code based on this description: "${prompt}"

Current codebase context:
${codebaseContext}

Requirements:
1. Write clean, well-commented code
2. Include error handling where appropriate
3. Follow best practices for ${language}
4. Make the code reusable and maintainable
5. Consider the existing project structure and patterns
6. Include a brief explanation of what the code does

Please provide only the code without additional explanations:`;

            const response = await this.callOpenRouterAPI(fullPrompt);
            return response;
        } catch (error) {
            console.error('Error generating code:', error);
            return `// Error generating code: ${error}\n// Please try again in a moment.`;
        }
    }

    async createFile(filePath: string, content: string): Promise<string> {
        try {
            console.log(`[AI Service] Attempting to create file: ${filePath}`);
            console.log(`[AI Service] Content length: ${content.length}`);
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
            console.log(`[AI Service] Full path: ${fullPath}`);
            
            // Create directory if it doesn't exist
            const dirPath = path.dirname(fullPath);
            if (!fs.existsSync(dirPath)) {
                console.log(`[AI Service] Creating directory: ${dirPath}`);
                fs.mkdirSync(dirPath, { recursive: true });
            }
            
            console.log(`[AI Service] Writing file content...`);
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`[AI Service] File created successfully: ${filePath}`);
            
            // Try to open the file in VS Code
            try {
                const uri = vscode.Uri.file(fullPath);
                await vscode.window.showTextDocument(uri);
                console.log(`[AI Service] File opened in editor`);
            } catch (openError) {
                console.log(`[AI Service] Could not open file in editor: ${openError}`);
            }
            
            return `File ${filePath} created successfully`;
        } catch (error) {
            console.error('[AI Service] Error creating file:', error);
            throw error;
        }
    }

    async createDirectory(dirPath: string): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullPath = path.join(workspaceFolders[0].uri.fsPath, dirPath);
            
            if (fs.existsSync(fullPath)) {
                return `Directory ${dirPath} already exists`;
            }
            
            fs.mkdirSync(fullPath, { recursive: true });
            return `Directory ${dirPath} created successfully`;
        } catch (error) {
            console.error('Error creating directory:', error);
            throw error;
        }
    }

    async deleteFile(filePath: string): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
            
            if (!fs.existsSync(fullPath)) {
                throw new Error(`File ${filePath} does not exist`);
            }
            
            fs.unlinkSync(fullPath);
            return `File ${filePath} deleted successfully`;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    async deleteDirectory(dirPath: string): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullPath = path.join(workspaceFolders[0].uri.fsPath, dirPath);
            
            if (!fs.existsSync(fullPath)) {
                throw new Error(`Directory ${dirPath} does not exist`);
            }
            
            fs.rmSync(fullPath, { recursive: true, force: true });
            return `Directory ${dirPath} deleted successfully`;
        } catch (error) {
            console.error('Error deleting directory:', error);
            throw error;
        }
    }

    async listDirectory(dirPath: string = '.'): Promise<{ files: string[], directories: string[] }> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullPath = path.join(workspaceFolders[0].uri.fsPath, dirPath);
            
            if (!fs.existsSync(fullPath)) {
                throw new Error(`Directory ${dirPath} does not exist`);
            }
            
            const items = fs.readdirSync(fullPath);
            const files: string[] = [];
            const directories: string[] = [];
            
            for (const item of items) {
                const itemPath = path.join(fullPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    directories.push(item);
                } else {
                    files.push(item);
                }
            }
            
            return { files, directories };
        } catch (error) {
            console.error('Error listing directory:', error);
            throw error;
        }
    }

    async moveFile(sourcePath: string, destinationPath: string): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullSourcePath = path.join(workspaceFolders[0].uri.fsPath, sourcePath);
            const fullDestPath = path.join(workspaceFolders[0].uri.fsPath, destinationPath);
            
            if (!fs.existsSync(fullSourcePath)) {
                throw new Error(`Source file ${sourcePath} does not exist`);
            }
            
            // Create destination directory if it doesn't exist
            const destDir = path.dirname(fullDestPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            fs.renameSync(fullSourcePath, fullDestPath);
            return `File moved from ${sourcePath} to ${destinationPath}`;
        } catch (error) {
            console.error('Error moving file:', error);
            throw error;
        }
    }

    async copyFile(sourcePath: string, destinationPath: string): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullSourcePath = path.join(workspaceFolders[0].uri.fsPath, sourcePath);
            const fullDestPath = path.join(workspaceFolders[0].uri.fsPath, destinationPath);
            
            if (!fs.existsSync(fullSourcePath)) {
                throw new Error(`Source file ${sourcePath} does not exist`);
            }
            
            // Create destination directory if it doesn't exist
            const destDir = path.dirname(fullDestPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            fs.copyFileSync(fullSourcePath, fullDestPath);
            return `File copied from ${sourcePath} to ${destinationPath}`;
        } catch (error) {
            console.error('Error copying file:', error);
            throw error;
        }
    }

    async editFile(filePath: string, content: string): Promise<boolean> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
            
            if (!fs.existsSync(fullPath)) {
                throw new Error(`File ${filePath} does not exist`);
            }

            // Read current content
            const currentContent = fs.readFileSync(fullPath, 'utf8');
            
            // Write new content
            fs.writeFileSync(fullPath, content, 'utf8');
            
            // Open the file in VS Code
            const uri = vscode.Uri.file(fullPath);
            await vscode.window.showTextDocument(uri);
            
            return true;
        } catch (error) {
            console.error('Error editing file:', error);
            throw error;
        }
    }

    async analyzeProjectStructure(): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return "No workspace folders are currently open.";
            }

            let structure = "Project Structure:\n\n";
            
            for (const folder of workspaceFolders) {
                structure += `📁 ${folder.name}\n`;
                structure += `   Path: ${folder.uri.fsPath}\n`;
                
                // Get files in the workspace
                const files = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(folder, '**/*'),
                    '**/node_modules/**'
                );
                
                const fileTypes = new Map<string, number>();
                const importantFiles: string[] = [];
                
                files.forEach(file => {
                    const ext = file.fsPath.split('.').pop() || 'no-extension';
                    fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
                    
                    // Track important files
                    const relativePath = path.relative(folder.uri.fsPath, file.fsPath);
                    if (this.isImportantFile(relativePath)) {
                        importantFiles.push(relativePath);
                    }
                });
                
                structure += `   Files: ${files.length} total\n`;
                fileTypes.forEach((count, ext) => {
                    structure += `     • ${ext}: ${count} files\n`;
                });
                
                if (importantFiles.length > 0) {
                    structure += `   Important files:\n`;
                    importantFiles.slice(0, 10).forEach(file => {
                        structure += `     • ${file}\n`;
                    });
                }
                structure += "\n";
            }
            
            return structure;
        } catch (error) {
            console.error('Error analyzing project structure:', error);
            return "Unable to analyze project structure at this time.";
        }
    }

    async getCodebaseContext(): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return "No workspace folder open.";
            }

            let context = "Current Codebase Context:\n\n";
            
            // Get project structure
            context += await this.analyzeProjectStructure();
            
            // Get package.json if it exists
            const packageJsonPath = path.join(workspaceFolders[0].uri.fsPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    context += `\nPackage.json:\n`;
                    context += `  Name: ${packageJson.name || 'N/A'}\n`;
                    context += `  Version: ${packageJson.version || 'N/A'}\n`;
                    if (packageJson.dependencies) {
                        context += `  Dependencies: ${Object.keys(packageJson.dependencies).length}\n`;
                    }
                    if (packageJson.devDependencies) {
                        context += `  Dev Dependencies: ${Object.keys(packageJson.devDependencies).length}\n`;
                    }
                } catch (error) {
                    context += `  Error reading package.json\n`;
                }
            }

            // Get recent files
            const recentFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolders[0], '**/*.{js,ts,jsx,tsx,py,java,cpp,c,go,rs}'),
                '**/node_modules/**'
            );
            
            if (recentFiles.length > 0) {
                context += `\nRecent code files:\n`;
                recentFiles.slice(0, 5).forEach(file => {
                    const relativePath = path.relative(workspaceFolders[0].uri.fsPath, file.fsPath);
                    context += `  • ${relativePath}\n`;
                });
            }

            return context;
        } catch (error) {
            console.error('Error getting codebase context:', error);
            return "Unable to get codebase context.";
        }
    }

    async getFileContent(filePath: string): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const fullPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
            
            if (!fs.existsSync(fullPath)) {
                throw new Error(`File ${filePath} does not exist`);
            }

            return fs.readFileSync(fullPath, 'utf8');
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    async getSelectedCode(): Promise<{ code: string; language: string; filePath: string; lineRange: string } | null> {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return null;
            }

            const selection = editor.selection;
            const document = editor.document;
            
            // Check if there's a selection
            if (selection.isEmpty) {
                return null;
            }

            const selectedText = document.getText(selection);
            const language = document.languageId;
            const filePath = document.fileName;
            
            // Get relative path if in workspace
            const workspaceFolders = vscode.workspace.workspaceFolders;
            let relativePath = filePath;
            if (workspaceFolders && workspaceFolders.length > 0) {
                relativePath = path.relative(workspaceFolders[0].uri.fsPath, filePath);
            }

            // Get line range
            const startLine = selection.start.line + 1;
            const endLine = selection.end.line + 1;
            const lineRange = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;

            return {
                code: selectedText,
                language: language,
                filePath: relativePath,
                lineRange: lineRange
            };
        } catch (error) {
            console.error('Error getting selected code:', error);
            return null;
        }
    }

    async analyzeSelectedCode(): Promise<string> {
        try {
            const selectedCode = await this.getSelectedCode();
            if (!selectedCode) {
                return "No code is currently selected. Please select some code in the editor to analyze.";
            }

            const analysis = await this.callOpenRouterAPI(
                `Analyze this ${selectedCode.language} code from file ${selectedCode.filePath} (lines ${selectedCode.lineRange}):

\`\`\`${selectedCode.language}
${selectedCode.code}
\`\`\`

Please provide:
1. What this code does
2. Any potential issues or improvements
3. How it fits into the broader codebase
4. Suggestions for optimization or best practices

Keep the analysis concise but thorough.`,
                `Analyzing selected code from ${selectedCode.filePath}`
            );

            return analysis;
        } catch (error) {
            console.error('Error analyzing selected code:', error);
            return `Error analyzing selected code: ${error}`;
        }
    }

    async getCodeContext(): Promise<string> {
        try {
            const selectedCode = await this.getSelectedCode();
            if (!selectedCode) {
                return "No code is currently selected.";
            }

            const context = `Currently Selected Code:
File: ${selectedCode.filePath}
Language: ${selectedCode.language}
Lines: ${selectedCode.lineRange}

Code:
\`\`\`${selectedCode.language}
${selectedCode.code}
\`\`\`

This code is selected in the editor and ready for analysis or modification.`;

            return context;
        } catch (error) {
            console.error('Error getting code context:', error);
            return "Unable to get selected code context.";
        }
    }

    async suggestCodeActions(userMessage: string): Promise<CodeAction[]> {
        try {
            console.log(`[AI Service] Suggesting actions for: "${userMessage}"`);
            
            const prompt = `Based on this user request: "${userMessage}"

Please suggest specific file system actions that can be performed. For each action, use these exact markers:

[CREATE_FILE:path:description] - Create a new file
[CREATE_DIRECTORY:path:description] - Create a new directory (or use [CREATE_FOLDER:path:description])
[DELETE_FILE:path:description] - Delete a file
[DELETE_DIRECTORY:path:description] - Delete a directory
[MOVE_FILE:sourcePath:destinationPath:description] - Move a file
[COPY_FILE:sourcePath:destinationPath:description] - Copy a file
[EDIT_FILE:path:description] - Edit an existing file

For file creation, also provide the content using:
[FILE_CONTENT:path]
content here
[/FILE_CONTENT]

Examples:
- [CREATE_DIRECTORY:src/components:Create React components directory]
- [CREATE_FILE:src/components/Button.jsx:Create a reusable Button component]
- [FILE_CONTENT:src/components/Button.jsx]
import React from 'react';
export default function Button({ children, ...props }) {
  return <button {...props}>{children}</button>;
}
[/FILE_CONTENT]

Provide only the action markers and file content, no other text.`;

            const response = await this.callOpenRouterAPI(prompt, 'Suggesting code actions');
            console.log(`[AI Service] AI response: ${response}`);
            
            const actions: CodeAction[] = [];
            const lines = response.split('\n');
            let currentContent = '';
            let currentFilePath = '';
            
            for (const line of lines) {
                // Parse action markers (support both old and new formats)
                const createFileMatch = line.match(/\[CREATE_FILE:([^:]+):([^\]]+)\]/);
                const createDirMatch = line.match(/\[CREATE_DIRECTORY:([^:]+):([^\]]+)\]/);
                const createFolderMatch = line.match(/\[CREATE_FOLDER:([^:]+):([^\]]+)\]/); // Support old format
                const deleteFileMatch = line.match(/\[DELETE_FILE:([^:]+):([^\]]+)\]/);
                const deleteDirMatch = line.match(/\[DELETE_DIRECTORY:([^:]+):([^\]]+)\]/);
                const moveFileMatch = line.match(/\[MOVE_FILE:([^:]+):([^:]+):([^\]]+)\]/);
                const copyFileMatch = line.match(/\[COPY_FILE:([^:]+):([^:]+):([^\]]+)\]/);
                const editFileMatch = line.match(/\[EDIT_FILE:([^:]+):([^\]]+)\]/);
                
                // Parse file content markers
                const fileContentStart = line.match(/\[FILE_CONTENT:([^\]]+)\]/);
                const fileContentEnd = line.match(/\[\/FILE_CONTENT\]/);
                
                if (createFileMatch) {
                    console.log(`[AI Service] Found CREATE_FILE action: ${createFileMatch[1]}`);
                    actions.push({
                        type: 'CREATE_FILE',
                        path: createFileMatch[1],
                        description: createFileMatch[2]
                    });
                } else if (createDirMatch) {
                    console.log(`[AI Service] Found CREATE_DIRECTORY action: ${createDirMatch[1]}`);
                    actions.push({
                        type: 'CREATE_DIRECTORY',
                        path: createDirMatch[1],
                        description: createDirMatch[2]
                    });
                } else if (createFolderMatch) {
                    console.log(`[AI Service] Found CREATE_FOLDER action (converting to CREATE_DIRECTORY): ${createFolderMatch[1]}`);
                    actions.push({
                        type: 'CREATE_DIRECTORY',
                        path: createFolderMatch[1],
                        description: createFolderMatch[2]
                    });
                } else if (deleteFileMatch) {
                    console.log(`[AI Service] Found DELETE_FILE action: ${deleteFileMatch[1]}`);
                    actions.push({
                        type: 'DELETE_FILE',
                        path: deleteFileMatch[1],
                        description: deleteFileMatch[2]
                    });
                } else if (deleteDirMatch) {
                    console.log(`[AI Service] Found DELETE_DIRECTORY action: ${deleteDirMatch[1]}`);
                    actions.push({
                        type: 'DELETE_DIRECTORY',
                        path: deleteDirMatch[1],
                        description: deleteDirMatch[2]
                    });
                } else if (moveFileMatch) {
                    console.log(`[AI Service] Found MOVE_FILE action: ${moveFileMatch[1]} -> ${moveFileMatch[2]}`);
                    actions.push({
                        type: 'MOVE_FILE',
                        sourcePath: moveFileMatch[1],
                        destinationPath: moveFileMatch[2],
                        path: moveFileMatch[1], // For compatibility
                        description: moveFileMatch[3]
                    });
                } else if (copyFileMatch) {
                    console.log(`[AI Service] Found COPY_FILE action: ${copyFileMatch[1]} -> ${copyFileMatch[2]}`);
                    actions.push({
                        type: 'COPY_FILE',
                        sourcePath: copyFileMatch[1],
                        destinationPath: copyFileMatch[2],
                        path: copyFileMatch[1], // For compatibility
                        description: copyFileMatch[3]
                    });
                } else if (editFileMatch) {
                    console.log(`[AI Service] Found EDIT_FILE action: ${editFileMatch[1]}`);
                    actions.push({
                        type: 'EDIT_FILE',
                        path: editFileMatch[1],
                        description: editFileMatch[2]
                    });
                } else if (fileContentStart) {
                    console.log(`[AI Service] Found FILE_CONTENT start: ${fileContentStart[1]}`);
                    currentFilePath = fileContentStart[1];
                    currentContent = '';
                } else if (fileContentEnd) {
                    console.log(`[AI Service] Found FILE_CONTENT end for: ${currentFilePath}`);
                    // Add content to the last CREATE_FILE action for this path
                    const lastCreateFileAction = actions
                        .filter(a => a.type === 'CREATE_FILE')
                        .reverse()
                        .find(a => a.path === currentFilePath);
                    
                    if (lastCreateFileAction) {
                        lastCreateFileAction.content = currentContent.trim();
                        console.log(`[AI Service] Added content to ${currentFilePath}, length: ${currentContent.trim().length}`);
                    }
                    
                    currentFilePath = '';
                    currentContent = '';
                } else if (currentFilePath && line.trim()) {
                    currentContent += line + '\n';
                }
            }
            
            console.log(`[AI Service] Parsed ${actions.length} actions`);
            return actions;
        } catch (error) {
            console.error('[AI Service] Error suggesting code actions:', error);
            return [];
        }
    }

    private parseCodeActions(response: string): CodeAction[] {
        const actions: CodeAction[] = [];
        const actionRegex = /\[(CREATE_FILE|EDIT_FILE|DELETE_FILE|RENAME_FILE|CREATE_FOLDER):([^:]+):([^\]]+)\]/g;
        
        let match;
        while ((match = actionRegex.exec(response)) !== null) {
            const [, actionType, filePath, description] = match;
            actions.push({
                type: actionType.toLowerCase() as any,
                path: filePath.trim(),
                description: description.trim()
            });
        }
        
        return actions;
    }

    private isImportantFile(filePath: string): boolean {
        const importantPatterns = [
            'package.json', 'package-lock.json', 'yarn.lock',
            'README.md', 'README.txt', 'LICENSE',
            'tsconfig.json', 'jsconfig.json', 'webpack.config.js',
            'vite.config.js', 'next.config.js', 'tailwind.config.js',
            '.env', '.env.local', '.env.production',
            'index.js', 'index.ts', 'main.js', 'main.ts',
            'app.js', 'app.ts', 'App.js', 'App.tsx'
        ];
        
        return importantPatterns.some(pattern => 
            filePath.includes(pattern) || filePath.endsWith(pattern)
        );
    }

    private async callOpenRouterAPI(prompt: string, context?: string): Promise<string> {
        try {
            console.log(`[AI Service] Calling OpenRouter API (${prompt.length} chars)`);
            
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://curvable.ai',
                    'X-Title': 'Curvable AI Assistant'
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-3.5-sonnet',
                    messages: [
                        {
                            role: 'system',
                            content: `You are Curvable AI Assistant, a helpful coding assistant integrated into VS Code. You can help with:
- Code analysis and explanation
- File and folder creation
- Project structure organization
- Code generation and improvement
- Debugging and troubleshooting

Always be helpful, concise, and provide actionable advice. When suggesting file operations, use the exact format:
[CREATE_FILE:path:description]
[CREATE_DIRECTORY:path:description]
[FILE_CONTENT:path]
content here
[/FILE_CONTENT]`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as any;
                console.error(`[AI Service] API Error ${response.status}:`, errorData);
                
                // Handle specific error cases
                if (response.status === 402) {
                    throw new Error(`API Credits Exhausted: ${errorData.error?.message || 'Payment required. Please upgrade your OpenRouter account or try again later.'}`);
                } else if (response.status === 429) {
                    throw new Error('API Rate Limit Exceeded: Please wait a moment and try again.');
                } else if (response.status === 401) {
                    throw new Error('API Authentication Failed: Please check your API key.');
                } else {
                    throw new Error(`API Request Failed (${response.status}): ${errorData.error?.message || response.statusText}`);
                }
            }

            const data = await response.json() as any;
            const content = data.choices?.[0]?.message?.content;
            
            if (!content) {
                throw new Error('No content received from API');
            }
            
            console.log(`[AI Service] API response received (${content.length} chars)`);
            return content;
            
        } catch (error) {
            console.error('[AI Service] API call failed:', error);
            
            // Provide fallback responses for common scenarios
            if (error instanceof Error && error.message.includes('API Credits Exhausted')) {
                return this.getFallbackResponse(prompt, 'credits');
            } else if (error instanceof Error && error.message.includes('Rate Limit')) {
                return this.getFallbackResponse(prompt, 'rate_limit');
            } else if (error instanceof Error && error.message.includes('Network')) {
                return this.getFallbackResponse(prompt, 'network');
            } else {
                return this.getFallbackResponse(prompt, 'general');
            }
        }
    }

    private getFallbackResponse(prompt: string, errorType: string): string {
        console.log(`[AI Service] Providing fallback response for ${errorType} error`);
        
        const lowerPrompt = prompt.toLowerCase();
        
        // File creation requests
        if (lowerPrompt.includes('create') && (lowerPrompt.includes('file') || lowerPrompt.includes('folder'))) {
            return `I'd be happy to help you create files and folders! However, I'm currently experiencing API connectivity issues.

Here's what I can suggest:

📁 **Manual File Creation:**
- Use VS Code's File Explorer to create folders
- Right-click → "New File" or "New Folder"
- Use the Command Palette (Cmd+Shift+P) → "File: New File"

🚀 **Alternative Commands:**
- "Curvable AI: Create Project Structure" - Creates a complete project structure
- "Curvable AI: Create React Component" - Creates a React component
- "Curvable AI: Test File Creation" - Tests file operations

💡 **Try Again Later:**
The API should be available again shortly. You can also:
1. Check your OpenRouter account credits
2. Try again in a few minutes
3. Use the direct commands above in the meantime

Would you like me to help you with any of these alternatives?`;
        }
        
        // Code analysis requests
        if (lowerPrompt.includes('analyze') || lowerPrompt.includes('explain') || lowerPrompt.includes('what does')) {
            return `I'd love to analyze your code! However, I'm currently experiencing API connectivity issues.

Here are some alternatives:

🔍 **Built-in VS Code Features:**
- Use "Curvable AI: Read Project Files" to view file contents
- Use "Curvable AI: Find Relevant Files" to locate specific files
- Use VS Code's built-in code navigation (F12, Ctrl+Click)

📖 **Manual Analysis:**
- Read through the code files directly
- Use VS Code's IntelliSense for function documentation
- Check the project's README.md for context

🔄 **Try Again:**
The API should be available again shortly. You can:
1. Wait a few minutes and try again
2. Check your OpenRouter account status
3. Use the file reading commands above

Would you like me to help you with any of these alternatives?`;
        }
        
        // General coding help
        if (lowerPrompt.includes('help') || lowerPrompt.includes('how to')) {
            return `I'd be happy to help you with coding! However, I'm currently experiencing API connectivity issues.

Here are some helpful alternatives:

📚 **VS Code Built-in Help:**
- Command Palette (Cmd+Shift+P) → "Help: Get Started"
- Check the VS Code documentation
- Use IntelliSense for code suggestions

🛠️ **Available Commands:**
- "Curvable AI: Read Project Files" - View file contents
- "Curvable AI: Find Relevant Files" - Locate specific files
- "Curvable AI: Create Project Structure" - Set up new projects

⏳ **Try Again Later:**
The API should be available again shortly. You can:
1. Wait a few minutes and retry
2. Check your OpenRouter account credits
3. Use the available commands above

Would you like me to help you with any of these alternatives?`;
        }
        
        // Default fallback response
        return `I'm currently experiencing API connectivity issues and can't provide a full response right now.

🔧 **What you can do:**
1. **Wait a few minutes** and try again
2. **Check your OpenRouter account** credits and status
3. **Use available commands:**
   - "Curvable AI: Read Project Files" - View file contents
   - "Curvable AI: Find Relevant Files" - Locate files
   - "Curvable AI: Create Project Structure" - Set up projects

💡 **Error Details:**
${errorType === 'credits' ? 'API credits have been exhausted. Please upgrade your OpenRouter account or wait for credits to refresh.' : 
  errorType === 'rate_limit' ? 'API rate limit exceeded. Please wait a moment before trying again.' :
  errorType === 'network' ? 'Network connectivity issue. Please check your internet connection.' :
  'General API error. Please try again later.'}

I'll be back to full functionality as soon as the API is available again!`;
    }

    private generateSuggestions(userMessage: string): string[] {
        const message = userMessage.toLowerCase();
        
        if (message.includes('create') || message.includes('new') || message.includes('add')) {
            return [
                'Create a new component',
                'Add a new function',
                'Create a new file',
                'Set up a new feature'
            ];
        } else if (message.includes('explain') || message.includes('what') || message.includes('how')) {
            return [
                'Explain the project structure',
                'Show me the code flow',
                'What does this function do?',
                'How does this work?'
            ];
        } else if (message.includes('fix') || message.includes('error') || message.includes('bug')) {
            return [
                'Show me the error details',
                'Help me debug this',
                'Fix the syntax error',
                'Optimize this code'
            ];
        } else if (message.includes('file') || message.includes('structure')) {
            return [
                'Show project structure',
                'List all files',
                'Find specific files',
                'Create new files'
            ];
        } else {
            return [
                'Create a new file',
                'Explain this code',
                'Show project structure',
                'Help me debug',
                'Generate code',
                'Optimize performance'
            ];
        }
    }

    async readProjectFiles(filePaths: string[]): Promise<{ [path: string]: string }> {
        try {
            console.log(`[AI Service] Reading ${filePaths.length} project files`);
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const files: { [path: string]: string } = {};
            
            for (const filePath of filePaths) {
                try {
                    const fullPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
                    
                    if (fs.existsSync(fullPath)) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        files[filePath] = content;
                        console.log(`[AI Service] Read file: ${filePath} (${content.length} chars)`);
                    } else {
                        console.log(`[AI Service] File not found: ${filePath}`);
                        files[filePath] = `[FILE NOT FOUND: ${filePath}]`;
                    }
                } catch (error) {
                    console.error(`[AI Service] Error reading file ${filePath}:`, error);
                    files[filePath] = `[ERROR READING FILE: ${filePath} - ${error}]`;
                }
            }
            
            return files;
        } catch (error) {
            console.error('[AI Service] Error reading project files:', error);
            throw error;
        }
    }

    async chatWithFiles(prompt: string, filePaths: string[], context?: string): Promise<AIResponse> {
        try {
            console.log(`[AI Service] Chatting with files: ${filePaths.length} files`);
            
            // Read all specified files
            const files = await this.readProjectFiles(filePaths);
            
            // Build context from files
            let fileContext = '';
            for (const [filePath, content] of Object.entries(files)) {
                fileContext += `\n\n--- FILE: ${filePath} ---\n${content}\n--- END FILE ---`;
            }
            
            // Create enhanced prompt with file context
            const enhancedPrompt = `${prompt}

${context ? `\nAdditional Context:\n${context}\n` : ''}

Project Files:
${fileContext}

Please analyze the provided files and respond to the user's request.`;

            console.log(`[AI Service] Enhanced prompt length: ${enhancedPrompt.length} chars`);
            
            // Call AI with enhanced prompt
            const response = await this.callOpenRouterAPI(enhancedPrompt, 'Chat with project files');
            
            return {
                content: response,
                actions: await this.suggestCodeActions(response)
            };
        } catch (error) {
            console.error('[AI Service] Error in chat with files:', error);
            throw error;
        }
    }

    async analyzeProjectStructureDetailed(): Promise<{ structure: string, files: string[] }> {
        try {
            console.log('[AI Service] Analyzing project structure');
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder open');
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            const files: string[] = [];
            let structure = '';

            const scanDirectory = (dirPath: string, relativePath: string = '', depth: number = 0): void => {
                const items = fs.readdirSync(dirPath);
                const indent = '  '.repeat(depth);
                
                for (const item of items) {
                    const fullPath = path.join(dirPath, item);
                    const relativeItemPath = path.join(relativePath, item);
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isDirectory()) {
                        // Skip node_modules and other common directories
                        if (item === 'node_modules' || item === '.git' || item === '.vscode') {
                            structure += `${indent}📁 ${item}/ (skipped)\n`;
                            continue;
                        }
                        
                        structure += `${indent}📁 ${item}/\n`;
                        scanDirectory(fullPath, relativeItemPath, depth + 1);
                    } else {
                        const ext = path.extname(item);
                        const icon = this.getFileIcon(ext);
                        structure += `${indent}${icon} ${item}\n`;
                        files.push(relativeItemPath);
                    }
                }
            };

            scanDirectory(rootPath);
            
            console.log(`[AI Service] Project structure analyzed: ${files.length} files found`);
            return { structure, files };
        } catch (error) {
            console.error('[AI Service] Error analyzing project structure:', error);
            throw error;
        }
    }

    private getFileIcon(extension: string): string {
        const iconMap: { [key: string]: string } = {
            '.js': '📄',
            '.jsx': '⚛️',
            '.ts': '📄',
            '.tsx': '⚛️',
            '.json': '📋',
            '.html': '🌐',
            '.css': '🎨',
            '.scss': '🎨',
            '.py': '🐍',
            '.java': '☕',
            '.cpp': '⚙️',
            '.c': '⚙️',
            '.md': '📝',
            '.txt': '📄',
            '.yml': '⚙️',
            '.yaml': '⚙️',
            '.xml': '📄',
            '.sql': '🗄️',
            '.sh': '🐚',
            '.bat': '🐚',
            '.gitignore': '🚫',
            '.env': '🔐'
        };
        
        return iconMap[extension] || '📄';
    }

    async getRelevantFiles(query: string, maxFiles: number = 10): Promise<string[]> {
        try {
            console.log(`[AI Service] Finding relevant files for query: "${query}"`);
            
            const { files } = await this.analyzeProjectStructureDetailed();
            const relevantFiles: { file: string, score: number }[] = [];
            
            // Simple scoring based on filename and extension relevance
            for (const file of files) {
                let score = 0;
                const fileName = path.basename(file).toLowerCase();
                const fileExt = path.extname(file).toLowerCase();
                const queryLower = query.toLowerCase();
                
                // Score based on filename matching
                if (fileName.includes(queryLower)) score += 10;
                if (fileName.startsWith(queryLower)) score += 5;
                
                // Score based on file type relevance
                if (query.includes('react') || query.includes('component')) {
                    if (fileExt === '.jsx' || fileExt === '.tsx') score += 8;
                    if (fileName.includes('component')) score += 5;
                }
                
                if (query.includes('api') || query.includes('server')) {
                    if (fileExt === '.js' || fileExt === '.ts') score += 8;
                    if (fileName.includes('api') || fileName.includes('server')) score += 5;
                }
                
                if (query.includes('style') || query.includes('css')) {
                    if (fileExt === '.css' || fileExt === '.scss') score += 8;
                }
                
                if (query.includes('config') || query.includes('package')) {
                    if (fileName === 'package.json' || fileName.includes('config')) score += 8;
                }
                
                if (score > 0) {
                    relevantFiles.push({ file, score });
                }
            }
            
            // Sort by score and return top files
            relevantFiles.sort((a, b) => b.score - a.score);
            const topFiles = relevantFiles.slice(0, maxFiles).map(item => item.file);
            
            console.log(`[AI Service] Found ${topFiles.length} relevant files`);
            return topFiles;
        } catch (error) {
            console.error('[AI Service] Error finding relevant files:', error);
            return [];
        }
    }
} 