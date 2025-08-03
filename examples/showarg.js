#!/usr/bin/env node

const n = process.argv[2] ? parseInt(process.argv[2]) : 0;
const args = process.argv.slice(3)
const title = args[n % args.length];

console.log(JSON.stringify({
    title
}));