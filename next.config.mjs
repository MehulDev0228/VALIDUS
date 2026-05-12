/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@opentelemetry\/instrumentation/ },
      /Critical dependency: the request of a dependency is an expression/,
    ]
    return config
  },
}

export default nextConfig
