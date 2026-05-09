"use client";

import { useState } from "react";

type Props = {
  src: string | null | undefined;
  alt: string;
  size?: number;
};

export default function ItemImage({ src, alt, size = 56 }: Props) {
  const [failed, setFailed] = useState(false);

  const boxStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "10px",
    border: "1px solid #E5E0D8",
    flexShrink: 0,
    overflow: "hidden",
  };

  const emojiStyle: React.CSSProperties = {
    ...boxStyle,
    background: "#F7F4EF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.45,
  };

  if (!src || failed) {
    return <div style={emojiStyle}>🎁</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{ ...boxStyle, objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
}
