const fixtureTemplates = [];

export class FixtureTemplate {
    constructor(tpl) {
        this._tpl = tpl;
        this._instances = [];
    }
    static parse(strings, ...values) {
        const tpl = document.createElement('template');
        tpl.innerHTML = values.reduce((acc, v, idx) =>
            acc + v + strings[idx + 1], strings[0]);
        return tpl;
    }
    instanciateFixture() {
        const instance = this._tpl.cloneNode(true);
        const [el] = instance.content.children;
        if (!el) {
            throw new Error('No element');
        }
        document.body.appendChild(instance.content);
        this._instances.push(el);
        return el;
    }
    teardown() {
        this._instances.forEach(i => i.parentNode.removeChild(i));
        this._instances.length = 0;
    }
    dispose() {
        this.teardown();
    }
}

export function fixture(strings, ...values) {
    const tpl = FixtureTemplate.parse(strings, ...values);
    const fixtureTemplate = new FixtureTemplate(tpl);
    fixtureTemplates.push(fixtureTemplate);
    return () => fixtureTemplate.instanciateFixture();
}

export function setup(mocha) {
    mocha.suite.afterEach(() => {
        fixtureTemplates.forEach(t => t.teardown());
    });
}

export default {
    FixtureTemplate,
    fixture,
    setup,
};
