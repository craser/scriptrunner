import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent
} from "@elgato/streamdeck";
import {execFileSync} from 'node:child_process';

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
	 * Listens for the {@link SingletonAction.onKeyDown} event which is emitted by Stream Deck when an action is
	 * pressed. Stream Deck provides various events for tracking interaction with devices including key down/up, dial
	 * rotations, and device connectivity, etc. When triggered, {@link ev} object contains information about the event
	 * including any payloads and action information where applicable. In this example, our action will display a
	 * counter that increments by one each press. We track the current count on the action's persisted settings using
	 * `setSettings` and `getSettings`.
	 */
	override async onKeyDown(ev: KeyDownEvent<RunScriptSettings>): Promise<void> {
		try {
			streamDeck.logger.info(`running script: '${ev.payload.settings.scriptPath}'`);
			const {settings} = ev.payload;
			const stdout = execFileSync(settings.scriptPath);
			const json = stdout.toString()?.trim();
			streamDeck.logger.info(`script returned: '${json}'`);
			const {title} = JSON.parse(json);
			streamDeck.logger.info(`setting title: '${title}'`);
			await ev.action.setTitle(title?.toString());
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
	title?: string
};