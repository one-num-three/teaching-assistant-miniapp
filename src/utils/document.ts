export type DocumentType = 'PDF' | 'WORD' | 'PPT';

export function getDocumentType(fileName = '', suppliedType = ''): DocumentType {
  const type = String(suppliedType || '').toUpperCase();
  if (type === 'PDF' || type === 'WORD' || type === 'PPT') return type;
  const extension = String(fileName).split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'PDF';
  if (extension === 'doc' || extension === 'docx') return 'WORD';
  if (extension === 'ppt' || extension === 'pptx') return 'PPT';
  return 'PDF';
}

export function splitPreviewParagraphs(content = '', fallback: string[] = []): string[] {
  const paragraphs = String(content)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return paragraphs.length ? paragraphs : fallback;
}
