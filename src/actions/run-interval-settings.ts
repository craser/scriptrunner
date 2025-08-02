import {RunScriptSettings} from './run-script-settings';

/**
 * Settings for {@link RunInterval} that extends RunScriptSettings with monitoring capabilities.
 */
export type RunIntervalSettings = RunScriptSettings & {
    intervalScriptPath: string;
    intervalScriptArguments: string;
    intervalDelay: number;
};