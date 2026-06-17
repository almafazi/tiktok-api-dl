import { fetch } from "undici"
import { _tiktokGetComments } from "../../constants/api"
import { _getCommentsParams } from "../../constants/params"
import {
  Comments,
  TiktokVideoCommentsResponse,
  User
} from "../../types/get/getComments"
import { TIKTOK_URL_REGEX } from "../../constants"
import { createDispatcher } from "../proxy"

export const getComments = async (
  url: string,
  proxy?: string,
  commentLimit?: number
): Promise<TiktokVideoCommentsResponse> => {
  try {
    if (!TIKTOK_URL_REGEX.test(url)) {
      return { status: "error", message: "Invalid TikTok URL" }
    }

    url = url.replace("https://vm", "https://vt")

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      ...createDispatcher(proxy)
    })

    const responseUrl: string = response.url
    const idMatch = responseUrl.match(/\d{17,21}/g)
    if (!idMatch) {
      return {
        status: "error",
        message: "Failed to extract video ID from URL"
      }
    }

    const resultComments = await parseComments(idMatch[0], commentLimit, proxy)
    if (!resultComments.comments.length) {
      return { status: "error", message: "No comments found!" }
    }

    return {
      status: "success",
      result: resultComments.comments,
      totalComments: resultComments.total
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to fetch comments"
    }
  }
}

const requestComments = async (id: string, commentLimit: number, proxy?: string) => {
  const res = await fetch(
    _tiktokGetComments(_getCommentsParams(id, commentLimit)),
    {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
      },
      ...createDispatcher(proxy)
    }
  )
  return await res.json() as any
}

const parseComments = async (id: string, commentLimit?: number, proxy?: string) => {
  const comments: Comments[] = []
  let total: number = 0
  let hasMore: boolean = true

  while (hasMore) {
    const result = await requestComments(id, commentLimit, proxy)
    hasMore = result.has_more === 1

    if (result.comments) {
      result.comments.forEach((v: any) => {
        const comment = {
          cid: v.cid,
          text: v.text,
          commentLanguage: v.comment_language,
          createTime: v.create_time,
          likeCount: v.digg_count,
          isAuthorLiked: v.is_author_digged,
          isCommentTranslatable: v.is_comment_translatable,
          replyCommentTotal: v.reply_comment_total,
          user: {
            uid: v.user.uid,
            avatarThumb: v.user.avatar_thumb.url_list,
            nickname: v.user.nickname,
            username: v.user.unique_id,
            isVerified: v.user.custom_verify !== ""
          } as User,
          url: v.share_info?.url || "",
          replyComment: []
        }

        if (v.reply_comment !== null) {
          v.reply_comment.forEach((reply: any) => {
            comment.replyComment.push({
              cid: reply.cid,
              text: reply.text,
              commentLanguage: reply.comment_language,
              createTime: reply.create_time,
              likeCount: reply.digg_count,
              isAuthorLiked: reply.is_author_digged,
              isCommentTranslatable: reply.is_comment_translatable,
              replyCommentTotal: reply.reply_comment_total,
              user: {
                uid: reply.user.uid,
                avatarThumb: reply.user.avatar_thumb.url_list,
                nickname: reply.user.nickname,
                username: reply.user.unique_id,
                isVerified: reply.user.custom_verify !== ""
              } as User,
              url: reply.share_info?.url || "",
              replyComment: []
            })
            total++
          })
        }

        total++
        comments.push(comment)
      })
    }

    if (commentLimit && comments.length >= commentLimit) break
  }

  const response = commentLimit ? comments.slice(0, commentLimit) : comments
  return { total: response.length, comments: response }
}
