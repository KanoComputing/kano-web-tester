#!/usr/bin/env node
/* eslint global-require: 'off' */
const path = require('path');
const glob = require('glob');
const sywac = require('sywac');
const chalk = require('chalk');

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
            yar.boolean('noHeadless')
                .option('-r, --reporter', {
                    type: 'string',
                    desc: 'specify the reporter to use',
                    defaultValue: 'spec',
                });
        },
        run: (argv) => {
            const opts = resolveArgv(argv);
            Object.assign(opts, {
                puppeteer: {
                    reporter: argv.reporter,
                    headless: !argv['no-headless'],
                    slowMo: argv.slowMo,
                    timeout: argv.timeout,
                },
            });
            const PuppeteerRunner = require('../lib/puppeteer');
            const runner = new PuppeteerRunner(opts);
            return runner.run();
        },
    })
    .command('cover', {
        desc: 'run the tests and generate a coverage report',
        setup: (yar) => {
            applyDefault(yar);
            yar.boolean('noHeadless')
                .option('-r, --reporter', {
                    type: 'array:string',
                    desc: 'specify the reporter to use',
                    defaultValue: ['text-summary'],
                })
                .option('--exclude', {
                    type: 'array',
                    desc: 'glob patterns of source files to exclude from coverage',
                    defaultValue: [],
                });
        },
        run: (argv) => {
            const opts = resolveArgv(argv);
            const exclude = argv.exclude
                .reduce((acc, x) => acc.concat(glob.sync(x, { ignore: ['node_modules'] })), [])
                .map(x => path.resolve(x));
            Object.assign(opts, {
                puppeteer: {
                    reporter: argv.reporter,
                    headless: !argv['no-headless'],
                    slowMo: argv.slowMo,
                    timeout: argv.timeout,
                },
                coverage: true,
                exclude,
            });
            const PuppeteerRunner = require('../lib/puppeteer');
            const runner = new PuppeteerRunner(opts);
            return runner.run();
        },
    })
    .configure({ name: 'web-tester' })
    .showHelpByDefault()
    .version('--version, -v')
    .style({
        group: s => chalk.cyan.bold(s),
        desc: s => chalk.white(s),
        hints: s => chalk.dim(s),
        flagsError: s => chalk.red(s),
    });

sywac.parse(process.argv.slice(2)).then((result) => {
    if (result.output.length) {
        // eslint-disable-next-line no-console
        console.log(result.output);
    }
    process.exit(result.code);
});
