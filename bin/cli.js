#!/usr/bin/env node
/* eslint global-require: 'off' */
const path = require('path');
const glob = require('glob');

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
    const testFiles = glob.sync(path.join(root, '/**/*.js'));
    const rcCwdPath = path.resolve(path.join(process.cwd(), '.web-tester.conf.json'));
    const rcPath = path.resolve(path.join(root, '.web-tester.conf.json'));
    return Object.assign(
        {
            root,
            cwd: process.cwd(),
        },
        loadRC(rcCwdPath),
        loadRC(rcPath),
        { testFiles },
    );
}

require('yargs') // eslint-disable-line
    .command('serve <root>', 'start the server', (yargs) => {
        yargs
            .positional('root', {
                describe: 'test directory root',
                default: './test',
            })
            .option('port', {
                default: 8000,
            })
            .boolean('_example');
    }, (argv) => {
        const conf = resolveConf(argv.root);
        const opts = Object.assign(conf, {
            port: argv.port,
            _example: argv._example,
        });
        const ServeRunner = require('../lib/serve');
        const runner = new ServeRunner(opts);
        runner.run();
        /* eslint no-console: 'off' */
        console.log(`Visit http://127.0.0.1:${argv.port} to run your tests`);
    })
    .command('run <root>', 'run the tests', (yargs) => {
        yargs
            .positional('root', {
                describe: 'test directory root',
                default: './test',
            })
            .boolean('_example')
            .boolean('headless');
    }, (argv) => {
        const conf = resolveConf(argv.root);
        const opts = Object.assign(conf, {
            port: argv.port,
            _example: argv._example,
            puppeteer: {
                headless: argv.headless,
                slowMo: argv.slowMo,
                timeout: argv.timeout,
            },
        });
        const PuppeteerRunner = require('../lib/puppeteer');
        const runner = new PuppeteerRunner(opts);
        runner.run();
    })
    .argv;
