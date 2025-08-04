import streamDeck, {
    action,
    DidReceiveSettingsEvent,
    KeyDownEvent,
    SingletonAction,
    WillAppearEvent,
    WillDisappearEvent
} from "@elgato/streamdeck";
import {execFile, execFileSync} from 'node:child_process';
import {ArgumentStringParser} from '../utils/argument-string-parser';
import {clearInterval, setInterval} from 'node:timers';
import {RunIntervalSettings} from './run-interval-settings';
import {DisplaySettings} from './display-settings';

/**
 * An example action class that displays a count that increments by one each time the button is pressed.
 */
@action({UUID: "io.raser.streamdeck.scriptlink.runinterval"})
export class RunInterval extends SingletonAction<RunIntervalSettings> {

    intervals: any[] = [];
    isIntervalScriptRunning = false;

    clearIntervals(): void {
        streamDeck.logger.info(`clearing intervals (found ${this.intervals.length} running, should be 1)`);
        this.intervals.map(t => clearInterval(t));
        this.intervals = [];
    }

    /**
     * Called when the user updates the config in the Stream Deck app. Just keeps the display in sync
     * with the actual config.
     */
    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<RunIntervalSettings>) {
        streamDeck.logger.info("onDidReceiveSettings");
        this.startInterval(ev);
        return ev.action.setTitle(ev.payload.settings.defaultTitle || '');
    }

    /**
     * When I have the patience to spelunk through the type system, I'll figure out what ev should actually be. For
     * now, the union type does the job, but man... feels ugly.
     *
     * @param ev
     * @private
     */
    private startInterval(ev: DidReceiveSettingsEvent<RunIntervalSettings> | WillAppearEvent<RunIntervalSettings>) {
        this.clearIntervals();
        if (this.validateIntervalSettings(ev.payload.settings)) {
            const {intervalScriptPath, intervalScriptArguments, intervalDelay} = ev.payload.settings;
            this.intervals.push(setInterval(async () => {
                if (!this.isIntervalScriptRunning) {
                    this.isIntervalScriptRunning = true;
                    streamDeck.logger.info(`running interval`);
                    const scriptStartTime = Date.now();
                    const displaySettings = await this.executeScript(intervalScriptPath, intervalScriptArguments);
                    const elapsed = Date.now() - scriptStartTime
                    streamDeck.logger.info(`Interval script ${intervalScriptPath} ran in ${elapsed}ms}`);
                    await displaySettings.apply(ev);
                    this.isIntervalScriptRunning = false;
                } else {
                    streamDeck.logger.warn(`Interval script takes longer to run than interval allows. Skipping this run.`)
                }
            }, intervalDelay * 1000));
        }
    }

    /**
     * Returns true if the settings can be used to run a local script on an interval.
     *
     * @param settings
     * @private
     */
    private validateIntervalSettings(settings: RunIntervalSettings): boolean {
        streamDeck.logger.info(`validating interval settings: ${JSON.stringify(settings)}`);
        const {intervalScriptPath, intervalDelay} = settings;
        streamDeck.logger.info(`intervalScriptPath (${typeof intervalScriptPath}): ${intervalScriptPath}`);
        streamDeck.logger.info(`intervalDelay (${typeof intervalDelay}): ${intervalDelay}`);


        let valid = !!intervalScriptPath && intervalDelay > 0;
        streamDeck.logger.info(`interval settings valid: ${valid}`);
        return valid;
    }

    /**
     * The {@link SingletonAction.onWillAppear} event is useful for setting the visual representation of an action when
     * it becomes visible. This could be due to the Stream Deck first starting up, or the user navigating between pages
     * / folders etc.. There is also an inverse of this event in the form of {@link streamDeck.client.onWillDisappear}.
     * In this example, we're setting the title to the "count" that is incremented in {@link RunScript.onKeyDown}.
     */
    override onWillAppear(ev: WillAppearEvent<RunIntervalSettings>): void | Promise<void> {
        streamDeck.logger.info("onWillAppear");
        this.startInterval(ev);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override onWillDisappear(ev: WillDisappearEvent<RunIntervalSettings>): void | Promise<void> {
        this.clearIntervals();
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

