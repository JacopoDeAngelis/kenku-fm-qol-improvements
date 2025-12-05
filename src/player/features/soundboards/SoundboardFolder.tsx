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
import { SoundboardAdd } from "./SoundboardAdd";
import { SoundboardFolderAdd } from "./SoundboardFolderAdd";
import { SoundboardFolderSettings } from "./SoundboardFolderSettings";
import { SoundboardFolderItem } from "./SoundboardFolderItem";
import { SoundboardItem } from "./SoundboardItem";
import {
  removeFolder,
  moveSoundboard,
  addSoundboard,
  addSounds,
  Sound,
} from "./soundboardsSlice";
import CreateNewFolderRounded from "@mui/icons-material/CreateNewFolderRounded";

type SoundboardFolderProps = {
  onPlay: (sound: Sound) => void;
};

export function SoundboardFolder({ onPlay }: SoundboardFolderProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const soundboards = useSelector((state: RootState) => state.soundboards);
  const { folderId } = useParams();
  const folder = soundboards.folders.byId[folderId];

  const [addOpen, setAddOpen] = useState(false);
  const [folderAddOpen, setFolderAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Get soundboards in this folder
  const folderSoundboards = soundboards.soundboards.allIds
    .filter((id) => soundboards.soundboards.byId[id].folderId === folderId)
    .map((id) => soundboards.soundboards.byId[id]);

  // Get subfolders in this folder
  const subfolders = soundboards.folders.allIds
    .filter((id) => soundboards.folders.byId[id].parentId === folderId)
    .map((id) => soundboards.folders.byId[id]);

  // Helper to count soundboards directly inside a folder
  const getSoundboardCountInFolder = (id: string) =>
    soundboards.soundboards.allIds.filter(
      (sid) => soundboards.soundboards.byId[sid].folderId === id
    ).length;

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
      dispatch(
        moveSoundboard({ active: active.id as string, over: over.id as string })
      );
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
            addSoundboard({
              id,
              background: getRandomBackground(),
              title: directory.name,
              sounds: [],
              folderId: folder.id,
            })
          );
          dispatch(
            addSounds({
              sounds: files.map((file) => ({
                ...file,
                loop: false,
                volume: 1,
                fadeIn: 100,
                fadeOut: 100,
              })),
              soundboardId: id,
            })
          );
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
            backgroundImage: "linear-gradient(0deg, #ffffff44 30%,  #00000088 100%)",
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
            <Tooltip title="Add Folder">
              <IconButton onClick={() => setFolderAddOpen(true)}>
                  <CreateNewFolderRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Soundboard">
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
            {/* Subfolders */}
            {subfolders.length > 0 && (
              <SortableContext items={subfolders} strategy={rectSortingStrategy}>
                {subfolders.map((sf) => (
                  <Grid item xs={2} sm={3} md={3} key={sf.id}>
                    <SortableItem id={sf.id}>
                      <SoundboardFolderItem
                        folder={sf}
                        soundboardCount={getSoundboardCountInFolder(sf.id)}
                        onSelect={(id) => navigate(`/soundboard-folders/${id}`)}
                      />
                    </SortableItem>
                  </Grid>
                ))}
              </SortableContext>
            )}
            <SortableContext items={folderSoundboards} strategy={rectSortingStrategy}>
              {folderSoundboards.map((sb) => (
                <Grid item xs={2} sm={3} md={3} key={sb.id}>
                  <SortableItem id={sb.id}>
                    <SoundboardItem
                      soundboard={sb}
                      onSelect={(id) => navigate(`/soundboards/${id}`)}
                      onPlay={onPlay}
                    />
                  </SortableItem>
                </Grid>
              ))}
              <DragOverlay>
                {dragId ? (
                  <SoundboardItem
                    soundboard={soundboards.soundboards.byId[dragId]}
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
            Drop the soundboards here...
          </Typography>
        </Backdrop>
      </Container>
      <Menu
        id="soundboard-folder-menu"
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
      <SoundboardAdd
        open={addOpen}
        onClose={() => setAddOpen(false)}
        folderId={folder.id}
      />
      <SoundboardFolderAdd
        open={folderAddOpen}
        onClose={() => setFolderAddOpen(false)}
        parentId={folder.id}
      />
      <SoundboardFolderSettings
        folder={folder}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
