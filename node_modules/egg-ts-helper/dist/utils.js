"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const mkdirp_1 = tslib_1.__importDefault(require("mkdirp"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const path_1 = tslib_1.__importDefault(require("path"));
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const yn_1 = tslib_1.__importDefault(require("yn"));
exports.JS_CONFIG = {
    include: ['**/*'],
};
exports.TS_CONFIG = {
    compilerOptions: {
        target: 'es2017',
        module: 'commonjs',
        strict: true,
        noImplicitAny: false,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        allowSyntheticDefaultImports: true,
        charset: 'utf8',
        allowJs: false,
        pretty: true,
        lib: ['es6'],
        noEmitOnError: false,
        noUnusedLocals: true,
        noUnusedParameters: true,
        allowUnreachableCode: false,
        allowUnusedLabels: false,
        strictPropertyInitialization: false,
        noFallthroughCasesInSwitch: true,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        inlineSourceMap: true,
    },
};
// convert string to same type with default value
function convertString(val, defaultVal) {
    if (val === undefined)
        return defaultVal;
    switch (typeof defaultVal) {
        case 'boolean':
            return yn_1.default(val, { default: defaultVal });
        case 'number':
            const num = +val;
            return (isNaN(num) ? defaultVal : num);
        case 'string':
            return val;
        default:
            return defaultVal;
    }
}
exports.convertString = convertString;
// load ts/js files
function loadFiles(cwd, pattern) {
    const fileList = globby_1.default.sync([pattern || '**/*.(js|ts)', '!**/*.d.ts'], {
        cwd,
    });
    return fileList.filter(f => {
        // filter same name js/ts
        return !(f.endsWith('.js') &&
            fileList.includes(f.substring(0, f.length - 2) + 'ts'));
    });
}
exports.loadFiles = loadFiles;
// write jsconfig.json to cwd
function writeJsConfig(cwd) {
    const jsconfigUrl = path_1.default.resolve(cwd, './jsconfig.json');
    if (!fs_1.default.existsSync(jsconfigUrl)) {
        fs_1.default.writeFileSync(jsconfigUrl, JSON.stringify(exports.JS_CONFIG, null, 2));
        return jsconfigUrl;
    }
}
exports.writeJsConfig = writeJsConfig;
// write tsconfig.json to cwd
function writeTsConfig(cwd) {
    const tsconfigUrl = path_1.default.resolve(cwd, './tsconfig.json');
    if (!fs_1.default.existsSync(tsconfigUrl)) {
        fs_1.default.writeFileSync(tsconfigUrl, JSON.stringify(exports.TS_CONFIG, null, 2));
        return tsconfigUrl;
    }
}
exports.writeTsConfig = writeTsConfig;
function checkMaybeIsJsProj(cwd) {
    const pkgInfo = getPkgInfo(cwd);
    const isJs = !(pkgInfo.egg && pkgInfo.egg.typescript) &&
        !fs_1.default.existsSync(path_1.default.resolve(cwd, './tsconfig.json')) &&
        !fs_1.default.existsSync(path_1.default.resolve(cwd, './config/config.default.ts')) &&
        (fs_1.default.existsSync(path_1.default.resolve(cwd, './config/config.default.js')) ||
            fs_1.default.existsSync(path_1.default.resolve(cwd, './jsconfig.json')));
    return isJs;
}
exports.checkMaybeIsJsProj = checkMaybeIsJsProj;
// load modules to object
function loadModules(cwd, loadDefault) {
    const modules = {};
    fs_1.default
        .readdirSync(cwd)
        .filter(f => f.endsWith('.js'))
        .map(f => {
        const name = f.substring(0, f.lastIndexOf('.'));
        const obj = require(path_1.default.resolve(cwd, name));
        if (loadDefault && obj.default) {
            modules[name] = obj.default;
        }
        else {
            modules[name] = obj;
        }
    });
    return modules;
}
exports.loadModules = loadModules;
// convert string to function
function strToFn(fn) {
    if (typeof fn === 'string') {
        return (...args) => fn.replace(/{{\s*(\d+)\s*}}/g, (_, index) => args[index]);
    }
    else {
        return fn;
    }
}
exports.strToFn = strToFn;
// log
function log(msg, prefix = true) {
    console.info(`${prefix ? '[egg-ts-helper] ' : ''}${msg}`);
}
exports.log = log;
function getAbsoluteUrlByCwd(p, cwd) {
    return path_1.default.isAbsolute(p) ? p : path_1.default.resolve(cwd, p);
}
exports.getAbsoluteUrlByCwd = getAbsoluteUrlByCwd;
// get import context
function getImportStr(from, to, moduleName, importStar) {
    const extname = path_1.default.extname(to);
    let importPath = path_1.default.relative(from, to).replace(/\/|\\/g, '/');
    importPath = importPath.substring(0, importPath.length - extname.length);
    const isTS = extname === '.ts';
    const importStartStr = isTS && importStar ? '* as ' : '';
    const fromStr = isTS ? `from '${importPath}'` : `= require('${importPath}')`;
    return `import ${importStartStr}${moduleName} ${fromStr};`;
}
exports.getImportStr = getImportStr;
// write file, using fs.writeFileSync to block io that d.ts can create before egg app started.
function writeFileSync(fileUrl, content) {
    mkdirp_1.default.sync(path_1.default.dirname(fileUrl));
    fs_1.default.writeFileSync(fileUrl, content);
}
exports.writeFileSync = writeFileSync;
// clean same name js/ts
function cleanJs(cwd) {
    const fileList = [];
    globby_1.default
        .sync(['**/*.ts', '!**/*.d.ts', '!**/node_modules'], { cwd })
        .forEach(f => {
        const jf = removeSameNameJs(path_1.default.resolve(cwd, f));
        if (jf) {
            fileList.push(jf);
        }
    });
    if (fileList.length) {
        console.info('[egg-ts-helper] These file was deleted because the same name ts file was exist!\n');
        console.info('  ' + fileList.join('\n  ') + '\n');
    }
}
exports.cleanJs = cleanJs;
// get moduleName by file path
function getModuleObjByPath(f) {
    const props = f.substring(0, f.lastIndexOf('.')).split('/');
    // composing moduleName
    const moduleName = props.map(prop => camelProp(prop, 'upper')).join('');
    return {
        props,
        moduleName,
    };
}
exports.getModuleObjByPath = getModuleObjByPath;
// remove same name js
function removeSameNameJs(f) {
    if (!f.endsWith('.ts') || f.endsWith('.d.ts')) {
        return;
    }
    const jf = f.substring(0, f.length - 2) + 'js';
    if (fs_1.default.existsSync(jf)) {
        fs_1.default.unlinkSync(jf);
        return jf;
    }
}
exports.removeSameNameJs = removeSameNameJs;
// find export node from sourcefile.
function findExportNode(code) {
    const sourceFile = typescript_1.default.createSourceFile('file.ts', code, typescript_1.default.ScriptTarget.ES2017, true);
    const cache = new Map();
    const exportNodeList = [];
    let exportDefaultNode;
    eachSourceFile(sourceFile, node => {
        if (node.parent !== sourceFile) {
            return;
        }
        // each node in root scope
        if (modifierHas(node, typescript_1.default.SyntaxKind.ExportKeyword)) {
            if (modifierHas(node, typescript_1.default.SyntaxKind.DefaultKeyword)) {
                // export default
                exportDefaultNode = node;
            }
            else {
                // export variable
                if (typescript_1.default.isVariableStatement(node)) {
                    node.declarationList.declarations.forEach(declare => exportNodeList.push(declare));
                }
                else {
                    exportNodeList.push(node);
                }
            }
        }
        else if (typescript_1.default.isVariableStatement(node)) {
            // cache variable statement
            for (const declaration of node.declarationList.declarations) {
                if (typescript_1.default.isIdentifier(declaration.name) && declaration.initializer) {
                    cache.set(declaration.name.escapedText, declaration.initializer);
                }
            }
        }
        else if ((typescript_1.default.isFunctionDeclaration(node) || typescript_1.default.isClassDeclaration(node)) && node.name) {
            // cache function declaration and class declaration
            cache.set(node.name.escapedText, node);
        }
        else if (typescript_1.default.isExportAssignment(node)) {
            // export default {}
            exportDefaultNode = node.expression;
        }
        else if (typescript_1.default.isExpressionStatement(node) && typescript_1.default.isBinaryExpression(node.expression)) {
            if (typescript_1.default.isPropertyAccessExpression(node.expression.left)) {
                const obj = node.expression.left.expression;
                const prop = node.expression.left.name;
                if (typescript_1.default.isIdentifier(obj)) {
                    if (obj.escapedText === 'exports') {
                        // exports.xxx = {}
                        exportNodeList.push(node.expression);
                    }
                    else if (obj.escapedText === 'module' &&
                        typescript_1.default.isIdentifier(prop) &&
                        prop.escapedText === 'exports') {
                        // module.exports = {}
                        exportDefaultNode = node.expression.right;
                    }
                }
            }
            else if (typescript_1.default.isIdentifier(node.expression.left)) {
                // let exportData;
                // exportData = {};
                // export exportData
                cache.set(node.expression.left.escapedText, node.expression.right);
            }
        }
    });
    while (exportDefaultNode && typescript_1.default.isIdentifier(exportDefaultNode) && cache.size) {
        const mid = cache.get(exportDefaultNode.escapedText);
        cache.delete(exportDefaultNode.escapedText);
        exportDefaultNode = mid;
    }
    return {
        exportDefaultNode,
        exportNodeList,
    };
}
exports.findExportNode = findExportNode;
// check kind in node.modifiers.
function modifierHas(node, kind) {
    return node.modifiers && node.modifiers.find(mod => kind === mod.kind);
}
exports.modifierHas = modifierHas;
// each ast node
function eachSourceFile(node, cb) {
    if (!typescript_1.default.isSourceFile(node)) {
        const result = cb(node);
        if (result === false) {
            return;
        }
    }
    node.forEachChild((sub) => {
        eachSourceFile(sub, cb);
    });
}
exports.eachSourceFile = eachSourceFile;
// resolve module
function resolveModule(url) {
    try {
        return require.resolve(url);
    }
    catch (e) {
        return undefined;
    }
}
exports.resolveModule = resolveModule;
// check whether module is exist
function moduleExist(mod, cwd) {
    const nodeModulePath = path_1.default.resolve(cwd || process.cwd(), 'node_modules', mod);
    return fs_1.default.existsSync(nodeModulePath) || resolveModule(mod);
}
exports.moduleExist = moduleExist;
// require modules
function requireFile(url) {
    url = url && resolveModule(url);
    if (!url) {
        return undefined;
    }
    let exp = require(url);
    if (exp.__esModule && 'default' in exp) {
        exp = exp.default;
    }
    return exp;
}
exports.requireFile = requireFile;
// require package.json
function getPkgInfo(cwd) {
    return requireFile(path_1.default.resolve(cwd, './package.json')) || {};
}
exports.getPkgInfo = getPkgInfo;
// format property
function formatProp(prop) {
    return prop.replace(/[._-][a-z]/gi, s => s.substring(1).toUpperCase());
}
exports.formatProp = formatProp;
// like egg-core/file-loader
function camelProp(property, caseStyle) {
    if (typeof caseStyle === 'function') {
        return caseStyle(property);
    }
    // camel transfer
    property = formatProp(property);
    let first = property[0];
    // istanbul ignore next
    switch (caseStyle) {
        case 'lower':
            first = first.toLowerCase();
            break;
        case 'upper':
            first = first.toUpperCase();
            break;
        case 'camel':
            break;
        default:
            break;
    }
    return first + property.substring(1);
}
exports.camelProp = camelProp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsb0RBQW9CO0FBQ3BCLDREQUE0QjtBQUM1Qiw0REFBMEI7QUFDMUIsd0RBQXdCO0FBQ3hCLG9FQUE0QjtBQUM1QixvREFBb0I7QUFFUCxRQUFBLFNBQVMsR0FBRztJQUN2QixPQUFPLEVBQUUsQ0FBRSxNQUFNLENBQUU7Q0FDcEIsQ0FBQztBQUVXLFFBQUEsU0FBUyxHQUFHO0lBQ3ZCLGVBQWUsRUFBRTtRQUNmLE1BQU0sRUFBRSxRQUFRO1FBQ2hCLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLE1BQU0sRUFBRSxJQUFJO1FBQ1osYUFBYSxFQUFFLEtBQUs7UUFDcEIsc0JBQXNCLEVBQUUsSUFBSTtRQUM1QixxQkFBcUIsRUFBRSxJQUFJO1FBQzNCLDRCQUE0QixFQUFFLElBQUk7UUFDbEMsT0FBTyxFQUFFLE1BQU07UUFDZixPQUFPLEVBQUUsS0FBSztRQUNkLE1BQU0sRUFBRSxJQUFJO1FBQ1osR0FBRyxFQUFFLENBQUUsS0FBSyxDQUFFO1FBQ2QsYUFBYSxFQUFFLEtBQUs7UUFDcEIsY0FBYyxFQUFFLElBQUk7UUFDcEIsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLGlCQUFpQixFQUFFLEtBQUs7UUFDeEIsNEJBQTRCLEVBQUUsS0FBSztRQUNuQywwQkFBMEIsRUFBRSxJQUFJO1FBQ2hDLFlBQVksRUFBRSxJQUFJO1FBQ2xCLG1CQUFtQixFQUFFLElBQUk7UUFDekIsZUFBZSxFQUFFLElBQUk7S0FDdEI7Q0FDRixDQUFDO0FBRUYsaURBQWlEO0FBQ2pELFNBQWdCLGFBQWEsQ0FBSSxHQUF1QixFQUFFLFVBQWE7SUFDckUsSUFBSSxHQUFHLEtBQUssU0FBUztRQUFFLE9BQU8sVUFBVSxDQUFDO0lBQ3pDLFFBQVEsT0FBTyxVQUFVLEVBQUU7UUFDekIsS0FBSyxTQUFTO1lBQ1os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