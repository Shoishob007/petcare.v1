const fs = require("fs");
const path = require("path");

const isVercelBuild = process.env.VERCEL === "1";
const isProductionBuild = process.env.NODE_ENV === "production";

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    const env = {};

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }

        const index = trimmed.indexOf("=");
        if (index === -1) {
            continue;
        }

        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        env[key] = value;
    }

    return env;
}

const sharedEnvPath = path.resolve(__dirname, "../backend/.env");
const sharedEnv = parseEnvFile(sharedEnvPath);

if (
    !isVercelBuild &&
    !isProductionBuild &&
    !process.env.NEXT_PUBLIC_API_URL &&
    sharedEnv.NEXT_PUBLIC_API_URL
) {
    process.env.NEXT_PUBLIC_API_URL = sharedEnv.NEXT_PUBLIC_API_URL;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    },
};

module.exports = nextConfig;
