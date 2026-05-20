import { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { X, UploadCloud } from "lucide-react";

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

	const modalContent = useMemo(() => {
		if (mode === "ocr") {
			return {
				title: "OCR Dịch Menu",
				description:
					"Kéo thả ảnh menu để nhận diện chữ và dịch nội dung",
			};
		} else if (mode === "image-search") {
			return {
				title: "Tìm kiếm hình ảnh",
				description: "Kéo thả ảnh để tìm hình tương tự hoặc liên quan",
			};
		} else {
			return {
				title: "Gửi ảnh",
				description: "Kéo thả ảnh để gửi vào khung chat",
			};
		}
	}, [mode]);

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
			setErrorMessage("Không thể tải ảnh lên. Vui lòng thử lại.");
			return;
		}

		switch (firstError.code) {
			case "file-too-large":
				setErrorMessage("Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.");
				break;
			case "file-invalid-type":
				setErrorMessage(
					"Định dạng không hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG hoặc WEBP.",
				);
				break;
			case "too-many-files":
				setErrorMessage("Chỉ được chọn 1 ảnh mỗi lần tải lên.");
				break;
			default:
				setErrorMessage("Tải ảnh thất bại. Vui lòng thử lại.");
		}
	}, []);

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
								Đang tải ảnh lên...
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
									Thả ảnh vào đây
								</p>
							) : (
								<div className="text-center">
									<p className="text-gray-600 font-medium text-lg">
										Kéo thả ảnh vào đây
									</p>
									<p className="text-gray-400 text-base mt-1">
										hoặc click để duyệt file
									</p>
									<p className="text-gray-400 text-sm mt-2">
										Hỗ trợ JPG, JPEG, PNG, WEBP - tối đa 5MB
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
