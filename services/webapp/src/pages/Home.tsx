import * as React from 'react';
import { useEffect, useState } from 'react';
import { Theme, withStyles } from '@material-ui/core';
import * as Highcharts from 'highcharts';
import { CompetitionEntity, RaceRow } from '../sdk';
import _ from 'lodash';
import HighchartsReact from 'highcharts-react-official';
import { CATEA_FSGT, CATEA_UFOLEP } from '../pages/common/shared-entities';
import { CompetitionFilterPanel } from '../components/CompetitionFilterPanel';
import { LoaderIndicator } from '../components/LoaderIndicator';

interface IDashboardProps {
  classes?: any;
  history: {
    push(url: any): void;
    location: any;
  };
}

const cateLabelFrom = (cate: string) => {
  const catea = CATEA_FSGT.concat(CATEA_UFOLEP).filter(item => item.value.toUpperCase() === cate.toUpperCase())[0];
  return catea === undefined ? cate : catea.label;
};
const HomePage = (props: IDashboardProps) => {
  const { classes } = props;
  const [optionNbRidersChartClub, setOptionNbRidersChartClub] = useState<Highcharts.Options>();
  const [data, setData] = useState<CompetitionEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [raceRows, setRaceRows] = useState<RaceRow[]>([]);
  const [refreshData, setRefreshData] = useState(false);
  const [optionNbRidersChartRiders, setOptionNbRidersChartRiders] = useState<Highcharts.Options>();
  const [optionNbLicencesChartRiders, setOptionNbLicencesChartRiders] = useState<Highcharts.Options>();
  const [optionParCateA, setOptionParCateA] = useState<Highcharts.Options>();
  const fillRiderByCateaChart = (rows: RaceRow[]) => {
    const options: Highcharts.Options = {
      title: {
        text: "Répartition par catégorie d'age"
      },
      xAxis: {
        categories: []
      },
      series: [
        {
          type: 'pie',
          name: 'Taux'
        }
      ]
    };
    const groupByNbRidersByCatea = _.groupBy(rows, (item: RaceRow) => item.catea);
    const cateaNb = Object.keys(groupByNbRidersByCatea).map(item => {
      return {
        name: cateLabelFrom(groupByNbRidersByCatea[item][0].catea),
        y: groupByNbRidersByCatea[item].length
      };
    });
    // @ts-ignore
    options.series[0].data = cateaNb;
    // @ts-ignore
    setOptionParCateA(options);
  };

  const fillRiderParticipationChart = (rows: RaceRow[]) => {
    const options: Highcharts.Options = {
      title: {
        text: 'Nombre de coureurs par course'
      },
      chart: {
        height: 800
      },
      xAxis: {
        categories: [],
        labels: {
          style: {
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            'word-wrap': 'break-word'
          }
        }
      },
      yAxis: {
        title: {
          text: 'nb coureurs'
        }
      },
      series: [
        {
          type: 'column',
          name: 'Nombre de coureurs'
        }
      ]
    };
    const nbRidersByCourse = _.groupBy(rows, (item: RaceRow) => item.competitionId);
    // @ts-ignore
    const allCourses = Object.keys(nbRidersByCourse).map(item => {
      return {
        nb: nbRidersByCourse[item].length,
        name: nbRidersByCourse[item][0].name
      };
    });
    const allCourseOrdered = _.orderBy(allCourses, ['nb'], ['desc']);
    // @ts-ignore
    options.series[0].data = allCourseOrdered.map(item => item.nb);
    // @ts-ignore
    options.xAxis.categories = allCourseOrdered.map(item => item.name);

    setOptionNbRidersChartRiders(options);
  };
  const fillRiderOnlyParticipationChart = (rows: RaceRow[]) => {
    const options: Highcharts.Options = {
      title: {
        text: 'Coureurs les plus assidus'
      },
      xAxis: {
        categories: [],
        max: 19
      },
      yAxis: {
        title: {
          text: 'nb participations'
        }
      },
      series: [
        {
          type: 'column',
          name: 'Participations'
        }
      ]
    };
    const groupByLicenceNumber = _.groupBy(rows, (item: RaceRow) => item.riderName);
    const licenceAndNbPart = Object.keys(groupByLicenceNumber).map(item => {
      return {
        riderName: groupByLicenceNumber[item][0].riderName,
        nb: groupByLicenceNumber[item].length
      };
    });
    const licenceAndNbOrdered = _.orderBy(licenceAndNbPart, ['nb'], ['desc']);
    // @ts-ignore
    options.series[0].data = licenceAndNbOrdered.map(item => item.nb);
    // @ts-ignore
    options.xAxis.categories = licenceAndNbOrdered.map(item => item.riderName);
    setOptionNbLicencesChartRiders(options);
  };

  const fillClubParticipationChart = (rows: RaceRow[]) => {
    const options: Highcharts.Options = {
      title: {
        text: 'Participation des clubs'
      },
      xAxis: {
        categories: [],
        max: 10
      },
      yAxis: {
        title: {
          text: 'nb de participations'
        }
      },
      series: [
        {
          type: 'column',
          name: 'Nombre de participations par club'
        }
      ]
    };
    const riders = _.groupBy(rows, (item: RaceRow) => item.club);
    const clubAndNb = Object.keys(riders).map(item => {
      return { club: riders[item][0].club, nb: riders[item].length };
    });
    const clubAndNbOrdered = _.orderBy(clubAndNb, ['nb'], ['desc']);
    // @ts-ignore
    options.series[0].data = clubAndNbOrdered.map(item => item.nb);
    // @ts-ignore
    options.xAxis.categories = clubAndNbOrdered.map(item => (item.club === '' ? 'Non Licenciés' : item.club));
    setOptionNbRidersChartClub(options);
  };

  useEffect(() => {
    try {
      setLoading(true);
      fillRiderParticipationChart(raceRows);
      fillClubParticipationChart(raceRows);
      fillRiderOnlyParticipationChart(raceRows);
      fillRiderByCateaChart(raceRows);
    } finally {
      setLoading(false);
    }
  }, [raceRows]);

  return (
    <div style={{ padding: 10 }}>
      <LoaderIndicator visible={loading} />
      <CompetitionFilterPanel
        showClubs={true}
        history={props.history}
        refreshData={refreshData}
        setData={setData}
        setRaceRows={setRaceRows}
        setLoading={setLoading}
      />
      {raceRows?.length > 0 ? (
        <div style={{ padding: 0 }}>
          {[optionNbRidersChartRiders, optionNbRidersChartClub, optionParCateA, optionNbLicencesChartRiders].map(
            (item, index) => (
              <React.Fragment key={index}>
                <HighchartsReact highcharts={Highcharts} options={item} />
                <br />
              </React.Fragment>
            )
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          Aucune participation à des épreuves disponible pour les critères de recherche
        </div>
      )}
    </div>
  );
};

const styles = (theme: Theme) => ({
  root: {
    flexGrow: 1,
    marginBottom: 24
  },
  paper: {
    textAlign: 'center',
    color: theme.palette.text.secondary
  },
  headerTiles: {
    overflowX: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRight: `5px solid ${theme.palette.secondary.main}`
  },
  headerTileIcon: {
    fontSize: 40,
    color: theme.palette.primary.main,
    paddingRight: 5
  },
  tileText: {
    fontSize: 20,
    color: theme.palette.grey['400']
  },
  sectionTitle: {
    paddingLeft: theme.spacing(2)
  },

  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap'
  }
});

export default withStyles(styles as any)(HomePage as any) as any;
