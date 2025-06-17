import './SyntaxGuide.css';

export class SyntaxGuide {
    private container?: HTMLElement;
    private isVisible = false;

    public initialize(parentContainer: HTMLElement): void {
        this.container = parentContainer;
        this.createGuide();
    }

    private createGuide(): void {
        if (!this.container) return;

        const guideHTML = `
            <div id="syntax-guide" class="syntax-guide hidden">
                <div class="guide-overlay"></div>
                <div class="guide-modal">
                    <div class="guide-header">
                        <h1>HackScript Language Guide</h1>
                        <button id="close-guide" class="close-btn">&times;</button>
                    </div>
                    <div class="guide-content">
                        <div class="guide-nav">
                            <button class="nav-btn active" data-section="basics">Basics</button>
                            <button class="nav-btn" data-section="types">Types</button>
                            <button class="nav-btn" data-section="variables">Variables</button>
                            <button class="nav-btn" data-section="functions">Functions</button>
                            <button class="nav-btn" data-section="control">Control Flow</button>
                            <button class="nav-btn" data-section="examples">Examples</button>
                        </div>
                        <div class="guide-sections">
                            <div class="guide-section active" id="section-basics">
                                <h2>Language Basics</h2>
                                <p>HackScript is a statically-typed programming language with modern syntax and powerful features.</p>
                                
                                <h3>Key Features</h3>
                                <ul>
                                    <li><strong>Static Typing:</strong> All variables must have explicit types</li>
                                    <li><strong>Type Safety:</strong> Compile-time type checking prevents runtime errors</li>
                                    <li><strong>Modern Syntax:</strong> Clean, readable syntax inspired by modern languages</li>
                                    <li><strong>Memory Safe:</strong> Automatic memory management</li>
                                </ul>

                                <h3>Comments</h3>
                                <div class="code-block">
                                    <pre><code>// Single line comment

/*
 * Multi-line comment
 * Can span multiple lines
 */</code></pre>
                                </div>

                                <h3>Semicolons</h3>
                                <p>All statements must end with a semicolon (<code>;</code>).</p>
                            </div>

                            <div class="guide-section" id="section-types">
                                <h2>Data Types</h2>
                                <p>HackScript supports several built-in data types:</p>

                                <h3>Primitive Types</h3>
                                <div class="type-grid">
                                    <div class="type-card">
                                        <h4>int</h4>
                                        <p>32-bit signed integers</p>
                                        <div class="code-block">
                                            <pre><code>let age: int = 25;
let negative: int = -10;</code></pre>
                                        </div>
                                    </div>
                                    
                                    <div class="type-card">
                                        <h4>float</h4>
                                        <p>64-bit floating-point numbers</p>
                                        <div class="code-block">
                                            <pre><code>let pi: float = 3.14159;
let temperature: float = -5.5;</code></pre>
                                        </div>
                                    </div>

                                    <div class="type-card">
                                        <h4>string</h4>
                                        <p>UTF-8 encoded text</p>
                                        <div class="code-block">
                                            <pre><code>let name: string = "Alice";
let message: string = 'Hello, World!';</code></pre>
                                        </div>
                                    </div>

                                    <div class="type-card">
                                        <h4>bool</h4>
                                        <p>Boolean values (true/false)</p>
                                        <div class="code-block">
                                            <pre><code>let isActive: bool = true;
let isComplete: bool = false;</code></pre>
                                        </div>
                                    </div>

                                    <div class="type-card">
                                        <h4>char</h4>
                                        <p>Single Unicode character</p>
                                        <div class="code-block">
                                            <pre><code>let initial: char = 'A';
let symbol: char = '@';</code></pre>
                                        </div>
                                    </div>
                                </div>

                                <h3>Collection Types</h3>
                                <div class="code-block">
                                    <pre><code>// Arrays - homogeneous collections
let numbers: Array&lt;int&gt; = [1, 2, 3, 4, 5];
let names: Array&lt;string&gt; = ["Alice", "Bob", "Charlie"];

// Empty arrays
let empty: Array&lt;int&gt; = [];</code></pre>
                                </div>

                                <h3>Nullable Types</h3>
                                <div class="code-block">
                                    <pre><code>// Add ? to make any type nullable
let maybeAge: int? = null;
let optionalName: string? = "Alice";</code></pre>
                                </div>
                            </div>

                            <div class="guide-section" id="section-variables">
                                <h2>Variables</h2>
                                <p>HackScript has two ways to declare variables:</p>

                                <h3>Mutable Variables (let)</h3>
                                <div class="code-block">
                                    <pre><code>// Declare with explicit type
let counter: int = 0;
let name: string = "Alice";

// Modify the value
counter = counter + 1;
name = "Bob";</code></pre>
                                </div>

                                <h3>Immutable Constants (const)</h3>
                                <div class="code-block">
                                    <pre><code>// Must be initialized when declared
const PI: float = 3.14159;
const MAX_SIZE: int = 100;

// This would cause a compile error:
// PI = 3.14; // Error: Cannot assign to const</code></pre>
                                </div>

                                <h3>Type Inference</h3>
                                <p>While types are required, the compiler can often infer them:</p>
                                <div class="code-block">
                                    <pre><code>// Explicit typing (recommended)
let age: int = 25;

// Type inference (compiler determines type)
let count = 42; // inferred as int
let message = "Hello"; // inferred as string</code></pre>
                                </div>
                            </div>

                            <div class="guide-section" id="section-functions">
                                <h2>Functions</h2>
                                <p>Functions are first-class citizens in HackScript with explicit type signatures.</p>

                                <h3>Function Declaration</h3>
                                <div class="code-block">
                                    <pre><code>// Basic function
func greet(name: string) -> string {
    return "Hello, " + name + "!";
}

// Function with multiple parameters
func add(a: int, b: int) -> int {
    return a + b;
}

// Function with no return value
func printMessage(msg: string) -> void {
    print(msg);
}</code></pre>
                                </div>

                                <h3>Parameter Default Values</h3>
                                <div class="code-block">
                                    <pre><code>func greetWithDefault(name: string = "World") -> string {
    return "Hello, " + name + "!";
}

// Call with argument
let msg1: string = greetWithDefault("Alice");

// Call without argument (uses default)
let msg2: string = greetWithDefault();</code></pre>
                                </div>

                                <h3>Built-in Functions</h3>
                                <div class="function-list">
                                    <div class="function-item">
                                        <code>print(...args)</code>
                                        <span>Print values to console</span>
                                    </div>
                                    <div class="function-item">
                                        <code>len(obj: Array&lt;T&gt; | string)</code>
                                        <span>Get length of array or string</span>
                                    </div>
                                    <div class="function-item">
                                        <code>type(obj: any)</code>
                                        <span>Get type name of object</span>
                                    </div>
                                    <div class="function-item">
                                        <code>toString(obj: any)</code>
                                        <span>Convert object to string</span>
                                    </div>
                                    <div class="function-item">
                                        <code>parseInt(str: string)</code>
                                        <span>Parse string to integer</span>
                                    </div>
                                    <div class="function-item">
                                        <code>parseFloat(str: string)</code>
                                        <span>Parse string to float</span>
                                    </div>
                                </div>
                            </div>

                            <div class="guide-section" id="section-control">
                                <h2>Control Flow</h2>
                                <p>HackScript provides familiar control flow structures:</p>

                                <h3>Conditional Statements</h3>
                                <div class="code-block">
                                    <pre><code>// If statement
if (age >= 18) {
    print("You are an adult");
}

// If-else statement
if (score >= 90) {
    print("Excellent!");
} else if (score >= 70) {
    print("Good job!");
} else {
    print("Keep trying!");
}</code></pre>
                                </div>

                                <h3>Loops</h3>
                                <div class="code-block">
                                    <pre><code>// For loop
for (let i: int = 0; i < 10; i++) {
    print("Count: " + toString(i));
}

// While loop
let count: int = 0;
while (count < 5) {
    print("Count: " + toString(count));
    count++;
}</code></pre>
                                </div>

                                <h3>Loop Control</h3>
                                <div class="code-block">
                                    <pre><code>// Break - exit loop early
for (let i: int = 0; i < 10; i++) {
    if (i == 5) {
        break; // Exit when i equals 5
    }
    print(toString(i));
}

// Continue - skip to next iteration
for (let i: int = 0; i < 10; i++) {
    if (i % 2 == 0) {
        continue; // Skip even numbers
    }
    print(toString(i)); // Only prints odd numbers
}</code></pre>
                                </div>
                            </div>

                            <div class="guide-section" id="section-examples">
                                <h2>Complete Examples</h2>

                                <h3>Hello World</h3>
                                <div class="code-block">
                                    <pre><code>// Simple greeting program
const message: string = "Hello, HackScript!";
print(message);</code></pre>
                                </div>

                                <h3>Calculator Function</h3>
                                <div class="code-block">
                                    <pre><code>// Calculator with multiple operations
func calculate(a: float, b: float, operation: string) -> float? {
    if (operation == "add") {
        return a + b;
    } else if (operation == "subtract") {
        return a - b;
    } else if (operation == "multiply") {
        return a * b;
    } else if (operation == "divide") {
        if (b != 0.0) {
            return a / b;
        } else {
            print("Error: Division by zero");
            return null;
        }
    } else {
        print("Error: Unknown operation");
        return null;
    }
}

// Usage
let result: float? = calculate(10.0, 5.0, "divide");
if (result != null) {
    print("Result: " + toString(result));
}</code></pre>
                                </div>

                                <h3>Array Processing</h3>
                                <div class="code-block">
                                    <pre><code>// Working with arrays
func processNumbers(numbers: Array&lt;int&gt;) -> void {
    print("Processing " + toString(len(numbers)) + " numbers:");
    
    let sum: int = 0;
    for (let i: int = 0; i < len(numbers); i++) {
        let num: int = numbers[i];
        sum = sum + num;
        print("Number " + toString(i + 1) + ": " + toString(num));
    }
    
    let average: float = sum / len(numbers);
    print("Sum: " + toString(sum));
    print("Average: " + toString(average));
}

// Usage
const scores: Array&lt;int&gt; = [85, 92, 78, 96, 88];
processNumbers(scores);</code></pre>
                                </div>

                                <h3>Factorial Calculator</h3>
                                <div class="code-block">
                                    <pre><code>// Recursive factorial function
func factorial(n: int) -> int {
    if (n <= 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

// Iterative factorial function
func factorialIterative(n: int) -> int {
    let result: int = 1;
    for (let i: int = 2; i <= n; i++) {
        result = result * i;
    }
    return result;
}

// Usage
const number: int = 5;
print("Factorial of " + toString(number) + " is " + toString(factorial(number)));</code></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert the guide HTML
        this.container.insertAdjacentHTML('beforeend', guideHTML);
        
        // Setup event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        if (!this.container) return;

        // Close button
        const closeBtn = this.container.querySelector('#close-guide');
        closeBtn?.addEventListener('click', () => this.hide());

        // Overlay click to close
        const overlay = this.container.querySelector('.guide-overlay');
        overlay?.addEventListener('click', () => this.hide());

        // Navigation buttons
        const navButtons = this.container.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const section = target.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    private showSection(sectionId: string): void {
        if (!this.container) return;

        // Update navigation
        const navButtons = this.container.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeNavBtn = this.container.querySelector(`[data-section="${sectionId}"]`);
        activeNavBtn?.classList.add('active');

        // Update sections
        const sections = this.container.querySelectorAll('.guide-section');
        sections.forEach(section => section.classList.remove('active'));
        
        const activeSection = this.container.querySelector(`#section-${sectionId}`);
        activeSection?.classList.add('active');
    }

    public show(): void {
        if (!this.container) return;
        
        const guide = this.container.querySelector('#syntax-guide');
        guide?.classList.remove('hidden');
        this.isVisible = true;
        
        // Focus trap
        const modal = this.container.querySelector('.guide-modal') as HTMLElement;
        modal?.focus();
    }

    public hide(): void {
        if (!this.container) return;
        
        const guide = this.container.querySelector('#syntax-guide');
        guide?.classList.add('hidden');
        this.isVisible = false;
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}
