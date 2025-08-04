import streamDeck, {
    action,
    DidReceiveSettingsEvent,
    KeyDownEvent,
    SingletonAction,
    WillAppearEvent
} from "@elgato/streamdeck";
import {execFile, execFileSync} from 'node:child_process';
import {ArgumentStringParser} from '../utils/argument-string-parser';
import {DisplaySettings} from './display-settings';
import {RunScriptSettings} from './run-script-settings';
import {RunIntervalSettings} from './run-interval-settings';


/**
 * An example action class that displays a count that increments by one each time the button is pressed.
 */
@action({UUID: "io.raser.streamdeck.scriptlink.runscript"})
export class RunScript extends SingletonAction<RunScriptSettings> {

    /**
     * Called when the user updates the config in the Stream Deck app. Just keeps the display in sync
     * with the actual config.
     */
    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<RunScriptSettings>) {
        return ev.action.setTitle(ev.payload.settings.defaultTitle || '');
    }

    /**
     * Called when the button is about to be shown either on the device, or in the Stream Deck app.
     */
    override onWillAppear(ev: WillAppearEvent<RunScriptSettings>): void | Promise<void> {
        const defaultTitle = ev.payload.settings.defaultTitle || '';
        return ev.action.setTitle(defaultTitle);
    }

    /**
     * Runs the configured script & updates the button per the output JSON.
     */
    override async onKeyDown(ev: KeyDownEvent<RunIntervalSettings>): Promise<void> {
        try {
            const {settings} = ev.payload;
            const {scriptPath, scriptArguments} = settings;
            const displaySettings = await this.executeScript(scriptPath, scriptArguments);
            await displaySettings.apply(ev);
        } catch (e) {
            streamDeck.logger.error(`ERROR running script ${ev.payload.settings.scriptPath}`);
            streamDeck.logger.error(e);
            await ev.action.setTitle('ERROR');
        }
    }

    async executeScript(scriptPath: string, scriptArguments: string | null | undefined): Promise<DisplaySettings> {
        return new Promise((resolve, reject) => {
            streamDeck.logger.info(`running script: '${scriptPath}'`);
            const parser = new ArgumentStringParser();
            const args = scriptArguments ? parser.parse(scriptArguments) : [];
            //const stdout = execFileSync(scriptPath, args);
            execFile(scriptPath, args, (error, stdout, stderr) => {
                try {
                    if (error) {
                        streamDeck.logger.error(`ERROR running script ${scriptPath}: ${stderr}`);
                        streamDeck.logger.error(error);
                        throw error;
                    }
                    const json = stdout.toString()?.trim();
                    streamDeck.logger.info(`script returned: '${json}'`);
                    const displaySettings = DisplaySettings.parseJson(json);
                    resolve(displaySettings);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

}