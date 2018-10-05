const puppeteer = require('puppeteer');
const ServeRunner = require('../serve/index');

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
        const server = super.run();
        const { port } = server.address();

        (async () => {
            const browser = await puppeteer.launch(this.options);
            const page = await browser.newPage();
            await page.exposeFunction('onMochaEvent', (line) => {
                /* eslint no-console: 'off' */
                console.log(line);
            });
            await page.exposeFunction('onMochaEnd', () => {
                setTimeout(() => {
                    browser.close();
                    server.close();
                }, 100);
            });
            await page.goto(`http://localhost:${port}`);
        })();
    }
}

module.exports = PuppeteerRunner;
