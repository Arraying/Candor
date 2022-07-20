const msPerMinute = 60 * 1000;
const msPerHour = msPerMinute * 60;
const msPerDay = msPerHour * 24;

/**
 * 
 * @param {number} to Unix time of upper bound.
 * @param {number} from Unix time of lower bound.
 * @returns The time difference as a string, ish.
 */
export function relativeTimeDifference(to, from) {
    const elapsed = to - from;
    if (elapsed < msPerMinute) {
        return `${Math.round(elapsed/1000)}s`;   
    } else if (elapsed < msPerHour) {
        return `${Math.round(elapsed / msPerMinute)}m`;
    } else if (elapsed < msPerDay ) {
        return `${Math.round(elapsed / msPerHour)}hr`;
    } else {
        return `${Math.round(elapsed / msPerDay)}d`;
    }
}