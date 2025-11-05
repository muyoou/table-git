"use client";

import type { ReactNode } from "react";
import { ConfigProvider, theme } from "antd";

const { defaultAlgorithm, defaultSeed } = theme;
const mapToken = defaultAlgorithm(defaultSeed);

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: mapToken.colorPrimary,
          fontFamily: "Inter, 'Segoe UI', sans-serif"
        },
        algorithm: [defaultAlgorithm]
      }}
    >
      {children}
    </ConfigProvider>
  );
}
