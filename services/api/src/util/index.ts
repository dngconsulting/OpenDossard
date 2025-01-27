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
  saison: "saison",
  comment: "comment"
};

export const stripBOM = buffer => {
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf)
    return buffer.slice(3);
  return buffer;
};
export const getCateaFromBirthYear = (birthyear: string, gender: string) => {
  const age = new Date().getFullYear() - parseInt(birthyear);
  let catea = "";
  if (gender === "F") {
    catea += "F";
  }
  if (age >= 5 && age <= 6) {
    catea += "MO";
  } else if (age >= 7 && age <= 8) {
    catea += "PO";
  } else if (age >= 9 && age <= 10) {
    catea += "PU";
  } else if (age >= 11 && age <= 12) {
    catea += "B";
  } else if (age >= 13 && age <= 14) {
    catea += "M";
  } else if (age >= 15 && age <= 16) {
    catea += "C";
  } else if (age >= 17 && age <= 18) {
    catea += "J";
  } else if (age >= 19 && age <= 22) {
    catea += "E";
  } else if (age >= 23 && age <= 39) {
    catea += "S";
  } else if (age >= 40 && age <= 49) {
    catea += "V";
  } else if (age >= 50 && age <= 59) {
    catea += "SV";
  } else if (age >= 60 && age <= 69) {
    catea += "A";
  } else if (age >= 70) {
    catea += "SA";
  }
  return catea;
};

export const getGenreFromCsvElicence = (genre: string) => {
  if (genre === "M") return "H";
  if (genre === "F") return genre;
  if (genre === "Mme") return "F";
  return undefined;
};
/**
 * Pour l'instant OD ne traite que les département France Métropole
 * les depts en 3 chiffres ne sont pas supportés
 * @param departement
 */
export const formatDepartement = (departement: string) => {
  // Convertir le département en chaîne de caractères au cas où c'est un nombre
  let depStr = String(Number(departement));
  // Ajouter un 0 devant si nécessaire pour avoir 2 caractères
  return depStr.padStart(2, "0");
};
