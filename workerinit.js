const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const bundlePath = path.join(__dirname, './dist/worker.amd.js');
let code = fs.readFileSync(bundlePath).toString();
console.log(chalk.greenBright(`read ${bundlePath} worker bundle success`));
code = code.replace(`define(['exports'],`, '');
code = code.replace(`define(["exports"],`, '');
code = code.substring(0, code.length - 3);

const workerTempPath = path.join(__dirname, './src/worker/worker.ts');
let worker = fs.readFileSync(workerTempPath).toString();
worker = worker.replace('{code}', code);
console.log(chalk.greenBright(`read ${workerTempPath} workte template success`));

const getWorkerPath = path.join(__dirname, './src/worker/getworker.ts');
fs.writeFileSync(getWorkerPath, worker);
console.log(chalk.greenBright(`write ${getWorkerPath} worker success`));