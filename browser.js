import 'mocha/mocha.js';
import 'chai/chai.js';

window.assert = window.chai.assert;

function loadTest(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export const loadTests = (tests, opts = {}) => {
    window.mocha.setup(Object.assign({ ui: 'tdd' }, opts));
    if (window.onMochaEvent) {
        window.mocha.globals(['onMochaEvent', 'onMochaEnd']);
        window.mocha.reporter('xunit');
    }
    const tasks = tests.map(t => loadTest(t));
    return Promise.all(tasks)
        .then(() => {
            window.mocha.checkLeaks();
            // Added by puppeteer test automation
            if (window.onMochaEvent) {
                window.mocha._reporter.prototype.write = (line) => {
                    window.onMochaEvent(line);
                };
            }
            window.mocha.run(() => {
                if (window.onMochaEnd) {
                    window.onMochaEnd();
                }
            });
        });
};

export default { loadTests };
