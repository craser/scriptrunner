// ABOUTME: Test suite for ArgumentStringParser class
// ABOUTME: Comprehensive tests covering all parsing scenarios and edge cases

import { ArgumentStringParser } from '../../src/actions/argument-string-parser';

describe('ArgumentStringParser', () => {
    let parser: ArgumentStringParser;

    beforeEach(() => {
        parser = new ArgumentStringParser();
    });

    describe('simple arguments', () => {
        test('should parse single argument', () => {
            expect(parser.parse('hello')).toEqual(['hello']);
        });

        test('should parse multiple arguments', () => {
            expect(parser.parse('arg1 arg2 arg3')).toEqual(['arg1', 'arg2', 'arg3']);
        });

        test('should handle numeric arguments', () => {
            expect(parser.parse('5')).toEqual(['5']);
            expect(parser.parse('42 100')).toEqual(['42', '100']);
        });

        test('should handle empty string', () => {
            expect(parser.parse('')).toEqual([]);
        });

        test('should handle whitespace-only string', () => {
            expect(parser.parse('   ')).toEqual([]);
            expect(parser.parse('\t\t')).toEqual([]);
        });
    });

    describe('quoted arguments', () => {
        test('should parse single-quoted arguments', () => {
            expect(parser.parse("'hello world'")).toEqual(['hello world']);
        });

        test('should parse double-quoted arguments', () => {
            expect(parser.parse('"hello world"')).toEqual(['hello world']);
        });

        test('should parse mixed quoted and unquoted arguments', () => {
            expect(parser.parse("'one two' three")).toEqual(['one two', 'three']);
            expect(parser.parse('one "two three" four')).toEqual(['one', 'two three', 'four']);
        });

        test('should handle empty quoted strings', () => {
            expect(parser.parse('""')).toEqual([]);
            expect(parser.parse("''")).toEqual([]);
        });

        test('should handle quoted strings with only spaces', () => {
            expect(parser.parse('"   "')).toEqual(['   ']);
            expect(parser.parse("'   '")).toEqual(['   ']);
        });
    });

    describe('escape sequences', () => {
        test('should handle escaped quotes within double quotes', () => {
            expect(parser.parse('"say \\"hello\\""')).toEqual(['say "hello"']);
        });

        test('should handle escaped quotes within single quotes', () => {
            expect(parser.parse("'say \\'hello\\''")).toEqual(["say 'hello'"]);
        });

        test('should handle escaped backslashes', () => {
            expect(parser.parse('"path\\\\to\\\\file"')).toEqual(['path\\to\\file']);
        });

        test('should handle mixed escape sequences', () => {
            expect(parser.parse('"file\\\\"with\\"spaces"')).toEqual(['file\\with\\spaces']);
        });

        test('should not escape non-special characters', () => {
            expect(parser.parse('"hello\\nworld"')).toEqual(['hello\\nworld']);
        });
    });

    describe('complex scenarios', () => {
        test('should handle the examples from documentation', () => {
            expect(parser.parse('5')).toEqual(['5']);
            expect(parser.parse("'one two' three")).toEqual(['one two', 'three']);
            expect(parser.parse("'\"wrapped\"'")).toEqual(['"wrapped"']);
            expect(parser.parse('"\\"wrapped\\""')).toEqual(['"wrapped"']);
        });

        test('should handle multiple spaces between arguments', () => {
            expect(parser.parse('arg1    arg2     arg3')).toEqual(['arg1', 'arg2', 'arg3']);
        });

        test('should handle tabs between arguments', () => {
            expect(parser.parse('arg1\t\targ2\targ3')).toEqual(['arg1', 'arg2', 'arg3']);
        });

        test('should handle mixed spaces and tabs', () => {
            expect(parser.parse('arg1 \t arg2\t  arg3')).toEqual(['arg1', 'arg2', 'arg3']);
        });

        test('should handle leading and trailing whitespace', () => {
            expect(parser.parse('  arg1 arg2  ')).toEqual(['arg1', 'arg2']);
            expect(parser.parse('\targ1\targ2\t')).toEqual(['arg1', 'arg2']);
        });
    });

    describe('edge cases', () => {
        test('should handle unclosed quotes', () => {
            // Unclosed quote should include everything until end
            expect(parser.parse('"unclosed quote')).toEqual(['unclosed quote']);
            expect(parser.parse("'unclosed quote")).toEqual(['unclosed quote']);
        });

        test('should handle quote within unquoted argument', () => {
            expect(parser.parse('arg"with"quote')).toEqual(['argwithquote']);
            expect(parser.parse("arg'with'quote")).toEqual(['argwithquote']);
        });

        test('should handle adjacent quoted strings', () => {
            expect(parser.parse('"hello""world"')).toEqual(['helloworld']);
            expect(parser.parse("'hello''world'")).toEqual(['helloworld']);
        });

        test('should handle mixed quote types', () => {
            expect(parser.parse('\'"mixed quotes"\'')).toEqual(['"mixed quotes"']);
            expect(parser.parse("\"'mixed quotes'\"")).toEqual(["'mixed quotes'"]);
        });
    });
});