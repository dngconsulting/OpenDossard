import React, { useLayoutEffect, useState } from 'react';

import { apiChallenge } from '../../util/api';
import { ChallengeDTO } from '../../sdk';
import { Link } from 'react-router-dom';

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

  return (
    <div style={{ marginLeft: 10 }}>
      {isLoading ? (
        <div>Chargement ...</div>
      ) : (
        <>
          <h2> Liste des challenges actifs </h2>
          <div>
            {challenges.map((challenge: ChallengeDTO, index) => {
              return (
                <React.Fragment key={index}>
                  <h2>
                    <Link to={'/challenge/' + challenge.id}>{challenge.name}</Link>
                  </h2>
                  <h3>{challenge.description}</h3>
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
