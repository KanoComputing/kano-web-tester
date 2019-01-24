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
    }
    run() {
        return super.run(false)
            .then((server) => {
                const { port } = server.address();
                return puppeteer.launch(this.options)
                    .then(browser => browser.newPage()
                        .then(page => new Promise(async (resolve, reject) => {
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
                                setTimeout(async () => {
                                    await browser.close();
                                    reporter.dispose();
                                    server.close(() => resolve());
                                });
                            });
                            await page.exposeFunction('onMochaEvent', (data) => {
                                const args = data.args.map(arg => parse(arg));
                                emitter.emit(data.name, ...args);
                            });
                            await page.goto(`http://localhost:${port}`).catch(reject);
                        })));
            });
    }
}

module.exports = PuppeteerRunner;
