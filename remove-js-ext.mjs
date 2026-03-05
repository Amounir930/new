import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('C:/Users/Dell/Desktop/60sec.shop/packages/provisioning/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/(from\s+['"].*)\.js(['"])/g, '$1$2');
    content = content.replace(/(import\s+.*from\s+['"].*)\.js(['"])/g, '$1$2');
    fs.writeFileSync(file, content);
});
console.log('Successfully replaced .js extensions in ' + files.length + ' files.');
