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

const n = process.argv[2] ? parseInt(process.argv[2]) : 0;
const color = COLORS[n];
const image = `imgs/colors/${color}.png`

console.log(JSON.stringify({
    title: `[[${color}]]`,
    //color,
    image
}));