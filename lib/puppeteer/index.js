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
    setupMochaEnd(page) {
        return new Promise((resolve) => {
            page.exposeFunction('onMochaEnd', () => resolve());
        });
    }
    run() {
        return super.run(false)
            .then((server) => {
                const { port } = server.address();
                return puppeteer.launch(this.options)
                    .then((browser) => {
                        return browser.newPage()
                            .then((page) => {
                                return page.exposeFunction('onMochaEvent', (line) => {
                                    /* eslint no-console: 'off' */
                                    console.log(line);
                                }).then(() => {
                                    return new Promise((resolve, reject) => {
                                        page.exposeFunction('onMochaEnd', () => {
                                            setTimeout(async () => {
                                                await browser.close();
                                                server.close(() => resolve());
                                            }, 100);
                                        });
                                        page.goto(`http://localhost:${port}`).catch(reject);
                                    });
                                });
                            });
                    });
            });
    }
}

module.exports = PuppeteerRunner;
