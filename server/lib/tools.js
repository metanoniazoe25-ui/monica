import * as spotify from './spotify.js'

export const TOOL_DEFS = [
  {
    name: 'spotify_search',
    description:
      'Search Spotify for a track, artist, or album. Use this to find a Spotify URI before playing something specific.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text, e.g. a song or artist name' },
        type: { type: 'string', enum: ['track', 'artist', 'album'], description: 'Kind of result to search for' },
      },
      required: ['query'],
    },
  },
  {
    name: 'spotify_now_playing',
    description: "Get the track currently playing on the user's Spotify account.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'spotify_play',
    description: 'Resume Spotify playback, or start playing a specific track/album/playlist by URI.',
    parameters: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description:
            'Optional Spotify URI (spotify:track:..., spotify:album:..., spotify:playlist:...) to play. Omit to resume current playback.',
        },
      },
    },
  },
  { name: 'spotify_pause', description: 'Pause Spotify playback.', parameters: { type: 'object', properties: {} } },
  {
    name: 'spotify_next',
    description: 'Skip to the next track on Spotify.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'spotify_previous',
    description: 'Go back to the previous track on Spotify.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'spotify_create_playlist',
    description: 'Create a new private Spotify playlist and optionally add tracks to it by search query.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name for the new playlist' },
        tracks: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of track search queries (e.g. "song by artist") to add',
        },
      },
      required: ['name'],
    },
  },
]

export function anthropicTools() {
  return TOOL_DEFS.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }))
}

export function ollamaTools() {
  return TOOL_DEFS.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
}

export async function executeTool(name, input) {
  switch (name) {
    case 'spotify_search':
      return spotify.search(input.query, input.type || 'track')
    case 'spotify_now_playing':
      return spotify.nowPlaying()
    case 'spotify_play':
      return spotify.play(input.uri)
    case 'spotify_pause':
      return spotify.pause()
    case 'spotify_next':
      return spotify.next()
    case 'spotify_previous':
      return spotify.previous()
    case 'spotify_create_playlist':
      return spotify.createPlaylist(input.name, input.tracks || [])
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
