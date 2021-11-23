import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  let image;

  try {
    if (typeof req.query.url === 'string') {
      image = await fetch(req.query.url);
    }
  } catch (err) {
    res.status(404).send(undefined);

    return;
  }

  res
    .setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    .status(200)
    .send(image?.body);
};

export default handler;
