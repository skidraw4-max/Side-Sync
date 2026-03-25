import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로컬에서 히어로 등 public 이미지 교체 후에도 /_next/image 캐시로 옛 이미지가
  // 보이는 것을 줄이기 위해 최소 TTL을 0으로 둡니다. (배포 시 필요하면 60 등으로 올리세요.)
  images: {
    minimumCacheTTL: 0,
  },
  async headers() {
    // Vercel/Next 배포 중 청크(manifest) 불일치로 발생하는 ChunkLoadError를 완화하기 위해
    // /_next/static/ 리소스 캐시를 강하게 낮춥니다.
    // (기본값이 immutable로 길게 캐시되는 경우가 있어 배포 직후 사용자 브라우저가
    // 이전 청크 파일명을 요청할 수 있습니다.)
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
