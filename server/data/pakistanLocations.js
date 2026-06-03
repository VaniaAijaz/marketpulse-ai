/**
 * Pakistan cities + areas with default coordinates (shop pin starting point).
 */
module.exports = {
  karachi: {
    label: 'Karachi',
    center: { lat: 24.8607, lng: 67.0011 },
    areas: [
      { id: 'saddar', name: 'Saddar', lat: 24.8546, lng: 67.0202 },
      { id: 'gulshan', name: 'Gulshan-e-Iqbal', lat: 24.9142, lng: 67.0822 },
      { id: 'clifton', name: 'Clifton', lat: 24.8138, lng: 67.0299 },
      { id: 'north-nazimabad', name: 'North Nazimabad', lat: 24.9361, lng: 67.0369 },
      { id: 'korangi', name: 'Korangi', lat: 24.8185, lng: 67.1396 },
      { id: 'malir', name: 'Malir', lat: 24.8924, lng: 67.1981 },
      { id: 'gulistan-e-jauhar', name: 'Gulistan-e-Jauhar', lat: 24.9038, lng: 67.1146 },
      { id: 'defence', name: 'DHA / Defence', lat: 24.7948, lng: 67.0588 },
    ],
  },
  lahore: {
    label: 'Lahore',
    center: { lat: 31.5204, lng: 74.3587 },
    areas: [
      { id: 'gulberg', name: 'Gulberg', lat: 31.5204, lng: 74.3587 },
      { id: 'model-town', name: 'Model Town', lat: 31.4836, lng: 74.3256 },
      { id: 'johar-town', name: 'Johar Town', lat: 31.4697, lng: 74.2728 },
      { id: 'dha-lahore', name: 'DHA Lahore', lat: 31.4675, lng: 74.4111 },
      { id: 'wapda-town', name: 'Wapda Town', lat: 31.4422, lng: 74.2676 },
      { id: 'ichra', name: 'Ichhra', lat: 31.5336, lng: 74.3185 },
    ],
  },
  islamabad: {
    label: 'Islamabad',
    center: { lat: 33.6844, lng: 73.0479 },
    areas: [
      { id: 'g8', name: 'G-8', lat: 33.6973, lng: 73.0515 },
      { id: 'g9', name: 'G-9', lat: 33.6996, lng: 73.0362 },
      { id: 'f10', name: 'F-10', lat: 33.6919, lng: 73.0145 },
      { id: 'blue-area', name: 'Blue Area', lat: 33.7104, lng: 73.0587 },
      { id: 'rawalpindi-saddar', name: 'Rawalpindi Saddar', lat: 33.5973, lng: 73.0479 },
      { id: 'bahria-town', name: 'Bahria Town Phase 7', lat: 33.5219, lng: 73.1187 },
    ],
  },
  rawalpindi: {
    label: 'Rawalpindi',
    center: { lat: 33.5651, lng: 73.0169 },
    areas: [
      { id: 'saddar-rwp', name: 'Saddar', lat: 33.5973, lng: 73.0479 },
      { id: 'satellite-town', name: 'Satellite Town', lat: 33.6374, lng: 73.0622 },
      { id: 'chaklala', name: 'Chaklala', lat: 33.6007, lng: 73.1015 },
    ],
  },
  faisalabad: {
    label: 'Faisalabad',
    center: { lat: 31.4504, lng: 73.135 },
    areas: [
      { id: 'd-ground', name: 'D Ground', lat: 31.4187, lng: 73.0791 },
      { id: 'kohinoor', name: 'Kohinoor City', lat: 31.4365, lng: 73.1182 },
    ],
  },
  multan: {
    label: 'Multan',
    center: { lat: 30.1575, lng: 71.5249 },
    areas: [
      { id: 'gulgasht', name: 'Gulgasht Colony', lat: 30.1833, lng: 71.45 },
      { id: 'cantt', name: 'Cantt', lat: 30.196, lng: 71.4785 },
    ],
  },
  peshawar: {
    label: 'Peshawar',
    center: { lat: 34.0151, lng: 71.5249 },
    areas: [
      { id: 'saddar-pesh', name: 'Saddar', lat: 34.0089, lng: 71.5785 },
      { id: 'university-town', name: 'University Town', lat: 33.99, lng: 71.49 },
    ],
  },
};
