#!/usr/bin/env node
/* eslint global-require: 'off' */
const path = require('path');
const glob = require('glob');
const sywac = require('sywac');

function loadRC(rcPath) {
    let rc;
    try {
        /* eslint import/no-dynamic-require: 'off' */
        rc = require(rcPath);
    } catch (e) {
        rc = {};
    }
    return rc;
}

function resolveConf(root) {
    const testFiles = glob.sync(root, { ignore: ['node_modules'] });
    const rcFile = path.join(process.cwd(), '.web-tester.conf.json');
    const rc = loadRC(rcFile);
    return Object.assign(
        {
            root,
            cwd: process.cwd(),
        },
        rc,
        { testFiles },
    );
}

function applyDefault(s) {
    s.positional('[glob]', {
        describe: 'glob pattern of all test files',
        defaultValue: '**/*.test.js',
    }).boolean('_example');
}

function resolveArgv(argv) {
    const conf = resolveConf(argv.glob);
    return Object.assign(conf, {
        port: argv.port,
        _example: argv._example,
    });
}

sywac // eslint-disable-line
    .usage('Usage $0 <serve|run> [options]')
    .command('serve', {
        desc: 'start the server',
        setup: (yar) => {
            applyDefault(yar);
            yar.number('port', {
                defaultValue: 8000,
            });
        },
        run: (argv) => {
            const opts = resolveArgv(argv);
            const ServeRunner = require('../lib/serve');
            const runner = new ServeRunner(opts);
            return runner.run();
        },
    })
    .command('run', {
        desc: 'run the tests',
        setup: (yar) => {
            applyDefault(yar);
            yar.boolean('noHeadless');
        },
        run: (argv) => {
            const opts = resolveArgv(argv);
            Object.assign(opts, {
                puppeteer: {
                    headless: !argv['no-headless'],
                    slowMo: argv.slowMo,
                    timeout: argv.timeout,
                },
            });
            const PuppeteerRunner = require('../lib/puppeteer');
            const runner = new PuppeteerRunner(opts);
            return runner.run();
        },
    });

sywac.parse(process.argv.slice(2)).then((result) => {
    if (result.output.length) {
        console.log(result.output);
    }
    process.exit(result.code);
});
