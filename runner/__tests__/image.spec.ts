import { makeDockerfiles } from "../src/management/image";

describe("Making the Docker image", () => {
    test("Contains the correct image", async () => {
        const stages = [{
            name: "Test",
            image: "node",
        }];
        const result = (await makeDockerfiles(stages))[0];
        expect(result.dockerfile).toContain("node");
    });
    test("Contains basic key value environment variables", async () => {
        const stages = [{
            name: "Test",
            image: "node",
            environment: [
                "FOO=bar",
                "COW=Goes moo",
            ],
        }];
        const result = (await makeDockerfiles(stages))[0];
        expect(result.dockerfile).toContain("ENV FOO bar");
        expect(result.dockerfile).toContain("ENV COW Goes moo");
    });
    test("Contains key is value environment variables", async () => {
        const stages = [{
            name: "Test",
            image: "node",
            environment: [
                "FOO",
            ],
        }];
        const result = (await makeDockerfiles(stages))[0];
        expect(result.dockerfile).toContain("ENV FOO FOO");
    });
    test("Skips invalid environment variables", async () => {
        const stages = [{
            name: "Test",
            image: "node",
            environment: [
                "",
            ],
        }];
        const result = (await makeDockerfiles(stages))[0];
        expect(result.dockerfile).not.toContain("ENV");
    });
    test("Contains the correct shell commands", async () => {
        const stages = [{
            name: "Test",
            image: "node",
            script: [
                "cd runner/",
                "npm run test",
            ],
        }];
        const result = (await makeDockerfiles(stages))[0];
        expect(result.shell).toContain("cd runner/");
        expect(result.shell).toContain("npm run test");
    });
});