// TODO: Remove this file since we don't use next/image anymore
const imageDomains = [
  'assets.blubrry.com',
  'assets.fireside.fm',
  'assets.pippa.io',
  'assets.podomatic.net',
  'daringfireball.net',
  'elroy.twit.tv',
  'f.prxu.org',
  'files.soundon.fm',
  'files.thisamericanlife.org',
  'i0.wp.com',
  'i1.sndcdn.com',
  'image.simplecastcdn.com',
  'images.accessmedia.nz',
  'images.squarespace-cdn.com',
  'images.subsplash.com',
  'itstreaming.apple.com',
  'lexfridman.com',
  'media.npr.org',
  'media.wnyc.org',
  'media2.wnyc.org',
  'megaphone.imgix.net',
  'mm.aiircdn.com',
  'pbcdn1.podbean.com',
  'pod.monster',
  'podcastindex.org',
  'ssl-static.libsyn.com',
  'storage.buzzsprout.com',
  'storage.pinecast.net',
  'upload.wikimedia.org',
];

if (process.env.NODE_ENV === 'development') {
  imageDomains.push('localhost');
}

module.exports = imageDomains;
