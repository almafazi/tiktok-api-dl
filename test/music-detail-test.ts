// Test for Tiktok Get Music Detail
import Tiktok from "../src/index"

/**
 * Test getMusicDetail function
 * This test will fetch detailed information for a specific music ID or URL
 * Note: This requires a valid TikTok cookie
 */
async function testGetMusicDetail() {
  console.log("Testing getMusicDetail function...")

  // You can use either music ID or URL
  const musicIdOrUrl = "https://www.tiktok.com/music/QKThr-6771810675950880769"
  // const musicIdOrUrl = "6771810675950880769" // Alternative: use direct ID

  // IMPORTANT: Replace with your actual TikTok cookie
  const cookie = "delay_guest_mode_vid=5;tt-target-idc-sign=pQAqtvuwH-C2IBqKBWgDct2x1ig8W8ZND3HW5uBvJ4PS1_jHvlLmlbWEy9cHMe5b_l2cPrpEg4Diz311C7lSFpYRP5FfRft1JJbw2TNxMG14yHa8ArCQrRHvlpxGHc1SJ40mUIqf1NyeV7LOsxAv_P4O3lRaENbC1G_GGZ2RgxiK-kbDY_12A5uBPBNfZQQR43PzxAq1foSLC5HpBO13liRK_v7PQcpsLmXphorPL9C9aTQ91qSMvQy-qBRiD6VbK6P5y8SFh0MIIPIfxtoTb4ucFjIB7D5UDwJ_35I_dTvJaSUAS_sPb-WQhsGXIB6zGU75OShQmddtZ6F2_Ens2yV8MiQfkxeJrq6Rc6TzdqSDkQIvJp3vxzwAYQ_2urur1bKU9WPt0kb_YEmX7kNBWOKh1NExX1exuSWywYgiMPtOXg0qS2IkTjM_GAyzjxaMtzQypsh4qChYQ2QAn9m56wRMev0kH1Oo7nwKFLFiGtFfBsrum62Sseob65HNBhgF;msToken=xT3ndoA5USt4OFWSD00fSEOEUvwSI2hgMJM5sdL_JlkIlWB2BLa5PuDlfNtVPZIJWZ_pRrIIlSX8iGfz-xxYa84ZVP4of8DBycqTmFaxDKiR8MRypx4PKXQ76UVgdAZFr6OygKlVBjEtl9Fm9TN43KH7hQ==;tt_session_tlb_tag=sttt%7C1%7CGNPxwVOqkUH8mYfUDJPFQP__________n-XYPdOzTKp0zXX-3hZ6ICILuyCbvK0hUOyhHZqwy0U%3D;sid_guard=18d3f1c153aa9141fc9987d40c93c540%7C1777381724%7C15551999%7CSun%2C+25-Oct-2026+13%3A08%3A43+GMT;ttwid=1%7CYklb7GAfPYT00ir0BX0pkpfhPhNBk6OLoEwI_ANTFWg%7C1777385443%7C2c97f4725f34371e499c786d4a62d859c53c087de133b3c9dd1408fbe13bc310;tt_ticket_guard_has_set_public_key=1;store-country-code-src=uid;perf_feed_cache={%22expireTimestamp%22:1777982400000%2C%22itemIds%22:[%227612095508814859528%22%2C%227622387957026000158%22%2C%227608870052867198228%22]};uid_tt=bfda96b75627f089753a000ff660c4b3a16477629046de89c7b1f3902f182ed8;store-country-sign=MEIEDPpcdsglpVh0hqasUwQgiX-V17pwAt9Oz9OuRqztTxGGsLIAVNJkVfHzdznYys0EEABisV3A_nZ8RivhyCRCgGA;msToken=xT3ndoA5USt4OFWSD00fSEOEUvwSI2hgMJM5sdL_JlkIlWB2BLa5PuDlfNtVPZIJWZ_pRrIIlSX8iGfz-xxYa84ZVP4of8DBycqTmFaxDKiR8MRypx4PKXQ76UVgdAZFr6OygKlVBjEtl9Fm9TN43KH7hQ==;s_v_web_id=verify_moimovok_v5I0aNCj_OKr5_43t2_9WZU_9WOTUVPgJZa3;store-idc=alisg;ssid_ucp_v1=1.0.1-KGYxMGE1YzRjZjU2NTg5MmQzY2M1YjYyMWYwZDRhMzQwYWUxYTgzZDgKIQiFiNX-l7_3lWUQ3OLCzwYYswsgDDCTvK-pBjgIQBJIBBADGgNteTIiIDE4ZDNmMWMxNTNhYTkxNDFmYzk5ODdkNDBjOTNjNTQwMk4KIGCNnGxKSSjrf8iJu0aFv3VGlb0xQdzAau9kv5_RKfgcEiDMqIKQyUNRHJhY_aQHNo0PvXY2t1P6p5PjH9gMKQpPHRgDIgZ0aWt0b2s;tiktok_webapp_theme=dark;cmpl_token=AgQYAPOg_hfkTtK1FTNe9-edPPOC5Q1hXH-QK2CnmgA;last_login_method=google;multi_sids=7290164485490557957%3A18d3f1c153aa9141fc9987d40c93c540;odin_tt=d2246d14039f46623ebb8b82d599a159aaa5883997f9f9868d204873fb54964c38692446f0368428ae617e47545e8f9a113ada7bc1dae1fc9f2aa52ed5ca1354;passport_auth_status=9535f5045466d772d6b79ee18b4b4cf7%2C;passport_auth_status_ss=9535f5045466d772d6b79ee18b4b4cf7%2C;passport_fe_beating_status=true;sessionid=18d3f1c153aa9141fc9987d40c93c540;sessionid_ss=18d3f1c153aa9141fc9987d40c93c540;sid_tt=18d3f1c153aa9141fc9987d40c93c540;sid_ucp_v1=1.0.1-KGYxMGE1YzRjZjU2NTg5MmQzY2M1YjYyMWYwZDRhMzQwYWUxYTgzZDgKIQiFiNX-l7_3lWUQ3OLCzwYYswsgDDCTvK-pBjgIQBJIBBADGgNteTIiIDE4ZDNmMWMxNTNhYTkxNDFmYzk5ODdkNDBjOTNjNTQwMk4KIGCNnGxKSSjrf8iJu0aFv3VGlb0xQdzAau9kv5_RKfgcEiDMqIKQyUNRHJhY_aQHNo0PvXY2t1P6p5PjH9gMKQpPHRgDIgZ0aWt0b2s;store-country-code=id;tiktok_webapp_theme_source=auto;tt-target-idc=alisg;tt_chain_token=faspPdlXjQchHdhwwkoa2w==;tt_csrf_token=SlJri5sA-jtsdx_P4pBrywKcdiw63tGmYxBY;uid_tt_ss=bfda96b75627f089753a000ff660c4b3a16477629046de89c7b1f3902f182ed8;x-web-secsdk-uid=014b6d65-8f98-407d-9396-d95fcd0fdbfb" // Get this from your browser's dev tools

  try {
    console.log(`Fetching music detail for: ${musicIdOrUrl}`)
    console.log("Note: Make sure you have set a valid TikTok cookie\n")

    const result = await Tiktok.GetMusicDetail(musicIdOrUrl, {
      cookie: cookie
      // proxy: "http://your-proxy-url" // Optional: Add proxy if needed
    })

    console.log("Result received:")
    console.log(`Status: ${result.status}`)

    if (result.status === "success" && result.result) {
      const { musicInfo, shareMeta } = result.result

      console.log("\n========================")
      console.log("MUSIC INFORMATION")
      console.log("========================")
      console.log(`Music ID: ${musicInfo.music.id}`)
      console.log(`Title: ${musicInfo.music.title}`)
      console.log(`Author Name: ${musicInfo.music.authorName}`)
      console.log(`Duration: ${musicInfo.music.duration} seconds`)
      console.log(`Original: ${musicInfo.music.original ? "Yes" : "No"}`)
      console.log(
        `Copyrighted: ${musicInfo.music.isCopyrighted ? "Yes" : "No"}`
      )
      console.log(`Private: ${musicInfo.music.private ? "Yes" : "No"}`)

      console.log("\n========================")
      console.log("AUTHOR INFORMATION")
      console.log("========================")
      console.log(`Author ID: ${musicInfo.author?.id}`)
      console.log(`Nickname: ${musicInfo.author?.nickname}`)
      console.log(`Username: @${musicInfo.author?.uniqueId}`)
      console.log(`Verified: ${musicInfo.author?.ftc ? "Yes" : "No"}`)
      console.log(
        `Private Account: ${musicInfo.author?.privateAccount ? "Yes" : "No"}`
      )
      console.log(`Secure UID: ${musicInfo.author?.secUid}`)
      console.log(`Signature: ${musicInfo.author?.signature || "No signature"}`)

      console.log("\n========================")
      console.log("STATISTICS")
      console.log("========================")
      console.log(
        `Videos using this music: ${musicInfo.stats.videoCount.toLocaleString()}`
      )

      console.log("\n========================")
      console.log("URLS")
      console.log("========================")
      console.log(`Play URL: ${musicInfo.music.playUrl}`)
      console.log(`Cover Thumbnail: ${musicInfo.music.coverThumb}`)
      console.log(`Cover Medium: ${musicInfo.music.coverMedium}`)
      console.log(`Cover Large: ${musicInfo.music.coverLarge}`)

      if (shareMeta) {
        console.log("\n========================")
        console.log("SHARE META")
        console.log("========================")
        console.log(`Title: ${shareMeta.title}`)
        console.log(`Description: ${shareMeta.desc}`)
      }

      console.log("\n✅ Test completed successfully!")
      console.log(
        "\n💡 Tip: Use 'GetVideosByMusicId' to get videos using this music"
      )
    } else {
      console.log(`❌ Error: ${result.message}`)
    }
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message)
    console.error("\nError details:", error)
  }
}

// Run the test
testGetMusicDetail()
