// Search Pexels and return the first result
export async function searchPexelsFirst(
  query: string,
  options: { type?: "image" | "video" } = {}
): Promise<{
  id: string;
  url: string;
  thumbnailUrl?: string;
  name: string;
} | null> {
  const result = await searchPexels(query, { ...options, perPage: 1, page: 1 });
  return result.results.length > 0 ? result.results[0] : null;
}

// Search Pexels API for images or videos
export async function searchPexels(
  query: string,
  options: { type?: "image" | "video"; perPage?: number; page?: number } = {}
): Promise<{
  results: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    name: string;
  }>;
  hasMore: boolean;
  totalResults?: number;
}> {
  const apiKey = process.env.PEXELS_API_KEY;
  const perPage = options.perPage || 10;
  const page = options.page || 1;

  if (!apiKey) {
    console.warn("⚠️ PEXELS_API_KEY not set, using stub response");
    // Stub implementation - generate multiple results
    const stubResults = Array.from({ length: perPage }, (_, i) => ({
      id: `pexels_stub_${Date.now()}_${i}`,
      url: `https://images.pexels.com/photos/example_${query.replace(
        /\s+/g,
        "_"
      )}_${i}.jpg`,
      thumbnailUrl: `https://images.pexels.com/photos/example_${query.replace(
        /\s+/g,
        "_"
      )}_${i}.jpg?auto=compress&cs=tinysrgb&w=300`,
      name: `Example ${query} ${i + 1}`,
    }));

    return {
      results: stubResults,
      hasMore: page < 5, // Simulate 5 pages of results
      totalResults: 50,
    };
  }

  try {
    const url =
      options.type === "video"
        ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(
            query
          )}&per_page=${perPage}&page=${page}`
        : `https://api.pexels.com/v1/search?query=${encodeURIComponent(
            query
          )}&per_page=${perPage}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      console.error(
        `Pexels API error: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();

    if (options.type === "video") {
      // Map video results - prefer HD quality
      const results = (data.videos || []).map((video: any) => {
        // Find the best quality video file (prefer HD, then SD)
        const videoFiles = video.video_files || [];
        const hdVideo = videoFiles.find(
          (f: any) => f.quality === "hd" || f.quality === "high"
        );
        const sdVideo = videoFiles.find(
          (f: any) => f.quality === "sd" || f.quality === "medium"
        );
        const videoFile = hdVideo || sdVideo || videoFiles[0];

        return {
          id: `pexels_video_${video.id}`,
          url: videoFile?.link || video.video_files?.[0]?.link || video.url,
          thumbnailUrl: video.image || video.picture,
          name: video.url || `Video ${video.id}`,
        };
      });

      const totalResults = data.total_results || 0;
      const hasMore = page * perPage < totalResults;

      return {
        results,
        hasMore,
        totalResults,
      };
    } else {
      // Map photo results
      const results = (data.photos || []).map((photo: any) => ({
        id: `pexels_photo_${photo.id}`,
        url: photo.src?.large || photo.src?.original || photo.url,
        thumbnailUrl: photo.src?.medium || photo.src?.small,
        name: photo.photographer || `Photo ${photo.id}`,
      }));

      const totalResults = data.total_results || 0;
      const hasMore = page * perPage < totalResults;

      return {
        results,
        hasMore,
        totalResults,
      };
    }
  } catch (error) {
    console.error("Error searching Pexels:", error);
    return {
      results: [],
      hasMore: false,
      totalResults: 0,
    };
  }
}
