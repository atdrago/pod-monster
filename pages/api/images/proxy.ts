import { NextApiHandler } from 'next';
import sharp from 'sharp';

const handler: NextApiHandler = async (req, res) => {
  let image;

  try {
    if (typeof req.query.url === 'string') {
      image = await fetch(req.query.url);
    }
  } catch (err) {
    res.status(400).send({ error: 'Could not fetch image.' });

    return;
  }

  if (!image || image?.status !== 200) {
    res.status(400).send({ error: 'Could not fetch image.' });

    return;
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  // Resize image to 512x512 to ensure we stay under the Next 4MB limit
  const resultBuffer = await sharp(buffer)
    .resize(512, 512, { fit: sharp.fit.contain })
    .toBuffer();

  res
    .setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    .status(200)
    .send(resultBuffer);
};

export default handler;
