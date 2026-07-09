"use client";

import { useRef, useActionState, useTransition } from "react";
import {
  uploadItemImages,
  deleteItemImage,
  makeMainItemImage,
  type ActionState,
} from "../../actions";

export type PhotoRef = { id: string };

export function ItemPhotos({
  itemId,
  photos,
}: {
  itemId: string;
  photos: PhotoRef[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadWithId = uploadItemImages.bind(null, itemId);
  const [state, formAction, uploading] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await uploadWithId(prev, formData);
      if (result && "success" in result && fileRef.current) {
        fileRef.current.value = "";
      }
      return result;
    },
    null
  );
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {photos.length === 0 ? (
        <p className="mb-3 text-sm text-gray-400">
          No photos yet. The first photo becomes the main image customers see.
        </p>
      ) : (
        <div className="mb-4 flex flex-wrap gap-3">
          {photos.map((photo, i) => (
            <figure key={photo.id} className="w-32">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/images/${photo.id}`}
                  alt=""
                  className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Main
                  </span>
                )}
              </div>
              <figcaption className="mt-1 flex justify-center gap-2">
                {i > 0 && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => makeMainItemImage(photo.id))
                    }
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                  >
                    Make main
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => deleteItemImage(photo.id))
                  }
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          name="files"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          required
          className="text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <span className="text-xs text-gray-400">
          Up to 6 photos, JPEG/PNG/WebP/GIF, max 8 MB each — resized automatically
        </span>
        {state && "error" in state && (
          <p className="w-full text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        {state && "success" in state && (
          <p className="w-full text-sm text-green-600">{state.success}</p>
        )}
      </form>
    </div>
  );
}
