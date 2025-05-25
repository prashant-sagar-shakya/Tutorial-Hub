import { BaseEnvironment } from "./BaseEnvironment";
import axios from "axios";

const env = new BaseEnvironment();

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3/search";

export const getYoutubeVideos = async (query: string) => {
  const param = {
    part: "snippet",
    q: query,
    maxResults: 1,
    type: "video",
    key: env.YOUTUBE_API_KEY,
  };

  const response = await axios.get(YOUTUBE_BASE_URL, { params: param });
  return response.data.items;
};

const PEXELS_BASE_URL = "https://api.pexels.com/v1/search";

export const getTopicImage = async (query: string): Promise<string | null> => {
  try {
    const response = await axios.get(PEXELS_BASE_URL, {
      headers: {
        Authorization: env.PEXELS_API_KEY,
      },
      params: {
        query: query,
        per_page: 1,
        orientation: "landscape", // Optional: get landscape images
      },
    });
    if (response.data.photos && response.data.photos.length > 0) {
      return (
        response.data.photos[0].src.large2x || response.data.photos[0].src.large
      ); // Prefer larger images
    }
    console.warn("No image found on Pexels for query:", query);
    return null;
  } catch (error) {
    console.error("Error fetching image from Pexels:", error);
    return null;
  }
};
