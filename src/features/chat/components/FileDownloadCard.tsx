import { FILE_CATEGORY, type FileCategory } from "../constants/chat.constants";

interface FileDownloadCardProps {
  fileName: string;
  category: FileCategory | null;
  url?: string | null;
  isOutgoing: boolean;
}

export function FileDownloadCard({
  fileName,
  category,
  url,
  isOutgoing,
}: FileDownloadCardProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[16px] px-3 py-3 ${
        isOutgoing ? "bg-white/15" : "bg-slate-50"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase ${
            isOutgoing
              ? "bg-white/20 text-white"
              : "bg-violet-100 text-[#6D5BFF]"
          }`}
        >
          {fileExtensionLabel(fileName, category)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-all text-[14px] font-medium leading-5">
            {fileName}
          </p>
          <p
            className={`mt-0.5 text-[12px] ${
              isOutgoing ? "text-white/70" : "text-slate-500"
            }`}
          >
            {categoryLabel(category)}
          </p>
        </div>
      </div>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          className={`inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-[13px] font-semibold no-underline ${
            isOutgoing
              ? "bg-white text-[#5B4BFF] hover:bg-white/90"
              : "bg-[#6D5BFF] text-white hover:bg-[#5B4BFF]"
          }`}
        >
          Download
        </a>
      ) : (
        <span
          className={`text-[12px] ${
            isOutgoing ? "text-white/70" : "text-slate-400"
          }`}
        >
          Unavailable
        </span>
      )}
    </div>
  );
}

function categoryLabel(category: FileCategory | null): string {
  if (category === FILE_CATEGORY.video) {
    return "Video";
  }
  if (category === FILE_CATEGORY.document) {
    return "Document";
  }
  return "File";
}

function fileExtensionLabel(
  fileName: string,
  category: FileCategory | null,
): string {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "";
  if (ext && ext.length <= 4) {
    return ext.slice(0, 4);
  }
  if (category === FILE_CATEGORY.video) {
    return "MP4";
  }
  return "FILE";
}
