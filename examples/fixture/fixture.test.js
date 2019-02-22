import { fixture } from '../../helpers.js';

const exampleFixture = fixture`
    <button></button>
`;

suite('Fixture example', () => {
    test('button click', (done) => {
        const button = exampleFixture();
        button.addEventListener('click', () => done());
        button.click();
    });
});
