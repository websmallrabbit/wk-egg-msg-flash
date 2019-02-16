"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const chokidar_1 = tslib_1.__importDefault(require("chokidar"));
const assert_1 = tslib_1.__importDefault(require("assert"));
const events_1 = require("events");
const utils = tslib_1.__importStar(require("./utils"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('egg-ts-helper#watcher');
let generators;
class Watcher extends events_1.EventEmitter {
    constructor(options, helper) {
        super();
        this.helper = helper;
        this.throttleTick = null;
        this.throttleStack = [];
        this.init(options);
    }
    init(options) {
        const generatorName = options.generator || 'class';
        this.config = this.helper.config;
        this.name = options.name;
        this.generator = this.getGenerator(generatorName);
        this.options = Object.assign({ trigger: ['add', 'unlink'], generator: generatorName, pattern: '**/*.(ts|js)', watch: true }, this.generator.defaultConfig, options);
        const baseDir = options.path.replace(/\/|\\/, path_1.default.sep);
        this.dir = utils.getAbsoluteUrlByCwd(baseDir, this.config.cwd);
        this.dtsDir = path_1.default.resolve(this.config.typings, path_1.default.relative(this.config.cwd, this.dir));
    }
    destroy() {
        if (this.fsWatcher) {
            this.fsWatcher.close();
        }
        clearTimeout(this.throttleTick);
        this.throttleTick = null;
        this.throttleStack.length = 0;
        this.removeAllListeners();
    }
    // watch file change
    watch() {
        if (!this.options.watch) {
            return;
        }
        if (this.fsWatcher) {
            this.fsWatcher.close();
        }
        // glob only works with / in windows
        const watchGlob = path_1.default
            .join(this.dir, this.options.pattern)
            .replace(/\/|\\/g, '/');
        const watcher = chokidar_1.default.watch(watchGlob, this.config.watchOptions);
        // listen watcher event
        this.options.trigger.forEach(evt => {
            watcher.on(evt, this.onChange.bind(this));
        });
        // auto remove js while ts was deleted
        if (this.config.autoRemoveJs) {
            watcher.on('unlink', utils.removeSameNameJs);
        }
        this.fsWatcher = watcher;
    }
    // execute generator
    execute(file) {
        debug('execution %s', file);
        const options = this.options;
        let _fileList;
        const newConfig = Object.assign({}, this.options, { file, dir: this.dir, dtsDir: this.dtsDir, get fileList() {
                return _fileList || (_fileList = utils.loadFiles(this.dir, options.pattern));
            } });
        const result = this.generator(newConfig, this.config, this.helper);
        if (result) {
            this.emit('update', result, file);
        }
        return result;
    }
    // on file change
    onChange(filePath) {
        debug('file changed %s %o', filePath, this.throttleStack);
        if (!this.throttleStack.includes(filePath)) {
            this.throttleStack.push(filePath);
        }
        if (this.throttleTick) {
            return;
        }
        this.throttleTick = setTimeout(() => {
            while (this.throttleStack.length) {
                this.execute(this.throttleStack.pop());
            }
            this.throttleTick = null;
        }, this.config.throttle);
    }
    // get generator
    getGenerator(name) {
        const type = typeof name;
        const typeIsString = type === 'string';
        generators = generators || utils.loadModules(path_1.default.resolve(__dirname, './generators'));
        let generator = typeIsString ? generators[name] : name;
        if (!generator && typeIsString) {
            try {
                // try to load generator as module path
                const generatorPath = name.startsWith('.')
                    ? path_1.default.join(this.config.cwd, name)
                    : name;
                generator = require(generatorPath);
            }
            catch (e) {
                // do nothing
            }
        }
        // check esm default
        if (typeof generator.default === 'function') {
            generator.default.defaultConfig = generator.defaultConfig;
            generator = generator.default;
        }
        assert_1.default(typeof generator === 'function', `generator: ${name} not exist!!`);
        return generator;
    }
}
exports.default = Watcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHdEQUF3QjtBQUN4QixnRUFBZ0M7QUFDaEMsNERBQTRCO0FBQzVCLG1DQUFzQztBQUV0Qyx1REFBaUM7QUFDakMsMERBQXNCO0FBQ3RCLE1BQU0sS0FBSyxHQUFHLGVBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQ3pDLElBQUksVUFBVSxDQUFDO0FBaUJmLE1BQXFCLE9BQVEsU0FBUSxxQkFBWTtJQVcvQyxZQUFZLE9BQXVCLEVBQVMsTUFBZ0I7UUFDMUQsS0FBSyxFQUFFLENBQUM7UUFEa0MsV0FBTSxHQUFOLE1BQU0sQ0FBVTtRQUg1RCxpQkFBWSxHQUFRLElBQUksQ0FBQztRQUN6QixrQkFBYSxHQUFhLEVBQUUsQ0FBQztRQUkzQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFTSxJQUFJLENBQUMsT0FBdUI7UUFDakMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUM7UUFDbkQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNqQyxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxPQUFPLG1CQUNWLE9BQU8sRUFBRSxDQUFFLEtBQUssRUFBRSxRQUFRLENBQUUsRUFDNUIsU0FBUyxFQUFFLGFBQWEsRUFDeEIsT0FBTyxFQUFFLGNBQWMsRUFDdkIsS0FBSyxFQUFFLElBQUksSUFDUixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFDNUIsT0FBTyxDQUNYLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxPQUFPLENB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