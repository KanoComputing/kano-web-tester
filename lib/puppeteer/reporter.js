
/* eslint no-console: 'off' */
const mocha = require('mocha');

const { Base } = mocha.reporters;

const { color } = Base;

class Spec {
    static get description() {
        return 'hierarchical & verbose [default]';
    }
    constructor(runner) {
        let indents = 0;
        let n = 0;

        function indent() {
            return Array(indents).join('  ');
        }

        runner.on('start', () => {
            console.log();
        });

        runner.on('suite', (suite) => {
            indents += 1;
            console.log(color('suite', '%s%s'), indent(), suite.title);
        });

        runner.on('suite end', () => {
            indents -= 1;
            if (indents === 1) {
                console.log();
            }
        });

        runner.on('pending', (test) => {
            const fmt = indent() + color('pending', '  - %s');
            console.log(fmt, test.title);
        });

        runner.on('pass', (test) => {
            let fmt;
            if (test.speed === 'fast') {
                fmt =
                    indent() +
                    color('checkmark', `  ${Base.symbols.ok}`) +
                    color('pass', ' %s');
                console.log(fmt, test.title);
            } else {
                fmt =
                    indent() +
                    color('checkmark', `  ${Base.symbols.ok}`) +
                    color('pass', ' %s') +
                    color(test.speed, ' (%dms)');
                console.log(fmt, test.title, test.duration);
            }
        });

        runner.on('fail', (test) => {
            console.log(indent() + color('fail', '  %d) %s'), n, test.title);
            n += 1;
        });
    }
    dispose() {

    }
}

exports = Spec;
module.exports = Spec;
