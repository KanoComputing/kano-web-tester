const fs = require('fs');
const path = require('path');
const url = require('url');
const resolve = require('resolve');

module.exports = (opts = {}) => {
    const { cwd, mocha = {}, testFiles = [] } = opts;
    const webTesterExample = opts._example;

    const indexTplPath = path.join(__dirname, './index.html.tpl');
    const indexTplContents = fs.readFileSync(indexTplPath, 'utf-8');

    const cssPath = resolve.sync('mocha/mocha.css', { basedir: cwd });

    const data = {
        TESTS: `[${testFiles.map(t => `'${t}'`).join(',\n')}]`,
        MOCHA_OPTS: JSON.stringify(mocha),
        MOCHA_CSS: `/${path.relative(cwd, cssPath).replace(/\\/g, '/')}`,
    };

    if (webTesterExample) {
        data.IMPORT = '../../browser.js';
    } else {
        const jsPath = resolve.sync('@kano/web-tester/browser.js', { basedir: cwd });
        data.IMPORT = `/${path.relative(cwd, jsPath).replace(/\\/g, '/')}`;
    }

    const indexContents = indexTplContents.replace(/\${(.*?)}/g, (match, g0) => data[g0]);

    return (req, res, next) => {
        const parsed = url.parse(req.url);
        if (parsed.pathname === '/' || parsed.pathname === '/index.html') {
            res.setHeader('Content-Type', 'text/html');
            return res.end(indexContents);
        }
        return next();
    };
};
