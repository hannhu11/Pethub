import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

type ExportOptions = {
  fileName: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
};

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForAssets(element: HTMLElement) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );

  // QR (SVG) and layout often need one extra paint cycle before capture.
  await delay(80);
}

function triggerDownload(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

async function captureElement(element: HTMLElement, options: ExportOptions) {
  await waitForAssets(element);

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: options.backgroundColor ?? '#1f2327',
    width: options.width,
    height: options.height,
    style:
      options.width || options.height
        ? {
            width: options.width ? `${options.width}px` : undefined,
            height: options.height ? `${options.height}px` : undefined,
          }
        : undefined,
  });

  return dataUrl;
}

export async function downloadElementAsPng(element: HTMLElement, options: ExportOptions) {
  const dataUrl = await captureElement(element, options);
  triggerDownload(dataUrl, options.fileName);
}

export async function downloadElementAsPdf(
  element: HTMLElement,
  options: ExportOptions & { orientation?: 'portrait' | 'landscape' },
) {
  const dataUrl = await captureElement(element, {
    ...options,
    backgroundColor: options.backgroundColor ?? '#ffffff',
  });

  const pdf = new jsPDF({
    orientation: options.orientation ?? 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageProps = pdf.getImageProperties(dataUrl);
  const renderWidth = pageWidth;
  let renderHeight = (imageProps.height * renderWidth) / imageProps.width;

  if (renderHeight > pageHeight) {
    renderHeight = pageHeight;
  }

  pdf.addImage(dataUrl, 'PNG', 0, 0, renderWidth, renderHeight);
  pdf.save(options.fileName);
}

