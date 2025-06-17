export interface HackScriptValue {
    type: 'number' | 'string' | 'boolean' | 'null' | 'function' | 'object' | 'array';
    value: any;
}

export interface HackScriptVariable {
    name: string;
    value: HackScriptValue;
    readonly?: boolean;
}

export interface HackScriptFunction {
    name: string;
    params: string[];
    body: string;
}

export interface ExecutionResult {
    success: boolean;
    result?: any;
    error?: string;
    output?: string[];
}

export class HackScriptInterpreter {
    private variables: Map<string, HackScriptVariable> = new Map();
    private functions: Map<string, HackScriptFunction> = new Map();
    private output: string[] = [];

    constructor() {
        this.initializeBuiltins();
    }

    private initializeBuiltins() {
        // Built-in print function
        this.functions.set('print', {
            name: 'print',
            params: ['...args'],
            body: 'builtin'
        });

        // Built-in input function
        this.functions.set('input', {
            name: 'input',
            params: ['prompt'],
            body: 'builtin'
        });

        // Built-in len function
        this.functions.set('len', {
            name: 'len',
            params: ['obj'],
            body: 'builtin'
        });

        // Built-in type function
        this.functions.set('type', {
            name: 'type',
            params: ['obj'],
            body: 'builtin'
        });
    }

    public execute(code: string): ExecutionResult {
        this.output = [];
        
        try {
            const lines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
            
            for (const line of lines) {
                this.executeLine(line.trim());
            }

            return {
                success: true,
                output: [...this.output]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                output: [...this.output]
            };
        }
    }

    private executeLine(line: string) {
        // Variable assignment
        if (line.includes('=') && !line.includes('==') && !line.includes('!=')) {
            this.executeAssignment(line);
        }
        // Function call
        else if (line.includes('(') && line.includes(')')) {
            this.executeFunctionCall(line);
        }
        // Control structures
        else if (line.startsWith('if ')) {
            this.executeIf(line);
        }
        else if (line.startsWith('for ')) {
            this.executeFor(line);
        }
        else if (line.startsWith('while ')) {
            this.executeWhile(line);
        }
        // Function definition
        else if (line.startsWith('func ')) {
            this.executeFunctionDefinition(line);
        }
        else {
            throw new Error(`Unknown statement: ${line}`);
        }
    }

    private executeAssignment(line: string) {
        const parts = line.split('=');
        if (parts.length !== 2) {
            throw new Error(`Invalid assignment: ${line}`);
        }

        const varName = parts[0].trim();
        const valueExpr = parts[1].trim();
        const value = this.evaluateExpression(valueExpr);

        this.variables.set(varName, {
            name: varName,
            value: value
        });
    }

    private executeFunctionCall(line: string) {
        const funcMatch = line.match(/^(\w+)\((.*)\)$/);
        if (!funcMatch) {
            throw new Error(`Invalid function call: ${line}`);
        }

        const funcName = funcMatch[1];
        const argsStr = funcMatch[2];
        const args = argsStr ? this.parseArguments(argsStr) : [];

        if (funcName === 'print') {
            const printArgs = args.map(arg => this.valueToString(arg));
            this.output.push(printArgs.join(' '));
        } else if (funcName === 'len') {
            if (args.length !== 1) {
                throw new Error('len() takes exactly one argument');
            }
            const arg = args[0];
            if (arg.type === 'string') {
                return { type: 'number', value: arg.value.length };
            } else if (arg.type === 'array') {
                return { type: 'number', value: arg.value.length };
            } else {
                throw new Error('len() argument must be string or array');
            }
        } else if (funcName === 'type') {
            if (args.length !== 1) {
                throw new Error('type() takes exactly one argument');
            }
            return { type: 'string', value: args[0].type };
        } else {
            throw new Error(`Unknown function: ${funcName}`);
        }
    }

    private executeFunctionDefinition(line: string) {
        // func name(param1, param2) { ... }
        const funcMatch = line.match(/^func\s+(\w+)\s*\(([^)]*)\)\s*\{(.+)\}$/);
        if (!funcMatch) {
            throw new Error(`Invalid function definition: ${line}`);
        }

        const funcName = funcMatch[1];
        const paramsStr = funcMatch[2];
        const body = funcMatch[3];
        const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];

        this.functions.set(funcName, {
            name: funcName,
            params: params,
            body: body
        });
    }    private executeIf(_line: string) {
        // Basic if statement parsing
        throw new Error('If statements not yet implemented');
    }

    private executeFor(_line: string) {
        // Basic for loop parsing
        throw new Error('For loops not yet implemented');
    }

    private executeWhile(_line: string) {
        // Basic while loop parsing
        throw new Error('While loops not yet implemented');
    }

    private evaluateExpression(expr: string): HackScriptValue {
        expr = expr.trim();

        // String literal
        if (expr.startsWith('"') && expr.endsWith('"')) {
            return { type: 'string', value: expr.slice(1, -1) };
        }

        // Number literal
        if (/^-?\d+(\.\d+)?$/.test(expr)) {
            return { type: 'number', value: parseFloat(expr) };
        }

        // Boolean literal
        if (expr === 'true') {
            return { type: 'boolean', value: true };
        }
        if (expr === 'false') {
            return { type: 'boolean', value: false };
        }

        // Null literal
        if (expr === 'null') {
            return { type: 'null', value: null };
        }

        // Variable reference
        if (this.variables.has(expr)) {
            return this.variables.get(expr)!.value;
        }

        // Array literal
        if (expr.startsWith('[') && expr.endsWith(']')) {
            const elementsStr = expr.slice(1, -1);
            const elements = elementsStr ? this.parseArguments(elementsStr) : [];
            return { type: 'array', value: elements };
        }

        throw new Error(`Unknown expression: ${expr}`);
    }

    private parseArguments(argsStr: string): HackScriptValue[] {
        if (!argsStr.trim()) return [];
        
        const args: HackScriptValue[] = [];
        let current = '';
        let inQuotes = false;
        let parenCount = 0;

        for (let i = 0; i < argsStr.length; i++) {
            const char = argsStr[i];
            
            if (char === '"' && (i === 0 || argsStr[i-1] !== '\\')) {
                inQuotes = !inQuotes;
                current += char;
            } else if (char === '(' && !inQuotes) {
                parenCount++;
                current += char;
            } else if (char === ')' && !inQuotes) {
                parenCount--;
                current += char;
            } else if (char === ',' && !inQuotes && parenCount === 0) {
                args.push(this.evaluateExpression(current.trim()));
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            args.push(this.evaluateExpression(current.trim()));
        }

        return args;
    }

    private valueToString(value: HackScriptValue): string {
        switch (value.type) {
            case 'string':
                return value.value;
            case 'number':
                return value.value.toString();
            case 'boolean':
                return value.value ? 'true' : 'false';
            case 'null':
                return 'null';
            case 'array':
                return '[' + value.value.map((v: HackScriptValue) => this.valueToString(v)).join(', ') + ']';
            case 'object':
                return JSON.stringify(value.value);
            default:
                return String(value.value);
        }
    }

    public getVariables(): HackScriptVariable[] {
        return Array.from(this.variables.values());
    }

    public getFunctions(): HackScriptFunction[] {
        return Array.from(this.functions.values()).filter(f => f.body !== 'builtin');
    }

    public clearEnvironment() {
        this.variables.clear();
        this.functions.clear();
        this.initializeBuiltins();
        this.output = [];
    }
}
