import type { Config } from "tailwindcss";
import { theme } from "antd";

const { defaultAlgorithm, defaultSeed } = theme;
const mapToken = defaultAlgorithm(defaultSeed);

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/layouts/**/*.{ts,tsx}",
    "./src/shared/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: mapToken.colorPrimary,
        background: mapToken.colorBgBase
      },
      borderRadius: {
        lg: `${mapToken.borderRadiusLG}px`
      }
    }
  },
  plugins: []
};

export default config;
