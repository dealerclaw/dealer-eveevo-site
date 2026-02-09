/**
 * API Configuration for EVEEVO
 * Contains all external API endpoints and keys
 */

export const API_CONFIG = {
  // OneAuto API - Vehicle Data
  oneAuto: {
    baseUrl: 'https://api.oneautoapi.com/ukvehicledata/postcodelookup/v2',
    apiKey: '8ngGKR0DhU6RDpO2dnFMOlDoh8lRuneah3JQQrXb',
  },
  
  // Evolution Funding API - Finance
  evolutionFunding: {
    baseUrl: 'https://www.evolutionfunding.com/api/v3/',
    mccId: '100416',
    password: '6sU,ou6Vum*bk^Z2fWR^$wEyPe2tx;uj',
  },
  
  // Rebecca AI Chat - Custom Backend
  rebecca: {
    endpoint: 'https://eveevo-af2fa.nw.r.appspot.com/querydata',
  },
  
  // Google APIs
  google: {
    youtubeApiKey: 'AIzaSyAZ1y1z2_hW2nOXqY_uvsz6q43WuggAsA4',
    youtubePlaylistId: 'PLVaPbPusqRel0Ij3t1uYCao3se_awr7gd',
    mapsApiKey: 'AIzaSyCMnnMdFO2U5k-TO6GwpV2TrdrBAVeYpFQ',
  },
  
  // External Links
  links: {
    privacy: 'https://eveevo.uk/privacy/',
    idd: 'https://eveevo.uk/idd/',
    evolutionFundingPrivacy: 'https://www.evolutionfunding.com/public/privacy-notice/',
    evolutionFundingIDD: 'https://www.evolutionfunding.com/public/initial-disclosure-document/',
    europcar: 'https://www.europcar.co.uk/en-gb/p/europcar-partner/eveevo',
    evCharger: 'https://www.awin1.com/cread.php?awinmid=67328&awinaffid=1522671&campaign=eveevo&ued=https%3A%2F%2Fwww.clickmechanic.com%2Fev-charger-installation',
    electroverse: 'https://electroverse.octopus.energy/sign-up/magic?cid=eveevo',
    warranty: 'https://spectrumdirect.co.uk/warranty/',
  },
} as const;

export type ApiConfig = typeof API_CONFIG;
