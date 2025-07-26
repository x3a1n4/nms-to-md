function parseClass(classObject) {
    let out = {"constructors": {}, "methods": {}, "fields": {}};

    for (const [membername, memberObject] of classObject.members){
        let combinedName = memberObject.returnType + " " + membername;

        if (memberObject.returnType == membername.replace(/\(.*\)/g, '')) {
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

function parseDocs(object) {
    // get if documentation exists, otherwies return empty string
    if (typeof object === 'undefined') {
        return "No documentation";
    }

    return object;
}

function toNamespaceList(object) {
    return Object.entries(object).map(([name, members], i) => {
        return `- [\`${name}\`](${name}/index.md)`;
    }).join('\n')
}

function toTable(object) {
    return Object.entries(object).map(([name, entries], i) => {
        return `| \`${name}\` | ${parseDocs(entries)} |`;
    }).join('\n');
}

function toClassTable(object) {
    return Object.entries(object).map(([name, entries], i) => {
        return `| [\`${name}\`](${entries["name"]}.md) | No description |`;
    }).join('\n');
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
${toNamespaceList(storage)}
`;
}

export function namespaceIndexTemplate(name, author, description, dependencies, tags, storage) {
    // console.log("Generating namespace index");

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
${toClassTable(storage[name]["classes"])}

## Functions
| Function                             | Description                                           |
| ------------------------------------ | ----------------------------------------------------- |
${toTable(storage[name]["functions"])}

## Variables
| Variable                                     | Description                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
${toTable(storage[name]["variables"])}
`;
}

export function namespaceTemplate(name, namespaceObject) {
    // console.log("Generating namespace template");
    return `
# ${name}
This is the default generated description for the namespace ${name}. Include code examples, screenshots, ect. here.

## Classes
| Class                               | Description                    |
| ----------------------------------- | ------------------------------ |
${toClassTable(namespaceObject["classes"])}

## Functions
| Function                             | Description                                           |
| ------------------------------------ | ----------------------------------------------------- |
${toTable(namespaceObject["functions"])}

## Variables
| Variable                                     | Description                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
${toTable(namespaceObject["variables"])}
`;
}

export function classTemplate(className, classObject){
    // console.log("Generating class template");
    let out = parseClass(classObject);
    
    return `
# ${className}
This is the default generated description for the class ${className}. Include code examples, screenshots, ect. here.

## Constructors
| Constructor  | Description              |
| ------------ | ------------------------ |
${toTable(out["constructors"])}

## Methods
| Method                                                  | Description                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
${toTable(out["methods"])}

## Fields
| Field                                                  | Description                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
${toTable(out["fields"])}
`;
}