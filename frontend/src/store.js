import { writable } from "svelte/store";

export const User = writable(undefined);

/**
 * Represents the store keeping all of the pipeline overviews.
 */
export const Pipelines = writable([
    {
        id: 1,
        name: "Foo",
        status: "Passed",
        stages: ["Success", "Success"],
        lastSuccess: "28.03.02 10:00",
        lastFailure: "-",
    },
    {
        id: 2,
        name: "Bar",
        status: "Failed",
        stages: ["Success", "Failed"],
        lastSuccess: "28.03.02 10:00",
        lastFailure: "28.03.03 10:00",
    },
    {
        id: 3,
        name: "Baz",
        status: "Error",
        stages: ["Error", "Skipped"],
        lastSuccess: "28.03.02 10:00",
        lastFailure: "28.03.03 10:00",
    }
]);