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
    constructor(runner, options) {
        super(runner);
        this.web = new Mocha.reporters.HTML(runner, options);

        const self = this;
        let currentSuite;
        this.jsonResults = {};

        options = (options && options.reporterOptions) || {};

        this.proxy = options.proxy || (() => null);

        // From http://stackoverflow.com/a/961504 modified for JavaScript
        function removeInvalidXmlChars(str) {
            // Remove invalid surrogate low bytes first, no lookbehind in JS :(
            // Should be equal to str.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
            str = str.replace(/([^\ud800-\udbff])[\udc00-\udfff]|^[\udc00-\udfff]/g, '$1');
            // Remove other characters that are not valid for XML documents
            return str.replace(/[\ud800-\udbff](?![\udc00-\udfff])|[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ufeff\ufffe\uffff]/g, '');
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
                            classname: getClassName(test, currentSuite.suite),
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
        }

        function startSuite(suite) {
            if (suite.tests.length > 0) {
                currentSuite = {
                    suite,
                    tests: [],
                    start: new Date(),
                    failures: 0,
                    passes: 0,
                };
                log();
                log(`  ${suite.fullTitle()}`);
            }
        }

        function endSuite() {
            if (currentSuite != null) {
                currentSuite.duration = new Date() - currentSuite.start;
                log();
                log(`  Suite duration: ${currentSuite.duration / 1000} s, Tests: ${currentSuite.tests.length}`);
                try {
                    genSuiteReport();
                } catch (err) { log(err); }
                currentSuite = null;
            }
        }

        function addTestToSuite(test) {
            currentSuite.tests.push(test);
        }

        function getClassName(test, suite) {
            if (options.junit_report_packages) {
                const testPackage = test.file.replace(/[^\/]*$/, '');
                const delimiter = testPackage ? '.' : '';
                return testPackage + delimiter + suite.fullTitle();
            }
            if (options.junit_report_name) {
                return `${options.junit_report_name}.${suite.fullTitle()}`;
            }
            return suite.fullTitle();
        }

        runner.on('start', () => {
            const suitesName = options.junit_report_name || 'Mocha Tests';
            this.jsonResults = {
                testsuites: [
                    { _attr: { name: suitesName } },
                ],
            };
        });

        runner.on('end', () => {
            endSuite();
            window.jsonResults = this.jsonResults;
            try {
                self.epilogue.call(self);
            } catch (e) {
                // Epilogue is not considered critical, fail silently
            }
        });

        runner.on('suite', (suite) => {
            if (currentSuite) {
                endSuite();
            }
            startSuite(suite);
        });

        runner.on('test', (test) => {
            test.logEntries = [];
            console.log = function () {
                log.apply(this, arguments);
                test.logEntries.push(Array.prototype.slice.call(arguments));
            };
        });

        runner.on('test end', (/* test */) => {
            console.log = log;
        });

        runner.on('pending', (test) => {
            test.state = test.state || 'pending';
            addTestToSuite(test);
        });

        runner.on('pass', (test) => {
            currentSuite.passes += 1;
            addTestToSuite(test);
        });

        runner.on('fail', (test, err) => {
            if (currentSuite == undefined) {
                // Failure occurred outside of a test suite.
                startSuite({
                    tests: ['other'],
                    fullTitle() { return 'Non-test failures'; },
                });
                if (test == undefined) {
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
