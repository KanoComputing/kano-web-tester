
/* eslint no-console: 'off' */
const xml = require('xml');

class XUnit {
    static get description() {
        return 'xunit';
    }
    constructor(runner) {
        this._listeners = [];
        runner.on('results', (jsonResults) => {
            console.log(xml(jsonResults, { indent: '    ' }));
            this._listeners.forEach(listener => listener.call(null));
        });
    }
    onDidFinish(cb) {
        this._listeners.push(cb);
    }
    dispose() {

    }
}

module.exports = XUnit;
