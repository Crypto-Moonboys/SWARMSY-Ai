import { isCanonicalSparkyWorkspace } from "@/utils/sparky";
import {
  useSparkyRecordsSidebar,
  useSourcesSidebar,
} from "../../ChatSidebar";

export default function SparkyRecordsRow({ workspace, onClose }) {
  const { toggleSidebar } = useSparkyRecordsSidebar();
  const { closeSidebar } = useSourcesSidebar();

  if (!isCanonicalSparkyWorkspace(workspace)) return null;

  function handleClick() {
    closeSidebar();
    toggleSidebar();
    onClose();
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-zinc-700 light:hover:bg-slate-200"
    >
      <span className="text-sm font-normal text-white light:text-slate-800">
        SPARKY Records
      </span>
    </div>
  );
}
