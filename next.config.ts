import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { turbopackUseBuiltinBabel: false },
  async headers() {
    return [{ source: "/share/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] }];
  },
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
