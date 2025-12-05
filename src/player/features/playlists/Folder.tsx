import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";

import Add from "@mui/icons-material/AddCircleRounded";
import Back from "@mui/icons-material/ChevronLeftRounded";
import MoreVert from "@mui/icons-material/MoreVertRounded";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

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

import { RootState } from "../../app/store";
import { backgrounds, isBackground, getRandomBackground } from "../../backgrounds";
import { useFolderDrop } from "../../common/useFolderDrop";
import { SortableItem } from "../../common/SortableItem";
import { useHideScrollbar } from "../../../renderer/common/useHideScrollbar";
import { FolderSettings } from "./FolderSettings";
import { PlaylistAdd } from "./PlaylistAdd";
import { PlaylistItem } from "./PlaylistItem";
import {
  removeFolder,
  movePlaylist,
  addPlaylist,
  addTracks,
  Track,
} from "./playlistsSlice";
import { startQueue } from "./playlistPlaybackSlice";

type FolderProps = {
  onPlay: (track: Track) => void;
};

export function Folder({ onPlay }: FolderProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const playlists = useSelector((state: RootState) => state.playlists);
  const { folderId } = useParams();
  const folder = playlists.folders.byId[folderId];

  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Get playlists in this folder
  const folderPlaylists = playlists.playlists.allIds
    .filter((id) => playlists.playlists.byId[id].folderId === folderId)
    .map((id) => playlists.playlists.byId[id]);

  const image = isBackground(folder.background)
    ? backgrounds[folder.background]
    : folder.background;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }
  function handleMenuClose() {
    setAnchorEl(null);
  }

  function handleEdit() {
    setSettingsOpen(true);
    handleMenuClose();
  }

  function handleCopyID() {
    navigator.clipboard.writeText(folder.id);
    handleMenuClose();
  }

  function handleDelete() {
    dispatch(removeFolder(folder.id));
    navigate(-1);
    handleMenuClose();
  }

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const [dragId, setDragId] = useState<string | null>(null);
  function handleDragStart(event: DragStartEvent) {
    setDragId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      dispatch(movePlaylist({ active: active.id as string, over: over.id as string }));
    }
    setDragId(null);
  }

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
              folderId: folder.id,
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
        <Box
          sx={{
            backgroundImage: `url("${image}")`,
            backgroundSize: "cover",
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
            backgroundImage:
              "linear-gradient(0deg, #ffffff44 30%,  #00000088 100%)",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
          }}
        />
        <Stack
          p={4}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ zIndex: 1 }}
        >
          <IconButton onClick={() => navigate(-1)} sx={{ mr: "40px" }}>
            <Back />
          </IconButton>
          <Typography sx={{ zIndex: 1 }} variant="h3" noWrap>
            {folder.title}
          </Typography>
          <Stack direction="row">
            <Tooltip title="Add Playlist">
              <IconButton onClick={() => setAddOpen(true)}>
                <Add />
              </IconButton>
            </Tooltip>
            <IconButton onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
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
            zIndex: 1,
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
            <SortableContext items={folderPlaylists} strategy={rectSortingStrategy}>
              {folderPlaylists.map((playlist) => (
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
              <DragOverlay>
                {dragId ? (
                  <PlaylistItem
                    playlist={playlists.playlists.byId[dragId]}
                    onSelect={() => {}}
                    onPlay={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </SortableContext>
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
      <Menu
        id="folder-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          "aria-labelledby": "more-button",
        }}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleCopyID}>Copy ID</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
      <PlaylistAdd
        open={addOpen}
        onClose={() => setAddOpen(false)}
        folderId={folder.id}
      />
      <FolderSettings
        folder={folder}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}

