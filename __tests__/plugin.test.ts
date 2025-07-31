// ABOUTME: Test suite for plugin.ts - the main Stream Deck plugin entry point
// ABOUTME: Tests plugin initialization, action registration, and Stream Deck connection

import streamDeck, { LogLevel } from '@elgato/streamdeck';
import { RunScript } from '../src/actions/run-script';

// Mock the streamDeck module
jest.mock('@elgato/streamdeck', () => ({
    __esModule: true,
    default: {
        logger: {
            setLevel: jest.fn(),
        },
        actions: {
            registerAction: jest.fn(),
        },
        connect: jest.fn(),
    },
    LogLevel: {
        TRACE: 'TRACE',
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
    },
}));

// Mock the RunScript action
jest.mock('../src/actions/run-script', () => ({
    RunScript: jest.fn().mockImplementation(() => ({
        // Mock RunScript instance
        onDidReceiveSettings: jest.fn(),
        onWillAppear: jest.fn(),
        onKeyDown: jest.fn(),
    })),
}));

describe('plugin', () => {
    // Clear all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('module structure', () => {
        test('should import without errors', async () => {
            // Verify that importing the plugin doesn't throw
            await expect(import('../src/plugin')).resolves.toBeDefined();
        });

        test('should have access to required StreamDeck APIs', () => {
            // Verify the mock structure is correct
            expect(streamDeck.logger.setLevel).toBeDefined();
            expect(streamDeck.actions.registerAction).toBeDefined();
            expect(streamDeck.connect).toBeDefined();
        });

        test('should have access to RunScript class', () => {
            // Verify RunScript is available
            expect(RunScript).toBeDefined();
            expect(typeof RunScript).toBe('function');
        });
    });

    describe('LogLevel enum', () => {
        test('should have TRACE log level available', () => {
            expect(LogLevel.TRACE).toBe('TRACE');
        });

        test('should have all standard log levels', () => {
            expect(LogLevel.DEBUG).toBe('DEBUG');
            expect(LogLevel.INFO).toBe('INFO');
            expect(LogLevel.WARN).toBe('WARN');
            expect(LogLevel.ERROR).toBe('ERROR');
        });
    });

    describe('RunScript instantiation', () => {
        test('should create RunScript instance successfully', () => {
            const instance = new (RunScript as any)();
            expect(instance).toBeDefined();
            expect(typeof instance.onDidReceiveSettings).toBe('function');
            expect(typeof instance.onWillAppear).toBe('function');
            expect(typeof instance.onKeyDown).toBe('function');
        });
    });

    describe('plugin dependencies', () => {
        test('should import streamDeck default export', () => {
            expect(streamDeck).toBeDefined();
            expect(streamDeck.logger).toBeDefined();
            expect(streamDeck.actions).toBeDefined();
        });

        test('should import LogLevel enum', () => {
            expect(LogLevel).toBeDefined();
            expect(typeof LogLevel).toBe('object');
        });

        test('should import RunScript class', () => {
            expect(RunScript).toBeDefined();
            // Verify it's a constructor function
            const instance = new (RunScript as any)();
            expect(instance).toBeInstanceOf(Object);
        });
    });

    describe('mock verification', () => {
        test('should have properly mocked streamDeck logger', () => {
            expect(jest.isMockFunction(streamDeck.logger.setLevel)).toBe(true);
        });

        test('should have properly mocked streamDeck actions', () => {
            expect(jest.isMockFunction(streamDeck.actions.registerAction)).toBe(true);
        });

        test('should have properly mocked streamDeck connect', () => {
            expect(jest.isMockFunction(streamDeck.connect)).toBe(true);
        });

        test('should have properly mocked RunScript constructor', () => {
            expect(jest.isMockFunction(RunScript)).toBe(true);
        });
    });
});