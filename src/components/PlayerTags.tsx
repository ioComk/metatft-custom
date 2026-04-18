import type { PlayerTag, TagType } from "@/lib/tags";

type Props = {
  tags: PlayerTag[];
};

const tagStyle: Record<TagType, { bg: string; border: string; text: string }> = {
  positive: {
    bg: "rgba(47, 191, 113, 0.12)",
    border: "rgba(47, 191, 113, 0.45)",
    text: "#2fbf71",
  },
  negative: {
    bg: "rgba(255, 93, 93, 0.12)",
    border: "rgba(255, 93, 93, 0.45)",
    text: "#ff7070",
  },
  neutral: {
    bg: "rgba(154, 163, 171, 0.1)",
    border: "rgba(154, 163, 171, 0.3)",
    text: "#9aa3ab",
  },
  unit: {
    bg: "rgba(91, 140, 243, 0.12)",
    border: "rgba(91, 140, 243, 0.45)",
    text: "#7ba8f5",
  },
};

export function PlayerTags({ tags }: Props) {
  if (tags.length === 0) {
    return (
      <p className="text-xs text-neutral-600">
        試合数不足（5試合以上必要）
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const s = tagStyle[tag.type];
        return (
          <span
            key={tag.key}
            title={tag.description}
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              color: s.text,
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 500,
              cursor: "default",
              whiteSpace: "nowrap",
            }}
          >
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}
