import path from "path";
import winston from "winston";

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({
            filename: path.join(process.env.DASHBOARD_LOGS || "./", "dashboard.log"),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
            tailable: true,
            zippedArchive: true,
        }),
    ],
});