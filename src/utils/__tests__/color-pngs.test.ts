// ABOUTME: Test suite for color-pngs utility functions
// ABOUTME: Comprehensive tests including verification against actual PNG files

import * as fs from 'fs';
import * as path from 'path';
import { getColorPngPath, getAvailableColors, isColorAvailable } from '../color-pngs';

describe('color-pngs', () => {
    const colorsDir = path.join(__dirname, '../../../io.raser.streamdeck.scriptrunner.sdPlugin/imgs/colors');
    
    // Get actual PNG files from the filesystem
    const getActualPngFiles = (): string[] => {
        if (!fs.existsSync(colorsDir)) {
            throw new Error(`Colors directory not found: ${colorsDir}`);
        }
        return fs.readdirSync(colorsDir)
            .filter(file => file.endsWith('.png'))
            .map(file => file.replace('.png', ''))
            .sort();
    };

    describe('getColorPngPath', () => {
        test('should return correct path for valid color names', () => {
            expect(getColorPngPath('red')).toBe('imgs/colors/red.png');
            expect(getColorPngPath('blue')).toBe('imgs/colors/blue.png');
            expect(getColorPngPath('rebeccapurple')).toBe('imgs/colors/rebeccapurple.png');
        });

        test('should handle case insensitive color names', () => {
            expect(getColorPngPath('RED')).toBe('imgs/colors/red.png');
            expect(getColorPngPath('Blue')).toBe('imgs/colors/blue.png');
            expect(getColorPngPath('RebeccaPurple')).toBe('imgs/colors/rebeccapurple.png');
        });

        test('should return null for invalid color names', () => {
            expect(getColorPngPath('invalidcolor')).toBeNull();
            expect(getColorPngPath('notacolor')).toBeNull();
            expect(getColorPngPath('')).toBeNull();
        });

        test('should return null for undefined/null input', () => {
            expect(getColorPngPath(undefined as any)).toBeNull();
            expect(getColorPngPath(null as any)).toBeNull();
        });
    });

    describe('isColorAvailable', () => {
        test('should return true for valid color names', () => {
            expect(isColorAvailable('red')).toBe(true);
            expect(isColorAvailable('blue')).toBe(true);
            expect(isColorAvailable('rebeccapurple')).toBe(true);
        });

        test('should handle case insensitive color names', () => {
            expect(isColorAvailable('RED')).toBe(true);
            expect(isColorAvailable('Blue')).toBe(true);
            expect(isColorAvailable('RebeccaPurple')).toBe(true);
        });

        test('should return false for invalid color names', () => {
            expect(isColorAvailable('invalidcolor')).toBe(false);
            expect(isColorAvailable('notacolor')).toBe(false);
            expect(isColorAvailable('')).toBe(false);
        });

        test('should return false for undefined/null input', () => {
            expect(isColorAvailable(undefined as any)).toBe(false);
            expect(isColorAvailable(null as any)).toBe(false);
        });
    });

    describe('getAvailableColors', () => {
        test('should return an array of color names', () => {
            const colors = getAvailableColors();
            expect(Array.isArray(colors)).toBe(true);
            expect(colors.length).toBeGreaterThan(0);
        });

        test('should return a copy of the array (not reference)', () => {
            const colors1 = getAvailableColors();
            const colors2 = getAvailableColors();
            expect(colors1).not.toBe(colors2); // Different references
            expect(colors1).toEqual(colors2); // Same content
        });

        test('should return all colors in lowercase', () => {
            const colors = getAvailableColors();
            colors.forEach(color => {
                expect(color).toBe(color.toLowerCase());
            });
        });

        test('should not contain duplicates', () => {
            const colors = getAvailableColors();
            const uniqueColors = [...new Set(colors)];
            expect(colors).toEqual(uniqueColors);
        });
    });

    describe('PNG file coverage', () => {
        test('should support ALL PNG files in the colors directory', () => {
            const actualPngFiles = getActualPngFiles();
            const supportedColors = getAvailableColors();
            
            console.log(`Found ${actualPngFiles.length} PNG files`);
            console.log(`Supporting ${supportedColors.length} colors`);
            
            // Find missing colors (PNG files that exist but aren't supported)
            const missingColors = actualPngFiles.filter(color => !supportedColors.includes(color));
            
            // Find extra colors (supported colors that don't have PNG files)
            const extraColors = supportedColors.filter(color => !actualPngFiles.includes(color));
            
            if (missingColors.length > 0) {
                console.log('Missing colors (PNG files exist but not supported):');
                missingColors.forEach(color => console.log(`  - ${color}`));
            }
            
            if (extraColors.length > 0) {
                console.log('Extra colors (supported but no PNG file):');
                extraColors.forEach(color => console.log(`  - ${color}`));
            }
            
            // This test will fail if there are any missing colors
            expect(missingColors).toEqual([]);
            expect(extraColors).toEqual([]);
            
            // Verify we support all PNG files
            expect(supportedColors.length).toBe(actualPngFiles.length);
        });

        test('should have valid paths for all supported colors', () => {
            const supportedColors = getAvailableColors();
            
            supportedColors.forEach(color => {
                const path = getColorPngPath(color);
                expect(path).toBe(`imgs/colors/${color}.png`);
                expect(isColorAvailable(color)).toBe(true);
            });
        });

        test('all PNG files should have corresponding supported colors', () => {
            const actualPngFiles = getActualPngFiles();
            
            actualPngFiles.forEach(colorFromFile => {
                expect(isColorAvailable(colorFromFile)).toBe(true);
                expect(getColorPngPath(colorFromFile)).toBe(`imgs/colors/${colorFromFile}.png`);
            });
        });
    });

    describe('common HTML colors', () => {
        const commonColors = [
            'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
            'orange', 'purple', 'pink', 'brown', 'gray', 'grey', 'silver', 'gold',
            'lime', 'aqua', 'fuchsia', 'maroon', 'navy', 'olive', 'teal',
            'rebeccapurple', 'aliceblue', 'antiquewhite', 'aquamarine', 'azure',
            'beige', 'bisque', 'blanchedalmond', 'blueviolet', 'burlywood',
            'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue',
            'crimson', 'darkblue', 'darkcyan', 'darkgray', 'darkgreen',
            'darkmagenta', 'darkorange', 'darkred', 'darkviolet', 'deeppink',
            'dodgerblue', 'firebrick', 'forestgreen', 'gainsboro', 'ghostwhite',
            'goldenrod', 'greenyellow', 'honeydew', 'hotpink', 'indianred',
            'indigo', 'ivory', 'khaki', 'lavender', 'lawngreen', 'lightblue',
            'lightcoral', 'lightgray', 'lightgreen', 'lightpink', 'lightyellow',
            'limegreen', 'linen', 'mediumblue', 'mediumorchid', 'mediumpurple',
            'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'oldlace',
            'olivedrab', 'orangered', 'orchid', 'palegreen', 'peachpuff',
            'peru', 'plum', 'powderblue', 'rosybrown', 'royalblue',
            'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell',
            'sienna', 'skyblue', 'slateblue', 'slategray', 'snow',
            'springgreen', 'steelblue', 'tan', 'thistle', 'tomato',
            'turquoise', 'violet', 'wheat', 'whitesmoke', 'yellowgreen'
        ];

        test('should support all common HTML colors', () => {
            const supportedColors = getAvailableColors();
            const missingCommonColors = commonColors.filter(color => !supportedColors.includes(color));
            
            if (missingCommonColors.length > 0) {
                console.log('Missing common HTML colors:');
                missingCommonColors.forEach(color => console.log(`  - ${color}`));
            }
            
            expect(missingCommonColors).toEqual([]);
        });
    });

    describe('edge cases', () => {
        test('should handle colors with numbers', () => {
            // These might exist in the PNG files
            const numberedColors = ['darkslategray', 'lightslategray', 'slategray'];
            numberedColors.forEach(color => {
                if (isColorAvailable(color)) {
                    expect(getColorPngPath(color)).toBe(`imgs/colors/${color}.png`);
                }
            });
        });

        test('should handle gray vs grey variants', () => {
            const grayVariants = [
                ['gray', 'grey'],
                ['darkgray', 'darkgrey'],
                ['lightgray', 'lightgrey'],
                ['slategray', 'slategrey'],
                ['lightslategray', 'lightslategrey'],
                ['darkslategray', 'darkslategrey'],
                ['dimgray', 'dimgrey']
            ];

            grayVariants.forEach(([graySpelling, greySpelling]) => {
                const graySupported = isColorAvailable(graySpelling);
                const greySupported = isColorAvailable(greySpelling);
                
                // At least one spelling should be supported
                expect(graySupported || greySupported).toBe(true);
            });
        });
    });
});