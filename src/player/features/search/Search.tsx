import React, { useMemo, useState, ChangeEvent } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Back from "@mui/icons-material/ChevronLeftRounded";
import SearchIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import styled from "@mui/material/styles/styled";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { RootState } from "../../app/store";
import { backgrounds, isBackground } from "../../backgrounds";
import { Track } from "../playlists/playlistsSlice";

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

interface PlaylistResult {
  id: string;
  title: string;
  background: string;
  trackCount: number;
  path: string;
}

interface TrackResult {
  track: Track;
  playlists: { id: string; title: string; path: string }[];
}

type FolderKind = "playlist" | "soundboard";

interface FolderResult {
  id: string;
  title: string;
  background: string;
  path: string;
  kind: FolderKind;
}

interface SoundboardResult {
  id: string;
  title: string;
  background: string;
  path: string;
}

export function Search() {
  const navigate = useNavigate();
  const playlists = useSelector((state: RootState) => state.playlists);
  const soundboards = useSelector((state: RootState) => state.soundboards);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabValue, setTabValue] = useState(0);

  const getPlaylistPath = (playlistId: string): string => {
    const playlist = playlists.playlists.byId[playlistId];
    if (!playlist) return "";
    const segments: string[] = [];
    let folderId = playlist.folderId;
    while (folderId) {
      const folder = playlists.folders.byId[folderId];
      if (!folder) break;
      segments.push(folder.title);
      folderId = folder.parentId;
    }
    const parts = segments.reverse();
    // Always include the playlist title at the end
    parts.push(playlist.title);
    return `/${parts.join("/")}`;
  };

  const playlistResults = useMemo<PlaylistResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return playlists.playlists.allIds
      .map((id: string) => playlists.playlists.byId[id])
      .filter((playlist) => {
        const titleMatch = playlist.title.toLowerCase().includes(query);
        // Also allow matching by folder path segments
        const pathText = getPlaylistPath(playlist.id).toLowerCase();
        const pathMatch = pathText.includes(query);
        return titleMatch || pathMatch;
      })
      .map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        background: playlist.background,
        trackCount: playlist.tracks.length,
        path: getPlaylistPath(playlist.id),
      }));
  }, [searchQuery, playlists]);

  const trackResults = useMemo<TrackResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const trackMap = new Map<string, TrackResult>();

    // Iterate through all playlists to find tracks matching the query
    for (const playlistId of playlists.playlists.allIds) {
      const playlist = playlists.playlists.byId[playlistId];
      for (const trackId of playlist.tracks) {
        const track = playlists.tracks[trackId];
        if (track && track.title.toLowerCase().includes(query)) {
          if (trackMap.has(trackId)) {
            // Track already found in another playlist, add this playlist to the list
            trackMap.get(trackId)!.playlists.push({
              id: playlist.id,
              title: playlist.title,
              path: getPlaylistPath(playlist.id),
            });
          } else {
            // First occurrence of this track
            trackMap.set(trackId, {
              track,
              playlists: [
                {
                  id: playlist.id,
                  title: playlist.title,
                  path: getPlaylistPath(playlist.id),
                },
              ],
            });
          }
        }
      }
    }

    return Array.from(trackMap.values());
  }, [searchQuery, playlists]);

  // Folder search (playlists folders)
  const getFolderPath = (folderId: string): string => {
    const segments: string[] = [];
    let currentId: string | undefined = folderId;
    while (currentId) {
      const folder = playlists.folders.byId[currentId];
      if (!folder) break;
      segments.push(folder.title);
      currentId = folder.parentId;
    }
    return `/${segments.reverse().join("/")}`;
  };

  const playlistFolderResults = useMemo<FolderResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return playlists.folders.allIds
      .map((id: string) => playlists.folders.byId[id])
      .filter((folder) => {
        const titleMatch = folder.title.toLowerCase().includes(query);
        const pathMatch = getFolderPath(folder.id).toLowerCase().includes(query);
        return titleMatch || pathMatch;
      })
      .map((folder) => ({
        id: folder.id,
        title: folder.title,
        background: folder.background,
        path: getFolderPath(folder.id),
        kind: "playlist" as const,
      }));
  }, [searchQuery, playlists]);

  // Soundboard search
  const getSoundboardPath = (soundboardId: string): string => {
    const sb = soundboards.soundboards.byId[soundboardId];
    if (!sb) return "";
    const segments: string[] = [];
    let folderId = sb.folderId;
    while (folderId) {
      const folder = soundboards.folders.byId[folderId];
      if (!folder) break;
      segments.push(folder.title);
      folderId = folder.parentId;
    }
    const parts = segments.reverse();
    parts.push(sb.title);
    return `/${parts.join("/")}`;
  };

  const soundboardResults = useMemo<SoundboardResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return soundboards.soundboards.allIds
      .map((id: string) => soundboards.soundboards.byId[id])
      .filter((sb) => {
        const titleMatch = sb.title.toLowerCase().includes(query);
        const pathMatch = getSoundboardPath(sb.id).toLowerCase().includes(query);
        return titleMatch || pathMatch;
      })
      .map((sb) => ({
        id: sb.id,
        title: sb.title,
        background: sb.background,
        path: getSoundboardPath(sb.id),
      }));
  }, [searchQuery, soundboards]);

  // Soundboard folders
  const getSoundboardFolderPath = (folderId: string): string => {
    const segments: string[] = [];
    let currentId: string | undefined = folderId;
    while (currentId) {
      const folder = soundboards.folders.byId[currentId];
      if (!folder) break;
      segments.push(folder.title);
      currentId = folder.parentId;
    }
    return `/${segments.reverse().join("/")}`;
  };

  const soundboardFolderResults = useMemo<FolderResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return soundboards.folders.allIds
      .map((id: string) => soundboards.folders.byId[id])
      .filter((folder) => {
        const titleMatch = folder.title.toLowerCase().includes(query);
        const pathMatch = getSoundboardFolderPath(folder.id)
          .toLowerCase()
          .includes(query);
        return titleMatch || pathMatch;
      })
      .map((folder) => ({
        id: folder.id,
        title: folder.title,
        background: folder.background,
        path: getSoundboardFolderPath(folder.id),
        kind: "soundboard" as const,
      }));
  }, [searchQuery, soundboards]);

  // Combined folder results for a single Folders tab
  const folderResults = useMemo<FolderResult[]>(() => {
    if (!searchQuery.trim()) return [];
    return [...playlistFolderResults, ...soundboardFolderResults];
  }, [playlistFolderResults, soundboardFolderResults, searchQuery]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
  };

  const handleTrackClick = (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
  };

  const handleFolderClick = (folder: FolderResult) => {
    if (folder.kind === "playlist") {
      navigate(`/folders/${folder.id}`);
    } else {
      navigate(`/soundboard-folders/${folder.id}`);
    }
  };

  const handleSoundboardClick = (soundboardId: string) => {
    navigate(`/soundboards/${soundboardId}`);
  };

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
            Search
          </Typography>
          <Box sx={{ width: 40 }} />
        </Stack>

        <Box sx={{ px: 4, pb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search playlists, folders, soundboards, or tracks..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
              },
            }}
          />
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 4 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Playlists (${playlistResults.length})`} />
            <Tab label={`Tracks (${trackResults.length})`} />
            <Tab label={`Folders (${folderResults.length})`} />
            <Tab label={`Soundboards (${soundboardResults.length})`} />
          </Tabs>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            pb: "248px",
            maskImage:
              "linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent)",
          }}
        >
          {tabValue === 0 && (
            <List sx={{ maxWidth: 720, margin: "0 auto" }}>
              {playlistResults.length === 0 && searchQuery.trim() && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 4 }}
                >
                  No playlists found
                </Typography>
              )}
              {playlistResults.map((playlist: PlaylistResult) => {
                const image = isBackground(playlist.background)
                  ? backgrounds[playlist.background]
                  : playlist.background;
                return (
                  <ListItem key={playlist.id} disablePadding>
                    <Paper
                      sx={{
                        width: "100%",
                        m: 0.5,
                        backgroundColor: "rgba(34, 38, 57, 0.8)",
                        overflow: "hidden",
                      }}
                    >
                      <ListItemButton
                        onClick={() => handlePlaylistClick(playlist.id)}
                        sx={{ borderRadius: "16px" }}
                      >
                        <Box
                          component="img"
                          src={image}
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1,
                            mr: 2,
                            objectFit: "cover",
                          }}
                        />
                        <ListItemText
                          primary={playlist.title}
                          secondary={`${playlist.path} • ${playlist.trackCount} track${playlist.trackCount !== 1 ? "s" : ""}`}
                        />
                      </ListItemButton>
                    </Paper>
                  </ListItem>
                );
              })}
            </List>
          )}

          {tabValue === 1 && (
            <List sx={{ maxWidth: 720, margin: "0 auto" }}>
              {trackResults.length === 0 && searchQuery.trim() && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 4 }}
                >
                  No tracks found
                </Typography>
              )}
              {trackResults.map((result: TrackResult) => (
                <ListItem key={result.track.id} disablePadding>
                  <Paper
                    sx={{
                      width: "100%",
                      m: 0.5,
                      backgroundColor: "rgba(34, 38, 57, 0.8)",
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {result.track.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Found in:
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                        {result.playlists.map((playlist: { id: string; title: string; path: string }) => (
                          <Paper
                            key={playlist.id}
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              cursor: "pointer",
                              "&:hover": {
                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                              },
                            }}
                            onClick={() => handleTrackClick(playlist.id)}
                          >
                            <Typography variant="body2">
                              {playlist.path}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  </Paper>
                </ListItem>
              ))}
            </List>
          )}

            {tabValue === 2 && (
              <List sx={{ maxWidth: 720, margin: "0 auto" }}>
                {folderResults.length === 0 && searchQuery.trim() && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mt: 4 }}
                  >
                    No folders found
                  </Typography>
                )}
                {folderResults.map((folder: FolderResult) => {
                  const image = isBackground(folder.background)
                    ? backgrounds[folder.background]
                    : folder.background;
                  return (
                    <ListItem key={folder.id} disablePadding>
                      <Paper
                        sx={{
                          width: "100%",
                          m: 0.5,
                          backgroundColor: "rgba(34, 38, 57, 0.8)",
                          overflow: "hidden",
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleFolderClick(folder)}
                          sx={{ borderRadius: "16px" }}
                        >
                          <Box
                            component="img"
                            src={image}
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              mr: 2,
                              objectFit: "cover",
                            }}
                          />
                          <ListItemText
                            primary={folder.title}
                            secondary={`${folder.path} • ${folder.kind === "playlist" ? "Playlist" : "Soundboard"} folder`}
                          />
                        </ListItemButton>
                      </Paper>
                    </ListItem>
                  );
                })}
              </List>
            )}

            {tabValue === 3 && (
              <List sx={{ maxWidth: 720, margin: "0 auto" }}>
                {soundboardResults.length === 0 && searchQuery.trim() && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mt: 4 }}
                  >
                    No soundboards found
                  </Typography>
                )}
                {soundboardResults.map((sb: SoundboardResult) => {
                  const image = isBackground(sb.background)
                    ? backgrounds[sb.background]
                    : sb.background;
                  return (
                    <ListItem key={sb.id} disablePadding>
                      <Paper
                        sx={{
                          width: "100%",
                          m: 0.5,
                          backgroundColor: "rgba(34, 38, 57, 0.8)",
                          overflow: "hidden",
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleSoundboardClick(sb.id)}
                          sx={{ borderRadius: "16px" }}
                        >
                          <Box
                            component="img"
                            src={image}
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              mr: 2,
                              objectFit: "cover",
                            }}
                          />
                          <ListItemText
                            primary={sb.title}
                            secondary={sb.path}
                          />
                        </ListItemButton>
                      </Paper>
                    </ListItem>
                  );
                })}
              </List>
            )}
        </Box>
      </Container>
    </>
  );
}

