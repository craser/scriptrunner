import streamDeck, {
    action,
    DidReceiveSettingsEvent,
    KeyDownEvent,
    SingletonAction,
    WillAppearEvent, WillDisappearEvent
} from "@elgato/streamdeck";
import {execFileSync} from 'node:child_process';
import {ArgumentStringParser} from '../utils/argument-string-parser';
import {setInterval, clearInterval} from 'node:timers';
import {RunIntervalSettings} from './run-interval-settings';
import {DisplaySettings} from './display-settings';

/**
 * An example action class that displays a count that increments by one each time the button is pressed.
 */
@action({UUID: "io.raser.streamdeck.scriptrunner.runinterval"})
export class RunInterval extends SingletonAction<RunIntervalSettings> {

    intervals: any[] = [];

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
        return ev.action.setTitle(ev.payload.settings.defaultTitle || '');
    }

    /**
     * The {@link SingletonAction.onWillAppear} event is useful for setting the visual representation of an action when
     * it becomes visible. This could be due to the Stream Deck first starting up, or the user navigating between pages
     * / folders etc.. There is also an inverse of this event in the form of {@link streamDeck.client.onWillDisappear}.
     * In this example, we're setting the title to the "count" that is incremented in {@link RunScript.onKeyDown}.
     */
    override onWillAppear(ev: WillAppearEvent<RunIntervalSettings>): void | Promise<void> {
        streamDeck.logger.info("onWillAppear");
        this.intervals.push(setInterval(() => {
            streamDeck.logger.info(`running interval`);
            const now = new Date();
            const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
            ev.action.setTitle(time);
        }, 1000));
    }

    override onWillDisappear(ev: WillDisappearEvent<RunIntervalSettings>): void | Promise<void> {
        this.clearIntervals();
    }

    /**
     * Runs the configured script & updates the button per the output JSON.
     */
    override async onKeyDown(ev: KeyDownEvent<RunIntervalSettings>): Promise<void> {
        try {
            streamDeck.logger.info(`running script: '${ev.payload.settings.scriptPath}'`);
            const {settings} = ev.payload;
            const parser = new ArgumentStringParser();
            const args = settings.scriptArguments ? parser.parse(settings.scriptArguments) : [];
            const stdout = execFileSync(settings.scriptPath, args);
            const json = stdout.toString()?.trim();
            streamDeck.logger.info(`script returned: '${json}'`);
            await DisplaySettings.parseJson(json).apply(ev);
        } catch (e) {
            streamDeck.logger.error(`ERROR running script ${ev.payload.settings.scriptPath}`);
            streamDeck.logger.error(e);
            await ev.action.setTitle('ERROR');
        }
    }

}

