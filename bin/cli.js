#!/usr/bin/env node
/* eslint global-require: 'off' */
const path = require('path');
const glob = require('glob');
const yargs = require('yargs');

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
    const testFiles = glob.sync(root);
    const rcFiles = glob.sync(path.join(process.cwd(), '**/.web-tester.conf.json'));
    const rcs = rcFiles.reduce((acc, p) => Object.assign(acc, loadRC(p)), {});
    return Object.assign(
        {
            root,
            cwd: process.cwd(),
        },
        rcs,
        { testFiles },
    );
}

yargs // eslint-disable-line
    .usage('Usage $0 <serve|run> [options]')
    .command('serve <glob>', 'start the server', (yar) => {
        yar
            .positional('glob', {
                describe: 'glob pattern of all test files',
                default: '**/*.test.js',
            })
            .option('port', {
                default: 8000,
            })
            .boolean('_example');
    }, (argv) => {
        const conf = resolveConf(argv.glob);
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
    .command('run <glob>', 'run the tests', (yar) => {
        yar
            .positional('glob', {
                describe: 'glob pattern of all test files',
                default: '**/*.test.js',
            })
            .boolean('_example')
            .boolean('headless');
    }, (argv) => {
        const conf = resolveConf(argv.glob);
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
