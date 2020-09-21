


import React, { useState} from 'react';
import {AppBar,Tabs,Tab} from '@material-ui/core';



 const CompetNavBar = () =>{
    const [value]=useState(null);  
  

  return (
    <div>
      <AppBar position="static">
        <Tabs value={value}  aria-label="simple tabs example">
          <Tab label="Item One"  />
          <Tab label="Item Two" />
          <Tab label="Item Three"/>
        </Tabs>
      </AppBar>
     
    </div>
  );
}
export default CompetNavBar;