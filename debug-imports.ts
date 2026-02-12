import { Button } from '@apex/ui';
import { cn } from '@apex/ui';
import { BentoCard } from '@apex/ui/premium';

console.log('Checking @apex/ui exports...');
console.log('Button:', Button ? 'Defined' : 'Undefined');
console.log('cn:', cn ? 'Defined' : 'Undefined');
console.log('BentoCard:', BentoCard ? 'Defined' : 'Undefined');

if (!Button || !cn || !BentoCard) {
  process.exit(1);
}
console.log('All checks passed.');
