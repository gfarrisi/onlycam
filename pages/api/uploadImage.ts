// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { config } from "dotenv";
config();

type Data = {
  data: {
    status: string;
    url?: string;
    error?: string;
  };
};

interface CloudFlareUploadResponse {
  result: {
    id: string;
    uploadURL: string;
  };
  result_info: null;
  success: boolean;
  errors: [];
  messages: [];
}

async function storeImageUrlFromCloudFlare(
  tokenId: string,
  cloudFlareUrl: string
) {
  //store in storage
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const tokenId = req.query.tokenId as string;

  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const API_TOKEN = process.env.CLOUDFLARE_API_KEY;
  const CLOUDFLARE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2/direct_upload`;

  try {
    const response = await fetch(CLOUDFLARE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: new URLSearchParams({
        requireSignedURLs: "true",
        metadata: JSON.stringify({ key: "value" }),
      }),
    });

    const data: CloudFlareUploadResponse = await response.json();
    const url = data?.result.uploadURL;

    storeImageUrlFromCloudFlare(tokenId, data?.result.uploadURL);

    if (!response.ok) {
      return res.status(response.status).json({
        data: {
          status: "success",
          url: url,
        },
      });
    }

    return res.status(200).json({
      data: {
        status: "error",
      },
    });
  } catch (error) {
    return res.status(500).json({
      data: { status: "error", error: "Failed to fetch Cloudflare API" },
    });
  }
}
