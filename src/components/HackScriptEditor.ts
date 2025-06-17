import * as monaco from 'monaco-editor';
import { HackScriptInterpreter, ExecutionResult } from '../interpreter/HackScriptInterpreter';
import { HackScriptLanguage } from '../language/HackScriptLanguage';
import './HackScriptEditor.css';

export class HackScriptEditor {
    private editor?: monaco.editor.IStandaloneCodeEditor;
    private interpreter: HackScriptInterpreter;
    private container?: HTMLElement;
    private outputContainer?: HTMLElement;
    private isRunning = false;

    constructor(interpreter: HackScriptInterpreter) {
        this.interpreter = interpreter;
    }

    public async initialize(container: HTMLElement): Promise<void> {
        this.container = container;
        
        // Register HackScript language
        HackScriptLanguage.register();
        
        // Create the editor layout
        this.createLayout();
        
        // Initialize Monaco Editor
        await this.initializeEditor();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    private createLayout(): void {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="hackscript-editor">
                <header class="editor-header">
                    <div class="header-left">
                        <div class="logo">
                            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="currentColor" stroke-width="2" fill="none"/>
                                <circle cx="16" cy="16" r="3" fill="currentColor"/>
                            </svg>
                            <span>HackScript Editor</span>
                        </div>
                    </div>
                    <div class="header-right">
                        <button id="run-btn" class="btn btn-primary">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                            </svg>
                            Run Code
                        </button>
                        <button id="clear-btn" class="btn">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                            Clear
                        </button>
                        <button id="example-btn" class="btn">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
                            </svg>
                            Examples
                        </button>
                    </div>
                </header>
                <div class="editor-body">
                    <div class="editor-panel">
                        <div class="panel-header">
                            <span>Code Editor</span>
                            <div class="panel-actions">
                                <span class="file-info">main.hack</span>
                            </div>
                        </div>
                        <div id="monaco-editor" class="monaco-container"></div>
                    </div>
                    <div class="output-panel">
                        <div class="panel-header">
                            <span>Output</span>
                            <div class="panel-actions">
                                <button id="clear-output-btn" class="btn-small">Clear</button>
                            </div>
                        </div>
                        <div id="output" class="output-container"></div>
                    </div>
                </div>
                <div class="status-bar">
                    <div class="status-left">
                        <span class="status-item">HackScript v1.0</span>
                        <span class="status-item">Ready</span>
                    </div>
                    <div class="status-right">
                        <span class="status-item" id="cursor-position">Ln 1, Col 1</span>
                    </div>
                </div>
            </div>
        `;

        this.outputContainer = this.container.querySelector('#output') as HTMLElement;
    }

    private async initializeEditor(): Promise<void> {
        const editorContainer = this.container?.querySelector('#monaco-editor') as HTMLElement;
        if (!editorContainer) {
            throw new Error('Editor container not found');
        }        // Configure Monaco Editor
        this.editor = monaco.editor.create(editorContainer, {
            value: this.getDefaultCode(),
            language: HackScriptLanguage.LANGUAGE_ID,
            theme: 'hackscript-dark',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: '"Cascadia Code", "Fira Code", "Monaco", "Consolas", monospace',
            fontLigatures: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            roundedSelection: false,
            renderWhitespace: 'selection',
            cursorStyle: 'line',
            cursorBlinking: 'blink',
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            showFoldingControls: 'always',
            bracketPairColorization: { enabled: true },
            guides: {
                bracketPairs: true,
                indentation: true
            }
        });

        // Update cursor position
        this.editor.onDidChangeCursorPosition((e) => {
            const positionElement = this.container?.querySelector('#cursor-position');
            if (positionElement) {
                positionElement.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
            }
        });
    }

    private setupEventListeners(): void {
        if (!this.container) return;

        // Run button
        const runBtn = this.container.querySelector('#run-btn') as HTMLButtonElement;
        runBtn?.addEventListener('click', () => this.runCode());

        // Clear button
        const clearBtn = this.container.querySelector('#clear-btn') as HTMLButtonElement;
        clearBtn?.addEventListener('click', () => this.clearEditor());

        // Example button
        const exampleBtn = this.container.querySelector('#example-btn') as HTMLButtonElement;
        exampleBtn?.addEventListener('click', () => this.showExamples());

        // Clear output button
        const clearOutputBtn = this.container.querySelector('#clear-output-btn') as HTMLButtonElement;
        clearOutputBtn?.addEventListener('click', () => this.clearOutput());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
        });
    }

    private getDefaultCode(): string {
        return `// Welcome to HackScript!
// This is a simple programming language that runs in your browser.

// Print a message
print("Hello, HackScript!")

// Variables
name = "World"
age = 25
pi = 3.14159

print("Name:", name)
print("Age:", age)
print("Pi:", pi)

// Arrays
numbers = [1, 2, 3, 4, 5]
print("Numbers:", numbers)
print("Array length:", len(numbers))

// Simple calculations
result = age * 2
print("Double age:", result)

// Type checking
print("Type of name:", type(name))
print("Type of age:", type(age))
print("Type of numbers:", type(numbers))

// Try running this code with Ctrl+Enter or the Run button!`;
    }

    private async runCode(): Promise<void> {
        if (!this.editor || this.isRunning) return;

        this.isRunning = true;
        this.updateStatus('Running...');
        
        const runBtn = this.container?.querySelector('#run-btn') as HTMLButtonElement;
        if (runBtn) {
            runBtn.disabled = true;
            runBtn.innerHTML = `
                <div class="spinner-small"></div>
                Running...
            `;
        }

        try {
            const code = this.editor.getValue();
            const result: ExecutionResult = this.interpreter.execute(code);
            
            this.displayResult(result);
        } catch (error) {
            this.displayError(error instanceof Error ? error.message : String(error));
        } finally {
            this.isRunning = false;
            this.updateStatus('Ready');
            
            if (runBtn) {
                runBtn.disabled = false;
                runBtn.innerHTML = `
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                    </svg>
                    Run Code
                `;
            }
        }
    }

    private displayResult(result: ExecutionResult): void {
        if (!this.outputContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const outputHtml = `
            <div class="output-entry ${result.success ? 'success' : 'error'}">
                <div class="output-header">
                    <span class="output-timestamp">${timestamp}</span>
                    <span class="output-status">${result.success ? 'Success' : 'Error'}</span>
                </div>
                <div class="output-content">
                    ${result.success ? 
                        (result.output && result.output.length > 0 ? 
                            result.output.map(line => `<div class="output-line">${this.escapeHtml(line)}</div>`).join('') :
                            '<div class="output-line">Program executed successfully (no output)</div>'
                        ) :
                        `<div class="error-line">${this.escapeHtml(result.error || 'Unknown error')}</div>`
                    }
                </div>
            </div>
        `;

        this.outputContainer.innerHTML += outputHtml;
        this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
    }

    private displayError(error: string): void {
        this.displayResult({
            success: false,
            error: error,
            output: []
        });
    }

    private clearEditor(): void {
        if (this.editor) {
            this.editor.setValue('');
            this.editor.focus();
        }
    }

    private clearOutput(): void {
        if (this.outputContainer) {
            this.outputContainer.innerHTML = '';
        }
    }

    private showExamples(): void {
        const examples = [
            {
                name: 'Hello World',
                code: 'print("Hello, World!")'
            },
            {
                name: 'Variables & Math',
                code: `x = 10
y = 20
sum = x + y
print("Sum:", sum)`
            },
            {
                name: 'Arrays',
                code: `fruits = ["apple", "banana", "orange"]
print("Fruits:", fruits)
print("First fruit:", fruits[0])
print("Number of fruits:", len(fruits))`
            },
            {
                name: 'String Operations',
                code: `name = "HackScript"
print("Language:", name)
print("Length:", len(name))
print("Type:", type(name))`
            }
        ];

        // Create example selector (simplified for now)
        if (this.editor) {
            this.editor.setValue(examples[0].code);
        }
    }

    private updateStatus(status: string): void {
        const statusElement = this.container?.querySelector('.status-left .status-item:last-child');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
