export function MarkdownRenderer({ content = "" }) {
  const blocks = String(content).split(/\n{2,}/);

  return (
    <div className="space-y-3 text-sm leading-6 text-stone-300">
      {blocks.map((block, index) => {
        if (block.trim().startsWith("- ")) {
          return (
            <ul key={index} className="space-y-1">
              {block.split("\n").map((item) => (
                <li key={item} className="text-stone-400">
                  {item.replace(/^-\s*/, "")}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {block}
          </p>
        );
      })}
    </div>
  );
}
