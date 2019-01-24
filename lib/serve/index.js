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
    }
    run(hang = true) {
        return new Promise((resolve, reject) => {
            const server = connect()
                .use(namedResolutionMiddleware({ modulesDir: this.cwd }))
                .use(indexMiddleware({
                    cwd: this.cwd,
                    _example: this._example,
                    testFiles: this.testFiles,
                    mocha: this.mocha,
                }))
                .use(serveStatic(this.cwd))
                .listen(this.port, (err) => {
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
