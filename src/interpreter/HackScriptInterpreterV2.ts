import { HackScriptParser, HackScriptTypeSystem, TypeInfo, HackValue, CompileError } from '../language/HackScriptLanguageV2';

export interface ExecutionContext {
    variables: Map<string, { type: TypeInfo; value: any; mutable: boolean }>;
    functions: Map<string, any>;
    parent?: ExecutionContext;
}

export interface ExecutionResult {
    success: boolean;
    result?: any;
    error?: string;
    output?: string[];
    warnings?: string[];
    compileErrors?: CompileError[];
}

export class HackScriptInterpreterV2 {
    private parser: HackScriptParser;
    private globalContext: ExecutionContext;
    private output: string[] = [];
    private warnings: string[] = [];

    constructor() {
        this.parser = new HackScriptParser();
        this.globalContext = {
            variables: new Map(),
            functions: new Map()
        };
        this.initializeBuiltins();
    }

    private initializeBuiltins() {
        // Built-in functions with type signatures
        const builtinFunctions = [
            {
                name: 'print',
                params: [{ name: 'args', type: { name: 'Array<any>', primitive: false, nullable: false } }],
                returnType: { name: 'void', primitive: true, nullable: false },
                implementation: (...args: any[]) => {
                    this.output.push(args.map(arg => this.valueToString(arg)).join(' '));
                }
            },
            {
                name: 'println',
                params: [{ name: 'args', type: { name: 'Array<any>', primitive: false, nullable: false } }],
                returnType: { name: 'void', primitive: true, nullable: false },
                implementation: (...args: any[]) => {
                    this.output.push(args.map(arg => this.valueToString(arg)).join(' '));
                }
            },
            {
                name: 'len',
                params: [{ name: 'obj', type: { name: 'Array<any> | string', primitive: false, nullable: false } }],
                returnType: { name: 'int', primitive: true, nullable: false },
                implementation: (obj: any) => {
                    if (typeof obj === 'string' || Array.isArray(obj)) {
                        return obj.length;
                    }
                    throw new Error('len() requires string or array argument');
                }
            },
            {
                name: 'type',
                params: [{ name: 'obj', type: { name: 'any', primitive: false, nullable: false } }],
                returnType: { name: 'string', primitive: true, nullable: false },
                implementation: (obj: any) => {
                    return this.getValueType(obj).name;
                }
            },
            {
                name: 'toString',
                params: [{ name: 'obj', type: { name: 'any', primitive: false, nullable: false } }],
                returnType: { name: 'string', primitive: true, nullable: false },
                implementation: (obj: any) => {
                    return this.valueToString(obj);
                }
            },
            {
                name: 'parseInt',
                params: [{ name: 'str', type: { name: 'string', primitive: true, nullable: false } }],
                returnType: { name: 'int?', primitive: true, nullable: true },
                implementation: (str: string) => {
                    const result = parseInt(str);
                    return isNaN(result) ? null : result;
                }
            },
            {
                name: 'parseFloat',
                params: [{ name: 'str', type: { name: 'string', primitive: true, nullable: false } }],
                returnType: { name: 'float?', primitive: true, nullable: true },
                implementation: (str: string) => {
                    const result = parseFloat(str);
                    return isNaN(result) ? null : result;
                }
            }
        ];

        builtinFunctions.forEach(func => {
            this.globalContext.functions.set(func.name, func);
        });
    }

    public execute(code: string): ExecutionResult {
        this.output = [];
        this.warnings = [];

        try {
            // Parse the code
            const { ast, errors } = this.parser.parse(code);
            
            if (errors.length > 0) {
                return {
                    success: false,
                    compileErrors: errors,
                    output: [...this.output],
                    warnings: [...this.warnings]
                };
            }

            // Type check the AST
            const typeErrors = this.typeCheck(ast);
            if (typeErrors.length > 0) {
                return {
                    success: false,
                    compileErrors: typeErrors,
                    output: [...this.output],
                    warnings: [...this.warnings]
                };
            }

            // Execute the AST
            const result = this.executeAST(ast, this.globalContext);

            return {
                success: true,
                result: result,
                output: [...this.output],
                warnings: [...this.warnings]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                output: [...this.output],
                warnings: [...this.warnings]
            };
        }
    }

    private typeCheck(ast: any): CompileError[] {
        const errors: CompileError[] = [];
        
        if (ast.type === 'Program') {
            for (const statement of ast.body) {
                errors.push(...this.typeCheckStatement(statement));
            }
        }
        
        return errors;
    }

    private typeCheckStatement(stmt: any): CompileError[] {
        const errors: CompileError[] = [];
        
        switch (stmt.type) {
            case 'VariableDeclaration':
                if (stmt.initializer) {
                    const initType = this.inferType(stmt.initializer);
                    if (!HackScriptTypeSystem.isAssignable(initType, stmt.typeAnnotation)) {
                        errors.push({
                            line: 1,
                            column: 1,
                            message: `Cannot assign ${initType.name} to ${stmt.typeAnnotation.name}`,
                            severity: 'error'
                        });
                    }
                }
                break;
                
            case 'FunctionDeclaration':
                // Type check function body
                errors.push(...this.typeCheckStatement(stmt.body));
                break;
                
            case 'BlockStatement':
                for (const innerStmt of stmt.body) {
                    errors.push(...this.typeCheckStatement(innerStmt));
                }
                break;
                
            case 'ExpressionStatement':
                this.inferType(stmt.expression);
                break;
        }
        
        return errors;
    }

    private inferType(expr: any): TypeInfo {
        switch (expr.type) {
            case 'NumberLiteral':
                return HackScriptTypeSystem.getPrimitiveType(expr.numberType) || 
                       { name: 'int', primitive: true, nullable: false };
                       
            case 'StringLiteral':
                return HackScriptTypeSystem.getPrimitiveType('string')!;
                
            case 'BooleanLiteral':
                return HackScriptTypeSystem.getPrimitiveType('bool')!;
                
            case 'NullLiteral':
                return { name: 'null', primitive: true, nullable: true };
                
            case 'ArrayLiteral':
                if (expr.elements.length === 0) {
                    return { name: 'Array<any>', primitive: false, nullable: false };
                }
                const elementType = this.inferType(expr.elements[0]);
                return HackScriptTypeSystem.createArrayType(elementType);
                
            case 'Identifier':
                const variable = this.globalContext.variables.get(expr.name);
                if (variable) {
                    return variable.type;
                }
                return { name: 'unknown', primitive: false, nullable: false };
                
            case 'BinaryExpression':
                return this.inferBinaryExpressionType(expr);
                
            default:
                return { name: 'unknown', primitive: false, nullable: false };
        }
    }

    private inferBinaryExpressionType(expr: any): TypeInfo {
        const leftType = this.inferType(expr.left);
        const rightType = this.inferType(expr.right);
        
        // Arithmetic operations
        if (['+', '-', '*', '/', '%'].includes(expr.operator)) {
            if (leftType.name === 'float' || rightType.name === 'float') {
                return HackScriptTypeSystem.getPrimitiveType('float')!;
            }
            if (leftType.name === 'int' && rightType.name === 'int') {
                return HackScriptTypeSystem.getPrimitiveType('int')!;
            }
            if (expr.operator === '+' && (leftType.name === 'string' || rightType.name === 'string')) {
                return HackScriptTypeSystem.getPrimitiveType('string')!;
            }
        }
        
        // Comparison operations
        if (['==', '!=', '<', '>', '<=', '>='].includes(expr.operator)) {
            return HackScriptTypeSystem.getPrimitiveType('bool')!;
        }
        
        // Logical operations
        if (['&&', '||'].includes(expr.operator)) {
            return HackScriptTypeSystem.getPrimitiveType('bool')!;
        }
        
        return { name: 'unknown', primitive: false, nullable: false };
    }

    private executeAST(ast: any, context: ExecutionContext): any {
        if (ast.type === 'Program') {
            let result = null;
            for (const statement of ast.body) {
                result = this.executeStatement(statement, context);
            }
            return result;
        }
        
        return this.executeStatement(ast, context);
    }

    private executeStatement(stmt: any, context: ExecutionContext): any {
        switch (stmt.type) {
            case 'VariableDeclaration':
                return this.executeVariableDeclaration(stmt, context);
                
            case 'FunctionDeclaration':
                return this.executeFunctionDeclaration(stmt, context);
                
            case 'ExpressionStatement':
                return this.executeExpression(stmt.expression, context);
                
            case 'BlockStatement':
                return this.executeBlockStatement(stmt, context);
                
            case 'IfStatement':
                return this.executeIfStatement(stmt, context);
                
            case 'ForStatement':
                return this.executeForStatement(stmt, context);
                
            case 'WhileStatement':
                return this.executeWhileStatement(stmt, context);
                
            case 'ReturnStatement':
                return this.executeReturnStatement(stmt, context);
                
            default:
                throw new Error(`Unknown statement type: ${stmt.type}`);
        }
    }

    private executeVariableDeclaration(stmt: any, context: ExecutionContext): void {
        let value = null;
        
        if (stmt.initializer) {
            value = this.executeExpression(stmt.initializer, context);
        } else {
            value = this.getDefaultValue(stmt.typeAnnotation);
        }
        
        context.variables.set(stmt.name, {
            type: stmt.typeAnnotation,
            value: value,
            mutable: stmt.mutable
        });
    }

    private executeFunctionDeclaration(stmt: any, context: ExecutionContext): void {
        context.functions.set(stmt.name, {
            name: stmt.name,
            params: stmt.params,
            returnType: stmt.returnType,
            body: stmt.body,
            isUserDefined: true
        });
    }

    private executeBlockStatement(stmt: any, context: ExecutionContext): any {
        const blockContext: ExecutionContext = {
            variables: new Map(),
            functions: new Map(),
            parent: context
        };
        
        let result = null;
        for (const innerStmt of stmt.body) {
            result = this.executeStatement(innerStmt, blockContext);
        }
        
        return result;
    }

    private executeIfStatement(stmt: any, context: ExecutionContext): any {
        const condition = this.executeExpression(stmt.condition, context);
        
        if (this.isTruthy(condition)) {
            return this.executeStatement(stmt.consequent, context);
        } else if (stmt.alternate) {
            return this.executeStatement(stmt.alternate, context);
        }
        
        return null;
    }

    private executeForStatement(stmt: any, context: ExecutionContext): any {
        const forContext: ExecutionContext = {
            variables: new Map(),
            functions: new Map(),
            parent: context
        };
        
        // Initialize
        this.executeStatement(stmt.init, forContext);
        
        let result = null;
        while (this.isTruthy(this.executeExpression(stmt.condition, forContext))) {
            result = this.executeStatement(stmt.body, forContext);
            this.executeExpression(stmt.update, forContext);
        }
        
        return result;
    }

    private executeWhileStatement(stmt: any, context: ExecutionContext): any {
        let result = null;
        
        while (this.isTruthy(this.executeExpression(stmt.condition, context))) {
            result = this.executeStatement(stmt.body, context);
        }
        
        return result;
    }

    private executeReturnStatement(stmt: any, context: ExecutionContext): any {
        if (stmt.value) {
            return this.executeExpression(stmt.value, context);
        }
        return null;
    }

    private executeExpression(expr: any, context: ExecutionContext): any {
        switch (expr.type) {
            case 'NumberLiteral':
                return expr.value;
                
            case 'StringLiteral':
                return expr.value;
                
            case 'BooleanLiteral':
                return expr.value;
                
            case 'NullLiteral':
                return null;
                
            case 'ArrayLiteral':
                return expr.elements.map((elem: any) => this.executeExpression(elem, context));
                
            case 'ObjectLiteral':
                const obj: any = {};
                for (const prop of expr.properties) {
                    obj[prop.key] = this.executeExpression(prop.value, context);
                }
                return obj;
                
            case 'Identifier':
                return this.resolveVariable(expr.name, context);
                
            case 'BinaryExpression':
                return this.executeBinaryExpression(expr, context);
                
            case 'UnaryExpression':
                return this.executeUnaryExpression(expr, context);
                
            case 'AssignmentExpression':
                return this.executeAssignmentExpression(expr, context);
                
            case 'FunctionCall':
                return this.executeFunctionCall(expr, context);
                
            case 'ArrayAccess':
                return this.executeArrayAccess(expr, context);
                
            case 'PropertyAccess':
                return this.executePropertyAccess(expr, context);
                
            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }

    private executeBinaryExpression(expr: any, context: ExecutionContext): any {
        const left = this.executeExpression(expr.left, context);
        const right = this.executeExpression(expr.right, context);
        
        switch (expr.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '%': return left % right;
            case '==': return left === right;
            case '!=': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '&&': return left && right;
            case '||': return left || right;
            default:
                throw new Error(`Unknown binary operator: ${expr.operator}`);
        }
    }

    private executeUnaryExpression(expr: any, context: ExecutionContext): any {
        const operand = this.executeExpression(expr.operand, context);
        
        switch (expr.operator) {
            case '-': return -operand;
            case '!': return !operand;
            case '++': return operand + 1;
            case '--': return operand - 1;
            default:
                throw new Error(`Unknown unary operator: ${expr.operator}`);
        }
    }

    private executeAssignmentExpression(expr: any, context: ExecutionContext): any {
        const value = this.executeExpression(expr.right, context);
        
        if (expr.left.type === 'Identifier') {
            const variable = this.resolveVariableReference(expr.left.name, context);
            if (!variable.mutable) {
                throw new Error(`Cannot assign to immutable variable: ${expr.left.name}`);
            }
            variable.value = value;
        }
        
        return value;
    }

    private executeFunctionCall(expr: any, context: ExecutionContext): any {
        const funcName = expr.callee.name;
        const args = expr.arguments.map((arg: any) => this.executeExpression(arg, context));
        
        const func = this.resolveFunction(funcName, context);
        if (!func) {
            throw new Error(`Unknown function: ${funcName}`);
        }
        
        if (func.implementation) {
            return func.implementation(...args);
        } else if (func.isUserDefined) {
            return this.executeUserFunction(func, args, context);
        }
        
        throw new Error(`Cannot execute function: ${funcName}`);
    }

    private executeUserFunction(func: any, args: any[], context: ExecutionContext): any {
        const funcContext: ExecutionContext = {
            variables: new Map(),
            functions: new Map(),
            parent: context
        };
        
        // Bind parameters
        for (let i = 0; i < func.params.length; i++) {
            const param = func.params[i];
            const value = i < args.length ? args[i] : 
                         param.defaultValue ? this.executeExpression(param.defaultValue, context) :
                         this.getDefaultValue(param.type);
            
            funcContext.variables.set(param.name, {
                type: param.type,
                value: value,
                mutable: true
            });
        }
        
        return this.executeStatement(func.body, funcContext);
    }

    private executeArrayAccess(expr: any, context: ExecutionContext): any {
        const array = this.executeExpression(expr.object, context);
        const index = this.executeExpression(expr.index, context);
        
        if (!Array.isArray(array)) {
            throw new Error('Array access on non-array value');
        }
        
        if (typeof index !== 'number' || index < 0 || index >= array.length) {
            throw new Error('Array index out of bounds');
        }
        
        return array[index];
    }

    private executePropertyAccess(expr: any, context: ExecutionContext): any {
        const object = this.executeExpression(expr.object, context);
        const property = expr.property;
        
        if (object === null || object === undefined) {
            throw new Error('Property access on null or undefined');
        }
        
        return object[property];
    }

    private resolveVariable(name: string, context: ExecutionContext): any {
        let currentContext: ExecutionContext | undefined = context;
        
        while (currentContext) {
            const variable = currentContext.variables.get(name);
            if (variable) {
                return variable.value;
            }
            currentContext = currentContext.parent;
        }
        
        throw new Error(`Undefined variable: ${name}`);
    }

    private resolveVariableReference(name: string, context: ExecutionContext): any {
        let currentContext: ExecutionContext | undefined = context;
        
        while (currentContext) {
            const variable = currentContext.variables.get(name);
            if (variable) {
                return variable;
            }
            currentContext = currentContext.parent;
        }
        
        throw new Error(`Undefined variable: ${name}`);
    }

    private resolveFunction(name: string, context: ExecutionContext): any {
        let currentContext: ExecutionContext | undefined = context;
        
        while (currentContext) {
            const func = currentContext.functions.get(name);
            if (func) {
                return func;
            }
            currentContext = currentContext.parent;
        }
        
        return null;
    }

    private getDefaultValue(type: TypeInfo): any {
        switch (type.name) {
            case 'int': return 0;
            case 'float': return 0.0;
            case 'string': return '';
            case 'bool': return false;
            case 'char': return '\0';
            default:
                if (type.nullable) return null;
                return null;
        }
    }

    private getValueType(value: any): TypeInfo {
        if (value === null) {
            return { name: 'null', primitive: true, nullable: true };
        }
        
        switch (typeof value) {
            case 'number':
                return Number.isInteger(value) ? 
                    HackScriptTypeSystem.getPrimitiveType('int')! :
                    HackScriptTypeSystem.getPrimitiveType('float')!;
            case 'string':
                return HackScriptTypeSystem.getPrimitiveType('string')!;
            case 'boolean':
                return HackScriptTypeSystem.getPrimitiveType('bool')!;
            default:
                if (Array.isArray(value)) {
                    return { name: 'Array<any>', primitive: false, nullable: false };
                }
                return { name: 'object', primitive: false, nullable: false };
        }
    }

    private isTruthy(value: any): boolean {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        return true;
    }

    private valueToString(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return value;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (Array.isArray(value)) {
            return '[' + value.map(v => this.valueToString(v)).join(', ') + ']';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }

    public clearEnvironment(): void {
        this.globalContext.variables.clear();
        this.globalContext.functions.clear();
        this.initializeBuiltins();
        this.output = [];
        this.warnings = [];
    }

    public getVariables(): Array<{ name: string; type: string; value: any; mutable: boolean }> {
        const result: Array<{ name: string; type: string; value: any; mutable: boolean }> = [];
        
        for (const [name, variable] of this.globalContext.variables) {
            result.push({
                name,
                type: variable.type.name,
                value: variable.value,
                mutable: variable.mutable
            });
        }
        
        return result;
    }

    public getFunctions(): Array<{ name: string; signature: string }> {
        const result: Array<{ name: string; signature: string }> = [];
        
        for (const [name, func] of this.globalContext.functions) {
            if (func.isUserDefined) {
                const params = func.params.map((p: any) => `${p.name}: ${p.type.name}`).join(', ');
                result.push({
                    name,
                    signature: `func ${name}(${params}) -> ${func.returnType.name}`
                });
            }
        }
        
        return result;
    }
}
