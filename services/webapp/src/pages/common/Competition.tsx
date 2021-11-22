import { apiCompetitions } from "../../util/api";
import { CompetitionCreate } from "../../sdk";
import _ from "lodash";

const isCompetitionValid = (competition: CompetitionCreate): boolean => {
  return (
    !!competition.name &&
    !!competition?.eventDate &&
    !!competition?.zipCode &&
    !!competition?.races
  );
};
export const saveCompetition = async ({
  competition,
  setIsSubmited,
  setIsLoading,
  setNewCompetition,
  setNotification
}: {
  setNotification: any;
  competition: CompetitionCreate;
  setIsSubmited: any;
  setIsLoading: any;
  setNewCompetition: any;
}): Promise<any> => {
  setIsSubmited(true);
  if (competition !== null) {
    try {
      setIsLoading(true);
      if (isCompetitionValid(competition)) {
        try {
          const updatedCompetition = await apiCompetitions.saveCompetition({
            competitionCreate: competition
          });
          setNewCompetition(updatedCompetition);
          setNotification({
            message: `L'épreuve ${competition.name} a bien été modifiée`,
            type: "success",
            open: true
          });
        } catch (err) {
          let er = { message: "" };
          if (err.json) er = await err.json();
          setNotification({
            message: `L'épreuve ${competition.name} n'a pas pu être créée ou modifiée ${er?.message}`,
            type: "error",
            open: true
          });
        }
      } else {
        setNotification({
          message:
            "Veuillez remplir l'ensemble des champs obligatoires de chaque onglet.",
          type: "error",
          open: true
        });
      }
    } finally {
      setIsLoading(false);
    }
  }
};
