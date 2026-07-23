import { TableColumn } from "./types";

export const UI_CONVENTIONS: { symbol: string; meaning: string }[] = [
  { symbol: "● (green)", meaning: "Active / Online status / Flows Detected" },
  { symbol: "● (red)", meaning: "Inactive / Offline status / No Flows Detected" },
  { symbol: "● (yellow/amber)", meaning: "Warning / Requires attention" },
  { symbol: "Truncated text (...)", meaning: "Hover over the text cell to view a tooltip with the full, untruncated content" },
  { symbol: "KB / MB / GB", meaning: "Data size units (1 MB = 1,000 KB, 1 GB = 1,000 MB)" },
  { symbol: "Time format WIB/WITA/WIT", meaning: "All timestamps displayed in Indonesia local time zone (Asia/Jakarta, Asia/Makassar, or Asia/Jayapura)" },
  { symbol: "Pagination < 1/N >", meaning: "Page navigation — each page displays a fixed size of 50 rows of data. The sequence index (#) continues across pages (e.g. Page 2 starts at index 51)" },
];
