import React, { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import * as prettier from 'prettier/standalone'
import * as babelPlugin from 'prettier/plugins/babel'
import * as estreePlugin from 'prettier/plugins/estree'

// Configure Monaco workers to use Node-RED's existing Monaco setup
if (typeof window !== 'undefined') {
  window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
      // Use Node-RED's existing Monaco workers - point to Node-RED port (1880), not UI port
      const protocol = window.location.protocol
      const hostname = window.location.hostname
      const nodeRedPort = 1880 // Node-RED typically runs on port 1880
      const baseUrl = `${protocol}//${hostname}:${nodeRedPort}/vendor/monaco/dist/`
      
      if (label === 'json') {
        return baseUrl + 'json.worker.js'
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return baseUrl + 'css.worker.js'
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return baseUrl + 'html.worker.js'
      }
      if (label === 'typescript' || label === 'javascript') {
        return baseUrl + 'ts.worker.js'
      }
      return baseUrl + 'editor.worker.js'
    }
  }
}

const MonacoEditor = ({ filename, content, onChange }) => {
  const editorRef = useRef(null)

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // Configure Monaco editor theme
    monaco.editor.defineTheme('node-red-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    })

    monaco.editor.setTheme('node-red-dark')

    // Enhanced TypeScript compiler options - optimized for Node-RED context
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      allowJs: true,
      checkJs: true,
      strict: false,
      noImplicitAny: false,
      strictNullChecks: false,
      strictFunctionTypes: false,
      noImplicitReturns: false,
      noImplicitThis: false,
      alwaysStrict: false,
      allowUnreachableCode: true,
      allowUnusedLabels: true,
      skipLibCheck: true,
      skipDefaultLibCheck: false, // Allow default lib to be checked
      allowUmdGlobalAccess: true, // Allow global variable access
      lib: [
        'es2020',
        'dom',
        'dom.iterable'
      ]
    })

    // Enable selective TypeScript validation for undefined variables
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false,
      diagnosticCodesToIgnore: [
        1108, // A 'return' statement can only be used within a function body
        1005, // ';' expected
        1002, // Unterminated string literal
        1003, // Identifier expected
        1109, // Expression expected
        1128, // Declaration or statement expected
        2792, // Cannot find module
        7016, // Could not find a declaration file for module
        7006, // Parameter implicitly has an 'any' type
        7031, // Binding element implicitly has an 'any' type
        2339, // Property does not exist on type
        2551, // Property does not exist on type. Did you mean
        2345, // Argument of type is not assignable to parameter of type
        2322, // Type is not assignable to type
        2531, // Object is possibly 'null'
        2532, // Object is possibly 'undefined'
        18048 // 'this' is of type 'unknown'
        // Keep 2304 (Cannot find name) - this gives us undefined variable errors
      ]
    })

    // Set eager model sync for better responsiveness
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)

    // ESLint-like validation function
    const validateCode = (code, model) => {
      const markers = []
      const lines = code.split('\n')
      
      lines.forEach((line, lineIndex) => {
        const lineNumber = lineIndex + 1
        const trimmedLine = line.trim()
        
        // Check for common JavaScript issues
        
        // Missing semicolons (simplified check)
        
        
        
        // Unused variables (simplified check)
        const varDeclarationMatch = line.match(/(?:var|let|const)\s+(\w+)/g)
        if (varDeclarationMatch) {
          varDeclarationMatch.forEach(match => {
            const varName = match.split(/\s+/)[1]
            if (varName && !['msg', 'node', 'context', 'flow', 'global', 'RED', 'env'].includes(varName)) {
              // Simple check if variable is used elsewhere in code
              const varUsageRegex = new RegExp(`\\b${varName}\\b`, 'g')
              const matches = (code.match(varUsageRegex) || []).length
              if (matches <= 1) { // Only declared, not used
                markers.push({
                  message: `'${varName}' is defined but never used (ESLint: no-unused-vars)`,
                  severity: monaco.MarkerSeverity.Warning,
                  startLineNumber: lineNumber,
                  startColumn: line.indexOf(varName) + 1,
                  endLineNumber: lineNumber,
                  endColumn: line.indexOf(varName) + varName.length + 1,
                  code: 'no-unused-vars'
                })
              }
            }
          })
        }
        
        // Debugger statements
        if (trimmedLine.includes('debugger')) {
          markers.push({
            message: 'Unexpected debugger statement (ESLint: no-debugger)',
            severity: monaco.MarkerSeverity.Warning,
            startLineNumber: lineNumber,
            startColumn: line.indexOf('debugger') + 1,
            endLineNumber: lineNumber,
            endColumn: line.indexOf('debugger') + 'debugger'.length + 1,
            code: 'no-debugger'
          })
        }
        
        // Console statements (informational)
        if (trimmedLine.includes('console.')) {
          markers.push({
            message: 'Unexpected console statement (ESLint: no-console)',
            severity: monaco.MarkerSeverity.Info,
            startLineNumber: lineNumber,
            startColumn: line.indexOf('console') + 1,
            endLineNumber: lineNumber,
            endColumn: line.indexOf('console') + 'console'.length + 1,
            code: 'no-console'
          })
        }
        
        // Equality checks - DISABLED per user request
        // Users often prefer == for loose equality in Node-RED contexts
        
        // Trailing spaces

        
        
        // Multiple empty lines
        
      })
      
      // Set markers on the model
      monaco.editor.setModelMarkers(model, 'eslint', markers)
    }

    // Validate code on changes (debounced)
    let validationTimeout
    const handleCodeChange = () => {
      const model = editor.getModel()
      if (model) {
        clearTimeout(validationTimeout)
        validationTimeout = setTimeout(() => {
          validateCode(model.getValue(), model)
        }, 500) // Debounce validation
      }
    }

    // Initial validation
    setTimeout(() => {
      handleCodeChange()
    }, 1000)

    // Set up change listener for continuous validation
    editor.onDidChangeModelContent(handleCodeChange)

    // Add ONLY Node-RED specific globals - direct declarations for Monaco compatibility
    const nodeRedTypes = `
      // === Node-RED Global Variables ===
      declare var msg: any;
      declare var node: {
        send: (msg: any) => void;
        error: (error: string | Error, msg?: any) => void;
        warn: (warning: string) => void;
        log: (message: string) => void;
        debug: (message: string) => void;
        trace: (message: string) => void;
        status: (status: {fill?: string, shape?: string, text?: string}) => void;
        id: string;
        name: string;
        type: string;
      };
      declare var context: {
        get: (key: string, callback?: (err: any, value: any) => void) => any;
        set: (key: string, value: any, callback?: (err: any) => void) => void;
        keys: (callback?: (err: any, keys: string[]) => void) => string[];
      };
      declare var flow: {
        get: (key: string, callback?: (err: any, value: any) => void) => any;
        set: (key: string, value: any, callback?: (err: any) => void) => void;
        keys: (callback?: (err: any, keys: string[]) => void) => string[];
      };
      declare var global: {
        get: (key: string, callback?: (err: any, value: any) => void) => any;
        set: (key: string, value: any, callback?: (err: any) => void) => void;
        keys: (callback?: (err: any, keys: string[]) => void) => string[];
      };
      declare var RED: any;
      declare var env: {
        get: (name: string) => string;
      };

      // Note: console, JSON, Math, etc. come from TypeScript's built-in lib.d.ts
      // Only Node-RED specific globals are declared above
    `

    monaco.languages.typescript.javascriptDefaults.addExtraLib(nodeRedTypes, 'ts:node-red.d.ts')
    
    console.log('TypeScript validation enabled for undefined variables!')
    console.log('Only Node-RED globals declared - undefined variables like "gg", "someUndefinedVar" should show TypeScript errors')

    // Register Prettier as the document formatter for JavaScript
    const formattingProvider = monaco.languages.registerDocumentFormattingEditProvider('javascript', {
      provideDocumentFormattingEdits: async (model, options, token) => {
        try {
          const code = model.getValue()
          
          // Prettier configuration optimized for Node-RED functions
          const prettierOptions = {
            parser: 'babel',
            plugins: [babelPlugin, estreePlugin],
            semi: true,
            singleQuote: true,
            tabWidth: 2,
            useTabs: false,
            trailingComma: 'es5',
            bracketSpacing: true,
            bracketSameLine: false,
            arrowParens: 'avoid',
            printWidth: 80,
            endOfLine: 'lf',
            quoteProps: 'as-needed'
          }
          
          const formatted = await prettier.format(code, prettierOptions)
          
          // Return the edit that replaces the entire document
          return [
            {
              range: model.getFullModelRange(),
              text: formatted
            }
          ]
        } catch (error) {
          console.error('Prettier formatting error:', error)
          // Return empty array if formatting fails
          return []
        }
      }
    })

    // Also register range formatting for selected text
    const rangeFormattingProvider = monaco.languages.registerDocumentRangeFormattingEditProvider('javascript', {
      provideDocumentRangeFormattingEdits: async (model, range, options, token) => {
        try {
          const code = model.getValueInRange(range)
          
          const prettierOptions = {
            parser: 'babel',
            plugins: [babelPlugin, estreePlugin],
            semi: true,
            singleQuote: true,
            tabWidth: 2,
            useTabs: false,
            trailingComma: 'es5',
            bracketSpacing: true,
            bracketSameLine: false,
            arrowParens: 'avoid',
            printWidth: 80,
            endOfLine: 'lf',
            quoteProps: 'as-needed'
          }
          
          const formatted = await prettier.format(code, prettierOptions)
          
          return [
            {
              range: range,
              text: formatted.trim()
            }
          ]
        } catch (error) {
          console.error('Prettier range formatting error:', error)
          return []
        }
      }
    })

    // Register enhanced completion provider that works alongside built-in TypeScript completion
    const completionProvider = monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['.', ' '],
      provideCompletionItems: (model, position, context) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        // Get current line content for context-aware suggestions
        const lineContent = model.getLineContent(position.lineNumber)
        const textBeforeCursor = lineContent.substring(0, position.column - 1)
        
        // Analyze object structure for intelligent completion
        const getObjectProperties = (objectName, code) => {
          const properties = []
          
          // Look for object literal definitions in the code
          const objectDefRegex = new RegExp(`(?:var|let|const)\\s+\\w+\\s*=\\s*({[\\s\\S]*?${objectName}[\\s\\S]*?});`, 'g')
          const directObjectRegex = new RegExp(`(?:var|let|const)\\s+${objectName}\\s*=\\s*({[\\s\\S]*?});`, 'g')
          const match = objectDefRegex.exec(code) || directObjectRegex.exec(code)
          
          if (match) {
            try {
              // Try to parse as JSON to extract properties
              const objectStr = match[1]
              // Simple property extraction (not full JSON parsing for safety)
              const propMatches = objectStr.match(/"(\w+)":/g)
              if (propMatches) {
                propMatches.forEach(propMatch => {
                  const prop = propMatch.replace(/[":]/g, '')
                  properties.push(prop)
                })
              }
            } catch (e) {
              // If parsing fails, fall back to regex extraction
              const propRegex = /"?(\w+)"?\s*:/g
              let propMatch
              while ((propMatch = propRegex.exec(match[1])) !== null) {
                properties.push(propMatch[1])
              }
            }
          }
          
          // Also look for direct object property assignments
          const assignmentRegex = new RegExp(`${objectName}\\.(\\w+)\\s*=`, 'g')
          let assignMatch
          while ((assignMatch = assignmentRegex.exec(code)) !== null) {
            if (!properties.includes(assignMatch[1])) {
              properties.push(assignMatch[1])
            }
          }
          
          return properties
        }

        // Check if we're accessing a specific object property
        const objectAccessMatch = textBeforeCursor.match(/(\w+(?:\.\w+)*?)\.(\w*)$/)
        const simpleObjectMatch = textBeforeCursor.match(/(\w+)\.$/)
        const isNodeRedContext = /\b(msg|node|context|flow|global|env|RED)\s*\.$/.test(textBeforeCursor)
        
        if (context.triggerCharacter === '.' && (objectAccessMatch || simpleObjectMatch) && !isNodeRedContext) {
          const currentCode = model.getValue()
          let suggestions = []
          
          if (simpleObjectMatch) {
            // Simple case: objectName.
            const objectName = simpleObjectMatch[1]
            const properties = getObjectProperties(objectName, currentCode)
            
            if (properties.length > 0) {
              suggestions = properties.map((prop, index) => ({
                label: prop,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: prop,
                range: range,
                detail: 'object property',
                documentation: { value: `Property of ${objectName}` },
                sortText: `0${String(index).padStart(3, '0')}`
              }))
            }
          } else if (objectAccessMatch) {
            // Nested case: object.property. or complex.path.
            const fullPath = objectAccessMatch[1]
            const pathParts = fullPath.split('.')
            
            if (pathParts.length === 2) {
              // Handle cases like teams.Red. - look for Red properties in teams object
              const [parentObject, childObject] = pathParts
              
              // Look for the parent object definition and extract child object properties
              const parentObjectRegex = new RegExp(`(?:var|let|const)\\s+${parentObject}\\s*=\\s*({[\\s\\S]*?});`, 'g')
              const parentMatch = parentObjectRegex.exec(currentCode)
              
              if (parentMatch) {
                // Look for the specific child object properties
                const childObjectRegex = new RegExp(`"${childObject}"\\s*:\\s*{([^}]*)}`, 'g')
                const childMatch = childObjectRegex.exec(parentMatch[1])
                
                if (childMatch) {
                  const childProps = []
                  const propRegex = /"(\w+)":/g
                  let propMatch
                  while ((propMatch = propRegex.exec(childMatch[1])) !== null) {
                    childProps.push(propMatch[1])
                  }
                  
                  suggestions = childProps.map((prop, index) => ({
                    label: prop,
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: prop,
                    range: range,
                    detail: 'nested object property',
                    documentation: { value: `Property of ${fullPath}` },
                    sortText: `0${String(index).padStart(3, '0')}`
                  }))
                }
              }
            }
          }
          
          if (suggestions.length > 0) {
            return { suggestions }
          }
        }
        
        if (!isNodeRedContext && context.triggerCharacter === '.') {
          // Let built-in TypeScript completion handle other object property completion
          return { suggestions: [] }
        }

        const suggestions = [
          // Node-RED specific completions
          {
            label: 'msg.payload',
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: 'msg.payload',
            range: range,
            detail: 'any',
            documentation: { value: 'The main content of the message' },
            sortText: '0001'
          },
          {
            label: 'msg.topic',
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: 'msg.topic',
            range: range,
            detail: 'string',
            documentation: { value: 'The topic of the message' },
            sortText: '0002'
          },
          {
            label: 'node.send',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'node.send(${1:msg})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(msg: any) => void',
            documentation: { value: 'Send a message to the next node' },
            sortText: '0003'
          },
          {
            label: 'node.error',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'node.error(${1:"error message"}, ${2:msg})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(error: string | Error, msg?: any) => void',
            documentation: { value: 'Log an error message' },
            sortText: '0004'
          },
          {
            label: 'node.warn',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'node.warn(${1:"warning message"})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(warning: string) => void',
            documentation: { value: 'Log a warning message' },
            sortText: '0005'
          },
          {
            label: 'node.log',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'node.log(${1:"message"})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(message: string) => void',
            documentation: { value: 'Log an informational message' },
            sortText: '0006'
          },
          {
            label: 'node.status',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'node.status({fill: "${1|red,green,yellow,blue,grey|}", shape: "${2|ring,dot|}", text: "${3:status text}"})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(status: {fill?: string, shape?: string, text?: string}) => void',
            documentation: { value: 'Set the visual status of the node' },
            sortText: '0007'
          },

          // Context storage with enhanced details
          {
            label: 'context.get',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'context.get("${1:key}")',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(key: string, callback?: Function) => any',
            documentation: { value: 'Get a value from node context storage' },
            sortText: '0008'
          },
          {
            label: 'context.set',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'context.set("${1:key}", ${2:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(key: string, value: any, callback?: Function) => void',
            documentation: { value: 'Set a value in node context storage' },
            sortText: '0009'
          },
          {
            label: 'flow.get',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'flow.get("${1:key}")',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(key: string, callback?: Function) => any',
            documentation: { value: 'Get a value from flow context storage' },
            sortText: '0010'
          },
          {
            label: 'flow.set',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'flow.set("${1:key}", ${2:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(key: string, value: any, callback?: Function) => void',
            documentation: { value: 'Set a value in flow context storage' },
            sortText: '0011'
          },
          {
            label: 'global.get',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'global.get("${1:key}")',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(key: string, callback?: Function) => any',
            documentation: { value: 'Get a value from global context storage' },
            sortText: '0012'
          },
          {
            label: 'global.set',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'global.set("${1:key}", ${2:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: '(key: string, value: any, callback?: Function) => void',
            documentation: { value: 'Set a value in global context storage' },
            sortText: '0013'
          },

          // Enhanced JavaScript snippets
          {
            label: 'for',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3:// code}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'for loop',
            documentation: { value: 'Create a for loop' },
            sortText: '1001'
          },
          {
            label: 'forEach',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '${1:array}.forEach((${2:item}, ${3:index}) => {\n\t${4:// code}\n})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'Array.forEach',
            documentation: { value: 'Iterate over array elements' },
            sortText: '1002'
          },
          {
            label: 'if',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'if statement',
            documentation: { value: 'Conditional statement' },
            sortText: '1003'
          },
          {
            label: 'try',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'try {\n\t${1:// code}\n} catch (${2:error}) {\n\t${3:node.error(error, msg)}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'try-catch block',
            documentation: { value: 'Error handling block' },
            sortText: '1004'
          },
          {
            label: 'async',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'async function ${1:functionName}(${2:params}) {\n\t${3:// code}\n\treturn ${4:result}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'async function',
            documentation: { value: 'Asynchronous function declaration' },
            sortText: '1005'
          },
          {
            label: 'await',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'await ${1:promise}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'await expression',
            documentation: { value: 'Wait for promise resolution' },
            sortText: '1006'
          },
          {
            label: 'Promise',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'new Promise((resolve, reject) => {\n\t${1:// code}\n\tresolve(${2:result})\n})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'Promise constructor',
            documentation: { value: 'Create a new Promise' },
            sortText: '1007'
          },

          // Node-RED specific templates
          {
            label: 'nrfunction',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if (msg.payload) {\n\t// Process the message\n\tmsg.payload = ${1:msg.payload}\n\t\n\t// Send the message\n\treturn msg\n}\n\n// Return null to stop the flow\nreturn null',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'Node-RED function template',
            documentation: { value: 'Basic Node-RED function node template' },
            sortText: '0100'
          },
          {
            label: 'multiout',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if (${1:condition}) {\n\treturn [msg, null] // First output\n} else {\n\treturn [null, msg] // Second output\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'Multiple outputs',
            documentation: { value: 'Route message to different outputs' },
            sortText: '0101'
          }
        ]

        return { suggestions }
      }
    })

    // Enhanced hover provider with rich documentation
    const hoverProvider = monaco.languages.registerHoverProvider('javascript', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position)
        if (!word) return null

        const nodeRedHelp = {
          'msg': {
            title: 'Message Object',
            description: 'The message object passed between nodes containing payload, topic, and other properties.',
            examples: ['msg.payload = "Hello World"', 'msg.topic = "sensor/temperature"', 'msg._msgid // Unique message ID']
          },
          'node': {
            title: 'Node Object',
            description: 'The current node object with methods for sending messages, logging, and status updates.',
            examples: ['node.send(msg)', 'node.error("Error message", msg)', 'node.status({fill:"red", shape:"ring", text:"error"})']
          },
          'context': {
            title: 'Context Storage',
            description: 'Node-scoped persistent storage that survives across message processing.',
            examples: ['context.get("counter")', 'context.set("counter", 0)', 'context.keys()']
          },
          'flow': {
            title: 'Flow Storage',
            description: 'Flow-scoped persistent storage shared between all nodes in the same flow.',
            examples: ['flow.get("sharedData")', 'flow.set("sharedData", data)', 'flow.keys()']
          },
          'global': {
            title: 'Global Storage',
            description: 'Global persistent storage shared across all flows and nodes.',
            examples: ['global.get("settings")', 'global.set("settings", config)', 'global.keys()']
          },
          'RED': {
            title: 'Node-RED Runtime API',
            description: 'The Node-RED runtime API object for advanced operations.',
            examples: ['RED.util.cloneMessage(msg)', 'RED.log.info("Message")', 'RED.settings.get("setting")']
          }
        }

        const help = nodeRedHelp[word.word]
        if (help) {
          return {
            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
            contents: [
              { value: `**${help.title}**` },
              { value: help.description },
              { value: '**Examples:**' },
              { value: help.examples.map(ex => `\`${ex}\``).join('\n\n') }
            ]
          }
        }
        return null
      }
    })

    // Add signature help provider for better parameter hints
    const signatureProvider = monaco.languages.registerSignatureHelpProvider('javascript', {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model, position) => {
        // This would provide parameter hints for functions
        return {
          dispose: () => {},
          value: {
            signatures: [],
            activeSignature: 0,
            activeParameter: 0
          }
        }
      }
    })

    // Add keyboard shortcuts and context menu actions for formatting
    editor.addAction({
      id: 'format-document',
      label: 'Format Document',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI
      ],
      contextMenuGroupId: 'modification',
      contextMenuOrder: 1.5,
      run: function (ed) {
        ed.getAction('editor.action.formatDocument').run()
      }
    })

    // Add a more prominent "Format Document" action to context menu
    editor.addAction({
      id: 'prettier-format',
      label: '🎨 Format with Prettier',
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF
      ],
      contextMenuGroupId: 'modification',
      contextMenuOrder: 1.4,
      run: function (ed) {
        ed.getAction('editor.action.formatDocument').run()
      }
    })
    
    console.log('Monaco Editor with Prettier formatting enabled!')
    console.log('Keyboard shortcuts:')
    console.log('  • Ctrl+Shift+I (or Cmd+Shift+I on Mac) - Format Document')
    console.log('  • Alt+Shift+F - Format with Prettier') 
    console.log('  • Right-click → "Format Document" or "🎨 Format with Prettier"')
    
    // Clean up providers when component unmounts
    editor.onDidDispose(() => {
      completionProvider?.dispose()
      hoverProvider?.dispose()
      signatureProvider?.dispose()
      formattingProvider?.dispose()
      rangeFormattingProvider?.dispose()
    })
  }

  const getLanguage = (filename) => {
    if (!filename) return 'javascript'
    
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js': return 'javascript'
      case 'ts': return 'typescript'
      case 'json': return 'json'
      case 'css': return 'css'
      case 'scss': return 'scss'
      case 'less': return 'less'
      case 'html': return 'html'
      case 'htm': return 'html'
      case 'vue': return 'html'
      case 'xml': return 'xml'
      case 'md': return 'markdown'
      case 'yaml': case 'yml': return 'yaml'
      default: return 'plaintext'
    }
  }

  const defaultContent = filename 
    ? `// Select a file from the sidebar to start editing`
    : `// 🚀 VS Code-Level IntelliSense + ESLint + Prettier Enabled!`


  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={getLanguage(filename)}
        value={content || defaultContent}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="node-red-dark"
        options={{
          automaticLayout: true,
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          cursorStyle: 'line',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible'
          },
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          folding: true,
          foldingHighlight: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'always',
          unfoldOnClickAfterEndOfLine: false,
          bracketPairColorization: { enabled: true },

          // VS Code-level IntelliSense configuration
          suggest: {
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true,
            snippetsPreventQuickSuggestions: false,
            localityBonus: true,
            shareSuggestSelections: true,
            showIcons: true,
            maxVisibleSuggestions: 12,
            showStatusBar: true,
            preview: true,
            previewMode: 'prefix',
            showInlineDetails: true,
            showDetailedLabels: true
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true
          },
          quickSuggestionsDelay: 10,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: true,
          wordBasedSuggestionsOnlySameLanguage: false,
          parameterHints: {
            enabled: true,
            cycle: true
          },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          formatOnPaste: false,  // Disable auto-formatting on paste
          formatOnType: false,   // Disable auto-formatting as you type
          autoClosingOvertype: 'always',
          links: true,
          colorDecorators: true,
          lightbulb: { enabled: true },
          codeActionsOnSave: {},
          inlayHints: { enabled: 'on' },

          // Prettier formatting options
          formatOnSave: false, // Don't auto-format on save (user can trigger manually)
          formatOnPasteAutoIndent: false  // Disable auto-indent on paste
        }}
      />
    </div>
  )
}

export default MonacoEditor 