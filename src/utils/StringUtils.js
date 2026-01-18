export function validateInputText(input) {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    if (!/^[<>"&]+$/.test(input[i])) {
      output = output + input[i].toUpperCase();
    }
  }
  return output;
}

export function validateInputTextNoUpperCase(input) {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    if (!/^[<>"&]+$/.test(input[i])) {
      output = output + input[i];
    }
  }
  return output;
}

export function validatePhoneNumberWithCode(input) {
  let output = "";
  var phoneRegex = /^\+[0-9]{0,14}$/;
  for (let i = 0; i < input.length; i++) {
    if (phoneRegex.test(output + input[i])) {
      output = output + input[i];
    }
  }
  return output;
}

export function validatePhoneNumber(input) {
  let output = "";
  var phoneRegex = /^[1-9][0-9]{0,13}$/;

  for (let i = 0; i < input.length; i++) {
    if (phoneRegex.test(output + input[i])) {
      output = output + input[i];
    }
  }
  return output;
}

export function toNormalClass(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const getAllCountryCodes = () => [
  { code: "+1" }, // United States, Canada, etc.
  { code: "+7" }, // Russia, Kazakhstan
  { code: "+20" }, // Egypt
  { code: "+27" }, // South Africa
  { code: "+30" }, // Greece
  { code: "+31" }, // Netherlands
  { code: "+32" }, // Belgium
  { code: "+33" }, // France
  { code: "+34" }, // Spain
  { code: "+36" }, // Hungary
  { code: "+39" }, // Italy, Vatican City (shared code)
  { code: "+40" }, // Romania
  { code: "+41" }, // Switzerland
  { code: "+43" }, // Austria
  { code: "+44" }, // United Kingdom
  { code: "+45" }, // Denmark
  { code: "+46" }, // Sweden
  { code: "+47" }, // Norway
  { code: "+48" }, // Poland
  { code: "+49" }, // Germany
  { code: "+51" }, // Peru
  { code: "+52" }, // Mexico
  { code: "+53" }, // Cuba
  { code: "+54" }, // Argentina
  { code: "+55" }, // Brazil
  { code: "+56" }, // Chile
  { code: "+57" }, // Colombia
  { code: "+58" }, // Venezuela
  { code: "+60" }, // Malaysia
  { code: "+61" }, // Australia, Christmas Island
  { code: "+62" }, // Indonesia
  { code: "+63" }, // Philippines
  { code: "+64" }, // New Zealand
  { code: "+65" }, // Singapore
  { code: "+66" }, // Thailand
  { code: "+81" }, // Japan
  { code: "+82" }, // South Korea
  { code: "+84" }, // Vietnam
  { code: "+86" }, // China
  { code: "+90" }, // Turkey
  { code: "+91" }, // India
  { code: "+92" }, // Pakistan
  { code: "+93" }, // Afghanistan
  { code: "+94" }, // Sri Lanka
  { code: "+95" }, // Myanmar
  { code: "+98" }, // Iran
  { code: "+211" }, // South Sudan
  { code: "+212" }, // Morocco
  { code: "+213" }, // Algeria
  { code: "+216" }, // Tunisia
  { code: "+218" }, // Libya
  { code: "+220" }, // Gambia
  { code: "+221" }, // Senegal
  { code: "+222" }, // Mauritania
  { code: "+223" }, // Mali
  { code: "+224" }, // Guinea
  { code: "+225" }, // Côte d'Ivoire
  { code: "+226" }, // Burkina Faso
  { code: "+227" }, // Niger
  { code: "+228" }, // Togo
  { code: "+229" }, // Benin
  { code: "+230" }, // Mauritius
  { code: "+231" }, // Liberia
  { code: "+232" }, // Sierra Leone
  { code: "+233" }, // Ghana
  { code: "+234" }, // Nigeria
  { code: "+235" }, // Chad
  { code: "+236" }, // Central African Republic
  { code: "+237" }, // Cameroon
  { code: "+238" }, // Cape Verde
  { code: "+239" }, // São Tomé and Príncipe
  { code: "+240" }, // Equatorial Guinea
  { code: "+241" }, // Gabon
  { code: "+242" }, // Congo
  { code: "+243" }, // DR Congo
  { code: "+244" }, // Angola
  { code: "+245" }, // Guinea-Bissau
  { code: "+246" }, // British Indian Ocean Territory
  { code: "+247" }, // Ascension Island
  { code: "+248" }, // Seychelles
  { code: "+249" }, // Sudan
  { code: "+250" }, // Rwanda
  { code: "+251" }, // Ethiopia
  { code: "+252" }, // Somalia
  { code: "+253" }, // Djibouti
  { code: "+254" }, // Kenya
  { code: "+255" }, // Tanzania
  { code: "+256" }, // Uganda
  { code: "+257" }, // Burundi
  { code: "+258" }, // Mozambique
  { code: "+260" }, // Zambia
  { code: "+261" }, // Madagascar
  { code: "+262" }, // Réunion, Mayotte
  { code: "+263" }, // Zimbabwe
  { code: "+264" }, // Namibia
  { code: "+265" }, // Malawi
  { code: "+266" }, // Lesotho
  { code: "+267" }, // Botswana
  { code: "+268" }, // Eswatini
  { code: "+269" }, // Comoros
  { code: "+290" }, // Saint Helena
  { code: "+291" }, // Eritrea
  { code: "+297" }, // Aruba
  { code: "+298" }, // Faroe Islands
  { code: "+299" }, // Greenland
  { code: "+350" }, // Gibraltar
  { code: "+351" }, // Portugal
  { code: "+352" }, // Luxembourg
  { code: "+353" }, // Ireland
  { code: "+354" }, // Iceland
  { code: "+355" }, // Albania
  { code: "+356" }, // Malta
  { code: "+357" }, // Cyprus
  { code: "+358" }, // Finland
  { code: "+359" }, // Bulgaria
  { code: "+370" }, // Lithuania
  { code: "+371" }, // Latvia
  { code: "+372" }, // Estonia
  { code: "+373" }, // Moldova
  { code: "+374" }, // Armenia
  { code: "+375" }, // Belarus
  { code: "+376" }, // Andorra
  { code: "+377" }, // Monaco
  { code: "+378" }, // San Marino
  { code: "+379" }, // Vatican City
  { code: "+380" }, // Ukraine
  { code: "+381" }, // Serbia
  { code: "+382" }, // Montenegro
  { code: "+383" }, // Kosovo
  { code: "+385" }, // Croatia
  { code: "+386" }, // Slovenia
  { code: "+387" }, // Bosnia and Herzegovina
  { code: "+389" }, // North Macedonia
  { code: "+420" }, // Czech Republic
  { code: "+421" }, // Slovakia
  { code: "+423" }, // Liechtenstein
  { code: "+500" }, // Falkland Islands
  { code: "+501" }, // Belize
  { code: "+502" }, // Guatemala
  { code: "+503" }, // El Salvador
  { code: "+504" }, // Honduras
  { code: "+505" }, // Nicaragua
  { code: "+506" }, // Costa Rica
  { code: "+507" }, // Panama
  { code: "+508" }, // Saint Pierre and Miquelon
  { code: "+509" }, // Haiti
  { code: "+590" }, // Guadeloupe, Saint Barthélemy, Saint Martin
  { code: "+591" }, // Bolivia
  { code: "+592" }, // Guyana
  { code: "+593" }, // Ecuador
  { code: "+594" }, // French Guiana
  { code: "+595" }, // Paraguay
  { code: "+596" }, // Martinique
  { code: "+597" }, // Suriname
  { code: "+598" }, // Uruguay
  { code: "+599" }, // Curaçao, Bonaire, Sint Eustatius and Saba
  { code: "+670" }, // East Timor
  { code: "+672" }, // Antarctica, Norfolk Island
  { code: "+673" }, // Brunei
  { code: "+674" }, // Nauru
  { code: "+675" }, // Papua New Guinea
  { code: "+676" }, // Tonga
  { code: "+677" }, // Solomon Islands
  { code: "+678" }, // Vanuatu
  { code: "+679" }, // Fiji
  { code: "+680" }, // Palau
  { code: "+681" }, // Wallis and Futuna
  { code: "+682" }, // Cook Islands
  { code: "+683" }, // Niue
  { code: "+685" }, // Samoa
  { code: "+686" }, // Kiribati
  { code: "+687" }, // New Caledonia
  { code: "+688" }, // Tuvalu
  { code: "+689" }, // French Polynesia
  { code: "+690" }, // Tokelau
  { code: "+691" }, // Micronesia
  { code: "+692" }, // Marshall Islands
  { code: "+850" }, // North Korea
  { code: "+852" }, // Hong Kong
  { code: "+853" }, // Macau
  { code: "+855" }, // Cambodia
  { code: "+856" }, // Laos
  { code: "+880" }, // Bangladesh
  { code: "+886" }, // Taiwan
  { code: "+960" }, // Maldives
  { code: "+961" }, // Lebanon
  { code: "+962" }, // Jordan
  { code: "+963" }, // Syria
  { code: "+964" }, // Iraq
  { code: "+965" }, // Kuwait
  { code: "+966" }, // Saudi Arabia
  { code: "+967" }, // Yemen
  { code: "+968" }, // Oman
  { code: "+970" }, // Palestinian territories
  { code: "+971" }, // United Arab Emirates
  { code: "+972" }, // Israel
  { code: "+973" }, // Bahrain
  { code: "+974" }, // Qatar
  { code: "+975" }, // Bhutan
  { code: "+976" }, // Mongolia
  { code: "+977" }, // Nepal
  { code: "+992" }, // Tajikistan
  { code: "+993" }, // Turkmenistan
  { code: "+994" }, // Azerbaijan
  { code: "+995" }, // Georgia
  { code: "+996" }, // Kyrgyzstan
  { code: "+998" }, // Uzbekistan
  { code: "+1242" }, // Bahamas
  { code: "+1246" }, // Barbados
  { code: "+1264" }, // Anguilla
  { code: "+1268" }, // Antigua and Barbuda
  { code: "+1284" }, // British Virgin Islands
  { code: "+1340" }, // U.S. Virgin Islands
  { code: "+1345" }, // Cayman Islands
  { code: "+1441" }, // Bermuda
  { code: "+1473" }, // Grenada
  { code: "+1649" }, // Turks and Caicos Islands
  { code: "+1664" }, // Montserrat
  { code: "+1670" }, // Northern Mariana Islands
  { code: "+1671" }, // Guam
  { code: "+1684" }, // American Samoa
  { code: "+1721" }, // Sint Maarten
  { code: "+1758" }, // Saint Lucia
  { code: "+1767" }, // Dominica
  { code: "+1784" }, // Saint Vincent and the Grenadines
  { code: "+1787" }, // Puerto Rico
  { code: "+1809" }, // Dominican Republic
  { code: "+1868" }, // Trinidad and Tobago
  { code: "+1869" }, // Saint Kitts and Nevis
  { code: "+1876" }, // Jamaica
];
