import { TikTokService } from './lib/client';
import { IParsed, ITiktokOptions } from "./types/parsed-types";
import { isParsedOptions, parseTikTokVideo } from "./lib/parser.service";
import { TikItem } from "./types/type";

/**
 * Fetches a TikTok video or user profile based on the provided URL.
 *
 * @param url - The URL of the TikTok video or user profile.
 * @param options - Optional configuration options for the TikTok request.
 * @returns A Promise that resolves to an array of Aweme objects, a full IParsed object, or a Partial<IParsed> if keys are specified.
 * @throws An error if fetching fails or the aweme is not found.
 */
async function Tiktok<T extends ITiktokOptions>(
  url: string,
  options?: T
): Promise<
  TiktokRsp<T>
> {
  const tiktok = new TikTokService()
  const response = await tiktok.fetchTikList(url);
  if (!response) {
    throw new Error("Failed to fetch the response");
  }

  const [tikId, videos] = response;
  if (!videos) {
    throw new Error("Failed to fetch the videos");
  }

  const video = videos.find((item: { aweme_id: any; }) => item.aweme_id === tikId);
  if (!video) {
    throw new Error("Failed to find the tiktok video");
  }

  return isParsedOptions(options)
    ? parseTikTokVideo(video, options.keys ? { keys: options.keys } : undefined) as any
    : (videos as any);
}

export type TiktokRsp<T extends ITiktokOptions> = IParsed & Partial<
  Pick<
    TikItem,
    T extends { parse: true; keys: (keyof TikItem)[] } ? T["keys"][number] : never
  >
>

export default Tiktok;
