import { add } from './add.js';

suite('TDD example', () => {
    test('should run', () => {
        const res = add(1, 1);
        assert.equal(res, 2);
    });
    test('should also run', () => {

    });
});
