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
    /**
     * Registers the methods onto the page to deal with test coverage
     * @param {Page} page The puppeteer page
     */
    handleCoverage(page) {
        return new Promise(async (resolve) => {
            // Late require, makes the coverage files not loaded if not needed
            const api = require('istanbul-api');
            const libCoverage = require('istanbul-lib-coverage');
            await page.exposeFunction('sendCoverage', (data) => {
                let obj = data;
                if (this.sourceMapCache) {
                    const transformed = this.sourceMapCache
                        .transformCoverage(libCoverage.createCoverageMap(data));
                    obj = transformed.map.data;
                }
                const map = libCoverage.createCoverageMap(obj);
                const config = api.config.loadObject({});
                const rep = api.createReporter(config);
                rep.addAll([this.options.reporter]);
                rep.write(map);
                resolve();
            });
        });
    }
    /**
     * Registers methods on the page to handle a mocha test run
     * @param {Page} page Pupppeteer page
     */
    handleTest(page) {
        return new Promise(async (resolve) => {
            const emitter = new EventEmitter();
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
                resolve();
            });
            await page.exposeFunction('onMochaEvent', (data) => {
                const args = data.args.map(arg => parse(arg));
                emitter.emit(data.name, ...args);
            });
        });
    }
    run() {
        return super.run(false)
            .then((server) => {
                const { port } = server.address();
                return puppeteer.launch(this.options)
                    .then(browser => browser.newPage())
                    .then(async (page) => {
                        let p = null;
                        if (this.options.coverage) {
                            p = this.handleCoverage(page);
                        } else {
                            p = this.handleTest(page);
                        }
                        await page.goto(`http://localhost:${port}`);
                        return p;
                    })
                    .then(() => new Promise((resolve) => {
                        server.close(() => resolve());
                    }));
            });
    }
}

module.exports = PuppeteerRunner;
