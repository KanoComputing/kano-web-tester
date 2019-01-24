/* globals Mocha */
import 'mocha/mocha.js';
/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */

const { Date } = window;

/**
 * Save original console.log.
 */
const log = console.log.bind(console);

/**
 * Initialize a new `Jenkins` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */

export class JUnit extends Mocha.reporters.Base {
    constructor(runner, opts) {
        super(runner);
        this.web = new Mocha.reporters.HTML(runner, opts);

        let currentSuite;
        this.jsonResults = {};

        const options = (opts && opts.reporterOptions) || {};

        if (options.webOnly) {
            this.spec = new Mocha.reporters.Spec(runner, opts);
        }

        this.proxy = options.proxy || (() => null);

        // From http://stackoverflow.com/a/961504 modified for JavaScript
        function removeInvalidXmlChars(str) {
            // Remove invalid surrogate low bytes first, no lookbehind in JS :(
            // Should be equal to str.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
            // Remove other characters that are not valid for XML documents
            return str.replace(/([^\ud800-\udbff])[\udc00-\udfff]|^[\udc00-\udfff]/g, '$1')
                // eslint-disable-next-line no-control-regex
                .replace(/[\ud800-\udbff](?![\udc00-\udfff])|[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ufeff\ufffe\uffff]/g, '');
        }

        const genSuiteReport = () => {
            let testCount = currentSuite.failures + currentSuite.passes;
            if (currentSuite.tests.length > testCount) {
                // we have some skipped suites included
                testCount = currentSuite.tests.length;
            }
            if (testCount === 0) {
                // no tests, we can safely skip printing this suite
                return;
            }

            const testSuite = {
                testsuite: [{
                    _attr: {
                        name: currentSuite.suite.fullTitle(),
                        tests: testCount,
                        errors: 0, /* not supported */
                        failures: currentSuite.failures,
                        skipped: testCount - currentSuite.failures - currentSuite.passes,
                        timestamp: currentSuite.start.toISOString().slice(0, -5),
                        time: currentSuite.duration / 1000,
                    },
                }],
            };

            let { tests } = currentSuite;

            if (tests.length === 0 && currentSuite.failures > 0) {
                // Get the runnable that failed, which is a beforeAll or beforeEach
                tests = [currentSuite.suite.ctx.runnable()];
            }

            tests.forEach((test) => {
                const testCase = {
                    testcase: [{
                        _attr: {
                            classname: currentSuite.suite.fullTitle(),
                            name: test.title,
                            time: 0.000,
                        },
                    }],
                };

                if (test.duration) {
                    testCase.testcase[0]._attr.time = test.duration / 1000;
                }

                if (test.state === 'failed') {
                    testCase.testcase.push({
                        failure: [
                            { _attr: { message: test.err.message || '' } },
                            test.err,
                        ],
                    });
                } else if (test.state === 'pending') {
                    testCase.testcase.push({ skipped: {} });
                }

                if (test.logEntries && test.logEntries.length) {
                    let systemOut = '';
                    test.logEntries.forEach((entry) => {
                        let outstr = `${entry}\n`;
                        outstr = removeInvalidXmlChars(outstr);
                        // We need to escape CDATA ending tags inside CDATA
                        outstr = outstr.replace(/]]>/g, ']]]]><![CDATA[>');
                        systemOut += outstr;
                    });
                    testCase.testcase.push({ 'system-out': { _cdata: systemOut } });
                }
                testSuite.testsuite.push(testCase);
            });

            this.jsonResults.testsuites.push(testSuite);
        };

        function startSuite(suite) {
            if (suite.tests.length > 0) {
                currentSuite = {
                    suite,
                    tests: [],
                    start: new Date(),
                    failures: 0,
                    passes: 0,
                };
            }
        }

        function endSuite() {
            if (currentSuite != null) {
                currentSuite.duration = new Date() - currentSuite.start;
                try {
                    genSuiteReport();
                } catch (err) { log(err); }
                currentSuite = null;
            }
        }

        function addTestToSuite(test) {
            currentSuite.tests.push(test);
        }

        runner.on('start', () => {
            const suitesName = 'Mocha Tests';
            this.jsonResults = {
                testsuites: [
                    { _attr: { name: suitesName } },
                ],
            };
        });

        runner.on('end', () => {
            endSuite();
            window.jsonResults = this.jsonResults;
        });

        runner.on('suite', (suite) => {
            if (currentSuite) {
                endSuite();
            }
            startSuite(suite);
        });

        runner.on('test', (test) => {
            // eslint-disable-next-line no-param-reassign
            test.logEntries = [];
            // eslint-disable-next-line no-console
            console.log = function l(...args) {
                log.apply(this, ...args);
                test.logEntries.push(...args);
            };
        });

        runner.on('test end', (/* test */) => {
            console.log = log;
        });

        runner.on('pending', (test) => {
            // eslint-disable-next-line no-param-reassign
            test.state = test.state || 'pending';
            addTestToSuite(test);
        });

        runner.on('pass', (test) => {
            currentSuite.passes += 1;
            addTestToSuite(test);
        });

        runner.on('fail', (test, err) => {
            if (currentSuite) {
                // Failure occurred outside of a test suite.
                startSuite({
                    tests: ['other'],
                    fullTitle() { return 'Non-test failures'; },
                });
                if (test) {
                    addTestToSuite({
                        title: 'unknown',
                        file: `${process.cwd()}/other.js`,
                        state: 'failed',
                        err,
                    });
                } else {
                    addTestToSuite(test);
                }
                endSuite();
                return;
            }
            addTestToSuite(test);
        });

        const proxyEvents = [
            'start',
            'suite',
            'suite end',
            'pending',
            'pass',
            'fail',
            'end',
        ];

        proxyEvents.forEach((eventName) => {
            runner.on(eventName, (...args) => {
                this.proxy(eventName, args);
            });
        });
    }
}

export default JUnit;
