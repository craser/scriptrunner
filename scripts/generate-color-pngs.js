// ABOUTME: Script to generate PNG files for HTML color names
// ABOUTME: Creates solid color PNG files for Stream Deck button backgrounds

import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create imgs/colors directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'io.raser.streamdeck.scriptrunner.sdPlugin', 'imgs', 'colors');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Standard HTML color names mapped to their hex values
const HTML_COLORS = {
    // Basic colors
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#008000',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'silver': '#C0C0C0',
    'gray': '#808080',
    'maroon': '#800000',
    'olive': '#808000',
    'lime': '#00FF00',
    'aqua': '#00FFFF',
    'teal': '#008080',
    'navy': '#000080',
    'fuchsia': '#FF00FF',
    'purple': '#800080',
    
    // Extended colors (subset of most commonly used)
    'orange': '#FFA500',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'gold': '#FFD700',
    'violet': '#EE82EE',
    'indigo': '#4B0082',
    'turquoise': '#40E0D0',
    'coral': '#FF7F50',
    'salmon': '#FA8072',
    'khaki': '#F0E68C',
    'tan': '#D2B48C',
    'crimson': '#DC143C',
    'darkblue': '#00008B',
    'darkgreen': '#006400',
    'darkorange': '#FF8C00',
    'darkred': '#8B0000',
    'lightblue': '#ADD8E6',
    'lightgreen': '#90EE90',
    'lightgray': '#D3D3D3',
    'rebeccapurple': '#663399',
    'royalblue': '#4169E1',
    'forestgreen': '#228B22',
    'steelblue': '#4682B4',
    'tomato': '#FF6347'
};

// Generate PNG for each color
function generateColorPNG(colorName, hexColor) {
    const canvas = createCanvas(72, 72);
    const ctx = canvas.getContext('2d');
    
    // Fill with solid color
    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, 72, 72);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(assetsDir, `${colorName}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`Generated: ${filename}`);
}

// Generate all color PNGs
console.log('Generating color PNG files...');
for (const [colorName, hexColor] of Object.entries(HTML_COLORS)) {
    generateColorPNG(colorName, hexColor);
}

console.log(`Generated ${Object.keys(HTML_COLORS).length} color PNG files in ${assetsDir}`);