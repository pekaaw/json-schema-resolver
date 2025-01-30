# json-schema-refs-resolver

This program will mainly resolve $ref properties in a json schema.
The main objective is to take json schema that has been auto generated from an XML, and make it easier to read by removing all keys that starts with @xsd and resolve any references inside the schema (except for circular dependencies).

## How to use this program

It is created as an ES module, so that is why the extension is .mjs. It should be used passing input filename as parameter. Itt will produce an output.json file.
Here is an example:

```bash
> node json-schema-resolver.js input.json
```
