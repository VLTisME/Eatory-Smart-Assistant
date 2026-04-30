import httpx
import asyncio

# 1. DÁN CÁI WEB API KEY BẠN VỪA COPY VÀO ĐÂY:
API_KEY = "AIzaSyCDlOPMyRSVgSlsVD166A0qB82VVycpagk" 

# 2. ĐIỀN EMAIL VÀ PASSWORD BẠN VỪA TẠO VÀO ĐÂY:
EMAIL = "test@gmail.com"
PASSWORD = "123456"

async def get_token():
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "returnSecureToken": True
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        data = response.json()
        
        if "idToken" in data:
            print("\n✅ LẤY TOKEN THÀNH CÔNG!")
            print("=====================================")
            print(data["idToken"])
            print("=====================================\n")
            print("Hãy copy đoạn mã trên và dán vào nút Authorize trên trang docs nhé!")
        else:
            print("❌ LỖI:", data)

# Chạy thử
asyncio.run(get_token())
