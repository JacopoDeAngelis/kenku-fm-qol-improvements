import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Track {
  id: string;
  url: string;
  title: string;
}

export interface Playlist {
  tracks: string[];
  background: string;
  title: string;
  id: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  title: string;
  background: string;
  parentId?: string;
}

export interface PlaylistsState {
  playlists: {
    byId: Record<string, Playlist>;
    allIds: string[];
  };
  folders: {
    byId: Record<string, Folder>;
    allIds: string[];
  };
  tracks: Record<string, Track>;
}

const initialState: PlaylistsState = {
  playlists: {
    byId: {},
    allIds: [],
  },
  folders: {
    byId: {},
    allIds: [],
  },
  tracks: {},
};

export const playlistsSlice = createSlice({
  name: "playlists",
  initialState,
  reducers: {
    addPlaylist: (state, action: PayloadAction<Playlist>) => {
      state.playlists.byId[action.payload.id] = action.payload;
      state.playlists.allIds = [...(state.playlists.allIds ?? []), action.payload.id];
    },
    removePlaylist: (state, action: PayloadAction<string>) => {
      for (let track of state.playlists.byId[action.payload].tracks) {
        delete state.tracks[track];
      }
      delete state.playlists.byId[action.payload];
      state.playlists.allIds = state.playlists.allIds.filter(
        (id) => id !== action.payload
      );
    },
    editPlaylist: (state, action: PayloadAction<Partial<Playlist>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editPlaylist payload");
      }
      state.playlists.byId[action.payload.id] = {
        ...state.playlists.byId[action.payload.id],
        ...action.payload,
      };
    },
    addTrack: (
      state,
      action: PayloadAction<{ track: Track; playlistId: string }>
    ) => {
      const { track, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks.unshift(track.id);
      state.tracks[track.id] = track;
    },
    addTracks: (
      state,
      action: PayloadAction<{ tracks: Track[]; playlistId: string }>
    ) => {
      const { tracks, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks.unshift(
        ...tracks.map((track) => track.id)
      );
      for (let track of tracks) {
        state.tracks[track.id] = track;
      }
    },
    removeTrack: (
      state,
      action: PayloadAction<{ trackId: string; playlistId: string }>
    ) => {
      const { trackId, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks = state.playlists.byId[
        playlistId
      ].tracks.filter((id) => id !== trackId);
      delete state.tracks[trackId];
    },
    editTrack: (state, action: PayloadAction<Partial<Track>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editTrack payload");
      }
      state.tracks[action.payload.id] = {
        ...state.tracks[action.payload.id],
        ...action.payload,
      };
    },
    movePlaylist: (
      state,
      action: PayloadAction<{ active: string; over: string }>
    ) => {
      const oldIndex = state.playlists.allIds.indexOf(action.payload.active);
      const newIndex = state.playlists.allIds.indexOf(action.payload.over);
      state.playlists.allIds.splice(oldIndex, 1);
      state.playlists.allIds.splice(newIndex, 0, action.payload.active);
    },
    moveTrack: (
      state,
      action: PayloadAction<{
        playlistId: string;
        active: string;
        over: string;
      }>
    ) => {
      const playlist = state.playlists.byId[action.payload.playlistId];
      const oldIndex = playlist.tracks.indexOf(action.payload.active);
      const newIndex = playlist.tracks.indexOf(action.payload.over);
      playlist.tracks.splice(oldIndex, 1);
      playlist.tracks.splice(newIndex, 0, action.payload.active);
    },
    // Folder actions
    addFolder: (state, action: PayloadAction<Folder>) => {
      state.folders.byId[action.payload.id] = action.payload;
      state.folders.allIds.push(action.payload.id);
    },
    removeFolder: (state, action: PayloadAction<string>) => {
      // Recursively remove subfolders and clear playlist references
      const targetId = action.payload;

      // Gather all descendant folder ids (including target)
      const toDelete: Set<string> = new Set();
      const visit = (id: string) => {
        toDelete.add(id);
        for (const childId of state.folders.allIds) {
          const child = state.folders.byId[childId];
          if (child && child.parentId === id) {
            visit(childId);
          }
        }
      };
      visit(targetId);

      // Clear folderId on playlists inside any of the folders being deleted
      for (const playlistId of state.playlists.allIds) {
        const pl = state.playlists.byId[playlistId];
        if (pl.folderId && toDelete.has(pl.folderId)) {
          pl.folderId = undefined;
        }
      }

      // Delete folders
      for (const id of Array.from(toDelete)) {
        delete state.folders.byId[id];
      }
      state.folders.allIds = state.folders.allIds.filter(
        (id) => !toDelete.has(id)
      );
    },
    editFolder: (state, action: PayloadAction<Partial<Folder>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editFolder payload");
      }
      state.folders.byId[action.payload.id] = {
        ...state.folders.byId[action.payload.id],
        ...action.payload,
      };
    },
    moveFolder: (
      state,
      action: PayloadAction<{ active: string; over: string }>
    ) => {
      const oldIndex = state.folders.allIds.indexOf(action.payload.active);
      const newIndex = state.folders.allIds.indexOf(action.payload.over);
      state.folders.allIds.splice(oldIndex, 1);
      state.folders.allIds.splice(newIndex, 0, action.payload.active);
    },
    moveFolderToFolder: (
      state,
      action: PayloadAction<{ folderId: string; parentId: string | undefined }>
    ) => {
      const { folderId, parentId } = action.payload;
      // Prevent moving a folder into itself or its descendants
      const isDescendant = (candidateId: string, targetId: string): boolean => {
        if (!candidateId) return false;
        let current = state.folders.byId[candidateId]?.parentId;
        while (current) {
          if (current === targetId) return true;
          current = state.folders.byId[current]?.parentId;
        }
        return false;
      };
      if (parentId === folderId) return; // no-op
      if (parentId && isDescendant(parentId, folderId)) return; // invalid

      if (state.folders.byId[folderId]) {
        state.folders.byId[folderId].parentId = parentId;
      }
    },
    movePlaylistToFolder: (
      state,
      action: PayloadAction<{ playlistId: string; folderId: string | undefined }>
    ) => {
      const { playlistId, folderId } = action.payload;
      state.playlists.byId[playlistId].folderId = folderId;
    },
  },
});

export const {
  addPlaylist,
  removePlaylist,
  editPlaylist,
  movePlaylist,
  addTrack,
  addTracks,
  removeTrack,
  editTrack,
  moveTrack,
  addFolder,
  removeFolder,
  editFolder,
  moveFolder,
  moveFolderToFolder,
  movePlaylistToFolder,
} = playlistsSlice.actions;

export default playlistsSlice.reducer;
