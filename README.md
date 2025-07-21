# 🚀 Curvable AI Assistant - VS Code Extension

A powerful AI-powered coding assistant integrated into VS Code with comprehensive file operations, project analysis, and intelligent error handling.

## ✨ Features

### 🤖 **AI-Powered Assistance**
- **Smart Code Analysis** - Analyze selected code with AI explanations
- **Context-Aware Responses** - AI understands your project structure
- **Intelligent Suggestions** - Get actionable code improvements
- **File Content Analysis** - AI reads and analyzes project files

### 📁 **Comprehensive File Operations**
- **Create Files & Folders** - AI-suggested file creation with content
- **Delete Operations** - Safe file and directory deletion
- **Move & Copy Files** - Intelligent file organization
- **Project Structure** - Complete project setup automation

### 🔧 **Enhanced Error Handling**
- **API Credit Management** - Graceful handling of API limitations
- **Fallback Responses** - Helpful alternatives when AI is unavailable
- **Status Monitoring** - Real-time API connectivity checks
- **User-Friendly Messages** - Clear error explanations and solutions

### 📊 **Project Analysis**
- **Structure Visualization** - Complete project hierarchy analysis
- **File Discovery** - Find relevant files based on queries
- **Content Reading** - Read and analyze multiple files simultaneously
- **Relevance Scoring** - AI-powered file importance ranking

## 🛠️ Installation

### Prerequisites
- VS Code 1.60.0 or higher
- OpenRouter API key (for AI features)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/manavidubey-ds/curvable-vscode-extension.git
   cd curvable-vscode-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile the extension:**
   ```bash
   npm run compile
   ```

4. **Open in VS Code:**
   ```bash
   code .
   ```

5. **Press F5** to launch the extension in a new VS Code window

## 🎯 Usage

### Available Commands

#### **AI Assistant Commands**
- `Curvable AI: Open Chat` - Open AI chat interface
- `Curvable AI: Analyze Selected Code` - Analyze highlighted code
- `Curvable AI: Read Selected Code` - Read and explain selected code
- `Curvable AI: Suggest Actions` - Get AI-suggested file operations

#### **File Operations**
- `Curvable AI: Create Project Structure` - Set up complete project structure
- `Curvable AI: Create React Component` - Generate React components
- `Curvable AI: Test File Creation` - Test file operations
- `Curvable AI: Comprehensive File Test` - Full file system test

#### **Project Analysis**
- `Curvable AI: Read Project Files` - Read and display file contents
- `Curvable AI: Find Relevant Files` - Locate files based on queries
- `Curvable AI: Chat with Files` - AI analysis with file context

#### **System Commands**
- `Curvable AI: Check API Status` - Monitor API connectivity
- `Curvable AI: List Directory` - Browse project structure
- `Curvable AI: Move File` - Move files between locations
- `Curvable AI: Copy File` - Copy files with metadata

### API Configuration

1. **Get OpenRouter API Key:**
   - Visit [OpenRouter](https://openrouter.ai/)
   - Create an account and get your API key

2. **Configure the Extension:**
   - Open VS Code settings
   - Search for "Curvable AI"
   - Enter your OpenRouter API key

## 🔧 Error Handling

### API Credit Issues
When you encounter API credit limitations:

1. **Check Status:** Use "Curvable AI: Check API Status"
2. **Alternative Commands:** Use file operations that don't require AI
3. **Upgrade Account:** Visit [OpenRouter Credits](https://openrouter.ai/settings/credits)

### Fallback Features
Even without AI, these features work:
- ✅ File creation and deletion
- ✅ Project structure analysis
- ✅ File reading and discovery
- ✅ Directory operations

## 📁 Project Structure

```
curvable-vscode-extension/
├── curvable/
│   └── vscode/
│       └── extensions/
│           └── curvable-ai-assistant/
│               ├── src/
│               │   ├── aiService.ts          # AI integration
│               │   ├── extension.ts          # Main extension
│               │   ├── chatProvider.ts       # Chat UI
│               │   └── webview/              # Webview components
│               ├── package.json              # Extension manifest
│               └── README.md                 # Extension docs
├── src/                                      # Test project files
├── package.json                              # Root package.json
└── README.md                                 # This file
```

## 🧪 Testing

### Test Project
A complete test project is included in the repository:

```bash
cd ~/Desktop/test-project
npm install
npm start
```

### Available Test Commands
- **File Operations Test** - Comprehensive file system testing
- **API Connectivity Test** - Verify AI service connectivity
- **Project Analysis Test** - Test project structure analysis
- **Error Handling Test** - Verify fallback mechanisms

## 🔄 Development

### Building
```bash
npm run compile
```

### Watching for Changes
```bash
npm run watch
```

### Testing
```bash
npm test
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'Add amazing feature'`
4. **Push to the branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **VS Code Extension API** - For the excellent extension framework
- **OpenRouter** - For providing AI model access
- **Claude 3.5 Sonnet** - For intelligent code analysis
- **Community Contributors** - For feedback and improvements

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/manavidubey-ds/curvable-vscode-extension/issues)
- **Discussions:** [GitHub Discussions](https://github.com/manavidubey-ds/curvable-vscode-extension/discussions)
- **Documentation:** [Wiki](https://github.com/manavidubey-ds/curvable-vscode-extension/wiki)

## 🚀 Roadmap

- [ ] **Multi-language Support** - Support for more programming languages
- [ ] **Advanced Code Generation** - Template-based code generation
- [ ] **Integration APIs** - Connect with external development tools
- [ ] **Performance Optimization** - Faster file operations and AI responses
- [ ] **Custom Models** - Support for custom AI models
- [ ] **Team Collaboration** - Shared project analysis and suggestions

---

**Made with ❤️ by the Curvable Team**

*Transform your coding experience with AI-powered assistance!* 