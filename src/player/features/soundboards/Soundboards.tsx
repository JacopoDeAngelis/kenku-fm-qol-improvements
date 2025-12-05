import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuid } from "uuid";

import AddRounded from "@mui/icons-material/AddCircleRounded";
import CreateNewFolderRounded from "@mui/icons-material/CreateNewFolderRounded";
import Back from "@mui/icons-material/ChevronLeftRounded";
import Backdrop from "@mui/material/Backdrop";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import styled from "@mui/material/styles/styled";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { useNavigate } from "react-router-dom";
import { useHideScrollbar } from "../../../renderer/common/useHideScrollbar";
import { RootState } from "../../app/store";
import { getRandomBackground } from "../../backgrounds";
import { SortableItem } from "../../common/SortableItem";
import { useFolderDrop } from "../../common/useFolderDrop";
import { SoundboardAdd } from "./SoundboardAdd";
import { SoundboardItem } from "./SoundboardItem";
import { SoundboardFolderAdd } from "./SoundboardFolderAdd";
import { SoundboardFolderItem } from "./SoundboardFolderItem";
import {
  Sound,
  addSoundboard,
  addSounds,
  moveSoundboard,
  moveFolder,
} from "./soundboardsSlice";

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

type SoundboardProps = {
  onPlay: (sound: Sound) => void;
};

export function Soundboards({ onPlay }: SoundboardProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sbState = useSelector((state: RootState) => state.soundboards);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, keyboardSensor);

  // Root-level folders (no parent)
  const folders = sbState.folders.allIds
    .filter((id) => !sbState.folders.byId[id].parentId)
    .map((id) => sbState.folders.byId[id]);

  // Root soundboards (no folder)
  const items = sbState.soundboards.allIds
    .filter((id) => !sbState.soundboards.byId[id].folderId)
    .map((id) => sbState.soundboards.byId[id]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"folder" | "soundboard" | null>(
    null
  );
  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setDragId(id);
    if (sbState.folders.byId[id]) setDragType("folder");
    else setDragType("soundboard");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      if (dragType === "folder") {
        dispatch(
          moveFolder({
            active: active.id as string,
            over: over.id as string,
          })
        );
      } else {
        dispatch(
          moveSoundboard({ active: active.id as string, over: over.id as string })
        );
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
            addSoundboard({
              id,
              background: getRandomBackground(),
              title: directory.name,
              sounds: [],
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
            Soundboards
          </Typography>
          <Stack direction="row">
            <Tooltip title="Add Folder">
              <IconButton onClick={() => setFolderAddOpen(true)}>
                <CreateNewFolderRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Soundboard">
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
                    <SoundboardFolderItem
                      folder={folder}
                      soundboardCount={sbState.soundboards.allIds.filter(
                        (id) => sbState.soundboards.byId[id].folderId === folder.id
                      ).length}
                      onSelect={(id) => navigate(`/soundboard-folders/${id}`)}
                    />
                  </SortableItem>
                </Grid>
              ))}
            </SortableContext>
            {/* Root Soundboards */}
            <SortableContext items={items} strategy={rectSortingStrategy}>
              {items.map((soundboard) => (
                <Grid item xs={2} sm={3} md={3} key={soundboard.id}>
                  <SortableItem id={soundboard.id}>
                    <SoundboardItem
                      soundboard={soundboard}
                      onSelect={(id) => navigate(`/soundboards/${id}`)}
                      onPlay={onPlay}
                    />
                  </SortableItem>
                </Grid>
              ))}
              <DragOverlay>
                {dragId && dragType === "folder" ? (
                  <SoundboardFolderItem
                    folder={sbState.folders.byId[dragId]}
                    soundboardCount={sbState.soundboards.allIds.filter(
                      (id) => sbState.soundboards.byId[id].folderId === dragId
                    ).length}
                    onSelect={() => {}}
                  />
                ) : dragId && dragType === "soundboard" ? (
                  <SoundboardItem
                    soundboard={sbState.soundboards.byId[dragId]}
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
      <SoundboardAdd open={addOpen} onClose={() => setAddOpen(false)} />
      <SoundboardFolderAdd
        open={folderAddOpen}
        onClose={() => setFolderAddOpen(false)}
      />
    </>
  );
}
