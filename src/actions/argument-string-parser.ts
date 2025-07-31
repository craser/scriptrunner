// ABOUTME: ArgumentStringParser class for parsing user input into script arguments
// ABOUTME: Handles quoted strings, escape sequences, and whitespace separation

interface ParseState {
    args: string[];
    current: string;
    inQuotes: boolean;
    quoteChar: string;
}

interface QuotedCharResult {
    current: string;
    inQuotes: boolean;
    newIndex: number;
}

/**
 * Parses argument strings into arrays of arguments, handling quotes and escapes
 */
export class ArgumentStringParser {
    /**
     * Parse the string entered by the user into an Array of string arguments we can
     * pass to the script.
     *
     * For example,
     *   • "5" -> ["5"]
     *   • "'one two' three" -> ["one two", "three"]
     *   • "'"wrapped"'" -> ["\"wrapped\""]
     *   • ""\"wrapped\"" -> ["\"wrapped\""]
     *
     * @param literal The argument string to parse
     */
    parse(literal: string): string[] {
        const state: ParseState = { args: [], current: '', inQuotes: false, quoteChar: '' };
        
        for (let i = 0; i < literal.length; i++) {
            i = this.processCharacter(literal[i], i, literal, state);
        }
        
        if (state.current.length > 0) {
            state.args.push(state.current);
        }
        
        return state.args;
    }

    private processCharacter(char: string, index: number, literal: string, state: ParseState): number {
        if (!state.inQuotes) {
            return this.handleUnquotedCharacter(char, index, literal, state);
        } else {
            return this.handleQuotedCharacter(char, index, literal, state);
        }
    }

    private handleUnquotedCharacter(char: string, index: number, literal: string, state: ParseState): number {
        if (char === '"' || char === "'") {
            state.inQuotes = true;
            state.quoteChar = char;
        } else if (char === ' ' || char === '\t') {
            if (state.current.length > 0) {
                state.args.push(state.current);
                state.current = '';
            }
            return this.skipWhitespace(literal, index);
        } else {
            state.current += char;
        }
        return index;
    }

    private handleQuotedCharacter(char: string, index: number, literal: string, state: ParseState): number {
        const result = this.processQuotedChar(char, index, literal, state.current, state.quoteChar);
        state.current = result.current;
        if (!result.inQuotes) {
            state.inQuotes = false;
            state.quoteChar = '';
        }
        return result.newIndex;
    }

    private skipWhitespace(literal: string, startIndex: number): number {
        let i = startIndex;
        while (i + 1 < literal.length && (literal[i + 1] === ' ' || literal[i + 1] === '\t')) {
            i++;
        }
        return i;
    }

    private processQuotedChar(char: string, index: number, literal: string, current: string, quoteChar: string): QuotedCharResult {
        if (char === quoteChar) {
            return { current, inQuotes: false, newIndex: index };
        }
        
        if (char === '\\' && index + 1 < literal.length) {
            const nextChar = literal[index + 1];
            if (nextChar === '"' || nextChar === "'" || nextChar === '\\') {
                return { current: current + nextChar, inQuotes: true, newIndex: index + 1 };
            }
        }
        
        return { current: current + char, inQuotes: true, newIndex: index };
    }
}