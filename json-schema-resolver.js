#!/bin/node

import { readFile, writeFile } from 'node:fs/promises';

async function readInputFile() {
    const fileName = process.argv[2];
    const data = await readFile(fileName, "utf-8");
    return JSON.parse(data);
}

await (async function main() {
    try {
        console.log("process arguments: ", process && process.argv);
        const json = await readInputFile();
        const result = resolveAnyRefs(json, json);

        let resultString = JSON.stringify(result, null, 2);
        if(!resultString.includes("$ref")) {
            delete result["$defs"];
            console.log("no more refs");
            resultString = JSON.stringify(result, null, 2);
        }

        await writeFile("output.json", resultString);
    } catch (err) {
        console.error("Error: ", err);
    }
})();

function resolveAnyRefs(current, root, parentReferences) {
    parentReferences ??= [];

    function resolveArray(array, root, parentReferences) {
        for (let index in array) {
            array[index] = resolveAnyRefs(array[index], root, parentReferences);
        }
        return array;
    }

    function resolveObject(obj, root, parentReferences) {
        // Handle references in properties
        for (let key in obj) {
            if (key === "$ref") {
                const reference = obj[key];
                const target = resolveReference(reference, root, parentReferences);
                // ignore any $ref that does not resolve to a target object
                if (Object.prototype.toString.call(target) !== "[object Object]") {
                    console.warn("reference target not an object, possibly due to circular references.", obj[key], target);
                    continue;
                }

                const { $ref, ...remainingProperties } = obj;
                const resolved = { ...remainingProperties, ...target };
                return resolveObject(resolved, root, parentReferences);
            }

            // Remove properties that starts with @xsd - these are fragments from XML Schema Definitions
            if (key.startsWith('@xsd')) {
                delete obj[key];
                continue;
            }

            // resolve any references in properies
            obj[key] = resolveAnyRefs(obj[key], root, parentReferences);
        }
        return obj;
    }

    function resolveReference(reference, root, parentReferences) {
        if (parentReferences.includes(reference)) {
            // this would indicate a circular reference, so return without resolving the reference
            console.warn("Circular reference: ", [ ...parentReferences, reference ]);
            return reference;
        }

        if (!reference.startsWith('#') || reference.startsWith("##")) {
            // expect single # at start of reference to indicate pointer within current document
            return reference;
        }

        const parts = reference.split('/').slice(1);
        let target = root;
        for (let part of parts) {
            target = target?.[part];
        }
        return target;
    }

    if (!current) {
        return current;
    }

    if (Array.isArray(current)) {
        return resolveArray(current, root, parentReferences);
    }

    // is object
    if (Object.prototype.toString.call(current) === "[object Object]") {
        return resolveObject(current, root, parentReferences);
    }

    return current;
}

