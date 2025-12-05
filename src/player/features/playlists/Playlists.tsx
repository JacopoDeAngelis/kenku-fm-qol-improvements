import React, { useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import AddRounded from "@mui/icons-material/AddCircleRounded";
import CreateNewFolderRounded from "@mui/icons-material/CreateNewFolderRounded";
import Tooltip from "@mui/material/Tooltip";
import Backdrop from "@mui/material/Backdrop";
import Back from "@mui/icons-material/ChevronLeftRounded";
import styled from "@mui/material/styles/styled";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { PlaylistItem } from "./PlaylistItem";
import { FolderItem } from "./FolderItem";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { movePlaylist, moveFolder, Track, addPlaylist, addTracks } from "./playlistsSlice";
import { PlaylistAdd } from "./PlaylistAdd";
import { FolderAdd } from "./FolderAdd";
import { SortableItem } from "../../common/SortableItem";
import { useFolderDrop } from "../../common/useFolderDrop";
import { getRandomBackground } from "../../backgrounds";
import { useHideScrollbar } from "../../../renderer/common/useHideScrollbar";
import { useNavigate } from "react-router-dom";

const WallPaper = styled("div")({
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  overflow: "hidden",
  background: "linear-gradient(#2D3143 0%, #1e2231 100%)",
  zIndex: -1,
});

type PlaylistsProps = {
  onPlay: (track: Track) => void;
};

export function Playlists({ onPlay }: PlaylistsProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.playlists);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, keyboardSensor);

  // Get root-level folders (no parent)
  const folders = playlists.folders.allIds
    .filter((id) => !playlists.folders.byId[id].parentId)
    .map((id) => playlists.folders.byId[id]);

  // Get playlists not in any folder
  const rootPlaylists = playlists.playlists.allIds
    .filter((id) => !playlists.playlists.byId[id].folderId)
    .map((id) => playlists.playlists.byId[id]);

  // Helper to count playlists in a folder
  const getPlaylistCountInFolder = (folderId: string) => {
    return playlists.playlists.allIds.filter(
      (id) => playlists.playlists.byId[id].folderId === folderId
    ).length;
  };

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"folder" | "playlist" | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setDragId(id);
    // Determine if dragging a folder or playlist
    if (playlists.folders.byId[id]) {
      setDragType("folder");
    } else {
      setDragType("playlist");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      if (dragType === "folder") {
        dispatch(moveFolder({ active: active.id as string, over: over.id as string }));
      } else {
        dispatch(movePlaylist({ active: active.id as string, over: over.id as string }));
      }
    }

    setDragId(null);
    setDragType(null);
  }

  const [addOpen, setAddOpen] = useState(false);
  const [folderAddOpen, setFolderAddOpen] = useState(false);

  const { dragging, containerListeners, overlayListeners } = useFolderDrop(
    (directories) => {
      for (let directory of Object.values(directories)) {
        const files = directory.audioFiles;
        if (files.length > 0 && directory.path !== "/") {
          const id = uuid();
          dispatch(
            addPlaylist({
              id,
              background: getRandomBackground(),
              title: directory.name,
              tracks: [],
            })
          );
          dispatch(addTracks({ tracks: files, playlistId: id }));
        }
      }
    }
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const hideScrollbar = useHideScrollbar(scrollRef);

  return (
    <>
      <WallPaper />
      <Container
        sx={{
          padding: "0px !important",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
        {...containerListeners}
      >
        <Stack
          p={4}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <IconButton onClick={() => navigate(-1)} sx={{ mr: "40px" }}>
            <Back />
          </IconButton>
          <Typography variant="h3" noWrap>
            Playlists
          </Typography>
          <Stack direction="row">
            <Tooltip title="Add Folder">
              <IconButton onClick={() => setFolderAddOpen(true)}>
                <CreateNewFolderRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Playlist">
              <IconButton onClick={() => setAddOpen(true)}>
                <AddRounded />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Grid
          container
          spacing={2}
          columns={{ xs: 4, sm: 9, md: 12 }}
          sx={{
            px: 2,
            pb: "248px",
            overflowY: "auto",
            maskImage:
              "linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent)",
          }}
          ref={scrollRef}
          {...hideScrollbar}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Folders */}
            <SortableContext items={folders} strategy={rectSortingStrategy}>
              {folders.map((folder) => (
                <Grid item xs={2} sm={3} md={3} key={folder.id}>
                  <SortableItem id={folder.id}>
                    <FolderItem
                      folder={folder}
                      playlistCount={getPlaylistCountInFolder(folder.id)}
                      onSelect={(id) => navigate(`/folders/${id}`)}
                    />
                  </SortableItem>
                </Grid>
              ))}
            </SortableContext>
            {/* Root Playlists (not in any folder) */}
            <SortableContext items={rootPlaylists} strategy={rectSortingStrategy}>
              {rootPlaylists.map((playlist) => (
                <Grid item xs={2} sm={3} md={3} key={playlist.id}>
                  <SortableItem id={playlist.id}>
                    <PlaylistItem
                      playlist={playlist}
                      onSelect={(id) => navigate(`/playlists/${id}`)}
                      onPlay={onPlay}
                    />
                  </SortableItem>
                </Grid>
              ))}
            </SortableContext>
            <DragOverlay>
              {dragId && dragType === "folder" ? (
                <FolderItem
                  folder={playlists.folders.byId[dragId]}
                  playlistCount={getPlaylistCountInFolder(dragId)}
                  onSelect={() => {}}
                />
              ) : dragId && dragType === "playlist" ? (
                <PlaylistItem
                  playlist={playlists.playlists.byId[dragId]}
                  onSelect={() => {}}
                  onPlay={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </Grid>
        <Backdrop
          open={dragging}
          sx={{ zIndex: 100, bgcolor: "rgba(0, 0, 0, 0.8)" }}
          {...overlayListeners}
        >
          <Typography sx={{ pointerEvents: "none" }}>
            Drop the playlists here...
          </Typography>
        </Backdrop>
      </Container>
      <PlaylistAdd open={addOpen} onClose={() => setAddOpen(false)} />
      <FolderAdd open={folderAddOpen} onClose={() => setFolderAddOpen(false)} />
    </>
  );
}
