const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  eslint: {
    dirs: ["src"]
  },
  typescript: {
    ignoreBuildErrors: false
  }
};

export default nextConfig;
