const fs = require('fs');
const path = require('path');
let code = fs.readFileSync(path.join(__dirname, './dist/worker.amd.js')).toString();
code = code.replace(`define(['exports'],`, '');
code = code.replace(`define(["exports"],`, '');
code = code.substring(0, code.length - 3);

let worker = fs.readFileSync(path.join(__dirname, './src/worker/worker.js')).toString();
worker = worker.replace('{code}', code);

const workerdir = path.join(__dirname, './dist/worker/');
if (!fs.existsSync(workerdir)) {
    fs.mkdirSync(workerdir);
}
fs.writeFileSync(path.join(__dirname, './dist/worker/worker.js'), worker);