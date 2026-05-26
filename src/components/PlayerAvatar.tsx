import { useEffect, useMemo, useState } from "react";
import type { Player } from "../types/worldCup";
import { getPlayerPhotoUrl, placeholderAvatarUrl, resolveWikipediaThumbnail } from "../utils/photos";

interface PlayerAvatarProps {
  player: Player;
  alt: string;
  className: string;
  title?: string;
}

const isPlaceholder = (url: string) => url.includes("ui-avatars.com");

export const PlayerAvatar = ({ player, alt, className, title }: PlayerAvatarProps) => {
  const initialPhoto = useMemo(() => getPlayerPhotoUrl(player), [player]);
  const [photoUrl, setPhotoUrl] = useState(initialPhoto);

  useEffect(() => {
    setPhotoUrl(initialPhoto);

    if (!isPlaceholder(initialPhoto)) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);

    void resolveWikipediaThumbnail(player.name, controller.signal).then((resolvedUrl) => {
      if (resolvedUrl && !controller.signal.aborted) {
        setPhotoUrl(resolvedUrl);
      }
    });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [initialPhoto, player.name]);

  return (
    <img
      alt={alt}
      className={className}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = placeholderAvatarUrl(player.name);
      }}
      src={photoUrl}
      title={title}
    />
  );
};
