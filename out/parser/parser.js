// from the minr script extension https://marketplace.visualstudio.com/items?itemName=Lightwood13.msc
// modified to just parse things
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const newLineRegExp = /\r?\n/;
export const namespaceSignatureRegExp = /^\s*@namespace\s+([a-zA-Z][a-zA-Z0-9_]*|__default__)\s*$/;
export const classSignatureRegExp = /^\s*@class\s+([A-Z][a-zA-Z0-9_]*)\s*$/;
export const functionSignatureRegExp = /^\s*(?:((?:[a-zA-Z][a-zA-Z0-9_]*::)?[A-Z][a-zA-Z0-9_]*(?:\[\])?)\s+)?([a-z][a-zA-Z0-9_]*)\s*(\(.*\))\s*$/;
export const constructorSignatureRegExp = /^\s*([A-Z][a-zA-Z0-9_]*)\s*(\(.*\))\s*$/;
export const variableSignatureRegExp = /^\s*((relative\s+)?(final\s+)?(relative\s+)?((?:[a-zA-Z][a-zA-Z0-9_]*::)?[A-Z][a-zA-Z0-9_]*(?:\[\])?)\s+([a-z][a-zA-Z0-9_]*))\s*(=.*)?$/;
const commentRegExp = /^\s*#\s*(.*)\s*$/;
const allowedTypeNameWithNamespaceRegExp = /^([a-zA-Z][a-zA-Z0-9_]*::)?[A-Z][a-zA-Z0-9_]*(\[\])?$/;
const allowedNameRegExp = /^[a-z][a-zA-Z0-9_]*$/;
const firstLineCommentRegExp = /^\s*#(?:.*\()?(\s*,?\s*([a-zA-Z][a-zA-Z0-9_]*::)?[A-Z][a-zA-Z0-9_]*(\[\])?\s+[a-z][a-zA-Z0-9_]*)+(?:\s*\))?\s*$/;
export function parseNamespaceFile(text, namespaceStorage, classStorage) {
    const lines = text.split(newLineRegExp);
    for (let i = 0; i < lines.length; i++) {
        const regExpRes = namespaceSignatureRegExp.exec(lines[i]);
        if (regExpRes === null)
            continue;
        let j = i;
        for (j = i; j < lines.length; j++) {
            if (lines[j].trim() === '@endnamespace')
                break;
        }
        if (j === lines.length)
            break;
        namespaceStorage.set(regExpRes[1], parseNamespace(regExpRes[1], lines.slice(i + 1, j), classStorage));
        i = j;
    }
}
function getArrayClassDefinition(name) {
    const result = [
        `add(${name} value, Int index)`,
        `append(${name} value)`,
        `clear()`,
        `Boolean contains(${name} value)`,
        `Int find(${name} value)`,
        `Int length()`,
        `${name} pop()`,
        `${name} remove(Int index)`,
        `Void reverse()`,
        `Void shuffle()`,
        `String string()`
    ];
    if (['Int', 'Long', 'Float', 'Double'].includes(name)) {
        result.push(`Double avg()`);
        result.push(`${name} sum()`);
    }
    else if (name === 'String') {
        result.push('String concat()');
        result.push('String join(String delimiter)');
    }
    return result;
}
function parseNamespace(name, lines, classStorage) {
    const result = {
        members: new Map(),
    };
    for (let i = 0; i < lines.length; i++) {
        const classRegExpRes = classSignatureRegExp.exec(lines[i]);
        if (classRegExpRes === null) {
            const newMember = parseVariableOrFunctionAtLine(name + '::', lines, i);
            if (newMember === null)
                continue;
            result.members.set(newMember.name, newMember);
            continue;
        }
        const description = parseCommentsAboveLine(lines, i);
        let j = i;
        for (j = i; j < lines.length; j++) {
            if (lines[j].trim() === '@endclass')
                break;
        }
        if (j === lines.length)
            break;
        const className = classRegExpRes[1];
        let classNameWithNamespace = className;
        if (name !== '__default__')
            classNameWithNamespace = name + '::' + className;
        classStorage.set(classNameWithNamespace, parseClass(classNameWithNamespace, lines.slice(i + 1, j)));
        classStorage.set(classNameWithNamespace + '[]', parseClass(classNameWithNamespace + '[]', getArrayClassDefinition(classNameWithNamespace)));
        i = j;
    }
    return result;
}
function parseClass(name, lines) {
    const result = {
        members: new Map(),
    };
    for (let i = 0; i < lines.length; i++) {
        const newMember = parseVariableOrFunctionAtLine(name + '.', lines, i);
        if (newMember !== null) {
            result.members.set(newMember.name, newMember);
        }
    }
    return result;
}
function parseVariableOrFunctionAtLine(namePrefix, lines, line) {
    const functionRegExpRes = functionSignatureRegExp.exec(lines[line]);
    const constructorRegExpRes = constructorSignatureRegExp.exec(lines[line]);
    const variableRegExpRes = variableSignatureRegExp.exec(lines[line]);
    if (functionRegExpRes === null && constructorRegExpRes === null && variableRegExpRes === null)
        return null;
    const description = parseCommentsAboveLine(lines, line);
    const result = {
        returnType: '',
        name: '',
        documentation: undefined
    };
    if (functionRegExpRes !== null) {
        result.name = functionRegExpRes[2] + '()';
        result.returnType = functionRegExpRes[1];
    }
    else if (constructorRegExpRes !== null) {
        result.name = constructorRegExpRes[1] + '()';
        result.returnType = constructorRegExpRes[1];
    }
    else if (variableRegExpRes !== null) {
        result.name = variableRegExpRes[6];
        result.returnType = variableRegExpRes[5];
    }
    if (result.returnType === undefined)
        result.returnType = 'Void';
    if (description.length !== 0) {
        result.documentation = description;
    }
    return result;
}
function parseCommentsAboveLine(lines, line) {
    const descriptionArray = [];
    for (let j = line - 1; j >= 0; j--) {
        const commentRegExpRes = commentRegExp.exec(lines[j]);
        if (commentRegExpRes === null)
            break;
        descriptionArray.push(commentRegExpRes[1]);
    }
    descriptionArray.reverse();
    return descriptionArray.join(' ');
}
// eslint-disable-next-line require-await
export function parseDocument(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {
            variables: new Map(),
            usingDeclarations: [],
        };
        result.variables.set('player', [{
                name: 'player',
                lineDeclared: -1,
                lineUndeclared: undefined,
                type: 'Player',
            }]);
        result.variables.set('block', [{
                name: 'block',
                lineDeclared: -1,
                lineUndeclared: undefined,
                type: 'Block',
            }]);
        const lines = text.split(newLineRegExp);
        if (lines.length !== 0 && firstLineCommentRegExp.test(lines[0])) {
            const openingBracketPos = lines[0].indexOf('(');
            const closingBracketPos = lines[0].indexOf(')');
            const paramListStart = (openingBracketPos === -1) ? lines[0].indexOf('#') : openingBracketPos;
            const paramListEnd = (closingBracketPos === -1) ? lines[0].length : closingBracketPos;
            const params = lines[0].substring(paramListStart + 1, paramListEnd).split(',');
            for (const param of params) {
                const regExpRes = /((?:[a-zA-Z][a-zA-Z0-9_]*::)?[A-Z][a-zA-Z0-9_]*(?:\[\])?)\s+([a-z][a-zA-Z0-9_]*)/.exec(param);
                if (regExpRes === null)
                    continue;
                result.variables.set(regExpRes[2], [{
                        name: regExpRes[2],
                        lineDeclared: 0,
                        lineUndeclared: undefined,
                        type: regExpRes[1]
                    }]);
            }
        }
        const variableStack = [];
        for (let i = 0; i < lines.length; i++) {
            const tokens = lines[i].trim().split(/\s+/);
            if (tokens.length === 0)
                continue;
            if (tokens[0] === '@if') {
                variableStack.push([]);
            }
            else if (tokens.length >= 3 && tokens[0] === '@for') {
                variableStack.push([]);
                if (!allowedTypeNameWithNamespaceRegExp.test(tokens[1]) || !allowedNameRegExp.test(tokens[2]))
                    continue;
                variableStack[variableStack.length - 1].push({
                    name: tokens[2],
                    lineDeclared: i,
                    lineUndeclared: undefined,
                    type: tokens[1]
                });
            }
            else if (tokens[0] === '@fi' || tokens[0] === '@else' || tokens[0] === '@elseif' || tokens[0] === '@done') {
                const lastBlockVariables = variableStack.pop();
                if (lastBlockVariables === undefined)
                    break;
                for (const variable of lastBlockVariables) {
                    variable.lineUndeclared = i;
                    let sameNameVariables = result.variables.get(variable.name);
                    if (sameNameVariables === undefined)
                        sameNameVariables = [];
                    sameNameVariables.push(variable);
                    result.variables.set(variable.name, sameNameVariables);
                }
                if (tokens[0] === '@else' || tokens[0] === '@elseif') {
                    variableStack.push([]);
                }
            }
            if (tokens.length >= 3 && tokens[0] === '@define') {
                if (tokens[2].endsWith('='))
                    tokens[2] = tokens[2].substring(0, tokens[2].length - 1);
                const newVariableInfo = {
                    name: tokens[2],
                    lineDeclared: i,
                    lineUndeclared: undefined,
                    type: tokens[1]
                };
                if (variableStack.length > 0) {
                    variableStack[variableStack.length - 1].push(newVariableInfo);
                }
                else {
                    let sameNameVariables = result.variables.get(newVariableInfo.name);
                    if (sameNameVariables === undefined)
                        sameNameVariables = [];
                    sameNameVariables.push(newVariableInfo);
                    result.variables.set(newVariableInfo.name, sameNameVariables);
                }
            }
            else if (tokens.length === 2 && tokens[0] === '@using')
                result.usingDeclarations.push({
                    lineDeclared: i,
                    namespace: tokens[1]
                });
        }
        return result;
    });
}
//# sourceMappingURL=parser.js.map