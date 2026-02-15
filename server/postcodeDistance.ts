/**
 * Calculate approximate distance between two UK postcodes
 * Uses simplified postcode area mapping for estimation
 * In production, integrate with Google Maps Distance Matrix API or similar
 */
export function calculatePostcodeDistance(from: string, to: string): number {
  // Extract postcode areas (first 1-2 letters)
  const fromArea = from.replace(/[^A-Z]/g, '').substring(0, 2);
  const toArea = to.replace(/[^A-Z]/g, '').substring(0, 2);

  // If same area, assume short distance
  if (fromArea === toArea) {
    return Math.floor(Math.random() * 20) + 10; // 10-30 miles
  }

  // Simplified UK postcode area coordinates (approximate lat/long)
  const areaCoords: Record<string, [number, number]> = {
    'AB': [57.1, -2.1],   // Aberdeen
    'AL': [51.7, -0.3],   // St Albans
    'B': [52.5, -1.9],    // Birmingham
    'BA': [51.4, -2.4],   // Bath
    'BB': [53.7, -2.5],   // Blackburn
    'BD': [53.8, -1.8],   // Bradford
    'BH': [50.7, -1.9],   // Bournemouth
    'BL': [53.6, -2.4],   // Bolton
    'BN': [50.8, -0.1],   // Brighton
    'BR': [51.4, 0.0],    // Bromley
    'BS': [51.5, -2.6],   // Bristol
    'BT': [54.6, -5.9],   // Belfast
    'CA': [54.9, -2.9],   // Carlisle
    'CB': [52.2, 0.1],    // Cambridge
    'CF': [51.5, -3.2],   // Cardiff
    'CH': [53.2, -2.9],   // Chester
    'CM': [51.7, 0.5],    // Chelmsford
    'CO': [51.9, 0.9],    // Colchester
    'CR': [51.4, -0.1],   // Croydon
    'CT': [51.3, 1.1],    // Canterbury
    'CV': [52.4, -1.5],   // Coventry
    'CW': [53.1, -2.5],   // Crewe
    'DA': [51.4, 0.2],    // Dartford
    'DD': [56.5, -3.0],   // Dundee
    'DE': [52.9, -1.5],   // Derby
    'DH': [54.8, -1.6],   // Durham
    'DL': [54.5, -1.6],   // Darlington
    'DN': [53.6, -0.8],   // Doncaster
    'DT': [50.7, -2.4],   // Dorchester
    'DY': [52.5, -2.1],   // Dudley
    'E': [51.5, 0.0],     // East London
    'EC': [51.5, -0.1],   // East Central London
    'EH': [55.9, -3.2],   // Edinburgh
    'EN': [51.7, -0.1],   // Enfield
    'EX': [50.7, -3.5],   // Exeter
    'FK': [56.1, -3.8],   // Falkirk
    'FY': [53.8, -3.0],   // Blackpool
    'G': [55.9, -4.3],    // Glasgow
    'GL': [51.9, -2.1],   // Gloucester
    'GU': [51.2, -0.6],   // Guildford
    'HA': [51.6, -0.3],   // Harrow
    'HD': [53.6, -1.8],   // Huddersfield
    'HG': [54.0, -1.5],   // Harrogate
    'HP': [51.6, -0.7],   // Hemel Hempstead
    'HR': [52.1, -2.7],   // Hereford
    'HS': [57.5, -7.0],   // Outer Hebrides
    'HU': [53.7, -0.3],   // Hull
    'HX': [53.7, -2.0],   // Halifax
    'IG': [51.6, 0.1],    // Ilford
    'IP': [52.1, 1.2],    // Ipswich
    'IV': [57.5, -4.2],   // Inverness
    'KA': [55.6, -4.6],   // Kilmarnock
    'KT': [51.4, -0.3],   // Kingston upon Thames
    'KW': [58.4, -3.1],   // Kirkwall
    'KY': [56.2, -3.2],   // Kirkcaldy
    'L': [53.4, -3.0],    // Liverpool
    'LA': [54.0, -2.8],   // Lancaster
    'LD': [52.2, -3.4],   // Llandrindod Wells
    'LE': [52.6, -1.1],   // Leicester
    'LL': [53.2, -4.1],   // Llandudno
    'LN': [53.2, -0.5],   // Lincoln
    'LS': [53.8, -1.5],   // Leeds
    'LU': [51.9, -0.4],   // Luton
    'M': [53.5, -2.2],    // Manchester
    'ME': [51.4, 0.5],    // Medway
    'MK': [52.0, -0.8],   // Milton Keynes
    'ML': [55.8, -4.0],   // Motherwell
    'N': [51.6, -0.1],    // North London
    'NE': [55.0, -1.6],   // Newcastle
    'NG': [53.0, -1.2],   // Nottingham
    'NN': [52.2, -0.9],   // Northampton
    'NP': [51.6, -3.0],   // Newport
    'NR': [52.6, 1.3],    // Norwich
    'NW': [51.5, -0.2],   // North West London
    'OL': [53.5, -2.1],   // Oldham
    'OX': [51.8, -1.3],   // Oxford
    'PA': [55.9, -4.9],   // Paisley
    'PE': [52.6, -0.2],   // Peterborough
    'PH': [56.4, -3.4],   // Perth
    'PL': [50.4, -4.1],   // Plymouth
    'PO': [50.8, -1.1],   // Portsmouth
    'PR': [53.8, -2.7],   // Preston
    'RG': [51.5, -1.0],   // Reading
    'RH': [51.1, -0.2],   // Redhill
    'RM': [51.6, 0.2],    // Romford
    'S': [53.4, -1.5],    // Sheffield
    'SA': [51.6, -4.0],   // Swansea
    'SE': [51.5, -0.1],   // South East London
    'SG': [51.9, -0.2],   // Stevenage
    'SK': [53.4, -2.1],   // Stockport
    'SL': [51.5, -0.6],   // Slough
    'SM': [51.4, -0.2],   // Sutton
    'SN': [51.6, -1.8],   // Swindon
    'SO': [50.9, -1.4],   // Southampton
    'SP': [51.1, -1.8],   // Salisbury
    'SR': [54.9, -1.4],   // Sunderland
    'SS': [51.5, 0.7],    // Southend-on-Sea
    'ST': [53.0, -2.2],   // Stoke-on-Trent
    'SW': [51.5, -0.1],   // South West London
    'SY': [52.7, -2.8],   // Shrewsbury
    'TA': [51.0, -3.1],   // Taunton
    'TD': [55.6, -2.8],   // Galashiels
    'TF': [52.7, -2.4],   // Telford
    'TN': [51.1, 0.3],    // Tonbridge
    'TQ': [50.5, -3.5],   // Torquay
    'TR': [50.3, -5.1],   // Truro
    'TS': [54.6, -1.2],   // Cleveland
    'TW': [51.4, -0.3],   // Twickenham
    'UB': [51.5, -0.4],   // Southall
    'W': [51.5, -0.2],    // West London
    'WA': [53.4, -2.6],   // Warrington
    'WC': [51.5, -0.1],   // West Central London
    'WD': [51.7, -0.4],   // Watford
    'WF': [53.7, -1.5],   // Wakefield
    'WN': [53.5, -2.6],   // Wigan
    'WR': [52.2, -2.2],   // Worcester
    'WS': [52.6, -2.0],   // Walsall
    'WV': [52.6, -2.1],   // Wolverhampton
    'YO': [54.0, -1.1],   // York
    'ZE': [60.2, -1.1],   // Shetland
  };

  const fromCoords = areaCoords[fromArea];
  const toCoords = areaCoords[toArea];

  // If coordinates not found, return average UK distance
  if (!fromCoords || !toCoords) {
    return 150;
  }

  // Calculate Haversine distance
  const [lat1, lon1] = fromCoords;
  const [lat2, lon2] = toCoords;

  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}
