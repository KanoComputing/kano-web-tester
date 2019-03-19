/* eslint-disable no-console */
const BrowserFetcher = require('puppeteer-core/lib/BrowserFetcher');
const puppeteerPkg = require('puppeteer-core/package.json');
const fs = require('fs');
const chromiumCachePath = require('./cache');

try {
    fs.lstatSync(chromiumCachePath);
} catch (e) {
    fs.mkdirSync(chromiumCachePath);
}

const downloadHost = process.env.PUPPETEER_DOWNLOAD_HOST
    || process.env.npm_config_puppeteer_download_host
    || process.env.npm_package_config_puppeteer_download_host;

const browserFetcher = new BrowserFetcher(chromiumCachePath, { host: downloadHost });

const revision = process.env.PUPPETEER_CHROMIUM_REVISION
    || process.env.npm_config_puppeteer_chromium_revision
    || process.env.npm_package_config_puppeteer_chromium_revision
    || puppeteerPkg.puppeteer.chromium_revision;

const revisionInfo = browserFetcher.revisionInfo(revision);

// Override current environment proxy settings with npm configuration, if any.
const NPM_HTTPS_PROXY = process.env.npm_config_https_proxy || process.env.npm_config_proxy;
const NPM_HTTP_PROXY = process.env.npm_config_http_proxy || process.env.npm_config_proxy;
const NPM_NO_PROXY = process.env.npm_config_no_proxy;

if (NPM_HTTPS_PROXY) {
    process.env.HTTPS_PROXY = NPM_HTTPS_PROXY;
}
if (NPM_HTTP_PROXY) {
    process.env.HTTP_PROXY = NPM_HTTP_PROXY;
}
if (NPM_NO_PROXY) {
    process.env.NO_PROXY = NPM_NO_PROXY;
}

let logged = false;

function onSuccess(localRevisions) {
    console.log(`Chromium downloaded to ${revisionInfo.folderPath}`);
    const filteredRevisions = localRevisions.filter(rev => rev !== revisionInfo.revision);
    // Remove previous chromium revisions.
    const cleanupOldVersions = filteredRevisions.map(rev => browserFetcher.remove(rev));
    return Promise.all([...cleanupOldVersions]);
}

function onProgress() {
    if (logged) {
        return;
    }
    console.log(`Downloading Chromium r${revision}`);
    logged = true;
}

function onError(e) {
    console.error(`ERROR: Failed to download Chromium r${revision}!`);
    console.error(e);
    process.exit(1);
}

browserFetcher.download(revisionInfo.revision, onProgress)
    .then(() => browserFetcher.localRevisions())
    .then(onSuccess)
    .catch(onError);
