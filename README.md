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
# run tests with puppeteer and print the xunit results to the console
web-tester run ./test
# Serve a web page that runs the tests
web-tester serve ./test
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
        "test-ci": "web-tester run ./test > test-results.xml"
    }
}
```