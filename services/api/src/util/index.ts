import * as L from "leaflet";
export const mappingLicenceFields = {
  licenceNumber: "licence_number",
  name: "name",
  firstName: "first_name",
  club: "club",
  dept: "dept",
  gender: "gender",
  catea: "catea",
  catevCX: "catev_cx",
  catev: "catev",
  fede: "fede::text",
  birthYear: "birth_year",
  id: "id",
  saison: "saison"
};

export const buildLatLng = coords => {
  if (coords.length < 2 || coords.length > 3) {
    // invalid point
    return null;
  } else {
    return L.latLng(
      coords[1],
      coords[0],
      coords.length === 3 ? coords[2] : undefined
    );
  }
};
