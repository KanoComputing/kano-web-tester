const puppeteer = require('puppeteer');
const xml = require('xml');
const ServeRunner = require('../serve/index');
const Spec = require('./reporter');
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
                            const reporter = new Spec(emitter);
                            await page.exposeFunction('onMochaEvent', (data) => {
                                if (data.name === 'results') {
                                    // console.log(xml(args[0], { indent: '    ' }));
                                    setTimeout(async () => {
                                        // await browser.close();
                                        // server.close(() => resolve());
                                    }, 100);
                                } else {
                                    const args = data.args.map(arg => parse(arg));
                                    emitter.emit(data.name, ...args);
                                }
                            });
                            await page.goto(`http://localhost:${port}`).catch(reject);
                        })));
            });
    }
}

module.exports = PuppeteerRunner;
