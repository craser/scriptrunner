// ABOUTME: This file provides PNG file mapping for HTML color names
// ABOUTME: Maps standard HTML color names to corresponding PNG file paths

/**
 * Gets the PNG file path for the given HTML color name
 */
export function getColorPngPath(colorName: string): string | null {
    const normalizedColor = colorName.toLowerCase();
    if (!AVAILABLE_COLORS.includes(normalizedColor)) {
        return null;
    }
	
    // Return path relative to the Stream Deck plugin directory
    return `imgs/colors/${normalizedColor}.png`;
}

/**
 * Returns all available HTML color names
 */
export function getAvailableColors(): string[] {
    return [...AVAILABLE_COLORS];
}

/**
 * Checks if a color name is available
 */
export function isColorAvailable(colorName: string): boolean {
    if (colorName) {
        return AVAILABLE_COLORS.includes(colorName.toLowerCase());
    } else {
        return false;
    }
}

/**
 * Available HTML color names (must match the PNG files generated)
 */
const AVAILABLE_COLORS: string[] = [
    // Basic colors
    'black',
    'white',
    'red',
    'green',
    'blue',
    'yellow',
    'cyan',
    'magenta',
    'silver',
    'gray',
    'maroon',
    'olive',
    'lime',
    'aqua',
    'teal',
    'navy',
    'fuchsia',
    'purple',
	
    // Extended colors (subset of most commonly used)
    'orange',
    'pink',
    'brown',
    'gold',
    'violet',
    'indigo',
    'turquoise',
    'coral',
    'salmon',
    'khaki',
    'tan',
    'crimson',
    'darkblue',
    'darkgreen',
    'darkorange',
    'darkred',
    'lightblue',
    'lightgreen',
    'lightgray',
    'rebeccapurple',
    'royalblue',
    'forestgreen',
    'steelblue',
    'tomato'
];