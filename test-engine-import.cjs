try {
    console.log('Importing @apex/template-engine...');
    const engine = require('./packages/template-engine/dist/index.js');
    console.log('Import success:', Object.keys(engine));
} catch (error) {
    console.error('Import failed:', error);
}
