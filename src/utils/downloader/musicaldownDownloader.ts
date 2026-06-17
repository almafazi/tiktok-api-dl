import { fetch } from "undici"
import { load } from "cheerio"
import {
  MusicalDownResponse,
  GetMusicalDownRequest
} from "../../types/downloader/musicaldownDownloader"
import { _musicaldownapi, _musicaldownurl } from "../../constants/api"
import { ERROR_MESSAGES, TIKTOK_URL_REGEX } from "../../constants"
import { createDispatcher } from "../proxy"
type CheerioAPI = ReturnType<typeof load>

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0"

interface RequestForm {
  [key: string]: string
}

const validateTikTokUrl = (url: string): boolean => TIKTOK_URL_REGEX.test(url)

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const extractRequestForm = ($: CheerioAPI, url: string): RequestForm => {
  const input = $("div > input")
  return {
    [input.eq(0).attr("name") || ""]: input.eq(0).attr("value") || url,
    [input.eq(1).attr("name") || ""]: input.eq(1).attr("value") || "",
    [input.eq(2).attr("name") || ""]: input.eq(2).attr("value") || ""
  }
}

const parseImages = ($: CheerioAPI): string[] => {
  const images: string[] = []
  $("div.row > div[class='col s12 m3']").each((_, v) => {
    const src = $(v).find("img").attr("src")
    if (src) images.push(src)
  })
  return images
}

const parseVideos = ($: CheerioAPI): Record<string, string> => {
  const videos: Record<string, string> = {}
  const videoContainer = $("div.row > div")
    .map((_, el) => $(el))
    .get(1)

  if (!videoContainer) return videos

  $(videoContainer)
    .find("a")
    .each((_, v) => {
        const href = $(v).attr("href");
        if (!href || href === "#modal2") return;
        if (!isValidUrl(href)) return;

        const dataEvent = $(v).attr("data-event") || "";
        const onclick = $(v).attr("onclick") || "";

        const downloadUrl = href !== undefined ? href : /downloadX\('([^']+)'\)/.exec(onclick)?.[1];
        if (!downloadUrl) return;

        if (dataEvent.includes("hd")) {
            videos.videoHD = downloadUrl;
        } else if (dataEvent.includes("watermark")) {
            videos.videoWatermark = downloadUrl;
        } else if (dataEvent.includes("mp3")) {
            videos.music = downloadUrl;   // ✅ perbaikan di sini
        } else if (dataEvent.includes("mp4")) {
            videos.videoSD = downloadUrl;
        }
    });

  return videos
}

const createImageResponse = (images: string[]): MusicalDownResponse => ({
  status: "success",
  result: {
    type: "image",
    images
  }
})

const createVideoResponse = (
  $: CheerioAPI,
  videos: Record<string, string>
): MusicalDownResponse => ({
  status: "success",
  result: {
    type: "video",
    author: {
      avatar: $("div.img-area > img").attr("src") || "",
      nickname: $("h2.video-author > b").text()
    },
    cover: (() => {
            const bgStyle = $("div.video-header").attr("style") || "";
            const m = bgStyle.match(/background-image:\s*url\(([^)]+)\)/i);
            return m ? m[1] : "";
        })(),
    desc: $("p.video-desc").text(),
    ...videos
  }
})

const getRequest = async (
  url: string,
  proxy?: string
): Promise<GetMusicalDownRequest> => {
  try {
    if (!validateTikTokUrl(url)) {
      return {
        status: "error",
        message: ERROR_MESSAGES.INVALID_URL
      }
    }

    const res = await fetch(_musicaldownurl, {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Update-Insecure-Requests": "1",
        "User-Agent": USER_AGENT
      },
      ...createDispatcher(proxy)
    })

    const cookie = res.headers.get("set-cookie")?.split(";")[0]
    if (!cookie) {
      return {
        status: "error",
        message: ERROR_MESSAGES.NETWORK_ERROR
      }
    }

    const data = await res.text()
    const $ = load(data)
    const request = extractRequestForm($, url)

    return {
      status: "success",
      request,
      cookie
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
    }
  }
}

/**
 * Tiktok MusicalDown Downloader
 * @param {string} url - Tiktok URL
 * @param {string} proxy - Proxy
 * @returns {Promise<MusicalDownResponse>}
 */
export const MusicalDown = async (
  url: string,
  proxy?: string
): Promise<MusicalDownResponse> => {
  try {
    const request = await getRequest(url, proxy)
    if (request.status !== "success") {
      return {
        status: "error",
        message: request.message
      }
    }

    const res = await fetch(_musicaldownapi, {
      method: "POST",
      headers: {
        cookie: request.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://musidown.com/download",
        Referer: "https://musidown.com/download/en",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": USER_AGENT
      },
      body: new URLSearchParams(Object.entries(request.request ?? {})),
      ...createDispatcher(proxy)
    })

    const data = await res.text()
    const $ = load(data)
    const images = parseImages($)

    if (images.length > 0) {
      return createImageResponse(images)
    }

    const videos = parseVideos($)
    if (Object.keys(videos).length === 0) {
      return {
        status: "error",
        message: "There is an error. Can't find download link"
      }
    }

    return createVideoResponse($, videos)
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
    }
  }
}
