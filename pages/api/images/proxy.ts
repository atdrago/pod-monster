import { NextApiHandler } from 'next';

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

  res
    .setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    .status(200)
    .send(image.body);
};

export default handler;
