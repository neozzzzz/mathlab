import type { CSSProperties, ReactNode } from "react";

export type BoxLineTone = "number" | "answer";

const BOX_COLOR_BY_TONE: Record<BoxLineTone, string> = {
  number: "#d2d2d2",
  answer: "#ebebeb",
};

interface BoxCellProps {
  children?: ReactNode;
  tone?: BoxLineTone;
  width?: string;
  minWidth?: string;
  height?: string;
  minHeight?: string;
  align?: "left" | "center" | "right";
  className?: string;
  style?: CSSProperties;
}

export function BoxCell({
  children,
  tone = "number",
  width,
  minWidth,
  height = "1.55rem",
  minHeight,
  align = "right",
  className = "",
  style,
}: BoxCellProps) {
  const justifyMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{
        position: "relative",
        justifyContent: justifyMap[align],
        width,
        minWidth,
        height,
        minHeight,
        border: `1px solid ${BOX_COLOR_BY_TONE[tone]}`,
        boxSizing: "border-box",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: "#ffffff",
        zIndex: 2,
        ...style,
      }}
    >
      <span style={{ position: "relative", zIndex: 2 }}>{children}</span>
    </span>
  );
}

export function splitToCells(value: number, cellCount = 2): string[] {
  return String(value).padStart(cellCount, " ").split("");
}

export function NumberBoxRowCells({
  value,
  cellCount = 2,
  tone = "number",
  width = "2.2ch",
  answerTone = false,
  className = "",
  style,
}: {
  value: number;
  cellCount?: number;
  tone?: BoxLineTone;
  width?: string;
  answerTone?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const digits = splitToCells(value, cellCount);

  return (
    <>
      {digits.map((digit, idx) => (
        <BoxCell
          key={`${tone}-${value}-${idx}`}
          tone={answerTone ? "answer" : tone}
          width={width}
          style={{
            border: `1px solid ${BOX_COLOR_BY_TONE[answerTone ? "answer" : tone]}`,
            color: digit === " " ? "transparent" : undefined,
            ...style,
          }}
          className={className}
        >
          {digit === " " ? "\u00A0" : digit}
        </BoxCell>
      ))}
    </>
  );
}

export function NumberBox({
  children = null,
  tone = "number",
  width,
  height = "1.55rem",
  className = "",
  style,
  align = "center",
}: {
  children?: ReactNode;
  tone?: BoxLineTone;
  width?: string;
  height?: string;
  className?: string;
  style?: CSSProperties;
  align?: "left" | "center" | "right";
}) {
  return (
    <BoxCell
      tone={tone}
      width={width}
      height={height}
      className={className}
      style={style}
      align={align}
    >
      {children}
    </BoxCell>
  );
}
