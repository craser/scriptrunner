import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent
} from "@elgato/streamdeck";
import {execFileSync} from 'node:child_process';
import { getColorPngPath, isColorAvailable } from '../utils/color-pngs';

/**
 * An example action class that displays a count that increments by one each time the button is pressed.
 */
@action({ UUID: "io.raser.streamdeck.scriptrunner.runscript" })
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
			const stdout = execFileSync(settings.scriptPath);
			const json = stdout.toString()?.trim();
			streamDeck.logger.info(`script returned: '${json}'`);
			const {title, color} = JSON.parse(json) as ScriptReturnSettings;

			if (title !== undefined) {
				streamDeck.logger.info(`setting title: '${title}'`);
				await ev.action.setTitle(title?.toString());
			}

			if (color && isColorAvailable(color)) {
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
}

/**
 * Settings for {@link RunScript}.
 */
type RunScriptSettings = {
	defaultTitle?: string;
	scriptPath: string
};


/**
 * Return JSON from scripts.
 */
type ScriptReturnSettings = {
	title?: string;
	color?: string;
};