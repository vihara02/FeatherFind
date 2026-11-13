import { ImageSourcePropType } from 'react-native';

export const BIRD_LOCAL_IMAGES: Record<string, ImageSourcePropType> = {
  sl_junglefowl: require('../../assets/birds/sl_junglefowl.jpg'),
  sl_blue_magpie: require('../../assets/birds/sl_blue_magpie.jpg'),
  sl_grey_hornbill: require('../../assets/birds/sl_grey_hornbill.jpg'),
  sl_hanging_parrot: require('../../assets/birds/sl_hanging_parrot.jpg'),
  sl_spurfowl: require('../../assets/birds/sl_spurfowl.jpg'),
  sl_wood_pigeon: require('../../assets/birds/sl_wood_pigeon.jpg'),
  sl_whistling_thrush: require('../../assets/birds/sl_whistling_thrush.jpg'),
  sl_white_eye: require('../../assets/birds/sl_white_eye.jpg'),
  sl_scimitar_babbler: require('../../assets/birds/sl_scimitar_babbler.jpg'),
  red_faced_malkoha: require('../../assets/birds/red_faced_malkoha.jpg'),
  serendib_scops_owl: require('../../assets/birds/serendib_scops_owl.jpg'),
  chestnut_backed_owlet: require('../../assets/birds/chestnut_backed_owlet.jpg'),
  layards_parakeet: require('../../assets/birds/layards_parakeet.jpg'),
  yellow_fronted_barbet: require('../../assets/birds/yellow_fronted_barbet.jpg'),
  crimson_fronted_barbet: require('../../assets/birds/crimson_fronted_barbet.jpg'),
  sl_drongo: require('../../assets/birds/sl_drongo.jpg'),
  ashy_headed_laughingthrush: require('../../assets/birds/ashy_headed_laughingthrush.jpg'),
  orange_billed_babbler: require('../../assets/birds/orange_billed_babbler.jpg'),
  spot_winged_thrush: require('../../assets/birds/spot_winged_thrush.jpg'),
  black_capped_bulbul: require('../../assets/birds/black_capped_bulbul.jpg'),
  sl_bush_warbler: require('../../assets/birds/sl_bush_warbler.jpg'),
  white_faced_starling: require('../../assets/birds/white_faced_starling.jpg'),
  sl_swallow: require('../../assets/birds/sl_swallow.jpg'),
  paradise_flycatcher: require('../../assets/birds/paradise_flycatcher.jpg'),
  indian_peafowl: require('../../assets/birds/indian_peafowl.jpg'),
  common_kingfisher: require('../../assets/birds/common_kingfisher.jpg'),
};

export const getBirdImage = (key: string): ImageSourcePropType | undefined => {
  return BIRD_LOCAL_IMAGES[key];
};
