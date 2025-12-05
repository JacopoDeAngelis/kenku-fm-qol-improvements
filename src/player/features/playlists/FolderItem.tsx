import React from "react";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";
import FolderIcon from "@mui/icons-material/FolderRounded";
import Box from "@mui/material/Box";

import { backgrounds, isBackground } from "../../backgrounds";

import { Folder } from "./playlistsSlice";

type FolderItemProps = {
  folder: Folder;
  playlistCount: number;
  onSelect: (id: string) => void;
};

export function FolderItem({
  folder,
  playlistCount,
  onSelect,
}: FolderItemProps) {
  const image = isBackground(folder.background)
    ? backgrounds[folder.background]
    : folder.background;

  return (
    <Card sx={{ position: "relative" }}>
      <CardActionArea onClick={() => onSelect(folder.id)}>
        <CardMedia
          component="img"
          height="200px"
          image={image}
          alt={"Background"}
          sx={{ pointerEvents: "none" }}
        />
      </CardActionArea>
      <Box
        sx={{
          backgroundImage:
            "linear-gradient(0deg, #00000088 30%, #ffffff44 100%)",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          padding: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "absolute",
          bottom: 0,
          width: "100%",
          pointerEvents: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FolderIcon sx={{ fontSize: "1.5rem" }} />
          <Box>
            <Typography variant="h5" component="div">
              {folder.title}
            </Typography>
            <Typography variant="caption" component="div" sx={{ opacity: 0.7 }}>
              {playlistCount} {playlistCount === 1 ? "playlist" : "playlists"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

