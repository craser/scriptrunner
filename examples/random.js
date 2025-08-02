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

const n = Math.round(Math.random() * 100) % COLORS.length;
const color = COLORS[n];
const image = `imgs/colors/${color}.png`

console.log(JSON.stringify({
    title: `[[${color}]]`,
    //color,
    image
}));