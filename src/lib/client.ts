import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { Injectable } from '@angular/core';
import { TikItem } from '../types/type';

@Injectable({
  providedIn: 'root',
})
export class TikTokService {
  private readonly baseUrl = 'https://api22-normal-c-alisg.tiktokv.com';
  private http: HTTP;

  constructor() {
    this.http = new HTTP();

    // Default-Header setzen
    this.http.setHeader('*', 'Accept-Encoding', 'deflate');
    this.http.setHeader('*', 'User-Agent', 'okhttp/3.14.9');
  }

  private async getTikId(url: string): Promise<string | null> {

    const REGEXP = /(?:video|photo|user)\/(\d+)/;
    const valid = url.match(REGEXP);
    if (valid) {
      return valid[1];
    }

    try {
      const resp = await this.http.sendRequest(url, {
        method: 'get',
        serializer: 'utf8',
      });

      const match =
        resp.url.match(REGEXP)?.[1] ||
        resp.headers?.location?.match(REGEXP)?.[1];

      if (!match) {
        throw new Error(resp.data);
      }
      return match;
    } catch (error) {
      console.error('Failed to fetch the tiktok ID:', error);
      return null;
    }
  }

  private device_idGenerator(): string {
    return Array(19)
      .fill(0)
      .map(() => Math.floor(Math.random() * 10))
      .join('');
  }

  /**
   * Fetches the list of tiktok videos from the specified URL.
   *
   * @param url - The URL to fetch the tiktok video from.
   * @param retries
   * @param delayMs
   * @returns A promise that resolves to a tuple containing the tiktok ID and the list of videos, or null if the tiktok ID is not found or the data is invalid.
   */
  async fetchTikList(url: string, retries = 3, delayMs = 1000): Promise<[TikItem['aweme_id'], TikItem[]] | null> {
    const tikId = await this.getTikId(url);
    if (!tikId) return null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const resp = await this.http.sendRequest(
          `${this.baseUrl}/aweme/v1/feed/`,
          {
            method: 'options',
            serializer: 'urlencoded',
            params: {
              iid: this.device_idGenerator(),
              device_id: this.device_idGenerator(),
              version_code: '300904',
              aweme_id: tikId,
            },
          }
        );

        const data = JSON.parse(resp.data) as { aweme_list?: TikItem[] };
        if (data?.aweme_list) return [tikId, data.aweme_list];
        return null;

      } catch (err: any) {
        if (err.status === 429 && attempt < retries) {
          // Warte exponentiell länger
          await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
          continue;
        }
        console.error('Failed to fetch tiktok list:', err);
        throw err;
      }
    }

    return null;
  }
}
