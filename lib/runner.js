class Runner {
    constructor({
        cwd, root, _example, testFiles, mocha,
    } = {}) {
        this.cwd = cwd;
        this.root = root;
        this._example = _example;
        this.testFiles = testFiles;
        this.mocha = mocha;
    }
}

module.exports = Runner;
