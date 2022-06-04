module.exports = (stage) => {
    return {
        image: "alpine/git",
        script: [
            `git clone ${stage.repository} .`,
        ],
    };
};