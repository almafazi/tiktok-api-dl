import { fetch } from "undici"
import { _tiktokTrendings } from "../../constants/api"
import {
  TiktokTrendingResponse,
  TrendingData,
  TrendingCreator
} from "../../types/get/getTrendings"
import { _getTrendingsParams } from "../../constants/params"
import { createDispatcher } from "../proxy"

export const getTrendings = async (proxy?: string): Promise<TiktokTrendingResponse> => {
  try {
    const url = _tiktokTrendings(_getTrendingsParams())
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9"
      },
      ...createDispatcher(proxy)
    })

    if (!response.ok) {
      return { status: "error", message: "Failed to fetch trending data" }
    }

    const data = await response.json() as any
    if (!data?.body || data.statusCode !== 0) {
      return { status: "error", message: "Failed to fetch trending data" }
    }

    return { status: "success", result: parseTrendingData(data.body) }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to fetch trending data"
    }
  }
}

const parseTrendingData = (body: any[]): TrendingData[] =>
  body
    .filter((section) => section.exploreList && Array.isArray(section.exploreList))
    .map((section) => ({
      exploreList: section.exploreList,
      pageState: section.pageState || {}
    }))

export const getTrendingCreators = async (
  proxy?: string
): Promise<{ status: "success" | "error"; message?: string; result?: TrendingCreator[] }> => {
  try {
    const trendingResponse = await getTrendings(proxy)
    if (trendingResponse.status === "error") {
      return { status: "error", message: trendingResponse.message }
    }

    const creators: TrendingCreator[] = []
    trendingResponse.result?.forEach((data) => {
      data.exploreList.forEach((item) => {
        if (item.cardItem?.type === 2) {
          const c = item.cardItem
          creators.push({
            id: c.id,
            username: c.subTitle.replace("@", ""),
            nickname: c.title,
            avatarThumb: c.cover,
            description: c.description,
            verified: c.extraInfo?.verified || false,
            followerCount: c.extraInfo?.fans || 0,
            likeCount: c.extraInfo?.likes || 0,
            videoCount: c.extraInfo?.video || 0,
            followingCount: c.extraInfo?.following || 0,
            heartCount: c.extraInfo?.heart || 0,
            diggCount: c.extraInfo?.digg || 0,
            secUid: c.extraInfo?.secUid || "",
            link: c.link
          })
        }
      })
    })

    return { status: "success", result: creators }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to fetch trending creators"
    }
  }
}
