// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
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

function getTokenUrlFromTokenId(tokenId: string) {
  //get from storage
}

function uploadImageToCloudflare(tokenId: string) {
  //fetch from cloudflare
}

function storeImageUrlFromCloudFlare(tokenId: string, cloudFlareUrl: string) {
  //store in storage
}

function saveImage(tokenId: string) {
  const image: CloudFlareUploadResponse = uploadImageToCloudflare(tokenId);
  storeImageUrlFromCloudFlare(tokenId, image.result.uploadURL);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ name: "John Doe" });
}
