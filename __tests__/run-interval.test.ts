// ABOUTME: Test suite for run-interval.ts - the RunInterval action class
// ABOUTME: Tests interval monitoring functionality, script execution, and Stream Deck event handling

import streamDeck from '@elgato/streamdeck';
import { execFileSync } from 'node:child_process';
import { setInterval, clearInterval } from 'node:timers';
import { RunInterval } from '../src/actions/run-interval';
import { ArgumentStringParser } from '../src/utils/argument-string-parser';
import { DisplaySettings } from '../src/actions/display-settings';
import { RunIntervalSettings } from '../src/actions/run-interval-settings';

// Mock all dependencies
jest.mock('@elgato/streamdeck', () => ({
    __esModule: true,
    default: {
        logger: {
            info: jest.fn(),
            error: jest.fn(),
        },
    },
    action: jest.fn().mockImplementation(() => (target: any) => target),
    SingletonAction: class MockSingletonAction {
        constructor() {}
    },
}));

jest.mock('node:child_process', () => ({
    execFileSync: jest.fn(),
}));

jest.mock('node:timers', () => ({
    setInterval: jest.fn(),
    clearInterval: jest.fn(),
}));

jest.mock('../src/utils/argument-string-parser', () => ({
    ArgumentStringParser: jest.fn().mockImplementation(() => ({
        parse: jest.fn(),
    })),
}));

jest.mock('../src/actions/display-settings', () => ({
    DisplaySettings: {
        parseJson: jest.fn(),
    },
}));

// Mock types
const mockExecFileSync = execFileSync as jest.MockedFunction<typeof execFileSync>;
const mockSetInterval = setInterval as jest.MockedFunction<typeof setInterval>;
const mockClearInterval = clearInterval as jest.MockedFunction<typeof clearInterval>;
const mockParseJson = DisplaySettings.parseJson as jest.MockedFunction<typeof DisplaySettings.parseJson>;

describe('RunInterval', () => {
    let runInterval: RunInterval;
    let mockAction: any;
    let mockDisplaySettings: any;
    let mockArgumentParser: any;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup mock action
        mockAction = {
            setTitle: jest.fn().mockResolvedValue(undefined),
        };

        // Setup mock display settings
        mockDisplaySettings = {
            apply: jest.fn().mockResolvedValue(undefined),
        };
        mockParseJson.mockReturnValue(mockDisplaySettings);

        // Setup mock argument parser
        mockArgumentParser = {
            parse: jest.fn().mockReturnValue([]),
        };
        (ArgumentStringParser as jest.MockedClass<typeof ArgumentStringParser>).mockImplementation(() => mockArgumentParser);

        // Setup mock execFileSync to return valid JSON
        mockExecFileSync.mockReturnValue(Buffer.from('{"title": "Test Result"}'));

        // Setup mock setInterval to return a timer ID
        mockSetInterval.mockReturnValue(123 as any);

        // Create instance
        runInterval = new RunInterval();
    });

    describe('constructor', () => {
        test('should initialize with empty intervals array', () => {
            expect(runInterval.intervals).toEqual([]);
        });
    });

    describe('clearIntervals', () => {
        test('should clear all intervals and reset array', () => {
            // Setup some mock intervals
            runInterval.intervals = [123, 456, 789];

            runInterval.clearIntervals();

            expect(mockClearInterval).toHaveBeenCalledTimes(3);
            expect(mockClearInterval).toHaveBeenCalledWith(123);
            expect(mockClearInterval).toHaveBeenCalledWith(456);
            expect(mockClearInterval).toHaveBeenCalledWith(789);
            expect(runInterval.intervals).toEqual([]);
        });

        test('should log number of intervals being cleared', () => {
            runInterval.intervals = [123, 456];

            runInterval.clearIntervals();

            expect(streamDeck.logger.info).toHaveBeenCalledWith('clearing intervals (found 2 running, should be 1)');
        });

        test('should handle empty intervals array', () => {
            runInterval.intervals = [];

            runInterval.clearIntervals();

            expect(mockClearInterval).not.toHaveBeenCalled();
            expect(streamDeck.logger.info).toHaveBeenCalledWith('clearing intervals (found 0 running, should be 1)');
        });
    });

    describe('onDidReceiveSettings', () => {
        test('should start interval and set title', async () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        defaultTitle: 'Test Title',
                        intervalScriptPath: '/path/to/script.sh',
                        intervalDelay: 5,
                    } as RunIntervalSettings,
                },
            };

            const result = await runInterval.onDidReceiveSettings(mockEvent as any);

            expect(streamDeck.logger.info).toHaveBeenCalledWith('onDidReceiveSettings');
            expect(mockAction.setTitle).toHaveBeenCalledWith('Test Title');
            expect(result).toBeUndefined();
        });

        test('should use empty string when defaultTitle is not provided', async () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '/path/to/script.sh',
                        intervalDelay: 5,
                    } as RunIntervalSettings,
                },
            };

            await runInterval.onDidReceiveSettings(mockEvent as any);

            expect(mockAction.setTitle).toHaveBeenCalledWith('');
        });
    });

    describe('onWillAppear', () => {
        test('should start interval when appearing', () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '/path/to/script.sh',
                        intervalDelay: 5,
                    } as RunIntervalSettings,
                },
            };

            runInterval.onWillAppear(mockEvent as any);

            expect(streamDeck.logger.info).toHaveBeenCalledWith('onWillAppear');
            // startInterval should be called (tested separately)
        });
    });

    describe('onWillDisappear', () => {
        test('should clear intervals when disappearing', () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {} as RunIntervalSettings,
                },
            };

            runInterval.intervals = [123, 456];

            runInterval.onWillDisappear(mockEvent as any);

            expect(mockClearInterval).toHaveBeenCalledTimes(2);
            expect(runInterval.intervals).toEqual([]);
        });
    });

    describe('onKeyDown - inherited behavior from run-script', () => {
        test('should execute script and update display on key down', async () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        scriptPath: '/path/to/script.sh',
                        scriptArguments: 'arg1 arg2',
                    } as RunIntervalSettings,
                },
            };

            mockArgumentParser.parse.mockReturnValue(['arg1', 'arg2']);
            mockExecFileSync.mockReturnValue(Buffer.from('{"title": "Button Title"}'));

            await runInterval.onKeyDown(mockEvent as any);

            expect(mockArgumentParser.parse).toHaveBeenCalledWith('arg1 arg2');
            expect(streamDeck.logger.info).toHaveBeenCalledWith("running script: '/path/to/script.sh'");
            expect(mockExecFileSync).toHaveBeenCalledWith('/path/to/script.sh', ['arg1', 'arg2']);
            expect(streamDeck.logger.info).toHaveBeenCalledWith('script returned: \'{"title": "Button Title"}\'');
            expect(mockParseJson).toHaveBeenCalledWith('{"title": "Button Title"}');
            expect(mockDisplaySettings.apply).toHaveBeenCalledWith(mockEvent);
        });

        test('should handle script execution error and set ERROR title', async () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        scriptPath: '/path/to/failing-script.sh',
                        scriptArguments: '',
                    } as RunIntervalSettings,
                },
            };

            const error = new Error('Script execution failed');
            mockExecFileSync.mockImplementation(() => {
                throw error;
            });

            await runInterval.onKeyDown(mockEvent as any);

            expect(streamDeck.logger.error).toHaveBeenCalledWith('ERROR running script /path/to/failing-script.sh');
            expect(streamDeck.logger.error).toHaveBeenCalledWith(error);
            expect(mockAction.setTitle).toHaveBeenCalledWith('ERROR');
        });

        test('should handle empty script arguments', async () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        scriptPath: '/path/to/script.sh',
                    } as RunIntervalSettings,
                },
            };

            // Note: The actual implementation doesn't call parse when scriptArguments is undefined
            // It just uses an empty array directly
            await runInterval.onKeyDown(mockEvent as any);

            expect(mockArgumentParser.parse).not.toHaveBeenCalled();
            expect(mockExecFileSync).toHaveBeenCalledWith('/path/to/script.sh', []);
        });
    });

    describe('validateIntervalSettings', () => {
        test('should return true for valid settings', () => {
            const settings = {
                intervalScriptPath: '/path/to/script.sh',
                intervalDelay: 5,
            } as RunIntervalSettings;

            const result = (runInterval as any).validateIntervalSettings(settings);

            expect(result).toBe(true);
            expect(streamDeck.logger.info).toHaveBeenCalledWith(`validating interval settings: ${JSON.stringify(settings)}`);
            expect(streamDeck.logger.info).toHaveBeenCalledWith('intervalScriptPath (string): /path/to/script.sh');
            expect(streamDeck.logger.info).toHaveBeenCalledWith('intervalDelay (number): 5');
            expect(streamDeck.logger.info).toHaveBeenCalledWith('interval settings valid: true');
        });

        test('should return false when intervalScriptPath is missing', () => {
            const settings = {
                intervalDelay: 5,
            } as RunIntervalSettings;

            const result = (runInterval as any).validateIntervalSettings(settings);

            expect(result).toBe(false);
            expect(streamDeck.logger.info).toHaveBeenCalledWith('interval settings valid: false');
        });

        test('should return false when intervalDelay is zero', () => {
            const settings = {
                intervalScriptPath: '/path/to/script.sh',
                intervalDelay: 0,
            } as RunIntervalSettings;

            const result = (runInterval as any).validateIntervalSettings(settings);

            expect(result).toBe(false);
        });

        test('should return false when intervalDelay is negative', () => {
            const settings = {
                intervalScriptPath: '/path/to/script.sh',
                intervalDelay: -1,
            } as RunIntervalSettings;

            const result = (runInterval as any).validateIntervalSettings(settings);

            expect(result).toBe(false);
        });

        test('should return false when intervalScriptPath is empty string', () => {
            const settings = {
                intervalScriptPath: '',
                intervalDelay: 5,
            } as RunIntervalSettings;

            const result = (runInterval as any).validateIntervalSettings(settings);

            expect(result).toBe(false);
        });
    });

    describe('executeScript', () => {
        test('should execute script with arguments and return DisplaySettings', async () => {
            mockArgumentParser.parse.mockReturnValue(['--verbose', 'test']);
            mockExecFileSync.mockReturnValue(Buffer.from('  {"title": "Success"}  '));

            const result = await runInterval.executeScript('/path/to/script.sh', '--verbose test');

            expect(streamDeck.logger.info).toHaveBeenCalledWith("running script: '/path/to/script.sh'");
            expect(mockArgumentParser.parse).toHaveBeenCalledWith('--verbose test');
            expect(mockExecFileSync).toHaveBeenCalledWith('/path/to/script.sh', ['--verbose', 'test']);
            expect(streamDeck.logger.info).toHaveBeenCalledWith('script returned: \'{"title": "Success"}\'');
            expect(mockParseJson).toHaveBeenCalledWith('{"title": "Success"}');
            expect(result).toBe(mockDisplaySettings);
        });

        test('should handle null script arguments', async () => {
            mockExecFileSync.mockReturnValue(Buffer.from('{"title": "No Args"}'));

            await runInterval.executeScript('/path/to/script.sh', null);

            expect(mockExecFileSync).toHaveBeenCalledWith('/path/to/script.sh', []);
        });

        test('should handle undefined script arguments', async () => {
            mockExecFileSync.mockReturnValue(Buffer.from('{"title": "No Args"}'));

            await runInterval.executeScript('/path/to/script.sh', undefined);

            expect(mockExecFileSync).toHaveBeenCalledWith('/path/to/script.sh', []);
        });

        test('should trim whitespace from script output', async () => {
            mockExecFileSync.mockReturnValue(Buffer.from('\n\t  {"title": "Trimmed"}  \n'));

            await runInterval.executeScript('/path/to/script.sh', '');

            expect(mockParseJson).toHaveBeenCalledWith('{"title": "Trimmed"}');
        });
    });

    describe('startInterval - interval monitoring behavior', () => {
        test('should start interval when settings are valid', () => {
            const clearIntervalsSpy = jest.spyOn(runInterval, 'clearIntervals');
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '/path/to/monitor.sh',
                        intervalScriptArguments: '--monitor',
                        intervalDelay: 10,
                    } as RunIntervalSettings,
                },
            };

            (runInterval as any).startInterval(mockEvent);

            expect(clearIntervalsSpy).toHaveBeenCalled(); // clearIntervals called first
            expect(mockSetInterval).toHaveBeenCalled();
            expect(runInterval.intervals).toContain(123); // Mock timer ID
        });

        test('should not start interval when settings are invalid', () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '', // Invalid
                        intervalDelay: 5,
                    } as RunIntervalSettings,
                },
            };

            (runInterval as any).startInterval(mockEvent);

            expect(mockSetInterval).not.toHaveBeenCalled();
            expect(runInterval.intervals).toEqual([]);
        });

        test('should clear existing intervals before starting new one', () => {
            runInterval.intervals = [999];
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '/path/to/script.sh',
                        intervalDelay: 5,
                    } as RunIntervalSettings,
                },
            };

            (runInterval as any).startInterval(mockEvent);

            expect(mockClearInterval).toHaveBeenCalledWith(999);
            expect(mockSetInterval).toHaveBeenCalled();
        });

        test('should convert interval delay from seconds to milliseconds', () => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '/path/to/script.sh',
                        intervalDelay: 30, // 30 seconds
                    } as RunIntervalSettings,
                },
            };

            (runInterval as any).startInterval(mockEvent);

            expect(mockSetInterval).toHaveBeenCalledWith(
                expect.any(Function),
                30000 // 30 seconds * 1000 milliseconds
            );
        });

        // This test verifies the expected behavior but may fail due to implementation issues
        test('should execute interval script and apply display settings periodically', (done) => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '/path/to/monitor.sh',
                        intervalScriptArguments: '--status',
                        intervalDelay: 1,
                    } as RunIntervalSettings,
                },
            };

            mockArgumentParser.parse.mockReturnValue(['--status']);
            mockExecFileSync.mockReturnValue(Buffer.from('{"title": "Status OK"}'));

            // Mock setInterval to immediately call the callback function
            mockSetInterval.mockImplementation((callback, delay) => {
                // Simulate the interval callback being called
                setTimeout(async () => {
                    await (callback as Function)();
                    
                    try {
                        expect(streamDeck.logger.info).toHaveBeenCalledWith('running interval');
                        expect(mockExecFileSync).toHaveBeenCalledWith('/path/to/monitor.sh', ['--status']);
                        expect(mockDisplaySettings.apply).toHaveBeenCalledWith(mockEvent);
                        done();
                    } catch (error) {
                        done(error);
                    }
                }, 10);
                
                return 123 as any;
            });

            (runInterval as any).startInterval(mockEvent);
        });
    });
});