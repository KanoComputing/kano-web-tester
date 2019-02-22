/* eslint-disable global-require */
const Runner = require('../runner');
const connect = require('connect');
const chalk = require('chalk');
const serveStatic = require('serve-static');

const namedResolutionMiddleware = require('./named-resolution-middleware');
const indexMiddleware = require('./index-middleware');

class ServeRunner extends Runner {
    constructor(opts) {
        super(opts);
        this.port = opts.port;
        this.testFiles = opts.testFiles;
        this.ignore = opts.exclude || [];
        this.coverage = opts.coverage;
        if (opts._example) {
            this.ignore.push(require.resolve('../../browser.js'));
            this.ignore.push(require.resolve('../../helpers.js'));
            this.ignore.push(require.resolve('../reporter.js'));
            this.ignore.push(require.resolve('../fixture.js'));
        }
    }
    getInstrumentMiddleware() {
        const instrumentMiddleware = require('./instrument-middleware');
        const libSourceMaps = require('istanbul-lib-source-maps');
        this.sourceMapCache = libSourceMaps.createSourceMapStore();
        return instrumentMiddleware({
            testFiles: this.testFiles,
            ignore: this.ignore,
            sourceMapCache: this.sourceMapCache,
        });
    }
    run(hang = true) {
        return new Promise((resolve, reject) => {
            let server = connect();
            if (this.coverage) {
                server.use(this.getInstrumentMiddleware());
            }
            server.use(namedResolutionMiddleware())
                .use(indexMiddleware({
                    cwd: this.cwd,
                    _example: this._example,
                    testFiles: this.testFiles,
                    mocha: this.mocha,
                }))
                .use(serveStatic(this.cwd));
            server = server.listen(this.port, (err) => {
                if (err) {
                    return reject();
                }
                if (hang) {
                    /* eslint no-console: 'off' */
                    console.log(`Visit ${chalk.cyan(`http://127.0.0.1:${this.port}`)} to run your tests`);
                    // Let it hang
                    return null;
                }
                return resolve(server);
            });
        });
    }
}

module.exports = ServeRunner;
