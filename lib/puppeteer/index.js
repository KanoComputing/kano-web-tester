/* eslint-disable global-require */
const puppeteer = require('puppeteer');
const ServeRunner = require('../serve/index');
const { EventEmitter } = require('events');
const { parse } = require('flatted/cjs');

const DEFAULTS = {
    headless: true,
    slowMo: 100,
    timeout: 10000,
};

class PuppeteerRunner extends ServeRunner {
    constructor(opts) {
        super(opts);
        this.port = 0;
        this.options = Object.assign({}, DEFAULTS, opts.puppeteer || {});
        this.options.coverage = opts.coverage || false;
    }
    run() {
        return super.run(false)
            .then((server) => {
                const { port } = server.address();
                return puppeteer.launch(this.options)
                    .then(browser => browser.newPage()
                        .then(page => new Promise(async (resolve, reject) => {
                            const emitter = new EventEmitter();
                            if (this.options.coverage) {
                                // Late require, makes the coverage files not loaded if not needed
                                const api = require('istanbul-api');
                                const libCoverage = require('istanbul-lib-coverage');
                                await page.exposeFunction('sendCoverage', (data) => {
                                    const map = libCoverage.createCoverageMap(data);
                                    const config = api.config.loadObject({});
                                    const rep = api.createReporter(config);
                                    rep.addAll([this.options.reporter]);
                                    rep.write(map);
                                    server.close(() => resolve());
                                });
                            } else {
                                let reporter;
                                if (this.options.reporter === 'xunit') {
                                    // eslint-disable-next-line global-require
                                    const XUnit = require('./reporters/xunit');
                                    reporter = new XUnit(emitter);
                                } else {
                                    // eslint-disable-next-line global-require
                                    const Spec = require('./reporters/spec');
                                    reporter = new Spec(emitter);
                                }
                                reporter.onDidFinish(() => {
                                    reporter.dispose();
                                    server.close(() => resolve());
                                });
                                await page.exposeFunction('onMochaEvent', (data) => {
                                    const args = data.args.map(arg => parse(arg));
                                    emitter.emit(data.name, ...args);
                                });
                            }
                            await page.goto(`http://localhost:${port}`).catch(reject);
                        })));
            });
    }
}

module.exports = PuppeteerRunner;
