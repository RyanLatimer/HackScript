// HackScript Language Specification v2.0
// A statically-typed, modern programming language with unique syntax

import * as monaco from 'monaco-editor';

export interface TypeInfo {
    name: string;
    primitive: boolean;
    nullable: boolean;
    genericParams?: TypeInfo[];
}

export interface VariableDeclaration {
    name: string;
    type: TypeInfo;
    value?: HackValue;
    mutable: boolean;
    scope: 'global' | 'local' | 'function';
}

export interface FunctionSignature {
    name: string;
    params: Array<{ name: string; type: TypeInfo; defaultValue?: HackValue }>;
    returnType: TypeInfo;
    isAsync: boolean;
    isGeneric: boolean;
    genericConstraints?: Record<string, TypeInfo[]>;
}

export interface HackValue {
    type: TypeInfo;
    value: any;
}

export interface CompileError {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export class HackScriptTypeSystem {
    private static primitiveTypes = new Map<string, TypeInfo>([
        ['int', { name: 'int', primitive: true, nullable: false }],
        ['float', { name: 'float', primitive: true, nullable: false }],
        ['string', { name: 'string', primitive: true, nullable: false }],
        ['bool', { name: 'bool', primitive: true, nullable: false }],
        ['char', { name: 'char', primitive: true, nullable: false }],
        ['void', { name: 'void', primitive: true, nullable: false }],
    ]);

    public static getPrimitiveType(name: string): TypeInfo | undefined {
        return this.primitiveTypes.get(name);
    }

    public static isAssignable(from: TypeInfo, to: TypeInfo): boolean {
        if (from.name === to.name) return true;
        
        // Numeric type coercion
        if (from.name === 'int' && to.name === 'float') return true;
        
        // Nullable type handling
        if (to.nullable && !from.nullable) return true;
        
        return false;
    }

    public static createArrayType(elementType: TypeInfo): TypeInfo {
        return {
            name: `Array<${elementType.name}>`,
            primitive: false,
            nullable: false,
            genericParams: [elementType]
        };
    }

    public static createNullableType(baseType: TypeInfo): TypeInfo {
        return {
            ...baseType,
            nullable: true,
            name: `${baseType.name}?`
        };
    }
}

export class HackScriptParser {
    private tokens: string[] = [];
    private position = 0;
    private errors: CompileError[] = [];
    
    public parse(code: string): { ast: any; errors: CompileError[] } {
        this.tokens = this.tokenize(code);
        this.position = 0;
        this.errors = [];
        
        const ast = this.parseProgram();
        return { ast, errors: this.errors };
    }

    private tokenize(code: string): string[] {
        // Enhanced tokenizer for static typing
        const tokenRegex = /(\s+|\/\/.*|\/\*[\s\S]*?\*\/|==|!=|<=|>=|&&|\|\||::|->|=|<|>|\+|-|\*|\/|%|\(|\)|{|}|\[|\]|;|,|:|"|'|\w+|\d+\.?\d*|.)/g;
        return code.match(tokenRegex)?.filter(t => !t.match(/^\s+$/) && !t.match(/^\/\//)) || [];
    }

    private parseProgram(): any {
        const statements = [];
        
        while (this.position < this.tokens.length) {
            try {
                const stmt = this.parseStatement();
                if (stmt) statements.push(stmt);
            } catch (error) {
                this.errors.push({
                    line: 1,
                    column: this.position,
                    message: error instanceof Error ? error.message : String(error),
                    severity: 'error'
                });
                this.position++; // Skip problematic token
            }
        }
        
        return { type: 'Program', body: statements };
    }

    private parseStatement(): any {
        const token = this.currentToken();
        
        if (token === 'let' || token === 'const') {
            return this.parseVariableDeclaration();
        } else if (token === 'func') {
            return this.parseFunctionDeclaration();
        } else if (token === 'if') {
            return this.parseIfStatement();
        } else if (token === 'for') {
            return this.parseForStatement();
        } else if (token === 'while') {
            return this.parseWhileStatement();
        } else if (token === 'return') {
            return this.parseReturnStatement();
        } else {
            return this.parseExpressionStatement();
        }
    }

    private parseVariableDeclaration(): any {
        const keyword = this.consume(); // 'let' or 'const'
        const name = this.consume();
        
        this.expect(':');
        const type = this.parseType();
        
        let initializer = null;
        if (this.currentToken() === '=') {
            this.consume(); // '='
            initializer = this.parseExpression();
        }
        
        this.expect(';');
        
        return {
            type: 'VariableDeclaration',
            keyword,
            name,
            typeAnnotation: type,
            initializer,
            mutable: keyword === 'let'
        };
    }

    private parseFunctionDeclaration(): any {
        this.consume(); // 'func'
        const name = this.consume();
        
        this.expect('(');
        const params = this.parseParameterList();
        this.expect(')');
        
        this.expect('->');
        const returnType = this.parseType();
        
        this.expect('{');
        const body = this.parseBlockStatement();
        this.expect('}');
        
        return {
            type: 'FunctionDeclaration',
            name,
            params,
            returnType,
            body
        };
    }

    private parseType(): TypeInfo {
        let baseType = this.consume();
        
        // Handle generic types like Array<int>
        if (this.currentToken() === '<') {
            this.consume(); // '<'
            const genericParams = [];
            
            do {
                genericParams.push(this.parseType());
                if (this.currentToken() === ',') {
                    this.consume();
                }
            } while (this.currentToken() !== '>');
            
            this.expect('>');
            
            return {
                name: `${baseType}<${genericParams.map(p => p.name).join(', ')}>`,
                primitive: false,
                nullable: false,
                genericParams
            };
        }
        
        // Handle nullable types like int?
        const nullable = this.currentToken() === '?';
        if (nullable) {
            this.consume(); // '?'
            baseType += '?';
        }
        
        return {
            name: baseType,
            primitive: HackScriptTypeSystem.getPrimitiveType(baseType.replace('?', '')) !== undefined,
            nullable
        };
    }

    private parseParameterList(): Array<{ name: string; type: TypeInfo; defaultValue?: any }> {
        const params = [];
        
        while (this.currentToken() !== ')') {
            const name = this.consume();
            this.expect(':');
            const type = this.parseType();
            
            let defaultValue = undefined;
            if (this.currentToken() === '=') {
                this.consume(); // '='
                defaultValue = this.parseExpression();
            }
            
            params.push({ name, type, defaultValue });
            
            if (this.currentToken() === ',') {
                this.consume();
            }
        }
        
        return params;
    }

    private parseBlockStatement(): any {
        const statements = [];
        
        while (this.currentToken() !== '}' && this.position < this.tokens.length) {
            const stmt = this.parseStatement();
            if (stmt) statements.push(stmt);
        }
        
        return { type: 'BlockStatement', body: statements };
    }

    private parseIfStatement(): any {
        this.consume(); // 'if'
        this.expect('(');
        const condition = this.parseExpression();
        this.expect(')');
        this.expect('{');
        const consequent = this.parseBlockStatement();
        this.expect('}');
        
        let alternate = null;
        if (this.currentToken() === 'else') {
            this.consume(); // 'else'
            if (this.currentToken() === 'if') {
                alternate = this.parseIfStatement();
            } else {
                this.expect('{');
                alternate = this.parseBlockStatement();
                this.expect('}');
            }
        }
        
        return {
            type: 'IfStatement',
            condition,
            consequent,
            alternate
        };
    }

    private parseForStatement(): any {
        this.consume(); // 'for'
        this.expect('(');
        
        const init = this.parseVariableDeclaration();
        const condition = this.parseExpression();
        this.expect(';');
        const update = this.parseExpression();
        
        this.expect(')');
        this.expect('{');
        const body = this.parseBlockStatement();
        this.expect('}');
        
        return {
            type: 'ForStatement',
            init,
            condition,
            update,
            body
        };
    }

    private parseWhileStatement(): any {
        this.consume(); // 'while'
        this.expect('(');
        const condition = this.parseExpression();
        this.expect(')');
        this.expect('{');
        const body = this.parseBlockStatement();
        this.expect('}');
        
        return {
            type: 'WhileStatement',
            condition,
            body
        };
    }

    private parseReturnStatement(): any {
        this.consume(); // 'return'
        
        let value = null;
        if (this.currentToken() !== ';') {
            value = this.parseExpression();
        }
        
        this.expect(';');
        
        return {
            type: 'ReturnStatement',
            value
        };
    }

    private parseExpressionStatement(): any {
        const expression = this.parseExpression();
        this.expect(';');
        return {
            type: 'ExpressionStatement',
            expression
        };
    }

    private parseExpression(): any {
        return this.parseAssignmentExpression();
    }

    private parseAssignmentExpression(): any {
        let left = this.parseLogicalOrExpression();
        
        if (this.currentToken() === '=') {
            this.consume(); // '='
            const right = this.parseAssignmentExpression();
            return {
                type: 'AssignmentExpression',
                left,
                right
            };
        }
        
        return left;
    }

    private parseLogicalOrExpression(): any {
        let left = this.parseLogicalAndExpression();
        
        while (this.currentToken() === '||') {
            const operator = this.consume();
            const right = this.parseLogicalAndExpression();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }
        
        return left;
    }

    private parseLogicalAndExpression(): any {
        let left = this.parseEqualityExpression();
        
        while (this.currentToken() === '&&') {
            const operator = this.consume();
            const right = this.parseEqualityExpression();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }
        
        return left;
    }

    private parseEqualityExpression(): any {
        let left = this.parseRelationalExpression();
        
        while (['==', '!='].includes(this.currentToken())) {
            const operator = this.consume();
            const right = this.parseRelationalExpression();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }
        
        return left;
    }

    private parseRelationalExpression(): any {
        let left = this.parseAdditiveExpression();
        
        while (['<', '>', '<=', '>='].includes(this.currentToken())) {
            const operator = this.consume();
            const right = this.parseAdditiveExpression();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }
        
        return left;
    }

    private parseAdditiveExpression(): any {
        let left = this.parseMultiplicativeExpression();
        
        while (['+', '-'].includes(this.currentToken())) {
            const operator = this.consume();
            const right = this.parseMultiplicativeExpression();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }
        
        return left;
    }

    private parseMultiplicativeExpression(): any {
        let left = this.parseUnaryExpression();
        
        while (['*', '/', '%'].includes(this.currentToken())) {
            const operator = this.consume();
            const right = this.parseUnaryExpression();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }
        
        return left;
    }

    private parseUnaryExpression(): any {
        if (['-', '!', '++', '--'].includes(this.currentToken())) {
            const operator = this.consume();
            const operand = this.parseUnaryExpression();
            return {
                type: 'UnaryExpression',
                operator,
                operand
            };
        }
        
        return this.parsePostfixExpression();
    }

    private parsePostfixExpression(): any {
        let left = this.parsePrimaryExpression();
        
        while (true) {
            if (this.currentToken() === '[') {
                this.consume(); // '['
                const index = this.parseExpression();
                this.expect(']');
                left = {
                    type: 'ArrayAccess',
                    object: left,
                    index
                };
            } else if (this.currentToken() === '(') {
                this.consume(); // '('
                const args = this.parseArgumentList();
                this.expect(')');
                left = {
                    type: 'FunctionCall',
                    callee: left,
                    arguments: args
                };
            } else if (this.currentToken() === '.') {
                this.consume(); // '.'
                const property = this.consume();
                left = {
                    type: 'PropertyAccess',
                    object: left,
                    property
                };
            } else {
                break;
            }
        }
        
        return left;
    }

    private parseArgumentList(): any[] {
        const args = [];
        
        while (this.currentToken() !== ')') {
            args.push(this.parseExpression());
            
            if (this.currentToken() === ',') {
                this.consume();
            }
        }
        
        return args;
    }

    private parsePrimaryExpression(): any {
        const token = this.currentToken();
        
        if (token === '(') {
            this.consume(); // '('
            const expr = this.parseExpression();
            this.expect(')');
            return expr;
        } else if (token === '[') {
            return this.parseArrayLiteral();
        } else if (token === '{') {
            return this.parseObjectLiteral();
        } else if (token === '"' || token === "'") {
            return this.parseStringLiteral();
        } else if (/^\d+\.?\d*$/.test(token)) {
            return this.parseNumberLiteral();
        } else if (token === 'true' || token === 'false') {
            return this.parseBooleanLiteral();
        } else if (token === 'null') {
            this.consume();
            return { type: 'NullLiteral' };
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
            return this.parseIdentifier();
        } else {
            throw new Error(`Unexpected token: ${token}`);
        }
    }

    private parseArrayLiteral(): any {
        this.consume(); // '['
        const elements = [];
        
        while (this.currentToken() !== ']') {
            elements.push(this.parseExpression());
            
            if (this.currentToken() === ',') {
                this.consume();
            }
        }
        
        this.expect(']');
        return { type: 'ArrayLiteral', elements };
    }

    private parseObjectLiteral(): any {
        this.consume(); // '{'
        const properties = [];
        
        while (this.currentToken() !== '}') {
            const key = this.consume();
            this.expect(':');
            const value = this.parseExpression();
            
            properties.push({ key, value });
            
            if (this.currentToken() === ',') {
                this.consume();
            }
        }
        
        this.expect('}');
        return { type: 'ObjectLiteral', properties };
    }

    private parseStringLiteral(): any {
        const quote = this.consume();
        let value = '';
        
        while (this.currentToken() !== quote) {
            value += this.consume();
        }
        
        this.expect(quote);
        return { type: 'StringLiteral', value };
    }

    private parseNumberLiteral(): any {
        const token = this.consume();
        const value = token.includes('.') ? parseFloat(token) : parseInt(token);
        const numberType = token.includes('.') ? 'float' : 'int';
        
        return {
            type: 'NumberLiteral',
            value,
            numberType
        };
    }

    private parseBooleanLiteral(): any {
        const value = this.consume() === 'true';
        return { type: 'BooleanLiteral', value };
    }

    private parseIdentifier(): any {
        const name = this.consume();
        return { type: 'Identifier', name };
    }

    private currentToken(): string {
        return this.tokens[this.position] || '';
    }

    private consume(): string {
        return this.tokens[this.position++] || '';
    }

    private expect(expected: string): void {
        const token = this.consume();
        if (token !== expected) {
            throw new Error(`Expected '${expected}', got '${token}'`);
        }
    }
}

// Monaco Editor Integration
export class HackScriptMonacoLanguage {
    public static readonly LANGUAGE_ID = 'hackscript';

    public static register(): void {
        // Register the language
        monaco.languages.register({ id: this.LANGUAGE_ID });

        // Set language configuration
        monaco.languages.setLanguageConfiguration(this.LANGUAGE_ID, {
            comments: {
                lineComment: '//',
                blockComment: ['/*', '*/']
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ]
        });

        // Set syntax highlighting rules
        monaco.languages.setMonarchTokensProvider(this.LANGUAGE_ID, {
            keywords: [
                'func', 'mut', 'let', 'if', 'else', 'for', 'while', 'return',
                'break', 'continue', 'struct', 'enum', 'impl', 'import', 'export',
                'async', 'await', 'try', 'catch', 'throw', 'match', 'case', 'default',
                'int', 'float', 'string', 'bool', 'char', 'void', 'any'
            ],
            
            operators: [
                '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
                '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
                '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
                '%=', '<<=', '>>=', '>>>='
            ],

            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

            tokenizer: {
                root: [
                    // identifiers and keywords
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                    [/[A-Z][\w\$]*/, 'type.identifier'],

                    // whitespace
                    { include: '@whitespace' },

                    // delimiters and operators
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>](?!@symbols)/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],

                    // numbers
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                    [/\d+/, 'number'],

                    // delimiter: after number because of .\d floats
                    [/[;,.]/, 'delimiter'],

                    // strings
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                    [/'[^\\']'/, 'string'],
                    [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                    [/'/, 'string.invalid']
                ],

                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\/\*/, 'comment', '@push'],
                    ["\\*/", 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],

                string: [
                    [/[^\\"]+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment'],
                ],
            },
        });        // Set completion provider with static typing support
        monaco.languages.registerCompletionItemProvider(this.LANGUAGE_ID, {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                
                const suggestions: monaco.languages.CompletionItem[] = [                    // Keywords
                    {
                        label: 'func',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: 'func ${1:name}(${2:params}): ${3:type} {\n\t${4}\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Define a function with static typing',
                        range: range
                    },
                    {
                        label: 'let',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: 'let ${1:name}: ${2:type} = ${3:value};',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Declare an immutable variable with type annotation',
                        range: range
                    },
                    {
                        label: 'mut',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: 'mut ${1:name}: ${2:type} = ${3:value};',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Declare a mutable variable with type annotation',
                        range: range
                    },                    {
                        label: 'if',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: 'if (${1:condition}) {\n\t${2}\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Conditional statement',
                        range: range
                    },
                    {
                        label: 'for',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: 'for (${1:i}: int = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3}\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'For loop with type annotations',
                        range: range
                    },
                    {
                        label: 'while',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: 'while (${1:condition}) {\n\t${2}\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'While loop',
                        range: range
                    },
                    // Types
                    {
                        label: 'int',
                        kind: monaco.languages.CompletionItemKind.TypeParameter,
                        insertText: 'int',
                        documentation: 'Integer type',
                        range: range
                    },
                    {
                        label: 'float',
                        kind: monaco.languages.CompletionItemKind.TypeParameter,
                        insertText: 'float',
                        documentation: 'Floating point number type',
                        range: range
                    },
                    {
                        label: 'string',
                        kind: monaco.languages.CompletionItemKind.TypeParameter,
                        insertText: 'string',
                        documentation: 'String type',
                        range: range
                    },
                    {
                        label: 'bool',
                        kind: monaco.languages.CompletionItemKind.TypeParameter,
                        insertText: 'bool',
                        documentation: 'Boolean type',
                        range: range
                    },
                    {
                        label: 'char',
                        kind: monaco.languages.CompletionItemKind.TypeParameter,
                        insertText: 'char',
                        documentation: 'Character type',
                        range: range
                    },
                    {
                        label: 'void',
                        kind: monaco.languages.CompletionItemKind.TypeParameter,
                        insertText: 'void',
                        documentation: 'Void type (no return value)',
                        range: range
                    },
                    // Built-in functions
                    {
                        label: 'print',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'print(${1:value})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Print a value to the output',
                        range: range
                    },
                    {
                        label: 'println',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'println(${1:value})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Print a value with a newline',
                        range: range
                    },
                    {
                        label: 'input',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'input(${1:prompt})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Get user input',
                        range: range
                    },
                    {
                        label: 'typeof',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'typeof(${1:value})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Get the type of a value',
                        range: range
                    }
                ];

                return { suggestions };
            }
        });

        // Set custom theme
        monaco.editor.defineTheme('hackscript-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '#569cd6', fontStyle: 'bold' },
                { token: 'type.identifier', foreground: '#4ec9b0', fontStyle: 'bold' },
                { token: 'identifier', foreground: '#d4d4d4' },
                { token: 'string', foreground: '#ce9178' },
                { token: 'number', foreground: '#b5cea8' },
                { token: 'number.float', foreground: '#b5cea8' },
                { token: 'number.hex', foreground: '#b5cea8' },
                { token: 'comment', foreground: '#6a9955', fontStyle: 'italic' },
                { token: 'operator', foreground: '#d4d4d4' },
                { token: 'delimiter', foreground: '#d4d4d4' }
            ],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#d4d4d4',
                'editor.lineHighlightBackground': '#2d2d30',
                'editor.selectionBackground': '#264f78',
                'editor.inactiveSelectionBackground': '#3a3d41'
            }
        });
    }
}
