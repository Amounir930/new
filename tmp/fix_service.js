import fs from 'fs';

const filePath = 'c:/Users/Dell/Desktop/60sec.shop/apps/api/src/storefront/storefront.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Specific replacement for the line that is failing
const target = /updatedAt: new Date\(\),/g;
const replacement = 'updatedAt: new Date().toISOString(),';

if (target.test(content)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Successfully updated updatedAt in StorefrontService');
} else {
    console.error('Target Not Found in StorefrontService');
}
