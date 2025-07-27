import { Box } from '@mui/material';
import React from 'react'
import ContainerCustom from './_customMUI/ContainerCustom';

function Footer() {

  return (
    <Box component="header" bgcolor="bg.second" sx={{ boxShadow: 0 }}>
      <ContainerCustom sx={{ py: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>1</Box>

          <Box>Lyubomyr Sholop</Box>

          <Box>3</Box>
        </Box>


      </ContainerCustom>
    </Box>
  )
}

export default Footer