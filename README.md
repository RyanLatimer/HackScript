# HackScript Editor

A beautiful, modern web-based code editor for the HackScript programming language. Built with TypeScript, Monaco Editor, and featuring a custom interpreter that runs entirely in the browser.

## Features

- 🎨 **Beautiful Modern UI** - Dark theme with syntax highlighting
- ⚡ **Fast Performance** - Runs entirely in the browser
- 🔧 **Monaco Editor Integration** - Full-featured code editor with IntelliSense
- 🌐 **Custom Language** - HackScript with its own syntax and interpreter
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎯 **Real-time Execution** - Instant code execution and output
- 📚 **Built-in Examples** - Learn HackScript with interactive examples

## HackScript Language Features

### Basic Data Types
- Numbers: `42`, `3.14`
- Strings: `"Hello, World!"`
- Booleans: `true`, `false`
- Arrays: `[1, 2, 3, "hello"]`
- Null: `null`

### Variables
```hackscript
name = "Alice"
age = 25
scores = [85, 92, 78]
```

### Built-in Functions
- `print(...)` - Output values to console
- `len(obj)` - Get length of strings or arrays
- `type(obj)` - Get type of an object
- `input(prompt)` - Get user input (planned)

### Examples

#### Hello World
```hackscript
print("Hello, HackScript!")
```

#### Variables and Math
```hackscript
x = 10
y = 20
result = x + y
print("Sum:", result)
```

#### Working with Arrays
```hackscript
fruits = ["apple", "banana", "orange"]
print("Fruits:", fruits)
print("Count:", len(fruits))
```

#### Type Checking
```hackscript
value = 42
print("Type:", type(value))  // Output: number
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hackscript-editor.git
cd hackscript-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
hackscript-editor/
├── src/
│   ├── components/          # UI components
│   │   ├── HackScriptEditor.ts
│   │   └── HackScriptEditor.css
│   ├── interpreter/         # HackScript interpreter
│   │   └── HackScriptInterpreter.ts
│   ├── language/           # Language definition
│   │   └── HackScriptLanguage.ts
│   ├── styles/             # Global styles
│   │   └── global.css
│   └── main.ts             # Application entry point
├── examples/               # Example HackScript files
├── public/                 # Static assets
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Architecture

### Components
- **HackScriptEditor**: Main editor component with Monaco integration
- **HackScriptInterpreter**: Custom interpreter for executing HackScript code
- **HackScriptLanguage**: Language definition and syntax highlighting

### Technology Stack
- **TypeScript**: Type-safe JavaScript
- **Monaco Editor**: VS Code's editor component
- **Vite**: Fast build tool and dev server
- **CSS Custom Properties**: Modern styling approach

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Roadmap

### Language Features (Planned)
- [ ] Control flow (if/else, loops)
- [ ] Functions and function calls
- [ ] Objects and object properties
- [ ] Error handling
- [ ] Import/export system
- [ ] Standard library functions

### Editor Features (Planned)
- [ ] File management (save/load)
- [ ] Multiple tabs
- [ ] Find and replace
- [ ] Code formatting
- [ ] Debugging support
- [ ] Plugin system

### UI Improvements (Planned)
- [ ] Customizable themes
- [ ] Split view
- [ ] Minimap toggle
- [ ] Settings panel
- [ ] Export functionality

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Monaco Editor team for the excellent code editor
- TypeScript team for the language and tooling
- Vite team for the build tool
- The open source community for inspiration and tools

---

**Built with ❤️ for the developer community**
