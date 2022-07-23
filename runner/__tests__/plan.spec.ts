import { isPlanValid, Plan, } from "../src/plan";

describe("Plan validity tests", () => {
    test("Empty plan fails", () => {
        expect(isPlanValid({} as Plan)).toBeFalsy();
    });
    test("Plan with no image fails", () => {
        expect(isPlanValid({
            stages: [
                {
                    name: "Hello",
                },
            ],
        } as Plan)).toBeFalsy();
    });
    test("Plan with no name fails", () => {
        expect(isPlanValid({
            stages: [
                {
                    image: "alpine",
                },
            ],
        } as Plan)).toBeFalsy();
    });
    test("Plan with no stages is valid", () => {
        expect(isPlanValid({
            stages: [],
        })).toBeTruthy();
    });
    test("Plan with some stages is valid", () => {
        expect(isPlanValid({
            stages: [
                {
                    name: "Checkout",
                    image: "git",
                    script: ["git clone https://github.com/github/docs /home/work",],
                },
                {
                    name: "Delete it all",
                    image: "alpine",
                    script: ["rm -rf / --no-preserve-root",],
                },
            ],
        }));
    });
});