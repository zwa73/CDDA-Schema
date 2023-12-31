"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCddaSchema = exports.expandSchema = void 0;
const path = require("path");
const utils_1 = require("@zwa73/utils");
/**
// optionally pass argument to schema generator
const settings: TJS.PartialArgs = {
    required: true,
    aliasRef: true,
};

// optionally pass ts compiler options
const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
};

//const basePath = path.join(process.cwd(),"src");
//const fillPathList = Object.values(UtilFT.fileSearch(basePath,"\\.ts$"))
//    .filter(filePath=>!filePath.includes("StaticData"));
//console.log("files",fillPathList);

// 你的TypeScript程序
const program = TJS.getProgramFromFiles(
    [path.join(process.cwd(),"tsconfig.json")],
    compilerOptions
);

// We can either get the schema for one file and one type...
const schema = TJS.generateSchema(program, "*", settings);

UtilFT.writeJSONFile(path.join(process.cwd(),"schemas"),schema as any);
*/
function isPathValid(filePath) {
    if (filePath.length > 255)
        return false;
    const invalidCharacters = ['<', '>', '"', '|', '?', '*'];
    for (let i = 0; i < invalidCharacters.length; i++) {
        if (filePath.includes(invalidCharacters[i]))
            return false;
    }
    return true;
}
/**展开schema以供使用 */
async function expandSchema(schemasPath, withOutTypes = []) {
    let schema = utils_1.UtilFT.loadJSONFileSync(schemasPath);
    //替换SchemaString标识符
    schema = JSON.parse(JSON.stringify(schema).replace(/\^\.\*SchemaString\$/g, '^.*$'));
    utils_1.UtilFT.writeJSONFile(schemasPath, schema);
    const definitions = schema["definitions"];
    //展开定义
    for (const typeName in definitions) {
        const schema = definitions[typeName];
        //展开所有object与忽略检测的类型
        if (schema.type != "object" && schema.type != undefined && !withOutTypes.includes(typeName))
            continue;
        if ((/^.+_[0-9]/).test(typeName) || (/^{./).test(typeName))
            continue;
        const basename = path.basename(schemasPath);
        const tpath = path.join(path.dirname(schemasPath), `${typeName}.schema.json`);
        if (!isPathValid(tpath))
            continue;
        utils_1.UtilFT.writeJSONFile(tpath, {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "$ref": `${basename}#/definitions/${typeName}`
        });
    }
}
exports.expandSchema = expandSchema;
async function buildCddaSchema(outPath) {
    outPath = outPath ?? path.join(process.cwd(), "CddaSchema");
    const configPath = path.join(__dirname, "..", "tsconfig.json");
    const schemasPath = path.join(outPath, "CddaSchemas.json");
    //编译schema
    //await UtilFunc.exec("npm run generate-schema");
    await utils_1.UtilFunc.exec(`typescript-json-schema ${configPath} * --out ${schemasPath} --required --strictNullChecks --aliasRefs`);
    //await UtilFunc.exec("typescript-json-schema tsconfig.json * --out schema/schemas.json --required --strictNullChecks");
    //展开
    console.log(schemasPath);
    await expandSchema(schemasPath, ["AnyCddaJsonList"]);
}
exports.buildCddaSchema = buildCddaSchema;
