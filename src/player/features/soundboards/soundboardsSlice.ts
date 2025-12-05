import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Sound {
  id: string;
  url: string;
  title: string;
  loop: boolean;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export interface Soundboard {
  sounds: string[];
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

export interface SoundboardsState {
  soundboards: {
    byId: Record<string, Soundboard>;
    allIds: string[];
  };
  folders: {
    byId: Record<string, Folder>;
    allIds: string[];
  };
  sounds: Record<string, Sound>;
}

const initialState: SoundboardsState = {
  soundboards: {
    byId: {},
    allIds: [],
  },
  folders: {
    byId: {},
    allIds: [],
  },
  sounds: {},
};

export const soundboardsSlice = createSlice({
  name: "soundboards",
  initialState,
  reducers: {
    addSoundboard: (state, action: PayloadAction<Soundboard>) => {
      state.soundboards.byId[action.payload.id] = action.payload;
      state.soundboards.allIds.push(action.payload.id);
    },
    removeSoundboard: (state, action: PayloadAction<string>) => {
      for (let sound of state.soundboards.byId[action.payload].sounds) {
        delete state.sounds[sound];
      }
      delete state.soundboards.byId[action.payload];
      state.soundboards.allIds = state.soundboards.allIds.filter(
        (id) => id !== action.payload
      );
    },
    editSoundboard: (state, action: PayloadAction<Partial<Soundboard>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editSoundboard payload");
      }
      state.soundboards.byId[action.payload.id] = {
        ...state.soundboards.byId[action.payload.id],
        ...action.payload,
      };
    },
    addSound: (
      state,
      action: PayloadAction<{ sound: Sound; soundboardId: string }>
    ) => {
      const { sound, soundboardId } = action.payload;
      state.soundboards.byId[soundboardId].sounds.unshift(sound.id);
      state.sounds[sound.id] = sound;
    },
    addSounds: (
      state,
      action: PayloadAction<{ sounds: Sound[]; soundboardId: string }>
    ) => {
      const { sounds, soundboardId } = action.payload;
      state.soundboards.byId[soundboardId].sounds.unshift(
        ...sounds.map((sound) => sound.id)
      );
      for (let sound of sounds) {
        state.sounds[sound.id] = sound;
      }
    },
    removeSound: (
      state,
      action: PayloadAction<{ soundId: string; soundboardId: string }>
    ) => {
      const { soundId, soundboardId } = action.payload;
      state.soundboards.byId[soundboardId].sounds = state.soundboards.byId[
        soundboardId
      ].sounds.filter((id) => id !== soundId);
      delete state.sounds[soundId];
    },
    editSound: (state, action: PayloadAction<Partial<Sound>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editSound payload");
      }
      state.sounds[action.payload.id] = {
        ...state.sounds[action.payload.id],
        ...action.payload,
      };
    },
    moveSoundboard: (
      state,
      action: PayloadAction<{ active: string; over: string }>
    ) => {
      const oldIndex = state.soundboards.allIds.indexOf(action.payload.active);
      const newIndex = state.soundboards.allIds.indexOf(action.payload.over);
      state.soundboards.allIds.splice(oldIndex, 1);
      state.soundboards.allIds.splice(newIndex, 0, action.payload.active);
    },
    moveSound: (
      state,
      action: PayloadAction<{
        soundboardId: string;
        active: string;
        over: string;
      }>
    ) => {
      const soundboard = state.soundboards.byId[action.payload.soundboardId];
      const oldIndex = soundboard.sounds.indexOf(action.payload.active);
      const newIndex = soundboard.sounds.indexOf(action.payload.over);
      soundboard.sounds.splice(oldIndex, 1);
      soundboard.sounds.splice(newIndex, 0, action.payload.active);
    },
    // Folder actions
    addFolder: (state, action: PayloadAction<Folder>) => {
      state.folders.byId[action.payload.id] = action.payload;
      state.folders.allIds.push(action.payload.id);
    },
    removeFolder: (state, action: PayloadAction<string>) => {
      // Recursively remove folders and clear folderId on soundboards they contain
      const targetId = action.payload;
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

      // Clear folderId on soundboards inside any of the folders being deleted
      for (const sbId of state.soundboards.allIds) {
        const sb = state.soundboards.byId[sbId];
        if (sb.folderId && toDelete.has(sb.folderId)) {
          sb.folderId = undefined;
        }
      }

      // Delete folders
      for (const id of Array.from(toDelete)) {
        delete state.folders.byId[id];
      }
      state.folders.allIds = state.folders.allIds.filter((id) => !toDelete.has(id));
    },
    editFolder: (state, action: PayloadAction<Partial<Folder>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editFolder payload");
      }
      state.folders.byId[action.payload.id] = {
        ...state.folders.byId[action.payload.id],
        ...action.payload,
      } as Folder;
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
      const isDescendant = (candidateId: string, targetId: string): boolean => {
        if (!candidateId) return false;
        let current = state.folders.byId[candidateId]?.parentId;
        while (current) {
          if (current === targetId) return true;
          current = state.folders.byId[current]?.parentId;
        }
        return false;
      };
      if (parentId === folderId) return;
      if (parentId && isDescendant(parentId, folderId)) return;
      if (state.folders.byId[folderId]) {
        state.folders.byId[folderId].parentId = parentId;
      }
    },
    moveSoundboardToFolder: (
      state,
      action: PayloadAction<{ soundboardId: string; folderId: string | undefined }>
    ) => {
      const { soundboardId, folderId } = action.payload;
      if (state.soundboards.byId[soundboardId]) {
        state.soundboards.byId[soundboardId].folderId = folderId;
      }
    },
  },
});

export const {
  addSoundboard,
  removeSoundboard,
  editSoundboard,
  moveSoundboard,
  addSound,
  addSounds,
  removeSound,
  editSound,
  moveSound,
  addFolder,
  removeFolder,
  editFolder,
  moveFolder,
  moveFolderToFolder,
  moveSoundboardToFolder,
} = soundboardsSlice.actions;

export default soundboardsSlice.reducer;
