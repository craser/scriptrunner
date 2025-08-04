// ABOUTME: Test suite for run-interval.ts - the RunInterval action class
// ABOUTME: Tests interval monitoring functionality, script execution, and Stream Deck event handling

import streamDeck from '@elgato/streamdeck';
import { execFile } from 'node:child_process';
import { setInterval, clearInterval } from 'node:timers';
import { RunInterval } from '../../src/actions/run-interval';
import { ArgumentStringParser } from '../../src/utils/argument-string-parser';
import { DisplaySettings } from '../../src/actions/display-settings';
import { RunIntervalSettings } from '../../src/actions/run-interval-settings';

// Mock all dependencies
jest.mock('@elgato/streamdeck', () => ({
    __esModule: true,
    default: {
        logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        },
    },
    action: jest.fn().mockImplementation(() => (target: any) => target),
    SingletonAction: class MockSingletonAction {
        constructor() {}
    },
}));

jest.mock('node:child_process', () => ({
    execFile: jest.fn(),
}));

jest.mock('node:timers', () => ({
    setInterval: jest.fn(),
    clearInterval: jest.fn(),
}));

jest.mock('../../src/utils/argument-string-parser', () => ({
    ArgumentStringParser: jest.fn().mockImplementation(() => ({
        parse: jest.fn(),
    })),
}));

jest.mock('../../src/actions/display-settings', () => ({
    DisplaySettings: {
        parseJson: jest.fn(),
    },
}));

// Mock types
const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
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

        // Setup mock execFile to call callback with valid JSON
        mockExecFile.mockImplementation((path, args, options, callback) => {
            const cb = typeof options === 'function' ? options : callback;
            (cb as any)(null, '{"title": "Test Result"}', '');
            return {} as any; // Mock ChildProcess
        });

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
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                (cb as any)(null, '{"title": "Button Title"}', '');
                return {} as any;
            });

            await runInterval.onKeyDown(mockEvent as any);

            expect(mockArgumentParser.parse).toHaveBeenCalledWith('arg1 arg2');
            expect(streamDeck.logger.info).toHaveBeenCalledWith("running script: '/path/to/script.sh'");
            expect(mockExecFile).toHaveBeenCalledWith('/path/to/script.sh', ['arg1', 'arg2'], expect.any(Function));
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
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                (cb as any)(error, '', 'Script execution failed');
                return {} as any;
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
            expect(mockExecFile).toHaveBeenCalledWith('/path/to/script.sh', [], expect.any(Function));
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
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                (cb as any)(null, '  {"title": "Success"}  ', '');
                return {} as any;
            });

            const result = await runInterval.executeScript('/path/to/script.sh', '--verbose test');

            expect(streamDeck.logger.info).toHaveBeenCalledWith("running script: '/path/to/script.sh'");
            expect(mockArgumentParser.parse).toHaveBeenCalledWith('--verbose test');
            expect(mockExecFile).toHaveBeenCalledWith('/path/to/script.sh', ['--verbose', 'test'], expect.any(Function));
            expect(streamDeck.logger.info).toHaveBeenCalledWith('script returned: \'{"title": "Success"}\'');
            expect(mockParseJson).toHaveBeenCalledWith('{"title": "Success"}');
            expect(result).toBe(mockDisplaySettings);
        });

        test('should handle null script arguments', async () => {
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                (cb as any)(null, '{"title": "No Args"}', '');
                return {} as any;
            });

            await runInterval.executeScript('/path/to/script.sh', null);

            expect(mockExecFile).toHaveBeenCalledWith('/path/to/script.sh', [], expect.any(Function));
        });

        test('should handle undefined script arguments', async () => {
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                (cb as any)(null, '{"title": "No Args"}', '');
                return {} as any;
            });

            await runInterval.executeScript('/path/to/script.sh', undefined);

            expect(mockExecFile).toHaveBeenCalledWith('/path/to/script.sh', [], expect.any(Function));
        });

        test('should trim whitespace from script output', async () => {
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                (cb as any)(null, '\n\t  {"title": "Trimmed"}  \n', '');
                return {} as any;
            });

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

        test('should only run one instance of interval script at a time', (done) => {
            jest.useFakeTimers();
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '/path/to/slow-script.sh',
                        intervalDelay: 1, // 1 second interval
                    } as RunIntervalSettings,
                },
            };

            let scriptExecutionCount = 0;
            let firstExecutionFinished = false;

            // Mock execFile to simulate a slow script (3 seconds)
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                scriptExecutionCount++;
                
                if (scriptExecutionCount === 1) {
                    // First execution - simulate 3 second delay
                    setTimeout(() => {
                        firstExecutionFinished = true;
                        (cb as any)(null, '{"title": "Slow Script"}', '');
                    }, 3000);
                } else if (scriptExecutionCount === 2 && !firstExecutionFinished) {
                    // Second execution started before first finished - this should NOT happen
                    done(new Error('Second script execution started before first finished - safety feature not working'));
                    (cb as any)(null, '{}', '');
                    return {} as any;
                }
                
                // For any other executions, call callback immediately
                if (scriptExecutionCount > 2 || firstExecutionFinished) {
                    (cb as any)(null, '{"title": "Slow Script"}', '');
                }
                
                return {} as any; // Mock ChildProcess
            });

            // Mock setInterval to fire multiple times quickly
            let intervalCallback: Function;
            mockSetInterval.mockImplementation((callback, delay) => {
                intervalCallback = callback;
                
                // Fire the callback immediately (first execution)
                setTimeout(() => callback(), 10);
                
                // Try to fire again after 1 second (before first execution finishes)
                setTimeout(() => callback(), 1010);
                
                // Check that only one execution happened
                setTimeout(() => {
                    try {
                        expect(scriptExecutionCount).toBe(1);
                        done();
                    } catch (error) {
                        done(error);
                    }
                }, 2000);
                
                return 123 as any;
            });

            (runInterval as any).startInterval(mockEvent);
            
            // Advance timers to trigger the callbacks
            jest.advanceTimersByTime(2100); // Advance past all our test timers
            
            // Clean up
            jest.useRealTimers();
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
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                (cb as any)(null, '{"title": "Status OK"}', '');
                return {} as any;
            });

            // Mock setInterval to immediately call the callback function
            mockSetInterval.mockImplementation((callback, delay) => {
                // Simulate the interval callback being called
                setTimeout(async () => {
                    await (callback as Function)();
                    
                    try {
                        expect(streamDeck.logger.info).toHaveBeenCalledWith('running interval');
                        expect(mockExecFile).toHaveBeenCalledWith('/path/to/monitor.sh', ['--status'], expect.any(Function));
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

        test('should reset isIntervalScriptRunning flag when execFile throws an error', (done) => {
            const mockEvent = {
                action: mockAction,
                payload: {
                    settings: {
                        intervalScriptPath: '/path/to/failing-script.sh',
                        intervalDelay: 1,
                    } as RunIntervalSettings,
                },
            };

            const scriptError = new Error('Script execution failed');

            // Mock execFile to always throw an error
            mockExecFile.mockImplementation((path, args, options, callback) => {
                const cb = typeof options === 'function' ? options : callback;
                (cb as any)(scriptError, '', 'Script failed');
                return {} as any;
            });

            // Capture the interval callback
            let intervalCallback: Function | undefined;
            mockSetInterval.mockImplementation((callback, delay) => {
                intervalCallback = callback;
                return 123 as any;
            });

            // Start the interval
            (runInterval as any).startInterval(mockEvent);

            // Verify flag starts as false
            expect(runInterval.isIntervalScriptRunning).toBe(false);

            // Ensure callback was captured
            if (!intervalCallback) {
                done(new Error('Interval callback was not captured'));
                return;
            }

            // Call the interval callback to trigger script execution
            intervalCallback().then(() => {
                // This should never be reached due to the error
                done(new Error('Promise should have been rejected'));
            }).catch(() => {
                // After the error, check if the flag was reset to false
                setTimeout(() => {
                    try {
                        // BUG: This test should fail because the flag remains true after an error
                        expect(runInterval.isIntervalScriptRunning).toBe(false);
                        done();
                    } catch (error) {
                        // This is the expected failure - the bug causes the flag to remain true
                        done(error);
                    }
                }, 10);
            });
        });
    });
});