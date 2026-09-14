const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
        ],
    },
    webpack: (config) => {
        config.resolve.modules.push(
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../backend/node_modules'),
            path.resolve(__dirname, '../node_modules')
        );
        return config;
    },
};

module.exports = nextConfig;
