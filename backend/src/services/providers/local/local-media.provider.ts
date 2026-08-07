import { constants as fileSystemConstants } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';

import {
  MediaNamespace,
  MediaObjectReference,
  MediaProvider,
  StoredMediaObject,
  WriteMediaInput,
} from '../media.provider';

const SAFE_KEY_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

/** Private filesystem storage for local/test only. */
export class LocalMediaProvider implements MediaProvider {
  private readonly rootDirectory: string;

  constructor(
    rootDirectory = resolve(process.cwd(), 'infrastructure', 'local-media'),
  ) {
    this.rootDirectory = resolve(rootDirectory);
  }

  async write(input: WriteMediaInput): Promise<StoredMediaObject> {
    const targetPath = this.resolveObjectPath(input);
    try {
      await mkdir(this.rootDirectory, { recursive: true });
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, input.bytes, { flag: 'wx' });
    } catch {
      throw new Error('Local media storage failed.');
    }

    return {
      namespace: input.namespace,
      key: input.key,
      byteLength: input.bytes.byteLength,
      contentType: input.contentType,
    };
  }

  async read(reference: MediaObjectReference): Promise<Buffer> {
    const targetPath = this.resolveObjectPath(reference);
    try {
      await access(targetPath, fileSystemConstants.R_OK);
      return await readFile(targetPath);
    } catch {
      throw new Error('Local media object is unavailable.');
    }
  }

  async delete(reference: MediaObjectReference): Promise<void> {
    const targetPath = this.resolveObjectPath(reference);
    try {
      await rm(targetPath, { force: true });
    } catch {
      throw new Error('Local media deletion failed.');
    }
  }

  private resolveObjectPath(reference: MediaObjectReference): string {
    this.assertNamespace(reference.namespace);
    const segments = reference.key.split('/');
    if (
      segments.length === 0 ||
      segments.some((segment) => !SAFE_KEY_SEGMENT.test(segment))
    ) {
      throw new Error('Invalid local media object reference.');
    }

    const targetPath = resolve(
      this.rootDirectory,
      reference.namespace,
      ...segments,
    );
    const relativePath = relative(this.rootDirectory, targetPath);
    if (
      relativePath === '' ||
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`)
    ) {
      throw new Error('Invalid local media object reference.');
    }

    return targetPath;
  }

  private assertNamespace(namespace: MediaNamespace): void {
    if (
      namespace !== 'listing-media' &&
      namespace !== 'verification-evidence'
    ) {
      throw new Error('Invalid local media namespace.');
    }
  }
}
