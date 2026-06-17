import { fetch } from "undici"
import { _tiktokGetMusicDetail } from "../../constants/api"
import { TiktokMusicDetailResponse } from "../../types/get/getMusicDetail"
import { _getMusicDetailParams } from "../../constants/params"
import { TiktokService } from "../../services/tiktokService"
import { webUserAgent } from "../../constants/headers"
import { extractMusicId } from "../urlExtractors"
import { createDispatcher } from "../proxy"
import fs from "fs"

export const getMusicDetail = async (
  musicIdOrUrl: string,
  cookie: string | any[],
  proxy?: string
): Promise<TiktokMusicDetailResponse> => {
  try {
    const musicId = extractMusicId(musicIdOrUrl)
    if (!musicId) {
      return { status: "error", message: "Invalid music ID or URL format" }
    }

    const Tiktok = new TiktokService()
    const params = _getMusicDetailParams(musicId)
    const xttparams = Tiktok.generateXTTParams(params)

    const url = new URL(_tiktokGetMusicDetail())
    url.search = params

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": webUserAgent,
        Cookie: Array.isArray(cookie) ? cookie.join("; ") : cookie,
        "x-tt-params": xttparams
      },
      ...createDispatcher(proxy)
    })

    console.log("Response status:", response.status)

    const responseData = await response.json() as any
    if (responseData.statusCode === 0 && responseData.musicInfo) {
      return {
        status: "success",
        result: {
          musicInfo: responseData.musicInfo,
          shareMeta: responseData.shareMeta
        }
      }
    }

    return {
      status: "error",
      message: responseData.status_msg || "Music not found"
    }
  } catch (err: any) {
    return {
      status: "error",
      message: err.message || "Failed to fetch music detail"
    }
  }
}
