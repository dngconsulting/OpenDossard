import * as React from 'react';

import {Theme, Typography, withStyles} from '@material-ui/core';

interface IEngagementPageProps {
    items: any[];
    classes: any;
}
const styles = (theme : Theme) => ({

});
 class EngagementPage extends React.Component<IEngagementPageProps, {}> {

     public render(): JSX.Element {
         return (
             <Typography noWrap={false} >Engagement</Typography>
         );
     }
}

export default withStyles(styles as any)(EngagementPage);
