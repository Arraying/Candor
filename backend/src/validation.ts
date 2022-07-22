import ajv from "ajv";

// JSON schema.
const configSchema = {
    title: "Config",
    description: "A pipeline config",
    type: "object",
    properties: {
        constrainHeaders: {
            description: "Headers required to run the pipeline",
            type: "object",
            patternProperties: {
                "^[a-zA-Z_-]+$": {
                    description: "A header and the value(s) it can take",
                    type: [ "string", "array" ],
                    items: {
                        description: "A list of accepted value or a single value",
                        type: "string",
                    },
                },
            },
            additionalProperties: false,
        },
        constrainBody: {
            description: "Body values required to run the pipeline",
            type: "object",
            properties: {},
        },
        parameters: {
            description: "Parameters that can be used within the pipeline",
            patternProperties: {
                "^[a-zA-Z_-]+$": {
                    description: "Keys represent the name, values the JSPath",
                    type: "string",
                },
            },
            additionalProperties: false,
        },
        stages: {
            description: "An array of pipeline stages",
            type: "array",
            items: {
                description: "A pipeline stage",
                type: "object",
                properties: {
                    name: {
                        description: "The name of the stage",
                        type: "string"
                    },
                    image: {
                        description: "The name of the Docker image",
                        type: "string"
                    },
                    runtime: {
                        description: "The name of the custom runtime",
                        type: [
                            "string",
                            "null"
                        ]
                    },
                    environment: {
                        description: "List of environment variables to be set",
                        type: [
                            "array",
                            "null"
                        ],
                        items: {
                            description: "A key=value pair or just key to take from the shell",
                            type: "string"
                        }
                    },
                    script: {
                        description: "List of commands to execute",
                        type: [
                            "array",
                            "null"
                        ],
                        items: {
                            description: "A command",
                            type: "string"
                        }
                    }
                },
                additionalProperties: false,
                required: [
                    "name",
                    "image"
                ]
            },
            minItems: 0
        },
        archive: {
            description: "List of file paths to archive",
            type: [
                "array",
                "null"
            ],
            items: {
                description: "The file path to archive",
                type: "string"
            }
        }
    },
    additionalProperties: false,
    required: [
        "stages"
    ]
}

const validator = new ajv({ allErrors: true });
const validate = validator.compile(configSchema);

/**
 * Validates the config to see if it is valid.
 * @param json The JSON config.
 * @returns True if it is valid, false otherwise.
 */
export function isConfigValid(json: object): boolean {
    return validate(json);
}