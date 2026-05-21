import { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { X, UploadCloud } from "lucide-react";
import { getOppositeLanguage, useLanguage } from "../../../hooks/useLanguage";

interface ImageUploadModelProps {
	isOpen: boolean;
	onClose: () => void;
	onFileSelected: (file: File) => void;
	mode: "ocr" | "image-search";
	isUploading?: boolean;
}

function ImageUploadModel({
	isOpen,
	onClose,
	onFileSelected,
	mode,
	isUploading = false,
}: ImageUploadModelProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const maxSizeBytes = 5 * 1024 * 1024;
	const { lang } = useLanguage();
	const menuTargetLabel =
		getOppositeLanguage(lang) === "vi" ? "Vietnamese" : "English";
	const text =
		lang === "vi"
			? {
					ocrTitle: "OCR Dịch Menu",
					ocrDescription:
						`Kéo thả ảnh menu để nhận diện chữ và dịch sang tiếng ${
							menuTargetLabel === "English" ? "Anh" : "Việt"
						}`,
					searchTitle: "Tìm kiếm hình ảnh",
					searchDescription:
						"Kéo thả ảnh để tìm hình tương tự hoặc liên quan",
					uploadTitle: "Gửi ảnh",
					uploadDescription: "Kéo thả ảnh để gửi vào khung chat",
					genericError: "Không thể tải ảnh lên. Vui lòng thử lại.",
					fileTooLarge: "Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.",
					invalidType:
						"Định dạng không hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG hoặc WEBP.",
					tooManyFiles: "Chỉ được chọn 1 ảnh mỗi lần tải lên.",
					uploadFailed: "Tải ảnh thất bại. Vui lòng thử lại.",
					uploading: "Đang tải ảnh lên...",
					dropHere: "Thả ảnh vào đây",
					dragHere: "Kéo thả ảnh vào đây",
					browse: "hoặc click để duyệt file",
					support: "Hỗ trợ JPG, JPEG, PNG, WEBP - tối đa 5MB",
				}
			: {
					ocrTitle: "Menu OCR Translation",
					ocrDescription:
						`Drag and drop a menu image to translate it into ${menuTargetLabel}`,
					searchTitle: "Image Search",
					searchDescription:
						"Drag and drop an image to find similar or related places",
					uploadTitle: "Send image",
					uploadDescription: "Drag and drop an image into the chat",
					genericError: "Unable to upload the image. Please try again.",
					fileTooLarge: "The image is too large. Please choose an image under 5MB.",
					invalidType:
						"Unsupported format. Only JPG, JPEG, PNG, or WEBP are accepted.",
					tooManyFiles: "Only one image can be selected at a time.",
					uploadFailed: "Image upload failed. Please try again.",
					uploading: "Uploading image...",
					dropHere: "Drop the image here",
					dragHere: "Drag and drop an image here",
					browse: "or click to browse files",
					support: "Supports JPG, JPEG, PNG, WEBP - max 5MB",
				};

	const modalContent = useMemo(() => {
		if (mode === "ocr") {
			return {
				title: text.ocrTitle,
				description: text.ocrDescription,
			};
		} else if (mode === "image-search") {
			return {
				title: text.searchTitle,
				description: text.searchDescription,
			};
		} else {
			return {
				title: text.uploadTitle,
				description: text.uploadDescription,
			};
		}
	}, [mode, text]);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const selectedFile = acceptedFiles[0];
			if (selectedFile) {
				setErrorMessage(null);
				onFileSelected(selectedFile);
				onClose();
			}
		},
		[onClose, onFileSelected],
	);

	const onDropRejected = useCallback((rejectedFiles: FileRejection[]) => {
		const firstError = rejectedFiles[0]?.errors[0];
		if (!firstError) {
			setErrorMessage(text.genericError);
			return;
		}

		switch (firstError.code) {
			case "file-too-large":
				setErrorMessage(text.fileTooLarge);
				break;
			case "file-invalid-type":
				setErrorMessage(text.invalidType);
				break;
			case "too-many-files":
				setErrorMessage(text.tooManyFiles);
				break;
			default:
				setErrorMessage(text.uploadFailed);
		}
	}, [text]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected,
		accept: {
			"image/jpeg": [".jpg", ".jpeg"],
			"image/png": [".png"],
			"image/webp": [".webp"],
		},
		maxFiles: 1,
		maxSize: maxSizeBytes,
		multiple: false,
	});
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-500/50 backdrop-blur-[1px] transition-all duration-300">
			<div className="relative bg-white rounded-3xl shadow-3xl w-full max-w-4xl max-h-[85vh] p-8 mx-6 animate-slide-up">
				<button
					onClick={() => {
						setErrorMessage(null);
						onClose();
					}}
					className="absolute top-6 right-6 flex items-center justify-center rounded-full w-6 h-6 text-gray-400 hover:text-gray-800 hover:bg-gray-400 cursor-pointer"
				>
					<X size={16} />
				</button>
				<h2 className="text-2xl font-bold text-gray-800 mb-2">
					{modalContent.title}
				</h2>
				<p className="text-gray-500 text-base mb-8">
					{modalContent.description}
				</p>
				<div
					{...getRootProps()}
					className={`border-2 border-dashed rounded-2xl p-16 min-h-96 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
                ${isDragActive ? "border-blue-500 bg-blue-50/80 scale-105 shadow-inner ease-in-out" : "border-gray-300 hover:border-gray-800 hover:bg-gray-300"}
                ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
				>
					<input {...getInputProps()} disabled={isUploading} />

					{isUploading ? (
						<div className="flex flex-col items-center">
							<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
							<p className="text-blue-500 font-medium text-lg">
								{text.uploading}
							</p>
						</div>
					) : (
						<>
							<UploadCloud
								size={64}
								className={`mb-4 transition-colors duration-300 ${isDragActive ? "text-green-500" : "text-gray-400"}`}
							/>
							{isDragActive ? (
								<p className="text-blue-400 font-medium text-xl animate-pulse">
									{text.dropHere}
								</p>
							) : (
								<div className="text-center">
									<p className="text-gray-600 font-medium text-lg">
										{text.dragHere}
									</p>
									<p className="text-gray-400 text-base mt-1">
										{text.browse}
									</p>
									<p className="text-gray-400 text-sm mt-2">
										{text.support}
									</p>
								</div>
							)}
						</>
					)}
				</div>
				{errorMessage ? (
					<p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
						{errorMessage}
					</p>
				) : null}
			</div>
		</div>
	);
}

export default ImageUploadModel;
