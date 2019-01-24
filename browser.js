/* globals mocha */
import 'mocha/mocha.js';
import 'chai/chai.js';
import { stringify } from 'flatted/esm/index.js';
import { fixture, setup } from './lib/fixture.js';
import { JUnit } from './lib/reporter.js';

window.assert = window.chai.assert;
window.fixture = fixture;

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
    mocha.reporter(JUnit, {
        proxy,
    });
    setup(mocha);
    if (window.onMochaEvent) {
        mocha.globals(['onMochaEvent']);
    }
    const tasks = tests.map(t => loadTest(t));
    return Promise.all(tasks)
        .then(() => {
            mocha.run(() => {
                mocha.checkLeaks();
                window.onMochaEvent({ name: 'results', args: window.jsonResults });
            });
        });
};

export default { loadTests };
