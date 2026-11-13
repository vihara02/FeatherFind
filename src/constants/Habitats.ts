export interface HabitatInfo {
  id: string;
  name: string;
  sinhalaName: string;
  description: string;
  keyLocations: string[];
  icon: string;
  targetSpecies: string[];
}

export const SRI_LANKA_HABITATS: HabitatInfo[] = [
  {
    id: 'forest',
    name: 'Wet Zone Rainforests',
    sinhalaName: 'තෙත් කලාපීය වැසි වනාන්තර',
    description: 'Dense evergreen low-to-mid elevation rainforests holding the highest concentration of Sri Lanka’s endemic avifauna. Home to mixed-species bird feeding flocks.',
    keyLocations: ['Sinharaja Forest Reserve', 'Kitulgala Forest Reserve', 'Kanneliya-Dediyagala-Nakiyadeniya (KDN)', 'Peak Wilderness'],
    icon: 'leaf',
    targetSpecies: ['Sri Lanka Blue Magpie', 'Red-faced Malkoha', 'Ashy-headed Laughingthrush', 'Serendib Scops Owl', 'White-faced Starling']
  },
  {
    id: 'mountain',
    name: 'Montane Cloud Forests & Grasslands',
    sinhalaName: 'කඳුකර වලාකුළු වනාන්තර සහ තණබිම්',
    description: 'High-altitude stunted montane forests, dwarf rhododendron stands, and wet patana grasslands above 1,500m characterized by mist and cool temperatures.',
    keyLocations: ['Horton Plains National Park', 'Hakgala Strict Natural Reserve', 'Pidurutalagala', 'Knuckles Mountain Range'],
    icon: 'image-filter-hdr',
    targetSpecies: ['Sri Lanka Whistling Thrush', 'Sri Lanka White-eye', 'Sri Lanka Wood Pigeon', 'Sri Lanka Bush Warbler', 'Dull-blue Flycatcher']
  },
  {
    id: 'wetland',
    name: 'Wetlands, Tanks & Mangroves',
    sinhalaName: 'තෙත්බිම්, වැව් සහ කඩොලාන',
    description: 'Ancient man-made irrigation reservoirs (wewas), coastal lagoons, mudflats, and mangrove estuaries hosting millions of resident and wintering migratory waterbirds.',
    keyLocations: ['Bundala National Park (Ramsar)', 'Anawilundawa Sanctuary', 'Kumana National Park', 'Kalametiya Bird Sanctuary'],
    icon: 'water',
    targetSpecies: ['Black-headed Ibis', 'Painted Stork', 'Lesser Whistling Duck', 'Pheasant-tailed Jacana', 'Spot-billed Pelican']
  },
  {
    id: 'grassland',
    name: 'Dry Zone Woodlands & Scrublands',
    sinhalaName: 'වියළි කලාපීය ලඳු සහ කටු පඳුරු වනාන්තර',
    description: 'Dry evergreen forests, thorny scrub jungle, and open parklands interspersed with riverine gallery forests along major rivers.',
    keyLocations: ['Wilpattu National Park', 'Yala (Ruhuna) National Park', 'Wasgamuwa National Park', 'Udawalawe National Park'],
    icon: 'tree',
    targetSpecies: ['Sri Lanka Junglefowl', 'Sri Lanka Grey Hornbill', 'Indian Peafowl', 'Crested Hawk-Eagle', 'Malabar Pied Hornbill']
  },
  {
    id: 'garden',
    name: 'Home Gardens & Plantations',
    sinhalaName: 'ගෙවතු සහ වගාබිම්',
    description: 'Traditional multi-layered Kandyan home gardens, village groves, tea estates, and coconut palms rich in fruit and flowering nectar plants.',
    keyLocations: ['Kandy suburban hills', 'Gampaha & Kalutara gardens', 'Ella & Badulla hillsides', 'Kurunegala coconut triangle'],
    icon: 'home',
    targetSpecies: ['Sri Lanka Hanging Parrot', 'Yellow-fronted Barbet', 'Brown-headed Barbet', 'Asian Paradise Flycatcher', 'Purple Sunbird']
  },
  {
    id: 'coastal',
    name: 'Coastal Shores & Estuaries',
    sinhalaName: 'වෙරළබඩ සහ මෝය කලාප',
    description: 'Sandy beaches, salt pans, rocky headlands, and coastal spits serving as vital resting stations for international migratory flyway birds.',
    keyLocations: ['Mannar Island & Vankalai Sanctuary', 'Jaffna Kayts & Mandaitivu', 'Hambantota Salterns', 'Kalpitiya Peninsula'],
    icon: 'waves',
    targetSpecies: ['Crab Plover', 'Gull-billed Tern', 'Greater Flamingo', 'Bar-tailed Godwit', 'Pacific Golden Plover']
  }
];
