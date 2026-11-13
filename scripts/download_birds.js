const fs = require('fs');
const path = require('path');

const birds = [
  { page: 'Sri_Lanka_junglefowl', filename: 'sl_junglefowl.jpg' },
  { page: 'Sri_Lanka_blue_magpie', filename: 'sl_blue_magpie.jpg' },
  { page: 'Sri_Lanka_grey_hornbill', filename: 'sl_grey_hornbill.jpg' },
  { page: 'Sri_Lanka_hanging_parrot', filename: 'sl_hanging_parrot.jpg' },
  { page: 'Sri_Lanka_spurfowl', filename: 'sl_spurfowl.jpg' },
  { page: 'Sri_Lanka_wood_pigeon', filename: 'sl_wood_pigeon.jpg' },
  { page: 'Sri_Lanka_whistling_thrush', filename: 'sl_whistling_thrush.jpg' },
  { page: 'Sri_Lanka_white-eye', filename: 'sl_white_eye.jpg' },
  { page: 'Sri_Lanka_scimitar_babbler', filename: 'sl_scimitar_babbler.jpg' },
  { page: 'Red-faced_malkoha', filename: 'red_faced_malkoha.jpg' },
  { page: 'Serendib_scops_owl', filename: 'serendib_scops_owl.jpg' },
  { page: 'Chestnut-backed_owlet', filename: 'chestnut_backed_owlet.jpg' },
  { page: 'Layard%27s_parakeet', filename: 'layards_parakeet.jpg' },
  { page: 'Yellow-fronted_barbet', filename: 'yellow_fronted_barbet.jpg' },
  { page: 'Crimson-fronted_barbet', filename: 'crimson_fronted_barbet.jpg' },
  { page: 'Sri_Lanka_drongo', filename: 'sl_drongo.jpg' },
  { page: 'Ashy-headed_laughingthrush', filename: 'ashy_headed_laughingthrush.jpg' },
  { page: 'Orange-billed_babbler', filename: 'orange_billed_babbler.jpg' },
  { page: 'Spot-winged_thrush', filename: 'spot_winged_thrush.jpg' },
  { page: 'Black-capped_bulbul', filename: 'black_capped_bulbul.jpg' },
  { page: 'Sri_Lanka_bush_warbler', filename: 'sl_bush_warbler.jpg' },
  { page: 'White-faced_starling', filename: 'white_faced_starling.jpg' },
  { page: 'Sri_Lanka_swallow', filename: 'sl_swallow.jpg' },
  { page: 'Indian_paradise_flycatcher', filename: 'paradise_flycatcher.jpg' },
  { page: 'Indian_peafowl', filename: 'indian_peafowl.jpg' },
  { page: 'Common_kingfisher', filename: 'common_kingfisher.jpg' }
];

const destDir = path.join(__dirname, '..', 'assets', 'birds');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log(`Checking ${birds.length} bird images...`);
  for (const b of birds) {
    const destPath = path.join(destDir, b.filename);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
      console.log(`Already have ${b.filename}, skipping.`);
      continue;
    }
    await sleep(1200);
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${b.page}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FeatherFindMobileApp/1.0 (academic wildlife education; contact: ornithology@featherfind.lk)' }
      });
      if (!res.ok) {
        console.warn(`Failed summary for ${b.page}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const imageUrl = (data.thumbnail && data.thumbnail.source) || (data.originalimage && data.originalimage.source);
      if (!imageUrl) {
        console.warn(`No image found for ${b.page}`);
        continue;
      }
      console.log(`Downloading ${b.filename}...`);
      await sleep(1000);
      const imgRes = await fetch(imageUrl, {
        headers: { 'User-Agent': 'FeatherFindMobileApp/1.0 (academic wildlife education; contact: ornithology@featherfind.lk)' }
      });
      if (!imgRes.ok) {
        console.warn(`Failed image download for ${b.filename}: ${imgRes.status}`);
        continue;
      }
      const buffer = await imgRes.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(buffer));
      console.log(`✓ Saved ${b.filename} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`Error downloading ${b.filename}:`, err.message);
    }
  }
  console.log('Download complete!');
}

run();
