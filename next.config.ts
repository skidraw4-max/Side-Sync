import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로컬에서 히어로 등 public 이미지 교체 후에도 /_next/image 캐시로 옛 이미지가
  // 보이는 것을 줄이기 위해 최소 TTL을 0으로 둡니다. (배포 시 필요하면 60 등으로 올리세요.)
  images: {
    minimumCacheTTL: 0,
  },
};

export default nextConfig;
