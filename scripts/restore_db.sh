#!/bin/bash
set -euo pipefail

# Configuration
FTP_SERVER="dedibackup-dc3.online.net"
FTP_PATH="/opendossard/archives"
DOCKER_CONTAINER_NAME="dossarddb"
DB_NAME="${POSTGRES_DB:-dossarddb}"
DB_USER="${POSTGRES_USER:-dossarduser}"

TMP_DB="${DB_NAME}_restore_tmp"   # base temporaire de restauration
OLD_DB="${DB_NAME}_old_swap"      # ancienne base mise de côté pendant le swap

TMP_DUMP=""
TMP_DB_CREATED=0

# Helpers psql / docker -----------------------------------------------------
psql_admin() {  # exécute du SQL en tant qu'admin sur la base "postgres"
    docker exec -i "$DOCKER_CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d postgres "$@"
}
terminate_connections() {  # coupe les connexions actives sur la base $1
    docker exec -i "$DOCKER_CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$1' AND pid <> pg_backend_pid();" > /dev/null
}
db_exists() {  # vrai si la base $1 existe
    [ "$(docker exec -i "$DOCKER_CONTAINER_NAME" psql -U "$DB_USER" -d postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname='$1';" 2>/dev/null)" = "1" ]
}

# Nettoyage en sortie : fichier temp + base temporaire si le swap n'a PAS eu lieu.
# Note : on ne touche JAMAIS a $OLD_DB ici — en cas d'echec en plein swap, c'est
# la seule copie des donnees live ; elle est supprimee uniquement sur succes.
cleanup() {
    [ -n "$TMP_DUMP" ] && rm -f "$TMP_DUMP"
    rm -f .listing
    if [ "$TMP_DB_CREATED" = "1" ]; then
        terminate_connections "$TMP_DB" 2>/dev/null || true
        docker exec -i "$DOCKER_CONTAINER_NAME" dropdb -U "$DB_USER" "$TMP_DB" --if-exists 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Verification des variables d'environnement
if [ -z "${FTP_LOGIN:-}" ] || [ -z "${FTP_PASSWORD:-}" ]; then
    echo "Erreur : Les variables d'environnement FTP_LOGIN et FTP_PASSWORD doivent etre definies."
    exit 1
fi

# Fonction pour lister les fichiers du repertoire distant (du plus recent au plus ancien)
lister_contenu_ftp() {
    echo "Listing des fichiers dans ftp://$FTP_SERVER$FTP_PATH/ (du plus ancien au plus recent)..." >&2
    rm -f .listing
    wget -q --user="$FTP_LOGIN" --password="$FTP_PASSWORD" \
         --no-remove-listing -O /dev/null "ftp://$FTP_SERVER$FTP_PATH/"

    if [ ! -f .listing ]; then
        echo "Erreur : Impossible de lister le contenu du repertoire." >&2
        exit 1
    fi

    # On extrait le nom des fichiers (.listing au format "ls -l", /^-/ = fichiers
    # uniquement) puis on trie sur la DATE contenue dans le nom — source de verite
    # fiable, contrairement a la date FTP qui ambigue l'annee pour les vieux dumps.
    # Nom = sd-161560-[NNh-]pgsql-dossarddb.YYYYMMDD.sql.bz2
    #   -> decoupage par "." : champ 2 = YYYYMMDD (cle primaire)
    #                          champ 1 = prefixe avec l'heure "NNh" (cle secondaire)
    # Filtre sur la signature d'un dump (YYYYMMDD.sql[.bz2]) : exclut readme.txt et
    # tout autre fichier parasite, et garantit une cle de tri (date) valide.
    # ( || true : ne pas faire echouer le pipeline sous pipefail si aucun dump )
    # gsub(/\r/...) : les lignes FTP se terminent en CRLF -> on retire le \r final,
    # sinon il casse le grep ancre sur "$" et le tri.
    awk '/^-/ && NF >= 9 { nom = $9; for (i = 10; i <= NF; i++) nom = nom " " $i; gsub(/\r/, "", nom); print nom }' .listing \
        | { grep -E '[0-9]{8}\.sql(\.bz2)?$' || true; } \
        | sort -t. -k2,2 -k1,1

    rm -f .listing
}

# Sans argument : lister les backups disponibles
if [ "$#" -eq 0 ]; then
    lister_contenu_ftp
    exit 0
elif [ "$#" -ne 1 ]; then
    echo "Usage: $0 [nom_du_fichier | latest]"
    exit 1
fi

REMOTE_FILE="$1"

# ---------------------------------------------------------------------------
# 1) Selection + validation du fichier distant AVANT toute operation destructive
# ---------------------------------------------------------------------------
DISPOS="$(lister_contenu_ftp)"

if [ "$REMOTE_FILE" = "latest" ]; then
    REMOTE_FILE="$(printf '%s\n' "$DISPOS" | tail -n1)"
    if [ -z "$REMOTE_FILE" ]; then
        echo "Erreur : aucun backup disponible sur le FTP."
        exit 1
    fi
    echo "Dernier dump selectionne : $REMOTE_FILE"
fi

if ! printf '%s\n' "$DISPOS" | grep -Fxq "$REMOTE_FILE"; then
    echo "Erreur : le fichier '$REMOTE_FILE' n'existe pas sur le FTP."
    echo "Backups disponibles :"
    printf '%s\n' "$DISPOS"
    exit 1
fi

# ---------------------------------------------------------------------------
# 2) Telechargement dans un fichier temporaire + validation d'integrite
# ---------------------------------------------------------------------------
TMP_DUMP="$(mktemp /tmp/restore_od.XXXXXX)"
echo "Telechargement de $REMOTE_FILE..."
wget -q --user="$FTP_LOGIN" --password="$FTP_PASSWORD" \
     "ftp://$FTP_SERVER$FTP_PATH/$REMOTE_FILE" -O "$TMP_DUMP"

if [ ! -s "$TMP_DUMP" ]; then
    echo "Erreur : le telechargement de '$REMOTE_FILE' a echoue ou le fichier est vide."
    exit 1
fi

if [[ "$REMOTE_FILE" == *.bz2 ]]; then
    echo "Verification de l'integrite de l'archive bz2..."
    if ! bunzip2 -t "$TMP_DUMP"; then
        echo "Erreur : l'archive '$REMOTE_FILE' est corrompue. Aucune modification de la base."
        exit 1
    fi
fi
echo "Dump valide ($(du -h "$TMP_DUMP" | cut -f1))."

# ---------------------------------------------------------------------------
# 3) Verification du conteneur Docker
# ---------------------------------------------------------------------------
if [ -z "$(docker ps -q -f name="$DOCKER_CONTAINER_NAME")" ]; then
    echo "Erreur : Le conteneur Docker $DOCKER_CONTAINER_NAME n'est pas en cours d'execution."
    exit 1
fi

# ---------------------------------------------------------------------------
# 4) Restauration dans une base TEMPORAIRE — la base live reste 100% intacte
# ---------------------------------------------------------------------------
echo "Preparation de la base temporaire $TMP_DB..."
terminate_connections "$TMP_DB"
docker exec -i "$DOCKER_CONTAINER_NAME" dropdb   -U "$DB_USER" "$TMP_DB" --if-exists
docker exec -i "$DOCKER_CONTAINER_NAME" createdb -U "$DB_USER" "$TMP_DB"
TMP_DB_CREATED=1

echo "Restauration de $REMOTE_FILE dans $TMP_DB..."
# strip_restrict : retire les meta-commandes \restrict / \unrestrict ajoutees par
# les pg_dump recents (securite anti-injection). Necessaire car le psql du conteneur
# de restore est plus ancien et ne les reconnait pas ("invalid command \restrict").
# Sans danger pour un dump de confiance (notre propre backup).
strip_restrict() { sed -e '/^\\restrict /d' -e '/^\\unrestrict /d'; }

if [[ "$REMOTE_FILE" == *.bz2 ]]; then
    bunzip2 -c "$TMP_DUMP" | strip_restrict \
        | docker exec -i "$DOCKER_CONTAINER_NAME" \
            psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$TMP_DB" > /dev/null
else
    strip_restrict < "$TMP_DUMP" \
        | docker exec -i "$DOCKER_CONTAINER_NAME" \
            psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$TMP_DB" > /dev/null
fi

# Reset des sequences DANS la base temporaire (avant le swap)
echo "Reset des sequences PostgreSQL..."
docker exec -i "$DOCKER_CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$TMP_DB" -c "
SELECT setval('user_id_seq', (SELECT COALESCE(MAX(id),1) FROM \"user\"));
SELECT setval('licence_id_seq', (SELECT COALESCE(MAX(id),1) FROM licence));
SELECT setval('club_id_seq', (SELECT COALESCE(MAX(id),1) FROM club));
SELECT setval('competition_id_seq', (SELECT COALESCE(MAX(id),1) FROM competition));
SELECT setval('race_id_seq', (SELECT COALESCE(MAX(id),1) FROM race));
" > /dev/null

# ---------------------------------------------------------------------------
# 5) SWAP ATOMIQUE : la restauration a reussi, on bascule par renommages
#    live -> old  |  tmp -> live  |  drop old
#    Fenetre d'indisponibilite = quelques millisecondes (renommages catalogue).
# ---------------------------------------------------------------------------
echo "Bascule atomique vers $DB_NAME..."
terminate_connections "$TMP_DB"
terminate_connections "$DB_NAME"

# Nettoyage d'un eventuel _old reste d'un run precedent qui aurait plante
docker exec -i "$DOCKER_CONTAINER_NAME" dropdb -U "$DB_USER" "$OLD_DB" --if-exists

# live -> old (seulement si la base live existe deja)
if db_exists "$DB_NAME"; then
    psql_admin -c "ALTER DATABASE \"$DB_NAME\" RENAME TO \"$OLD_DB\";" > /dev/null
fi

# tmp -> live : a partir d'ici la nouvelle base est en place
psql_admin -c "ALTER DATABASE \"$TMP_DB\" RENAME TO \"$DB_NAME\";" > /dev/null
TMP_DB_CREATED=0   # plus de base temporaire a nettoyer

# Suppression de l'ancienne base (le swap a reussi)
docker exec -i "$DOCKER_CONTAINER_NAME" dropdb -U "$DB_USER" "$OLD_DB" --if-exists

echo "Restauration terminee avec succes : $REMOTE_FILE -> $DB_NAME"
