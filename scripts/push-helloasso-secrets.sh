#!/usr/bin/env bash
# Pousse les 11 secrets HelloAsso vers un environnement GitHub Actions
# (TEST / PREPROD / PROD).
#
# Usage :
#   ./scripts/push-helloasso-secrets.sh TEST
#   ./scripts/push-helloasso-secrets.sh PREPROD
#   ./scripts/push-helloasso-secrets.sh PROD
#
# Source des valeurs :
#   ~/.opendossard-secrets/helloasso.<ENV>.env
#
# Ce fichier est volontairement HORS du repo pour qu'il ne puisse jamais
# être committé. Format simple KEY=VALUE, une ligne par secret, pas de
# guillemets, pas d'expansion shell, pas d'export. Lignes vides et
# lignes commençant par '#' ignorées.
#
# Le script :
#   - ne logue JAMAIS les valeurs (uniquement les noms de clés)
#   - passe chaque valeur via stdin à `gh secret set --body-file -`
#     (la valeur n'apparaît pas dans la ligne de commande ni dans la
#     table des processus)
#   - refuse de tourner si une clé est manquante ou vide
#
# Pré-requis : `gh auth status` OK avec un compte qui a accès au repo
# dngconsulting/OpenDossard et le droit de modifier les secrets de l'env.

set -euo pipefail

REPO="dngconsulting/OpenDossard"

KEYS=(
  HELLOASSO_CLIENT_ID
  HELLOASSO_CLIENT_SECRET
  HELLOASSO_OAUTH_BASE_URL
  HELLOASSO_API_BASE_URL
  HELLOASSO_REDIRECT_URI
  HELLOASSO_FRONT_RESULT_URL
  HELLOASSO_TOKEN_ENCRYPTION_KEY
  HELLOASSO_WEBHOOK_SIGNATURE_KEY
  HELLOASSO_PAYMENT_RETURN_URL_SUCCESS
  HELLOASSO_PAYMENT_RETURN_URL_ERROR
  HELLOASSO_PAYMENT_RETURN_URL_CANCELLED
)

ENV_NAME="${1:-}"
case "${ENV_NAME}" in
  TEST|PREPROD|PROD) ;;
  *)
    echo "Usage: $0 <TEST|PREPROD|PROD>" >&2
    exit 1
    ;;
esac

SECRETS_DIR="${HOME}/.opendossard-secrets"
SECRETS_FILE="${SECRETS_DIR}/helloasso.${ENV_NAME}.env"

if [[ ! -f "${SECRETS_FILE}" ]]; then
  echo "Fichier introuvable : ${SECRETS_FILE}" >&2
  echo "" >&2
  echo "Créer le répertoire puis remplir le template :" >&2
  echo "" >&2
  echo "  mkdir -p ${SECRETS_DIR} && chmod 700 ${SECRETS_DIR}" >&2
  echo "  touch ${SECRETS_FILE} && chmod 600 ${SECRETS_FILE}" >&2
  echo "  cat > ${SECRETS_FILE} <<'EOF'" >&2
  for k in "${KEYS[@]}"; do
    echo "${k}=" >&2
  done
  echo "EOF" >&2
  exit 1
fi

# Vérifie les permissions du fichier (refuse si lisible par d'autres users)
perms="$(stat -f '%Lp' "${SECRETS_FILE}" 2>/dev/null || stat -c '%a' "${SECRETS_FILE}")"
if [[ "${perms}" != "600" && "${perms}" != "400" ]]; then
  echo "Attention : ${SECRETS_FILE} a les permissions ${perms} (devrait être 600)." >&2
  echo "Corriger :  chmod 600 ${SECRETS_FILE}" >&2
  exit 1
fi

# Parsing KEY=VALUE — premier '=' sépare clé et valeur, le reste est valeur brute.
# Pas d'eval, pas de source : un caractère $ ou ` dans une valeur ne sera pas interprété.
# Stockage en 2 tableaux parallèles (compatible bash 3.2 macOS, pas d'assoc array).
FOUND_KEYS=()
FOUND_VALS=()
while IFS= read -r line || [[ -n "${line}" ]]; do
  # strip CR éventuel (fichier édité sous Windows)
  line="${line%$'\r'}"
  # skip lignes vides + commentaires
  [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]] && continue
  if [[ "${line}" != *=* ]]; then
    echo "Ligne invalide (pas de '=') : ${line}" >&2
    exit 1
  fi
  key="${line%%=*}"
  val="${line#*=}"
  # trim espaces autour de la clé uniquement (la valeur reste intacte)
  key="${key#"${key%%[![:space:]]*}"}"
  key="${key%"${key##*[![:space:]]}"}"
  FOUND_KEYS+=("${key}")
  FOUND_VALS+=("${val}")
done < "${SECRETS_FILE}"

# Helper : récupère la valeur associée à une clé via lookup linéaire.
# Imprime la valeur sur stdout (peut être vide), exit code 0 si trouvée, 1 sinon.
get_val() {
  local target="$1"
  local i
  for i in "${!FOUND_KEYS[@]}"; do
    if [[ "${FOUND_KEYS[$i]}" == "${target}" ]]; then
      printf '%s' "${FOUND_VALS[$i]}"
      return 0
    fi
  done
  return 1
}

# Vérifie que toutes les clés attendues sont présentes & non vides.
missing=()
for k in "${KEYS[@]}"; do
  v="$(get_val "$k" || true)"
  if [[ -z "${v}" ]]; then
    missing+=("$k")
  fi
done
if (( ${#missing[@]} > 0 )); then
  echo "Clés manquantes ou vides dans ${SECRETS_FILE} :" >&2
  for k in "${missing[@]}"; do
    echo "  - ${k}" >&2
  done
  exit 1
fi

# Vérifie qu'aucune clé inattendue ne traîne (utile pour repérer une faute de frappe)
unexpected=()
for k in "${FOUND_KEYS[@]}"; do
  found=0
  for expected in "${KEYS[@]}"; do
    [[ "${k}" == "${expected}" ]] && { found=1; break; }
  done
  (( found == 0 )) && unexpected+=("${k}")
done
if (( ${#unexpected[@]} > 0 )); then
  echo "Clés inconnues dans ${SECRETS_FILE} (faute de frappe ?) :" >&2
  for k in "${unexpected[@]}"; do
    echo "  - ${k}" >&2
  done
  exit 1
fi

# Vérifie que gh est dispo et authentifié.
if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI introuvable. Installer : brew install gh" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "gh non authentifié. Lancer : gh auth login" >&2
  exit 1
fi

echo "→ Cible : ${REPO}  env=${ENV_NAME}  (${#KEYS[@]} secrets)"
echo ""

for k in "${KEYS[@]}"; do
  # get_val imprime la valeur sur stdout sans newline. Pipe direct → stdin de gh
  # (gh secret set lit stdin par défaut quand --body n'est pas passé).
  # La valeur ne transite jamais par argv (invisible dans `ps`).
  get_val "$k" | gh secret set "${k}" \
    --repo "${REPO}" \
    --env "${ENV_NAME}" >/dev/null
  echo "  ✓ ${k}"
done

echo ""
echo "Terminé. Vérification :"
echo "  gh secret list --repo ${REPO} --env ${ENV_NAME} | grep HELLOASSO"
