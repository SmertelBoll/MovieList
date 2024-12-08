import React from "react";
import { Dialog, DialogTitle } from "@mui/material";

function ChangeAvatar({ onClose, open }) {
  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>item under development</DialogTitle>
    </Dialog>
  );
}

export default ChangeAvatar;
