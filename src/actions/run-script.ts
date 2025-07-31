import streamDeck, {
    action,
    DidReceiveSettingsEvent,
    KeyDownEvent,
    SingletonAction,
    WillAppearEvent
} from "@elgato/streamdeck";
import {execFileSync} from 'node:child_process';
import {getColorPngPath, isColorAvailable} from '../utils/color-pngs';

/**
 * An example action class that displays a count that increments by one each time the button is pressed.
 */
@action({UUID: "io.raser.streamdeck.scriptrunner.runscript"})
export class RunScript extends SingletonAction<RunScriptSettings> {

    /**
     * Called when the user updates the config in the Stream Deck app. Just keeps the display in sync
     * with the actual config.
     */
    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<RunScriptSettings>) {
        return ev.action.setTitle(ev.payload.settings.defaultTitle || '');
    }

    /**
     * The {@link SingletonAction.onWillAppear} event is useful for setting the visual representation of an action when
     * it becomes visible. This could be due to the Stream Deck first starting up, or the user navigating between pages
     * / folders etc.. There is also an inverse of this event in the form of {@link streamDeck.client.onWillDisappear}.
     * In this example, we're setting the title to the "count" that is incremented in {@link RunScript.onKeyDown}.
     */
    override onWillAppear(ev: WillAppearEvent<RunScriptSettings>): void | Promise<void> {
        const defaultTitle = ev.payload.settings.defaultTitle || '';
        return ev.action.setTitle(defaultTitle);
    }

    /**
     * Runs the configured script & updates the button per the output JSON.
     */
    override async onKeyDown(ev: KeyDownEvent<RunScriptSettings>): Promise<void> {
        try {
            streamDeck.logger.info(`running script: '${ev.payload.settings.scriptPath}'`);
            const {settings} = ev.payload;
            const args = settings.scriptArguments ? this.parseArgumentsLiteral(settings.scriptArguments) : [];
            const stdout = execFileSync(settings.scriptPath, args);
            const json = stdout.toString()?.trim();
            streamDeck.logger.info(`script returned: '${json}'`);
            const {title, color, image} = JSON.parse(json) as ScriptReturnSettings;

            if (title !== undefined) {
                streamDeck.logger.info(`setting title: '${title}'`);
                await ev.action.setTitle(title?.toString());
            }

            // Handle background image - image takes precedence over color
            if (image) {
                streamDeck.logger.info(`setting background image: '${image}'`);
                await ev.action.setImage(image);
            } else if (color && isColorAvailable(color)) {
                const colorPath = getColorPngPath(color);
                if (colorPath) {
                    streamDeck.logger.info(`setting background color: '${color}' -> '${colorPath}'`);
                    await ev.action.setImage(colorPath);
                }
            }
        } catch (e) {
            streamDeck.logger.error(`ERROR running script ${ev.payload.settings.scriptPath}`);
            streamDeck.logger.error(e);
            await ev.action.setTitle('ERROR');
        }
    }

    /**
     * Parse the string entered by the user into an Array of string arguments we can
     * pass to the script.
     *
     * For example,
     *   • "5" -> "5"
     *   • "'one two' three" -> "one two", "three"
     *   • "'"wrapped"'" -> "\"wrapped\""
     *   • ""\"wrapped\"" -> "\"wrapped\""
     *
     * @param args
     */
    parseArgumentsLiteral(literal: string): string[] {
        const args: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        let i = 0;
        
        while (i < literal.length) {
            const char = literal[i];
            
            if (!inQuotes) {
                // Not in quotes - look for quote start or whitespace
                if (char === '"' || char === "'") {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === ' ' || char === '\t') {
                    // Whitespace - end current argument if it has content
                    if (current.length > 0) {
                        args.push(current);
                        current = '';
                    }
                    // Skip additional whitespace
                    while (i + 1 < literal.length && (literal[i + 1] === ' ' || literal[i + 1] === '\t')) {
                        i++;
                    }
                } else {
                    current += char;
                }
            } else {
                // In quotes - look for matching quote end
                if (char === quoteChar) {
                    inQuotes = false;
                    quoteChar = '';
                } else if (char === '\\' && i + 1 < literal.length) {
                    // Handle escape sequences
                    const nextChar = literal[i + 1];
                    if (nextChar === '"' || nextChar === "'" || nextChar === '\\') {
                        current += nextChar;
                        i++; // Skip the escaped character
                    } else {
                        current += char;
                    }
                } else {
                    current += char;
                }
            }
            i++;
        }
        
        // Add final argument if any
        if (current.length > 0) {
            args.push(current);
        }
        
        return args;
    }
}

/**
 * Settings for {@link RunScript}.
 */
type RunScriptSettings = {
    defaultTitle?: string;
    scriptPath: string;
    scriptArguments?: string;
};


/**
 * Return JSON from scripts.
 */
type ScriptReturnSettings = {
    title?: string;
    color?: string;
    image?: string;
};