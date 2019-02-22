/* globals mocha */
import 'mocha/mocha.js';
import 'chai/chai.js';
import { stringify } from 'flatted/esm/index.js';
import { fixture, setup } from './lib/fixture.js';
import { JUnit } from './lib/reporter.js';
import { generateIcon, updateFavicon } from './lib/icon.js';

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

const mainIcon = document.body.querySelector('#main-icon');

const icon = mainIcon.getAttribute('src');

/**
 * Updates the favicon and main icon with the provided color
 * @param {string} color The status color to apply
 */
function updateColor(color) {
    // Fetch and generate the icon
    return generateIcon(icon, color)
        .then((src) => {
            // Set the mainIcon's source
            mainIcon.src = src;
            // Update all the favicons
            return updateFavicon(src);
        });
}

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
    if (typeof window.__webTester_onMochaEvent === 'function') {
        window.__webTester_onMochaEvent({ name, args: args.map(arg => stringify(arg)) });
    }
};

export const loadTests = (tests, opts = {}) => {
    const def = {
        ui: 'tdd',
    };
    mocha.setup(Object.assign(def, opts));
    if (window.__webTester_onMochaEvent) {
        mocha.reporter(JUnit, {
            proxy,
        });
    }
    setup(mocha);
    if (window.onMochaEvent) {
        mocha.globals(['__webTester_onMochaEvent', '__webTester_sendCoverage']);
    }
    const tasks = tests.map(t => loadTest(t));
    return Promise.all(tasks)
        .then(() => {
            const runner = mocha.run(() => {
                mocha.checkLeaks();
                if (window.__webTester_sendCoverage) {
                    window.__webTester_sendCoverage(window.__coverage__);
                }
                proxy('results', [window.jsonResults]);
            });
            runner.on('end', () => {
                if (runner.failures) {
                    updateColor('#d32f2f');
                } else {
                    updateColor('#4caf50');
                }
            });
        });
};

export default { loadTests };
