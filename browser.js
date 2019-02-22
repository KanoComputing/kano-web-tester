/* globals mocha */
import 'mocha/mocha.js';
import 'chai/chai.js';
import { stringify } from 'flatted/esm/index.js';
import { fixture, setup } from './lib/fixture.js';
import { JUnit } from './lib/reporter.js';

Object.defineProperty(window, 'assert', {
    get: () => {
        // next-line no-console
        console.warn('Calling `assert` directly on the window is deprecated. Import it from `@kano/web-tester/helpers.js` instead');
        return window.chai.assert;
    },
});

window.fixture = (...args) => {
    // eslint-disable-next-line no-console
    console.warn('Calling `fixture` directly on the window is deprecated. Import it from `@kano/web-tester/helpers.js` instead');
    return fixture(...args);
};

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

const proxy = (name, args) => {
    if (typeof window.onMochaEvent === 'function') {
        window.onMochaEvent({ name, args: args.map(arg => stringify(arg)) });
    }
};

export const loadTests = (tests, opts = {}) => {
    const def = {
        ui: 'tdd',
    };
    mocha.setup(Object.assign(def, opts));
    if (window.onMochaEvent) {
        mocha.reporter(JUnit, {
            proxy,
        });
    }
    setup(mocha);
    if (window.onMochaEvent) {
        mocha.globals(['onMochaEvent', 'sendCoverage']);
    }
    const tasks = tests.map(t => loadTest(t));
    return Promise.all(tasks)
        .then(() => {
            mocha.run(() => {
                mocha.checkLeaks();
                if (window.sendCoverage) {
                    window.sendCoverage(window.__coverage__);
                }
                proxy('results', [window.jsonResults]);
            });
        });
};

export default { loadTests };
