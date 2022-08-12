import prompts from "prompts";

/**
 * Whether or not the prompt has been unanswered.
 * @param response The response given.
 * @returns False if there is an answer, true otherwise.
 */
export function unanswered(response: any): boolean {
    if (!response) {
        return true;
    }
    if (Object.keys(response).length === 0) {
        return true;
    }
    return false;
}

/**
 * Wraps the name asking prompt.
 * @param limit The character limit.
 * @returns A prompt asking for the name.
 */
export function promptName(limit: number, taken: (probe: string) => Promise<boolean>): prompts.PromptObject {
    return {
        type: "text",
        name: "name",
        message: "Enter the desired name (case sensitive)",
        validate: async (input: string): Promise<string | boolean> => {
            if (!input) {
                return "A name needs to be provided.";
            }
            if (input.length > limit) {
                return `That name is too long (max ${limit} characters).`;
            }
            if (await taken(input)) {
                return "That name is already taken.";
            }
            return true;
        },
    };
}

/**
 * Wraps the list name selection prompt.
 * @param question The question.
 * @param names An array of names.
 * @returns A prompt asking to select the name.
 */
export function promptList(question: string, names: string[]): prompts.PromptObject {
    return {
        type: "select",
        name: "name",
        message: question,
        choices: names.map((name: string): prompts.Choice => {
            return {
                title: name,
                value: name
            };
        }),
    };
}