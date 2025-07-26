function parseClass(classObject) {
    let out = {"constructors": {}, "methods": {}, "fields": {}};

    for (const [membername, memberObject] of classObject.members){
        let combinedName = memberObject.returnType + " " + membername;

        if (memberObject.returnType == membername.split('::')[1]) {
            // it's a constructor!
            out["constructors"][combinedName] = memberObject.documentation;
        }
        if (membername.includes("(")) {
            // it's a method!
            out["methods"][combinedName] = memberObject.documentation;
        }else{
            // it's a field!
            out["fields"][combinedName] = memberObject.documentation;
        }
    }

    return out;
}

export function parse(namespaceStorage, classStorage) {
    let out = {};

    namespaceStorage.forEach((members, namespace) => {
        out[namespace] = {"classes": {}, "functions": {}, "variables": {}};
        // memberObject of type {returnType, name, documentation}
        members.members.forEach((memberObject, membername) => {
            let combinedName = memberObject.returnType + " " + membername;

            if (membername.includes("(")) {
                // it's a function!
                out[namespace]["functions"][combinedName] = memberObject.documentation;
            }else{
                // it's a variable!
                out[namespace]["variables"][combinedName] = memberObject.documentation;
            }
        })
    })

    // add classes
    classStorage.forEach((classObject, className) => {
        if (className.endsWith('[]')) {
            // skip lists
            return;
        }
        // add to namespace
        out[className.split('::')[0]]["classes"][className.split('::')[1]] = classObject;
    })

    return out;
}

function parseDependencies(dependencies) {
    if (dependencies.length === 0) {
        return "<!-- utilityinfo:no_dependencies -->";
    }else{
        // <!-- utilityinfo:dependencies StringHashMap -->
        return dependencies.map(dep => `<!-- utilityinfo:dependencies ${dep} -->`).join(' ');
    }
}

function parseTags(tags) {
    // <!-- minrdocs:scripting --> <!-- minrdocs:msc --> <!-- minrdocs:github https://github.com/x3a1n4/minr -->
    return tags.map(tag => `<!-- minrdocs:${tag.tag}${tag.text ? ' ${tag.text}' : ''} -->`).join(' ');
}

export function utilityIndexTemplate(name, author, description, dependencies, tags, storage){
    return `${parseTags(tags)}
<!-- utilityinfo:name ${name} -->
<!-- utilityinfo:author ${author} -->
${parseDependencies(dependencies)}
<!-- utilityinfo:description ${description} -->

# ${name}
This is the default generated description for the namespace ${name}. Include code examples, screenshots, ect. here.

## Namespaces
| Namespace                            | Description                    |
| ------------------------------------ | ------------------------------ |
${Object.entries(storage).map((namespace, members) => `| \`${namespace}\` | ${members["documentation"]} |`).join('\n')}
`;
}

export function namespaceIndexTemplate(name, author, description, dependencies, tags, storage) {
    let out = parse(namespaceStorage, classStorage);

    return `${parseTags(tags)}
<!-- utilityinfo:name ${name} -->
<!-- utilityinfo:author ${author} -->
${parseDependencies(dependencies)}
<!-- utilityinfo:description ${description} -->

# ${name}
This is the default generated description for the namespace ${name}. Include code examples, screenshots, ect. here.

## Classes
| Class                               | Description                    |
| ----------------------------------- | ------------------------------ |
${storage[name]["classes"].map((className, classObject) => `| \`[${className}\](${classObject["name"]}.md) | ${classObject["documentation"]} |`).join('\n')}

## Functions
| Function                             | Description                                           |
| ------------------------------------ | ----------------------------------------------------- |
${storage[name]["functions"].map((functionName, functionObject) => `| \`${functionName}\` | ${functionObject["documentation"]} |`).join('\n')}

## Variables
| Variable                                     | Description                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
${storage[name]["variables"].map((variableName, variableObject) => `| \`${variableName}\` | ${variableObject["documentation"]} |`).join('\n')}
`;
}

export function namespaceTemplate(name, namespaceObject) {
    return `
# ${name}
This is the default generated description for the namespace ${name}. Include code examples, screenshots, ect. here.

## Classes
| Class                               | Description                    |
| ----------------------------------- | ------------------------------ |
${Object.entries(namespaceObject["classes"]).map((className, classObject) => `| \`[${className}\](${classObject["name"]}.md) | ${classObject["documentation"]} |`).join('\n')}

## Functions
| Function                             | Description                                           |
| ------------------------------------ | ----------------------------------------------------- |
${Object.entries(namespaceObject["functions"]).map((functionName, functionObject) => `| \`${functionName}\` | ${functionObject["documentation"]} |`).join('\n')}

## Variables
| Variable                                     | Description                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
${Object.entries(namespaceObject["variables"]).map((variableName, variableObject) => `| \`${variableName}\` | ${variableObject["documentation"]} |`).join('\n')}
`;
}

export function classTemplate(className, classObject){
    let out = parseClass(classObject);
    
    return `
# ${className}
This is the default generated description for the class ${className}. Include code examples, screenshots, ect. here.

## Constructors
| Constructor  | Description              |
| ------------ | ------------------------ |
${Object.entries(out["constructors"]).map((constructorName, constructorObject) => `| \`${constructorName}\` | ${constructorObject["documentation"]} |`).join('\n')}

## Methods
| Method                                                  | Description                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
${Object.entries(out["methods"]).map((methodName, methodObject) => `| \`${methodName}\` | ${methodObject["documentation"]} |`).join('\n')}

## Fields
| Field                                                  | Description                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
${Object.entries(out["fields"]).map((fieldName, fieldObject) => `| \`${fieldName}\` | ${fieldObject["documentation"]} |`).join('\n')}
`;
}