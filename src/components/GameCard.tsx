"use client";

import parse from "html-react-parser";

type GameCardProps = {
  title: string;
  slug: string;
  content?: string;
};

export default function GameCard({ title, slug, content }: GameCardProps) {
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const match = content?.match(youtubeRegex);
  const videoId = match ? match[1] : null;

  const embeddedVideo = content?.includes("<iframe")
    ? parse(content)
    : videoId ? (
        <iframe
          className="w-full aspect-[9/16] rounded-lg"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : null;

  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-blue-500/30 transition-shadow duration-300 p-4 text-center flex flex-col items-center justify-between">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>

      {embeddedVideo && (
        <div className="w-full overflow-hidden rounded-lg mb-3">
          {embeddedVideo}
        </div>
      )}

      <p className="text-gray-400 text-sm">Slug: {slug}</p>
    </div>
  );
}
