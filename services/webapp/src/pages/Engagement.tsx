import * as React from 'react';


import {Theme, Typography, withStyles} from '@material-ui/core';
import AutocompleteInput from "../components/AutocompleteInput";

interface IEngagementPageProps {
    items: any[];
    classes: any;
}
const styles = (theme : Theme) => ({

});
 class EngagementPage extends React.Component<IEngagementPageProps, {}> {

     public render(): JSX.Element {
         return (
         <div>
             <Typography noWrap={false} >Engagement</Typography>

             <AutocompleteInput/>
         </div>

         );
     }
}

export default withStyles(styles as any)(EngagementPage);
