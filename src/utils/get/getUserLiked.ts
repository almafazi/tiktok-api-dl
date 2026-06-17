import { fetch } from "undici"
import { _tiktokGetUserLiked } from "../../constants/api"
import { StalkUser } from "./getProfile"
import { _getUserLikedParams } from "../../constants/params"
import { TiktokService } from "../../services/tiktokService"
import {
  AuthorLiked,
  LikedResponse,
  TiktokUserFavoriteVideosResponse,
  StatisticsLiked,
  MusicLiked,
  VideoLiked,
  StatisticsAuthorLiked,
  ImagesLiked
} from "../../types/get/getUserLiked"
import retry from "async-retry"
import { createDispatcher } from "../proxy"

export const getUserLiked = async (
  username: string,
  cookie: string | any[],
  proxy?: string,
  postLimit?: number
): Promise<TiktokUserFavoriteVideosResponse> => {
  const profileRes = await StalkUser(username)
  if (profileRes.status === "error") {
    return { status: "error", message: profileRes.message }
  }

  const id = profileRes.result.user.uid
  const secUid = profileRes.result.user.secUid
  const data = await parseUserLiked(id, secUid, cookie, postLimit, proxy)

  if (!data.length) {
    return { status: "error", message: "No liked videos found!" }
  }

  return { status: "success", result: data, totalPosts: data.length }
}

const parseUserLiked = async (
  id: string,
  secUid: string,
  cookie: string | any[],
  postLimit?: number,
  proxy?: string
): Promise<LikedResponse[]> => {
  // Liked Result
  let hasMore = true
  const favorites: LikedResponse[] = []
  let counter = 0
  while (hasMore) {
    let result: any | null = null

    // Prevent missing response favorites
    result = await requestUserLiked(id, secUid, cookie, postLimit, proxy)

    result?.itemList?.forEach((v: any) => {
      const statsAuthor: StatisticsAuthorLiked = {
        likeCount: v.authorStats.diggCount,
        followerCount: v.authorStats.followerCount,
        followingCount: v.authorStats.followingCount,
        friendCount: v.authorStats.friendCount,
        heartCount: v.authorStats.heartCount,
        postsCount: v.authorStats.videoCount
      }

      const author: AuthorLiked = {
        id: v.author.id,
        username: v.author.uniqueId,
        nickname: v.author.nickname,
        avatarLarger: v.author.avatarLarger,
        avatarThumb: v.author.avatarThumb,
        avatarMedium: v.author.avatarMedium,
        signature: v.author.signature,
        verified: v.author.verified,
        openFavorite: v.author.openFavorite,
        privateAccount: v.author.privateAccount,
        isADVirtual: v.author.isADVirtual,
        isEmbedBanned: v.author.isEmbedBanned,
        stats: statsAuthor
      }

      const stats: StatisticsLiked = {
        collectCount: v.statsV2.collectCount,
        commentCount: v.statsV2.commentCount,
        diggCount: v.statsV2.diggCount,
        playCount: v.statsV2.playCount,
        repostCount: v.statsV2.repostCount,
        shareCount: v.statsV2.shareCount
      }

      const music: MusicLiked = {
        id: v.music.id,
        title: v.music.title,
        playUrl: v.music.playUrl,
        coverThumb: v.music.coverThumb,
        coverMedium: v.music.coverMedium,
        coverLarge: v.music.coverLarge,
        authorName: v.music.authorName,
        original: v.music.original,
        album: v.music.album,
        duration: v.music.duration,
        isCopyrighted: v.music.isCopyrighted,
        private: v.music.private
      }

      const response = {
        id: v.id,
        desc: v.desc,
        createTime: v.createTime,
        duetEnabled: v.duetEnabled || false,
        digged: v.digged || false,
        forFriend: v.forFriend || false,
        isAd: v.isAd || false,
        originalItem: v.originalItem || false,
        privateItem: v.privateItem || false,
        officialItem: v.officialItem || false,
        secret: v.secret || false,
        shareEnabled: v.shareEnabled || false,
        stitchEanbled: v.stitchEanbled || false,
        textTranslatable: v.textTranslatable || false
      }

      if (v.imagePost) {
        const imagePost: ImagesLiked[] = []
        v.imagePost.images.forEach((image: any) => {
          imagePost.push({
            title: image.title,
            images: image.imageURL.urlList[0]
          })
        })

        favorites.push({
          ...response,
          author,
          stats,
          imagePost,
          music
        })
      } else {
        const video: VideoLiked = {
          id: v.video.id,
          videoID: v.video.id,
          duration: v.video.duration,
          ratio: v.video.ratio,
          cover: v.video.cover,
          originCover: v.video.originCover,
          dynamicCover: v.video.dynamicCover,
          playAddr: v.video.playAddr,
          downloadAddr: v.video.downloadAddr,
          format: v.video.format,
          bitrate: v.video.bitrate,
          bitrateInfo: v.video.bitrateInfo
        }

        favorites.push({
          ...response,
          author,
          stats,
          video,
          music
        })
      }
    })

    // Update hasMore and cursor for next iteration
    hasMore = result.hasMore
    counter++

    // Check post limit if specified
    if (postLimit && favorites.length >= postLimit) {
      hasMore = false
      break
    }
  }
  return postLimit ? favorites.slice(0, postLimit) : favorites
}

const requestUserLiked = async (
  id: string,
  secUid: string,
  cookie: string | any[],
  postLimit: number,
  proxy?: string
): Promise<any> => {
  const Tiktok = new TiktokService()

  const url = new URL(
    _tiktokGetUserLiked(_getUserLikedParams(id, secUid, postLimit))
  )
  const signature = Tiktok.generateSignature(url)
  url.searchParams.append("_signature", signature)
  const xbogus = Tiktok.generateXBogus(url, signature)
  url.searchParams.append("X-Bogus", xbogus)
  const xttparams = Tiktok.generateXTTParams(url.searchParams.toString())

  return await retry(
    async (bail, attempt) => {
      try {
        const res = await fetch(url.toString(), {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.35",
            cookie: Array.isArray(cookie) ? cookie.join("; ") : cookie,
            "x-tt-params": xttparams
          },
          ...createDispatcher(proxy)
        })

        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        const data = await res.json() as any
        if (!data) throw new Error("Empty response")

        return data
      } catch (error) {
        if (attempt === 3) {
          bail(error)
        }
        throw error
      }
    },
    {
      retries: 10,
      minTimeout: 1000,
      maxTimeout: 5000,
      factor: 2
    }
  )
}
