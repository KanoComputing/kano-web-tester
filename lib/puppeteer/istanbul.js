/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const path = require('path');
const api = require('istanbul-api');
const libCoverage = require('istanbul-lib-coverage');

class IstanbulOutput {
    constructor(obj) {
        this.obj = obj;
        const config = api.config.loadObject({});
        this.rep = api.createReporter(config);
    }
    applySourceMap(sourceMapCache) {
        // Transform the coverage data to take the sourcemaps in account
        const transformed = sourceMapCache
            .transformCoverage(libCoverage.createCoverageMap(this.obj));
        this.obj = transformed.map.data;
    }
    addAll(reporters) {
        reporters.forEach(rep => this.addReporter(rep));
    }
    addReporter(name) {
        try {
            const { config } = this.rep;
            const rptConfig = config.reporting.reportConfig()[name] || {};
            const Cons = require(path.join(__dirname, 'reporters/istanbul', name));
            this.rep.reports[name] = new Cons(rptConfig);
        } catch (e) {
            this.rep.add(name);
        }
    }
    write() {
        const map = libCoverage.createCoverageMap(this.obj);
        this.rep.write(map);
    }
}

module.exports = IstanbulOutput;
