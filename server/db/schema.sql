-- 1. Bảng USERS
-- Lưu trữ thông tin người dùng trung tâm
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), 
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng TEAMS (Workspaces)
-- Đây là không gian làm việc chính 
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng TEAM_MEMBERS
-- Quản lý ai thuộc Team nào. Đây là điều kiện tiên quyết để được thêm vào Project.
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id) -- Một người không thể tham gia 1 team 2 lần
);

-- 4. Bảng PROJECTS
-- Nhóm các công việc lại với nhau (VD: Dự án Web App, Chiến dịch Q1)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng PROJECT_MEMBERS 
-- Chỉ định rõ ai được quyền truy cập vào dự án nào.
-- Note: User phải có trong team_members trước thì mới được add vào đây.
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('lead', 'editor', 'viewer')),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- 6. Bảng TASKS
-- Bỏ cột assignee_id vì một task không còn thuộc về duy nhất 1 người nữa
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6.5. Bảng TASK_ASSIGNEES (Quan hệ Nhiều - Nhiều)
-- Bảng này đóng vai trò như danh sách "Những người được chọn"
CREATE TABLE task_assignees (
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Khóa chính phức hợp: Đảm bảo 1 user chỉ được gán vào 1 task 1 lần (tránh trùng lặp)
    PRIMARY KEY (task_id, user_id)
);

-- 7. Bảng CHANNELS (Project-Specific Chat)
-- Hỗ trợ chat nhóm. Có thể chat chung (General) hoặc chat theo dự án.
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Nếu project_id có giá trị: Kênh chat này DÀNH RIÊNG cho Project đó.
    -- Nếu project_id là NULL: Kênh chat này là kênh chung của Team (VD: #general, #random).
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, 
    
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'voice')),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Tên kênh phải duy nhất trong phạm vi 1 team (tránh trùng tên #general)
    UNIQUE(team_id, name) 
);

-- 8. Bảng MESSAGES
-- Nội dung tin nhắn trong các kênh
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT, -- Link ảnh/file nếu có
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Bảng TEAM_INVITATIONS
-- Lưu trữ các lời mời đang chờ xử lý
CREATE TABLE team_invitations (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    inviter_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Ai là người mời
    email VARCHAR(255) NOT NULL, -- Email được mời
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    token VARCHAR(64) UNIQUE NOT NULL, -- Token bảo mật cho link invite
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Đảm bảo không spam invite cùng 1 email trong 1 team
    UNIQUE(team_id, email) 
);

-- Index để tìm kiếm token nhanh khi user click link
CREATE INDEX idx_invitations_token ON team_invitations(token);