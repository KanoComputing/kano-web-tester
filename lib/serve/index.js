const Runner = require('../runner');
const connect = require('connect');
const serveStatic = require('serve-static');

const namedResolutionMiddleware = require('./named-resolution-middleware');
const indexMiddleware = require('./index-middleware');

class ServeRunner extends Runner {
    constructor(opts) {
        super(opts);
        this.port = opts.port;
    }
    run() {
        return connect()
            .use(namedResolutionMiddleware({ modulesDir: this.cwd }))
            .use(indexMiddleware({
                cwd: this.cwd,
                _example: this._example,
                testFiles: this.testFiles,
                mocha: this.mocha,
            }))
            .use(serveStatic(this.cwd))
            .listen(this.port);
    }
}

module.exports = ServeRunner;
