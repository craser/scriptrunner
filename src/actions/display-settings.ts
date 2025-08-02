import streamDeck, {KeyDownEvent, WillAppearEvent} from '@elgato/streamdeck';
import {getColorPngPath, isColorAvailable} from '../utils/color-pngs';

/**
 * Return JSON from scripts.
 */
export class DisplaySettings {
    title?: string;
    color?: string;
    image?: string;

    static parseJson(json: string) {
        const { title, color, image } = JSON.parse(json);
        return new DisplaySettings(title, color, image);
    }

    constructor(title?: string, color?: string, image?: string) {
        this.title = title;
        this.color = color;
        this.image = image;
    }

    async apply(ev: WillAppearEvent | KeyDownEvent) {

        if (this.title !== undefined) {
            streamDeck.logger.info(`setting title: '${this.title}'`);
            await ev.action.setTitle(this.title?.toString());
        }

        // Handle background image - image takes precedence over color
        if (this.image) {
            streamDeck.logger.info(`setting background image: '${this.image}'`);
            await ev.action.setImage(this.image);
        } else if (this.color && isColorAvailable(this.color)) {
            const colorPath = getColorPngPath(this.color);
            if (colorPath) {
                streamDeck.logger.info(`setting background color: '${this.color}' -> '${colorPath}'`);
                await ev.action.setImage(colorPath);
            }
        }
    }
}