import React, { useCallback, useEffect, useState } from "react";

import styled from "@mui/material/styles/styled";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/SearchRounded";

import { Routes, Route, useNavigate } from "react-router-dom";

import { Player } from "../features/player/Player";
import { usePlaylistPlayback } from "../features/playlists/usePlaylistPlayback";
import { PlaylistMediaSession } from "../features/playlists/PlaylistMediaSession";
import { PlaylistRemote } from "../features/playlists/PlaylistRemote";
import { PlaylistPlaybackSync } from "../features/playlists/PlaylistPlaybackSync";
import { Playlists } from "../features/playlists/Playlists";
import { Playlist } from "../features/playlists/Playlist";
import { Folder } from "../features/playlists/Folder";

import "../../renderer/app/App.css";
import { Home } from "../features/home/Home";
import { Soundboards } from "../features/soundboards/Soundboards";
import { Soundboard } from "../features/soundboards/Soundboard";
import { SoundboardFolder } from "../features/soundboards/SoundboardFolder";
import { useSoundboardPlayback } from "../features/soundboards/useSoundboardPlayback";
import { SoundboardRemote } from "../features/soundboards/SoundboardRemote";
import { SoundboardPlaybackSync } from "../features/soundboards/SoundboardPlaybackSync";
import { Search } from "../features/search/Search";

const WallPaper = styled("div")({
  position: "fixed",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  overflow: "hidden",
  background: "#1e2231",
  zIndex: -1,
});

export function App() {
  const [errorMessage, setErrorMessage] = useState<string>();
  const navigate = useNavigate();

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  const playlist = usePlaylistPlayback(handleError);
  const soundboard = useSoundboardPlayback(handleError);

  // Allow external windows (renderer) to request navigation (e.g., open Search)
  useEffect(() => {
    const handler = (args: any[]) => {
      const to = args?.[0];
      if (typeof to === "string") {
        navigate(to);
      }
    };
    // @ts-ignore channel is exposed via preload
    window.kenku?.on?.("PLAYER_NAVIGATE", handler);
    return () => {
      // @ts-ignore
      window.kenku?.removeAllListeners?.("PLAYER_NAVIGATE");
    };
  }, [navigate]);

  return (
    <>
      <WallPaper />
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          mt: 2,
        }}
      >
        <Stack direction="row" justifyContent="flex-end" alignItems="center">
          <Tooltip title="Search">
            <IconButton onClick={() => navigate("/search")}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Container>
      <Routes>
        <Route
          path="/"
          element={
            <Home onPlayTrack={playlist.play} onPlaySound={soundboard.play} />
          }
        />
        <Route
          path="playlists"
          element={<Playlists onPlay={playlist.play} />}
        />
        <Route
          path="playlists/:playlistId"
          element={<Playlist onPlay={playlist.play} />}
        />
        <Route
          path="folders/:folderId"
          element={<Folder onPlay={playlist.play} />}
        />
        <Route
          path="soundboards"
          element={<Soundboards onPlay={soundboard.play} />}
        />
        <Route
          path="soundboard-folders/:folderId"
          element={<SoundboardFolder onPlay={soundboard.play} />}
        />
        <Route
          path="soundboards/:soundboardId"
          element={
            <Soundboard onPlay={soundboard.play} onStop={soundboard.stop} />
          }
        />
        <Route
          path="search"
          element={<Search />}
        />
      </Routes>
      <Player
        onPlaylistSeek={playlist.seek}
        onPlaylistNext={playlist.next}
        onPlaylistPrevious={playlist.previous}
        onSoundboardStop={soundboard.stop}
      />
      <PlaylistMediaSession
        onSeek={playlist.seek}
        onNext={playlist.next}
        onPrevious={playlist.previous}
        onStop={playlist.stop}
      />
      <PlaylistRemote
        onPlay={playlist.play}
        onSeek={playlist.seek}
        onNext={playlist.next}
        onPrevious={playlist.previous}
      />
      <PlaylistPlaybackSync
        onMute={playlist.mute}
        onPauseResume={playlist.pauseResume}
        onVolume={playlist.volume}
      />
      <SoundboardRemote onPlay={soundboard.play} onStop={soundboard.stop} />
      <SoundboardPlaybackSync onSync={soundboard.sync} />
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(undefined)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </>
  );
}
