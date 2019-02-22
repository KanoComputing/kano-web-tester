# Web Tester

Runs front-end mocha tests using puppeteer

## Installation

The web tester should always be installed as a local dependency, and the binary using npm scripts.

This ensures that the required tools are a dependency of your project

Install with:
```
yarn add --dev @kano/web-tester
```

## Usage

Place your test files in a directory e.g. `test`. web-tester wil look for all .js files in a given directory.

Run your tests with either:

```
# run tests with puppeteer and print the results to the console
web-tester run **/*test.js

# Serve a web page that runs the tests
web-tester serve **/*test.js

# Generate a coverage report
web-tester cover **/*test.js
```

You can create a `.web-tester.conf.json` to configure both mocha and puppeteer:

```json
{
    "mocha": {
        "ui": "tdd"
    },
    "puppeteer": {
        "slowMo": 1000
    }
}
```

In your package.json add a test script as follow to automate your tests

```json
{
    "scripts": {
        "test-ci": "web-tester run ./test -r xunit > test-results.xml"
    }
}
```

## Options

|Command|Options|
|---|---|
|`serve`|`--port`: Specifiy which port to use. Default: `8000`|
|`run`|`--no-headless`: Run puppeteer in no-headless mode. Displays the browser. Default: `false`|
| |`--reporter`, `-r`: Sepecify which reporter to use, `spec` or `xunit`. Default: `spec`|
|`cover`|`--no-headless`: Run puppeteer in no-headless mode. Displays the browser. Default: `false`|
| |`--reporter`, `-r`: Sepecify which reporter to use. All istanbul reporters are available. Default: `text-summary`|

## Helpers

The default assertion library is `assert` from `chai`. You can access it with:

```js
import { assert } from '@kano/web-tester/helpers.js';

assert.equal(2, 2);
```

The `fixture` helper allows you to prepare HTML Templates, access their elements directly and takes care of adding/removing them from the DOM automatically:

```js
import { fixture } from '@kano/web-tester/helpers.js';

const basic = fixture`
    <my-el></my-el>
`;

suite('my-el', () => {
    test('constructor', () => {
        // Returns the first element in the fixture.
        // These will be removed at the end of the test
        const el1 = basic();
        const el2 = basic();
    });
});

```
