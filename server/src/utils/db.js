import postgres from 'postgres';
import dotenv from 'dotenv';

// Load biến môi trường từ file .env
dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Security check: Đảm bảo biến môi trường đã được load
if (!connectionString) {
  throw new Error("FATAL: DATABASE_URL is not defined in .env file");
}

/**
 * Khởi tạo kết nối Database
 * Best Practice:
 * 1. ssl: 'require' -> Bắt buộc với Supabase để mã hóa dữ liệu đường truyền.
 * 2. max: 10 -> Giới hạn số lượng kết nối đồng thời (Connection Pool) để tránh quá tải.
 * 3. idle_timeout -> Đóng kết nối nếu không sử dụng sau X giây để tiết kiệm tài nguyên.
 */
const db = postgres(connectionString, {
  ssl: 'require', 
  max: 10,            
  idle_timeout: 20,   
  connect_timeout: 10, 
});

// Kiểm tra kết nối khi khởi động (Optional but recommended)
// Giúp phát hiện lỗi sai password/host ngay khi chạy server
db`SELECT 1`.then(() => {
    console.log('Database connected successfully to Supabase');
}).catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1); // Dừng app nếu không kết nối được DB
});

export default db;