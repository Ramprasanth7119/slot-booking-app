import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 30,
            height: 30,
            borderRadius: 9,
            overflow: "hidden",
            boxShadow: "0 6px 14px rgba(15, 23, 42, 0.22)",
            background: "linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(226, 232, 240, 0.94) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 11,
              background: "linear-gradient(90deg, #ff5f57 0%, #ff8a3d 35%, #ff3d7f 100%)",
            }}
          />
          {[5, 11, 17, 23].map((left) => (
            <div
              key={left}
              style={{
                position: "absolute",
                top: 3,
                left,
                width: 4,
                height: 9,
                borderRadius: 999,
                background: "rgba(226, 232, 240, 0.95)",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 8,
              top: 17,
              width: 12,
              height: 12,
              borderRadius: 4,
              background: "#1e4e68",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.08) inset",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 14,
              width: 8,
              height: 5,
              borderRadius: 999,
              background: "#4ade80",
              transform: "rotate(45deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 17,
              width: 5,
              height: 12,
              borderRadius: 999,
              background: "#4ade80",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}