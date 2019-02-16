"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const cluster_1 = tslib_1.__importDefault(require("cluster"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const process_exists_1 = tslib_1.__importDefault(require("process-exists"));
const _1 = require("./");
const util = tslib_1.__importStar(require("./utils"));
const debug = debug_1.default('egg-ts-helper#register');
const cacheFile = path_1.default.resolve(__dirname, '../.cache');
const shouldWatch = util.convertString(process.env.ETS_WATCH, process.env.NODE_ENV !== 'test');
/* istanbul ignore else */
if (cluster_1.default.isMaster) {
    // make sure ets only run once
    let existPid;
    if (fs_1.default.existsSync(cacheFile)) {
        existPid = +fs_1.default.readFileSync(cacheFile).toString();
    }
    if (!existPid || !shouldWatch) {
        register(shouldWatch);
    }
    else {
        process_exists_1.default(existPid).then(exists => {
            if (!exists) {
                register(true);
            }
            else {
                debug('process %s was exits, ignore register', existPid);
            }
        });
    }
}
// start to register
function register(watch) {
    const cwd = process.cwd();
    if (util.checkMaybeIsJsProj(cwd)) {
        // write jsconfig if the project is wrote by js
        util.writeJsConfig(cwd);
    }
    else {
        // no need to clean in js project
        // clean local js file at first.
        // because egg-loader cannot load the same property name to egg.
        util.cleanJs(cwd);
    }
    // exec building
    _1.createTsHelperInstance({ watch }).build();
    // cache pid
    if (watch) {
        fs_1.default.writeFileSync(cacheFile, process.pid);
        const clean = () => fs_1.default.existsSync(cacheFile) && fs_1.default.unlinkSync(cacheFile);
        // delete cache file on exit.
        process.once('beforeExit', clean);
        process.once('uncaughtException', clean);
        process.once('SIGINT', () => {
            clean();
            process.exit(0);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVnaXN0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsOERBQThCO0FBQzlCLDBEQUFzQjtBQUN0QixvREFBb0I7QUFDcEIsd0RBQXdCO0FBQ3hCLDRFQUEyQztBQUMzQyx5QkFBNEM7QUFDNUMsc0RBQWdDO0FBQ2hDLE1BQU0sS0FBSyxHQUFHLGVBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBQzFDLE1BQU0sU0FBUyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3ZELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssTUFBTSxDQUFDLENBQUM7QUFFL0YsMEJBQTBCO0FBQzFCLElBQUksaUJBQU8sQ0FBQyxRQUFRLEVBQUU7SUFDcEIsOEJBQThCO0lBQzlCLElBQUksUUFBNEIsQ0FBQztJQUNqQyxJQUFJLFlBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDNUIsUUFBUSxHQUFHLENBQUMsWUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUNuRDtJQUVELElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxXQUFXLEVBQUU7UUFDN0IsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ3ZCO1NBQU07UUFDTCx3QkFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNwQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNYLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNoQjtpQkFBTTtnQkFDTCxLQUFLLENBQUMsdUNBQXVDLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDMUQ7UUFDSCxDQUFDLENBQUMsQ0FBQztLQUNKO0NBQ0Y7QUFFRCxvQkFBb0I7QUFDcEIsU0FBUyxRQUFRLENBQUMsS0FBYztJQUM5QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDMUIsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDaEMsK0NBQStDO1FBQy9DLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDekI7U0FBTTtRQUNMLGlDQUFpQztRQUNqQyxnQ0FBZ0M7UUFDaEMsZ0VBQWdFO1FBQ2hFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDbkI7SUFFRCxnQkFBZ0I7SUFDaEIseUJBQXNCLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBRTFDLFlBQVk7SUFDWixJQUFJLEtBQUssRUFBRTtRQUNULFlBQUUsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV6QyxNQUFNLEtBQUssR0FBRyxHQUFHLEVBQUUsQ0FBQyxZQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLFlBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFekUsNkJBQTZCO1FBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBQzFCLEtBQUssRUFBRSxDQUFDO1lBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyJ9