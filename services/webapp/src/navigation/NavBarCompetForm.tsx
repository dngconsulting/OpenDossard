
import React, { useState } from 'react';
import { AppBar, Tabs, Tab, Button } from '@material-ui/core';
import LeafletMap from '../components/LeafletMap';
import Editor from 'components/Editor';



const CompetNavBar = () => {
const [value] = useState(2);

  return (
    <div>
      <AppBar position="static">
        <Tabs value={value} aria-label="simple tabs example">
          <Tab label="Item One" />

          <Tab label="Item Two" />
          <Tab label="Item Three" />
        </Tabs>
      </AppBar>

      <LeafletMap />
      <div style={{ width: '700px', left: '100px' }}>
      <Editor/>
      </div>
    </div>
  );
}
export default CompetNavBar;