import * as vscode from 'vscode';
import { CurvableAIChatProvider } from './chatProvider';
import { CurvableAIMemoryProvider } from './memoryProvider';
import { CurvableAILearningProvider } from './learningProvider';
import { AIService, CodeAction } from './aiService';
import { IntentManager } from './intentManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('Curvable AI Assistant is now active!');

    const aiService = new AIService();
    const intentManager = new IntentManager(context);

    // Register webview providers for sidebar
    const chatProvider = new CurvableAIChatProvider(context.extensionUri, aiService, intentManager);
    const memoryProvider = new CurvableAIMemoryProvider(context.extensionUri, intentManager);
    const learningProvider = new CurvableAILearningProvider(context.extensionUri, aiService);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CurvableAIChatProvider.viewType, chatProvider)
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CurvableAIMemoryProvider.viewType, memoryProvider)
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CurvableAILearningProvider.viewType, learningProvider)
    );

    // Register commands
    let chatCommand = vscode.commands.registerCommand('curvable-ai-assistant.openChat', () => {
        vscode.commands.executeCommand('curvable-ai-chat.focus');
    });

    let memoryCommand = vscode.commands.registerCommand('curvable-ai-assistant.openMemory', () => {
        vscode.commands.executeCommand('curvable-ai-memory.focus');
    });

    let learningCommand = vscode.commands.registerCommand('curvable-ai-assistant.openLearning', () => {
        vscode.commands.executeCommand('curvable-ai-learning.focus');
    });

    let explainCodeCommand = vscode.commands.registerCommand('curvable-ai-assistant.explainCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            if (text) {
                const explanation = await aiService.explainCode(text, editor.document.languageId);
                vscode.window.showInformationMessage(explanation);
            } else {
                vscode.window.showWarningMessage('Please select some code to explain.');
            }
        } else {
            vscode.window.showWarningMessage('Please open a file and select code to explain.');
        }
    });

    let generateCodeCommand = vscode.commands.registerCommand('curvable-ai-assistant.generateCode', async () => {
        const prompt = await vscode.window.showInputBox({
            prompt: 'Describe the code you want to generate:',
            placeHolder: 'e.g., Create a function to sort an array of numbers'
        });

        if (prompt) {
            const code = await aiService.generateCode(prompt, 'javascript');
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.active, code);
                });
            } else {
                // Create a new file with the generated code
                const document = await vscode.workspace.openTextDocument({
                    content: code,
                    language: 'javascript'
                });
                await vscode.window.showTextDocument(document);
            }
        }
    });

    let createFileCommand = vscode.commands.registerCommand('curvable-ai-assistant.createFile', async () => {
        const fileName = await vscode.window.showInputBox({
            prompt: 'Enter the file path and name:',
            placeHolder: 'e.g., src/components/Button.js'
        });

        if (fileName) {
            const content = await vscode.window.showInputBox({
                prompt: 'Enter the file content:',
                placeHolder: '// Your code here'
            });

            if (content) {
                try {
                    await aiService.createFile(fileName, content);
                    vscode.window.showInformationMessage(`File ${fileName} created successfully!`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create file: ${error}`);
                }
            }
        }
    });

    let analyzeProjectCommand = vscode.commands.registerCommand('curvable-ai-assistant.analyzeProject', async () => {
        try {
            const structure = await aiService.analyzeProjectStructure();
            const panel = vscode.window.createWebviewPanel(
                'projectAnalysis',
                'Project Analysis',
                vscode.ViewColumn.One,
                {}
            );
            
            panel.webview.html = getProjectAnalysisWebviewContent(structure);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze project: ${error}`);
        }
    });

    let suggestActionsCommand = vscode.commands.registerCommand('curvable-ai-assistant.suggestActions', async () => {
        const userRequest = await vscode.window.showInputBox({
            prompt: 'What would you like to do with your codebase?',
            placeHolder: 'e.g., Add user authentication, Create a new component, etc.'
        });

        if (userRequest) {
            try {
                const actions = await aiService.suggestCodeActions(userRequest);
                if (actions.length > 0) {
                    const action = await vscode.window.showQuickPick(
                        actions.map(a => ({
                            label: `${a.type}: ${a.path}`,
                            description: a.description,
                            action: a
                        })),
                        {
                            placeHolder: 'Select an action to perform'
                        }
                    );

                    if (action) {
                        await executeCodeAction(action.action, aiService);
                    }
                } else {
                    vscode.window.showInformationMessage('No specific actions suggested for this request.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to suggest actions: ${error}`);
            }
        }
    });

    let analyzeSelectedCodeCommand = vscode.commands.registerCommand('curvable-ai-assistant.analyzeSelectedCode', async () => {
        try {
            const analysis = await aiService.analyzeSelectedCode();
            const panel = vscode.window.createWebviewPanel(
                'codeAnalysis',
                'Code Analysis',
                vscode.ViewColumn.Beside,
                {}
            );
            
            panel.webview.html = getCodeAnalysisWebviewContent(analysis);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze selected code: ${error}`);
        }
    });

    let readSelectedCodeCommand = vscode.commands.registerCommand('curvable-ai-assistant.readSelectedCode', async () => {
        try {
            const selectedCode = await aiService.getSelectedCode();
            if (!selectedCode) {
                vscode.window.showWarningMessage('No code is currently selected. Please select some code first.');
                return;
            }

            const context = await aiService.getCodeContext();
            vscode.window.showInformationMessage(`Selected code from ${selectedCode.filePath} (lines ${selectedCode.lineRange})`);
            
            // You can also send this to the chat
            const chatPanel = vscode.window.activeTextEditor?.document.uri.scheme === 'vscode-webview' 
                ? vscode.window.activeTextEditor 
                : null;
            
            if (chatPanel) {
                // If chat is open, send the context there
                vscode.commands.executeCommand('curvable-ai-chat.focus');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read selected code: ${error}`);
        }
    });

    let createDirectoryCommand = vscode.commands.registerCommand('curvable-ai-assistant.createDirectory', async () => {
        const dirPath = await vscode.window.showInputBox({
            prompt: 'Enter directory path to create:',
            placeHolder: 'e.g., src/components, src/utils/helpers'
        });

        if (dirPath) {
            try {
                const result = await aiService.createDirectory(dirPath);
                vscode.window.showInformationMessage(result);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create directory: ${error}`);
            }
        }
    });

    let listDirectoryCommand = vscode.commands.registerCommand('curvable-ai-assistant.listDirectory', async () => {
        const dirPath = await vscode.window.showInputBox({
            prompt: 'Enter directory path to list (leave empty for current directory):',
            placeHolder: 'e.g., src, src/utils'
        });

        if (dirPath !== undefined) {
            try {
                const result = await aiService.listDirectory(dirPath || '.');
                const message = `Directory: ${dirPath || '.'}\nFiles: ${result.files.join(', ')}\nDirectories: ${result.directories.join(', ')}`;
                vscode.window.showInformationMessage(message);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to list directory: ${error}`);
            }
        }
    });

    let moveFileCommand = vscode.commands.registerCommand('curvable-ai-assistant.moveFile', async () => {
        const sourcePath = await vscode.window.showInputBox({
            prompt: 'Enter source file path:',
            placeHolder: 'e.g., src/old-file.js'
        });

        if (sourcePath) {
            const destinationPath = await vscode.window.showInputBox({
                prompt: 'Enter destination file path:',
                placeHolder: 'e.g., src/new-file.js'
            });

            if (destinationPath && sourcePath) {
                try {
                    const result = await aiService.moveFile(sourcePath, destinationPath);
                    vscode.window.showInformationMessage(result);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to move file: ${error}`);
                }
            }
        }
    });

    let copyFileCommand = vscode.commands.registerCommand('curvable-ai-assistant.copyFile', async () => {
        const sourcePath = await vscode.window.showInputBox({
            prompt: 'Enter source file path:',
            placeHolder: 'e.g., src/template.js'
        });

        if (sourcePath) {
            const destinationPath = await vscode.window.showInputBox({
                prompt: 'Enter destination file path:',
                placeHolder: 'e.g., src/copy.js'
            });

            if (destinationPath && sourcePath) {
                try {
                    const result = await aiService.copyFile(sourcePath, destinationPath);
                    vscode.window.showInformationMessage(result);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to copy file: ${error}`);
                }
            }
        }
    });

    let testFileCreationCommand = vscode.commands.registerCommand('curvable-ai-assistant.testFileCreation', async () => {
        try {
            console.log('[Extension] Testing file creation...');
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const testFilePath = 'test-ai-file.txt';
            const testContent = 'This is a test file created by the AI assistant!\nTimestamp: ' + new Date().toISOString();
            
            console.log(`[Extension] Creating test file: ${testFilePath}`);
            const result = await aiService.createFile(testFilePath, testContent);
            console.log(`[Extension] Test file creation result: ${result}`);
            
            vscode.window.showInformationMessage(`Test file created: ${result}`);
        } catch (error) {
            console.error('[Extension] Test file creation failed:', error);
            vscode.window.showErrorMessage(`Test failed: ${error}`);
        }
    });

    let comprehensiveTestCommand = vscode.commands.registerCommand('curvable-ai-assistant.comprehensiveTest', async () => {
        try {
            console.log('[Extension] Starting comprehensive file operations test...');
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const results: string[] = [];
            
            // Test 1: Create directory
            console.log('[Extension] Test 1: Creating directory...');
            const dirResult = await aiService.createDirectory('test-ai-dir');
            results.push(`✅ Directory: ${dirResult}`);
            
            // Test 2: Create file
            console.log('[Extension] Test 2: Creating file...');
            const fileContent = `// Test file created by AI Assistant
// Created at: ${new Date().toISOString()}

export function testFunction() {
    return "Hello from AI Assistant!";
}

export const testConstant = "AI Assistant Test";
`;
            const fileResult = await aiService.createFile('test-ai-dir/test-file.js', fileContent);
            results.push(`✅ File: ${fileResult}`);
            
            // Test 3: List directory
            console.log('[Extension] Test 3: Listing directory...');
            const listResult = await aiService.listDirectory('test-ai-dir');
            results.push(`✅ Directory listing: ${listResult.files.length} files, ${listResult.directories.length} dirs`);
            
            // Test 4: Copy file
            console.log('[Extension] Test 4: Copying file...');
            const copyResult = await aiService.copyFile('test-ai-dir/test-file.js', 'test-ai-dir/test-file-copy.js');
            results.push(`✅ Copy: ${copyResult}`);
            
            // Test 5: Edit file
            console.log('[Extension] Test 5: Editing file...');
            const editContent = fileContent + '\n// Modified by AI Assistant\n';
            await aiService.editFile('test-ai-dir/test-file.js', editContent);
            results.push(`✅ Edit: File modified successfully`);
            
            // Test 6: Move file
            console.log('[Extension] Test 6: Moving file...');
            const moveResult = await aiService.moveFile('test-ai-dir/test-file-copy.js', 'test-ai-dir/moved-file.js');
            results.push(`✅ Move: ${moveResult}`);
            
            // Test 7: Delete files
            console.log('[Extension] Test 7: Deleting files...');
            const deleteFileResult = await aiService.deleteFile('test-ai-dir/moved-file.js');
            results.push(`✅ Delete file: ${deleteFileResult}`);
            
            // Test 8: Delete directory
            console.log('[Extension] Test 8: Deleting directory...');
            const deleteDirResult = await aiService.deleteDirectory('test-ai-dir');
            results.push(`✅ Delete directory: ${deleteDirResult}`);
            
            const summary = results.join('\n');
            console.log('[Extension] Comprehensive test completed successfully');
            vscode.window.showInformationMessage(`Comprehensive test completed!\n${summary}`);
            
        } catch (error) {
            console.error('[Extension] Comprehensive test failed:', error);
            vscode.window.showErrorMessage(`Comprehensive test failed: ${error}`);
        }
    });

    let createReactComponentCommand = vscode.commands.registerCommand('curvable-ai-assistant.createReactComponent', async () => {
        try {
            console.log('[Extension] Creating React component...');
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const results: string[] = [];
            
            // Create components directory
            console.log('[Extension] Creating components directory...');
            const dirResult = await aiService.createDirectory('src/components');
            results.push(`✅ Directory: ${dirResult}`);
            
            // Create MyComponent.jsx
            console.log('[Extension] Creating MyComponent.jsx...');
            const componentContent = `import React from 'react';

/**
* MyComponent - A reusable React component
* @param {Object} props - Component props
* @returns {JSX.Element} Rendered component
*/
const MyComponent = ({ title, children }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      <div className="content">
        {children}
      </div>
    </div>
  );
};

// PropTypes for type checking (optional but recommended)
MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default MyComponent;`;
            
            const fileResult = await aiService.createFile('src/components/MyComponent.jsx', componentContent);
            results.push(`✅ File: ${fileResult}`);
            
            const summary = results.join('\n');
            console.log('[Extension] React component created successfully');
            vscode.window.showInformationMessage(`React component created!\n${summary}`);
            
        } catch (error) {
            console.error('[Extension] React component creation failed:', error);
            vscode.window.showErrorMessage(`React component creation failed: ${error}`);
        }
    });

    let createProjectStructureCommand = vscode.commands.registerCommand('curvable-ai-assistant.createProjectStructure', async () => {
        try {
            console.log('[Extension] Creating project structure...');
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const results: string[] = [];
            
            // Create main project structure
            const directories = [
                'project',
                'project/frontend',
                'project/backend',
                'project/frontend/src',
                'project/frontend/public',
                'project/frontend/src/components',
                'project/frontend/src/assets',
                'project/backend/src',
                'project/backend/config',
                'project/backend/routes',
                'project/backend/models'
            ];
            
            for (const dir of directories) {
                console.log(`[Extension] Creating directory: ${dir}`);
                const result = await aiService.createDirectory(dir);
                results.push(`✅ ${result}`);
            }
            
            // Create sample files
            const frontendPackageJson = `{
  "name": "frontend",
  "version": "1.0.0",
  "description": "Frontend application",
  "main": "src/index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-scripts": "5.0.1"
  }
}`;
            
            const backendPackageJson = `{
  "name": "backend",
  "version": "1.0.0",
  "description": "Backend API server",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.15"
  }
}`;
            
            console.log('[Extension] Creating package.json files...');
            const frontendResult = await aiService.createFile('project/frontend/package.json', frontendPackageJson);
            results.push(`✅ ${frontendResult}`);
            
            const backendResult = await aiService.createFile('project/backend/package.json', backendPackageJson);
            results.push(`✅ ${backendResult}`);
            
            const summary = results.join('\n');
            console.log('[Extension] Project structure created successfully');
            vscode.window.showInformationMessage(`Project structure created!\n${summary}`);
            
        } catch (error) {
            console.error('[Extension] Project structure creation failed:', error);
            vscode.window.showErrorMessage(`Project structure creation failed: ${error}`);
        }
    });

    let readProjectFilesCommand = vscode.commands.registerCommand('curvable-ai-assistant.readProjectFiles', async () => {
        try {
            const filePaths = await vscode.window.showInputBox({
                prompt: 'Enter file paths to read (comma-separated):',
                placeHolder: 'e.g., src/index.js, package.json, src/components/App.jsx'
            });

            if (!filePaths) return;

            const files = filePaths.split(',').map(f => f.trim());
            console.log(`[Extension] Reading project files: ${files.join(', ')}`);
            
            const fileContents = await aiService.readProjectFiles(files);
            
            // Show file contents in a new webview
            const panel = vscode.window.createWebviewPanel(
                'projectFiles',
                'Project Files',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            let htmlContent = '<h2>📁 Project Files</h2>';
            for (const [filePath, fileContent] of Object.entries(fileContents)) {
                htmlContent += `<h3>📄 ${filePath}</h3>`;
                htmlContent += `<pre><code>${fileContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
            }

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
                        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
                        code { font-family: 'Monaco', 'Menlo', monospace; }
                    </style>
                </head>
                <body>${htmlContent}</body>
                </html>
            `;

        } catch (error) {
            console.error('[Extension] Error reading project files:', error);
            vscode.window.showErrorMessage(`Failed to read project files: ${error}`);
        }
    });

    let chatWithFilesCommand = vscode.commands.registerCommand('curvable-ai-assistant.chatWithFiles', async () => {
        try {
            const filePaths = await vscode.window.showInputBox({
                prompt: 'Enter file paths to analyze (comma-separated):',
                placeHolder: 'e.g., src/index.js, package.json'
            });

            if (!filePaths) return;

            const prompt = await vscode.window.showInputBox({
                prompt: 'Enter your question about these files:',
                placeHolder: 'e.g., What does this code do? How can I improve it?'
            });

            if (!prompt) return;

            const files = filePaths.split(',').map(f => f.trim());
            console.log(`[Extension] Chatting with files: ${files.join(', ')}`);
            
            // Show progress
            vscode.window.showInformationMessage('Analyzing files with AI...');
            
            const response = await aiService.chatWithFiles(prompt, files);
            
            // Show response in a new webview
            const panel = vscode.window.createWebviewPanel(
                'chatWithFiles',
                'AI Analysis',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
                        .response { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 10px 0; }
                        .files { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <h2>🤖 AI Analysis</h2>
                    <div class="files">
                        <h3>📁 Analyzed Files:</h3>
                        <ul>${files.map(f => `<li>${f}</li>`).join('')}</ul>
                    </div>
                    <div class="response">
                        <h3>💬 Question:</h3>
                        <p>${prompt}</p>
                        <h3>🤖 Answer:</h3>
                        <p>${response.content.replace(/\n/g, '<br>')}</p>
                    </div>
                </body>
                </html>
            `;

        } catch (error) {
            console.error('[Extension] Error chatting with files:', error);
            vscode.window.showErrorMessage(`Failed to analyze files: ${error}`);
        }
    });

    let findRelevantFilesCommand = vscode.commands.registerCommand('curvable-ai-assistant.findRelevantFiles', async () => {
        try {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter search query to find relevant files:',
                placeHolder: 'e.g., react component, api endpoint, configuration'
            });

            if (!query) return;

            console.log(`[Extension] Finding relevant files for: "${query}"`);
            
            const relevantFiles = await aiService.getRelevantFiles(query);
            
            if (relevantFiles.length === 0) {
                vscode.window.showInformationMessage('No relevant files found for your query.');
                return;
            }

            // Show relevant files
            const panel = vscode.window.createWebviewPanel(
                'relevantFiles',
                'Relevant Files',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            let content = `<h2>🔍 Relevant Files for "${query}"</h2>`;
            content += '<ul>';
            for (const file of relevantFiles) {
                content += `<li>📄 ${file}</li>`;
            }
            content += '</ul>';

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
                        ul { list-style: none; padding: 0; }
                        li { padding: 8px 0; border-bottom: 1px solid #eee; }
                    </style>
                </head>
                <body>${content}</body>
                </html>
            `;

        } catch (error) {
            console.error('[Extension] Error finding relevant files:', error);
            vscode.window.showErrorMessage(`Failed to find relevant files: ${error}`);
        }
    });

    let checkAPIStatusCommand = vscode.commands.registerCommand('curvable-ai-assistant.checkAPIStatus', async () => {
        try {
            console.log('[Extension] Checking API status...');
            
            // Show progress
            vscode.window.showInformationMessage('Checking API status...');
            
            // Try a simple API call to test connectivity
            const testResponse = await aiService.chat('Hello', 'API status test');
            
            // If we get here, API is working
            vscode.window.showInformationMessage('✅ API is working correctly! You can use all AI features.');
            
        } catch (error) {
            console.error('[Extension] API status check failed:', error);
            
            // Show detailed error information
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (errorMessage.includes('API Credits Exhausted') || errorMessage.includes('402')) {
                vscode.window.showErrorMessage(`❌ API Credits Exhausted

Your OpenRouter account has run out of credits. Here's how to fix this:

🔧 **Solutions:**
1. **Upgrade your account** at https://openrouter.ai/settings/credits
2. **Wait for credits to refresh** (free accounts get daily credits)
3. **Use alternative commands** that don't require AI:
   - "Curvable AI: Read Project Files"
   - "Curvable AI: Find Relevant Files"
   - "Curvable AI: Create Project Structure"

💡 **Available Commands:**
All file operations still work without AI:
- Create files and folders
- Read project files
- Analyze project structure
- Find relevant files

The AI features will be available again once you have credits!`);
            } else if (errorMessage.includes('Rate Limit')) {
                vscode.window.showWarningMessage(`⚠️ API Rate Limit Exceeded

Please wait a moment before trying again. You can:
1. Wait 1-2 minutes and retry
2. Use the file operation commands instead
3. Check your OpenRouter account status`);
            } else {
                vscode.window.showErrorMessage(`❌ API Connection Issue

Error: ${errorMessage}

🔧 **Troubleshooting:**
1. Check your internet connection
2. Verify your OpenRouter API key
3. Try again in a few minutes
4. Use alternative commands that don't require AI`);
            }
        }
    });

    context.subscriptions.push(
        chatCommand, 
        memoryCommand, 
        learningCommand, 
        explainCodeCommand, 
        generateCodeCommand,
        createFileCommand,
        analyzeProjectCommand,
        suggestActionsCommand,
        analyzeSelectedCodeCommand,
        readSelectedCodeCommand,
        createDirectoryCommand,
        listDirectoryCommand,
        moveFileCommand,
        copyFileCommand,
        testFileCreationCommand,
        comprehensiveTestCommand,
        createReactComponentCommand,
        createProjectStructureCommand,
        readProjectFilesCommand,
        chatWithFilesCommand,
        findRelevantFilesCommand,
        checkAPIStatusCommand
    );

    // Open chat panel in center by default and show welcome message
    setTimeout(() => {
        // Close the welcome page
        vscode.commands.executeCommand('workbench.action.closeAllEditors');
        
        // Open chat in center as main webview panel
        const panel = vscode.window.createWebviewPanel(
            'curvableAIChat',
            '🤖 Curvable AI Chat',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Set the webview content
        panel.webview.html = getMainChatWebviewContent(context.extensionUri, panel.webview, aiService, intentManager);
        
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    try {
                        // Show typing indicator
                        panel.webview.postMessage({
                            type: 'showTyping'
                        });

                        // Get current intent for context
                        const currentIntent = intentManager.getCurrentIntent();
                        let context = currentIntent ? `Current intent: ${currentIntent.description}` : '';

                        // Get selected code context if available
                        const selectedCodeContext = await aiService.getCodeContext();
                        if (selectedCodeContext && selectedCodeContext !== "No code is currently selected.") {
                            context = context ? `${context}\n\n${selectedCodeContext}` : selectedCodeContext;
                        }

                        // Get AI response
                        const response = await aiService.chat(data.message, context);

                        // Hide typing indicator
                        panel.webview.postMessage({
                            type: 'hideTyping'
                        });

                        // Send AI response
                        panel.webview.postMessage({
                            type: 'addMessage',
                            message: {
                                id: Date.now().toString(),
                                text: response.content,
                                sender: 'ai',
                                timestamp: new Date().toISOString(),
                                suggestions: response.suggestions,
                                confidence: response.confidence,
                                actions: response.actions
                            }
                        });
                    } catch (error) {
                        panel.webview.postMessage({
                            type: 'hideTyping'
                        });
                        
                        panel.webview.postMessage({
                            type: 'addMessage',
                            message: {
                                id: Date.now().toString(),
                                text: `Sorry, I encountered an error: ${error}`,
                                sender: 'ai',
                                timestamp: new Date().toISOString(),
                                isError: true
                            }
                        });
                    }
                    break;
                case 'executeAction':
                    try {
                        await executeCodeAction(data.action, aiService);
                        panel.webview.postMessage({
                            type: 'actionExecuted',
                            success: true,
                            action: data.action
                        });
                    } catch (error) {
                        panel.webview.postMessage({
                            type: 'actionExecuted',
                            success: false,
                            error: (error as Error).toString(),
                            action: data.action
                        });
                    }
                    break;
                case 'clearChat':
                    // Handle clear chat if needed
                    break;
                case 'analyzeSelectedCode':
                    try {
                        const analysis = await aiService.analyzeSelectedCode();
                        panel.webview.postMessage({
                            type: 'addMessage',
                            message: {
                                id: Date.now().toString(),
                                text: `🔍 **Code Analysis**\n\n${analysis}`,
                                sender: 'ai',
                                timestamp: new Date().toISOString(),
                                suggestions: [
                                    'Explain this code',
                                    'Suggest improvements',
                                    'Generate similar code',
                                    'Show me alternatives'
                                ]
                            }
                        });
                    } catch (error) {
                        panel.webview.postMessage({
                            type: 'addMessage',
                            message: {
                                id: Date.now().toString(),
                                text: `❌ Error analyzing selected code: ${error}`,
                                sender: 'ai',
                                timestamp: new Date().toISOString(),
                                isError: true
                            }
                        });
                    }
                    break;
                case 'executeActions':
                    try {
                        console.log('[Extension] Executing actions from webview');
                        const actions = await aiService.suggestCodeActions(data.content);
                        console.log(`[Extension] Parsed ${actions.length} actions from webview`);
                        
                        if (actions.length > 0) {
                            for (const action of actions) {
                                console.log(`[Extension] Executing action: ${action.type} - ${action.path}`);
                                await executeCodeAction(action, aiService);
                            }
                            
                            // Send success message back to webview
                            panel.webview.postMessage({
                                type: 'actionsExecuted',
                                success: true,
                                count: actions.length
                            });
                        } else {
                            throw new Error('No actions found to execute');
                        }
                    } catch (error) {
                        console.error('[Extension] Error executing actions from webview:', error);
                        panel.webview.postMessage({
                            type: 'actionsExecuted',
                            success: false,
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                    break;
            }
        });
        
        // Send welcome message after a short delay
        setTimeout(async () => {
            try {
                // Get AI-generated welcome message
                const welcomeResponse = await aiService.chat(
                    "Generate a friendly welcome message for a VS Code AI assistant that can create and edit files like Cursor. Include what I can help with and encourage the user to start chatting. Keep it concise but welcoming.",
                    "Welcome message for new user"
                );
                
                panel.webview.postMessage({
                    type: 'addMessage',
                    message: {
                        id: 'welcome-message',
                        text: welcomeResponse.content,
                        sender: 'ai',
                        timestamp: new Date().toISOString(),
                        suggestions: [
                            'Create a new file',
                            'Show project structure',
                            'Analyze this code',
                            'Generate code for me'
                        ],
                        actions: welcomeResponse.actions
                    }
                });
            } catch (error) {
                // Fallback to static welcome message
                panel.webview.postMessage({
                    type: 'welcomeMessage',
                    workspaceFolders: vscode.workspace.workspaceFolders || []
                });
            }
        }, 500);
    }, 500);
}

async function executeCodeAction(action: CodeAction, aiService: AIService): Promise<void> {
    try {
        console.log(`[Extension] Executing action: ${action.type}`);
        console.log(`[Extension] Action path: ${action.path}`);
        console.log(`[Extension] Action content length: ${action.content?.length || 0}`);
        
        switch (action.type) {
            case 'CREATE_FILE':
                console.log(`[Extension] Creating file: ${action.path}`);
                const result = await aiService.createFile(action.path, action.content || '');
                console.log(`[Extension] File creation result: ${result}`);
                vscode.window.showInformationMessage(result);
                break;
            case 'CREATE_DIRECTORY':
                console.log(`[Extension] Creating directory: ${action.path}`);
                const dirResult = await aiService.createDirectory(action.path);
                console.log(`[Extension] Directory creation result: ${dirResult}`);
                vscode.window.showInformationMessage(dirResult);
                break;
            case 'DELETE_FILE':
                console.log(`[Extension] Deleting file: ${action.path}`);
                const deleteResult = await aiService.deleteFile(action.path);
                console.log(`[Extension] File deletion result: ${deleteResult}`);
                vscode.window.showInformationMessage(deleteResult);
                break;
            case 'DELETE_DIRECTORY':
                console.log(`[Extension] Deleting directory: ${action.path}`);
                const deleteDirResult = await aiService.deleteDirectory(action.path);
                console.log(`[Extension] Directory deletion result: ${deleteDirResult}`);
                vscode.window.showInformationMessage(deleteDirResult);
                break;
            case 'MOVE_FILE':
                console.log(`[Extension] Moving file from ${action.sourcePath} to ${action.destinationPath}`);
                if (action.sourcePath && action.destinationPath) {
                    const moveResult = await aiService.moveFile(action.sourcePath, action.destinationPath);
                    console.log(`[Extension] File move result: ${moveResult}`);
                    vscode.window.showInformationMessage(moveResult);
                } else {
                    vscode.window.showErrorMessage('Source and destination paths are required for move operation');
                }
                break;
            case 'COPY_FILE':
                console.log(`[Extension] Copying file from ${action.sourcePath} to ${action.destinationPath}`);
                if (action.sourcePath && action.destinationPath) {
                    const copyResult = await aiService.copyFile(action.sourcePath, action.destinationPath);
                    console.log(`[Extension] File copy result: ${copyResult}`);
                    vscode.window.showInformationMessage(copyResult);
                } else {
                    vscode.window.showErrorMessage('Source and destination paths are required for copy operation');
                }
                break;
            case 'EDIT_FILE':
                console.log(`[Extension] Editing file: ${action.path}`);
                await aiService.editFile(action.path, action.content || '');
                console.log(`[Extension] File edit completed`);
                vscode.window.showInformationMessage(`File ${action.path} updated successfully`);
                break;
            default:
                console.log(`[Extension] Unknown action type: ${action.type}`);
                vscode.window.showErrorMessage(`Unknown action type: ${action.type}`);
        }
    } catch (error) {
        console.error(`[Extension] Failed to execute action: ${error}`);
        vscode.window.showErrorMessage(`Failed to execute action: ${error}`);
    }
}

function getProjectAnalysisWebviewContent(structure: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Project Analysis</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                    padding: 20px; 
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .structure { 
                    background: var(--vscode-editor-inactiveSelectionBackground); 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 10px 0; 
                    white-space: pre-wrap;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 14px;
                    line-height: 1.5;
                }
                h2 { color: var(--vscode-foreground); }
            </style>
        </head>
        <body>
            <h2>📁 Project Structure Analysis</h2>
            <div class="structure">${structure}</div>
        </body>
        </html>
    `;
}

function getCodeAnalysisWebviewContent(analysis: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Analysis</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                    padding: 20px; 
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .analysis { 
                    background: var(--vscode-editor-inactiveSelectionBackground); 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 10px 0; 
                    white-space: pre-wrap;
                    font-size: 14px;
                    line-height: 1.6;
                }
                h2 { color: var(--vscode-foreground); }
                .header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 15px;
                }
                .icon {
                    font-size: 24px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="icon">🔍</div>
                <h2>Code Analysis</h2>
            </div>
            <div class="analysis">${analysis}</div>
        </body>
        </html>
    `;
}

export function deactivate() {
    console.log('Curvable AI Assistant is now deactivated');
}

function getExplanationWebviewContent(explanation: string, code: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Explanation</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
                .code-block { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .explanation { line-height: 1.6; }
                pre { white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <h2>Code Explanation</h2>
            <div class="code-block">
                <strong>Selected Code:</strong>
                <pre><code>${code}</code></pre>
            </div>
            <div class="explanation">
                <strong>Explanation:</strong>
                <p>${explanation}</p>
            </div>
        </body>
        </html>
    `;
}

function getDebugAnalysisWebviewContent(analysis: string, diagnostics: vscode.Diagnostic[]): string {
    const issuesList = diagnostics.map(d => `
        <li><strong>${d.message}</strong> (Line ${d.range.start.line + 1})</li>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Debug Analysis</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
                .issues { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .analysis { line-height: 1.6; }
            </style>
        </head>
        <body>
            <h2>Debug Analysis</h2>
            <div class="issues">
                <strong>Issues Found:</strong>
                <ul>${issuesList}</ul>
            </div>
            <div class="analysis">
                <strong>Analysis:</strong>
                <p>${analysis}</p>
            </div>
        </body>
        </html>
    `;
}

function getMainChatWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview, aiService: AIService, intentManager: IntentManager) {
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
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    background: var(--vscode-editor-background);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-title {
                    font-weight: 600;
                    font-size: 18px;
                    color: var(--vscode-foreground);
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
                }

                .header-btn {
                    background: transparent;
                    border: 1px solid var(--vscode-button-border);
                    color: var(--vscode-button-foreground);
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .header-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .intent-display {
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    padding: 12px 20px;
                    margin: 16px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    border-left: 4px solid var(--vscode-button-background);
                }

                .chat-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 24px;
                    scroll-behavior: smooth;
                }

                .message {
                    margin-bottom: 20px;
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
                    max-width: 80%;
                    padding: 16px 20px;
                    border-radius: 20px;
                    position: relative;
                    word-wrap: break-word;
                    line-height: 1.5;
                }

                .message.user .message-bubble {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border-bottom-right-radius: 8px;
                }

                .message.ai .message-bubble {
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    color: var(--vscode-editor-foreground);
                    border-bottom-left-radius: 8px;
                }

                .message.error .message-bubble {
                    background: var(--vscode-errorForeground);
                    color: var(--vscode-editor-background);
                }

                .message-timestamp {
                    font-size: 12px;
                    opacity: 0.6;
                    margin-top: 6px;
                    text-align: center;
                }

                .message.user .message-timestamp {
                    text-align: right;
                }

                .message.ai .message-timestamp {
                    text-align: left;
                }

                .suggestions {
                    margin-top: 12px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .suggestion {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .suggestion:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                    transform: translateY(-2px);
                }

                .confidence-indicator {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-left: 10px;
                    background: var(--vscode-debugIcon-startForeground);
                }

                .typing-indicator {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 20px;
                    border-bottom-left-radius: 8px;
                    max-width: 80%;
                    animation: fadeInUp 0.3s ease-out;
                }

                .typing-dots {
                    display: flex;
                    gap: 6px;
                }

                .typing-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--vscode-descriptionForeground);
                    animation: typing 1.4s infinite ease-in-out;
                }

                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }

                .input-container {
                    padding: 20px 24px;
                    border-top: 1px solid var(--vscode-panel-border);
                    background: var(--vscode-editor-background);
                    display: flex;
                    gap: 12px;
                    align-items: flex-end;
                }

                .message-input {
                    flex: 1;
                    padding: 14px 20px;
                    border: 2px solid var(--vscode-input-border);
                    border-radius: 25px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: inherit;
                    font-size: 16px;
                    resize: none;
                    min-height: 50px;
                    max-height: 150px;
                    outline: none;
                    transition: border-color 0.2s ease;
                }

                .message-input:focus {
                    border-color: var(--vscode-focusBorder);
                }

                .send-button {
                    padding: 14px 24px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    min-width: 80px;
                }

                .send-button:hover {
                    background: var(--vscode-button-hoverBackground);
                    transform: translateY(-2px);
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
                    height: 300px;
                    text-align: center;
                    opacity: 0.7;
                }

                .empty-state-icon {
                    font-size: 64px;
                    margin-bottom: 24px;
                    opacity: 0.5;
                }

                .empty-state-text {
                    font-size: 18px;
                    color: var(--vscode-descriptionForeground);
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
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
                    bottom: 100px;
                    right: 30px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    cursor: pointer;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .scroll-to-bottom:hover {
                    background: var(--vscode-button-hoverBackground);
                    transform: scale(1.1);
                }

                .scroll-to-bottom.visible {
                    display: flex;
                }
            </style>
        </head>
        <body>
            <div class="chat-header">
                <div class="header-title">🤖 Curvable AI Chat</div>
                <div class="header-actions">
                    <button class="header-btn" id="clear-chat-btn">Clear Chat</button>
                    <button class="header-btn" id="export-chat-btn">Export Chat</button>
                </div>
            </div>

            <div class="intent-display" id="intent-display">
                No current intent set
            </div>
            
            <div class="chat-container" id="chat-container">
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <div class="empty-state-text">Loading your AI assistant...</div>
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
                scrollBottomBtn.addEventListener('click', scrollToBottom);

                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                messageInput.addEventListener('input', () => {
                    messageInput.style.height = 'auto';
                    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
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
                        case 'welcomeMessage':
                            const workspaceFolders = message.workspaceFolders;
                            const folderNames = workspaceFolders.map(folder => folder.name);
                            const folderList = folderNames.length > 0 
                                ? folderNames.join(', ') 
                                : 'No workspace folders open';

                            const welcomeMessage = \`🎉 **Welcome to Curvable AI Assistant!**

I'm here to help you with your coding tasks. Here's what I can do for you today:

**🚀 Available Actions:**
• **Code Explanation** - Select code and I'll explain how it works
• **Code Generation** - Describe what you want and I'll generate code
• **Chat & Questions** - Ask me anything about programming
• **Learning Mode** - Get detailed explanations of concepts
• **Memory Tracking** - Keep track of your coding intents and progress

**📁 Accessible Folders:**
\${folderList}

**💡 Quick Start:**
• Type your question in the chat box below
• Select code and use "Explain Code" command
• Use "Generate Code" command to create new code
• Check the Memory panel to track your progress

What would you like to work on today?\`;

                            addMessage({
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
                            });
                            break;
                        case 'actionsExecuted':
                            const button = document.querySelector('.execute-actions-btn:disabled');
                            if (button) {
                                if (message.success) {
                                    button.textContent = '✅ Executed!';
                                    button.style.background = 'var(--vscode-notificationsInfo-background)';
                                    
                                    // Show success message
                                    const successMsg = document.createElement('div');
                                    successMsg.textContent = \`✅ Executed \${message.count} actions successfully!\`;
                                    successMsg.className = 'success-message';
                                    successMsg.style.cssText = \`
                                        color: var(--vscode-notificationsInfoIcon-foreground);
                                        background: var(--vscode-notificationsInfo-background);
                                        padding: 8px 12px;
                                        border-radius: 4px;
                                        margin: 10px 0;
                                        font-size: 12px;
                                    \`;
                                    button.parentNode.appendChild(successMsg);
                                } else {
                                    button.textContent = '❌ Failed';
                                    button.style.background = 'var(--vscode-notificationsError-background)';
                                    
                                    // Show error message
                                    const errorMsg = document.createElement('div');
                                    errorMsg.textContent = \`❌ Failed to execute actions: \${message.error}\`;
                                    errorMsg.className = 'error-message';
                                    errorMsg.style.cssText = \`
                                        color: var(--vscode-notificationsErrorIcon-foreground);
                                        background: var(--vscode-notificationsError-background);
                                        padding: 8px 12px;
                                        border-radius: 4px;
                                        margin: 10px 0;
                                        font-size: 12px;
                                    \`;
                                    button.parentNode.appendChild(errorMsg);
                                }
                            }
                            break;
                    }
                });

                // Focus on input when page loads
                messageInput.focus();
            </script>
        </body>
        </html>
    `;
} 