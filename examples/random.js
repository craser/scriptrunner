#!/Users/craser/.nvm/versions/node/v24.4.1/bin/node

const COLORS = [
    'black',
    'white',
    'red',
    'green',
    'blue',
    'yellow',
    'cyan',
    'magenta',
    'silver',
    'orange'
]

const n = Math.round(Math.random() * 10);
const color = COLORS[n];

console.log(JSON.stringify({
    title: color,
    color
}));