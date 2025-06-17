import './styles/global.css';
import { HackScriptEditor } from './components/HackScriptEditor';
import { HackScriptInterpreter } from './interpreter/HackScriptInterpreter';

class App {
    private editor: HackScriptEditor;
    private interpreter: HackScriptInterpreter;

    constructor() {
        this.interpreter = new HackScriptInterpreter();
        this.editor = new HackScriptEditor(this.interpreter);
        this.init();
    }

    private async init() {
        const appElement = document.getElementById('app');
        if (!appElement) {
            throw new Error('App element not found');
        }

        try {
            await this.editor.initialize(appElement);
            console.log('HackScript Editor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize HackScript Editor:', error);
            this.showError('Failed to initialize editor. Please refresh the page.');
        }
    }

    private showError(message: string) {
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">${message}</div>
                </div>
            `;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
