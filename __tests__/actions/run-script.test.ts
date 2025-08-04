// ABOUTME: Test suite for RunScript class - Stream Deck action that executes scripts
// ABOUTME: Tests event handling, script execution, JSON parsing, and UI updates

import streamDeck from '@elgato/streamdeck';
import { execFile } from 'node:child_process';
import { RunScript } from '../../src/actions/run-script';
import { getColorPngPath, isColorAvailable } from '../../src/utils/color-pngs';
import { ArgumentStringParser } from '../../src/utils/argument-string-parser';

// Mock all dependencies
jest.mock('@elgato/streamdeck', () => ({
    __esModule: true,
    default: {
        logger: {
            info: jest.fn(),
            error: jest.fn(),
        },
    },
    action: jest.fn(() => (target: any) => target),
    SingletonAction: class MockSingletonAction {
        onDidReceiveSettings(ev: any) { return Promise.resolve(); }
        onWillAppear(ev: any) { return Promise.resolve(); }
        onKeyDown(ev: any) { return Promise.resolve(); }
    },
}));

jest.mock('node:child_process', () => ({
    execFile: jest.fn(),
}));

jest.mock('../../src/utils/color-pngs', () => ({
    getColorPngPath: jest.fn(),
    isColorAvailable: jest.fn(),
}));

jest.mock('../../src/utils/argument-string-parser', () => ({
    ArgumentStringParser: jest.fn().mockImplementation(() => ({
        parse: jest.fn(),
    })),
}));

// Mock types
const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;

describe('RunScript', () => {
    let runScript: RunScript;
    let mockAction: any;
    let mockEvent: any;
    let mockArgumentParser: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create RunScript instance
        runScript = new RunScript();

        // Mock action object
        mockAction = {
            setTitle: jest.fn().mockResolvedValue(undefined),
            setImage: jest.fn().mockResolvedValue(undefined),
        };

        // Mock base event structure
        mockEvent = {
            action: mockAction,
            payload: {
                settings: {},
            },
        };

        // Setup mock argument parser
        mockArgumentParser = {
            parse: jest.fn().mockReturnValue([]),
        };
        (ArgumentStringParser as jest.MockedClass<typeof ArgumentStringParser>).mockImplementation(() => mockArgumentParser);

        // Setup mock execFile to call callback with valid JSON
        mockExecFile.mockImplementation((path, args, options, callback) => {
            const cb = typeof options === 'function' ? options : callback;
            (cb as any)(null, '{"title": "Success"}', '');
            return {} as any; // Mock ChildProcess
        });
    });

    describe('onDidReceiveSettings', () => {
        test('should set title from defaultTitle setting', async () => {
            const event = {
                ...mockEvent,
                payload: {
                    settings: {
                        defaultTitle: 'Test Title',
                        scriptPath: '/path/to/script',
                    },
                },
            };

            const result = runScript.onDidReceiveSettings(event);

            expect(result).toBe(mockAction.setTitle.mock.results[0].value);
            expect(mockAction.setTitle).toHaveBeenCalledWith('Test Title');
        });

        test('should set empty title when defaultTitle is not provided', async () => {
            const event = {
                ...mockEvent,
                payload: {
                    settings: {
                        scriptPath: '/path/to/script',
                    },
                },
            };

            runScript.onDidReceiveSettings(event);

            expect(mockAction.setTitle).toHaveBeenCalledWith('');
        });

        test('should handle empty settings', async () => {
            const event = {
                ...mockEvent,
                payload: {
                    settings: {},
                },
            };

            runScript.onDidReceiveSettings(event);

            expect(mockAction.setTitle).toHaveBeenCalledWith('');
        });
    });

    describe('onWillAppear', () => {
        test('should set title from defaultTitle setting', async () => {
            const event = {
                ...mockEvent,
                payload: {
                    settings: {
                        defaultTitle: 'Initial Title',
                        scriptPath: '/path/to/script',
                    },
                },
            };

            const result = runScript.onWillAppear(event);

            expect(result).toBe(mockAction.setTitle.mock.results[0].value);
            expect(mockAction.setTitle).toHaveBeenCalledWith('Initial Title');
        });

        test('should set empty title when defaultTitle is not provided', async () => {
            const event = {
                ...mockEvent,
                payload: {
                    settings: {
                        scriptPath: '/path/to/script',
                    },
                },
            };

            runScript.onWillAppear(event);

            expect(mockAction.setTitle).toHaveBeenCalledWith('');
        });
    });

    describe('onKeyDown', () => {

        describe('successful script execution', () => {
            test('should execute script without arguments', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                            defaultTitle: 'Default',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Script Output"}', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(mockExecFile).toHaveBeenCalledWith('/path/to/script.sh', [], expect.any(Function));
                expect(mockAction.setTitle).toHaveBeenCalledWith('Script Output');
                expect(streamDeck.logger.info).toHaveBeenCalledWith("running script: '/path/to/script.sh'");
                expect(streamDeck.logger.info).toHaveBeenCalledWith("script returned: '{\"title\": \"Script Output\"}'");
            });

            test('should execute script with parsed arguments', async () => {
                mockArgumentParser.parse.mockReturnValue(['arg1', 'arg with spaces', 'arg3']);

                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                            scriptArguments: "'arg1' 'arg with spaces' arg3",
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "With Args"}', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(mockArgumentParser.parse).toHaveBeenCalledWith("'arg1' 'arg with spaces' arg3");
                expect(mockExecFile).toHaveBeenCalledWith('/path/to/script.sh', ['arg1', 'arg with spaces', 'arg3'], expect.any(Function));
                expect(mockAction.setTitle).toHaveBeenCalledWith('With Args');
            });

            test('should handle script output with only title', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Only Title"}', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(mockAction.setTitle).toHaveBeenCalledWith('Only Title');
                expect(mockAction.setImage).not.toHaveBeenCalled();
            });

            test('should handle script output with title and color', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Colored", "color": "red"}', '');
                    return {} as any;
                });
                (isColorAvailable as jest.Mock).mockReturnValue(true);
                (getColorPngPath as jest.Mock).mockReturnValue('imgs/colors/red.png');

                await runScript.onKeyDown(event);

                expect(mockAction.setTitle).toHaveBeenCalledWith('Colored');
                expect(isColorAvailable).toHaveBeenCalledWith('red');
                expect(getColorPngPath).toHaveBeenCalledWith('red');
                expect(mockAction.setImage).toHaveBeenCalledWith('imgs/colors/red.png');
            });

            test('should handle script output with title and image', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "With Image", "image": "/path/to/custom.png"}', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(mockAction.setTitle).toHaveBeenCalledWith('With Image');
                expect(mockAction.setImage).toHaveBeenCalledWith('/path/to/custom.png');
            });

            test('should prioritize image over color when both provided', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Both", "color": "blue", "image": "/custom.png"}', '');
                    return {} as any;
                });
                (isColorAvailable as jest.Mock).mockReturnValue(true);
                (getColorPngPath as jest.Mock).mockReturnValue('imgs/colors/blue.png');

                await runScript.onKeyDown(event);

                expect(mockAction.setTitle).toHaveBeenCalledWith('Both');
                expect(mockAction.setImage).toHaveBeenCalledWith('/custom.png');
                // Color functions should not be called when image is provided
                expect(isColorAvailable).not.toHaveBeenCalled();
                expect(getColorPngPath).not.toHaveBeenCalled();
            });

            test('should handle script output with color when color is not available', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Invalid Color", "color": "invalidcolor"}', '');
                    return {} as any;
                });
                (isColorAvailable as jest.Mock).mockReturnValue(false);

                await runScript.onKeyDown(event);

                expect(mockAction.setTitle).toHaveBeenCalledWith('Invalid Color');
                expect(isColorAvailable).toHaveBeenCalledWith('invalidcolor');
                expect(getColorPngPath).not.toHaveBeenCalled();
                expect(mockAction.setImage).not.toHaveBeenCalled();
            });

            test('should handle script output with null color path', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Null Path", "color": "red"}', '');
                    return {} as any;
                });
                (isColorAvailable as jest.Mock).mockReturnValue(true);
                (getColorPngPath as jest.Mock).mockReturnValue(null);

                await runScript.onKeyDown(event);

                expect(mockAction.setTitle).toHaveBeenCalledWith('Null Path');
                expect(isColorAvailable).toHaveBeenCalledWith('red');
                expect(getColorPngPath).toHaveBeenCalledWith('red');
                expect(mockAction.setImage).not.toHaveBeenCalled();
            });

            test('should handle undefined title gracefully', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"color": "green"}', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(mockAction.setTitle).not.toHaveBeenCalled();
            });
        });

        describe('error handling', () => {
            test('should handle script execution failure', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/nonexistent/script.sh',
                        },
                    },
                };

                const error = new Error('Script not found');
                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(error, '', 'Script not found');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(streamDeck.logger.error).toHaveBeenCalledWith("ERROR running script /nonexistent/script.sh");
                expect(streamDeck.logger.error).toHaveBeenCalledWith(error);
                expect(mockAction.setTitle).toHaveBeenCalledWith('ERROR');
            });

            test('should handle invalid JSON output', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, 'invalid json output', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(streamDeck.logger.error).toHaveBeenCalledWith("ERROR running script /path/to/script.sh");
                expect(streamDeck.logger.error).toHaveBeenCalledWith(expect.any(SyntaxError));
                expect(mockAction.setTitle).toHaveBeenCalledWith('ERROR');
            });

            test('should handle empty script output', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(streamDeck.logger.error).toHaveBeenCalledWith("ERROR running script /path/to/script.sh");
                expect(mockAction.setTitle).toHaveBeenCalledWith('ERROR');
            });

            test('should handle action.setTitle failure', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Test"}', '');
                    return {} as any;
                });
                mockAction.setTitle.mockRejectedValue(new Error('setTitle failed'));

                // The method should throw because setTitle fails
                await expect(runScript.onKeyDown(event)).rejects.toThrow('setTitle failed');
            });

            test('should handle action.setImage failure', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/script.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Test", "image": "/test.png"}', '');
                    return {} as any;
                });
                mockAction.setImage.mockRejectedValue(new Error('setImage failed'));

                await runScript.onKeyDown(event);

                expect(streamDeck.logger.error).toHaveBeenCalledWith("ERROR running script /path/to/script.sh");
                expect(streamDeck.logger.error).toHaveBeenCalledWith(expect.any(Error));
            });
        });

        describe('logging', () => {
            test('should log script execution and output', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/test.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"title": "Logged"}', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(streamDeck.logger.info).toHaveBeenCalledWith("running script: '/path/to/test.sh'");
                expect(streamDeck.logger.info).toHaveBeenCalledWith("script returned: '{\"title\": \"Logged\"}'");
                expect(streamDeck.logger.info).toHaveBeenCalledWith("setting title: 'Logged'");
            });

            test('should log color setting', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/test.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"color": "blue"}', '');
                    return {} as any;
                });
                (isColorAvailable as jest.Mock).mockReturnValue(true);
                (getColorPngPath as jest.Mock).mockReturnValue('imgs/colors/blue.png');

                await runScript.onKeyDown(event);

                expect(streamDeck.logger.info).toHaveBeenCalledWith("setting background color: 'blue' -> 'imgs/colors/blue.png'");
            });

            test('should log image setting', async () => {
                const event = {
                    ...mockEvent,
                    payload: {
                        settings: {
                            scriptPath: '/path/to/test.sh',
                        },
                    },
                };

                mockExecFile.mockImplementation((path, args, options, callback) => {
                    const cb = typeof options === 'function' ? options : callback;
                    (cb as any)(null, '{"image": "/custom.png"}', '');
                    return {} as any;
                });

                await runScript.onKeyDown(event);

                expect(streamDeck.logger.info).toHaveBeenCalledWith("setting background image: '/custom.png'");
            });
        });
    });
});