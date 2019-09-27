import {BadRequest} from "ts-httpexceptions";

/**
 * Check the email validity with this predefined pattern
 * @param email
 */
export function checkEmail(email: string) {
  const regEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!(email && regEmail.test(email))) {
    throw new BadRequest("L'adresse email est invalide");
  }
}
