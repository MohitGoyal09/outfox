import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { turbopackUseBuiltinBabel: false },
  turbopack: {
    rules: {
      "*.{ts,tsx}": {
        condition: { path: /^components\/orbs\// },
        loaders: [
          {
            loader: "babel-loader",
            options: {
              babelrc: false,
              configFile: false,
              sourceMaps: true,
              plugins: ["unplugin-typegpu/babel"],
              parserOpts: { plugins: ["typescript", "jsx"] },
            },
          },
        ],
      },
    },
  },
};

export default nextConfig;
