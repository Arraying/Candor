import { Cleaner } from "../src/cleaner";

describe("Cleaner tests", () => {
    test("Single item cleans up", async () => {
        const cleaner = new Cleaner();
        const dummy = jest.fn();
        cleaner.addJob(dummy);
        await cleaner.clean();
        expect(dummy).toBeCalled();
    });
    test("Multiple items act like a stack", async () => {
        const cleaner = new Cleaner();
        const first = jest.fn();
        const last = jest.fn();
        cleaner.addJob(first);
        cleaner.addJob(last);
        await cleaner.clean();
        expect(first).toBeCalled();
        expect(last).toBeCalled();
        expect(last.mock.invocationCallOrder[0]).toBeLessThan(first.mock.invocationCallOrder[0]);
    });
    test("Failures do not impact cleans", async () => {
        const cleaner = new Cleaner();
        const first = jest.fn();
        const broken = jest.fn();
        broken.mockImplementation(() => {
            throw new Error();
        });
        const last = jest.fn();
        cleaner.addJob(first);
        cleaner.addJob(broken);
        cleaner.addJob(last);
        // eslint-disable-next-line
        jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress intentional errors.
        await cleaner.clean();
        expect(first).toBeCalled();
        expect(last).toBeCalled();
    });
});