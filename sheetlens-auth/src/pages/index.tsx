import { useEffect } from "react";
import { loadLiveData } from "@/lib/sheetlens-data";

// Inside your HomePage component:
useEffect(() => {
  loadLiveData().catch((e) => console.error("Live load failed:", e));
}, []);