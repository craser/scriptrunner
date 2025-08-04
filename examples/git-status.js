#!/Users/craser/.nvm/versions/node/v24.4.1/bin/node

import { execSync } from 'child_process';
try {
    const repo = process.argv[2] || throw "No repo specified";
    const status = execSync(`cd "${repo}" && git status --porcelain`, { encoding: 'utf8' });
    const changes = status.trim().split('\n').length;

    if (status.trim() === '') {
        console.log(JSON.stringify({ title: "Clean", color: "green" }));
    } else {
        console.log(JSON.stringify({ title: `${changes} changes`, color: "orange" }));
    }
} catch (e) {
    console.log(JSON.stringify({ title: "Not a repo", color: "gray" }));
}