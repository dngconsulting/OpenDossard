import React, { useLayoutEffect, useState } from 'react';

import { apiChallenge } from '../../util/api';
import { ChallengeDTO } from '../../sdk';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

export const ChallengesPage = (props: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState([]);
  useLayoutEffect(() => {
    const f = async () => {
      try {
        setIsLoading(true);
        const challenges = await apiChallenge.getAllChallenges();
        setChallenges(challenges);
      } finally {
        setIsLoading(false);
      }
    };
    f();
  }, []);

  const card = challenge => (
    <React.Fragment>
      <CardContent>
        <Typography variant="h5" component="div">
          <Link to={'/challenge/' + challenge.id}>{challenge.name}</Link>
        </Typography>
        <Typography variant="body2" style={{ marginTop: 10 }}>
          {challenge.description}
        </Typography>
        <Typography variant="body2" style={{ marginTop: 10 }}>
          Type : {challenge.competitionType}
        </Typography>
        <Typography variant="h6" component="div">
          {challenge.reglement && <a href={challenge.reglement}>Lien vers le règlement</a>}
        </Typography>
      </CardContent>
    </React.Fragment>
  );
  return (
    <div style={{ marginLeft: 10 }}>
      {isLoading ? (
        <div>Chargement ...</div>
      ) : challenges.length > 0 ? (
        <>
          <div style={{ marginTop: 10 }}>
            {challenges.map((challenge: ChallengeDTO, index) => {
              return (
                <Box sx={{ minWidth: 275, marginBottom: 10 }}>
                  <Card variant="outlined">{card(challenge)}</Card>
                </Box>
              );
            })}
          </div>
        </>
      ) : (
        <Typography align={'center'} style={{ marginTop: 50 }} variant={'h5'}>
          Aucun challenge n'est actif
        </Typography>
      )}
    </div>
  );
};
