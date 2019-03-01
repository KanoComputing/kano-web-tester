suite('MakeSureItFails', () => {
    test('it fails', () => {
        throw new Error();
    });
});
