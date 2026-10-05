/** A file built in memory for setInputFiles(), so tests need no fixture files on disk. */
export type InMemoryFile = { name: string; mimeType: string; buffer: Buffer };
