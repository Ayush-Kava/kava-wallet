import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const isR2Configured = (): boolean =>
  Boolean(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME,
  );

/** R2 endpoint must be account-level only — bucket name belongs in R2_BUCKET_NAME. */
const getR2Endpoint = (): string => {
  const bucket = process.env.R2_BUCKET_NAME?.replace(/\/$/, '');
  let endpoint = process.env.R2_ENDPOINT!.replace(/\/$/, '');

  if (bucket && endpoint.endsWith(`/${bucket}`)) {
    endpoint = endpoint.slice(0, -(`/${bucket}`.length));
  }

  return endpoint;
};

const getR2Client = (): S3Client =>
  new S3Client({
    region: 'auto',
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // Browser PUT uploads cannot send SDK checksum headers; including them in the
    // presigned URL causes R2 to return 403 Forbidden.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

export const buildDocumentKey = (userId: string, filename: string): string => {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `documents/${userId}/${crypto.randomUUID()}-${safeName}`;
};

const buildPublicUrl = (key: string): string => {
  const publicBase = process.env.R2_PUBLIC_URL || process.env.R2_ENDPOINT!;
  return `${publicBase.replace(/\/$/, '')}/${key}`;
};

export const uploadDocumentToR2 = async (
  userId: string,
  filename: string,
  contentType: string,
  body: Buffer | Uint8Array,
): Promise<{ publicUrl: string; key: string }> => {
  const key = buildDocumentKey(userId, filename);

  if (!isR2Configured()) {
    return { publicUrl: `/uploads/${key}`, key };
  }

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { publicUrl: buildPublicUrl(key), key };
};

export const generatePresignedUploadUrl = async (
  userId: string,
  filename: string,
  _contentType?: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> => {
  const key = buildDocumentKey(userId, filename);

  if (!isR2Configured()) {
    const publicUrl = `/uploads/${key}`;
    return { uploadUrl: publicUrl, publicUrl, key };
  }

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = buildPublicUrl(key);
  return { uploadUrl, publicUrl, key };
};
