import React, { useState } from "react";
import videoFile from "../assets/11218535-hd_1920_1080_30fps.mp4";
import thumbnailImage from "../assets/Suzuki_Ignis_(third_generation)_Facelift_IMG_4450.jpg";

export default function VideoSection(): React.JSX.Element {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div
      className="m-0 h-115 w-full max-w-full overflow-hidden rounded-3xl backdrop-blur-xl"
      style={{
        border: "1px solid var(--panel-border)",
        background: "var(--panel-bg)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      {videoLoaded ? (
        <video
          controls
          autoPlay
          className="block h-full w-full object-contain"
        >
          <source src={videoFile} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div
          onClick={() => setVideoLoaded(true)}
          className="group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden"
        >
          {/* Thumbnail */}
          <img
            src={thumbnailImage}
            alt="Video thumbnail"
            className="absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-105"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/35" />

          {/* Play Button */}
          <div
            className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110"
            style={{
              background: "var(--accent)",
              color: "#0D1F3C",
              boxShadow:
                "0 12px 32px rgba(0, 212, 255, 0.35)",
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              className="fill-current"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}