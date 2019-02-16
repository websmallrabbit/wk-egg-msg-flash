"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const path_1 = tslib_1.__importDefault(require("path"));
const utils = tslib_1.__importStar(require("../utils"));
let uniqId = 100;
const debug = debug_1.default('egg-ts-helper#generators_class');
function default_1(config, baseConfig) {
    const fileList = config.fileList;
    const dist = path_1.default.resolve(config.dtsDir, 'index.d.ts');
    debug('file list : %o', fileList);
    if (!fileList.length) {
        return { dist };
    }
    // using to compose import code
    let importStr = '';
    // using to create interface mapping
    const interfaceMap = {};
    fileList.forEach(f => {
        const { props, moduleName: sModuleName } = utils.getModuleObjByPath(f);
        const moduleName = `Export${sModuleName}`;
        const importContext = utils.getImportStr(config.dtsDir, path_1.default.join(config.dir, f), moduleName);
        importStr += `${importContext}\n`;
        // create mapping
        let collector = interfaceMap;
        while (props.length) {
            const name = utils.camelProp(props.shift(), config.caseStyle || baseConfig.caseStyle);
            if (!props.length) {
                collector[name] = moduleName;
            }
            else {
                collector = collector[name] = collector[name] || {};
            }
        }
    });
    // interface name
    const interfaceName = config.interface || `TC${uniqId++}`;
    // add mount interface
    let declareInterface;
    if (config.declareTo) {
        const interfaceList = config.declareTo.split('.');
        declareInterface = composeInterface(interfaceList.slice(1).concat(interfaceName), interfaceList[0], undefined, '  ');
    }
    return {
        dist,
        content: `${importStr}\n` +
            `declare module '${config.framework || baseConfig.framework}' {\n` +
            (declareInterface ? `${declareInterface}\n` : '') +
            composeInterface(interfaceMap, interfaceName, utils.strToFn(config.interfaceHandle), '  ') +
            '}\n',
    };
}
exports.default = default_1;
// composing all the interface
function composeInterface(obj, wrapInterface, preHandle, indent) {
    let prev = '';
    let mid = '';
    let after = '';
    indent = indent || '';
    if (wrapInterface) {
        prev = `${indent}interface ${wrapInterface} {\n`;
        after = `${indent}}\n`;
        indent += '  ';
    }
    // compose array to object
    // ['abc', 'bbc', 'ccc'] => { abc: { bbc: 'ccc' } }
    if (Array.isArray(obj)) {
        let curr = obj.pop();
        while (obj.length) {
            curr = { [obj.pop()]: curr };
        }
        obj = curr;
    }
    Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (typeof val === 'string') {
            mid += `${indent + key}: ${preHandle ? preHandle(val) : val};\n`;
        }
        else {
            const newVal = composeInterface(val, undefined, preHandle, indent + '  ');
            if (newVal) {
                mid += `${indent + key}: {\n${newVal + indent}}\n`;
            }
        }
    });
    return `${prev}${mid}${after}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZ2VuZXJhdG9ycy9jbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwwREFBc0I7QUFDdEIsd0RBQXdCO0FBRXhCLHdEQUFrQztBQUNsQyxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFDakIsTUFBTSxLQUFLLEdBQUcsZUFBQyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFFbEQsbUJBQXdCLE1BQW1CLEVBQUUsVUFBMEI7SUFDckUsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNqQyxNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFdkQsS0FBSyxDQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO1FBQ3BCLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztLQUNqQjtJQUVELCtCQUErQjtJQUMvQixJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDbkIsb0NBQW9DO0lBQ3BDLE1BQU0sWUFBWSxHQUFnQixFQUFFLENBQUM7SUFFckMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNuQixNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkUsTUFBTSxVQUFVLEdBQUcsU0FBUyxXQUFXLEVBQUUsQ0FBQztRQUMxQyxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUN0QyxNQUFNLENBQUMsTUFBTSxFQUNiLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDeEIsVUFBVSxDQUNYLENBQUM7UUFFRixTQUFTLElB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