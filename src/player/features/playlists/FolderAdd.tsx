import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { v4 as uuid } from "uuid";

import { useDispatch } from "react-redux";
import { addFolder } from "./playlistsSlice";

import { backgrounds } from "../../backgrounds";
import { ImageSelector } from "../../common/ImageSelector";

type FolderAddProps = {
  open: boolean;
  onClose: () => void;
  parentId?: string;
};

export function FolderAdd({ open, onClose, parentId }: FolderAddProps) {
  const dispatch = useDispatch();

  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(Object.keys(backgrounds)[0]);

  useEffect(() => {
    if (!open) {
      setTitle("");
    }
  }, [open]);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const id = uuid();
    dispatch(addFolder({ id, title, background, parentId }));
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Folder</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            fullWidth
            variant="standard"
            autoComplete="off"
            InputLabelProps={{
              shrink: true,
            }}
            value={title}
            onChange={handleTitleChange}
          />
          <ImageSelector value={background} onChange={setBackground} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={!title || !background} type="submit">
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

