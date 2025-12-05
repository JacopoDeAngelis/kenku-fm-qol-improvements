import React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { useDispatch } from "react-redux";
import { editFolder, Folder } from "./playlistsSlice";
import { ImageSelector } from "../../common/ImageSelector";

type FolderSettingsProps = {
  folder: Folder;
  open: boolean;
  onClose: () => void;
};

export function FolderSettings({
  folder,
  open,
  onClose,
}: FolderSettingsProps) {
  const dispatch = useDispatch();

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    dispatch(editFolder({ id: folder.id, title: event.target.value }));
  }

  function handleBackgroundChange(background: string) {
    dispatch(editFolder({ id: folder.id, background }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Folder</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="dense"
            id="name"
            label="Name"
            fullWidth
            variant="standard"
            autoComplete="off"
            InputLabelProps={{
              shrink: true,
            }}
            value={folder.title}
            onChange={handleTitleChange}
          />
          <ImageSelector
            value={folder.background}
            onChange={handleBackgroundChange}
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit">Done</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

