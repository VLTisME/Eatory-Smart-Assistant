"""
extract_dataset.py — Giải nén dataset lớn theo kiểu streaming
================================================================
Giải nén zip lớn theo từng file, tránh MemoryError.
"""

import zipfile
import os
import sys
from pathlib import Path

ARCHIVE_PATH = r"D:\HieuLT\TDTT\Tutorial\kaggle_cache\datasets\nagahuy\tdtt-ver2\1.archive"
OUTPUT_DIR   = r"D:\HieuLT\TDTT\Tutorial\kaggle_cache\datasets\nagahuy\tdtt-ver2\data"

def extract_streaming(archive_path: str, output_dir: str):
    """Giải nén zip lớn theo kiểu streaming, tránh MemoryError."""
    
    if not os.path.exists(archive_path):
        print(f"Không tìm thấy file: {archive_path}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)
    
    size_gb = os.path.getsize(archive_path) / (1024**3)
    print(f"File archive: {size_gb:.2f} GB")
    print(f"Giải nén vào: {output_dir}")
    print(f"Đang giải nén (có thể mất 5-15 phút với file lớn)...\n")

    try:
        with zipfile.ZipFile(archive_path, 'r') as zf:
            entries = zf.infolist()
            total = len(entries)
            print(f"   Tổng số file trong archive: {total:,}\n")
            
            extracted = 0
            errors = 0
            
            for i, entry in enumerate(entries):
                try:
                    zf.extract(entry, output_dir)
                    extracted += 1
                except Exception as e:
                    errors += 1
                    if errors <= 5:
                        print(f"   Lỗi giải nén '{entry.filename}': {e}")
                
                if (i + 1) % 500 == 0 or (i + 1) == total:
                    pct = (i + 1) / total * 100
                    print(f"   [{pct:5.1f}%] {i+1:,}/{total:,} file đã xử lý...", end="\r")
            
            print()
            
    except MemoryError:
        print("\nVẫn bị MemoryError! File zip có quá nhiều entry.")
        print("   Hãy cài 7-Zip rồi chạy lệnh sau trong Terminal:")
        print(f'   "C:\\Program Files\\7-Zip\\7z.exe" x "{archive_path}" -o"{output_dir}"')
        sys.exit(1)
    except zipfile.BadZipFile:
        print("\nFile zip bị hỏng! Cần xóa và tải lại.")
        print(f"   Xóa file: {archive_path}")
        print(f"   Rồi chạy lại: python inspect_kaggle_data.py")
        sys.exit(1)

    print(f"\nGiải nén hoàn tất!")
    print(f"   Thành công: {extracted:,} file")
    if errors:
        print(f"   Lỗi: {errors:,} file")
    print(f"   Dữ liệu nằm tại: {output_dir}\n")

if __name__ == "__main__":
    extract_streaming(ARCHIVE_PATH, OUTPUT_DIR)
