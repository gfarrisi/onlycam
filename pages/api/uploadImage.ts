import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";
import { z } from "zod";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const CloudFlareUploadResponseSchema = z.object({
  result: z.object({
    id: z.string(),
    uploadURL: z.string(),
  }),
  success: z.boolean(),
  errors: z.array(z.unknown()),
  messages: z.array(z.unknown()),
});

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
type ExtendedApiRequest = NextApiRequest & {
  file: MulterFile;
};

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
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

const uploadMiddleware = upload.single("image");

function multerUpload(req: any, res: any): Promise<MulterFile | null> {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(req.body);
    });
  });
}

// async function storeImageUrlFromCloudFlare(
//   tokenId: string,
//   cloudFlareUrl: string
// ) {
//   //store in storage
// }

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(
  req: ExtendedApiRequest,
  res: NextApiResponse<Data>
) {
  uploadMiddleware(req, res, async (error) => {
    if (error) {
      return res
        .status(500)
        .json({ data: { status: "error", error: "File upload failed" } });
    }
    if (req.method !== "POST") {
      return res.status(405).end();
    }
    const tokenId = "123"; //req.query.tokenId as string;
    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const API_TOKEN = process.env.CLOUDFLARE_API_KEY;
    const CLOUDFLARE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2/direct_upload`;

    console.log({ tokenId, ACCOUNT_ID, API_TOKEN, CLOUDFLARE_URL });

    console.log("body;", !!req.body, req.file);
    // Process incoming form-data
    let file: MulterFile | null;
    try {
      file = await multerUpload(req, res);
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        data: { status: "error", error: "File upload failed" },
      });
    }
    console.log({ file });

    if (!file) {
      return res.status(400).json({
        data: { status: "error", error: "No file provided" },
      });
    }

    if (!file) {
      return res.status(400).json({
        data: { status: "error", error: "File upload failed" },
      });
    }

    return res.status(500).json({
      data: { status: "error", error: "Failed to fetch Cloudflare API" },
    });
    //   try {
    //     // Step 1: Get authenticated direct upload URL from Cloudflare
    //     const cfResponse = await fetch(CLOUDFLARE_URL, {
    //       method: "POST",
    //       headers: {
    //         Authorization: `Bearer ${API_TOKEN}`,
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         requireSignedURLs: true,
    //         metadata: { data: Date.now().toString() },
    //       }),
    //     });

    //     const rawData = await cfResponse.json();
    //     const cfData = CloudFlareUploadResponseSchema.parse(rawData);

    //     if (!cfData.success) {
    //       return res.status(400).json({
    //         data: {
    //           status: "error",
    //           error: "Failed to obtain Cloudflare direct upload URL",
    //         },
    //       });
    //     }

    //     const directUploadUrl = cfData.result.uploadURL;

    //     // Step 2: Send the image to the obtained direct upload URL
    //     const formData = new FormData();
    //     formData.append("file", file.buffer, { filename: file.originalname });

    //     const uploadResponse = await fetch(directUploadUrl, {
    //       method: "PUT", // Note the PUT method here
    //       headers: {
    //         ...formData.getHeaders(),
    //       },
    //       body: formData,
    //     });

    //     if (!uploadResponse.ok) {
    //       return res.status(uploadResponse.status).json({
    //         data: {
    //           status: "error",
    //           error: "Failed to upload image to Cloudflare",
    //         },
    //       });
    //     }

    //     // storeImageUrlFromCloudFlare(tokenId, directUploadUrl);

    //     return res.status(200).json({
    //       data: {
    //         status: "success",
    //         url: directUploadUrl,
    //       },
    //     });
    //   } catch (error) {
    //     return res.status(500).json({
    //       data: { status: "error", error: "Failed to fetch Cloudflare API" },
    //     });
    //   }
    // The rest of your handler logic...
  });
}
