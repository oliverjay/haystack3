/**
 * Resize an image file to a small square and return a base64 data URL.
 * Target: 80x80px JPEG at 0.7 quality — typically 2-5KB.
 */
export function resizeImageToDataUrl(file: File, size = 80): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext('2d')!;

				const min = Math.min(img.width, img.height);
				const sx = (img.width - min) / 2;
				const sy = (img.height - min) / 2;
				ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

				resolve(canvas.toDataURL('image/jpeg', 0.7));
			};
			img.onerror = reject;
			img.src = reader.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
