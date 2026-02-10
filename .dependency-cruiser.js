/** @type {import('@dependency-cruiser/dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        {
            name: 'no-circular',
            severity: 'warn',
            comment: 'Warn on circular dependencies',
            from: {},
            to: { circular: true }
        }
    ],
    options: {
        doNotFollow: {
            path: 'node_modules'
        },
        tsConfig: {
            fileName: 'tsconfig.json'
        }
    }
};
