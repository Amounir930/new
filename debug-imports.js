const ui = require('@apex/ui');
const premium = require('@apex/ui/premium');

console.log('Checking @apex/ui exports (CJS)...');
console.log('Keys:', Object.keys(ui));
console.log('Button:', ui.Button ? 'Defined' : 'Undefined');
console.log('cn:', ui.cn ? 'Defined' : 'Undefined');

console.log('Checking @apex/ui/premium exports (CJS)...');
console.log('Keys:', Object.keys(premium));
console.log('BentoCard:', premium.BentoCard ? 'Defined' : 'Undefined');
