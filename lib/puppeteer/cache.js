const path = require('path');

const appData = process.env.APPDATA || (process.platform === 'darwin'
    ? path.join(process.env.HOME || '', 'Library/Preferences') : '/var/local');

const chromiumCachePath = process.env.WEB_TESTER_CHROMIUM_CACHE
    || process.env.npm_config_web_tester_chromium_cache
    || process.env.npm_package_web_tester_chromium_cache
    || path.join(appData, 'web-tester-chromium');

module.exports = chromiumCachePath;
