const fs = require('fs');
const path = require('path');
let code = fs.readFileSync(path.join(__dirname, './dist/worker.amd.js')).toString();
code = code.replace(`define(['exports'],`, '');
code = code.replace(`define(["exports"],`, '');
code = code.substring(0, code.length - 3);

let worker = fs.readFileSync(path.join(__dirname, './src/worker/worker.ts')).toString();
worker = worker.replace('{code}', code);

fs.writeFileSync(path.join(__dirname, './src/worker/getworker.ts'), worker);