import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  async redirects() {
    return [
      { source: "/atletas", destination: "/", permanent: false },
      { source: "/atletas/:path*", destination: "/", permanent: false },
      { source: "/noticias", destination: "/", permanent: false },
      { source: "/noticias/:path*", destination: "/", permanent: false },
      { source: "/estatisticas", destination: "/tabela", permanent: false },
      { source: "/estatisticas/:path*", destination: "/tabela", permanent: false },
      { source: "/configuracoes", destination: "/", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
