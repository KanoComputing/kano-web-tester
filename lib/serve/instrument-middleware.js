const { createInstrumenter } = require('istanbul-lib-instrument');
const transformMiddleware = require('./transform');
const path = require('path');

function instrument(code, filename) {
    const instrumenter = createInstrumenter({
        autoWrap: true,
        coverageVariable: '__coverage__',
        embedSource: true,
        esModules: true,
    });
    // Ignore babel errors. This is a safeguard against inccorect file types that
    // Could've passed throught the content type check
    try {
        return instrumenter.instrumentSync(code, filename);
    } catch (e) {
        return code;
    }
}

function instrumentMiddleware({ testFiles = [], ignore = [] } = {}) {
    const files = testFiles.map(f => path.join(process.cwd(), f)).concat(ignore);
    return transformMiddleware((root, buffer, contentType, filePath) => {
        if (contentType !== 'application/javascript'
            || files.indexOf(filePath) !== -1
            || filePath.indexOf('node_modules') !== -1) {
            return buffer;
        }
        return instrument(buffer, filePath);
    });
}

module.exports = instrumentMiddleware;
