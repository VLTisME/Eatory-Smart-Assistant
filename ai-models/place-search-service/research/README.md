# Place Search Research

Thư mục này chứa notebook nghiên cứu/prototype cho CLIP pipeline và image embeddings.

Nội dung ở đây không thuộc runtime FastAPI service. Runtime production nằm trong `../app/`, còn artifact tìm kiếm ảnh hiện vẫn lấy từ root `data/`.

## Quy ước

- Notebook dùng để thử nghiệm model, preprocessing hoặc cách sinh embedding.
- Không import notebook code trực tiếp vào service runtime.
- Không copy checkpoint hoặc artifact lớn vào đây nếu không có lý do rõ ràng.
- Khi một thử nghiệm trở thành production logic, chuyển phần code cần thiết vào `../app/` hoặc script artifact chính thức.

## File hiện tại

- `clip_pipeline.ipynb`: notebook thử nghiệm CLIP/image embedding pipeline.
