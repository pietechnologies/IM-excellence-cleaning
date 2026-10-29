/* Owner-supplied service coverage. Shared by the browser and Node receivers. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IMServiceAreas = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const areas = Object.freeze({
    Tampa: [
      "33602",
      "33603",
      "33604",
      "33605",
      "33606",
      "33607",
      "33609",
      "33610",
      "33611",
      "33612",
      "33613",
      "33614",
      "33615",
      "33616",
      "33617",
      "33618",
      "33619",
      "33624",
      "33625",
      "33626",
      "33629",
      "33634",
      "33635",
      "33637",
      "33647",
    ],
    "St. Petersburg": [
      "33701",
      "33702",
      "33703",
      "33704",
      "33705",
      "33706",
      "33707",
      "33708",
      "33709",
      "33710",
      "33711",
      "33712",
      "33713",
      "33714",
      "33715",
      "33716",
    ],
    Clearwater: [
      "33755",
      "33756",
      "33759",
      "33760",
      "33761",
      "33762",
      "33763",
      "33764",
      "33765",
      "33767",
    ],
    Brandon: ["33508", "33509", "33510", "33511"],
    "Wesley Chapel": ["33543", "33544", "33545"],
    Riverview: ["33568", "33569", "33578", "33579"],
    Lutz: ["33548", "33549", "33558", "33559"],
    "New Tampa": ["33647"],
    "Temple Terrace": ["33617", "33637", "33687"],
    "Palm Harbor": ["34683", "34684", "34685"],
  });
  Object.values(areas).forEach(Object.freeze);
  const zipAreas = new Map();
  for (const [area, zips] of Object.entries(areas)) {
    for (const zip of zips)
      zipAreas.set(zip, [...(zipAreas.get(zip) || []), area]);
  }
  const normalize = (value) => (typeof value === "string" ? value.trim() : "");
  function checkZip(value) {
    const zip = normalize(value);
    if (!/^\d{5}$/.test(zip))
      return { zip, valid: false, served: false, areas: [] };
    const matches = zipAreas.get(zip) || [];
    return {
      zip,
      valid: true,
      served: matches.length > 0,
      areas: [...matches],
    };
  }
  return Object.freeze({
    areas,
    checkZip,
    zips: Object.freeze([...zipAreas.keys()]),
  });
});
