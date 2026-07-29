export interface FAQItem {
  question: string;
  answer: string;
}

export interface TableColumn {
  column: string;
  description: string;
}

export interface PageGuide {
  id: string;
  title: string;
  url: string;
  icon: string;
  summary: string;
  sections: {
    heading: string;
    content?: string;
    steps?: string[];
    columns?: TableColumn[];
    items?: { label: string; description: string }[];
  }[];
}
